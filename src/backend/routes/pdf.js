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

// Sync-Route ist in server.js (braucht BrowserPool + build*HTML)

module.exports = router;
