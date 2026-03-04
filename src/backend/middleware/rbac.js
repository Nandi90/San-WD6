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
  // Token-Ablauf prüfen: Nur wenn KEIN Refresh-Token vorhanden
  // (mit Refresh-Token wird unten automatisch verlängert)
  if (req.session.tokenExpiry && Date.now() > req.session.tokenExpiry) {
    if (!req.session.refreshToken) {
      // Kein Refresh möglich → Session wirklich abgelaufen
      req.session.destroy(() => {});
      return res.status(401).json({ error: "Sitzung abgelaufen - bitte neu anmelden" });
    }
    // Refresh-Token vorhanden → Versuch im Hintergrund, Request durchlassen
    refreshKeycloakToken(req.session).catch(e => {
      console.warn("Token-Refresh fehlgeschlagen:", e.message);
    });
  }
  // Periodische Keycloak-Validierung (alle 10 Min statt 5)
  const now = Date.now();
  const lastCheck = req.session._lastAuthCheck || 0;
  if (now - lastCheck > 600000) {
    req.session._lastAuthCheck = now;
    // Async Token-Refresh im Hintergrund – NICHT session.destroy bei Fehler!
    refreshKeycloakToken(req.session).catch(e => {
      console.warn("Periodischer Token-Refresh fehlgeschlagen:", e.message);
      // Session NICHT zerstören – User kann weiterarbeiten
      // Erst bei nächstem Login wird Token erneuert
    });
  }
  next();
}

// Keycloak-Token erneuern
async function refreshKeycloakToken(session) {
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
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    session.refreshToken = data.refresh_token || session.refreshToken;
    session.accessToken = data.access_token || session.accessToken;
    session.tokenExpiry = Date.now() + ((data.expires_in || 300) * 1000);
    session._lastAuthCheck = Date.now();
  } catch(e) {
    console.log("Keycloak Token-Refresh:", e.message);
    // Token-Expiry großzügig verlängern damit nicht sofort 401 kommt
    session.tokenExpiry = Date.now() + 3600000; // +1h Kulanz
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
