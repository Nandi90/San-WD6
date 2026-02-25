/**
 * ═══════════════════════════════════════════════════════════════════
 * Nextcloud WebDAV Service
 * ═══════════════════════════════════════════════════════════════════
 */

const { createClient } = require("webdav");

let client = null;

function getClient() {
  if (client) return client;
  if (!process.env.NEXTCLOUD_URL || !process.env.NEXTCLOUD_USER) {
    console.warn("⚠️  Nextcloud nicht konfiguriert");
    return null;
  }
  client = createClient(
    `${process.env.NEXTCLOUD_URL}/remote.php/dav/files/${process.env.NEXTCLOUD_USER}`,
    { username: process.env.NEXTCLOUD_USER, password: process.env.NEXTCLOUD_PASSWORD }
  );
  return client;
}

async function ensureDir(dirPath) {
  const wc = getClient();
  if (!wc) return;
  const parts = dirPath.split("/").filter(Boolean);
  let current = "";
  for (const part of parts) {
    current += "/" + part;
    try {
      if (!(await wc.exists(current))) {
        await wc.createDirectory(current);
      }
    } catch { /* ignore */ }
  }
}

async function uploadFile(remotePath, data, contentType = "application/pdf") {
  const wc = getClient();
  if (!wc) return false;
  const dir = remotePath.substring(0, remotePath.lastIndexOf("/"));
  await ensureDir(dir);
  await wc.putFileContents(remotePath, data, { contentType, overwrite: true });
  return true;
}

/**
 * Vorgang-Ordner in Nextcloud:
 * /SanWD/{BC}/{Jahr}/{Auftragsnr} - {Veranstaltung}/
 */
function buildPath(bc, year, auftragsnr, eventName) {
  const safe = (s) => (s || "unbekannt").replace(/[/\\:*?"<>|]/g, "_").substring(0, 60);
  const basePath = process.env.NEXTCLOUD_BASE_PATH || "/SanWD";
  return `${basePath}/${bc}/${year}/${safe(auftragsnr)} - ${safe(eventName)}`;
}

module.exports = { getClient, ensureDir, uploadFile, buildPath };
