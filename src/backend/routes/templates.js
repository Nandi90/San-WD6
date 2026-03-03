const express = require("express");
const multer = require("multer");
const router = express.Router();
const { getDb, audit } = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/rbac");

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (allowed.includes(file.mimetype)) { cb(null, true); }
    else { cb(new Error("Nur PDF und DOCX erlaubt"), false); }
  }
}); // 10MB max

router.use(requireAuth);

// ── Alle Templates auflisten ─────────────────────────────────────
router.get("/", (req, res) => {
  const rows = getDb().prepare(
    "SELECT id, name, description, type, field_mapping, uploaded_by, created_at, updated_at FROM pdf_templates ORDER BY type, name"
  ).all();
  res.json(rows.map(r => ({ ...r, field_mapping: r.field_mapping ? JSON.parse(r.field_mapping) : null })));
});

// ── Template hochladen (Admin only) ──────────────────────────────
router.post("/", requireAdmin, upload.single("template"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Keine Datei" });

  const { name, description, type } = req.body;
  if (!name || !type) return res.status(400).json({ error: "Name und Typ erforderlich" });

  const id = `tpl-${type}-${Date.now()}`;
  getDb().prepare(`
    INSERT INTO pdf_templates (id, name, description, type, data, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name, description || "", type, req.file.buffer, req.session.user.sub);

  audit(req.session.user, "upload", "template", id, `${type}: ${name}`);
  res.json({ success: true, id });
});

// ── Template Feld-Mapping aktualisieren ──────────────────────────
router.put("/:id/mapping", requireAdmin, (req, res) => {
  const { id } = req.params;
  getDb().prepare("UPDATE pdf_templates SET field_mapping = ?, updated_at = datetime('now') WHERE id = ?")
    .run(JSON.stringify(req.body.mapping), id);
  audit(req.session.user, "update_mapping", "template", id);
  res.json({ success: true });
});

// ── Template herunterladen ───────────────────────────────────────
router.get("/:id/download", (req, res) => {
  const row = getDb().prepare("SELECT data, name, type FROM pdf_templates WHERE id = ?").get(req.params.id);
  if (!row || !row.data) return res.status(404).json({ error: "Template nicht gefunden" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${row.name}.pdf"`);
  res.send(row.data);
});

// ── Template löschen ─────────────────────────────────────────────
router.delete("/:id", requireAdmin, (req, res) => {
  getDb().prepare("DELETE FROM pdf_templates WHERE id = ?").run(req.params.id);
  audit(req.session.user, "delete", "template", req.params.id);
  res.json({ success: true });
});

// ── PDF-Felder aus hochgeladenem PDF auslesen ────────────────────
router.get("/:id/fields", requireAdmin, async (req, res) => {
  try {
    const row = getDb().prepare("SELECT data FROM pdf_templates WHERE id = ?").get(req.params.id);
    if (!row || !row.data) return res.status(404).json({ error: "Template nicht gefunden" });

    const { PDFDocument } = require("pdf-lib");
    const pdfDoc = await PDFDocument.load(row.data);
    const form = pdfDoc.getForm();
    const fields = form.getFields().map(f => ({
      name: f.getName(),
      type: f.constructor.name.replace("PDF", "").replace("Field", ""),
    }));
    res.json({ fields });
  } catch (err) {
    res.status(500).json({ error: "PDF-Felder konnten nicht gelesen werden: " + err.message });
  }
});

module.exports = router;
