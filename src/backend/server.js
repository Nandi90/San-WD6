/**
 * ═══════════════════════════════════════════════════════════════════
 * BRK Sanitätswachdienst v6 — Server
 * ═══════════════════════════════════════════════════════════════════
 */

const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const db = require("./db");
const authRouter = require("./middleware/auth");
const { requireAuth } = require("./middleware/rbac");
const vorgaengeRouter = require("./routes/vorgaenge");
const kundenRouter = require("./routes/kunden");
const stammdatenRouter = require("./routes/stammdaten");
const templatesRouter = require("./routes/templates");
const adminRouter = require("./routes/admin");
const pdfRouter = require("./routes/pdf");
const ilsRouter = require("./routes/ils");
const klauselnRouter = require("./routes/klauseln");


// ═══════════════════════════════════════════════════════════════════
// Persistent Chromium Browser Pool (PDF Performance)
// ═══════════════════════════════════════════════════════════════════
const BrowserPool = (() => {
  let _browser = null;
  let _launching = null;
  const CHROMIUM = process.env.CHROMIUM_PATH || "/usr/bin/chromium-browser";
  const ARGS = ["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--disable-gpu","--disable-extensions","--disable-translate"];

  async function get() {
    if (_browser && _browser.isConnected()) return _browser;
    if (_launching) return _launching;
    _launching = (async () => {
      const puppeteer = require("puppeteer-core");
      _browser = await puppeteer.launch({ executablePath: CHROMIUM, args: ARGS, headless: true });
      _browser.on("disconnected", () => { _browser = null; });
      console.log("🖨️ Chromium Browser gestartet (persistent)");
      return _browser;
    })();
    const b = await _launching;
    _launching = null;
    return b;
  }

  async function renderPDF(html, opts = {}) {
    const browser = await get();
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: "domcontentloaded" });
      const pdf = await page.pdf({
        format: "A4",
        margin: { top: opts.marginTop || "15mm", right: "12mm", bottom: "20mm", left: opts.marginLeft || "12mm" },
        displayHeaderFooter: true,
        headerTemplate: opts.header || "<span></span>",
        footerTemplate: opts.footer || "<span></span>",
        printBackground: true
      });
      return pdf;
    } finally {
      await page.close();
    }
  }

  // Graceful shutdown
  process.on("SIGTERM", async () => { if (_browser) await _browser.close(); });
  process.on("SIGINT", async () => { if (_browser) await _browser.close(); });

  return { get, renderPDF };
})();

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────
app.set("trust proxy", 1);
const nextcloud = require("./services/nextcloud");
const smtp = require("./services/smtp");

// Non-blocking Nextcloud Auto-Upload nach PDF-Generierung
function ncAutoUpload(req, vorgangId, filename, pdfBuffer, stamm) {
  if (!nextcloud.isConfigured()) return;
  setImmediate(async () => {
    try {
      const db = require("./db").getDb();
      const row = db.prepare("SELECT data, bereitschaft_code FROM vorgaenge WHERE id=?").get(vorgangId);
      if (!row) return;
      const vorgang = JSON.parse(row.data);
      vorgang.bereitschaft_code = row.bereitschaft_code;
      const st = stamm || db.prepare("SELECT * FROM bereitschaften WHERE code=?").get(row.bereitschaft_code) || {};
      const result = await nextcloud.syncVorgang(req.session, vorgang, [{ filename, data: pdfBuffer }], st);
      if (result.success) {
        const d = JSON.parse(row.data);
        d.nextcloudSync = { syncedAt: result.syncedAt, folder: result.folder, files: result.results.map(r=>r.file), syncedBy: req.session.user?.name };
        db.prepare("UPDATE vorgaenge SET data = ? WHERE id = ?").run(JSON.stringify(d), vorgangId);
        console.log(`Nextcloud Auto-Sync: ${filename} OK`);
      }
    } catch(e) { console.error("Nextcloud Auto-Sync:", e.message); }
  });
}
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://*.tile.openstreetmap.org", "https://unpkg.com", "https://sgx.geodatenzentrum.de", "https://geoservices.bayern.de"],
      connectSrc: ["'self'", "https://geocode.search.hereapi.com", "https://nominatim.openstreetmap.org", "https://api.what3words.com", "https://sgx.geodatenzentrum.de", "https://geoservices.bayern.de"],
      fontSrc: ["'self'", "https://unpkg.com", "https://fonts.gstatic.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
    }
  }
}));
app.use(cors({
  origin: (() => {
    if (!process.env.APP_URL) {
      console.error("FATAL: APP_URL nicht gesetzt");
      process.exit(1);
    }
    return process.env.APP_URL;
  })(),
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("short"));

// ── Rate-Limiting (Security F-010) ───────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Zu viele Anfragen. Bitte warten." }
});
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Zu viele Login-Versuche. Bitte 1 Minute warten."
});
const pdfLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Zu viele PDF-Anfragen. Bitte warten." }
});
app.use("/auth/login", authLimiter);
app.use("/auth/emergency", authLimiter);
app.use("/auth/emergency-login", authLimiter);
app.use("/api/pdf", pdfLimiter);
app.use("/api/", apiLimiter);

// ── Sessions (persistenter SQLite-Store) ──────────────────────────
const SqliteStore = require("better-sqlite3-session-store")(session);
const sessionDb = new (require("better-sqlite3"))(
  process.env.SESSION_DB_PATH || "/data/sessions.db"
);
app.use(session({
  store: new SqliteStore({ client: sessionDb, expired: { clear: true, intervalMs: 900000 } }),
  secret: (() => {
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
      console.error("FATAL: SESSION_SECRET nicht gesetzt oder zu kurz (min. 32 Zeichen)");
      process.exit(1);
    }
    return process.env.SESSION_SECRET;
  })(),
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: "lax",
  },
}));
console.log("✅ Session-Store: SQLite (" + (process.env.SESSION_DB_PATH || "/data/sessions.db") + ")");

// ── Health Check (kein Auth) ─────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════
// Statistik API
// ═══════════════════════════════════════════════════════════════════
app.get("/api/statistik/:year", requireAuth, (req, res) => {
  try {
    const db = require("./db").getDb();
    const year = parseInt(req.params.year);
    const bc = req.query.bc || "ALL";
    
    let rows;
    if (bc === "ALL" && (req.session.user.rolle === "admin" || req.session.user.rolle === "kbl")) {
      rows = db.prepare("SELECT id, bereitschaft_code, data, status, created_at FROM vorgaenge WHERE year=? AND deleted_at IS NULL").all(year);
    } else {
      const code = bc !== "ALL" ? bc : req.session.user.bereitschaftCode;
      rows = db.prepare("SELECT id, bereitschaft_code, data, status, created_at FROM vorgaenge WHERE year=? AND bereitschaft_code=? AND deleted_at IS NULL").all(year, code);
    }

    const bereitschaften = db.prepare("SELECT code, name, short FROM bereitschaften").all();
    const bcMap = {};
    bereitschaften.forEach(b => bcMap[b.code] = b);

    let totalUmsatz = 0, totalEinsaetze = rows.length, totalHelferStd = 0, totalPatienten = 0, totalTransporte = 0;
    const byBc = {}, byMonth = Array(12).fill(null).map(() => ({ count: 0, umsatz: 0 }));
    const byStatus = {};
    const events = [];

    for (const row of rows) {
      const d = JSON.parse(row.data);
      const ev = d.event || d;
      const days = d.days || [];
      const activeDays = days.filter(dy => dy.active !== false);

      // Status
      const st = ev.checklist?.angebotAbgelehnt ? "abgelehnt" : ev.checklist?.abgeschlossen ? "abgeschlossen" : ev.checklist?.angebotVersendet ? "versendet" : (ev.checklist?.angebotAkzeptiert ? "akzeptiert" : "entwurf");
      byStatus[st] = (byStatus[st] || 0) + 1;

      // Monat
      const firstDate = activeDays.find(dy => dy.date)?.date;
      if (firstDate) {
        const m = new Date(firstDate).getMonth();
        if (m >= 0 && m < 12) {
          byMonth[m].count++;
        }
      }

      // BC
      const bc = row.bereitschaft_code;
      if (!byBc[bc]) byBc[bc] = { code: bc, name: bcMap[bc]?.name || bc, short: bcMap[bc]?.short || bc, count: 0, umsatz: 0, helferStd: 0 };
      byBc[bc].count++;

      // Protokoll-Zahlen
      const protokoll = d.protokoll || {};
      for (const key of Object.keys(protokoll)) {
        const p = protokoll[key];
        if (p) {
          totalPatienten += (p.behandelt || 0) + (p.bagatelle || 0) + (p.transporte || 0);
          totalTransporte += (p.transporte || 0);
        }
      }

      events.push({
        id: row.id, bc, name: ev.name || "", auftragsnr: ev.auftragsnr || "",
        ort: ev.ort || "", status: st, date: firstDate || "",
        days: activeDays.length, veranstalter: ev.veranstalter || ""
      });
    }

    res.json({
      year, totalEinsaetze, totalUmsatz, totalHelferStd, totalPatienten, totalTransporte,
      byBc: Object.values(byBc),
      byMonth,
      byStatus,
      events,
      bereitschaften
    });
  } catch(e) {
    console.error("Statistik:", e);
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// Einsatzprotokoll: Live-Daten speichern
// ═══════════════════════════════════════════════════════════════════
app.get("/api/protokoll/:id", requireAuth, (req, res) => {
  try {
    const db = require("./db").getDb();
    const row = db.prepare("SELECT data FROM vorgaenge WHERE id=?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Nicht gefunden" });
    const d = JSON.parse(row.data);
    res.json({ protokoll: d.protokoll || {} });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/protokoll/:id", requireAuth, (req, res) => {
  try {
    const db = require("./db").getDb();
    const row = db.prepare("SELECT data FROM vorgaenge WHERE id=?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Nicht gefunden" });
    const d = JSON.parse(row.data);
    const { dayIdx, protokoll } = req.body;
    if (!d.protokoll) d.protokoll = {};
    d.protokoll[String(dayIdx)] = { ...protokoll, updatedAt: new Date().toISOString(), updatedBy: req.session.user.name };
    db.prepare("UPDATE vorgaenge SET data=?, updated_at=datetime('now') WHERE id=?").run(JSON.stringify(d), req.params.id);
    require("./db").audit(req.session.user, "protokoll_update", "vorgang", req.params.id, `Tag ${dayIdx}`);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", version: "6.0.0", timestamp: new Date().toISOString() });
});

// ── Auth Routes (kein Auth nötig) ────────────────────────────────

// === Public Anfrage-Formular (kein Auth) ===
// PLZ → Bereitschaft Zuordnung (Landkreis Neuburg-Schrobenhausen)
const PLZ_BC_MAP = {
  "85123": "BKK",     // Karlskron
  "86529": "BSOB",    // Schrobenhausen
  "86561": "BSOB",    // Aresing
  "86562": "BSOB",    // Berg im Gau
  "86564": "BSOB",    // Brunnen
  "86565": "BSOB",    // Gachenbach
  "86571": "BSOB",    // Langenmosen
  "86579": "BSOB",    // Waidhofen
  "86633": "BND",     // Neuburg an der Donau
  "86643": "BND",     // Rennertshofen
  "86666": "BBGH",    // Burgheim
  "86668": "BKAHU",   // Karlshuld
  "86669": "BKAHU",   // Königsmoos
  "86673": "BND",     // Bergheim
  "86676": "BND",     // Ehekirchen
  "86697": "BND",     // Oberhausen
  "86701": "BND",     // Rohrenfels
  "86706": "BWEIG",   // Weichering
};

// API: PLZ → BC Lookup (für Live-Vorschlag im Formular)
app.get("/api/plz-bc", (req, res) => {
  const plz = (req.query.plz || "").trim();
  const bc = PLZ_BC_MAP[plz] || null;
  const bereitschaft = bc ? (db.getDb().prepare("SELECT name FROM bereitschaften WHERE code=?").get(bc)?.name || bc) : null;
  res.json({ plz, bc, bereitschaft });
});

app.get("/anfrage", (req, res) => {
  const embed = req.query.embed === "1";
  // CSP Override: Inline-Script erlauben + frame-ancestors für Einbettung
  const framePolicy = embed
    ? "frame-ancestors 'self' https://www.kvndsob.brk.de https://kvndsob.brk.de"
    : "frame-ancestors 'self'";
  res.setHeader("Content-Security-Policy", `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; ${framePolicy}; object-src 'none'`);
  if (embed) res.removeHeader("X-Frame-Options");
  const stamm = db.getDb().prepare("SELECT * FROM bereitschaften LIMIT 1").get() || {};
  const ROT = "#E60005";
  const BLAU = "#002F5F";
  const kvName = stamm.kv_name || "BRK Kreisverband Neuburg-Schrobenhausen";
  const fertigUrl = stamm.fertig_url || "https://www.kvndsob.brk.de/ehrenamt.html";
  const dsUrl = stamm.datenschutz_url || "https://www.kvndsob.brk.de/footer-menue-deutsch/service/datenschutz-1.html";
  let logoTag = '<svg width="48" height="48" viewBox="0 0 100 100" fill="none"><rect x="35" y="5" width="30" height="90" rx="2" fill="' + ROT + '"/><rect x="5" y="35" width="90" height="30" rx="2" fill="' + ROT + '"/></svg>';
  if (stamm.logo) {
    try {
      const b64 = Buffer.from(stamm.logo).toString("base64");
      logoTag = '<img src="data:image/png;base64,' + b64 + '" style="height:56px;width:auto">';
    } catch(e) {}
  }
  res.send(`<!DOCTYPE html><html lang="de"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sanit\u00e4tswachdienst anfragen \u2013 ${kvName}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:${embed ? "transparent" : "#f5f5f0"};color:#1a1a1a;line-height:1.5}
.ctn{max-width:680px;margin:0 auto;padding:${embed ? "0" : "0 16px"}}
.card{background:#fff;border-radius:8px;border:1px solid #ddd;padding:24px 28px;margin-bottom:16px;box-shadow:0 1px 4px #0001}
.hdr{background:#fff;padding:24px 28px 18px;border-radius:8px 8px 0 0;border:1px solid #ddd;border-bottom:none;display:flex;align-items:center;gap:18px;margin-top:20px}
.hdr-text{flex:1}
.hdr-org{font-size:13px;color:#555;margin-bottom:2px}
.hdr-title{font-size:20px;font-weight:700;color:${BLAU}}
.hdr-accent{height:4px;background:${ROT};border-radius:0}
.sub{background:#fff;padding:14px 28px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px;margin-bottom:20px;font-size:13px;color:#555}
label{display:block;margin-bottom:12px}
label>span{display:block;font-size:12px;font-weight:600;color:#444;margin-bottom:3px}
label>span.req::after{content:" *";color:${ROT}}
input,textarea,select{width:100%;padding:9px 12px;border:1px solid #ccc;border-radius:4px;font-size:14px;font-family:inherit}
input:focus,textarea:focus{outline:none;border-color:#004B91;box-shadow:0 0 0 2px #004B9130}
textarea{resize:vertical;min-height:80px}
.row{display:grid;grid-template-columns:1fr 1fr;gap:0 14px}
.row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 14px}
.btn{background:${ROT};color:#fff;border:none;padding:12px 28px;border-radius:4px;font-size:15px;font-weight:600;cursor:pointer;width:100%}
.btn:hover{background:#c0392b}
.btn:disabled{opacity:0.5;cursor:not-allowed}
.ok{background:#d4edda;border:1px solid #c3e6cb;padding:20px;border-radius:8px;color:#155724;text-align:center;display:none;margin-bottom:16px}
.ft{text-align:center;font-size:11px;color:#999;margin:16px 0 24px;padding:10px}
.chk{display:flex;align-items:flex-start;gap:8px;margin-bottom:14px;font-size:13px;cursor:pointer}
.chk input[type=checkbox]{width:18px;height:18px;margin-top:2px;flex-shrink:0;accent-color:${ROT}}
.day-block{background:#f8f8f5;border:1px solid #e0e0d8;border-radius:6px;padding:14px;margin-bottom:10px}
.day-block h4{font-size:13px;color:${ROT};margin-bottom:8px;display:flex;justify-content:space-between;align-items:center}
.day-block .rm{background:none;border:none;color:#999;cursor:pointer;font-size:16px;padding:0 4px}
.day-block .rm:hover{color:${ROT}}
.add-day{background:#fff;border:1px dashed #ccc;border-radius:6px;padding:10px;text-align:center;cursor:pointer;color:#666;font-size:13px;margin-bottom:12px}
.add-day:hover{border-color:${ROT};color:${ROT}}
.sec{font-size:15px;color:${ROT};font-weight:700;margin-bottom:14px;padding-bottom:6px;border-bottom:1px solid #eee}
@media(max-width:600px){.row,.row3{grid-template-columns:1fr}.hdr{flex-direction:column;text-align:center}.ctn{padding:0 10px}}
body.embed .hdr,body.embed .hdr-accent,body.embed .sub,body.embed .ft{display:none}
body.embed{background:transparent}
body.embed .ctn{padding:0;max-width:640px;margin:0}
body.embed .card{box-shadow:none;padding:20px 24px;border:1px solid #e0e0e0;border-radius:6px}
body.embed .ok-fertig{display:none!important}
body.embed .ok{border-radius:6px}
body.embed .sec{font-size:14px}
body.embed label>span{font-size:11px}
body.embed input,body.embed textarea,body.embed select{font-size:13px;padding:7px 10px}
body.embed .btn{font-size:14px;padding:10px 24px}
</style></head><body class="${embed ? "embed" : ""}">
<div class="ctn">
  <div class="hdr">
    <div>${logoTag}</div>
    <div class="hdr-text">
      <div class="hdr-org">${kvName}</div>
      <div class="hdr-title">Sanit\u00e4tswachdienst anfragen</div>
    </div>
  </div>
  <div class="hdr-accent"></div>
  <div class="sub">Bitte f\u00fcllen Sie das Formular aus. Wir erstellen Ihnen ein unverbindliches Angebot.</div>

  <form id="frm" class="card">
    <div class="sec">Veranstaltungsdaten</div>
    <label><span class="req">Name der Veranstaltung</span><input name="name" required></label>
    <div class="row">
      <label><span class="req">Ort</span><input name="ort" required></label>
      <label><span>Adresse / Gel\u00e4nde</span><input name="adresse"></label>
    </div>
    <div class="row">
      <label><span>PLZ des Veranstaltungsorts</span><input type="text" name="plz" id="plzInput" maxlength="5" pattern="[0-9]{5}" placeholder="z.B. 86633" oninput="checkPLZ(this.value)"><div id="plzHint" style="font-size:10px;margin-top:3px;min-height:16px"></div></label>
      <label><span>Erwartete Besucherzahl</span><input type="number" name="besucher" min="0" placeholder="z.B. 1000"></label>
      <label><span>Art der Veranstaltung</span>
        <select name="art"><option value="">Bitte w\u00e4hlen...</option>
        <option>Volksfest / Stra\u00dfenfest</option><option>Musikveranstaltung / Konzert</option>
        <option>Sportveranstaltung</option><option>Messe / Ausstellung</option>
        <option>Faschingsveranstaltung</option><option>Festzug / Umzug</option>
        <option>Motorsport</option><option>Firmenveranstaltung</option><option>Sonstige</option>
        </select></label>
    </div>

    <label class="chk" style="margin-top:4px"><input type="checkbox" id="multiDay" onchange="toggleMulti()"><span style="font-size:13px;font-weight:600;color:#444">Mehrt\u00e4gige Veranstaltung</span></label>

    <div id="days-container">
      <div class="day-block" data-day="1">
        <h4><span>Tag 1</span></h4>
        <div class="row3">
          <label><span class="req">Datum</span><input type="date" name="tag_1_datum" required></label>
          <label><span>Beginn</span><input type="time" name="tag_1_von" value="18:00"></label>
          <label><span>Ende</span><input type="time" name="tag_1_bis" value="23:00"></label>
        </div>
      </div>
    </div>
    <div id="addDayBtn" class="add-day" style="display:none" onclick="addDay()">&#10010; Weiteren Tag hinzuf\u00fcgen</div>

    <div class="sec" style="margin-top:18px">Veranstalter / Kontakt</div>
    <label><span class="req">Firma / Verein / Veranstalter</span><input name="veranstalter" required></label>
    <label><span class="req">Ansprechpartner</span><input name="ansprechpartner" required></label>
    <div class="row">
      <label><span class="req">Telefon</span><input type="tel" name="telefon" required></label>
      <label><span class="req">E-Mail</span><input type="email" name="email" required></label>
    </div>

    <div class="sec" style="margin-top:18px">Angebots- / Rechnungsadresse</div>
    <label><span>Rechnungsempf\u00e4nger <span style="font-weight:400;color:#888">(falls abweichend vom Veranstalter)</span></span><input name="rechnungsempfaenger" placeholder="Firma / Verein / Name"></label>
    <label><span>Stra\u00dfe / Hausnummer</span><input name="reStrasse" placeholder="z.B. Musterstra\u00dfe 12"></label>
    <div class="row">
      <label><span>PLZ</span><input name="rePlz" maxlength="5" placeholder="z.B. 86529"></label>
      <label><span>Ort</span><input name="reOrt" placeholder="z.B. Schrobenhausen"></label>
    </div>
    <label><span>Bemerkung / besondere Anforderungen</span><textarea name="bemerkung" placeholder="z.B. Auflagen der Beh\u00f6rde, Gel\u00e4ndebesonderheiten..."></textarea></label>

    <label class="chk"><input type="checkbox" id="dsgvo" required><span>Ich stimme der Verarbeitung meiner Daten gem\u00e4\u00df der <a href="${dsUrl}" target="_blank" rel="noopener" style="color:#004B91;text-decoration:underline">Datenschutzerkl\u00e4rung</a> zu. *</span></label>

    <button type="submit" class="btn" id="sbtn">Anfrage absenden</button>
  </form>

  <div id="ok" class="ok">
    <div style="font-size:28px;margin-bottom:8px">&#9989;</div>
    <strong>Vielen Dank f\u00fcr Ihre Anfrage!</strong><br>
    Wir werden uns zeitnah bei Ihnen melden und Ihnen ein Angebot erstellen.
    <div style="display:flex;gap:12px;justify-content:center;margin-top:18px">
      <a href="${fertigUrl}" class="btn ok-fertig" target="_top" style="text-decoration:none;display:inline-block;width:auto;padding:10px 24px">Fertig</a>
      <button class="btn" style="background:#004B91;width:auto;padding:10px 24px" onclick="document.getElementById('ok').style.display='none';document.getElementById('frm').style.display='block';document.getElementById('frm').reset();document.getElementById('dsgvo').checked=false;document.getElementById('sbtn').disabled=false;document.getElementById('sbtn').textContent='Anfrage absenden';if(typeof resizeFrame==='function')resizeFrame();">Neue Anfrage</button>
    </div>
  </div>

  <div class="ft">\u00a9 ${new Date().getFullYear()} ${kvName}</div>
</div>
<script>
var dayCount=1;
var suggestedBC="";
function checkPLZ(v){
  var h=document.getElementById("plzHint");
  if(v.length!==5){h.innerHTML="";suggestedBC="";return;}
  fetch("/api/plz-bc?plz="+v).then(function(r){return r.json();}).then(function(d){
    if(d.bereitschaft){h.innerHTML='<span style="color:#2e7d32">\\u2714 '+d.bereitschaft+'</span>';suggestedBC=d.bc;}
    else{h.innerHTML='<span style="color:#888">PLZ nicht im Kreisverband \\u2013 manuelle Zuweisung</span>';suggestedBC="";}
  }).catch(function(){h.innerHTML="";suggestedBC="";});
}
function toggleMulti(){
  var on=document.getElementById("multiDay").checked;
  document.getElementById("addDayBtn").style.display=on?"block":"none";
  if(!on){while(dayCount>1)removeDay(dayCount--);}
}
function addDay(){
  dayCount++;var n=dayCount;
  var box=document.createElement("div");box.className="day-block";box.setAttribute("data-day",n);
  box.innerHTML='<h4><span>Tag '+n+'</span><button type="button" class="rm" onclick="removeDay('+n+')">&times;</button></h4>'
    +'<div class="row3"><label><span class="req">Datum</span><input type="date" name="tag_'+n+'_datum" required></label>'
    +'<label><span>Beginn</span><input type="time" name="tag_'+n+'_von" value="18:00"></label>'
    +'<label><span>Ende</span><input type="time" name="tag_'+n+'_bis" value="23:00"></label></div>';
  document.getElementById("days-container").appendChild(box);
}
function removeDay(n){
  var el=document.querySelector('[data-day="'+n+'"]');if(el)el.remove();renumberDays();
}
function renumberDays(){
  var blocks=document.querySelectorAll("#days-container .day-block");
  dayCount=blocks.length;
  blocks.forEach(function(b,i){
    var num=i+1;b.setAttribute("data-day",num);
    b.querySelector("h4 span").textContent="Tag "+num;
    var inputs=b.querySelectorAll("input");
    inputs[0].name="tag_"+num+"_datum";inputs[1].name="tag_"+num+"_von";inputs[2].name="tag_"+num+"_bis";
    var rm=b.querySelector(".rm");if(rm)rm.setAttribute("onclick","removeDay("+num+")");
    if(num===1&&rm)rm.remove();
  });
}
document.getElementById("frm").onsubmit=async function(e){
  e.preventDefault();
  if(!document.getElementById("dsgvo").checked){alert("Bitte stimmen Sie der Datenschutzerkl\u00e4rung zu.");return;}
  var b=document.getElementById("sbtn");b.disabled=true;b.textContent="Wird gesendet...";
  var fd=new FormData(this);var d={};fd.forEach(function(v,k){d[k]=v});
  d.besucher=parseInt(d.besucher)||0;
  d.plz=d.plz||"";
  d.suggested_bc=suggestedBC||"";
  d.tage=[];
  for(var i=1;i<=dayCount;i++){
    var dt=d["tag_"+i+"_datum"];
    if(!dt){alert("Bitte Datum f\u00fcr Tag "+i+" ausf\u00fcllen.");b.disabled=false;b.textContent="Anfrage absenden";return;}
    d.tage.push({datum:dt,von:d["tag_"+i+"_von"]||"18:00",bis:d["tag_"+i+"_bis"]||"23:00"});
    delete d["tag_"+i+"_datum"];delete d["tag_"+i+"_von"];delete d["tag_"+i+"_bis"];
  }
  try{var r=await fetch("/api/anfrage",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)});
    if(!r.ok)throw new Error();document.getElementById("frm").style.display="none";document.getElementById("ok").style.display="block";if(typeof resizeFrame==="function")resizeFrame();
  }catch(err){alert("Fehler beim Senden. Bitte versuchen Sie es erneut.");b.disabled=false;b.textContent="Anfrage absenden";}
};
if(document.body.classList.contains("embed")){
  function resizeFrame(){var h=document.documentElement.scrollHeight;window.parent.postMessage({sanwdHeight:h},"*");}
  new MutationObserver(resizeFrame).observe(document.body,{childList:true,subtree:true,attributes:true});
  window.addEventListener("resize",resizeFrame);
  setTimeout(resizeFrame,100);setTimeout(resizeFrame,500);setTimeout(resizeFrame,1500);
}
</script></body></html>`);
});

app.post("/api/anfrage", express.json(), (req, res) => {
  try {
    const { name, ort, adresse, tage, besucher, veranstalter, ansprechpartner, telefon, email, bemerkung, art, rechnungsempfaenger, reStrasse, rePlz, reOrt } = req.body;
    if (!name || !veranstalter || !ansprechpartner || !telefon || !email) return res.status(400).json({ error: "Pflichtfelder fehlen" });
    db.getDb().prepare("INSERT INTO anfragen (name,ort,adresse,datum,zeit_von,zeit_bis,besucher,veranstalter,ansprechpartner,telefon,email,bemerkung,art,plz,suggested_bc,rechnungsempfaenger,re_strasse,re_plz_ort) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
      .run(name, ort||"", adresse||"", JSON.stringify(tage||[]), "", "", besucher||0, veranstalter, ansprechpartner, telefon, email, bemerkung||"", art||"", req.body.plz||"", req.body.suggested_bc||"", rechnungsempfaenger||"", reStrasse||"", (rePlz&&reOrt)?`${rePlz} ${reOrt}`:(rePlz||reOrt||""));
    res.json({ success: true });

    // E-Mail-Benachrichtigung (non-blocking)
    setImmediate(async () => {
      try {
        if (!smtp.isConfigured()) return;
        const { getConfig } = require("./db");

        // 1. Interne Benachrichtigung
        const cfgRecipients = getConfig("smtp_notify_recipients", "");
        let recipients = [];
        if (cfgRecipients.trim()) {
          recipients = cfgRecipients.split(",").map(e => e.trim()).filter(Boolean);
        } else {
          // Fallback: Bereitschafts-E-Mails
          const bereitschaften = db.getDb().prepare("SELECT email FROM bereitschaften WHERE email IS NOT NULL AND email != ''").all();
          recipients = bereitschaften.map(b => b.email).filter(Boolean);
        }
        if (recipients.length > 0) {
          await smtp.sendMail({
            to: recipients.join(", "),
            subject: `Neue SanWD-Anfrage: ${name} (${ort || ""})`,
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;">
              <div style="background:#E60005;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0;">
                <h2 style="margin:0;font-size:18px;">Neue Anfrage eingegangen</h2>
              </div>
              <div style="background:#fff;border:1px solid #ddd;border-top:none;padding:20px 24px;border-radius:0 0 8px 8px;">
                <table style="border-collapse:collapse;font-size:14px;width:100%;">
                <tr><td style="padding:6px 12px 6px 0;font-weight:bold;color:#555;white-space:nowrap;">Veranstaltung:</td><td style="padding:6px 0;">${name}</td></tr>
                <tr><td style="padding:6px 12px 6px 0;font-weight:bold;color:#555;">Ort:</td><td style="padding:6px 0;">${ort || "-"}</td></tr>
                <tr><td style="padding:6px 12px 6px 0;font-weight:bold;color:#555;">Veranstalter:</td><td style="padding:6px 0;">${veranstalter}</td></tr>
                <tr><td style="padding:6px 12px 6px 0;font-weight:bold;color:#555;">Ansprechpartner:</td><td style="padding:6px 0;">${ansprechpartner}</td></tr>
                <tr><td style="padding:6px 12px 6px 0;font-weight:bold;color:#555;">Telefon:</td><td style="padding:6px 0;">${telefon}</td></tr>
                <tr><td style="padding:6px 12px 6px 0;font-weight:bold;color:#555;">E-Mail:</td><td style="padding:6px 0;">${email}</td></tr>
                <tr><td style="padding:6px 12px 6px 0;font-weight:bold;color:#555;">Besucher:</td><td style="padding:6px 0;">${besucher || "-"}</td></tr>
                <tr><td style="padding:6px 12px 6px 0;font-weight:bold;color:#555;">Art:</td><td style="padding:6px 0;">${art || "-"}</td></tr>
                ${bemerkung ? `<tr><td style="padding:6px 12px 6px 0;font-weight:bold;color:#555;vertical-align:top;">Bemerkung:</td><td style="padding:6px 0;">${bemerkung}</td></tr>` : ""}
                </table>
                <p style="margin-top:16px;padding-top:12px;border-top:1px solid #eee;color:#888;font-size:12px;">Diese Anfrage kann in SanWD unter dem Tab „Anfragen" verwaltet werden.</p>
              </div>
            </div>`
          });
          console.log("Anfrage-Benachrichtigung gesendet an:", recipients.join(", "));
        }

        // 2. Bestätigungsmail an Anfragenden
        const sendConfirm = getConfig("smtp_anfrage_confirm", "true");
        if (sendConfirm === "true" && email) {
          const fromName = getConfig("smtp_from_name", "BRK Sanitätswachdienst");
          const kvName = (db.getDb().prepare("SELECT kv_name FROM bereitschaften LIMIT 1").get() || {}).kv_name || "BRK Kreisverband";
          await smtp.sendMail({
            to: email,
            subject: `Ihre Anfrage: ${name} – Eingangsbestätigung`,
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;">
              <div style="background:#002F5F;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0;">
                <h2 style="margin:0;font-size:18px;">${fromName}</h2>
              </div>
              <div style="background:#fff;border:1px solid #ddd;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
                <p>Sehr geehrte/r ${ansprechpartner || "Veranstalter"},</p>
                <p>vielen Dank für Ihre Anfrage zur sanitätsdienstlichen Absicherung Ihrer Veranstaltung <strong>„${name}"</strong>.</p>
                <p>Wir haben Ihre Anfrage erhalten und werden uns zeitnah bei Ihnen melden, um die Details zu besprechen und Ihnen ein Angebot zu erstellen.</p>
                <div style="background:#f5f5f5;border-radius:6px;padding:14px 18px;margin:16px 0;">
                  <div style="font-size:13px;color:#555;">
                    <strong>Ihre Angaben:</strong><br/>
                    Veranstaltung: ${name}<br/>
                    Ort: ${ort || "-"}<br/>
                    Kontakt: ${telefon}
                  </div>
                </div>
                <p>Mit freundlichen Grüßen<br/><strong>${fromName}</strong><br/>${kvName}</p>
              </div>
            </div>`
          });
          console.log("Bestätigungsmail gesendet an:", email);
        }
      } catch(e) { console.error("Anfrage-Mail:", e.message); }
    });
  } catch (e) { console.error("Anfrage:", e); res.status(500).json({ error: "Serverfehler" }); }
});


// === Anfragen API (Auth required) ===
app.get("/api/anfragen", (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: "Nicht authentifiziert" });
  try {
    const rows = db.getDb().prepare(`
      SELECT a.*, v.data AS vorgang_data 
      FROM anfragen a 
      LEFT JOIN vorgaenge v ON a.vorgang_id = v.id 
      ORDER BY a.created_at DESC
    `).all().map(r => {
      if (r.vorgang_data) {
        try { r.auftragsnr = JSON.parse(r.vorgang_data).event?.auftragsnr || null; } catch {}
      }
      delete r.vorgang_data;
      return r;
    });
    res.json(rows);
  } catch (e) { console.error("Anfragen laden:", e); res.status(500).json({ error: "Serverfehler" }); }
});

// Lightweight: Nur Anzahl neuer Anfragen
app.get("/api/anfragen/count", (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: "Nicht authentifiziert" });
  try {
    const row = db.getDb().prepare("SELECT COUNT(*) as cnt FROM anfragen WHERE status='neu'").get();
    res.json({ neu: row?.cnt || 0 });
  } catch { res.json({ neu: 0 }); }
});

app.put("/api/anfragen/:id/status", (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: "Nicht authentifiziert" });
  try {
    const { status, grund } = req.body;
    if (status === "abgelehnt" && grund) {
      db.getDb().prepare("UPDATE anfragen SET status=?, ablehnung_grund=? WHERE id=?").run(status, grund, req.params.id);
    } else {
      db.getDb().prepare("UPDATE anfragen SET status=? WHERE id=?").run(status, req.params.id);
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Serverfehler" }); }
});

// Anfrage annehmen → Vorgang erstellen
app.post("/api/anfragen/:id/annehmen", async (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: "Nicht authentifiziert" });
  try {
    const anfrage = db.getDb().prepare("SELECT * FROM anfragen WHERE id=?").get(req.params.id);
    if (!anfrage) return res.status(404).json({ error: "Anfrage nicht gefunden" });

    const bc = req.body.bereitschaft_code || req.session.user.bereitschaftCode || "BSOB";
    const year = new Date().getFullYear();
    const shortYear = String(year).slice(2);

    // Counter holen und incrementen
    const bereitschaft = db.getDb().prepare("SELECT * FROM bereitschaften WHERE code=?").get(bc) || {};
    const counterRow = db.getDb().prepare("SELECT next_nr FROM counter WHERE bereitschaft_code=? AND year=?").get(bc, year);
    const nextNr = counterRow ? counterRow.next_nr : 1;
    db.getDb().prepare("INSERT INTO counter (bereitschaft_code, year, next_nr) VALUES (?,?,2) ON CONFLICT(bereitschaft_code, year) DO UPDATE SET next_nr = next_nr + 1").run(bc, year);

    const auftragsnr = `${bc} ${shortYear}/${String(nextNr).padStart(3, "0")}`;
    const vorgangId = `evt-${Date.now()}`;

    // Tage aus Anfrage parsen
    let tage = [];
    try { tage = JSON.parse(anfrage.datum || "[]"); } catch { tage = []; }
    if (!Array.isArray(tage)) tage = [];

    const days = tage.length > 0
      ? tage.map((t, i) => ({
          id: i + 1, active: true, date: t.datum || "",
          startTime: t.von || "18:00", endTime: t.bis || "23:00",
          auflagen: 0, geschlossen: false, flaeche: 0, geschlossenFlaeche: false,
          besucher: i === 0 ? (anfrage.besucher || 1000) : 1000,
          besucherFlaeche: 0, eventTypeId: 11, customFactor: 0, prominente: 0,
          polizeiRisiko: false, oHelfer: null, oKtw: null, oRtw: null, oAerzte: null,
          oGktw: null, oEl: null, oElKfz: null, oSeg: null, oMtw: null, oZelt: null,
          kmKtw: 0, kmRtw: 0, kmGktw: 0, kmElKfz: 0, kmSeg: 0, kmMtw: 0, fahrzeuge: []
        }))
      : Array.from({ length: 8 }, (_, i) => ({
          id: i + 1, active: i === 0, date: "",
          startTime: anfrage.zeit_von || "18:00", endTime: anfrage.zeit_bis || "23:00",
          auflagen: 0, geschlossen: false, flaeche: 0, geschlossenFlaeche: false,
          besucher: 1000, besucherFlaeche: 0, eventTypeId: 11, customFactor: 0,
          prominente: 0, polizeiRisiko: false, oHelfer: null, oKtw: null, oRtw: null,
          oAerzte: null, oGktw: null, oEl: null, oElKfz: null, oSeg: null, oMtw: null,
          oZelt: null, kmKtw: 0, kmRtw: 0, kmGktw: 0, kmElKfz: 0, kmSeg: 0, kmMtw: 0,
          fahrzeuge: []
        }));

    const vorgang = {
      event: {
        auftragsnr, name: anfrage.name || "", ort: anfrage.ort || "",
        adresse: anfrage.adresse || "", veranstalter: anfrage.veranstalter || "",
        ansprechpartner: anfrage.ansprechpartner || "", telefon: anfrage.telefon || "",
        email: anfrage.email || "", rechnungsempfaenger: anfrage.rechnungsempfaenger || anfrage.veranstalter || "",
        reStrasse: anfrage.re_strasse || "", rePlzOrt: anfrage.re_plz_ort || "",
        anrede: "Sehr geehrte Damen und Herren,",
        auflagen: "keine", kfzStellplatz: true, sanitaetsraum: false,
        strom: true, verpflegung: true, pauschalangebot: 0,
        bemerkung: "", coords: null, w3w: "", hausnr: "",
        veranstalterInfo: anfrage.bemerkung || "",
        checklist: {}, ilsEL: "", ilsTelefon: "", ilsFunk: "",
        ilsAbkoemmlich: "", ilsFzg1: "", ilsFzg2: "", ilsFzg3: "", ilsSonstige: "",
        anfrageId: anfrage.id, anfrageDatum: anfrage.created_at
      },
      days
    };

    // Geocoding: Adresse → Koordinaten + w3w
    if (anfrage.adresse && anfrage.ort) {
      try {
        const geoQ = `${anfrage.adresse}, ${anfrage.ort}`;
        const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(geoQ)}&format=json&addressdetails=1&limit=1&countrycodes=de&accept-language=de`;
        const geoResp = await fetch(geoUrl, { headers: { "User-Agent": "BRK-SanWD/7.0" } });
        const geoData = await geoResp.json();
        if (geoData[0]) {
          const lat = parseFloat(geoData[0].lat);
          const lng = parseFloat(geoData[0].lon);
          vorgang.event.coords = { lat, lng };
          vorgang.event.hausnr = geoData[0].address?.house_number || "";
          // w3w
          const w3wKey = process.env.W3W_API_KEY;
          if (w3wKey) {
            try {
              const wr = await fetch(`https://api.what3words.com/v3/convert-to-3wa?coordinates=${lat},${lng}&language=de&key=${w3wKey}`);
              const wd = await wr.json();
              if (wd.words) vorgang.event.w3w = "///" + wd.words;
            } catch (e) { console.warn("w3w Fehler:", e.message); }
          }
          // HERE refinement if available
          const hereKey = process.env.HERE_API_KEY;
          if (hereKey && !geoData[0].address?.house_number) {
            try {
              const hr = await fetch(`https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(geoQ)}&apiKey=${encodeURIComponent(hereKey)}&lang=de&in=countryCode:DEU&limit=1`);
              const hd = await hr.json();
              if (hd.items?.[0]?.position) {
                vorgang.event.coords = { lat: hd.items[0].position.lat, lng: hd.items[0].position.lng };
                vorgang.event.hausnr = hd.items[0].address?.houseNumber || vorgang.event.hausnr;
                if (w3wKey) {
                  try {
                    const wr2 = await fetch(`https://api.what3words.com/v3/convert-to-3wa?coordinates=${hd.items[0].position.lat},${hd.items[0].position.lng}&language=de&key=${w3wKey}`);
                    const wd2 = await wr2.json();
                    if (wd2.words) vorgang.event.w3w = "///" + wd2.words;
                  } catch {}
                }
              }
            } catch (e) { console.warn("HERE Fehler:", e.message); }
          }
        }
      } catch (e) { console.warn("Geocoding Fehler:", e.message); }
    }

    db.getDb().prepare(
      "INSERT INTO vorgaenge (id, bereitschaft_code, year, data, created_by) VALUES (?,?,?,?,?)"
    ).run(vorgangId, bc, year, JSON.stringify(vorgang), req.session.user.sub);

    // Anfrage-Status updaten
    db.getDb().prepare("UPDATE anfragen SET status='angenommen', bereitschaft_code=?, vorgang_id=? WHERE id=?").run(bc, vorgangId, anfrage.id);

    db.audit(req.session.user, "anfrage_angenommen", "anfrage", String(anfrage.id),
      `Vorgang ${auftragsnr} erstellt (${vorgangId})`);

    res.json({ success: true, vorgangId, auftragsnr, bc });
  } catch (e) {
    console.error("Anfrage annehmen:", e);
    res.status(500).json({ error: e.message });
  }
});

// Anfrage umzuweisen (Bereitschaft ändern)
app.post("/api/anfragen/:id/umzuweisen", requireAuth, (req, res) => {
  try {
    const anfrage = db.getDb().prepare("SELECT * FROM anfragen WHERE id=?").get(req.params.id);
    if (!anfrage) return res.status(404).json({ error: "Anfrage nicht gefunden" });
    if (!anfrage.vorgang_id) return res.status(400).json({ error: "Kein Vorgang zugeordnet" });

    const newBc = req.body.bereitschaft_code;
    if (!newBc) return res.status(400).json({ error: "Bereitschaft fehlt" });

    // Vorgang-Bereitschaft updaten
    db.getDb().prepare("UPDATE vorgaenge SET bereitschaft_code=? WHERE id=?").run(newBc, anfrage.vorgang_id);
    // Anfrage-Bereitschaft updaten
    db.getDb().prepare("UPDATE anfragen SET bereitschaft_code=? WHERE id=?").run(newBc, anfrage.id);

    db.audit(req.session.user, "anfrage_umzugewiesen", "anfrage", String(anfrage.id),
      `Vorgang ${anfrage.vorgang_id} umzugewiesen an ${newBc}`);

    res.json({ success: true });
  } catch (e) {
    console.error("Anfrage umzuweisen:", e);
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/anfragen/:id", (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: "Nicht authentifiziert" });
  try {
    db.getDb().prepare("DELETE FROM anfragen WHERE id=?").run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Serverfehler" }); }
});

app.use("/auth", authRouter);

// ── API Routes (Auth + RBAC) ─────────────────────────────────────
app.use("/api/vorgaenge", vorgaengeRouter);
app.use("/api/kunden", kundenRouter);
app.use("/api/stammdaten", stammdatenRouter);
app.use("/api/templates", templatesRouter);
app.use("/api/admin", adminRouter);
// ═══════════════════════════════════════════════════════════════════
// Nextcloud Sync (muss VOR pdfRouter registriert werden!)
// ═══════════════════════════════════════════════════════════════════
app.post("/api/pdf/sync/:id", requireAuth, async (req, res) => {
  try {
    if (!nextcloud.isConfigured()) return res.status(501).json({ error: "Nextcloud nicht konfiguriert" });
    const db = require("./db").getDb();
    const row = db.prepare("SELECT data, bereitschaft_code FROM vorgaenge WHERE id=?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Vorgang nicht gefunden" });
    const vorgang = JSON.parse(row.data);
    vorgang.bereitschaft_code = row.bereitschaft_code;
    const ev = vorgang.event || {};
    const stamm = db.prepare("SELECT * FROM bereitschaften WHERE code=?").get(row.bereitschaft_code || req.session.user.bereitschaftCode) || {};
    const user = db.prepare("SELECT name, titel, ort, email, telefon, mobil, unterschrift FROM users WHERE sub=?").get(req.session.user.sub) || {};
    const klauselnAAB = db.prepare("SELECT id, titel, inhalt, reihenfolge FROM klauseln WHERE dokument='aab' ORDER BY reihenfolge").all();

    const pdfs = [];
    const nr = (ev.auftragsnr || "").replace(/[^a-zA-Z0-9_-]/g, "_");

    // Gefahrenanalyse
    try {
      const gHtml = buildGefahrenHTML(ev, vorgang.days || [], [], stamm);
      const gData = await BrowserPool.renderPDF(gHtml);
      pdfs.push({ filename: `${nr}_01_Gefahrenanalyse.pdf`, data: gData });
    } catch(e) { console.warn("Sync: Gefahrenanalyse übersprungen:", e.message); }

    // Angebot
    try {
      const aHtml = buildAngebotHTML(ev, [], 0, vorgang.days || [], stamm, {}, user);
      const aData = await BrowserPool.renderPDF(aHtml, { marginTop: "20mm", marginLeft: "12mm" });
      pdfs.push({ filename: `${nr}_02_Angebot.pdf`, data: aData });
    } catch(e) { console.warn("Sync: Angebot übersprungen:", e.message); }

    // Vertrag
    try {
      const vHtml = buildVertragHTML(vorgang, stamm, user);
      const vData = await BrowserPool.renderPDF(vHtml);
      pdfs.push({ filename: `${nr}_03_Vertrag.pdf`, data: vData });
    } catch(e) { console.warn("Sync: Vertrag übersprungen:", e.message); }

    // AAB
    try {
      const bHtml = buildAABHTML(stamm, row.bereitschaft_code || req.session.user.bereitschaftCode, klauselnAAB, ev.auftragsnr || "");
      const bData = await BrowserPool.renderPDF(bHtml);
      pdfs.push({ filename: `${nr}_04_AAB.pdf`, data: bData });
    } catch(e) { console.warn("Sync: AAB übersprungen:", e.message); }

    if (pdfs.length === 0) return res.status(500).json({ error: "Keine PDFs generiert" });

    const result = await nextcloud.syncVorgang(req.session, vorgang, pdfs, stamm);

    if (result.success) {
      vorgang.nextcloudSync = { syncedAt: result.syncedAt, folder: result.folder, files: result.results.map(r => r.file), syncedBy: req.session.user.name };
      db.prepare("UPDATE vorgaenge SET data = ? WHERE id = ?").run(JSON.stringify(vorgang), req.params.id);
    }

    res.json(result);
  } catch(e) {
    console.error("Nextcloud Sync Fehler:", e);
    res.status(500).json({ error: e.message });
  }
});

app.use("/api/pdf", pdfRouter);
app.use("/api/ils", ilsRouter);
app.use("/api/klauseln", klauselnRouter);


// ── W3W Proxy ────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
// Feedback → Zammad Ticket
// ═══════════════════════════════════════════════════════════════════
app.post("/api/feedback", requireAuth, async (req, res) => {
  const { kategorie, betreff, beschreibung, ansicht, browser } = req.body;
  if (!betreff || !beschreibung) return res.status(400).json({ error: "Betreff und Beschreibung erforderlich" });
  const zUrl = process.env.ZAMMAD_URL;
  const zToken = process.env.ZAMMAD_TOKEN;
  if (!zUrl || !zToken) return res.status(501).json({ error: "Zammad nicht konfiguriert" });
  try {
    const user = req.session.user || {};
    const tag = kategorie === "bug" ? "bug" : "feature";
    const prioId = kategorie === "bug" ? 2 : 3;
    const body = `**Gemeldet von:** ${user.name || "Unbekannt"} (${user.email || "-"})
**Bereitschaft:** ${user.bereitschaftCode || "-"}
**Ansicht:** ${ansicht || "-"}
**Browser:** ${browser || "-"}
**Kategorie:** ${kategorie === "bug" ? "Fehler/Bug" : "Wunsch/Verbesserung"}

---

${beschreibung}`;
    const resp = await fetch(zUrl + "/api/v1/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Token " + zToken },
      body: JSON.stringify({
        title: "[SanWD " + (kategorie === "bug" ? "Bug" : "Feature") + "] " + betreff,
        group_id: 8,
        customer_id: "guess:" + (user.email || "sanwd@brkndsob.org"),
        priority_id: prioId,
        tags: "sanwd," + tag,
        article: { subject: betreff, body: body, type: "note", internal: false, content_type: "text/plain" }
      })
    });
    const data = await resp.json();
    if (data.id) {
      console.log("Zammad Ticket #" + data.number + " erstellt von " + (user.name || "?"));
      res.json({ ok: true, ticket: data.number });
    } else {
      console.error("Zammad Fehler:", data);
      res.status(500).json({ error: "Ticket konnte nicht erstellt werden" });
    }
  } catch(e) { console.error("Feedback/Zammad:", e); res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════
// Geocoding Proxy (HERE Fallback fuer Hausnummer-Aufloesung)
// ═══════════════════════════════════════════════════════════════════
app.get("/api/geocode", requireAuth, async (req, res) => {
  const q = req.query.q;
  if (!q) return res.json({ items: [] });
  const apiKey = process.env.HERE_API_KEY;
  if (!apiKey) return res.status(501).json({ error: "HERE API nicht konfiguriert" });
  try {
    const url = `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(q)}&apiKey=${encodeURIComponent(apiKey)}&lang=de&in=countryCode:DEU&limit=1`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.items && data.items[0]) {
      const item = data.items[0];
      res.json({
        lat: item.position.lat,
        lng: item.position.lng,
        address: item.address.label,
        houseNumber: item.address.houseNumber || null,
        resultType: item.resultType
      });
    } else {
      res.json({ lat: null, lng: null });
    }
  } catch(e) { console.error("HERE Geocode:", e); res.json({ lat: null, lng: null }); }
});

app.get("/api/w3w", async (req, res) => {
  const { lat, lng } = req.query;
  const key = process.env.W3W_API_KEY;
  if (!key) return res.json({ w3w: null });
  try {
    const url = `https://api.what3words.com/v3/convert-to-3wa?coordinates=${lat},${lng}&language=de&key=${key}`;
    const r = await fetch(url);
    const d = await r.json();
    res.json({ w3w: d.words ? "///" + d.words : null });
  } catch { res.json({ w3w: null }); }
});


// ── Eigenes Profil ────────────────────────────────────────────────
app.get("/api/profile", (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: "Nicht angemeldet" });
  const db = require("./db").getDb();
  const u = db.prepare("SELECT name, email, telefon, mobil, titel, ort, unterschrift FROM users WHERE sub = ?").get(req.session.user.sub);
  res.json(u || {});
});

app.put("/api/profile", (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: "Nicht angemeldet" });
  const { telefon, mobil, titel, email, ort, unterschrift, signatur } = req.body;
  const _unterschrift = unterschrift || signatur || "";
  const db = require("./db").getDb();
  db.prepare("UPDATE users SET telefon=?, mobil=?, titel=?, email=?, ort=?, unterschrift=? WHERE sub=?")
    .run(telefon||"", mobil||"", titel||"", email||"", ort||"", _unterschrift, req.session.user.sub);
  // Session aktualisieren
  req.session.user = { ...req.session.user, telefon, mobil, titel, email, ort, unterschrift: _unterschrift };
  res.json({ success: true });
});


// ── PDF Vertrag (Puppeteer) ──────────────────────────────────────────

// Nextcloud Status
app.get("/api/nextcloud/status", requireAuth, (req, res) => {
  const { getConfig } = require("./db");
  const enabled = getConfig("nextcloud_enabled", "false") === "true";
  const url = getConfig("nextcloud_url", "");
  res.json({ configured: enabled && !!url, url, enabled });
});
// ═══════════════════════════════════════════════════════════════════
// App Config (Admin)
// ═══════════════════════════════════════════════════════════════════
app.get("/api/config/nextcloud", requireAuth, (req, res) => {
  if (req.session.user.rolle !== "admin") return res.status(403).json({ error: "Nur Admin" });
  const { getAllConfig } = require("./db");
  const rows = getAllConfig("nextcloud_");
  const cfg = {};
  rows.forEach(r => cfg[r.key] = r.value);
  res.json(cfg);
});

app.put("/api/config/nextcloud", requireAuth, (req, res) => {
  if (req.session.user.rolle !== "admin") return res.status(403).json({ error: "Nur Admin" });
  const { setConfig, audit } = require("./db");
  const allowed = ["nextcloud_url", "nextcloud_base_path", "nextcloud_enabled", "nextcloud_subfolder", "nextcloud_auth_mode", "nextcloud_service_user", "nextcloud_service_password"];
  for (const [key, val] of Object.entries(req.body)) {
    if (allowed.includes(key)) setConfig(key, String(val));
  }
  audit(req.session.user, "config_update", "nextcloud", null, JSON.stringify(req.body));
  res.json({ ok: true });
});


// ═══════════════════════════════════════════════════════════════════
// SMTP Config (Admin)
// ═══════════════════════════════════════════════════════════════════
app.get("/api/config/smtp", requireAuth, (req, res) => {
  if (req.session.user.rolle !== "admin") return res.status(403).json({ error: "Nur Admin" });
  const { getAllConfig } = require("./db");
  const rows = getAllConfig("smtp_");
  const cfg = {};
  rows.forEach(r => { cfg[r.key] = r.key === "smtp_password" ? (r.value ? "***" : "") : r.value; });
  res.json(cfg);
});

app.put("/api/config/smtp", requireAuth, (req, res) => {
  if (req.session.user.rolle !== "admin") return res.status(403).json({ error: "Nur Admin" });
  const { setConfig, audit } = require("./db");
  const allowed = ["smtp_enabled","smtp_mode","smtp_host","smtp_port","smtp_secure","smtp_user","smtp_password","smtp_from_email","smtp_from_name","smtp_cc_bereitschaft","smtp_on_behalf","smtp_notify_recipients","smtp_anfrage_confirm"];
  for (const [key, val] of Object.entries(req.body)) {
    if (allowed.includes(key)) {
      if (key === "smtp_password" && val === "***") continue;
      setConfig(key, String(val));
    }
  }
  audit(req.session.user, "config_update", "smtp", null, JSON.stringify({...req.body, smtp_password: "***"}));
  res.json({ ok: true });
});

app.post("/api/config/smtp/test", requireAuth, async (req, res) => {
  if (req.session.user.rolle !== "admin") return res.status(403).json({ error: "Nur Admin" });
  try {
    const result = await smtp.testConnection();
    res.json(result);
  } catch(e) {
    res.json({ success: false, error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// Mail senden (Angebot/Mappe)
// ═══════════════════════════════════════════════════════════════════
app.post("/api/mail/send/:id", requireAuth, async (req, res) => {
  try {
    if (!smtp.isConfigured()) return res.status(501).json({ error: "E-Mail nicht konfiguriert" });
    const db = require("./db").getDb();
    const row = db.prepare("SELECT data, bereitschaft_code FROM vorgaenge WHERE id=?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Vorgang nicht gefunden" });
    
    const vorgang = JSON.parse(row.data);
    const ev = vorgang.event || {};
    const stamm = db.prepare("SELECT * FROM bereitschaften WHERE code=?").get(row.bereitschaft_code) || {};
    const { to, subject, body, attachPdf } = req.body;
    
    if (!to) return res.status(400).json({ error: "Empfänger fehlt" });

    const attachments = [];
    
    // PDF generieren und anhängen
    if (attachPdf === "mappe" || attachPdf === "angebot") {
      try {
        const user = db.prepare("SELECT name, titel, ort, email, telefon, mobil, unterschrift FROM users WHERE sub=?").get(req.session.user.sub) || {};
        const klauselnAAB = db.prepare("SELECT id, titel, inhalt, reihenfolge FROM klauseln WHERE dokument='aab' ORDER BY reihenfolge").all();
        const kosten = db.prepare("SELECT * FROM kostensaetze WHERE bereitschaft_code=?").get(row.bereitschaft_code) || {};
        const nr = (ev.auftragsnr || "").replace(/[^a-zA-Z0-9_-]/g, "_");
        
        if (attachPdf === "angebot") {
          const html = buildAngebotHTML(ev, req.body.dayCalcs || [], req.body.totalCosts || 0, req.body.activeDays || vorgang.days || [], stamm, kosten, user);
          const pdf = await BrowserPool.renderPDF(html, { marginTop: "20mm", marginLeft: "12mm" });
          attachments.push({ filename: `${nr}_Angebot.pdf`, content: pdf, contentType: "application/pdf" });
        }
        
        if (attachPdf === "mappe") {
          // Angebotsmappe: Deckblatt → Angebot → Vertrag → AAB
          const includeDocs = { deckblatt: true, angebot: true, vertrag: true, aab: true, gefahren: false };
          const deckblattHTML = buildDeckblattHTML(ev, req.body.activeDays || vorgang.days || [], stamm, user, includeDocs);
          const angebotHTML = buildAngebotHTML(ev, req.body.dayCalcs || [], req.body.totalCosts || 0, req.body.activeDays || vorgang.days || [], stamm, kosten, user);
          const vertragHTML = buildVertragHTML(vorgang, stamm, user);
          const aabHTML = buildAABHTML(stamm, row.bereitschaft_code, klauselnAAB, ev.auftragsnr || "");

          const extractBody = (html) => { const m = html.match(/<body[^>]*>([\s\S]*)<\/body>/i); return m ? m[1] : html; };

          const combinedHTML = `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><style>
            *{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;font-size:10pt;color:#000}
            @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
              .page-break{page-break-before:always;break-before:page}
              .no-break{page-break-inside:avoid!important;break-inside:avoid!important}
              tr{page-break-inside:avoid;break-inside:avoid}
            }
            .doc-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #c0392b}
            .doc-header-left{display:flex;align-items:center;gap:8px}
            .doc-header-org{font-size:8pt;color:#555;margin-top:3px}
            .doc-header-right{text-align:right;font-size:8pt;color:#555}
            .doc-header-right strong{color:#000}
            .doc-title{font-size:11pt;font-weight:bold;text-align:center;color:#c0392b;margin:12px 0 4px}
            .doc-subtitle{font-size:13pt;font-weight:bold;text-align:center;margin:0 0 16px}
            .section{font-weight:bold;margin-top:12px;margin-bottom:4px;padding-left:3px;border-left:3px solid #c0392b;page-break-after:avoid;break-after:avoid}
            .p{margin-bottom:6px}
            .avoid{page-break-inside:avoid}
            table{width:100%;border-collapse:collapse;font-size:9pt;margin-bottom:6px}
            .info-table td{padding:2px 0;vertical-align:top}
            .info-table td:first-child{width:155px;color:#555}
            .party-block{background:#f5f5f5;border-left:3px solid #c0392b;padding:8px 10px;margin-bottom:10px;line-height:1.65}
            .party-label{text-align:right;font-style:italic;color:#555;font-size:8.5pt;margin-top:4px}
            .sig-table{width:100%;margin-top:24px;border-collapse:collapse}
            .sig-cell{width:45%;text-align:center;vertical-align:bottom;padding:0 8px}
            .sig-line{border-top:1px solid #000;padding-top:4px;font-size:8pt;margin-top:4px}
          </style></head><body>
            <div class="mappe-section">${extractBody(deckblattHTML)}</div>
            <div class="mappe-section page-break">${extractBody(angebotHTML)}</div>
            <div class="mappe-section page-break">${extractBody(vertragHTML)}</div>
            <div class="mappe-section page-break">${extractBody(aabHTML)}</div>
          </body></html>`;

          const pdf = await BrowserPool.renderPDF(combinedHTML, { marginTop: "18mm", marginLeft: "12mm", marginBottom: "20mm" });
          attachments.push({ filename: `${nr}_Angebotsmappe.pdf`, content: pdf, contentType: "application/pdf" });
        }
      } catch(e) {
        console.error("PDF für Mail:", e);
        return res.status(500).json({ error: "PDF-Generierung fehlgeschlagen: " + e.message });
      }
    }

    const result = await smtp.sendMail({
      to,
      subject: subject || `Angebot Sanitätswachdienst - ${ev.name || ""}`,
      html: body || "",
      attachments,
      onBehalf: req.session.user.email ? `"${req.session.user.name}" <${req.session.user.email}>` : null,
      ccBereitschaft: stamm.email || null
    });

    // Log
    require("./db").audit(req.session.user, "mail_sent", "vorgang", req.params.id, JSON.stringify({ to, subject, attachPdf, attachments: attachments.length }));
    
    res.json(result);
  } catch(e) {
    console.error("Mail senden:", e);
    res.status(500).json({ error: e.message });
  }
});

// ── FiBu Weiterleitung ─────────────────────────────────────────────
app.get("/api/config/fibu", requireAuth, (req, res) => {
  const { getConfig } = require("./db");
  res.json({ fibu_email: getConfig("fibu_email", "") });
});
app.put("/api/config/fibu", requireAuth, (req, res) => {
  const { setConfig } = require("./db");
  setConfig("fibu_email", req.body.fibu_email || "");
  res.json({ success: true });
});

app.post("/api/mail/fibu/:id", requireAuth, async (req, res) => {
  try {
    if (!smtp.isConfigured()) return res.status(501).json({ error: "E-Mail nicht konfiguriert" });
    const dbi = require("./db").getDb();
    const row = dbi.prepare("SELECT data, bereitschaft_code FROM vorgaenge WHERE id=?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Vorgang nicht gefunden" });

    const vorgang = JSON.parse(row.data);
    const ev = vorgang.event || {};
    const stamm = dbi.prepare("SELECT * FROM bereitschaften WHERE code=?").get(row.bereitschaft_code) || {};
    const user = dbi.prepare("SELECT name, titel, ort, email, telefon, mobil FROM users WHERE sub=?").get(req.session.user.sub) || {};
    const kosten = dbi.prepare("SELECT * FROM kostensaetze WHERE bereitschaft_code=?").get(row.bereitschaft_code) || {};

    const { to, subject, body, fremdHelfer, fremdFahrzeuge, dayCalcs, totalCosts, activeDays } = req.body;
    if (!to) return res.status(400).json({ error: "FiBu-E-Mail fehlt" });

    // Angebot-PDF generieren
    const attachments = [];
    try {
      const html = buildAngebotHTML(ev, dayCalcs || [], totalCosts || 0, activeDays || vorgang.days || [], stamm, kosten, user);
      const pdf = await BrowserPool.renderPDF(html, { marginTop: "20mm", marginLeft: "12mm" });
      const nr = (ev.auftragsnr || "").replace(/[^a-zA-Z0-9_-]/g, "_");
      attachments.push({ filename: `${nr}_Angebot.pdf`, content: pdf, contentType: "application/pdf" });
    } catch (e) { console.warn("FiBu PDF:", e.message); }

    // Haupt-Mail an FiBu
    const htmlBody = body.split("\n").map(l => l.trim() ? `<p>${l}</p>` : "<p>&nbsp;</p>").join("");

    const result = await smtp.sendMail({
      to,
      subject,
      html: htmlBody,
      onBehalf: user.email ? `"${user.name}" <${user.email}>` : null,
      ccBereitschaft: stamm.email || null,
      attachments
    });

    // Benachrichtigung an andere Bereitschaften
    const notifiedBCs = [];
    if (fremdHelfer?.length > 0 || fremdFahrzeuge?.length > 0) {
      const allBCs = new Set();
      (fremdHelfer || []).forEach(h => { if(h.bc) allBCs.add(h.bc); });
      (fremdFahrzeuge || []).forEach(f => { if(f.bc) allBCs.add(f.bc); });

      for (const bcCode of allBCs) {
        const bcRow = dbi.prepare("SELECT name, email FROM bereitschaften WHERE code=?").get(bcCode);
        if (!bcRow?.email) continue;

        const helferForBC = (fremdHelfer || []).filter(h => h.bc === bcCode);
        const fzgForBC = (fremdFahrzeuge || []).filter(f => f.bc === bcCode);

        let details = "";
        if (helferForBC.length > 0) {
          const totalH = helferForBC.reduce((s, h) => s + (parseInt(h.anzahl) || 0), 0);
          details += `<p><strong>Helfer:</strong> ${totalH} Helfer aus ${bcRow.name}</p>`;
        }
        if (fzgForBC.length > 0) {
          details += `<p><strong>Fahrzeuge:</strong></p><ul>${fzgForBC.map(f => `<li>${f.typ || "Fahrzeug"}${f.kennzeichen ? " – " + f.kennzeichen : ""}</li>`).join("")}</ul>`;
        }

        const bcNotifyHTML = `
          <p>Hallo ${bcRow.name},</p>
          <p>hiermit informieren wir euch, dass für die Veranstaltung <strong>${ev.name || ""}</strong> (${ev.auftragsnr || ""}) eine Abrechnung an die Finanzbuchhaltung weitergeleitet wurde.</p>
          <p>Dabei wurden folgende Ressourcen eurer Bereitschaft eingesetzt:</p>
          ${details}
          <p>Falls ihr Fragen habt, meldet euch gerne bei uns.</p>
          <p>Mit kameradschaftlichen Grüßen<br/>${user.name || stamm.leiter_name || ""}<br/>${stamm.name || ""}</p>`;

        try {
          await smtp.sendMail({
            to: bcRow.email,
            subject: `FiBu-Abrechnung: ${ev.name || ""} (${ev.auftragsnr || ""}) – Eure Helfer/Fahrzeuge`,
            html: bcNotifyHTML,
            onBehalf: user.email ? `"${user.name}" <${user.email}>` : null
          });
          notifiedBCs.push(bcRow.name);
        } catch (e) { console.warn("BC-Notify:", bcCode, e.message); }
      }
    }

    // Checklist updaten: fibuWeitergeleitet + abgeschlossen
    const now = Date.now();
    vorgang.event.checklist = { ...(vorgang.event.checklist || {}), fibuWeitergeleitet: now, abgeschlossen: now };
    if (fremdHelfer?.length > 0) vorgang.event.checklist.fibuFremdHelfer = fremdHelfer;
    if (fremdFahrzeuge?.length > 0) vorgang.event.checklist.fibuFremdFahrzeuge = fremdFahrzeuge;
    dbi.prepare("UPDATE vorgaenge SET data=? WHERE id=?").run(JSON.stringify(vorgang), req.params.id);

    const { audit } = require("./db");
    audit(req.session.user, "fibu_mail", "vorgang", req.params.id, `An: ${to}, Benachrichtigt: ${notifiedBCs.join(", ") || "keine"}`);

    res.json({ success: true, notifiedBCs });
  } catch(e) {
    console.error("FiBu Mail:", e);
    res.status(500).json({ error: e.message });
  }
});

// Nextcloud Test-Verbindung
app.post("/api/config/nextcloud/test", requireAuth, async (req, res) => {
  if (req.session.user.rolle !== "admin") return res.status(403).json({ error: "Nur Admin" });
  try {
    const { getConfig } = require("./db");
    const url = getConfig("nextcloud_url");
    if (!url) return res.json({ ok: false, error: "URL nicht konfiguriert" });
    
    const nc = require("./services/nextcloud");
    const { client, type, uid } = nc.getClient(req.session);
    if (!client) return res.json({ ok: false, error: "Kein Client verfügbar (Token oder Service-Account)" });
    
    const exists = await client.exists("/");
    res.json({ ok: true, type, uid, message: `Verbindung als ${type}:${uid} erfolgreich` });
  } catch(e) {
    res.json({ ok: false, error: e.message });
  }
});



app.post("/api/pdf/vertrag/:id", requireAuth, async (req, res) => {
  // puppeteer via BrowserPool
  const { id } = req.params;
  try {
    const db = require("./db").getDb();
    const row = db.prepare("SELECT data FROM vorgaenge WHERE id=?").get(id);
    if (!row) return res.status(404).json({ error: "Vorgang nicht gefunden" });
    const vorgang = JSON.parse(row.data);
    const stamm = db.prepare("SELECT * FROM bereitschaften WHERE code=?").get(req.session.user.bereitschaftCode) || {};
    const kosten = db.prepare("SELECT * FROM kostensaetze WHERE bereitschaft_code=?").get(req.session.user.bereitschaftCode) || {};
    const user = db.prepare("SELECT name, titel, ort, email, telefon, mobil, unterschrift FROM users WHERE sub=?").get(req.session.user.sub) || {};
    const html = buildVertragHTML(vorgang, stamm, user);
    const browser = await BrowserPool.get();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    const pdf = await page.pdf({
      format: "A4",
      margin: { top: "15mm", right: "12mm", bottom: "20mm", left: "12mm" },
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: `<div style="width:100%;padding:0 12mm;font-family:Arial,sans-serif;font-size:7pt;color:#999;display:flex;justify-content:space-between;border-top:0.5px solid #ddd;padding-top:2mm"><span>Vereinbarung SanWD · Anlagen: Gefahrenanalyse (1), Kostenaufstellung (2), AAB (3)</span><span>${(vorgang.event?.auftragsnr||"").replace(/"/g,"&quot;")}</span><span>Seite <span class="pageNumber"></span>/<span class="totalPages"></span></span></div>`,
      printBackground: true
    });
    // browser bleibt im Pool offen (pages werden in renderHTML geschlossen)
    res.set({ "Content-Type":"application/pdf", "Content-Disposition":`inline; filename="Vertrag-${id}.pdf"` });
    res.send(pdf);
    ncAutoUpload(req, req.params.id, `Vertrag-${id}.pdf`, pdf);
  } catch(e) {
    console.error("Vertrag PDF:", e);
    res.status(500).json({ error: e.message });
  }
});

function buildVertragHTML(vorgang, stamm, user) {
  const ev = vorgang.event || {};
  const days = (vorgang.days || []).filter(d => d.active);
  const fDate = s => s ? new Date(s).toLocaleDateString("de-DE") : "";
  const esc = s => (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

  // BRK Corporate Colors
  const ROT = "#c0392b";
  const DUNKELGRAU = "#555";
  const HELLGRAU = "#f5f5f5";

  const ort = esc(user.ort || "");
  const today = new Date().toLocaleDateString("de-DE");
  const unterzeichner = esc(user.name || stamm.leiter_name || "");
  const titel = esc(user.titel || stamm.leiter_nameTitle || "Bereitschaftsleiter");
  const kvName = esc(stamm.kv_name || "");
  const kgf = esc(stamm.kgf || "");
  const kvAdresse = esc(stamm.kv_adresse || "");
  const kvPlzOrt = esc(stamm.kv_plz_ort || "");

  const logoB64 = stamm.logo ? Buffer.from(stamm.logo).toString("base64") : null;
  const logoHtml = logoB64
    ? `<img src="data:image/png;base64,${logoB64}" style="height:36px;width:auto;vertical-align:middle">`
    : `<span style="color:${ROT};font-weight:bold;font-size:18pt;vertical-align:middle">✚</span>`;

  const dayRows = days.map(d =>
    `<tr>
      <td style="width:25px;padding:2px 4px;color:${DUNKELGRAU}">am</td>
      <td style="width:85px;padding:2px 4px">${fDate(d.date)}</td>
      <td style="width:60px;padding:2px 4px">${esc(d.startTime||"")} Uhr</td>
      <td style="width:25px;padding:2px 4px;color:${DUNKELGRAU}">bis</td>
      <td style="width:85px;padding:2px 4px">${fDate(d.date)}</td>
      <td style="padding:2px 4px">${esc(d.endTime||"")} Uhr</td>
    </tr>`
  ).join("");

  const besucherCells = days.map((d,i) =>
    `<td style="padding:2px 8px">${i+1}. Tag: <strong>${d.besucher||"—"}</strong></td>`
  ).join("");

  const unterschriftHtml = (user.unterschrift)
    ? `<img src="${user.unterschrift}" style="height:45px;width:auto;display:block;margin:0 auto 4px">`
    : `<div style="height:49px"></div>`;

  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 9.5pt; color: #000; margin: 0; line-height: 1.55; }

    /* ── Header ── */
    .doc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid ${ROT}; }
    .doc-header-left { display: flex; align-items: center; gap: 8px; }
    .doc-header-org { font-size: 8pt; color: ${DUNKELGRAU}; margin-top: 3px; }
    .doc-header-right { text-align: right; font-size: 8pt; color: ${DUNKELGRAU}; }
    .doc-header-right strong { color: #000; }

    /* ── Titel ── */
    .doc-title { font-size: 11pt; font-weight: bold; text-align: center; color: ${ROT}; margin: 12px 0 4px 0; }
    .doc-subtitle { font-size: 13pt; font-weight: bold; text-align: center; margin: 0 0 16px 0; }

    /* ── Paragraphen ── */
    .section { font-weight: bold; margin-top: 12px; margin-bottom: 4px; padding-left: 3px; border-left: 3px solid ${ROT}; page-break-after: avoid; break-after: avoid; }
    .p { margin-bottom: 6px; }
    .avoid { page-break-inside: avoid; }
    .break { page-break-before: always; }

    /* ── Tabellen ── */
    table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 6px; }
    .info-table td { padding: 2px 0; vertical-align: top; }
    .info-table td:first-child { width: 155px; color: ${DUNKELGRAU}; }

    /* ── Parteien-Blöcke ── */
    .party-block { background: ${HELLGRAU}; border-left: 3px solid ${ROT}; padding: 8px 10px; margin-bottom: 10px; line-height: 1.65; }
    .party-label { text-align: right; font-style: italic; color: ${DUNKELGRAU}; font-size: 8.5pt; margin-top: 4px; }

    /* ── Unterschriften ── */
    .sig-table { width: 100%; margin-top: 24px; border-collapse: collapse; }
    .sig-cell { width: 45%; text-align: center; vertical-align: bottom; padding: 0 8px; }
    .sig-line { border-top: 1px solid #000; padding-top: 4px; font-size: 8pt; margin-top: 4px; }

    /* ── Footer-Zeile ── */
    .doc-footer-line { margin-top: 18px; font-size: 7pt; color: #999; text-align: center; border-top: 1px solid #ccc; padding-top: 6px; }
  </style></head><body>

  <!-- Header mit Logo und Auftragsnr -->
  <div class="doc-header">
    <div class="doc-header-left">
      ${logoHtml}
      <div class="doc-header-org">${kvName}</div>
    </div>
    <div class="doc-header-right">
      Auftragsnr: <strong>${esc(ev.auftragsnr||"—")}</strong>
    </div>
  </div>

  <!-- Dokumenttitel -->
  <div class="doc-title">Vereinbarung zur sanitätsdienstlichen Absicherung der Veranstaltung:</div>
  <div class="doc-subtitle">${esc(ev.name||"[Veranstaltung]")}</div>

  <!-- BRK-Partei -->
  <div style="margin-bottom:6px">Zwischen dem <strong>Bayerischen Roten Kreuz, ${kvName}</strong><br>vertreten durch:</div>
  <div class="party-block avoid">
    <strong>${kgf}</strong><br>
    Kreisgeschäftsführer<br>
    ${kvAdresse}<br>
    ${kvPlzOrt}
    <div class="party-label">- nachstehend "BRK" genannt -</div>
  </div>

  <!-- Veranstalter-Partei -->
  <div style="margin-bottom:6px">und der Firma / Organisation / Verein: <strong>${esc(ev.veranstalter||ev.rechnungsempfaenger||"[Veranstalter]")}</strong><br>vertreten durch:</div>
  <div class="party-block avoid">
    <strong>${esc(ev.rechnungsempfaenger||ev.veranstalter||"")}</strong><br>
    ${ev.ansprechpartner?esc(ev.ansprechpartner)+"<br>":""}${esc(ev.reStrasse||"")}<br>
    ${esc(ev.rePlzOrt||"")}
    <div class="party-label">- nachstehend "Veranstalter" genannt -</div>
  </div>

  <div class="p">wird folgende Vereinbarung getroffen:</div>

  <!-- §1 -->
  <div class="avoid">
    <div class="section">§1 Vertragsgegenstand</div>
    <div class="p">Der Veranstalter führt die nachfolgende Veranstaltung durch:</div>
    <table class="info-table"><tbody>
      <tr><td>Zu betreuende Veranstaltung:</td><td><strong>${esc(ev.name||"")}</strong></td></tr>
      <tr><td>Veranstaltungsort:</td><td>${esc(ev.ort||"")}${ev.adresse?", "+esc(ev.adresse):""}</td></tr>
    </tbody></table>
    <div class="p" style="color:${DUNKELGRAU}">Veranstaltungsdauer:</div>
    <table><tbody>${dayRows}</tbody></table>
    <table class="info-table"><tbody>
      <tr><td>Erwartete Teilnehmer:</td>${besucherCells}</tr>
      <tr><td>Behördliche Auflagen:</td><td colspan="8">${esc(ev.auflagen||"keine")}</td></tr>
      <tr><td>Risiken / Pol. Erkenntnisse:</td><td colspan="8">${days.some(d=>d.polizeiRisiko)?"ja":"nein"}</td></tr>
      <tr><td>Beteiligung Prominenter:</td><td colspan="8">${days.reduce((s,d)=>s+(d.prominente||0),0)}</td></tr>
    </tbody></table>
  </div>

  <!-- §2 -->
  <div style="page-break-inside:avoid;break-inside:avoid">
  <div class="section">§2 Verpflichtung des BRK</div>
  <div class="p avoid">1. Das BRK verpflichtet sich, nach Maßgabe dieser Vereinbarung einschließlich Anlagen die vorstehende Veranstaltung sanitätsdienstlich abzusichern. Hierzu stellt das BRK geeignetes Personal und die erforderliche Ausrüstung. Anzahl und Qualifikation des eingesetzten Personals, die erforderliche Ausstattung und Ausrüstung sowie die Bereitstellungszeiten richten sich nach Anlage 1, die Bestandteil dieser Vereinbarung ist.</div>
  </div><!-- §2 header+first grouped -->
  <div class="p avoid">2. Das BRK ist gegenüber den Besuchern der Veranstaltung, die einer sanitätsdienstlichen Betreuung bedürfen (Patienten) verpflichtet, die sanitätsdienstliche Hilfe zu erbringen. Die Patienten haben gegen das BRK einen unmittelbaren Anspruch auf diese Leistungen. Die Leistungen werden vom Veranstalter gem. §5 dieses Vertrages vergütet. Die vorliegende Vereinbarung ist somit ein Vertrag zugunsten Dritter.</div>
  <div class="p avoid">3. Die medizinische Versorgung und der Transport von Notfallpatienten im Sinne des Art. 2 Abs. 2 BayRDG ist nicht Gegenstand dieser Vereinbarung. Soweit Versorgung und/oder Transport von Notfallpatienten erforderlich ist, wird dies durch die Rettungsleitstelle/Integrierte Leitstelle Ingolstadt gemäß Art. 9 BayRDG erledigt. Das BRK wird zur Erstversorgung der Patienten tätig, bis ein Rettungsmittel des öffentlich-rechtlichen Rettungsdienstes eingetroffen ist.</div>
  <div class="p avoid">4. Die Verpflichtungen in den Ziffern 1-3 dieses Abschnitts beschränken sich (auch gegenüber dritten) auf eine sanitätsdienstliche Absicherung, die im Regelfall nach billigem Ermessen des BRK auf der Grundlage der mitgeteilten Daten des Veranstalters (§§ 1, 3 Abs. 1) voraussichtlich als angemessen zu erwarten ist. Das BRK behält sich für den Katastrophenfall (auch außerhalb der Veranstaltung) nach dem BayKSG vor, Einsatzkräfte nach billigem Ermessen unter Beachtung der Verhältnismäßigkeit und den Anforderungen des BayKSG jederzeit von der Veranstaltung abzuziehen. Hierüber ist der Veranstalter unverzüglich zu unterrichten. In diesem Falle vermindert sich das nach §4 zu entrichtende Entgelt anteilig im Verhältnis der abgezogenen Einsatzkräfte.</div>
  <div class="p avoid">5. Das BRK übernimmt keinerlei Aufgaben der Veranstaltungsorganisation und -durchführung. Sämtliche Aufgaben der Veranstaltungsorganisation und -durchführung obliegen allein dem Veranstalter.</div>

  <div class="avoid">
    <div class="section">§ 2a Bereitstellung von Ärzten (soweit im Einzelfall erforderlich)</div>
    <div class="p" style="padding-left:16px">Das BRK stellt dem Veranstalter im Rahmen der sanitätsdienstlichen Absicherung <strong>${days.reduce((s,d)=>s+(d.oAerzte||0),0)}</strong> Ärzte zur Verfügung.</div>
    <div class="p" style="padding-left:16px">Die Einzelheiten der Bereitstellung und die Kostenerstattung sind in Anlage 3 geregelt, die Bestandteil dieser Vereinbarung ist.</div>
  </div>

  <!-- §3 neue Seite -->
  <div style="page-break-inside:avoid;break-inside:avoid">
  <div class="section">§ 3 Verpflichtung des Veranstalters</div>

  </div><!-- §3 header+first grouped -->
  <div class="p avoid">1. Der Veranstalter informiert das BRK rechtzeitig und vollständig über alle Umstände, die für die Planung des sanitätsdienstlichen Einsatzes erforderlich sind. Dies sind insbesondere:
    <div style="padding-left:18px;margin-top:3px;color:${DUNKELGRAU}">· Erwartete Teilnehmerzahl<br>· Erwartete Zuschauer- bzw. Besucherzahl<br>· Erwartete Personen mit erhöhtem Sicherheitsrisiko (VIP)<br>· Besondere oder aus früheren Veranstaltungen bekannte Risiken der Veranstaltung<br>· Risikoschwerpunkte<br>· Streckenverlauf einschließlich Standort der Streckenposten des Veranstalters<br>· Zu- und Abwege zur Veranstaltung einschließlich Rettungswege<br>· Veranstaltungsdauer einschl. Vor- und Nachlaufzeiten</div>
  </div>
  <div class="p avoid">2. Der Veranstalter stellt während der gesamten Veranstaltung und in angemessene Zeit vorher und nachher einen gesicherten Kommunikationsweg zwischen dem BRK und einer verantwortlichen Person des Veranstalters sicher (z.B. Festnetz- oder gesicherte Mobilnetzverbindung, Funkverbindung über Veranstaltungsfunk, etc.). Soweit vom Veranstalter ein Sicherheitsdienst für die Veranstaltung eingesetzt wird, ist auch die ständige Kommunikation zum Sicherheitsdienst sicherzustellen.</div>
  <div class="p avoid">3. Der Veranstalter stellt dem BRK die für den Sanitätswachdienst erforderlichen Stellflächen gemäß im Vorfeld zu treffender Abstimmung zur Verfügung und stellt die notwendige Strom- und Wasserversorgung sicher.</div>
  <div class="p avoid">4. Der Veranstalter informiert das BRK während des Verlaufes der Veranstaltung über alle Vorkommnisse und Ereignisse, die für die sanitätsdienstliche Absicherung und etwaige rettungsdienstliche Einsätze von Bedeutung sind.</div>
  <div class="p avoid">5. Der Veranstalter verpflichtet sich, das BRK bei rettungs- oder sanitätsdienstlichen Einsätzen nach Kräften zu unterstützen. Dies gilt insbesondere für die Sperrung und/oder Freihaltung von Zu- und Abfahrtswegen, soweit notwendig auch die Unterbrechung der Veranstaltung bis zum Abschluss von Rettungsmaßnahmen, die Zurverfügungstellung von Fahrzeugen, Personal und Kommunikationsmitteln, soweit diese vorhanden sind und vom BRK benötigt werden.</div>
  <div class="p avoid">6. Der Veranstalter verpflichtet sich ferner, dem BRK alle etwaigen Auflagen von Genehmigungsbehörden oder sonstigen Behörden und Organisationen, die die Veranstaltung betreffen, rechtzeitig und vollständig bekannt zu geben.</div>

  <div class="avoid">
    <div class="section">§4 Vergütung</div>
    <div class="p">Der Veranstalter verpflichtet sich, an das BRK für die sanitätsdienstliche Absicherung der Veranstaltung ein Entgelt zu entrichten. Die Vergütung und die Abrechnungsmodalitäten sind im Einzelnen in Anlage 2 geregelt, die Bestandteil dieser Vereinbarung ist.</div>
  </div>
  <div class="avoid">
    <div class="section">§5 Haftung</div>
    <div class="p">Die Haftung des BRK aus dieser Vereinbarung wird auf Vorsatz und grobe Fahrlässigkeit beschränkt.</div>
  </div>
  <div class="avoid">
    <div class="section">§6 Allgemeine Regeln</div>
    <div class="p">Änderungen oder Ergänzungen dieser Vereinbarung bedürfen der Schriftform. Mündliche Nebenabreden sind nicht getroffen worden.</div>
    <div class="p">Soweit eine der Regelungen dieser Vereinbarung unwirksam ist oder wird, berührt dies nicht die Wirksamkeit der Vereinbarung insgesamt. In diesem Fall verpflichten sich die Parteien, die unwirksame Regelung durch eine wirksame zu ersetzen, die dem wirtschaftlichen Zweck der unwirksamen Regelung möglichst nahe kommt.</div>
  </div>

  <!-- Unterschriften (gleiche Hoehe) -->
  <table class="sig-table avoid">
    <tr>
      <td class="sig-cell">
        <div style="font-size:9pt;margin-bottom:4px">${ort}, ${today}</div>
        <div class="sig-line" style="color:${DUNKELGRAU}">Ort, Datum</div>
      </td>
      <td style="width:10%"></td>
      <td class="sig-cell">
        <div style="font-size:9pt;margin-bottom:4px">&nbsp;</div>
        <div class="sig-line" style="color:${DUNKELGRAU}">Ort, Datum</div>
      </td>
    </tr>
    <tr><td colspan="3" style="height:12px"></td></tr>
    <tr>
      <td class="sig-cell" style="vertical-align:bottom">
        <div style="height:49px;position:relative">
          ${unterschriftHtml}
        </div>
        <div class="sig-line">
          <strong style="font-size:9pt">${unterzeichner}</strong><br>
          <span style="color:${DUNKELGRAU};font-size:7.5pt">${titel}</span>
        </div>
      </td>
      <td style="width:10%"></td>
      <td class="sig-cell" style="vertical-align:bottom">
        <div style="height:49px"></div>
        <div class="sig-line" style="color:${DUNKELGRAU}">Unterschrift Veranstalter</div>
        <div style="height:30px"></div>
        <div class="sig-line" style="color:${DUNKELGRAU}">Name in Druckbuchstaben</div>
      </td>
    </tr>
  </table>

  <div class="doc-footer-line" style="margin-top:14px;border-top:1px solid #ccc;padding-top:5px;font-size:7.5pt;color:#999">${unterzeichner} · BRK ${kvName} · ${kvAdresse}, ${kvPlzOrt}</div>
  </body></html>`;
}


// ═══════════════════════════════════════════════════════════════════
// PDF: Gefahrenanalyse (serverseitig)
// ═══════════════════════════════════════════════════════════════════
app.post("/api/pdf/gefahren/:id", requireAuth, async (req, res) => {
  // puppeteer via BrowserPool
  try {
    const db = require("./db").getDb();
    const row = db.prepare("SELECT data FROM vorgaenge WHERE id=?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Vorgang nicht gefunden" });
    const vorgang = JSON.parse(row.data);
    const stamm = db.prepare("SELECT * FROM bereitschaften WHERE code=?").get(req.session.user.bereitschaftCode) || {};
    const { dayCalcs, activeDays } = req.body;
    if (!dayCalcs || !dayCalcs.length) return res.status(400).json({ error: "Keine Tage vorhanden" });
    const html = buildGefahrenHTML(vorgang.event || {}, activeDays || [], dayCalcs, stamm);


    const pdf = await BrowserPool.renderPDF(html, { marginTop: "20mm", marginLeft: "12mm", header: `<div style="width:100%;padding:2mm 12mm 0;font-family:Arial,sans-serif;font-size:7.5pt;color:#888;display:flex;justify-content:space-between"><span>Gefahrenanalyse</span><span>${(vorgang.event?.auftragsnr||"").replace(/"/g,"&quot;")}</span></div>`, footer: `<div style="width:100%;padding:0 12mm;font-family:Arial,sans-serif;font-size:7pt;color:#999;display:flex;justify-content:space-between;border-top:0.5px solid #ddd;padding-top:2mm"><span>Gefahrenanalyse · Anlage 1 zur Vereinbarung SanWD</span><span>${(vorgang.event?.auftragsnr||"").replace(/"/g,"&quot;")}</span><span>Seite <span class="pageNumber"></span>/<span class="totalPages"></span></span></div>` });

    const nr = (vorgang.event?.auftragsnr || req.params.id).replace(/[^a-zA-Z0-9_-]/g,"_");
    res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${nr}_Gefahrenanalyse.pdf"` });
    res.send(pdf);
    ncAutoUpload(req, req.params.id, `${nr}_Gefahrenanalyse.pdf`, pdf, stamm);
  } catch(e) { console.error("Gefahren PDF:", e); res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════
// PDF: Angebot (serverseitig)
// ═══════════════════════════════════════════════════════════════════
app.post("/api/pdf/angebot/:id", requireAuth, async (req, res) => {
  // puppeteer via BrowserPool
  try {
    const db = require("./db").getDb();
    const row = db.prepare("SELECT data FROM vorgaenge WHERE id=?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Vorgang nicht gefunden" });
    const vorgang = JSON.parse(row.data);
    const stamm = db.prepare("SELECT * FROM bereitschaften WHERE code=?").get(req.session.user.bereitschaftCode) || {};
    const kosten = db.prepare("SELECT * FROM kostensaetze WHERE bereitschaft_code=?").get(req.session.user.bereitschaftCode) || {};
    const user = db.prepare("SELECT name, titel, ort, email, telefon, mobil, unterschrift FROM users WHERE sub=?").get(req.session.user.sub) || {};
    const { dayCalcs, totalCosts, activeDays } = req.body;
    const html = buildAngebotHTML(vorgang.event || {}, dayCalcs || [], totalCosts || 0, activeDays || [], stamm, kosten, user);


    const pdf = await BrowserPool.renderPDF(html, { marginTop: "20mm", marginLeft: "12mm", header: `<div style="width:100%;padding:2mm 12mm 0;font-family:Arial,sans-serif;font-size:7.5pt;color:#888;display:flex;justify-content:space-between"><span>Fortsetzung Angebot</span><span>${(vorgang.event?.auftragsnr||"").replace(/"/g,"&quot;")}</span></div>`, footer: `<div style="width:100%;padding:0 12mm;font-family:Arial,sans-serif;font-size:7pt;color:#999;display:flex;justify-content:space-between;border-top:0.5px solid #ddd;padding-top:2mm"><span>BRK Sanitätswachdienst · Kostenaufstellung</span><span>${(vorgang.event?.auftragsnr||"").replace(/"/g,"&quot;")}</span><span>Seite <span class="pageNumber"></span>/<span class="totalPages"></span></span></div>` });

    const nr = (vorgang.event?.auftragsnr || req.params.id).replace(/[^a-zA-Z0-9_-]/g,"_");
    res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${nr}_Angebot.pdf"` });
    res.send(pdf);
    ncAutoUpload(req, req.params.id, `${nr}_Angebot.pdf`, pdf, stamm);
  } catch(e) { console.error("Angebot PDF:", e); res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════
// PDF: AAB (serverseitig)
// ═══════════════════════════════════════════════════════════════════
app.post("/api/pdf/aab/:id", requireAuth, async (req, res) => {
  // puppeteer via BrowserPool
  try {
    const db = require("./db").getDb();
    const row = db.prepare("SELECT data FROM vorgaenge WHERE id=?").get(req.params.id);
    const vorgang = row ? JSON.parse(row.data) : {};
    const stamm = db.prepare("SELECT * FROM bereitschaften WHERE code=?").get(req.session.user.bereitschaftCode) || {};
    const klauseln = db.prepare("SELECT id, titel, inhalt, reihenfolge FROM klauseln WHERE dokument='aab' ORDER BY reihenfolge").all();
    const html = buildAABHTML(stamm, req.session.user.bereitschaftCode, klauseln, vorgang.event?.auftragsnr||'');


    const pdf = await BrowserPool.renderPDF(html, { marginTop: "20mm", marginLeft: "12mm", header: `<div style="width:100%;padding:2mm 12mm 0;font-family:Arial,sans-serif;font-size:7.5pt;color:#888;display:flex;justify-content:space-between"><span>Allgemeine Auftragsbedingungen</span><span>${(vorgang.event?.auftragsnr||"").replace(/"/g,"&quot;")}</span></div>`, footer: `<div style="width:100%;padding:0 12mm;font-family:Arial,sans-serif;font-size:7pt;color:#999;display:flex;justify-content:space-between;border-top:0.5px solid #ddd;padding-top:2mm"><span>Allgemeine Auftragsbedingungen · Anlage 3 zur Vereinbarung SanWD</span><span>${(vorgang.event?.auftragsnr||"").replace(/"/g,"&quot;")}</span><span>Seite <span class="pageNumber"></span>/<span class="totalPages"></span></span></div>` });

    const nr = (vorgang.event?.auftragsnr || "AAB").replace(/[^a-zA-Z0-9_-]/g,"_");
    res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${nr}_AAB.pdf"` });
    res.send(pdf);
    ncAutoUpload(req, req.params.id, `${nr}_AAB.pdf`, pdf, stamm);
  } catch(e) { console.error("AAB PDF:", e); res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════
// PDF: Angebotsmappe (Gefahren + Angebot + AAB + Vertrag) – MERGED
// ═══════════════════════════════════════════════════════════════════
app.post("/api/pdf/mappe/:id", requireAuth, async (req, res) => {
  // puppeteer via BrowserPool
  // pdf-lib nicht mehr noetig - Single-Render
  try {
    const db = require("./db").getDb();
    const row = db.prepare("SELECT data FROM vorgaenge WHERE id=?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Vorgang nicht gefunden" });
    const vorgang = JSON.parse(row.data);
    const stamm = db.prepare("SELECT * FROM bereitschaften WHERE code=?").get(req.session.user.bereitschaftCode) || {};
    const user = db.prepare("SELECT name, titel, ort, email, telefon, mobil, unterschrift FROM users WHERE sub=?").get(req.session.user.sub) || {};
    const klauselnAAB = db.prepare("SELECT id, titel, inhalt, reihenfolge FROM klauseln WHERE dokument='aab' ORDER BY reihenfolge").all();
    const { dayCalcs, totalCosts, activeDays } = req.body;

    const browser = await BrowserPool.get();
    const footerTpl = `<div style="width:100%;padding:0 12mm;font-family:Arial,sans-serif;font-size:7pt;color:#999;display:flex;justify-content:space-between;border-top:0.5px solid #ddd;padding-top:2mm"><span>Angebotsmappe · BRK Sanitätswachdienst</span><span>${(vorgang.event?.auftragsnr||"").replace(/"/g,"&quot;")}</span><span>Seite <span class="pageNumber"></span>/<span class="totalPages"></span></span></div>`;
    const headerTpl = `<div style="width:100%;padding:2mm 12mm 0;font-family:Arial,sans-serif;font-size:7.5pt;color:#888;display:flex;justify-content:space-between"><span>Angebotsmappe · BRK Sanitätswachdienst</span><span>${(vorgang.event?.auftragsnr||"").replace(/"/g,"&quot;")}</span></div>`;
    const pdfOpts = (marginLeft="12mm") => ({ format: "A4", margin: { top: "18mm", right: "12mm", bottom: "20mm", left: marginLeft }, displayHeaderFooter: true, headerTemplate: headerTpl, footerTemplate: footerTpl, printBackground: true });

    const renderHTML = async (html, ml="12mm") => {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "domcontentloaded" });
      const pdf = await page.pdf(pdfOpts(ml));
      await page.close();
      return pdf;
    };

    // Dokument-Auswahl per Query-Parameter
    const include = {
      deckblatt: req.query.skipDeckblatt !== "1",
      angebot: req.query.skipAngebot !== "1",
      vertrag: req.query.skipVertrag !== "1",
      aab: req.query.skipAAB !== "1",
      gefahren: req.query.skipGefahren !== "1",
    };

    // Alle HTML-Teile vorbereiten und zu einem Dokument kombinieren
    const deckblattHTML = buildDeckblattHTML(vorgang.event || {}, activeDays || [], stamm, user, include);
    const angebotHTML = buildAngebotHTML(vorgang.event || {}, dayCalcs || [], totalCosts || 0, activeDays || [], stamm, {}, user);
    const vertragHTML = buildVertragHTML(vorgang, stamm, user);
    const aabHTML = buildAABHTML(stamm, req.session.user.bereitschaftCode, klauselnAAB, vorgang.event?.auftragsnr||'');
    const gefahrenHTML = (include.gefahren && dayCalcs && dayCalcs.length > 0) ? buildGefahrenHTML(vorgang.event || {}, activeDays || [], dayCalcs, stamm) : null;

    // Body-Inhalt aus jedem HTML extrahieren
    const extractBody = (html) => {
      const m = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      return m ? m[1] : html;
    };

    // Kombiniertes HTML mit Seitenumbruechen
    const combinedHTML = `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><style>
      *{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;font-size:10pt;color:#000}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
        .page-break{page-break-before:always;break-before:page}
        .no-break{page-break-inside:avoid!important;break-inside:avoid!important}
        tr{page-break-inside:avoid;break-inside:avoid}
      }
      .doc-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #c0392b}
      .doc-header-left{display:flex;align-items:center;gap:8px}
      .doc-header-org{font-size:8pt;color:#555;margin-top:3px}
      .doc-header-right{text-align:right;font-size:8pt;color:#555}
      .doc-header-right strong{color:#000}
      .doc-title{font-size:11pt;font-weight:bold;text-align:center;color:#c0392b;margin:12px 0 4px}
      .doc-subtitle{font-size:13pt;font-weight:bold;text-align:center;margin:0 0 16px}
      .section{font-weight:bold;margin-top:12px;margin-bottom:4px;padding-left:3px;border-left:3px solid #c0392b;page-break-after:avoid;break-after:avoid}
      .p{margin-bottom:6px}
      .avoid{page-break-inside:avoid}
      .break{page-break-before:always}
      table{width:100%;border-collapse:collapse;font-size:9pt;margin-bottom:6px}
      .info-table td{padding:2px 0;vertical-align:top}
      .info-table td:first-child{width:155px;color:#555}
      .party-block{background:#f5f5f5;border-left:3px solid #c0392b;padding:8px 10px;margin-bottom:10px;line-height:1.65}
      .party-label{text-align:right;font-style:italic;color:#555;font-size:8.5pt;margin-top:4px}
      .sig-table{width:100%;margin-top:24px;border-collapse:collapse}
      .sig-cell{width:45%;text-align:center;vertical-align:bottom;padding:0 8px}
      .sig-line{border-top:1px solid #000;padding-top:4px;font-size:8pt;margin-top:4px}
    </style></head><body>
      ${include.deckblatt ? '<div class="mappe-section">' + extractBody(deckblattHTML) + '</div>' : ''}
      ${include.angebot ? '<div class="mappe-section' + (include.deckblatt ? ' page-break' : '') + '">' + extractBody(angebotHTML) + '</div>' : ''}
      ${include.vertrag ? '<div class="mappe-section page-break">' + extractBody(vertragHTML) + '</div>' : ''}
      ${include.aab ? '<div class="mappe-section page-break">' + extractBody(aabHTML) + '</div>' : ''}
      ${gefahrenHTML ? '<div class="mappe-section page-break">' + extractBody(gefahrenHTML) + '</div>' : ''}
    </body></html>`;

    // EIN EINZIGER PDF-Render
    const result = await renderHTML(combinedHTML);

    const nr = (vorgang.event?.auftragsnr || req.params.id).replace(/[^a-zA-Z0-9_-]/g,"_");
    const name = (vorgang.event?.name || "Veranstaltung").substring(0,30).replace(/[^a-zA-Z0-9_äöüÄÖÜß -]/g,"").replace(/ /g,"_");
    res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${nr}_${name}_Angebotsmappe.pdf"` });
    res.send(result);

    // Non-blocking Nextcloud Auto-Sync
    if (nextcloud.isConfigured()) {
      setImmediate(async () => {
        try {
          const syncResult = await nextcloud.syncVorgang(req.session, vorgang, [
            { filename: `${nr}_Angebotsmappe.pdf`, data: result }
          ], stamm);
          if (syncResult.success) {
            const freshRow = db.prepare("SELECT data FROM vorgaenge WHERE id=?").get(req.params.id);
            if (freshRow) {
              const d = JSON.parse(freshRow.data);
              d.nextcloudSync = { syncedAt: syncResult.syncedAt, folder: syncResult.folder, files: syncResult.results.map(r=>r.file), syncedBy: req.session.user.name };
              db.prepare("UPDATE vorgaenge SET data = ? WHERE id = ?").run(JSON.stringify(d), req.params.id);
            }
          }
        } catch(e) { console.error("Nextcloud Auto-Sync:", e.message); }
      });
    }
  } catch(e) { console.error("Mappe PDF:", e); res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════
// HTML Builder: Gefahrenanalyse
// ═══════════════════════════════════════════════════════════════════
function buildEinsatzprotokollHTML(vorgang, stamm, dayIdx) {
  const ev = vorgang.event || vorgang;
  const allDays = (vorgang.days || []).filter(d => d.active !== false);
  const day = dayIdx !== undefined ? allDays[dayIdx] : allDays[0];
  const proto = (vorgang.protokoll || {})[String(dayIdx !== undefined ? dayIdx : 0)] || {};
  const esc = s => String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

  const fDate = d => {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString("de-DE", {weekday:"long", day:"2-digit", month:"2-digit", year:"numeric"});
  };

  const dayDate = day?.date ? fDate(day.date) : "";
  const dayTime = day ? `${day.startTime||""} - ${day.endTime||""}` : "";
  const dayLabel = dayDate || (day ? `Tag ${day.id||1}` : "");

  // Logo aus bereitschaften.logo (Binary → Base64)
  let logoImg;
  if (stamm.logo) {
    const b64 = Buffer.from(stamm.logo).toString("base64");
    logoImg = `<img src="data:image/png;base64,${b64}" style="max-width:200px;max-height:90px;object-fit:contain;" />`;
  } else {
    logoImg = `<div style="font-weight:bold;font-size:16px;text-align:center;">BRK<br/>Bereitschaft</div>`;
  }

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 13px; margin: 0; padding: 20px; color: #000; }
  table { width: 100%; border-collapse: collapse; }
  .header-table td { border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center; }
  .info-table td { padding: 4px 8px; vertical-align: top; }
  .sig-box { background: #d3d3d3; border: 1px solid #000; padding: 16px; text-align: center; height: 100%; }
  hr { border: none; border-top: 2px solid #000; margin: 12px 0; }
  .freitext-box { border: 1px solid #000; padding: 10px; margin-top: 4px; min-height: 50px; }
  .bemerkung-box { background: #d3d3d3; border: 1px solid #000; padding: 10px; margin-top: 4px; min-height: 120px; }
  strong { font-weight: bold; }
  @media print { body { margin: 0; padding: 12mm; } }
</style>
</head>
<body>
<table class="header-table">
<tr>
  <td style="width:33%;">${logoImg}</td>
  <td style="width:33%;font-size:18px;">
    <strong>Einsatzprotokoll</strong><br/>
    <span style="font-size:14px;">${esc(ev.auftragsnr||"")}</span>
  </td>
  <td style="width:33%;font-size:13px;">
    <strong>BRK Kreisverband Neuburg-Schrobenhausen</strong><br/>
    ${esc(stamm.name||"BRK Bereitschaft")}
  </td>
</tr>
</table>

<p>&nbsp;</p>

<table class="info-table">
<tr>
  <td style="width:50%;vertical-align:top;">
    <p><strong>Kunde:</strong> ${esc(ev.veranstalter||ev.rechnungsempfaenger||"")}, ${esc(ev.ansprechpartner||"")}</p>
    <p><strong>Veranstaltung:</strong> ${esc(ev.name||"")}</p>
    <p><strong>Ort:</strong> ${esc(ev.ort||"")}${ev.adresse?", "+esc(ev.adresse):""}</p>
    <p><strong>Datum:</strong> ${esc(dayLabel)}</p>
    <p><strong>Uhrzeit:</strong> ${esc(dayTime)}</p>
    <p><strong>Ansprechpartner vor Ort:</strong> ${esc(ev.ansprechpartner||"")}</p>
    <p><strong>Helferverpflegung:</strong> ${ev.verpflegung?"kostenfrei durch den Veranstalter":"Selbstverpflegung"}</p>
  </td>
  <td style="width:50%;vertical-align:top;">
    <div class="sig-box">
      <p><strong>Der Sanitätsdienst wurde korrekt durchgeführt:</strong></p>
      <p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p>
      <p>________________________________<br/>Unterschrift Veranstalter</p>
    </div>
  </td>
</tr>
</table>

<hr/>
<p><strong>tatsächliche Ankunftszeit Einsatzort:</strong> ____________</p>
<p><strong>tatsächliches Ende der Veranstaltung:</strong> ____________</p>
<p><strong>Einsatzleiter/in:</strong> ${esc(ev.ilsEL||"")}</p>
<p><strong>Einsatzkräfte:</strong> ${esc(proto.helfer || "_________________________________________")}</p>
<p><strong>Fahrzeuge:</strong> ${esc(proto.fahrzeuge || "_________________________________________")}</p>
<hr/>

<table class="info-table" style="margin-top:8px;">
<tr>
  <td style="width:50%;"><strong>Ankunft geplant:</strong> ${esc(proto.ankunftPlan || "____")}</td>
  <td style="width:50%;"><strong>Ankunft tatsächlich:</strong> ${esc(proto.ankunftReal || "____")}</td>
</tr>
<tr>
  <td><strong>Abfahrt geplant:</strong> ${esc(proto.abfahrtPlan || "____")}</td>
  <td><strong>Abfahrt tatsächlich:</strong> ${esc(proto.abfahrtReal || "____")}</td>
</tr>
</table>

<hr/>
<table class="info-table" style="margin-top:8px;">
<tr>
  <td style="width:33%;text-align:center;"><strong>Behandelt</strong><br/><span style="font-size:24px;font-weight:bold">${proto.behandelt||0}</span></td>
  <td style="width:33%;text-align:center;"><strong>Bagatelle</strong><br/><span style="font-size:24px;font-weight:bold">${proto.bagatelle||0}</span></td>
  <td style="width:33%;text-align:center;"><strong>Transport</strong><br/><span style="font-size:24px;font-weight:bold">${proto.transporte||0}</span></td>
</tr>
<tr>
  <td colspan="3" style="text-align:center;padding-top:8px;"><strong>Gesamt: ${(proto.behandelt||0)+(proto.bagatelle||0)+(proto.transporte||0)} Behandelte</strong></td>
</tr>
</table>

${(proto.tagebuch && proto.tagebuch.length > 0) ? `
<hr/>
<p><strong>Einsatztagebuch:</strong></p>
<table style="width:100%;border-collapse:collapse;font-size:12px;">
<tr style="background:#eee;"><th style="padding:4px 8px;text-align:left;border:1px solid #999;">Zeit</th><th style="padding:4px 8px;text-align:left;border:1px solid #999;">Eintrag</th><th style="padding:4px 8px;text-align:left;border:1px solid #999;">Autor</th></tr>
${proto.tagebuch.map(e => `<tr><td style="padding:4px 8px;border:1px solid #ccc;white-space:nowrap;">${esc(e.zeit)}</td><td style="padding:4px 8px;border:1px solid #ccc;">${esc(e.text)}</td><td style="padding:4px 8px;border:1px solid #ccc;font-size:10px;">${esc(e.autor)}</td></tr>`).join("")}
</table>` : ""}

<p style="margin-top:12px;"><strong>Besonderheiten:</strong></p>
<div class="bemerkung-box">${esc(proto.besonderheiten || ev.bemerkung || "")}</div>

</body>
</html>`;
}


// ═══════════════════════════════════════════════════════════════════
// PDF: Einsatzprotokoll (serverseitig via Puppeteer)
// ═══════════════════════════════════════════════════════════════════
app.post("/api/pdf/einsatzprotokoll/:id", requireAuth, async (req, res) => {
  // puppeteer via BrowserPool
  try {
    const db = require("./db").getDb();
    const row = db.prepare("SELECT data, bereitschaft_code FROM vorgaenge WHERE id=?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Vorgang nicht gefunden" });
    const vorgang = JSON.parse(row.data);
    const bc = row.bereitschaft_code || req.session.user.bereitschaftCode;
    const stamm = db.prepare("SELECT * FROM bereitschaften WHERE code=?").get(bc) || {};
    const user = db.prepare("SELECT name, titel, mobil, telefon FROM users WHERE sub=?").get(req.session.user.sub) || {};
    const { dayIdx } = req.body;
    const html = buildEinsatzprotokollHTML(vorgang, stamm, dayIdx !== undefined ? dayIdx : 0);
    const browser = await BrowserPool.get();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    const pdf = await page.pdf({
      format: "A4",
      margin: { top: "10mm", right: "12mm", bottom: "15mm", left: "12mm" },
      printBackground: true
    });
    // browser bleibt im Pool offen (pages werden in renderHTML geschlossen)
    const nr = (vorgang.event?.auftragsnr || req.params.id).replace(/[^a-zA-Z0-9_-]/g,"_");
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nr}_Einsatzprotokoll.pdf"`
    });
    res.send(pdf);
  } catch(e) {
    console.error("Einsatzprotokoll PDF:", e);
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// PDF: Angebot (serverseitig)
// ═══════════════════════════════════════════════════════════════════
app.post("/api/pdf/angebot/:id", requireAuth, async (req, res) => {
  // puppeteer via BrowserPool
  try {
    const db = require("./db").getDb();
    const row = db.prepare("SELECT data FROM vorgaenge WHERE id=?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Vorgang nicht gefunden" });
    const vorgang = JSON.parse(row.data);
    const stamm = db.prepare("SELECT * FROM bereitschaften WHERE code=?").get(req.session.user.bereitschaftCode) || {};
    const kosten = db.prepare("SELECT * FROM kostensaetze WHERE bereitschaft_code=?").get(req.session.user.bereitschaftCode) || {};
    const user = db.prepare("SELECT name, titel, ort, email, telefon, mobil, unterschrift FROM users WHERE sub=?").get(req.session.user.sub) || {};
    const { dayCalcs, totalCosts, activeDays } = req.body;
    const html = buildAngebotHTML(vorgang.event || {}, dayCalcs || [], totalCosts || 0, activeDays || [], stamm, kosten, user);


    const pdf = await BrowserPool.renderPDF(html, { marginTop: "20mm", marginLeft: "12mm", header: `<div style="width:100%;padding:2mm 12mm 0;font-family:Arial,sans-serif;font-size:7.5pt;color:#888;display:flex;justify-content:space-between"><span>Fortsetzung Angebot</span><span>${(vorgang.event?.auftragsnr||"").replace(/"/g,"&quot;")}</span></div>`, footer: `<div style="width:100%;padding:0 12mm;font-family:Arial,sans-serif;font-size:7pt;color:#999;display:flex;justify-content:space-between;border-top:0.5px solid #ddd;padding-top:2mm"><span>BRK Sanitätswachdienst · Kostenaufstellung</span><span>${(vorgang.event?.auftragsnr||"").replace(/"/g,"&quot;")}</span><span>Seite <span class="pageNumber"></span>/<span class="totalPages"></span></span></div>` });

    const nr = (vorgang.event?.auftragsnr || req.params.id).replace(/[^a-zA-Z0-9_-]/g,"_");
    res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${nr}_Angebot.pdf"` });
    res.send(pdf);
  } catch(e) { console.error("Angebot PDF:", e); res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════
// PDF: AAB (serverseitig)
// ═══════════════════════════════════════════════════════════════════
app.post("/api/pdf/aab/:id", requireAuth, async (req, res) => {
  // puppeteer via BrowserPool
  try {
    const db = require("./db").getDb();
    const row = db.prepare("SELECT data FROM vorgaenge WHERE id=?").get(req.params.id);
    const vorgang = row ? JSON.parse(row.data) : {};
    const stamm = db.prepare("SELECT * FROM bereitschaften WHERE code=?").get(req.session.user.bereitschaftCode) || {};
    const klauseln = db.prepare("SELECT id, titel, inhalt, reihenfolge FROM klauseln WHERE dokument='aab' ORDER BY reihenfolge").all();
    const html = buildAABHTML(stamm, req.session.user.bereitschaftCode, klauseln, vorgang.event?.auftragsnr||'');


    const pdf = await BrowserPool.renderPDF(html, { marginTop: "20mm", marginLeft: "12mm", header: `<div style="width:100%;padding:2mm 12mm 0;font-family:Arial,sans-serif;font-size:7.5pt;color:#888;display:flex;justify-content:space-between"><span>Allgemeine Auftragsbedingungen</span><span>${(vorgang.event?.auftragsnr||"").replace(/"/g,"&quot;")}</span></div>`, footer: `<div style="width:100%;padding:0 12mm;font-family:Arial,sans-serif;font-size:7pt;color:#999;display:flex;justify-content:space-between;border-top:0.5px solid #ddd;padding-top:2mm"><span>Allgemeine Auftragsbedingungen · Anlage 3 zur Vereinbarung SanWD</span><span>${(vorgang.event?.auftragsnr||"").replace(/"/g,"&quot;")}</span><span>Seite <span class="pageNumber"></span>/<span class="totalPages"></span></span></div>` });

    const nr = (vorgang.event?.auftragsnr || "AAB").replace(/[^a-zA-Z0-9_-]/g,"_");
    res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${nr}_AAB.pdf"` });
    res.send(pdf);
  } catch(e) { console.error("AAB PDF:", e); res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════
// PDF: Angebotsmappe (Gefahren + Angebot + AAB + Vertrag) – MERGED
// ═══════════════════════════════════════════════════════════════════
app.post("/api/pdf/mappe/:id", requireAuth, async (req, res) => {
  // puppeteer via BrowserPool
  // pdf-lib nicht mehr noetig - Single-Render
  try {
    const db = require("./db").getDb();
    const row = db.prepare("SELECT data FROM vorgaenge WHERE id=?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Vorgang nicht gefunden" });
    const vorgang = JSON.parse(row.data);
    const stamm = db.prepare("SELECT * FROM bereitschaften WHERE code=?").get(req.session.user.bereitschaftCode) || {};
    const user = db.prepare("SELECT name, titel, ort, email, telefon, mobil, unterschrift FROM users WHERE sub=?").get(req.session.user.sub) || {};
    const klauselnAAB = db.prepare("SELECT id, titel, inhalt, reihenfolge FROM klauseln WHERE dokument='aab' ORDER BY reihenfolge").all();
    const { dayCalcs, totalCosts, activeDays } = req.body;

    const browser = await BrowserPool.get();
    const footerTpl = `<div style="width:100%;padding:0 12mm;font-family:Arial,sans-serif;font-size:7pt;color:#999;display:flex;justify-content:space-between;border-top:0.5px solid #ddd;padding-top:2mm"><span>Angebotsmappe · BRK Sanitätswachdienst</span><span>${(vorgang.event?.auftragsnr||"").replace(/"/g,"&quot;")}</span><span>Seite <span class="pageNumber"></span>/<span class="totalPages"></span></span></div>`;
    const headerTpl = `<div style="width:100%;padding:2mm 12mm 0;font-family:Arial,sans-serif;font-size:7.5pt;color:#888;display:flex;justify-content:space-between"><span>Angebotsmappe · BRK Sanitätswachdienst</span><span>${(vorgang.event?.auftragsnr||"").replace(/"/g,"&quot;")}</span></div>`;
    const pdfOpts = (marginLeft="12mm") => ({ format: "A4", margin: { top: "18mm", right: "12mm", bottom: "20mm", left: marginLeft }, displayHeaderFooter: true, headerTemplate: headerTpl, footerTemplate: footerTpl, printBackground: true });

    const renderHTML = async (html, ml="12mm") => {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "domcontentloaded" });
      const pdf = await page.pdf(pdfOpts(ml));
      await page.close();
      return pdf;
    };

    // Dokument-Auswahl per Query-Parameter
    const include = {
      deckblatt: req.query.skipDeckblatt !== "1",
      angebot: req.query.skipAngebot !== "1",
      vertrag: req.query.skipVertrag !== "1",
      aab: req.query.skipAAB !== "1",
      gefahren: req.query.skipGefahren !== "1",
    };

    // Alle HTML-Teile vorbereiten und zu einem Dokument kombinieren
    const deckblattHTML = buildDeckblattHTML(vorgang.event || {}, activeDays || [], stamm, user, include);
    const angebotHTML = buildAngebotHTML(vorgang.event || {}, dayCalcs || [], totalCosts || 0, activeDays || [], stamm, {}, user);
    const vertragHTML = buildVertragHTML(vorgang, stamm, user);
    const aabHTML = buildAABHTML(stamm, req.session.user.bereitschaftCode, klauselnAAB, vorgang.event?.auftragsnr||'');
    const gefahrenHTML = (include.gefahren && dayCalcs && dayCalcs.length > 0) ? buildGefahrenHTML(vorgang.event || {}, activeDays || [], dayCalcs, stamm) : null;

    // Body-Inhalt aus jedem HTML extrahieren
    const extractBody = (html) => {
      const m = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      return m ? m[1] : html;
    };

    // Kombiniertes HTML mit Seitenumbruechen
    const combinedHTML = `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><style>
      *{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;font-size:10pt;color:#000}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
        .page-break{page-break-before:always;break-before:page}
        .no-break{page-break-inside:avoid!important;break-inside:avoid!important}
        tr{page-break-inside:avoid;break-inside:avoid}
      }
      .doc-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #c0392b}
      .doc-header-left{display:flex;align-items:center;gap:8px}
      .doc-header-org{font-size:8pt;color:#555;margin-top:3px}
      .doc-header-right{text-align:right;font-size:8pt;color:#555}
      .doc-header-right strong{color:#000}
      .doc-title{font-size:11pt;font-weight:bold;text-align:center;color:#c0392b;margin:12px 0 4px}
      .doc-subtitle{font-size:13pt;font-weight:bold;text-align:center;margin:0 0 16px}
      .section{font-weight:bold;margin-top:12px;margin-bottom:4px;padding-left:3px;border-left:3px solid #c0392b;page-break-after:avoid;break-after:avoid}
      .p{margin-bottom:6px}
      .avoid{page-break-inside:avoid}
      .break{page-break-before:always}
      table{width:100%;border-collapse:collapse;font-size:9pt;margin-bottom:6px}
      .info-table td{padding:2px 0;vertical-align:top}
      .info-table td:first-child{width:155px;color:#555}
      .party-block{background:#f5f5f5;border-left:3px solid #c0392b;padding:8px 10px;margin-bottom:10px;line-height:1.65}
      .party-label{text-align:right;font-style:italic;color:#555;font-size:8.5pt;margin-top:4px}
      .sig-table{width:100%;margin-top:24px;border-collapse:collapse}
      .sig-cell{width:45%;text-align:center;vertical-align:bottom;padding:0 8px}
      .sig-line{border-top:1px solid #000;padding-top:4px;font-size:8pt;margin-top:4px}
    </style></head><body>
      ${include.deckblatt ? '<div class="mappe-section">' + extractBody(deckblattHTML) + '</div>' : ''}
      ${include.angebot ? '<div class="mappe-section' + (include.deckblatt ? ' page-break' : '') + '">' + extractBody(angebotHTML) + '</div>' : ''}
      ${include.vertrag ? '<div class="mappe-section page-break">' + extractBody(vertragHTML) + '</div>' : ''}
      ${include.aab ? '<div class="mappe-section page-break">' + extractBody(aabHTML) + '</div>' : ''}
      ${gefahrenHTML ? '<div class="mappe-section page-break">' + extractBody(gefahrenHTML) + '</div>' : ''}
    </body></html>`;

    // EIN EINZIGER PDF-Render
    const result = await renderHTML(combinedHTML);

    const nr = (vorgang.event?.auftragsnr || req.params.id).replace(/[^a-zA-Z0-9_-]/g,"_");
    const name = (vorgang.event?.name || "Veranstaltung").substring(0,30).replace(/[^a-zA-Z0-9_äöüÄÖÜß -]/g,"").replace(/ /g,"_");
    res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${nr}_${name}_Angebotsmappe.pdf"` });
    res.send(result);
  } catch(e) { console.error("Mappe PDF:", e); res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════
// HTML Builder: Gefahrenanalyse
// ═══════════════════════════════════════════════════════════════════
function buildGefahrenHTML(ev, activeDays, dayCalcs, stamm) {
  stamm = stamm || {};
  const ROT = "#c0392b";
  const esc = s => (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const fDate = s => s ? new Date(s).toLocaleDateString("de-DE") : "";
  const kvName = (stamm.kv_name || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const berName = (stamm.name || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const logoB64 = stamm.logo ? Buffer.from(stamm.logo).toString("base64") : null;
  const logoHtml = logoB64 ? `<img src="data:image/png;base64,${logoB64}" style="height:40px;width:auto">` : `<span style="color:${ROT};font-size:16pt;font-weight:bold">+</span>`;

  const pages = (activeDays||[]).map((day, i) => {
    const calc = dayCalcs[i] || {};
    const risk = calc.risk || {};
    const rec = calc.rec || {};
    const riskItems = [
      ["Auflagen", risk.ap], ["Fläche", risk.fp], ["Besucher", risk.bp],
      ["Zwischensumme", risk.zw], ["Faktor", risk.factor ? "×"+risk.factor : ""],
      ["Risikopunkte", risk.ro?.toFixed(1)], ["Prominente", "+"+risk.pp], ["Polizei", "+"+risk.pol]
    ].filter(([,v]) => v !== undefined && v !== null);

    return `<div class="pdf-page" style="font-family:Arial,sans-serif;font-size:9pt;color:#000;padding:15mm 10mm;page-break-after:${i < activeDays.length-1 ? 'always' : 'auto'}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
        <div style="display:flex;align-items:center;gap:8px">${logoHtml}<div style="font-size:8pt;color:#666">${kvName}</div></div>
        <div style="text-align:right">
          <div style="font-size:9pt;color:${ROT};font-weight:bold">Sanit&auml;tswachdienst</div>
          ${ev.auftragsnr?`<div style="font-size:7.5pt;color:#666;margin-top:2px">Auftragsnr: <strong>${esc(ev.auftragsnr)}</strong></div>`:""}
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid ${ROT};padding-bottom:6px;margin-bottom:12px">
        <div style="font-size:12pt;font-weight:bold;color:${ROT}">Gefahrenanalyse Sanitätswachdienst</div>
        <div style="font-size:8pt;color:#666">Tag ${i+1} von ${activeDays.length}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:10px">
        <tr><td style="width:160px;color:#666;padding:2px 0">Veranstaltung:</td><td style="font-weight:bold">${esc(ev.name||"")}</td></tr>
        <tr><td style="color:#666;padding:2px 0">Datum:</td><td>${fDate(day.date)} ${day.startTime||""} – ${day.endTime||""} Uhr</td></tr>
        <tr><td style="color:#666;padding:2px 0">Ort:</td><td>${esc(ev.ort||"")}</td></tr>
        <tr><td style="color:#666;padding:2px 0">Erwartete Besucher:</td><td><strong>${day.besucher||"—"}</strong></td></tr>
        <tr><td style="color:#666;padding:2px 0">Gesamtrisiko:</td><td style="color:${ROT};font-weight:bold">${risk.total?.toFixed(1)||"—"} Punkte</td></tr>
      </table>
      <table style="width:100%;border-collapse:collapse;margin-bottom:10px;font-size:8.5pt">
        <thead><tr style="background:#e8e8e8">
          <th style="border:1px solid #ccc;padding:3px 6px;text-align:left;width:30px">Nr.</th>
          <th style="border:1px solid #ccc;padding:3px 6px;text-align:left">Kriterium</th>
          <th style="border:1px solid #ccc;padding:3px 6px;text-align:right;width:60px">Wert</th>
          <th style="border:1px solid #ccc;padding:3px 6px;text-align:right;width:60px">Punkte</th>
        </tr></thead>
        <tbody>
          <tr><td style="border:1px solid #ccc;padding:3px 6px">1a</td><td style="border:1px solid #ccc;padding:3px 6px">Max. Besucher (Auflagen)</td><td style="border:1px solid #ccc;padding:3px 6px;text-align:right">${risk.ap??0}</td><td style="border:1px solid #ccc;padding:3px 6px;text-align:right">${risk.ap??0}</td></tr>
          <tr><td style="border:1px solid #ccc;padding:3px 6px">1b</td><td style="border:1px solid #ccc;padding:3px 6px">Flaeche: ${day.flaeche||0} m</td><td style="border:1px solid #ccc;padding:3px 6px;text-align:right">${risk.fp??0}</td><td style="border:1px solid #ccc;padding:3px 6px;text-align:right">${risk.fp??0}</td></tr>
          <tr><td style="border:1px solid #ccc;padding:3px 6px">2a</td><td style="border:1px solid #ccc;padding:3px 6px">Erwartete Besucher</td><td style="border:1px solid #ccc;padding:3px 6px;text-align:right">${day.besucher||0}</td><td style="border:1px solid #ccc;padding:3px 6px;text-align:right">${risk.bp??0}</td></tr>
          <tr style="background:#f5f5f5"><td style="border:1px solid #ccc;padding:3px 6px"></td><td style="border:1px solid #ccc;padding:3px 6px;font-weight:bold">Zwischensumme</td><td style="border:1px solid #ccc;padding:3px 6px"></td><td style="border:1px solid #ccc;padding:3px 6px;text-align:right;font-weight:bold">${risk.zw??0}</td></tr>
          <tr><td style="border:1px solid #ccc;padding:3px 6px">3</td><td style="border:1px solid #ccc;padding:3px 6px">Faktor: ${day.eventTypeName||""}</td><td style="border:1px solid #ccc;padding:3px 6px;text-align:right">${risk.factor?"x"+risk.factor:""}</td><td style="border:1px solid #ccc;padding:3px 6px"></td></tr>
          <tr><td style="border:1px solid #ccc;padding:3px 6px">4</td><td style="border:1px solid #ccc;padding:3px 6px">Risiko ohne Prom./Pol.</td><td style="border:1px solid #ccc;padding:3px 6px"></td><td style="border:1px solid #ccc;padding:3px 6px;text-align:right">${risk.ro?.toFixed(2)||"0.00"}</td></tr>
          <tr><td style="border:1px solid #ccc;padding:3px 6px"></td><td style="border:1px solid #ccc;padding:3px 6px">Prominente: ${day.prominente||0}</td><td style="border:1px solid #ccc;padding:3px 6px"></td><td style="border:1px solid #ccc;padding:3px 6px;text-align:right">+${risk.pp||0}</td></tr>
          <tr><td style="border:1px solid #ccc;padding:3px 6px"></td><td style="border:1px solid #ccc;padding:3px 6px">Polizei: ${day.polizei?"JA":"NEIN"}</td><td style="border:1px solid #ccc;padding:3px 6px"></td><td style="border:1px solid #ccc;padding:3px 6px;text-align:right">+${risk.pol||0}</td></tr>
          <tr style="background:#ffe0e0"><td style="border:1px solid #ccc;padding:3px 6px;font-weight:bold">5</td><td style="border:1px solid #ccc;padding:3px 6px;font-weight:bold">GESAMTRISIKO</td><td style="border:1px solid #ccc;padding:3px 6px"></td><td style="border:1px solid #ccc;padding:3px 6px;text-align:right;font-weight:bold;color:${ROT}">${risk.total?.toFixed(2)||"0.00"}</td></tr>
        </tbody>
      </table>
      <div style="margin-bottom:8px">
        <div style="font-weight:bold;margin-bottom:4px">Ergebnis der Berechnung:</div>
        <div style="margin-bottom:4px">Das <span style="color:${ROT};font-weight:bold">Gesamtrisiko</span> betraegt: <strong>${risk.total?.toFixed(2)||"0.00"} Punkte</strong></div>
        <div style="margin-bottom:4px">Zur Sicherung des Sanit&auml;tswachdienstes werden empfohlen:</div>
        <div style="padding-left:12px">
          ${rec.helfer>0?`<div>- ${rec.helfer} Helfer</div>`:""}
          ${rec.ktw>0?`<div>- ${rec.ktw} Krankentransportwagen (KTW)</div>`:""}
          ${rec.rtw>0?`<div>- ${rec.rtw} Rettungswagen (RTW)</div>`:""}
          ${rec.nef>0?`<div>- ${rec.nef} Notarzt</div>`:""}
          ${rec.gktw>0?`<div>- ${rec.gktw} Gro&szlig;raum-KTW (GKTW)</div>`:""}
          <div>- Einsatzleitung: ${rec.el==="im Team"?"keine stabsm&auml;&szlig;ige Einsatzleitung":rec.el||""}</div>
        </div>
        <div style="margin-top:6px;font-size:8pt;color:${ROT};font-weight:600">Fahrzeugbesatzungen gelten zus&auml;tzlich zum angegebenen Personalbedarf!</div>
      </div>
      <div style="font-size:7pt;color:#666;font-style:italic;margin-top:6px;padding-top:4px;border-top:1px solid #eee">
        Berechnung nach Maurer-Algorithmus (Dipl.Ing. Klaus Maurer, Stand 2010). Richtwerte mit empfehlendem Charakter.
        Die Richtwerte m&uuml;ssen an die &ouml;rtlichen Verh&auml;ltnisse angepasst werden.
      </div>

      </div>
    </div>`;
  });

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0}@media print{.pdf-page{page-break-after:always}}
  </style></head><body>${pages.join("")}</body></html>`;
}

// ═══════════════════════════════════════════════════════════════════
// HTML Builder: Angebot
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// HTML Builder: Deckblatt Angebotsmappe
// ═══════════════════════════════════════════════════════════════════
function buildDeckblattHTML(ev, activeDays, stamm, user, includeDocs) {
  const esc = s => (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const fDate = s => s ? new Date(s).toLocaleDateString("de-DE") : "";
  const ROT = "#c0392b";
  const berName = esc(stamm.name || "");
  const kvName = esc(stamm.kv_name || "");
  const logoB64 = stamm.logo ? Buffer.from(stamm.logo).toString("base64") : null;
  const logoHtml = logoB64
    ? `<img src="data:image/png;base64,${logoB64}" style="height:90px;width:auto;display:block;margin:0 auto 12px">`
    : `<div style="font-size:48pt;color:${ROT};text-align:center;margin-bottom:12px">&#10010;</div>`;

  const firstDay = activeDays[0];
  const lastDay = activeDays[activeDays.length - 1];
  const dauerText = firstDay && lastDay
    ? (firstDay.date === lastDay.date
      ? fDate(firstDay.date)
      : fDate(firstDay.date) + " – " + fDate(lastDay.date))
    : "";
  const tageText = activeDays.length > 1 ? activeDays.length + " Einsatztage" : "1 Einsatztag";

  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;color:#000}
  </style></head><body>
  <div style="height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20mm">

    <!-- Logo -->
    <div style="margin-bottom:30px">
      ${logoHtml}
    </div>

    <!-- Organisation -->
    <div style="font-size:10pt;color:#666;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px">Bayerisches Rotes Kreuz</div>
    <div style="font-size:13pt;color:#333;font-weight:600;margin-bottom:4px">${kvName}</div>
    <div style="font-size:11pt;color:${ROT};font-weight:700;margin-bottom:40px">${berName}</div>

    <!-- Trennlinie -->
    <div style="width:60%;height:2px;background:${ROT};margin-bottom:40px"></div>

    <!-- Dokumenttitel -->
    <div style="font-size:10pt;color:#888;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px">Angebotsmappe</div>
    <div style="font-size:9pt;color:#aaa;margin-bottom:35px">Sanitätswachdienst</div>

    <!-- Veranstaltung -->
    <div style="font-size:18pt;font-weight:bold;color:#1a1a2e;margin-bottom:10px;line-height:1.3">${esc(ev.name||"[Veranstaltung]")}</div>
    <div style="font-size:11pt;color:#555;margin-bottom:6px">${esc(ev.ort||"")}${ev.adresse?", "+esc(ev.adresse):""}</div>
    <div style="font-size:11pt;color:#333;font-weight:600;margin-bottom:4px">${dauerText}</div>
    <div style="font-size:9pt;color:#888;margin-bottom:40px">${tageText}</div>

    <!-- Auftragsnr -->
    <div style="display:inline-block;border:1.5px solid ${ROT};border-radius:4px;padding:8px 24px;margin-bottom:50px">
      <div style="font-size:8pt;color:#888;margin-bottom:2px">Auftrags-Nr.</div>
      <div style="font-size:14pt;font-weight:bold;color:${ROT}">${esc(ev.auftragsnr||"—")}</div>
    </div>

    <!-- Anlagen -->
    <div style="width:60%;text-align:left;margin-top:10px">
      <div style="font-size:8pt;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;border-bottom:1px solid #ddd;padding-bottom:4px">Inhalt dieser Mappe</div>
      <div style="font-size:9pt;color:#555;line-height:2">
        ${(()=>{const inc=includeDocs||{angebot:true,vertrag:true,aab:true,gefahren:true};const items=[];let n=1;if(inc.angebot)items.push('<div style="display:flex;justify-content:space-between"><span>'+(n++)+'. Kostenaufstellung (Angebot)</span><span style="color:#bbb">mit Beauftragung</span></div>');if(inc.vertrag)items.push('<div style="display:flex;justify-content:space-between"><span>'+(n++)+'. Vereinbarung Sanitätswachdienst</span><span style="color:#bbb">Vertrag</span></div>');if(inc.aab)items.push('<div style="display:flex;justify-content:space-between"><span>'+(n++)+'. Allgemeine Auftragsbedingungen</span><span style="color:#bbb">AAB</span></div>');if(inc.gefahren)items.push('<div style="display:flex;justify-content:space-between"><span>'+(n++)+'. Gefahrenanalyse</span><span style="color:#bbb">Risikobeurteilung</span></div>');return items.join("");})()}
      </div>
    </div>

    <!-- Ersteller -->
    <div style="margin-top:40px;font-size:8pt;color:#bbb">
      Erstellt von ${esc(user.name||"")} · ${new Date().toLocaleDateString("de-DE")}
    </div>
  </div>
  </body></html>`;
}

function buildAngebotHTML(ev, dayCalcs, totalCosts, activeDays, stamm, kosten, user) {
  const ROT = "#c0392b";
  const esc = s => (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const fDate = s => s ? new Date(s).toLocaleDateString("de-DE") : "";
  const euro = v => v != null && v !== "" ? new Intl.NumberFormat("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2}).format(v)+" €" : "";
  const num = v => (v !== null && v !== undefined && v > 0) ? String(v) : "";

  const unterzeichner = esc(user?.name || stamm.leiter_name || "");
  const unterTitel = esc(user?.titel || stamm.leiter_title || "Bereitschaftsleiter");
  const unterTelefon = esc(user?.telefon || stamm.telefon || "");
  const unterMobil = esc(user?.mobil || stamm.mobil || "");
  const unterEmail = esc(user?.email || stamm.email || "");
  const unterZeichen = (user?.name || stamm.leiter_name || "").split(" ").map(w=>w[0]).join("") || "BL";
  const ortName = esc(user?.ort || (stamm.name||"").replace(/^Bereitschaft\s*/i,"").trim() || "");
  const berName = esc(stamm.name || "");

  const logoB64 = stamm.logo ? Buffer.from(stamm.logo).toString("base64") : null;
  const logoHtml = logoB64 ? `<img src="data:image/png;base64,${logoB64}" style="height:55px;width:auto;display:block;margin-bottom:4px">` : "";

  const tKtw = dayCalcs.reduce((s,d)=>s+(d.kc||0),0);
  const tRtw = dayCalcs.reduce((s,d)=>s+(d.rc||0),0);
  const tAerzt = dayCalcs.reduce((s,d)=>s+(d.ac||0),0);
  const tGktw = dayCalcs.reduce((s,d)=>s+(d.gc||0),0);
  const tElKfz = dayCalcs.reduce((s,d)=>s+(d.ec||0),0);
  const tSeg = dayCalcs.reduce((s,d)=>s+(d.sc||0),0);
  const tMtw = dayCalcs.reduce((s,d)=>s+(d.mc||0),0);
  const tHrs = dayCalcs.reduce((s,d)=>s+(d.h||0),0);
  const tTP = dayCalcs.reduce((s,d)=>s+(d.tp||0),0);
  const isPauschal = ev.pauschalangebot && ev.pauschalangebot > 0;
  const endPreis = isPauschal ? parseFloat(ev.pauschalangebot) : totalCosts;

  // rates aus stammdaten (dayCalcs haben bereits die berechneten Kosten)
  const fzRows = [
    tKtw>0 && { pos:"KTW", anz:tKtw, pers:null, hrs:null, rate:null, summe:dayCalcs.reduce((s,d)=>s+(d.cK||0),0) },
    tRtw>0 && { pos:"RTW", anz:tRtw, pers:null, hrs:null, rate:null, summe:dayCalcs.reduce((s,d)=>s+(d.cR||0),0) },
    tAerzt>0 && { pos:"Ärzte", anz:tAerzt, pers:1, hrs:tHrs, rate:null, summe:dayCalcs.reduce((s,d)=>s+(d.cA||0),0) },
    tElKfz>0 && { pos:"Einsatzleiter KFZ", anz:tElKfz, pers:null, hrs:null, rate:null, summe:dayCalcs.reduce((s,d)=>s+(d.cEK||0),0) },
    tGktw>0 && { pos:"GKTW", anz:tGktw, pers:null, hrs:null, rate:null, summe:dayCalcs.reduce((s,d)=>s+(d.cG||0),0) },
    tSeg>0 && { pos:"SEG-LKW", anz:tSeg, pers:null, hrs:null, rate:null, summe:dayCalcs.reduce((s,d)=>s+(d.cS||0),0) },
    tMtw>0 && { pos:"MTW", anz:tMtw, pers:null, hrs:null, rate:null, summe:dayCalcs.reduce((s,d)=>s+(d.cM||0),0) },
    { pos:"Einsatzkräfte (gesamt)", anz:null, pers:tTP, hrs:tHrs, rate:null, summe:dayCalcs.reduce((s,d)=>s+(d.cH||0),0), isBold:true },
    ev.verpflegung===false && dayCalcs.reduce((s,d)=>s+(d.cV||0),0)>0 && { pos:"Verpflegungspauschale", anz:null, pers:tTP, hrs:null, rate:null, summe:dayCalcs.reduce((s,d)=>s+(d.cV||0),0) },
  ].filter(Boolean);

  const TH = 'border:1px solid #000;padding:3px 6px;font-size:9pt;font-weight:bold;background:#c8c8c8;text-align:center;white-space:nowrap';
  const TD = 'border:1px solid #000;padding:3px 6px;font-size:9pt;vertical-align:middle';
  const TDR = TD+';text-align:right';
  const TDC = TD+';text-align:center';

  const datumszeilen = activeDays.map((d,i)=>
    `<div style="font-size:10pt;margin-bottom:2px;display:flex;gap:8px">
      <span>vom</span><span style="min-width:80px">${fDate(d.date)}</span>
      <span style="min-width:55px">${esc(d.startTime||"")} Uhr</span>
      <span>bis</span><span style="min-width:80px">${fDate(d.date)}</span>
      <span>${esc(d.endTime||"")} Uhr</span>
    </div>`
  ).join("");

  const fzRowsHTML = fzRows.map(row =>
    `<tr>
      <td style="${TD};font-weight:${row.isBold?"bold":"normal"}">${esc(row.pos)}</td>
      <td style="${TDC}">${num(row.anz)}</td>
      <td style="${TDC}">${num(row.pers)}</td>
      <td style="${TDC}">${num(row.km)}</td>
      <td style="${TDC}">${row.hrs?num(row.hrs):""}</td>
      <td style="${TDR}">${row.summe!=null?euro(row.summe):""}</td>
    </tr>`
  ).join("");

  const pauschalRow = isPauschal ? `<tr>
    <td colspan="5" style="${TD};font-weight:600">Gesamtsumme</td>
    <td style="${TDR};font-weight:600">${euro(totalCosts)}</td>
  </tr><tr>
    <td colspan="5" style="${TD};font-weight:bold;font-size:11pt"><strong>Pauschalangebot</strong></td>
    <td style="${TDR};font-weight:bold;font-size:11pt"><strong>${euro(endPreis)}</strong></td>
  </tr>` : "";

  const bemerkung = ev.bemerkung ? `<table class="no-break" style="width:100%;border-collapse:collapse;margin-top:8px;border:1px solid #000">
    <tbody><tr>
      <td style="${TD};font-weight:bold;width:90px;vertical-align:top;white-space:nowrap">Bemerkung:</td>
      <td style="${TD};white-space:pre-wrap">${esc(ev.bemerkung)}</td>
    </tr></tbody>
  </table>` : "";

  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;font-size:10pt;color:#000}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .no-break{page-break-inside:avoid!important;break-inside:avoid!important}
      .break-before{page-break-before:auto}
      tr{page-break-inside:avoid;break-inside:avoid}
    }
    .beauftragung{page-break-inside:avoid;break-inside:avoid}
  </style></head><body>
  <div style="font-family:Arial,Helvetica,sans-serif;font-size:10pt;color:#000;padding:0 0 10mm 0">
    <!-- KOPFZEILE -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
      <div>
        <div style="font-size:16pt;font-weight:bold;margin-bottom:4px">${berName}</div>
        <div style="font-size:8pt;color:#444">Bayerisches Rotes Kreuz · ${berName}</div>
        <div style="height:17mm"></div>
        <div style="font-size:10pt;line-height:1.6">
          <div style="font-weight:bold">${esc(ev.rechnungsempfaenger||ev.veranstalter||"")}</div>
          ${ev.ansprechpartner?`<div>${esc(ev.ansprechpartner)}</div>`:""}
          ${ev.reStrasse?`<div>${esc(ev.reStrasse)}</div>`:""}
          <div>${esc(ev.rePlzOrt||"")}</div>
        </div>
      </div>
      <div style="font-size:9.5pt;line-height:1.6;text-align:left;min-width:165px">
        ${logoHtml}
        <div style="font-weight:bold;font-size:11pt">${unterzeichner}</div>
        <div style="font-weight:bold">${unterTitel}</div>
        ${unterTelefon?`<div>Tel.: ${unterTelefon}</div>`:""}
        ${stamm.fax?`<div>Fax: ${esc(stamm.fax)}</div>`:""}
        ${unterMobil?`<div>Mobil: ${unterMobil}</div>`:""}
        <div>E-Mail: ${unterEmail}</div>
        <div style="margin-top:6px">Unser Zeichen: <strong>${unterZeichen}</strong></div>
        <div>${ortName}, ${new Date().toLocaleDateString("de-DE")}</div>
      </div>
    </div>
    <!-- AUFTRAGSNR -->
    <div style="margin-bottom:8px"><strong>Auftrags-Nr.</strong>&nbsp;&nbsp;<strong>${esc(ev.auftragsnr||"")}</strong></div>
    <!-- BETREFF -->
    <div style="font-weight:bold;margin-bottom:10px">Angebot für einen Sanitätswachdienst</div>
    <!-- ANREDE -->
    <div style="margin-bottom:10px">${esc(ev.anrede||"Sehr geehrte Damen und Herren,")}</div>
    <div style="margin-bottom:6px">anbei die voraussichtliche Kostenaufstellung für den Sanitätswachdienst.</div>
    <div style="height:4px"></div>
    <div style="font-weight:bold;margin-bottom:6px">${esc(ev.name||"")}</div>
    <div style="height:4px"></div>
    ${datumszeilen}
    <div style="height:6px"></div>
    <!-- TABELLE -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:0">
      <thead>
        <tr>
          <th style="${TH};text-align:left;width:32%">Position</th>
          <th style="${TH}">Anzahl</th>
          <th style="${TH}">Personen</th>
          <th style="${TH}">Kilometer</th>
          <th style="${TH}">Einsatzstunden</th>
          <th style="${TH}">Summe</th>
        </tr>
      </thead>
      <tbody>
        ${fzRowsHTML}
        ${!isPauschal?`<tr>
          <td colspan="5" style="${TD};border:none;background:#fff"></td>
          <td style="${TDR};font-weight:bold;border-top:2px solid #000">${euro(totalCosts)}</td>
        </tr>`:""}
        ${pauschalRow}
      </tbody>
    </table>
    ${bemerkung}
    <!-- UNTERSCHRIFT (bleibt bei Tabelle) -->
    <div style="margin-top:14px;display:flex;justify-content:flex-end;font-size:9pt">
      <div style="text-align:center;min-width:200px">
        ${user.unterschrift
          ? '<img src="'+user.unterschrift+'" style="height:50px;width:auto;display:block;margin:0 auto 2px">'
          : '<div style="height:50px"></div>'}
        <div style="border-top:1px solid #000;padding-top:4px;margin-bottom:2px">${unterzeichner}</div>
        ${!user.unterschrift ? '<div style="font-size:8pt;font-style:italic;color:#555">Dieses Dokument wurde maschinell erstellt und ist ohne Unterschrift gültig.</div>' : ''}
      </div>
    </div>
    <!-- BEAUFTRAGUNG -->
    <div style="margin-top:24px;page-break-inside:avoid;break-inside:avoid">
      <div style="font-size:8pt;color:#888;text-align:right;margin-bottom:4px">
        Bezug: Angebot ${esc(ev.auftragsnr||"")} vom ${new Date().toLocaleDateString("de-DE")} &middot; ${esc(ev.name||"")}
      </div>
      <div style="border:2px solid #000;padding:18px 20px">
        <div style="font-weight:bold;font-size:11pt;margin-bottom:10px">Beauftragung / Auftragsbestätigung</div>
        <div style="font-size:9.5pt;margin-bottom:8px;line-height:1.8">
          Hiermit bestätige ich die Beauftragung des Sanitätswachdienstes gemäß obigem Angebot und erkenne die angegebenen Konditionen an.
        </div>
        <div style="min-height:25px;max-height:45px"></div>
      <div style="display:flex;justify-content:space-between;gap:28px;margin-top:4px">
        <div style="flex:1;text-align:center"><div style="border-top:1px solid #000;padding-top:5px;margin-bottom:3px">&nbsp;</div><div style="font-size:8pt;color:${ROT};font-weight:600">Ort, Datum</div></div>
        <div style="flex:2;text-align:center"><div style="border-top:1px solid #000;padding-top:5px;margin-bottom:3px">&nbsp;</div><div style="font-size:8pt;color:${ROT};font-weight:600">Unterschrift Auftraggeber</div></div>
        <div style="flex:2;text-align:center"><div style="border-top:1px solid #000;padding-top:5px;margin-bottom:3px">&nbsp;</div><div style="font-size:8pt;color:${ROT};font-weight:600">Name in Druckbuchstaben</div></div>
      </div>
    </div>
    </div>

  </div>
  </body></html>`;
}

// ═══════════════════════════════════════════════════════════════════
// HTML Builder: AAB
// ═══════════════════════════════════════════════════════════════════
function buildAABHTML(stamm, bereitschaftCode, klauseln, auftragsnr) {
  const ROT = "#c0392b";
  const esc = s => (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const kvName = esc(stamm.kv_name || "");
  const logoB64 = stamm.logo ? Buffer.from(stamm.logo).toString("base64") : null;
  const logoHtml = logoB64 ? `<img src="data:image/png;base64,${logoB64}" style="height:28px;width:auto">` : `<span style="color:${ROT};font-weight:bold">✚</span>`;

  const sektionen = klauseln.map(k => {
    const absaetze = k.inhalt.split(/\n\n+/).filter(p=>p.trim());
    const absatzHTML = absaetze.map(p => {
      const zeilen = p.split(/\n/);
      if (zeilen.length === 1) return `<div style="margin-bottom:4px;padding-left:16px">${esc(p)}</div>`;
      // Erste Zeile ist die Abschnittsnummer
      return zeilen.map(z => `<div style="margin-bottom:4px;padding-left:16px">${esc(z)}</div>`).join("");
    }).join("");
    return `<div style="margin-bottom:8px">
      <div style="font-weight:bold;margin-bottom:4px">${esc(k.titel)}</div>
      ${absatzHTML}
    </div>`;
  }).join("");

  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;font-size:8.5pt;color:#000;line-height:1.55}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;orphans:0;widows:0}}
  </style></head><body style="overflow:hidden">
  <div style="padding:0">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
      <div style="font-size:8pt;color:#666;display:flex;align-items:center;gap:6px">${logoHtml} ${kvName}</div>
      <div style="text-align:right">
        <div style="font-size:8pt;color:${ROT};font-weight:bold">Sanit&auml;tswachdienst</div>
        ${auftragsnr?`<div style="font-size:7.5pt;color:#666;margin-top:2px">Auftragsnr: <strong>${auftragsnr}</strong></div>`:""}
      </div>
    </div>
    <div style="font-size:12pt;font-weight:bold;text-align:center;margin-bottom:14px;border-bottom:2pt solid ${ROT};padding-bottom:6px">Allgemeine Auftragsbedingungen</div>
    ${sektionen}
    <!-- Footer entfernt - Puppeteer footerTemplate -->
  </body></html>`;
}

// ── Static Frontend ──────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Error Handler ────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ error: "Interner Serverfehler" });
});

// ── Start ────────────────────────────────────────────────────────
db.init();

// ── Papierkorb Auto-Cleanup (60 Tage) ───────────────────────────
function runPapierkorbCleanup() {
  try {
    const result = db.getDb().prepare(
      "DELETE FROM vorgaenge WHERE deleted_at IS NOT NULL AND deleted_at < datetime('now', '-60 days')"
    ).run();
    if (result.changes > 0) {
      console.log(`🗑️  Papierkorb-Cleanup: ${result.changes} Vorgang/Vorgänge endgültig gelöscht`);
    }
  } catch(e) {
    console.error("Papierkorb-Cleanup Fehler:", e);
  }
}
runPapierkorbCleanup(); // Beim Start einmal ausführen
setInterval(runPapierkorbCleanup, 24 * 60 * 60 * 1000); // Täglich
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚑 BRK SanWD v6 gestartet auf Port ${PORT}`);
  console.log(`   Nextcloud: ${process.env.NEXTCLOUD_URL || "nicht konfiguriert"}`);
  console.log(`   OIDC: ${process.env.OIDC_ISSUER || "Dev-Modus (kein OIDC)"}`);
});
