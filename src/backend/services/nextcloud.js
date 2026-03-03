/**
 * ═══════════════════════════════════════════════════════════════════
 * Nextcloud WebDAV Service
 * Config aus DB (app_config) + Bearer Auth (User-OIDC)
 * ═══════════════════════════════════════════════════════════════════
 */

const { createClient } = require("webdav");

function cfg(key, fallback) {
  try {
    const { getConfig } = require("../db");
    return getConfig(key, fallback || "");
  } catch { return process.env[key.toUpperCase().replace(/^nextcloud_/, "NEXTCLOUD_")] || fallback || ""; }
}

// User-Token Client (OIDC Bearer)
function getUserClient(accessToken, username) {
  const url = cfg("nextcloud_url");
  if (!url || !accessToken) return null;
  return createClient(
    `${url}/remote.php/dav/files/${username}`,
    { headers: { "Authorization": `Bearer ${accessToken}` } }
  );
}

// Service-Account Client (Fallback)
let _serviceClient = null;
function getServiceClient() {
  const url = cfg("nextcloud_url");
  const user = process.env.NEXTCLOUD_USER || "";
  const pass = process.env.NEXTCLOUD_PASSWORD || "";
  if (!url || !user) return null;
  if (!_serviceClient) {
    _serviceClient = createClient(`${url}/remote.php/dav/files/${user}`, { username: user, password: pass });
  }
  return _serviceClient;
}

function getClient(session) {
  const authMode = cfg("nextcloud_auth_mode", "service");
  
  // Service-Account (aus DB-Config oder ENV)
  if (authMode === "service") {
    const user = cfg("nextcloud_service_user") || process.env.NEXTCLOUD_USER || "";
    const pass = cfg("nextcloud_service_password") || process.env.NEXTCLOUD_PASSWORD || "";
    const url = cfg("nextcloud_url");
    if (url && user && pass) {
      const wc = createClient(`${url}/remote.php/dav/files/${user}`, { username: user, password: pass });
      return { client: wc, type: "service", uid: user };
    }
  }
  
  // Bearer Token (OIDC)
  if (authMode === "bearer" && session?.accessToken && session?.user) {
    const uid = session.user.email?.split("@")[0] || session.user.sub;
    const wc = getUserClient(session.accessToken, uid);
    if (wc) return { client: wc, type: "bearer", uid };
  }

  // Fallback: Service-Account aus ENV
  const sc = getServiceClient();
  if (sc) return { client: sc, type: "service", uid: process.env.NEXTCLOUD_USER };
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
    } catch { /* dir exists */ }
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
 * Pfad aus Template bauen
 * Platzhalter: $bereitschaft, $bc, $jahr, $auftragsnr, $veranstaltung
 */
function buildPath(bereitschaftName, bereitschaftCode, year, auftragsnr, eventName) {
  const safe = (s) => (s || "unbekannt").replace(/[/\\:*?"<>|]/g, "_").substring(0, 60);
  const basePath = cfg("nextcloud_base_path", "Verwaltung Bereitschaft $bereitschaft/SanWD");
  const subFolder = cfg("nextcloud_subfolder", "$auftragsnr - $veranstaltung");
  
  const replacePlaceholders = (tpl) => tpl
    .replace(/\$bereitschaft/g, safe(bereitschaftName))
    .replace(/\$bc/g, safe(bereitschaftCode))
    .replace(/\$jahr/g, String(year))
    .replace(/\$auftragsnr/g, safe(auftragsnr))
    .replace(/\$veranstaltung/g, safe(eventName));
  
  const base = replacePlaceholders(basePath);
  const sub = replacePlaceholders(subFolder);
  return `/${base}/${sub}`;
}

async function syncVorgang(session, vorgang, pdfs, stamm) {
  const { client: wc, type, uid } = getClient(session);
  if (!wc) {
    console.warn("Nextcloud: Kein Client verfügbar");
    return { success: false, error: "Nextcloud nicht verbunden (kein Token/Service-Account)" };
  }

  const ev = vorgang.event || {};
  const bc = vorgang.bereitschaft_code || session?.user?.bereitschaftCode || "UNKNOWN";
  const bcName = stamm?.name || bc;
  const year = new Date().getFullYear().toString();
  const folder = buildPath(bcName, bc, year, ev.auftragsnr, ev.name);

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
  return cfg("nextcloud_enabled", "false") === "true" && !!cfg("nextcloud_url");
}

module.exports = { getClient, ensureDir, uploadFile, buildPath, syncVorgang, isConfigured };
