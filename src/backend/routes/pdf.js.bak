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
    const pdfBuffer = await fillILS(JSON.parse(vorgang.data), bereitschaft, req.session.user);

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
    const bc = getBereitschaftCode(req);
    const row = getDb().prepare(
      "SELECT data FROM vorgaenge WHERE id = ? AND bereitschaft_code = ?"
    ).get(req.params.vorgangId, bc);
    if (!row) return res.status(404).json({ error: "Vorgang nicht gefunden" });

    const vorgang = JSON.parse(row.data);
    const event = vorgang.event || {};
    const remotePath = nextcloud.buildPath(bc, event.year || new Date().getFullYear(), event.auftragsnr, event.name);

    // JSON sichern
    await nextcloud.uploadFile(`${remotePath}/vorgang.json`, JSON.stringify(vorgang, null, 2), "application/json");

    // Sync-Status updaten
    getDb().prepare("UPDATE vorgaenge SET synced_at = datetime('now') WHERE id = ?").run(req.params.vorgangId);

    res.json({ success: true, path: remotePath });
  } catch (err) {
    console.error("Sync Fehler:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
