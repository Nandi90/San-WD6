/**
 * ═══════════════════════════════════════════════════════════════════
 * Auth Middleware - OIDC/Keycloak mit Rollenverwaltung
 * ═══════════════════════════════════════════════════════════════════
 */

const { Issuer, generators } = require("openid-client");
const { getDb, audit } = require("../db");

let oidcClient = null;

async function getClient() {
  if (oidcClient) return oidcClient;
  if (!process.env.OIDC_ISSUER) {
    console.warn("⚠️  OIDC nicht konfiguriert — Dev-Modus aktiv");
    return null;
  }
  const issuer = await Issuer.discover(process.env.OIDC_ISSUER);
  oidcClient = new issuer.Client({
    client_id: process.env.OIDC_CLIENT_ID,
    client_secret: process.env.OIDC_CLIENT_SECRET,
    redirect_uris: [process.env.OIDC_REDIRECT_URI],
    response_types: ["code"],
  });
  console.log("✅ OIDC Client initialisiert:", process.env.OIDC_ISSUER);
  return oidcClient;
}

// ── Rolle aus Keycloak Claims bestimmen ──────────────────────────
// BRK.id MemberShip-IDs → Bereitschaft-Code + Rolle
const GROUP_MAP = {
  "GRP_Kreisbereitschaftsleitung": { code: "KBL",   rolle: "admin" },
  "GRP_Bereitschaft_ND":           { code: "BND",   rolle: "bl"    },
  "GRP_Bereitschaft_SOB":          { code: "BSOB",  rolle: "bl"    },
  "GRP_Bereitschaft_BGH":          { code: "BBGH",  rolle: "bl"    },
  "GRP_Bereitschaft_KaHu":         { code: "BKAHU", rolle: "bl"    },
  "GRP_Bereitschaft_KarKo":        { code: "BKK",   rolle: "bl"    },
  "GRP_Bereitschaft_WEIlG":        { code: "BWEIG", rolle: "bl"    },
};

function extractRole(userinfo) {
  const groups = userinfo.groups || [];
  // KBL hat immer Vorrang → admin
  if (groups.includes("GRP_Kreisbereitschaftsleitung")) return "admin";
  for (const g of groups) {
    if (GROUP_MAP[g]) return GROUP_MAP[g].rolle;
  }
  return "helfer";
}

function extractBereitschaft(userinfo) {
  const groups = userinfo.groups || [];
  // KBL → eigene Bereitschaft behalten aber Rolle=admin
  // Spezifische Bereitschaft als Code, auch wenn Admin
  const specific = groups.find(g => GROUP_MAP[g] && GROUP_MAP[g].code !== "KBL");
  if (specific) return GROUP_MAP[specific].code;
  if (groups.includes("GRP_Kreisbereitschaftsleitung")) return "KBL";
  return null;
}



// ── User in DB aktualisieren ─────────────────────────────────────
function syncUser(sessionUser) {
  const db = getDb();
  db.prepare(`
    INSERT INTO users (sub, name, email, rolle, bereitschaft_code, last_login)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(sub) DO UPDATE SET
      name = excluded.name,
      email = CASE WHEN users.email != '' AND users.email IS NOT NULL THEN users.email ELSE excluded.email END,
      rolle = excluded.rolle,
      bereitschaft_code = excluded.bereitschaft_code,
      last_login = datetime('now')
  `).run(
    sessionUser.sub,
    sessionUser.name,
    sessionUser.email,
    sessionUser.rolle,
    sessionUser.bereitschaftCode
  );
}

// ── Express Router ───────────────────────────────────────────────
const express = require("express");
const router = express.Router();

// Login
router.get("/login", async (req, res) => {
  const client = await getClient();
  if (!client) {
    // Dev-Modus
    req.session.user = {
      sub: "dev-admin",
      name: "Ferdinand Liebl",
      email: "liebl@kvndsob.brk.de",
      rolle: "admin",
      bereitschaftCode: req.query.bc || "BSOB",
    };
    syncUser(req.session.user);
    audit(req.session.user, "login", "user", req.session.user.sub, "Dev-Login");
    return res.redirect(process.env.APP_URL || "/");
  }

  const nonce = generators.nonce();
  const state = generators.state();
  req.session.oidcNonce = nonce;
  req.session.oidcState = state;

  res.redirect(client.authorizationUrl({
    scope: "openid profile email groups",
    nonce, state,
  }));
});

// Callback
router.get("/callback", async (req, res) => {
  try {
    const client = await getClient();
    if (!client) return res.redirect("/");

    const params = client.callbackParams(req);
    const tokenSet = await client.callback(
      process.env.OIDC_REDIRECT_URI, params,
      { nonce: req.session.oidcNonce, state: req.session.oidcState }
    );
    const userinfo = await client.userinfo(tokenSet.access_token);

    // DEBUG: Alle Claims loggen
    console.log("OIDC userinfo claims:", JSON.stringify({
      sub: userinfo.sub,
      groups: userinfo.groups,
      memberOf: userinfo.memberOf,
      membership: userinfo.membership,
      roles: userinfo.realm_access?.roles,
      clientRoles: userinfo.resource_access?.[process.env.OIDC_CLIENT_ID]?.roles,
      allKeys: Object.keys(userinfo)
    }, null, 2));

    const rolle = extractRole(userinfo);
    let bereitschaftCode = extractBereitschaft(userinfo);

    if (!bereitschaftCode || bereitschaftCode === "ADMIN") {
      if (rolle === "admin") {
        bereitschaftCode = "KBL";
      } else {
        return res.status(403).send("Keine Bereitschaft zugewiesen. Bitte beim Admin melden.");
      }
    }

    // Prüfe ob Bereitschaft existiert
    const db = getDb();
    const bc = db.prepare("SELECT code FROM bereitschaften WHERE code = ?").get(bereitschaftCode);
    if (!bc) {
      return res.status(403).send(`Bereitschaft "${bereitschaftCode}" nicht in der Datenbank. Admin kontaktieren.`);
    }

    req.session.user = {
      sub: userinfo.sub,
      name: userinfo.name || userinfo.preferred_username,
      email: userinfo.email,
      rolle,
      bereitschaftCode,
    };

    syncUser(req.session.user);
    audit(req.session.user, "login", "user", req.session.user.sub, `Rolle: ${rolle}`);

    delete req.session.oidcNonce;
    delete req.session.oidcState;
    res.redirect(process.env.APP_URL || "/");
  } catch (err) {
    console.error("OIDC Callback Fehler:", err);
    res.status(500).send("Authentifizierung fehlgeschlagen: " + err.message);
  }
});

// Logout
router.get("/logout", (req, res) => {
  if (req.session.user) {
    audit(req.session.user, "logout", "user", req.session.user.sub);
  }
  req.session.destroy(() => res.redirect("/"));
});

// Status
router.get("/status", (req, res) => {
  if (!req.session?.user) return res.json({ authenticated: false });
  const db = getDb();
  const bc = db.prepare("SELECT code, name, short FROM bereitschaften WHERE code = ?")
    .get(req.session.user.bereitschaftCode);
  res.json({
    authenticated: true,
    user: { ...req.session.user, bereitschaft: bc },
  });
});

module.exports = router;
