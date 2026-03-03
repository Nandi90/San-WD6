/**
 * Nextcloud WebDAV Service
 * Config aus DB (app_config) + Service-Account oder Bearer Auth
 */

const { createClient } = require("webdav");

function cfg(key, fallback) {
  try {
    const { getConfig } = require("../db");
    return getConfig(key, fallback || "");
  } catch(e) {
    console.warn("Nextcloud cfg() Fehler:", e.message);
    return fallback || "";
  }
}

function getClient(session) {
  const authMode = cfg("nextcloud_auth_mode", "service");
  const url = cfg("nextcloud_url", "");
  
  console.log(`Nextcloud getClient: mode=${authMode}, url=${url ? url.substring(0, 30) + "..." : "LEER"}`);
  
  if (!url) {
    console.warn("Nextcloud: Keine URL konfiguriert");
    return { client: null, type: "none", uid: null };
  }

  if (authMode === "service") {
    const user = cfg("nextcloud_service_user", "");
    const pass = cfg("nextcloud_service_password", "");
    console.log(`Nextcloud Service: user=${user || "LEER"}, pass=${pass ? "***" : "LEER"}`);
    
    if (user && pass) {
      const davUrl = `${url}/remote.php/dav/files/${user}`;
      const wc = createClient(davUrl, { username: user, password: pass });
      console.log(`Nextcloud Client OK: putFileContents=${typeof wc.putFileContents}`);
      return { client: wc, type: "service", uid: user };
    }
    console.warn("Nextcloud: Service-Account unvollständig");
  }

  if (authMode === "bearer" && session?.accessToken && session?.user) {
    const uid = session.user.email?.split("@")[0] || session.user.sub;
    const davUrl = `${url}/remote.php/dav/files/${uid}`;
    const wc = createClient(davUrl, { headers: { "Authorization": `Bearer ${session.accessToken}` } });
    return { client: wc, type: "bearer", uid };
  }

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

function buildPath(bereitschaftName, bereitschaftCode, year, auftragsnr, eventName) {
  const safe = (s) => String(s || "unbekannt").replace(/[/\\:*?"<>|]/g, "_").substring(0, 60);
  const basePath = cfg("nextcloud_base_path", "SanWD");
  const subFolder = cfg("nextcloud_subfolder", "$auftragsnr - $veranstaltung");
  
  const replacePlaceholders = (tpl) => tpl
    .replace(/\$bereitschaft/g, safe(bereitschaftName))
    .replace(/\$bc/g, safe(bereitschaftCode))
    .replace(/\$jahr/g, String(year))
    .replace(/\$auftragsnr/g, safe(auftragsnr))
    .replace(/\$veranstaltung/g, safe(eventName));
  
  return `/${replacePlaceholders(basePath)}/${replacePlaceholders(subFolder)}`;
}

async function syncVorgang(session, vorgang, pdfs, stamm) {
  const { client: wc, type, uid } = getClient(session);
  if (!wc) {
    return { success: false, error: "Nextcloud nicht verbunden (prüfe Einstellungen im Nextcloud-Tab)" };
  }
  if (typeof wc.putFileContents !== "function") {
    console.error("Nextcloud Client defekt! Keys:", Object.keys(wc).join(", "));
    return { success: false, error: "WebDAV Client fehlerhaft" };
  }

  const ev = vorgang.event || {};
  const bc = vorgang.bereitschaft_code || session?.user?.bereitschaftCode || "UNKNOWN";
  const bcName = stamm?.name || bc;
  const year = new Date().getFullYear().toString();
  const folder = buildPath(bcName, bc, year, ev.auftragsnr, ev.name);

  console.log(`Nextcloud Sync: ${pdfs.length} PDFs -> ${folder} [${type}:${uid}]`);

  const results = [];
  for (const pdf of pdfs) {
    try {
      const remotePath = `${folder}/${pdf.filename}`;
      await uploadFile(wc, remotePath, pdf.data);
      results.push({ file: pdf.filename, ok: true });
      console.log(`  OK ${pdf.filename}`);
    } catch(e) {
      results.push({ file: pdf.filename, ok: false, error: e.message });
      console.error(`  FAIL ${pdf.filename}: ${e.message}`);
    }
  }

  return {
    success: results.every(r => r.ok),
    folder, results, type, uid,
    syncedAt: new Date().toISOString()
  };
}

function isConfigured() {
  return cfg("nextcloud_enabled", "false") === "true" && !!cfg("nextcloud_url");
}

module.exports = { getClient, ensureDir, uploadFile, buildPath, syncVorgang, isConfigured };
