/**
 * ═══════════════════════════════════════════════════════════════════
 * Nextcloud WebDAV Service
 * Unterstützt: Bearer Token (User-OIDC) ODER Service-Account (User/PW)
 * ═══════════════════════════════════════════════════════════════════
 */

const { createClient } = require("webdav");

const NC_URL = () => process.env.NEXTCLOUD_URL || "";
const NC_USER = () => process.env.NEXTCLOUD_USER || "";
const NC_PASS = () => process.env.NEXTCLOUD_PASSWORD || "";
const NC_BASE = () => process.env.NEXTCLOUD_BASE_PATH || "/SanWD";

// Service-Account Client (Fallback)
let _serviceClient = null;
function getServiceClient() {
  if (_serviceClient) return _serviceClient;
  if (!NC_URL() || !NC_USER()) return null;
  _serviceClient = createClient(
    `${NC_URL()}/remote.php/dav/files/${NC_USER()}`,
    { username: NC_USER(), password: NC_PASS() }
  );
  return _serviceClient;
}

// User-Token Client (bevorzugt)
function getUserClient(accessToken, username) {
  if (!NC_URL() || !accessToken) return null;
  const uid = username || "user";
  return createClient(
    `${NC_URL()}/remote.php/dav/files/${uid}`,
    { headers: { "Authorization": `Bearer ${accessToken}` } }
  );
}

// Bester verfügbarer Client
function getClient(session) {
  // 1. User-Token (OIDC SSO)
  if (session?.accessToken && session?.user?.sub) {
    const uid = session.user.ncUser || session.user.email?.split("@")[0] || session.user.sub;
    return { client: getUserClient(session.accessToken, uid), type: "user", uid };
  }
  // 2. Service-Account (Fallback)
  const sc = getServiceClient();
  if (sc) return { client: sc, type: "service", uid: NC_USER() };
  return { client: null, type: "none", uid: null };
}

async function ensureDir(wc, dirPath) {
  if (!wc) return;
  const parts = dirPath.split("/").filter(Boolean);
  let current = "";
  for (const part of parts) {
    current += "/" + part;
    try {
      if (!(await wc.exists(current))) {
        await wc.createDirectory(current);
      }
    } catch { /* dir exists or parent missing - continue */ }
  }
}

async function uploadFile(wc, remotePath, data, contentType = "application/pdf") {
  if (!wc) return false;
  const dir = remotePath.substring(0, remotePath.lastIndexOf("/"));
  await ensureDir(wc, dir);
  await wc.putFileContents(remotePath, data, { contentType, overwrite: true });
  return true;
}

/**
 * Vorgang-Ordner:
 * /SanWD/{BC}/{Jahr}/{Auftragsnr} - {Veranstaltung}/
 */
function buildPath(bc, year, auftragsnr, eventName) {
  const safe = (s) => (s || "unbekannt").replace(/[/\\:*?"<>|]/g, "_").substring(0, 60);
  return `${NC_BASE()}/${bc}/${year}/${safe(auftragsnr)} - ${safe(eventName)}`;
}

/**
 * Alle PDFs eines Vorgangs in Nextcloud hochladen
 */
async function syncVorgang(session, vorgang, pdfs) {
  const { client: wc, type, uid } = getClient(session);
  if (!wc) {
    console.warn("Nextcloud: Kein Client verfügbar (weder Token noch Service-Account)");
    return { success: false, error: "Nextcloud nicht konfiguriert" };
  }

  const ev = vorgang.event || {};
  const bc = vorgang.bereitschaft_code || session?.user?.bereitschaftCode || "UNKNOWN";
  const year = new Date().getFullYear().toString();
  const folder = buildPath(bc, year, ev.auftragsnr, ev.name);

  const results = [];
  for (const pdf of pdfs) {
    try {
      const remotePath = `${folder}/${pdf.filename}`;
      await uploadFile(wc, remotePath, pdf.data);
      results.push({ file: pdf.filename, ok: true });
      console.log(`Nextcloud [${type}:${uid}]: ${remotePath} ✅`);
    } catch(e) {
      results.push({ file: pdf.filename, ok: false, error: e.message });
      console.error(`Nextcloud [${type}:${uid}]: ${pdf.filename} ❌`, e.message);
    }
  }

  return {
    success: results.every(r => r.ok),
    folder,
    results,
    type,
    uid,
    syncedAt: new Date().toISOString()
  };
}

function isConfigured() {
  return !!(NC_URL());
}

module.exports = { getClient, ensureDir, uploadFile, buildPath, syncVorgang, isConfigured };
