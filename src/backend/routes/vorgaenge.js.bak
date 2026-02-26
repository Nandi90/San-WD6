const express = require("express");
const router = express.Router();
const { getDb, audit } = require("../db");
const { requireAuth, requireWriteAccess, requireBL, getBereitschaftCode } = require("../middleware/rbac");

router.use(requireAuth);

// ── Hilfsfunktionen ─────────────────────────────────────────────
function getActiveLock(vorgangId, currentUserSub) {
  getDb().prepare("DELETE FROM vorgang_locks WHERE heartbeat < datetime('now', '-60 seconds')").run();
  const lock = getDb().prepare("SELECT * FROM vorgang_locks WHERE vorgang_id = ?").get(vorgangId);
  if (!lock) return null;
  if (lock.user_sub === currentUserSub) return null;
  return lock;
}

function isVersendet(vorgangId) {
  const row = getDb().prepare("SELECT status FROM vorgaenge WHERE id = ?").get(vorgangId);
  return row?.status === "versendet";
}

// ── Angebot entsperren (mit Pflichtbegründung → Audit) ─────────
router.post("/:id/entsperren", requireWriteAccess, (req, res) => {
  const { id } = req.params;
  const { begruendung } = req.body;
  if (!begruendung || begruendung.trim().length < 5) {
    return res.status(400).json({ error: "Begründung erforderlich (mind. 5 Zeichen)" });
  }
  const row = getDb().prepare("SELECT data FROM vorgaenge WHERE id = ?").get(id);
  if (!row) return res.status(404).json({ error: "Nicht gefunden" });
  const d = JSON.parse(row.data);
  const cl = d.event?.checklist || d.checklist || {};
  cl["angebotVersendet"] = false;
  if (d.event?.checklist) d.event.checklist = cl; else d.checklist = cl;
  getDb().prepare("UPDATE vorgaenge SET data = ?, updated_at = datetime('now') WHERE id = ?").run(JSON.stringify(d), id);
  audit(req.session.user, "entsperrt", "vorgang", id, "Begründung: " + begruendung.trim());
  console.log(\`Vorgang \${id} entsperrt von \${req.session.user.name}: \${begruendung}\`);
  res.json({ ok: true });
});

// ═════════════════════════════════════════════════════════════════
// SPEZIFISCHE ROUTEN ZUERST (vor /:year und /:year/:id)
// ═════════════════════════════════════════════════════════════════

// ── Lock erwerben / Heartbeat ───────────────────────────────────
router.post("/:id/lock", requireWriteAccess, (req, res) => {
  const id = req.params.id;
  const user = req.session.user;
  if (isVersendet(id)) {
    return res.status(423).json({ error: "Vorgang ist versendet", reason: "versendet" });
  }
  getDb().prepare("DELETE FROM vorgang_locks WHERE heartbeat < datetime('now', '-60 seconds')").run();
  const existing = getDb().prepare("SELECT * FROM vorgang_locks WHERE vorgang_id = ?").get(id);
  if (existing && existing.user_sub !== user.sub) {
    return res.status(423).json({ error: "Wird bearbeitet von " + existing.user_name, lockedBy: existing.user_name, lockedSince: existing.locked_at });
  }
  getDb().prepare("INSERT INTO vorgang_locks (vorgang_id, user_sub, user_name) VALUES (?, ?, ?) ON CONFLICT(vorgang_id) DO UPDATE SET heartbeat = datetime('now')").run(id, user.sub, user.name);
  res.json({ locked: true, by: user.name });
});

// ── Lock freigeben ──────────────────────────────────────────────
router.delete("/:id/lock", (req, res) => {
  const user = req.session.user;
  const lock = getDb().prepare("SELECT * FROM vorgang_locks WHERE vorgang_id = ?").get(req.params.id);
  if (lock && lock.user_sub !== user.sub && user.rolle !== "admin") {
    return res.status(403).json({ error: "Kann nur eigene Sperre aufheben" });
  }
  getDb().prepare("DELETE FROM vorgang_locks WHERE vorgang_id = ?").run(req.params.id);
  res.json({ unlocked: true });
});

// ── Lock-Status ─────────────────────────────────────────────────
router.get("/:id/lock", (req, res) => {
  getDb().prepare("DELETE FROM vorgang_locks WHERE heartbeat < datetime('now', '-60 seconds')").run();
  const lock = getDb().prepare("SELECT * FROM vorgang_locks WHERE vorgang_id = ?").get(req.params.id);
  if (!lock) return res.json({ locked: false });
  res.json({ locked: true, lockedBy: lock.user_name, lockedSince: lock.locked_at, isMine: lock.user_sub === req.session.user.sub });
});

// ── Status ändern ───────────────────────────────────────────────
router.post("/:id/status", requireBL, (req, res) => {
  const id = req.params.id;
  const user = req.session.user;
  const { status, reason } = req.body;
  if (!["entwurf", "versendet"].includes(status)) {
    return res.status(400).json({ error: "Ungültiger Status" });
  }
  const row = getDb().prepare("SELECT status FROM vorgaenge WHERE id = ?").get(id);
  if (!row) return res.status(404).json({ error: "Nicht gefunden" });
  const oldStatus = row.status || "entwurf";
  if (oldStatus === status) return res.json({ success: true, status });
  getDb().prepare("UPDATE vorgaenge SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
  getDb().prepare("INSERT INTO vorgang_status_log (vorgang_id, old_status, new_status, changed_by_sub, changed_by_name, reason) VALUES (?,?,?,?,?,?)").run(id, oldStatus, status, user.sub, user.name, reason || "");
  audit(user, status === "versendet" ? "status_versendet" : "status_entsperrt", "vorgang", id, oldStatus + " → " + status + (reason ? " (" + reason + ")" : ""));
  if (status === "entwurf") getDb().prepare("DELETE FROM vorgang_locks WHERE vorgang_id = ?").run(id);
  res.json({ success: true, status, oldStatus, changedBy: user.name });
});

// ── Status-Log ──────────────────────────────────────────────────
router.get("/:id/status-log", (req, res) => {
  const rows = getDb().prepare("SELECT * FROM vorgang_status_log WHERE vorgang_id = ? ORDER BY created_at DESC LIMIT 50").all(req.params.id);
  res.json(rows);
});

// ── History ─────────────────────────────────────────────────────
router.get("/:id/history", (req, res) => {
  const audits = getDb().prepare("SELECT user_name, action, details, created_at FROM audit_log WHERE entity = 'vorgang' AND entity_id = ? AND action != 'save' ORDER BY created_at DESC LIMIT 100").all(req.params.id);
  const statusChanges = getDb().prepare("SELECT changed_by_name, old_status, new_status, reason, created_at FROM vorgang_status_log WHERE vorgang_id = ? ORDER BY created_at DESC LIMIT 50").all(req.params.id);
  const history = [
    ...audits.map(a => ({ type: a.action, user: a.user_name, details: a.details, time: a.created_at })),
    ...statusChanges.map(s => ({ type: "status", user: s.changed_by_name, details: s.old_status + " → " + s.new_status + (s.reason ? " (" + s.reason + ")" : ""), time: s.created_at })),
  ].sort((a, b) => b.time.localeCompare(a.time));
  res.json(history);
});

// ═════════════════════════════════════════════════════════════════
// GENERISCHE ROUTEN (/:year und /:year/:id)
// ═════════════════════════════════════════════════════════════════

// ── Liste ───────────────────────────────────────────────────────
router.get("/:year", (req, res) => {
  const year = parseInt(req.params.year);
  const isAdmin = req.session.user.rolle === "admin";

  // Admin mit bc=ALL -> alle Bereitschaften
  if (isAdmin && req.query.bc === "ALL") {
    const rows = getDb().prepare("SELECT id, bereitschaft_code, data, status, created_at, updated_at, synced_at, created_by FROM vorgaenge WHERE year = ? ORDER BY updated_at DESC").all(year);
    return res.json(rows.map(r => ({ id: r.id, status: r.status, _bc: r.bereitschaft_code, ...JSON.parse(r.data), createdAt: r.created_at, updatedAt: r.updated_at, syncedAt: r.synced_at, createdBy: r.created_by })));
  }

  const bc = getBereitschaftCode(req);
  const rows = getDb().prepare("SELECT id, bereitschaft_code, data, status, created_at, updated_at, synced_at, created_by FROM vorgaenge WHERE bereitschaft_code = ? AND year = ? ORDER BY updated_at DESC").all(bc, year);
  res.json(rows.map(r => ({ id: r.id, status: r.status, _bc: r.bereitschaft_code, ...JSON.parse(r.data), createdAt: r.created_at, updatedAt: r.updated_at, syncedAt: r.synced_at, createdBy: r.created_by })));
});

// ── Einzelner Vorgang ───────────────────────────────────────────
router.get("/:year/:id", (req, res) => {
  const bc = getBereitschaftCode(req);
  const row = getDb().prepare("SELECT * FROM vorgaenge WHERE id = ? AND bereitschaft_code = ?").get(req.params.id, bc);
  if (!row) return res.status(404).json({ error: "Nicht gefunden" });
  const activeLock = getActiveLock(req.params.id, req.session.user.sub);
  res.json({ id: row.id, status: row.status, ...JSON.parse(row.data), syncedAt: row.synced_at, _lock: activeLock ? { user: activeLock.user_name, since: activeLock.locked_at } : null, _isVersendet: row.status === "versendet" });
});

// ── Erstellen / Aktualisieren ───────────────────────────────────
router.put("/:id", requireWriteAccess, (req, res) => {
  const isAdmin = req.session.user.rolle === "admin";
  // Admin: BC aus Vorgang-Payload (Bereitschaft die im Auftrag gewaehlt ist)
  // BL: immer eigene Bereitschaft
  const bc = (isAdmin && req.body.bereitschaftCode) ? req.body.bereitschaftCode : getBereitschaftCode(req);
  const { id } = req.params;
  const lock = getActiveLock(id, req.session.user.sub);
  if (lock) return res.status(423).json({ error: "Gesperrt durch " + lock.user_name, lockedBy: lock.user_name });
  const year = req.body.year || new Date().getFullYear();
  const json = JSON.stringify(req.body);
  // Alten Stand lesen für Diff
  let _oldData = null;
  try { const _r = getDb().prepare("SELECT data FROM vorgaenge WHERE id = ?").get(id); if(_r) _oldData = JSON.parse(_r.data); } catch {}
  getDb().prepare("INSERT INTO vorgaenge (id, bereitschaft_code, year, data, created_by) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = ?, updated_at = datetime('now')").run(id, bc, year, json, req.session.user.sub, json);
  // Checklist-Diff + Feld-Diff
  if (_oldData) {
    try {
      const oldCL = _oldData.event?.checklist || _oldData.checklist || {};
      const newParsed = JSON.parse(json);
      const newCL = newParsed.event?.checklist || newParsed.checklist || {};
      const changes = [];
      for (const [k, v] of Object.entries(newCL)) { if (v && !oldCL[k]) changes.push("\u2705 " + k); }
      for (const [k, v] of Object.entries(oldCL)) { if (v && !newCL[k]) changes.push("\u274c " + k); }
      if (changes.length > 0) {
        console.log("Checklist-Diff:", id, changes);
        audit(req.session.user, "checklist", "vorgang", id, changes.join(", "));
      }
      // Feld-Diff: wichtige Event-Felder tracken
      const oldE = _oldData.event || _oldData;
      const newE = newParsed.event || newParsed;
      const tracked = ["name","ort","veranstalter","ansprechpartner","auflagen","pauschalangebot","bemerkung"];
      const fieldChanges = [];
      for (const f of tracked) {
        if (String(oldE[f]||"") !== String(newE[f]||"")) fieldChanges.push(f);
      }
      if (fieldChanges.length > 0) {
        audit(req.session.user, "edit", "vorgang", id, "Felder: " + fieldChanges.join(", "));
      }
    } catch(e) { console.error("Diff-Fehler:", e.message); }
  }
  audit(req.session.user, "save", "vorgang", id, "Bereitschaft: " + bc);
  res.json({ success: true });
});

// ── Löschen ─────────────────────────────────────────────────────
router.delete("/:id", requireWriteAccess, (req, res) => {
  const isAdmin = req.session.user.rolle === "admin";
  const bc = getBereitschaftCode(req);
  try {
    getDb().prepare("DELETE FROM vorgang_locks WHERE vorgang_id = ?").run(req.params.id);
    if (isAdmin) {
      getDb().prepare("DELETE FROM vorgaenge WHERE id = ?").run(req.params.id);
    } else {
      getDb().prepare("DELETE FROM vorgaenge WHERE id = ? AND bereitschaft_code = ?").run(req.params.id, bc);
    }
    audit(req.session.user, "delete", "vorgang", req.params.id);
    res.json({ success: true });
  } catch(e) {
    console.error("DELETE error:", e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
