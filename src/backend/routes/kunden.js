const express = require("express");
const router = express.Router();
const { getDb, audit } = require("../db");
const { requireAuth, requireWriteAccess, getBereitschaftCode } = require("../middleware/rbac");

router.use(requireAuth);

// GET all kunden
router.get("/", (req, res) => {
  const bc = getBereitschaftCode(req);
  const isAdmin = req.session.user.rolle === "admin";
  if (isAdmin && req.query.bc === "ALL") {
    res.json(getDb().prepare("SELECT * FROM kunden ORDER BY name").all());
  } else if (isAdmin && req.query.bc) {
    res.json(getDb().prepare("SELECT * FROM kunden WHERE bereitschaft_code = ? ORDER BY name").all(req.query.bc));
  } else {
    res.json(getDb().prepare("SELECT * FROM kunden WHERE bereitschaft_code = ? ORDER BY name").all(bc));
  }
});

// POST create/upsert
router.post("/", requireWriteAccess, (req, res) => {
  const bc = getBereitschaftCode(req);
  const { name, ansprechpartner, telefon, email, rechnungsempfaenger, re_strasse, re_plz_ort, anrede, kundennummer, bemerkung } = req.body;
  if (!name) return res.status(400).json({ error: "Name erforderlich" });

  getDb().prepare(`
    INSERT INTO kunden (bereitschaft_code, name, ansprechpartner, telefon, email, rechnungsempfaenger, re_strasse, re_plz_ort, anrede, kundennummer, bemerkung)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(bereitschaft_code, name) DO UPDATE SET
      ansprechpartner=excluded.ansprechpartner, telefon=excluded.telefon, email=excluded.email,
      rechnungsempfaenger=excluded.rechnungsempfaenger, re_strasse=excluded.re_strasse,
      re_plz_ort=excluded.re_plz_ort, anrede=excluded.anrede, kundennummer=excluded.kundennummer,
      bemerkung=excluded.bemerkung, updated_at=datetime('now')
  `).run(bc, name, ansprechpartner||"", telefon||"", email||"", rechnungsempfaenger||name, re_strasse||"", re_plz_ort||"", anrede||"Sehr geehrte Damen und Herren,", kundennummer||"", bemerkung||"");

  audit(req.session.user, "upsert", "kunde", name, `Bereitschaft: ${bc}`);
  res.json({ success: true });
});

// PUT update
router.put("/:id", requireWriteAccess, (req, res) => {
  const bc = getBereitschaftCode(req);
  const { name, ansprechpartner, telefon, email, rechnungsempfaenger, re_strasse, re_plz_ort, anrede, kundennummer, bemerkung } = req.body;
  if (!name) return res.status(400).json({ error: "Name erforderlich" });

  getDb().prepare(`
    UPDATE kunden SET name=?, ansprechpartner=?, telefon=?, email=?, rechnungsempfaenger=?,
      re_strasse=?, re_plz_ort=?, anrede=?, kundennummer=?, bemerkung=?, updated_at=datetime('now')
    WHERE id=? AND bereitschaft_code=?
  `).run(name, ansprechpartner||"", telefon||"", email||"", rechnungsempfaenger||name, re_strasse||"", re_plz_ort||"", anrede||"Sehr geehrte Damen und Herren,", kundennummer||"", bemerkung||"", req.params.id, bc);

  audit(req.session.user, "update", "kunde", name, `ID: ${req.params.id}`);
  res.json({ success: true });
});

// DELETE
router.delete("/:id", requireWriteAccess, (req, res) => {
  const bc = getBereitschaftCode(req);
  const k = getDb().prepare("SELECT name FROM kunden WHERE id=? AND bereitschaft_code=?").get(req.params.id, bc);
  getDb().prepare("DELETE FROM kunden WHERE id = ? AND bereitschaft_code = ?").run(req.params.id, bc);
  audit(req.session.user, "delete", "kunde", k?.name||req.params.id, `Bereitschaft: ${bc}`);
  res.json({ success: true });
});

// POST CSV import (HiOrg format)
router.post("/import", requireWriteAccess, (req, res) => {
  const bc = getBereitschaftCode(req);
  const { csv } = req.body;
  if (!csv) return res.status(400).json({ error: "CSV-Daten fehlen" });

  const lines = csv.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return res.status(400).json({ error: "CSV leer oder nur Header" });

  const header = lines[0].split(";").map(h => h.trim().toLowerCase());
  const colIdx = (name) => header.findIndex(h => h.includes(name));

  const iKnr = colIdx("kundennummer");
  const iFirma = colIdx("firmenname");
  const iBemerkung = colIdx("bemerkung");
  const iStrasse = colIdx("stra");
  const iHnr = colIdx("hausnummer");
  const iPlz = colIdx("plz");
  const iOrt = colIdx("ort");
  const iTel = colIdx("telefon");
  const iEmail = colIdx("e-mail");
  const iAnrede = colIdx("anrede");
  const iAP = colIdx("ansprechpartner");

  if (iFirma < 0) return res.status(400).json({ error: "Spalte 'Firmenname' nicht gefunden" });

  const stmt = getDb().prepare(`
    INSERT INTO kunden (bereitschaft_code, name, ansprechpartner, telefon, email, rechnungsempfaenger, re_strasse, re_plz_ort, anrede, kundennummer, bemerkung)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(bereitschaft_code, name) DO UPDATE SET
      ansprechpartner=excluded.ansprechpartner, telefon=excluded.telefon, email=excluded.email,
      rechnungsempfaenger=excluded.rechnungsempfaenger, re_strasse=excluded.re_strasse,
      re_plz_ort=excluded.re_plz_ort, anrede=excluded.anrede, kundennummer=excluded.kundennummer,
      bemerkung=excluded.bemerkung, updated_at=datetime('now')
  `);

  let imported = 0, skipped = 0;
  const tx = getDb().transaction(() => {
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(";").map(c => c.trim());
      const firma = cols[iFirma] || "";
      if (!firma) { skipped++; continue; }

      const strasse = [cols[iStrasse]||"", cols[iHnr]||""].filter(Boolean).join(" ").trim();
      const plzOrt = [cols[iPlz]||"", cols[iOrt]||""].filter(Boolean).join(" ").trim();
      const anredeRaw = (cols[iAnrede]||"").trim();
      const ap = (cols[iAP]||"").trim();
      let anrede = "Sehr geehrte Damen und Herren,";
      if (anredeRaw === "Herr" && ap) anrede = `Sehr geehrter Herr ${ap.split(" ").pop()},`;
      else if (anredeRaw === "Frau" && ap) anrede = `Sehr geehrte Frau ${ap.split(" ").pop()},`;

      stmt.run(bc, firma, ap, cols[iTel]||"", cols[iEmail]||"", firma, strasse, plzOrt, anrede, cols[iKnr]||"", cols[iBemerkung]||"");
      imported++;
    }
  });
  tx();

  audit(req.session.user, "csv_import", "kunden", `${imported} importiert`, `Bereitschaft: ${bc}, ${skipped} uebersprungen`);
  res.json({ success: true, imported, skipped });
});

// POST batch delete
router.post("/batch-delete", requireWriteAccess, (req, res) => {
  const bc = getBereitschaftCode(req);
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "Keine IDs angegeben" });
  const isAdmin = req.session.user.rolle === "admin";
  const stmt = isAdmin
    ? getDb().prepare("DELETE FROM kunden WHERE id = ?")
    : getDb().prepare("DELETE FROM kunden WHERE id = ? AND bereitschaft_code = ?");
  let count = 0;
  getDb().transaction(() => {
    for (const id of ids) {
      const r = isAdmin ? stmt.run(id) : stmt.run(id, bc);
      if (r.changes > 0) count++;
    }
  })();
  audit(req.session.user, "batch_delete", "kunden", `${count} gelöscht`, `IDs: ${ids.join(",")}`);
  res.json({ success: true, deleted: count });
});

module.exports = router;
