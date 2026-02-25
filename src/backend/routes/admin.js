const express = require("express");
const router = express.Router();
const { getDb, audit } = require("../db");
const { requireAdmin } = require("../middleware/rbac");

router.use(requireAdmin);

// ── Benutzer-Übersicht ───────────────────────────────────────────
router.get("/users", (req, res) => {
  const rows = getDb().prepare(`
    SELECT u.sub, u.name, u.email, u.rolle, u.bereitschaft_code, u.last_login,
           b.name as bereitschaft_name
    FROM users u LEFT JOIN bereitschaften b ON u.bereitschaft_code = b.code
    ORDER BY u.last_login DESC
  `).all();
  res.json(rows);
});

// ── Benutzer-Rolle ändern ────────────────────────────────────────
router.put("/users/:sub/rolle", (req, res) => {
  const { rolle } = req.body;
  if (!["admin", "bl", "helfer"].includes(rolle)) {
    return res.status(400).json({ error: "Ungültige Rolle" });
  }
  getDb().prepare("UPDATE users SET rolle = ? WHERE sub = ?").run(rolle, req.params.sub);
  audit(req.session.user, "change_role", "user", req.params.sub, `Neue Rolle: ${rolle}`);
  res.json({ success: true });
});

// ── Benutzer Bereitschaft zuweisen ───────────────────────────────
router.put("/users/:sub/bereitschaft", (req, res) => {
  const { bereitschaft_code } = req.body;
  getDb().prepare("UPDATE users SET bereitschaft_code = ? WHERE sub = ?")
    .run(bereitschaft_code, req.params.sub);
  audit(req.session.user, "change_bereitschaft", "user", req.params.sub, bereitschaft_code);
  res.json({ success: true });
});

// ── Bereitschaft hinzufügen ──────────────────────────────────────
router.post("/bereitschaften", (req, res) => {
  const { code, name, short } = req.body;
  if (!code || !name || !short) return res.status(400).json({ error: "Code, Name und Short erforderlich" });

  getDb().prepare("INSERT OR IGNORE INTO bereitschaften (code, name, short) VALUES (?,?,?)").run(code, name, short);
  getDb().prepare("INSERT OR IGNORE INTO kostensaetze (bereitschaft_code) VALUES (?)").run(code);

  audit(req.session.user, "create", "bereitschaft", code, name);
  res.json({ success: true });
});

// ── Audit Log ────────────────────────────────────────────────────
router.get("/audit", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  const rows = getDb().prepare(
    "SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?"
  ).all(limit);
  res.json(rows);
});

// ── Dashboard Stats ──────────────────────────────────────────────
router.get("/stats", (req, res) => {
  const db = getDb();
  res.json({
    vorgaenge: db.prepare("SELECT COUNT(*) as c FROM vorgaenge").get().c,
    vorgaengeThisYear: db.prepare("SELECT COUNT(*) as c FROM vorgaenge WHERE year = ?").get(new Date().getFullYear()).c,
    kunden: db.prepare("SELECT COUNT(*) as c FROM kunden").get().c,
    users: db.prepare("SELECT COUNT(*) as c FROM users").get().c,
    bereitschaften: db.prepare("SELECT COUNT(*) as c FROM bereitschaften").get().c,
    templates: db.prepare("SELECT COUNT(*) as c FROM pdf_templates").get().c,
    lastSync: db.prepare("SELECT MAX(synced_at) as t FROM vorgaenge").get().t,
  });
});

module.exports = router;
