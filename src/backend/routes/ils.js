const express = require("express");
const router = express.Router();
const { getDb } = require("../db");
const { requireAuth, requireBL, getBereitschaftCode } = require("../middleware/rbac");
const { fillILS } = require("../services/ils-filler");

router.use(requireAuth);

// ── ILS-PDF für alle aktiven Tage generieren ─────────────────────
// GET /api/ils/:vorgangId        → alle Tage als ZIP oder einzeln
// GET /api/ils/:vorgangId/:dayIdx → einzelner Tag (0-basiert)

router.get("/:vorgangId/:dayIdx", requireBL, async (req, res) => {
  try {
    const bc = getBereitschaftCode(req);
    const row = getDb().prepare(
      "SELECT data FROM vorgaenge WHERE id = ? AND bereitschaft_code = ?"
    ).get(req.params.vorgangId, bc);
    if (!row) return res.status(404).json({ error: "Vorgang nicht gefunden" });

    const vorgang = JSON.parse(row.data);
    const bereitschaft = getDb().prepare("SELECT * FROM bereitschaften WHERE code = ?").get(bc) || {};
    const days = (vorgang.days || []).filter(d => d.active);
    const dayIdx = parseInt(req.params.dayIdx, 10);

    if (isNaN(dayIdx) || dayIdx < 0 || dayIdx >= days.length) {
      return res.status(400).json({ error: `Tag ${dayIdx} nicht gefunden (${days.length} aktive Tage)` });
    }

    const day = days[dayIdx];
    // Pro Tag: von/bis = dieser Tag, Datum aus day.date
    const vorgangDay = {
      ...vorgang,
      days: [day],  // nur dieser Tag
      event: {
        ...vorgang.event,
        ils: {
          ...(vorgang.event?.ils || {}),
          // Zeitraum auf diesen Tag begrenzen
          zeitVon: day.startTime || vorgang.event?.ils?.zeitVon || "",
          zeitBis: day.endTime || vorgang.event?.ils?.zeitBis || "",
        }
      }
    };

    // User aus DB laden (Session hat mobil/telefon nur nach Profil-Speichern)
    const userDb = getDb().prepare("SELECT name, titel, mobil, telefon FROM users WHERE sub=?").get(req.session.user.sub) || {};
    const user = { ...req.session.user, ...userDb };
    const pdfBuffer = await fillILS(vorgangDay, bereitschaft, user);
    const datum = day.date ? day.date.replace(/-/g, "") : `tag${dayIdx + 1}`;
    const filename = `ILS_${req.params.vorgangId}_Tag${dayIdx + 1}_${datum}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("ILS PDF Fehler:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Alle Tage auf einmal: gibt Array mit URLs zurück ─────────────
router.get("/:vorgangId", requireBL, async (req, res) => {
  try {
    const bc = getBereitschaftCode(req);
    const row = getDb().prepare(
      "SELECT data FROM vorgaenge WHERE id = ? AND bereitschaft_code = ?"
    ).get(req.params.vorgangId, bc);
    if (!row) return res.status(404).json({ error: "Vorgang nicht gefunden" });

    const vorgang = JSON.parse(row.data);
    const days = (vorgang.days || []).filter(d => d.active);

    res.json({
      tage: days.map((d, i) => ({
        idx: i,
        datum: d.date || `Tag ${i + 1}`,
        url: `/api/ils/${req.params.vorgangId}/${i}`
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
