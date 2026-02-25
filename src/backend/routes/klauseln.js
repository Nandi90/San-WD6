const express = require("express");
const router = express.Router();
const { getDb } = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/rbac");

router.use(requireAuth);

// GET alle Klauseln
router.get("/", (req, res) => {
  const rows = getDb().prepare(
    "SELECT id, titel, dokument, inhalt, reihenfolge FROM klauseln ORDER BY dokument, reihenfolge"
  ).all();
  res.json(rows);
});

// PUT eine Klausel aktualisieren (Admin only)
router.put("/:id", requireAdmin, (req, res) => {
  const { inhalt } = req.body;
  if (inhalt === undefined) return res.status(400).json({ error: "inhalt fehlt" });
  getDb().prepare(
    "UPDATE klauseln SET inhalt = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(inhalt, req.params.id);
  res.json({ success: true });
});

// POST – Reset auf Standard (Admin)
router.post("/reset", requireAdmin, (req, res) => {
  // Tabelle leeren und neu seeden
  getDb().prepare("DELETE FROM klauseln").run();
  require("../db").seedKlauseln?.();
  res.json({ success: true });
});

module.exports = router;
