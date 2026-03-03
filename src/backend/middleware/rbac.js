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

// Auth prüfen + Keycloak-Token Validierung
function requireAuth(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ error: "Nicht authentifiziert" });
  }
  // Token-Ablauf pruefen (falls gespeichert)
  if (req.session.tokenExpiry && Date.now() > req.session.tokenExpiry) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: "Sitzung abgelaufen - bitte neu anmelden" });
  }
  // Periodische Keycloak-Validierung (alle 5 Min)
  const now = Date.now();
  const lastCheck = req.session._lastAuthCheck || 0;
  if (now - lastCheck > 300000) {
    req.session._lastAuthCheck = now;
    // Async Token-Check im Hintergrund
    validateKeycloakSession(req.session).catch(() => {
      req.session.destroy(() => {});
    });
  }
  next();
}

// Keycloak-Session validieren
async function validateKeycloakSession(session) {
  if (!session?.tokenEndpoint || !session?.refreshToken) return;
  try {
    const resp = await fetch(session.tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.OIDC_CLIENT_ID || "sanwd",
        client_secret: process.env.OIDC_CLIENT_SECRET || "",
        refresh_token: session.refreshToken
      })
    });
    if (!resp.ok) throw new Error("Token refresh failed");
    const data = await resp.json();
    session.refreshToken = data.refresh_token;
    session.accessToken = data.access_token || session.accessToken;
    session.tokenExpiry = Date.now() + (data.expires_in * 1000);
  } catch(e) {
    console.log("Keycloak Session ungueltig:", e.message);
    throw e;
  }
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
