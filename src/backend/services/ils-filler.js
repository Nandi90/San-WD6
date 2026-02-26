/**
 * ═══════════════════════════════════════════════════════════════════
 * ILS PDF Filler - Füllt das Original ILS-Formular mit pdf-lib
 * ═══════════════════════════════════════════════════════════════════
 * 
 * 33 Felder im Original-PDF:
 *   Organisation, Name, Funktion, Rückrufnummer
 *   Group1 (Radio: Sanitätsdienst/Sicherheitswache/Übung/Sonstiges)
 *   von_Datum, von_Uhrzeit, bis_Datum, bis_Uhrzeit
 *   Strasse, Nr, Objekt, PLZ, Ortsteil, Ort
 *   Name Veranstaltung, EL  Kontaktperson vor Ort,
 *   Erreichbarkeit Telefon, Erreichbarkeit Funkgruppe
 *   Group2 (Radio: JA/NEIN Abkömmlich)
 *   Fahrzeug1-6, Status1-6
 *   Sonstige Hinweise
 */

const { PDFDocument } = require("pdf-lib");
const { getDb } = require("../db");
const fs = require("fs");
const path = require("path");

const DEFAULT_MAPPING = {
  "Organisation": "organisation",
  "Name": "absender_name",
  "Funktion": "absender_funktion",
  "Rückrufnummer": "absender_telefon",
  "von_Datum": "datum_von",
  "von_Uhrzeit": "zeit_von",
  "bis_Datum": "datum_bis",
  "bis_Uhrzeit": "zeit_bis",
  "Strasse": "strasse",
  "Nr": "hausnr",
  "Objekt": "objekt",
  "PLZ": "plz",
  "Ortsteil": "ortsteil",
  "Ort": "ort",
  "Name Veranstaltung": "veranstaltung",
  "EL  Kontaktperson vor Ort": "el_vor_ort",
  "Erreichbarkeit Telefon": "el_telefon",
  "Erreichbarkeit Funkgruppe": "el_funk",
  "Sonstige Hinweise": "sonstige_hinweise",
  "Fahrzeug1": "fzg1_name", "Status1": "fzg1_status",
  "Fahrzeug2": "fzg2_name", "Status2": "fzg2_status",
  "Fahrzeug3": "fzg3_name", "Status3": "fzg3_status",
  "Fahrzeug4": "fzg4_name", "Status4": "fzg4_status",
  "Fahrzeug5": "fzg5_name", "Status5": "fzg5_status",
  "Fahrzeug6": "fzg6_name", "Status6": "fzg6_status",
};

async function fillILS(vorgang, bereitschaft, user) {
  let pdfBytes;
  const tpl = getDb().prepare(
    "SELECT data, field_mapping FROM pdf_templates WHERE type = 'ils' ORDER BY updated_at DESC LIMIT 1"
  ).get();

  if (tpl && tpl.data) {
    pdfBytes = tpl.data;
  } else {
    const fallbackPath = path.join(__dirname, "..", "pdf-templates", "ils-vorlage.pdf");
    if (fs.existsSync(fallbackPath)) {
      pdfBytes = fs.readFileSync(fallbackPath);
    } else {
      throw new Error("Kein ILS-Template vorhanden. Bitte im Admin-Bereich hochladen.");
    }
  }

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const mapping = tpl?.field_mapping ? JSON.parse(tpl.field_mapping) : DEFAULT_MAPPING;

  const event = vorgang.event || {};
  const days = (vorgang.days || []).filter(d => d.active);
  const firstDay = days[0] || {};
  const lastDay = days[days.length - 1] || firstDay;
  const ils = event.ils || {};

  // Datum DD.MM.YYYY formatieren – UTC-sicher (T12:00:00 verhindert Off-by-one)
  const fmtDate = s => {
    if (!s) return "";
    // Nur Datum ohne Zeit? → Mittag anhängen damit Zeitzone keine Rolle spielt
    const iso = /^\d{4}-\d{2}-\d{2}$/.test(s) ? s + "T12:00:00" : s;
    const d = new Date(iso);
    if (isNaN(d)) return s;
    const dd = String(d.getDate()).padStart(2,"0");
    const mm = String(d.getMonth()+1).padStart(2,"0");
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

  // Adresse parsen – Nominatim Formate:
  // MIT Hausnr:  "15, Aichacher Straße, Ortsteil, Stadt, Landkreis, Bayern, 86529, Deutschland"
  // OHNE Hausnr: "Dreiweiherweg, Ortsteil, Stadt, Landkreis, Bayern, 86529, Deutschland"
  const adresse = event.adresse || "";
  let strasseAuto = "", hausnrAuto = "", plzAuto = "", ortAuto = "", ortsteilAuto = "";

  // Gemeinsamer Nominatim-Parser
  const parseNominatim = (parts) => {
    // PLZ finden
    const plzIdx = parts.findIndex(s => /^\d{5}$/.test(s));
    if (plzIdx >= 0) {
      plzAuto = parts[plzIdx];
      const candidates = parts.slice(0, plzIdx).filter(s =>
        !s.match(/^(Landkreis|Bayern|Oberbayern|Schwaben|Franken|Deutschland|Germany)/i)
      );
      ortAuto = candidates[candidates.length - 1] || "";
      ortsteilAuto = candidates.slice(0, -1).join(", ");
    } else {
      const candidates = parts.filter(s =>
        !s.match(/^(Landkreis|Bayern|Oberbayern|Schwaben|Franken|Deutschland|Germany)/i)
      );
      ortAuto = candidates[candidates.length - 1] || "";
    }
  };

  if (adresse) {
    const parts = adresse.split(",").map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      // Erstes Element kann sein:
      // "Dreiweiherweg 8"  → Straße + Hausnummer zusammen (neues DE-Format)
      // "15, Aichacher Straße" → alte Nominatim-Reihenfolge
      // "Dreiweiherweg" → nur Straße ohne Hausnummer
      const first = parts[0];
      if (/^\d+[a-zA-Z]?$/.test(first)) {
        // Altes Format: "15, Aichacher Straße, ..."
        hausnrAuto = first;
        strasseAuto = parts[1];
        parseNominatim(parts.slice(2));
      } else {
        // Neues DE-Format: "Straße 8" oder nur "Straße"
        const m = first.match(/^(.+?)\s+(\d+[a-zA-Z]?)$/);
        if (m) {
          strasseAuto = m[1].trim();
          hausnrAuto = m[2].trim();
        } else {
          strasseAuto = first;
          hausnrAuto = "";
        }
        parseNominatim(parts.slice(1));
      }
    } else {
      // Einzelner Wert: versuche Straße+Hausnr zu trennen
      const m = adresse.match(/^(.+?)\s+(\d+[a-zA-Z]?)(?:\s+(\d{5}))?(?:\s+(.+))?$/);
      if (m) {
        strasseAuto = m[1].trim();
        hausnrAuto = m[2].trim();
        plzAuto = m[3] || "";
        ortAuto = m[4] || event.ort || "";
      } else {
        strasseAuto = adresse;
        ortAuto = event.ort || "";
      }
    }
  }

  // Fallback: PLZ/Ort aus event.ort
  if (!ortAuto) {
    const ortStr = event.ort || "";
    const ortParts = ortStr.trim().split(/\s+/);
    if (/^\d{5}$/.test(ortParts[0])) {
      if (!plzAuto) plzAuto = ortParts[0];
      ortAuto = ortParts.slice(1).join(" ");
    } else {
      ortAuto = ortStr;
    }
  }

  // w3w in sonstige Hinweise
  const w3wHint = event.w3w ? "what3words: ///" + event.w3w : "";
  const sonstige = [event.ilsSonstige || "", w3wHint].filter(Boolean).join("\n");

  // Fahrzeuge aus ILS-Formularfeldern (String "Funkrufname — Status")
  const parseFzg = (s) => {
    if (!s) return { name: "", status: "" };
    const parts = s.split(/[-—–]+/).map(p => p.trim());
    return { name: parts[0] || "", status: parts[1] || "" };
  };

  const data = {
    organisation: "BRK " + (bereitschaft.name || ""),
    absender_name: user?.name || bereitschaft.leiter_name || "",
    absender_funktion: user?.titel || bereitschaft.leiter_title || "Bereitschaftsleiter",
    absender_telefon: (() => {
      const candidates = [user?.mobil, user?.telefon, bereitschaft.mobil, bereitschaft.telefon];
      return candidates.find(v => v && v.trim() && v.trim() !== "-") || "";
    })(),
    datum_von: fmtDate(firstDay.date),
    zeit_von: firstDay.startTime || "",
    datum_bis: fmtDate(lastDay.date || firstDay.date),
    zeit_bis: lastDay.endTime || firstDay.endTime || "",
    strasse: strasseAuto,
    // Direkt eingetragene Hausnummer hat Vorrang
    hausnr: event.hausnr || hausnrAuto,
    objekt: "",
    plz: plzAuto,
    ortsteil: ortsteilAuto,
    ort: ortAuto,
    veranstaltung: event.name || "",
    el_vor_ort: event.ilsEL || "",
    el_telefon: event.ilsTelefon || "",
    el_funk: event.ilsFunk || "",
    sonstige_hinweise: sonstige,
    fzg1_name: parseFzg(event.ilsFzg1).name, fzg1_status: parseFzg(event.ilsFzg1).status,
    fzg2_name: parseFzg(event.ilsFzg2).name, fzg2_status: parseFzg(event.ilsFzg2).status,
    fzg3_name: parseFzg(event.ilsFzg3).name, fzg3_status: parseFzg(event.ilsFzg3).status,
    fzg4_name: "", fzg4_status: "",
    fzg5_name: "", fzg5_status: "",
    fzg6_name: "", fzg6_status: "",
  };

  // Textfelder ausfüllen
  for (const [pdfField, dataKey] of Object.entries(mapping)) {
    const value = data[dataKey] || "";
    if (!value) continue;
    try {
      const field = form.getTextField(pdfField);
      if (field) field.setText(String(value));
    } catch (err) {
      console.warn(`ILS-Feld "${pdfField}": ${err.message}`);
    }
  }

  // Radio: Anmeldeart
  try {
    const group1 = form.getRadioGroup("Group1");
    const opts = group1.getOptions();
    const art = ils.anmeldeArt || "sanitaetsdienst";
    const idx = { sanitaetsdienst: 0, sicherheitswache: 1, uebung: 2, sonstiges: 3 }[art] || 0;
    if (opts[idx]) group1.select(opts[idx]);
  } catch {}

  // Radio: Abkömmlich
  try {
    const group2 = form.getRadioGroup("Group2");
    const opts = group2.getOptions();
    // Standard: NEIN (nicht abkömmlich) = opts[1]
    // Nur JA wenn explizit gesetzt
    if (event.ilsAbkoemmlich === true && opts[0]) group2.select(opts[0]);
    else if (opts[1]) group2.select(opts[1]);
  } catch {}

  return Buffer.from(await pdfDoc.save());
}

async function getILSFields() {
  const tpl = getDb().prepare(
    "SELECT data FROM pdf_templates WHERE type = 'ils' ORDER BY updated_at DESC LIMIT 1"
  ).get();

  let pdfBytes;
  if (tpl?.data) pdfBytes = tpl.data;
  else {
    const fp = path.join(__dirname, "..", "pdf-templates", "ils-vorlage.pdf");
    if (fs.existsSync(fp)) pdfBytes = fs.readFileSync(fp);
    else return [];
  }

  const doc = await PDFDocument.load(pdfBytes);
  const form = doc.getForm();
  return form.getFields().map(f => ({
    name: f.getName(),
    type: f.constructor.name.replace("PDF", "").replace("Field", ""),
    options: f.getOptions?.() || [],
  }));
}

module.exports = { fillILS, getILSFields, DEFAULT_MAPPING };
