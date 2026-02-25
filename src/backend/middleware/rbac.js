/**
 * ═══════════════════════════════════════════════════════════════════
 * RBAC Middleware - Rollen-basierte Zugriffskontrolle
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Rollen-Hierarchie:
 *   admin  → Alles (alle Bereitschaften, Stammdaten, Templates)
 *   bl     → Eigene Bereitschaft: CRUD Vorgänge, Kunden, Angebote
 *   helfer → Eigene Bereitschaft: Nur lesen, Checkliste
 */

// Auth prüfen
function requireAuth(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ error: "Nicht authentifiziert" });
  }
  next();
}

// Bestimmte Rolle(n) verlangen
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session?.user) {
      return res.status(401).json({ error: "Nicht authentifiziert" });
    }
    if (!roles.includes(req.session.user.rolle)) {
      return res.status(403).json({ error: "Keine Berechtigung", required: roles, actual: req.session.user.rolle });
    }
    next();
  };
}

// Mindestens Bereitschaftsleiter
const requireBL = requireRole("admin", "bl");

// Nur Admin
const requireAdmin = requireRole("admin");

// Bereitschaft aus User oder Query (Admin darf andere sehen)
function getBereitschaftCode(req) {
  if (req.session.user.rolle === "admin" && req.query.bc) {
    return req.query.bc;
  }
  return req.session.user.bereitschaftCode;
}

// Schreibzugriff: mindestens BL + eigene Bereitschaft
function requireWriteAccess(req, res, next) {
  const user = req.session.user;
  if (!user) return res.status(401).json({ error: "Nicht authentifiziert" });
  if (user.rolle === "helfer") {
    return res.status(403).json({ error: "Helfer haben keinen Schreibzugriff" });
  }
  next();
}

module.exports = {
  requireAuth,
  requireRole,
  requireBL,
  requireAdmin,
  requireWriteAccess,
  getBereitschaftCode,
};
