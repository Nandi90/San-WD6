#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════
SanWD v6 – Patch: Vorgang-Sperren & Status-Sperre
═══════════════════════════════════════════════════════════════════

Feature 1: Live-Bearbeitungssperre (Concurrent Edit Lock)
  - Wer einen Vorgang öffnet, sperrt ihn automatisch
  - Heartbeat alle 30s hält die Sperre aktiv
  - Timeout nach 60s → Sperre verfällt automatisch
  - Andere User sehen "Wird bearbeitet von [Name]"

Feature 2: Status-Sperre "Angebot versendet"
  - Button "Angebot versendet" setzt Status → read-only
  - Nur explizites Entsperren hebt die Sperre auf
  - Vollständiges Audit-Log (wer, wann, was)

Dateien:
  1. db/index.js         – Neue Tabelle vorgang_locks
  2. routes/vorgaenge.js  – Lock/Unlock/Status API + Sperr-Prüfung
  3. frontend/App.jsx     – Lock-UI, Heartbeat, Status-Toggle
"""

import os, sys, re

BASE = "/home/k8susr/SanWD/sanwd-k8s/sanwd-v6/src"
BE = os.path.join(BASE, "backend")
FE = os.path.join(BASE, "frontend/src")

def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()

def write(path, content):
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def patch(path, old, new, label=""):
    c = read(path)
    if old not in c:
        print(f"  ⚠️  Pattern nicht gefunden: {label or old[:60]}")
        return False
    c = c.replace(old, new, 1)
    write(path, c)
    print(f"  ✅ {label or 'Patch angewendet'}")
    return True

# ═══════════════════════════════════════════════════════════════════
# 1. DB: Lock-Tabelle hinzufügen
# ═══════════════════════════════════════════════════════════════════
print("\n🔧 1/3 – Datenbank: Lock-Tabelle + Status-Log...")

db_path = os.path.join(BE, "db/index.js")
db = read(db_path)

# Lock-Tabelle in migrate() einfügen
if "vorgang_locks" not in db:
    patch(db_path,
        "CREATE TABLE IF NOT EXISTS audit_log",
        """CREATE TABLE IF NOT EXISTS vorgang_locks (
      vorgang_id TEXT PRIMARY KEY,
      user_sub TEXT NOT NULL,
      user_name TEXT NOT NULL,
      locked_at TEXT DEFAULT (datetime('now')),
      heartbeat TEXT DEFAULT (datetime('now'))
    );

    -- ── Status-Änderungslog ─────────────────────────────────────
    CREATE TABLE IF NOT EXISTS vorgang_status_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vorgang_id TEXT NOT NULL,
      old_status TEXT,
      new_status TEXT NOT NULL,
      changed_by_sub TEXT,
      changed_by_name TEXT,
      reason TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_log""",
        "Lock-Tabelle + Status-Log eingefügt")
else:
    print("  ℹ️  vorgang_locks existiert bereits")

# ═══════════════════════════════════════════════════════════════════
# 2. Backend: vorgaenge.js komplett ersetzen
# ═══════════════════════════════════════════════════════════════════
print("\n🔧 2/3 – Backend: vorgaenge.js mit Lock-Logik...")

vorgaenge_path = os.path.join(BE, "routes/vorgaenge.js")

new_vorgaenge = r'''const express = require("express");
const router = express.Router();
const { getDb, audit } = require("../db");
const { requireAuth, requireWriteAccess, requireBL, getBereitschaftCode } = require("../middleware/rbac");

router.use(requireAuth);

// ── Hilfsfunktionen ─────────────────────────────────────────────

/** Prüft ob ein Vorgang gerade von jemand anderem bearbeitet wird */
function getActiveLock(vorgangId, currentUserSub) {
  // Locks älter als 60s (kein Heartbeat) automatisch entfernen
  getDb().prepare("DELETE FROM vorgang_locks WHERE heartbeat < datetime('now', '-60 seconds')").run();
  const lock = getDb().prepare("SELECT * FROM vorgang_locks WHERE vorgang_id = ?").get(vorgangId);
  if (!lock) return null;
  if (lock.user_sub === currentUserSub) return null; // eigene Sperre ignorieren
  return lock;
}

/** Prüft ob Vorgang im Status "versendet" ist */
function isVersendet(vorgangId) {
  const row = getDb().prepare("SELECT status FROM vorgaenge WHERE id = ?").get(vorgangId);
  return row?.status === "versendet";
}

// ── Liste aller Vorgänge ────────────────────────────────────────
router.get("/:year", (req, res) => {
  const bc = getBereitschaftCode(req);
  const year = parseInt(req.params.year);
  const rows = getDb().prepare(
    `SELECT id, data, status, created_at, updated_at, synced_at, created_by
     FROM vorgaenge WHERE bereitschaft_code = ? AND year = ?
     ORDER BY updated_at DESC`
  ).all(bc, year);
  res.json(rows.map(r => ({
    id: r.id, status: r.status, ...JSON.parse(r.data),
    createdAt: r.created_at, updatedAt: r.updated_at,
    syncedAt: r.synced_at, createdBy: r.created_by,
  })));
});

// ── Einzelner Vorgang ───────────────────────────────────────────
router.get("/:year/:id", (req, res) => {
  const bc = getBereitschaftCode(req);
  const row = getDb().prepare(
    "SELECT * FROM vorgaenge WHERE id = ? AND bereitschaft_code = ?"
  ).get(req.params.id, bc);
  if (!row) return res.status(404).json({ error: "Nicht gefunden" });

  // Lock-Info mitliefern
  const lock = getDb().prepare("SELECT * FROM vorgang_locks WHERE vorgang_id = ?").get(req.params.id);
  const activeLock = getActiveLock(req.params.id, req.session.user.sub);

  res.json({
    id: row.id, status: row.status,
    ...JSON.parse(row.data),
    syncedAt: row.synced_at,
    _lock: activeLock ? { user: activeLock.user_name, since: activeLock.locked_at } : null,
    _isVersendet: row.status === "versendet",
  });
});

// ── Erstellen / Aktualisieren ───────────────────────────────────
router.put("/:id", requireWriteAccess, (req, res) => {
  const bc = getBereitschaftCode(req);
  const { id } = req.params;

  // Sperre 1: Bearbeitungssperre durch anderen User
  const lock = getActiveLock(id, req.session.user.sub);
  if (lock) {
    return res.status(423).json({
      error: `Vorgang wird gerade von ${lock.user_name} bearbeitet`,
      lockedBy: lock.user_name, lockedSince: lock.locked_at
    });
  }

  // Sperre 2: Status-Sperre (versendet)
  if (isVersendet(id)) {
    return res.status(423).json({
      error: "Vorgang ist als 'Angebot versendet' gesperrt. Bitte erst entsperren.",
      reason: "versendet"
    });
  }

  const year = req.body.year || new Date().getFullYear();
  const json = JSON.stringify(req.body);

  getDb().prepare(`
    INSERT INTO vorgaenge (id, bereitschaft_code, year, data, created_by)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET data = ?, updated_at = datetime('now')
  `).run(id, bc, year, json, req.session.user.sub, json);

  audit(req.session.user, "save", "vorgang", id, `Bereitschaft: ${bc}`);
  res.json({ success: true });
});

// ── Löschen ─────────────────────────────────────────────────────
router.delete("/:id", requireWriteAccess, (req, res) => {
  const bc = getBereitschaftCode(req);
  // Lock prüfen
  const lock = getActiveLock(req.params.id, req.session.user.sub);
  if (lock) {
    return res.status(423).json({ error: `Gesperrt durch ${lock.user_name}` });
  }
  getDb().prepare("DELETE FROM vorgang_locks WHERE vorgang_id = ?").run(req.params.id);
  getDb().prepare("DELETE FROM vorgaenge WHERE id = ? AND bereitschaft_code = ?")
    .run(req.params.id, bc);
  audit(req.session.user, "delete", "vorgang", req.params.id);
  res.json({ success: true });
});

// ═════════════════════════════════════════════════════════════════
// LOCK-Endpunkte (Bearbeitungssperre)
// ═════════════════════════════════════════════════════════════════

/** Lock erwerben / Heartbeat senden */
router.post("/:id/lock", requireWriteAccess, (req, res) => {
  const id = req.params.id;
  const user = req.session.user;

  // Status-Sperre prüfen
  if (isVersendet(id)) {
    return res.status(423).json({ error: "Vorgang ist versendet – nur Lesen möglich", reason: "versendet" });
  }

  // Abgelaufene Locks aufräumen
  getDb().prepare("DELETE FROM vorgang_locks WHERE heartbeat < datetime('now', '-60 seconds')").run();

  const existing = getDb().prepare("SELECT * FROM vorgang_locks WHERE vorgang_id = ?").get(id);

  if (existing && existing.user_sub !== user.sub) {
    // Jemand anderes hat den Lock
    return res.status(423).json({
      error: `Wird bearbeitet von ${existing.user_name}`,
      lockedBy: existing.user_name, lockedSince: existing.locked_at
    });
  }

  // Lock erwerben oder Heartbeat aktualisieren
  getDb().prepare(`
    INSERT INTO vorgang_locks (vorgang_id, user_sub, user_name)
    VALUES (?, ?, ?)
    ON CONFLICT(vorgang_id) DO UPDATE SET heartbeat = datetime('now')
  `).run(id, user.sub, user.name);

  res.json({ locked: true, by: user.name });
});

/** Lock freigeben */
router.delete("/:id/lock", (req, res) => {
  const id = req.params.id;
  const user = req.session.user;

  // Nur eigenen Lock freigeben (oder Admin)
  const lock = getDb().prepare("SELECT * FROM vorgang_locks WHERE vorgang_id = ?").get(id);
  if (lock && lock.user_sub !== user.sub && user.rolle !== "admin") {
    return res.status(403).json({ error: "Kann nur eigene Sperre aufheben" });
  }

  getDb().prepare("DELETE FROM vorgang_locks WHERE vorgang_id = ?").run(id);
  res.json({ unlocked: true });
});

/** Lock-Status abfragen */
router.get("/:id/lock", (req, res) => {
  getDb().prepare("DELETE FROM vorgang_locks WHERE heartbeat < datetime('now', '-60 seconds')").run();
  const lock = getDb().prepare("SELECT * FROM vorgang_locks WHERE vorgang_id = ?").get(req.params.id);
  if (!lock) return res.json({ locked: false });
  res.json({
    locked: true, lockedBy: lock.user_name,
    lockedSince: lock.locked_at, isMine: lock.user_sub === req.session.user.sub
  });
});

// ═════════════════════════════════════════════════════════════════
// STATUS-Endpunkte (Angebot versendet / Entsperren)
// ═════════════════════════════════════════════════════════════════

/** Status ändern (versendet / entwurf) */
router.post("/:id/status", requireBL, (req, res) => {
  const id = req.params.id;
  const user = req.session.user;
  const { status, reason } = req.body;

  if (!["entwurf", "versendet"].includes(status)) {
    return res.status(400).json({ error: "Ungültiger Status. Erlaubt: entwurf, versendet" });
  }

  const row = getDb().prepare("SELECT status FROM vorgaenge WHERE id = ?").get(id);
  if (!row) return res.status(404).json({ error: "Vorgang nicht gefunden" });

  const oldStatus = row.status || "entwurf";
  if (oldStatus === status) {
    return res.json({ success: true, status, message: "Status unverändert" });
  }

  // Status ändern
  getDb().prepare("UPDATE vorgaenge SET status = ?, updated_at = datetime('now') WHERE id = ?")
    .run(status, id);

  // Status-Log schreiben
  getDb().prepare(`
    INSERT INTO vorgang_status_log (vorgang_id, old_status, new_status, changed_by_sub, changed_by_name, reason)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, oldStatus, status, user.sub, user.name, reason || "");

  // Audit-Log
  const action = status === "versendet" ? "status_versendet" : "status_entsperrt";
  audit(user, action, "vorgang", id, `${oldStatus} → ${status}${reason ? ` (${reason})` : ""}`);

  // Bei Entsperrung: Edit-Lock entfernen
  if (status === "entwurf") {
    getDb().prepare("DELETE FROM vorgang_locks WHERE vorgang_id = ?").run(id);
  }

  res.json({ success: true, status, oldStatus, changedBy: user.name });
});

/** Status-Historie abrufen */
router.get("/:id/status-log", (req, res) => {
  const rows = getDb().prepare(
    "SELECT * FROM vorgang_status_log WHERE vorgang_id = ? ORDER BY created_at DESC LIMIT 50"
  ).all(req.params.id);
  res.json(rows);
});

module.exports = router;
'''

write(vorgaenge_path, new_vorgaenge)
print("  ✅ vorgaenge.js komplett neu geschrieben mit Lock+Status-Logik")

# ═══════════════════════════════════════════════════════════════════
# 3. Frontend: App.jsx patchen
# ═══════════════════════════════════════════════════════════════════
print("\n🔧 3/3 – Frontend: Lock-UI, Heartbeat, Status-Toggle...")

app_path = os.path.join(FE, "App.jsx")
app = read(app_path)

# 3a: API-Funktionen hinzufügen (nach bestehenden API-Definitionen)
api_marker = "deleteVorgang"
api_line_match = None
for i, line in enumerate(app.split("\n")):
    if api_marker in line and "fetch" in line:
        api_line_match = line
        break

if api_line_match and "lockVorgang" not in app:
    app = app.replace(api_line_match, api_line_match + """
  static async lockVorgang(id){const r=await fetch("/api/vorgaenge/"+id+"/lock",{method:"POST",credentials:"include"});return r.json();}
  static async unlockVorgang(id){const r=await fetch("/api/vorgaenge/"+id+"/lock",{method:"DELETE",credentials:"include"});return r.json();}
  static async getLockStatus(id){const r=await fetch("/api/vorgaenge/"+id+"/lock",{credentials:"include"});return r.json();}
  static async setVorgangStatus(id,status,reason){const r=await fetch("/api/vorgaenge/"+id+"/status",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({status,reason})});return r.json();}
  static async getStatusLog(id){const r=await fetch("/api/vorgaenge/"+id+"/status-log",{credentials:"include"});return r.json();}""")
    print("  ✅ API-Funktionen (lock/unlock/status) hinzugefügt")
else:
    if "lockVorgang" in app:
        print("  ℹ️  API-Lock-Funktionen existieren bereits")
    else:
        print("  ⚠️  API-Marker nicht gefunden – manuell prüfen")

# 3b: State-Variablen für Lock/Status hinzufügen
state_marker = "const [currentEventId,setCurrentEventId]=useState(null);"
if state_marker in app and "lockInfo" not in app:
    app = app.replace(state_marker, state_marker + """
  const [lockInfo,setLockInfo]=useState(null);
  const [vorgangStatus,setVorgangStatus]=useState("entwurf");
  const [statusLog,setStatusLog]=useState([]);
  const isLockedByOther=!!lockInfo;
  const isVersendet=vorgangStatus==="versendet";
  const isReadOnly=isLockedByOther||isVersendet;""")
    print("  ✅ Lock/Status State-Variablen eingefügt")
else:
    if "lockInfo" in app:
        print("  ℹ️  Lock-State existiert bereits")
    else:
        print("  ⚠️  State-Marker nicht gefunden")

# 3c: Heartbeat-Effekt einfügen (nach dem Auto-Save-Effekt)
autosave_marker = "useEffect(()=>{if(!user||!currentEventId||tab===\"events\")return;const t=setTimeout(saveEvent,2000);return()=>clearTimeout(t);},[event,days,currentEventId,user,tab,saveEvent]);"
if autosave_marker in app and "lockHeartbeat" not in app:
    heartbeat_code = """
  // ── Lock-Heartbeat: alle 30s Sperre erneuern ──────────────────
  useEffect(()=>{
    if(!user||!currentEventId||tab==="events"||isVersendet)return;
    let active=true;
    const acquireLock=async()=>{
      try{
        const r=await API.lockVorgang(currentEventId);
        if(r.error&&!r.locked){setLockInfo({user:r.lockedBy,since:r.lockedSince});}
        else{setLockInfo(null);}
      }catch{}
    };
    acquireLock();
    const hb=setInterval(()=>{if(active)acquireLock();},30000);
    return()=>{active=false;clearInterval(hb);if(currentEventId){API.unlockVorgang(currentEventId).catch(()=>{});}};
  },[currentEventId,user,tab,isVersendet]);// eslint-disable-line
  // ── Status laden wenn Vorgang gewechselt wird ─────────────────
  useEffect(()=>{
    if(!currentEventId){setVorgangStatus("entwurf");setLockInfo(null);setStatusLog([]);return;}
    (async()=>{
      try{const l=await API.getLockStatus(currentEventId);if(l.locked&&!l.isMine)setLockInfo({user:l.lockedBy,since:l.lockedSince});else setLockInfo(null);}catch{}
      try{const sl=await API.getStatusLog(currentEventId);setStatusLog(sl);}catch{}
    })();
  },[currentEventId]);"""
    app = app.replace(autosave_marker, autosave_marker + heartbeat_code)
    print("  ✅ Heartbeat + Status-Laden Effekte eingefügt")
else:
    if "lockHeartbeat" in app or "acquireLock" in app:
        print("  ℹ️  Heartbeat existiert bereits")
    else:
        print("  ⚠️  Autosave-Marker nicht gefunden")

# 3d: Auto-Save blockieren wenn readOnly
if autosave_marker in app and "isReadOnly" not in app.split(autosave_marker)[0].split("\n")[-1]:
    old_autosave = "useEffect(()=>{if(!user||!currentEventId||tab===\"events\")return;"
    new_autosave = "useEffect(()=>{if(!user||!currentEventId||tab===\"events\"||isReadOnly)return;"
    app = app.replace(old_autosave, new_autosave, 1)
    print("  ✅ Auto-Save blockiert wenn readOnly")

# 3e: saveEvent blockieren wenn readOnly
save_marker = "const saveEvent=useCallback(async()=>{"
if save_marker in app and "isReadOnly" not in app[app.index(save_marker):app.index(save_marker)+200]:
    app = app.replace(save_marker, 'const saveEvent=useCallback(async()=>{if(isReadOnly){console.log("ReadOnly – Speichern blockiert");return;}')
    print("  ✅ saveEvent blockiert wenn readOnly")

# 3f: Lock-Banner + Status-Controls in die UI einfügen
# Füge nach der Tab-Navigation ein Banner ein
nav_end = "{tab===\"events\"&&<VorgaengeListe"
if nav_end in app and "lockBanner" not in app:
    banner_code = """
        {/* ── Lock/Status Banner ──────────────────────────── */}
        {currentEventId&&isLockedByOther&&<div style={{margin:"0 12px",padding:"12px 16px",background:"#fff3cd",border:"1px solid #ffc107",borderRadius:8,display:"flex",alignItems:"center",gap:10,fontSize:13}}><span style={{fontSize:18}}>🔒</span><div><strong>Gesperrt:</strong> Wird gerade von <strong>{lockInfo.user}</strong> bearbeitet. Änderungen sind nicht möglich.</div></div>}
        {currentEventId&&isVersendet&&!isLockedByOther&&<div style={{margin:"0 12px",padding:"12px 16px",background:"#d4edda",border:"1px solid #28a745",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:13}}><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:18}}>✅</span><div><strong>Angebot versendet</strong> – Vorgang ist schreibgeschützt.</div></div><button onClick={async()=>{if(!confirm("Vorgang wieder zum Bearbeiten freigeben?\\n\\nDiese Aktion wird protokolliert."))return;const reason=prompt("Grund für Entsperrung (optional):","");const r=await API.setVorgangStatus(currentEventId,"entwurf",reason||"");if(r.success){setVorgangStatus("entwurf");try{const sl=await API.getStatusLog(currentEventId);setStatusLog(sl);}catch{}}else{alert(r.error||"Fehler");}}} style={{padding:"6px 14px",background:"#ffc107",color:"#333",border:"none",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>🔓 Entsperren</button></div>}
        """ + nav_end
    app = app.replace(nav_end, banner_code)
    print("  ✅ Lock/Status-Banner eingefügt")

# 3g: "Angebot versendet" Button im Dokumente-Tab
# Finde den Angebotsmappe-Button und füge davor den Status-Button ein
mappe_marker = "Angebotsmappe (PDF)"
if mappe_marker in app and "Angebot versendet" not in app:
    # Finde die Zeile mit dem Mappe-Button und füge den Status-Button davor ein
    status_btn = """{!isVersendet&&currentEventId&&<Btn variant="blue" onClick={async()=>{if(!confirm("Angebot als versendet markieren?\\n\\nDer Vorgang wird schreibgeschützt.\\nDiese Aktion wird protokolliert."))return;await saveEvent();const r=await API.setVorgangStatus(currentEventId,"versendet","Angebot versendet");if(r.success){setVorgangStatus("versendet");try{const sl=await API.getStatusLog(currentEventId);setStatusLog(sl);}catch{}}else{alert(r.error||"Fehler");}}}>📨 Angebot versendet</Btn>}"""

    # Finde den Bereich mit dem Mappe-Button
    idx = app.find(mappe_marker)
    # Geh zurück zum <Btn das diesen Button startet
    btn_start = app.rfind("<Btn", 0, idx)
    if btn_start > 0:
        app = app[:btn_start] + status_btn + app[btn_start:]
        print("  ✅ 'Angebot versendet' Button eingefügt")
    else:
        print("  ⚠️  Mappe-Button Position nicht gefunden")
else:
    if "Angebot versendet" in app:
        print("  ℹ️  Status-Button existiert bereits")

# 3h: loadEvent muss Status mitladen
load_marker = "const loadEvent=useCallback((ev)=>{"
if load_marker in app and "setVorgangStatus" not in app[app.index(load_marker):app.index(load_marker)+300]:
    old_load = "const loadEvent=useCallback((ev)=>{setCurrentEventId(ev.id);"
    new_load = "const loadEvent=useCallback((ev)=>{setCurrentEventId(ev.id);setVorgangStatus(ev.status||\"entwurf\");"
    app = app.replace(old_load, new_load, 1)
    print("  ✅ loadEvent lädt Status mit")

# 3i: newEvent muss Status zurücksetzen
new_marker = "const newEvent=useCallback(()=>{setCurrentEventId(null);"
if new_marker in app and "setVorgangStatus" not in app[app.index(new_marker):app.index(new_marker)+200]:
    app = app.replace(new_marker, "const newEvent=useCallback(()=>{setCurrentEventId(null);setVorgangStatus(\"entwurf\");setLockInfo(null);")
    print("  ✅ newEvent setzt Status/Lock zurück")

# 3j: Status-Log Anzeige im Dokumente-Tab (nach dem ILS-Block)
ils_render = 'pdfView==="ils"&&<Card'
if ils_render in app and "statusLog" not in app[app.index(ils_render):app.index(ils_render)+2000]:
    # Finde das Ende des ILS-Blocks
    ils_end = app.find("</Card>}", app.index(ils_render))
    if ils_end > 0:
        insert_pos = ils_end + len("</Card>}")
        status_log_ui = """
            {statusLog.length>0&&<Card accent="#6c757d"><div style={{fontSize:14,fontWeight:700,color:C.dunkelblau,marginBottom:8}}>📋 Status-Protokoll</div><div style={{fontSize:12}}>{statusLog.map((s,i)=>(<div key={i} style={{display:"flex",gap:10,padding:"4px 0",borderBottom:i<statusLog.length-1?"1px solid #eee":"none"}}><span style={{color:C.dunkelgrau,minWidth:120}}>{new Date(s.created_at).toLocaleString("de-DE")}</span><span style={{fontWeight:600}}>{s.changed_by_name}</span><span>{s.old_status} → <strong>{s.new_status}</strong></span>{s.reason&&<span style={{color:C.dunkelgrau,fontStyle:"italic"}}>({s.reason})</span>}</div>))}</div></Card>}"""
        app = app[:insert_pos] + status_log_ui + app[insert_pos:]
        print("  ✅ Status-Protokoll UI eingefügt")

# 3k: VorgaengeListe: Status in der Liste anzeigen
# Suche nach der Stelle wo Vorgänge in der Liste gerendert werden
vl_marker = "function VorgaengeListe"
if vl_marker in app:
    # Suche nach dem Render der Zeilen - typischerweise zeigt es Name/Datum etc.
    # Füge Status-Badge hinzu nach dem Auftragsnr oder Name
    auftrags_display = "updatedAt"
    if auftrags_display in app[app.index(vl_marker):]:
        # Suche im VorgaengeListe-Bereich nach dem Render
        vl_section = app[app.index(vl_marker):]
        # Wir patchen hier nicht zu aggressiv - lassen wir das für einen nächsten Schritt
        print("  ℹ️  VorgaengeListe Status-Badge: Manuell oder im nächsten Patch")

write(app_path, app)
print("\n" + "═"*60)
print("✅ Patch komplett! Jetzt Build & Deploy:")
print("═"*60)
print("""
cd /home/k8susr/SanWD/sanwd-k8s/sanwd-v6
nerdctl --address /run/k3s/containerd/containerd.sock \\
  --namespace k8s.io \\
  build --no-cache -t docker.io/library/sanwd-app:v6 .

kubectl rollout restart deployment/sanwd-app -n sanwd
kubectl rollout status deployment/sanwd-app -n sanwd
""")
