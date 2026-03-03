const express = require("express");
const router = express.Router();
const { getDb } = require("../db");
const { requireAuth, requireBL, getBereitschaftCode } = require("../middleware/rbac");
const { fillILS, getILSFields } = require("../services/ils-filler");
const nextcloud = require("../services/nextcloud");

router.use(requireAuth);

// ── ILS-PDF generieren ───────────────────────────────────────────
router.post("/ils/:vorgangId", requireBL, async (req, res) => {
  try {
    const bc = getBereitschaftCode(req);
    const vorgang = getDb().prepare(
      "SELECT data FROM vorgaenge WHERE id = ? AND bereitschaft_code = ?"
    ).get(req.params.vorgangId, bc);
    if (!vorgang) return res.status(404).json({ error: "Vorgang nicht gefunden" });

    const bereitschaft = getDb().prepare("SELECT * FROM bereitschaften WHERE code = ?").get(bc);
    // User aus DB laden (Session hat mobil/telefon nur nach Profil-Speichern)
    const userDb = getDb().prepare("SELECT name, titel, mobil, telefon FROM users WHERE sub=?").get(req.session.user.sub) || {};
    const user = { ...req.session.user, ...userDb };
    const pdfBuffer = await fillILS(JSON.parse(vorgang.data), bereitschaft, user);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="ILS_Anmeldung_${req.params.vorgangId}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("ILS PDF Fehler:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── ILS Felder auflisten (Admin) ─────────────────────────────────
router.get("/ils/fields", async (req, res) => {
  try {
    const fields = await getILSFields();
    res.json({ fields });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Vorgang komplett zu Nextcloud synchen ────────────────────────
router.post("/sync/:vorgangId", requireBL, async (req, res) => {
  try {
    if (!nextcloud.isConfigured()) return res.status(501).json({ error: "Nextcloud nicht konfiguriert" });
    const bc = getBereitschaftCode(req);
    const row = getDb().prepare(
      "SELECT data, bereitschaft_code FROM vorgaenge WHERE id = ? AND bereitschaft_code = ?"
    ).get(req.params.vorgangId, bc);
    if (!row) return res.status(404).json({ error: "Vorgang nicht gefunden" });

    const vorgang = JSON.parse(row.data);
    vorgang.bereitschaft_code = row.bereitschaft_code;
    const ev = vorgang.event || {};
    const stamm = getDb().prepare("SELECT * FROM bereitschaften WHERE code=?").get(bc) || {};

    // PDFs generieren (falls BrowserPool verfügbar)
    const pdfs = [];
    const nr = (ev.auftragsnr || "").replace(/[^a-zA-Z0-9_-]/g, "_");

    // JSON als Backup
    pdfs.push({ filename: `${nr}_vorgang.json`, data: Buffer.from(JSON.stringify(vorgang, null, 2)) });

    const result = await nextcloud.syncVorgang(req.session, vorgang, pdfs, stamm);

    if (result.success) {
      vorgang.nextcloudSync = { syncedAt: result.syncedAt, folder: result.folder, files: result.results.map(r => r.file), syncedBy: req.session.user.name };
      getDb().prepare("UPDATE vorgaenge SET data = ?, synced_at = datetime('now') WHERE id = ?").run(JSON.stringify(vorgang), req.params.vorgangId);
    }

    res.json(result);
  } catch (err) {
    console.error("Sync Fehler:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
