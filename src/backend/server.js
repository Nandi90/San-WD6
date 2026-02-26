/**
 * ═══════════════════════════════════════════════════════════════════
 * BRK Sanitätswachdienst v6 — Server
 * ═══════════════════════════════════════════════════════════════════
 */

const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");

const db = require("./db");
const authRouter = require("./middleware/auth");
const { requireAuth } = require("./middleware/rbac");
const vorgaengeRouter = require("./routes/vorgaenge");
const kundenRouter = require("./routes/kunden");
const stammdatenRouter = require("./routes/stammdaten");
const templatesRouter = require("./routes/templates");
const adminRouter = require("./routes/admin");
const pdfRouter = require("./routes/pdf");
const ilsRouter = require("./routes/ils");
const klauselnRouter = require("./routes/klauseln");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────
app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.APP_URL || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("short"));

// ── Sessions ─────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || "change-me-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: "lax",
  },
}));

// ── Health Check (kein Auth) ─────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", version: "6.0.0", timestamp: new Date().toISOString() });
});

// ── Auth Routes (kein Auth nötig) ────────────────────────────────

// === Public Anfrage-Formular (kein Auth) ===
app.get("/anfrage", (req, res) => {
  const stamm = db.getDb().prepare("SELECT * FROM bereitschaften LIMIT 1").get() || {};
  const ROT = "#E60005";
  const BLAU = "#002F5F";
  const kvName = stamm.kv_name || "BRK Kreisverband Neuburg-Schrobenhausen";
  const fertigUrl = stamm.fertig_url || "https://www.kvndsob.brk.de/ehrenamt.html";
  const dsUrl = stamm.datenschutz_url || "https://www.kvndsob.brk.de/footer-menue-deutsch/service/datenschutz-1.html";
  let logoTag = '<svg width="48" height="48" viewBox="0 0 100 100" fill="none"><rect x="35" y="5" width="30" height="90" rx="2" fill="' + ROT + '"/><rect x="5" y="35" width="90" height="30" rx="2" fill="' + ROT + '"/></svg>';
  if (stamm.logo) {
    try {
      const b64 = Buffer.from(stamm.logo).toString("base64");
      logoTag = '<img src="data:image/png;base64,' + b64 + '" style="height:56px;width:auto">';
    } catch(e) {}
  }
  res.send(`<!DOCTYPE html><html lang="de"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sanit\u00e4tswachdienst anfragen \u2013 ${kvName}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f0;color:#1a1a1a;line-height:1.5}
.ctn{max-width:680px;margin:0 auto;padding:0 16px}
.card{background:#fff;border-radius:8px;border:1px solid #ddd;padding:24px 28px;margin-bottom:16px;box-shadow:0 1px 4px #0001}
.hdr{background:#fff;padding:24px 28px 18px;border-radius:8px 8px 0 0;border:1px solid #ddd;border-bottom:none;display:flex;align-items:center;gap:18px;margin-top:20px}
.hdr-text{flex:1}
.hdr-org{font-size:13px;color:#555;margin-bottom:2px}
.hdr-title{font-size:20px;font-weight:700;color:${BLAU}}
.hdr-accent{height:4px;background:${ROT};border-radius:0}
.sub{background:#fff;padding:14px 28px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px;margin-bottom:20px;font-size:13px;color:#555}
label{display:block;margin-bottom:12px}
label>span{display:block;font-size:12px;font-weight:600;color:#444;margin-bottom:3px}
label>span.req::after{content:" *";color:${ROT}}
input,textarea,select{width:100%;padding:9px 12px;border:1px solid #ccc;border-radius:4px;font-size:14px;font-family:inherit}
input:focus,textarea:focus{outline:none;border-color:#004B91;box-shadow:0 0 0 2px #004B9130}
textarea{resize:vertical;min-height:80px}
.row{display:grid;grid-template-columns:1fr 1fr;gap:0 14px}
.row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 14px}
.btn{background:${ROT};color:#fff;border:none;padding:12px 28px;border-radius:4px;font-size:15px;font-weight:600;cursor:pointer;width:100%}
.btn:hover{background:#c0392b}
.btn:disabled{opacity:0.5;cursor:not-allowed}
.ok{background:#d4edda;border:1px solid #c3e6cb;padding:20px;border-radius:8px;color:#155724;text-align:center;display:none;margin-bottom:16px}
.ft{text-align:center;font-size:11px;color:#999;margin:16px 0 24px;padding:10px}
.chk{display:flex;align-items:flex-start;gap:8px;margin-bottom:14px;font-size:13px;cursor:pointer}
.chk input[type=checkbox]{width:18px;height:18px;margin-top:2px;flex-shrink:0;accent-color:${ROT}}
.day-block{background:#f8f8f5;border:1px solid #e0e0d8;border-radius:6px;padding:14px;margin-bottom:10px}
.day-block h4{font-size:13px;color:${ROT};margin-bottom:8px;display:flex;justify-content:space-between;align-items:center}
.day-block .rm{background:none;border:none;color:#999;cursor:pointer;font-size:16px;padding:0 4px}
.day-block .rm:hover{color:${ROT}}
.add-day{background:#fff;border:1px dashed #ccc;border-radius:6px;padding:10px;text-align:center;cursor:pointer;color:#666;font-size:13px;margin-bottom:12px}
.add-day:hover{border-color:${ROT};color:${ROT}}
.sec{font-size:15px;color:${ROT};font-weight:700;margin-bottom:14px;padding-bottom:6px;border-bottom:1px solid #eee}
@media(max-width:600px){.row,.row3{grid-template-columns:1fr}.hdr{flex-direction:column;text-align:center}.ctn{padding:0 10px}}
</style></head><body>
<div class="ctn">
  <div class="hdr">
    <div>${logoTag}</div>
    <div class="hdr-text">
      <div class="hdr-org">${kvName}</div>
      <div class="hdr-title">Sanit\u00e4tswachdienst anfragen</div>
    </div>
  </div>
  <div class="hdr-accent"></div>
  <div class="sub">Bitte f\u00fcllen Sie das Formular aus. Wir erstellen Ihnen ein unverbindliches Angebot.</div>

  <form id="frm" class="card">
    <div class="sec">Veranstaltungsdaten</div>
    <label><span class="req">Name der Veranstaltung</span><input name="name" required></label>
    <div class="row">
      <label><span class="req">Ort</span><input name="ort" required></label>
      <label><span>Adresse / Gel\u00e4nde</span><input name="adresse"></label>
    </div>
    <div class="row">
      <label><span>Erwartete Besucherzahl</span><input type="number" name="besucher" min="0" placeholder="z.B. 1000"></label>
      <label><span>Art der Veranstaltung</span>
        <select name="art"><option value="">Bitte w\u00e4hlen...</option>
        <option>Volksfest / Stra\u00dfenfest</option><option>Musikveranstaltung / Konzert</option>
        <option>Sportveranstaltung</option><option>Messe / Ausstellung</option>
        <option>Faschingsveranstaltung</option><option>Festzug / Umzug</option>
        <option>Motorsport</option><option>Firmenveranstaltung</option><option>Sonstige</option>
        </select></label>
    </div>

    <label class="chk" style="margin-top:4px"><input type="checkbox" id="multiDay" onchange="toggleMulti()"><span style="font-size:13px;font-weight:600;color:#444">Mehrt\u00e4gige Veranstaltung</span></label>

    <div id="days-container">
      <div class="day-block" data-day="1">
        <h4><span>Tag 1</span></h4>
        <div class="row3">
          <label><span class="req">Datum</span><input type="date" name="tag_1_datum" required></label>
          <label><span>Beginn</span><input type="time" name="tag_1_von" value="18:00"></label>
          <label><span>Ende</span><input type="time" name="tag_1_bis" value="23:00"></label>
        </div>
      </div>
    </div>
    <div id="addDayBtn" class="add-day" style="display:none" onclick="addDay()">&#10010; Weiteren Tag hinzuf\u00fcgen</div>

    <div class="sec" style="margin-top:18px">Veranstalter / Kontakt</div>
    <label><span class="req">Firma / Verein / Veranstalter</span><input name="veranstalter" required></label>
    <label><span class="req">Ansprechpartner</span><input name="ansprechpartner" required></label>
    <div class="row">
      <label><span class="req">Telefon</span><input type="tel" name="telefon" required></label>
      <label><span class="req">E-Mail</span><input type="email" name="email" required></label>
    </div>
    <label><span>Bemerkung / besondere Anforderungen</span><textarea name="bemerkung" placeholder="z.B. Auflagen der Beh\u00f6rde, Gel\u00e4ndebesonderheiten..."></textarea></label>

    <label class="chk"><input type="checkbox" id="dsgvo" required><span>Ich stimme der Verarbeitung meiner Daten gem\u00e4\u00df der <a href="${dsUrl}" target="_blank" rel="noopener" style="color:#004B91;text-decoration:underline">Datenschutzerkl\u00e4rung</a> zu. *</span></label>

    <button type="submit" class="btn" id="sbtn">Anfrage absenden</button>
  </form>

  <div id="ok" class="ok">
    <div style="font-size:28px;margin-bottom:8px">&#9989;</div>
    <strong>Vielen Dank f\u00fcr Ihre Anfrage!</strong><br>
    Wir werden uns zeitnah bei Ihnen melden und Ihnen ein Angebot erstellen.
    <div style="display:flex;gap:12px;justify-content:center;margin-top:18px">
      <a href="${fertigUrl}" class="btn" style="text-decoration:none;display:inline-block;width:auto;padding:10px 24px">Fertig</a>
      <button class="btn" style="background:#004B91;width:auto;padding:10px 24px" onclick="document.getElementById('ok').style.display='none';document.getElementById('frm').style.display='block';document.getElementById('frm').reset();document.getElementById('dsgvo').checked=false;document.getElementById('sbtn').disabled=false;document.getElementById('sbtn').textContent='Anfrage absenden';">Neue Anfrage</button>
    </div>
  </div>

  <div class="ft">\u00a9 ${new Date().getFullYear()} ${kvName}</div>
</div>
<script>
var dayCount=1;
function toggleMulti(){
  var on=document.getElementById("multiDay").checked;
  document.getElementById("addDayBtn").style.display=on?"block":"none";
  if(!on){while(dayCount>1)removeDay(dayCount--);}
}
function addDay(){
  dayCount++;var n=dayCount;
  var box=document.createElement("div");box.className="day-block";box.setAttribute("data-day",n);
  box.innerHTML='<h4><span>Tag '+n+'</span><button type="button" class="rm" onclick="removeDay('+n+')">&times;</button></h4>'
    +'<div class="row3"><label><span class="req">Datum</span><input type="date" name="tag_'+n+'_datum" required></label>'
    +'<label><span>Beginn</span><input type="time" name="tag_'+n+'_von" value="18:00"></label>'
    +'<label><span>Ende</span><input type="time" name="tag_'+n+'_bis" value="23:00"></label></div>';
  document.getElementById("days-container").appendChild(box);
}
function removeDay(n){
  var el=document.querySelector('[data-day="'+n+'"]');if(el)el.remove();renumberDays();
}
function renumberDays(){
  var blocks=document.querySelectorAll("#days-container .day-block");
  dayCount=blocks.length;
  blocks.forEach(function(b,i){
    var num=i+1;b.setAttribute("data-day",num);
    b.querySelector("h4 span").textContent="Tag "+num;
    var inputs=b.querySelectorAll("input");
    inputs[0].name="tag_"+num+"_datum";inputs[1].name="tag_"+num+"_von";inputs[2].name="tag_"+num+"_bis";
    var rm=b.querySelector(".rm");if(rm)rm.setAttribute("onclick","removeDay("+num+")");
    if(num===1&&rm)rm.remove();
  });
}
document.getElementById("frm").onsubmit=async function(e){
  e.preventDefault();
  if(!document.getElementById("dsgvo").checked){alert("Bitte stimmen Sie der Datenschutzerkl\u00e4rung zu.");return;}
  var b=document.getElementById("sbtn");b.disabled=true;b.textContent="Wird gesendet...";
  var fd=new FormData(this);var d={};fd.forEach(function(v,k){d[k]=v});
  d.besucher=parseInt(d.besucher)||0;
  d.tage=[];
  for(var i=1;i<=dayCount;i++){
    var dt=d["tag_"+i+"_datum"];
    if(!dt){alert("Bitte Datum f\u00fcr Tag "+i+" ausf\u00fcllen.");b.disabled=false;b.textContent="Anfrage absenden";return;}
    d.tage.push({datum:dt,von:d["tag_"+i+"_von"]||"18:00",bis:d["tag_"+i+"_bis"]||"23:00"});
    delete d["tag_"+i+"_datum"];delete d["tag_"+i+"_von"];delete d["tag_"+i+"_bis"];
  }
  try{var r=await fetch("/api/anfrage",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)});
    if(!r.ok)throw new Error();document.getElementById("frm").style.display="none";document.getElementById("ok").style.display="block";
  }catch(err){alert("Fehler beim Senden. Bitte versuchen Sie es erneut.");b.disabled=false;b.textContent="Anfrage absenden";}
};
</script></body></html>`);
});

app.post("/api/anfrage", express.json(), (req, res) => {
  try {
    const { name, ort, adresse, tage, besucher, veranstalter, ansprechpartner, telefon, email, bemerkung, art } = req.body;
    if (!name || !veranstalter || !ansprechpartner || !telefon || !email) return res.status(400).json({ error: "Pflichtfelder fehlen" });
    db.getDb().prepare("INSERT INTO anfragen (name,ort,adresse,datum,zeit_von,zeit_bis,besucher,veranstalter,ansprechpartner,telefon,email,bemerkung,art) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)")
      .run(name, ort||"", adresse||"", JSON.stringify(tage||[]), "", "", besucher||0, veranstalter, ansprechpartner, telefon, email, bemerkung||"", art||"");
    res.json({ success: true });
  } catch (e) { console.error("Anfrage:", e); res.status(500).json({ error: "Serverfehler" }); }
});


// === Anfragen API (Auth required) ===
app.get("/api/anfragen", (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: "Nicht authentifiziert" });
  try {
    const rows = db.getDb().prepare("SELECT * FROM anfragen ORDER BY created_at DESC").all();
    res.json(rows);
  } catch (e) { console.error("Anfragen laden:", e); res.status(500).json({ error: "Serverfehler" }); }
});

app.put("/api/anfragen/:id/status", (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: "Nicht authentifiziert" });
  try {
    const { status } = req.body;
    db.getDb().prepare("UPDATE anfragen SET status=? WHERE id=?").run(status, req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Serverfehler" }); }
});

app.delete("/api/anfragen/:id", (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: "Nicht authentifiziert" });
  try {
    db.getDb().prepare("DELETE FROM anfragen WHERE id=?").run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Serverfehler" }); }
});

app.use("/auth", authRouter);

// ── API Routes (Auth + RBAC) ─────────────────────────────────────
app.use("/api/vorgaenge", vorgaengeRouter);
app.use("/api/kunden", kundenRouter);
app.use("/api/stammdaten", stammdatenRouter);
app.use("/api/templates", templatesRouter);
app.use("/api/admin", adminRouter);
app.use("/api/pdf", pdfRouter);
app.use("/api/ils", ilsRouter);
app.use("/api/klauseln", klauselnRouter);


// ── W3W Proxy ────────────────────────────────────────────────────
app.get("/api/w3w", async (req, res) => {
  const { lat, lng } = req.query;
  const key = process.env.W3W_API_KEY;
  if (!key) return res.json({ w3w: null });
  try {
    const url = `https://api.what3words.com/v3/convert-to-3wa?coordinates=${lat},${lng}&language=de&key=${key}`;
    const r = await fetch(url);
    const d = await r.json();
    res.json({ w3w: d.words ? "///" + d.words : null });
  } catch { res.json({ w3w: null }); }
});


// ── Eigenes Profil ────────────────────────────────────────────────
app.get("/api/profile", (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: "Nicht angemeldet" });
  const db = require("./db").getDb();
  const u = db.prepare("SELECT name, email, telefon, mobil, titel, ort, unterschrift FROM users WHERE sub = ?").get(req.session.user.sub);
  res.json(u || {});
});

app.put("/api/profile", (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: "Nicht angemeldet" });
  const { telefon, mobil, titel, email, ort, unterschrift } = req.body;
  const db = require("./db").getDb();
  db.prepare("UPDATE users SET telefon=?, mobil=?, titel=?, email=?, ort=?, unterschrift=? WHERE sub=?")
    .run(telefon||"", mobil||"", titel||"", email||"", ort||"", unterschrift||"", req.session.user.sub);
  // Session aktualisieren
  req.session.user = { ...req.session.user, telefon, mobil, titel, email, ort, unterschrift };
  res.json({ success: true });
});


// ── PDF Vertrag (Puppeteer) ──────────────────────────────────────────
app.post("/api/pdf/vertrag/:id", requireAuth, async (req, res) => {
  const puppeteer = require("puppeteer-core");
  const { id } = req.params;
  try {
    const db = require("./db").getDb();
    const row = db.prepare("SELECT data FROM vorgaenge WHERE id=?").get(id);
    if (!row) return res.status(404).json({ error: "Vorgang nicht gefunden" });
    const vorgang = JSON.parse(row.data);
    const stamm = db.prepare("SELECT * FROM bereitschaften WHERE code=?").get(req.session.user.bereitschaftCode) || {};
    const kosten = db.prepare("SELECT * FROM kostensaetze WHERE bereitschaft_code=?").get(req.session.user.bereitschaftCode) || {};
    const user = db.prepare("SELECT name, titel, ort, email, unterschrift FROM users WHERE sub=?").get(req.session.user.sub) || {};
    const html = buildVertragHTML(vorgang, stamm, user);
    const browser = await puppeteer.launch({
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium-browser",
      args: ["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--disable-gpu"],
      headless: true
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    const pdf = await page.pdf({
      format: "A4",
      margin: { top: "15mm", right: "10mm", bottom: "20mm", left: "10mm" },
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: `<div style="width:100%;text-align:center;font-size:8pt;color:#aaa;font-family:Arial,sans-serif">Seite <span class="pageNumber"></span> von <span class="totalPages"></span></div>`,
      printBackground: true
    });
    await browser.close();
    res.set({ "Content-Type":"application/pdf", "Content-Disposition":`inline; filename="Vertrag-${id}.pdf"` });
    res.send(pdf);
  } catch(e) {
    console.error("Vertrag PDF:", e);
    res.status(500).json({ error: e.message });
  }
});

function buildVertragHTML(vorgang, stamm, user) {
  const ev = vorgang.event || {};
  const days = (vorgang.days || []).filter(d => d.active);
  const fDate = s => s ? new Date(s).toLocaleDateString("de-DE") : "";
  const esc = s => (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

  // BRK Corporate Colors
  const ROT = "#c0392b";
  const DUNKELGRAU = "#555";
  const HELLGRAU = "#f5f5f5";

  const ort = esc(user.ort || "");
  const today = new Date().toLocaleDateString("de-DE");
  const unterzeichner = esc(user.name || stamm.leiter_name || "");
  const titel = esc(user.titel || stamm.leiter_nameTitle || "Bereitschaftsleiter");
  const kvName = esc(stamm.kv_name || "");
  const kgf = esc(stamm.kgf || "");
  const kvAdresse = esc(stamm.kv_adresse || "");
  const kvPlzOrt = esc(stamm.kv_plz_ort || "");

  const logoB64 = stamm.logo ? Buffer.from(stamm.logo).toString("base64") : null;
  const logoHtml = logoB64
    ? `<img src="data:image/png;base64,${logoB64}" style="height:36px;width:auto;vertical-align:middle">`
    : `<span style="color:${ROT};font-weight:bold;font-size:18pt;vertical-align:middle">✚</span>`;

  const dayRows = days.map(d =>
    `<tr>
      <td style="width:25px;padding:2px 4px;color:${DUNKELGRAU}">am</td>
      <td style="width:85px;padding:2px 4px">${fDate(d.date)}</td>
      <td style="width:60px;padding:2px 4px">${esc(d.startTime||"")} Uhr</td>
      <td style="width:25px;padding:2px 4px;color:${DUNKELGRAU}">bis</td>
      <td style="width:85px;padding:2px 4px">${fDate(d.date)}</td>
      <td style="padding:2px 4px">${esc(d.endTime||"")} Uhr</td>
    </tr>`
  ).join("");

  const besucherCells = days.map((d,i) =>
    `<td style="padding:2px 8px">${i+1}. Tag: <strong>${d.besucher||"—"}</strong></td>`
  ).join("");

  const unterschriftHtml = (user.unterschrift || ev.unterschrift)
    ? `<img src="${user.unterschrift || ev.unterschrift}" style="height:45px;width:auto;display:block;margin:0 auto 4px">`
    : `<div style="height:49px"></div>`;

  // Logo aus bereitschaften.logo (Binary → Base64)
  let logoImg;
  if (stamm.logo) {
    const b64 = Buffer.from(stamm.logo).toString("base64");
    logoImg = `<img src="data:image/png;base64,${b64}" style="max-width:200px;max-height:90px;object-fit:contain;" />`;
  } else {
    logoImg = `<div style="font-weight:bold;font-size:16px;text-align:center;">BRK<br/>Bereitschaft</div>`;
  }

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 13px; margin: 0; padding: 20px; color: #000; }
  table { width: 100%; border-collapse: collapse; }
  .header-table td { border: 1px solid #000; padding: 8px; vertical-align: middle; text-align: center; }
  .info-table td { padding: 4px 8px; vertical-align: top; }
  .sig-box { background: #d3d3d3; border: 1px solid #000; padding: 16px; text-align: center; height: 100%; }
  hr { border: none; border-top: 2px solid #000; margin: 12px 0; }
  .bemerkung-box { background: #d3d3d3; border: 1px solid #000; padding: 10px; margin-top: 8px; min-height: 80px; }
  .freitext-box { border: 1px solid #000; padding: 10px; margin-top: 4px; min-height: 60px; }
  strong { font-weight: bold; }
</style>
</head>
<body>
<table class="header-table">
<tr>
  <td style="width:33%;">${logoImg}</td>
  <td style="width:33%;font-size:18px;">
    <strong>Einsatzprotokoll</strong><br/>
    <span style="font-size:14px;">${esc(ev.auftragsnr||"")}</span>
  </td>
  <td style="width:33%;font-size:13px;">
    <strong>BRK Kreisverband Neuburg-Schrobenhausen</strong><br/>
    ${esc(stamm.name||"BRK Bereitschaft")}
  </td>
</tr>
</table>

<p>&nbsp;</p>

<table class="info-table">
<tr>
  <td style="width:50%;vertical-align:top;">
    <p><strong>Kunde:</strong> ${esc(ev.veranstalter||ev.rechnungsempfaenger||"")}, ${esc(ev.ansprechpartner||"")}</p>
    <p><strong>Veranstaltung:</strong> ${esc(ev.name||"")}</p>
    <p><strong>Ort:</strong> ${esc(ev.ort||"")}${ev.adresse?", "+esc(ev.adresse):""}</p>
    <p><strong>Datum:</strong> ${esc(firstDate)}</p>
    <p><strong>Uhrzeit:</strong> ${esc(timeRange)}</p>
    <p><strong>Ansprechpartner vor Ort:</strong> ${esc(ev.ansprechpartner||"")}</p>
    <p><strong>Bekleidung:</strong> Kleiderordnung: Einsatzkleidung nach DBO</p>
    <p><strong>Helferverpflegung:</strong> ${ev.verpflegung?"kostenfrei durch den Veranstalter":"Selbstverpflegung"}</p>
  </td>
  <td style="width:50%;vertical-align:top;">
    <div class="sig-box">
      <p><strong>Der Sanitätsdienst wurde korrekt durchgeführt:</strong></p>
      <p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p>
      <p>________________________________<br/>Unterschrift Veranstalter</p>
    </div>
  </td>
</tr>
</table>

<hr/>
<p><strong>tatsächliche Ankunftszeit Einsatzort:</strong> ____________</p>
<p><strong>tatsächliches Ende der Veranstaltung:</strong> ____________</p>
<p><strong>Einsatzleiter/in:</strong> ${esc(ev.ilsEL||"")}</p>
<p><strong>Einsatzkräfte:</strong> __________________________________________________</p>
<hr/>

<p><strong>Fahrzeuge:</strong></p>
<div class="freitext-box">${esc(ev.bemerkungFahrzeuge||"")}</div>

<p style="margin-top:12px;"><strong>Bemerkungen zum Einsatz:</strong></p>
<div class="bemerkung-box" style="min-height:120px;">${esc(ev.bemerkung||"")}</div>

</body>
</html>`;
}





// ═══════════════════════════════════════════════════════════════════
// HTML-Builder: Einsatzprotokoll
// ═══════════════════════════════════════════════════════════════════
function buildEinsatzprotokollHTML(vorgang, stamm, user, dayCalcs) {
  const ev = vorgang.event || vorgang;
  const days = (vorgang.days || []).filter(d => d.active !== false);
  const esc = s => String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

  // Datum formatieren
  const fDate = d => {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString("de-DE", {weekday:"long", day:"2-digit", month:"2-digit", year:"numeric"});
  };

  // Fahrzeuge eines Tages als String
  const fzgStr = (day) => {
    const fzg = day.fahrzeuge || [];
    if (fzg.length === 0) return "keine Fahrzeuge eingeplant";
    return fzg.map(f => typeof f === "string" ? f : (f.kennzeichen || f.name || JSON.stringify(f))).join(", ");
  };

  // Material eines Tages (Sonstiges)
  const matStr = (day) => {
    const mat = day.material || day.sonstiges || [];
    if (!mat || mat.length === 0) return "kein Material eingeplant";
    return Array.isArray(mat) ? mat.join(", ") : String(mat);
  };

  // Helfer-Anzahl aus dayCalcs oder Berechnung
  const getHelfer = (dayIdx) => {
    if (dayCalcs && dayCalcs[dayIdx]) return dayCalcs[dayIdx].tp || "";
    return "";
  };

  // Uhrzeit aller Tage für Übersicht
  const timeRange = days.length > 0
    ? `${days[0].startTime||""} - ${days[days.length-1].endTime||""}`
    : "";

  // Datum des ersten Tags
  const firstDate = days.length > 0 ? fDate(days[0].date) : "";

  // Material/Fahrzeug-Sektionen pro Tag
  let matSections = `<p><strong>Material: </strong><br>`;
  matSections += `<strong>für alle Schichten / Abschnitte:</strong><br>${esc(matStr({material: ev.materialAllgemein}))}<br><br>`;
  days.forEach((day, i) => {
    const dateLabel = day.date ? fDate(day.date) : `Tag ${day.id||i+1}`;
    matSections += `<strong>zusätzlich für ${esc(dateLabel)}, ${esc(day.startTime||"")} - ${esc(day.endTime||"")} Uhr:</strong><br>${esc(matStr(day))}<br><br>`;
  });
  matSections += `</p>`;

  let fzgSections = `<p><strong>Fahrzeuge:</strong><br>`;
  fzgSections += `<strong>für alle Schichten / Abschnitte:</strong><br>keine Fahrzeuge eingeplant<br><br>`;
  days.forEach((day, i) => {
    const dateLabel = day.date ? fDate(day.date) : `Tag ${day.id||i+1}`;
    fzgSections += `<strong>zusätzlich für ${esc(dateLabel)}, ${esc(day.startTime||"")} - ${esc(day.endTime||"")} Uhr:</strong><br>${esc(fzgStr(day))}<br><br>`;
  });
  fzgSections += `</p>`;

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 13px; margin: 0; padding: 20px; color: #000; }
  table { width: 100%; border-collapse: collapse; }
  .header-table td { border: 1px solid #000; padding: 8px; vertical-align: middle; }
  .header-logo { text-align: center; width: 33%; }
  .header-title { text-align: center; width: 33%; font-size: 18px; }
  .header-orga { text-align: center; width: 33%; font-size: 13px; }
  .header-title h2 { margin: 4px 0; font-size: 20px; }
  .header-orga h3 { margin: 4px 0; font-size: 13px; }
  .info-table { margin-top: 16px; }
  .info-table td { padding: 4px 8px; vertical-align: top; }
  .sig-box { background: #d3d3d3; border: 1px solid #000; padding: 16px; text-align: center; }
  hr { border: none; border-top: 2px solid #000; margin: 12px 0; }
  .bemerkung-box { background: #d3d3d3; border: 1px solid #000; padding: 10px; margin-top: 8px; }
  strong { font-weight: bold; }
  @media print { body { margin: 0; padding: 10mm; } }
</style>
</head>
<body>
<table class="header-table">
<tr>
  <td class="header-logo">
    ${logoData ? `<img src="${logoData}" style="width:180px;height:auto;vertical-align:top;" />` : `<div style="font-weight:bold;font-size:14px;">BRK Bereitschaft</div>`}
  </td>
  <td class="header-title">
    <h2>Einsatzprotokoll</h2>
    <p>${esc(ev.auftragsnr||"")}</p>
  </td>
  <td class="header-orga">
    <h3>BRK Kreisverband Neuburg-Schrobenhausen</h3>
    <h3>${esc(stamm.name||"BRK Bereitschaft")}</h3>
  </td>
</tr>
</table>

<p>&nbsp;</p>

<table class="info-table">
<tr>
  <td style="width:50%;padding:4px 8px;vertical-align:top;">
    <p><strong>Kunde:</strong> ${esc(ev.veranstalter||ev.rechnungsempfaenger||"")}, ${esc(ev.ansprechpartner||"")}</p>
    <p><strong>Veranstaltung:</strong> ${esc(ev.name||"")}</p>
    <p><strong>Ort:</strong> ${esc(ev.ort||"")}${ev.adresse?", "+esc(ev.adresse):""}</p>
    <p><strong>Datum:</strong> ${esc(firstDate)}</p>
    <p><strong>Uhrzeit:</strong> ${esc(timeRange)}</p>
    <p><strong>Ansprechpartner vor Ort:</strong> ${esc(ev.ansprechpartner||"")}</p>
    <p><strong>Bekleidung:</strong> Kleiderordnung: Einsatzkleidung nach DBO</p>
    <p><strong>Helferverpflegung:</strong> ${ev.verpflegung?"kostenfrei durch den Veranstalter":"Selbstverpflegung"}</p>
  </td>
  <td style="width:50%;vertical-align:top;">
    <div class="sig-box">
      <p><strong>Der Sanitätsdienst wurde korrekt durchgeführt:</strong></p>
      <p>&nbsp;</p>
      <p>&nbsp;</p>
      <p>&nbsp;</p>
      <p>________________________________<br/>Unterschrift Veranstalter</p>
    </div>
  </td>
</tr>
</table>

<hr/>
<p><strong>tatsächliche Ankunftszeit Einsatzort:</strong> ____________</p>
<p><strong>tatsächliches Ende der Veranstaltung:</strong> ____________</p>
<p><strong>Einsatzleiter/in:</strong> ${esc(ev.ilsEL||"")}</p>
<p><strong>Einsatzkräfte:</strong> __________________________________________________</p>
<hr/>

${matSections}
${fzgSections}

<div class="bemerkung-box">
  <p><strong>Bemerkungen zum Einsatz:</strong> ${esc(ev.bemerkung||"")}</p>
</div>
</body>
</html>`;
}


// ═══════════════════════════════════════════════════════════════════
// PDF: Einsatzprotokoll (serverseitig via Puppeteer)
// ═══════════════════════════════════════════════════════════════════
app.post("/api/pdf/einsatzprotokoll/:id", requireAuth, async (req, res) => {
  const puppeteer = require("puppeteer-core");
  try {
    const db = require("./db").getDb();
    const row = db.prepare("SELECT data, bereitschaft_code FROM vorgaenge WHERE id=?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Vorgang nicht gefunden" });
    const vorgang = JSON.parse(row.data);
    const bc = row.bereitschaft_code || req.session.user.bereitschaftCode;
    const stamm = db.prepare("SELECT * FROM bereitschaften WHERE code=?").get(bc) || {};
    const user = db.prepare("SELECT name, titel FROM users WHERE sub=?").get(req.session.user.sub) || {};
    const { dayCalcs } = req.body;
    const html = buildEinsatzprotokollHTML(vorgang, stamm, user, dayCalcs || []);
    const browser = await puppeteer.launch({
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium-browser",
      args: ["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--disable-gpu"],
      headless: true
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    const pdf = await page.pdf({
      format: "A4",
      margin: { top: "10mm", right: "10mm", bottom: "15mm", left: "10mm" },
      printBackground: true
    });
    await browser.close();
    const nr = (vorgang.event?.auftragsnr || req.params.id).replace(/[^a-zA-Z0-9_-]/g,"_");
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nr}_Einsatzprotokoll.pdf"`
    });
    res.send(pdf);
  } catch(e) {
    console.error("Einsatzprotokoll PDF:", e);
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// PDF: Angebot (serverseitig)
// ═══════════════════════════════════════════════════════════════════
app.post("/api/pdf/angebot/:id", requireAuth, async (req, res) => {
  const puppeteer = require("puppeteer-core");
  try {
    const db = require("./db").getDb();
    const row = db.prepare("SELECT data FROM vorgaenge WHERE id=?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Vorgang nicht gefunden" });
    const vorgang = JSON.parse(row.data);
    const stamm = db.prepare("SELECT * FROM bereitschaften WHERE code=?").get(req.session.user.bereitschaftCode) || {};
    const kosten = db.prepare("SELECT * FROM kostensaetze WHERE bereitschaft_code=?").get(req.session.user.bereitschaftCode) || {};
    const user = db.prepare("SELECT name, titel, ort, email, telefon, mobil, unterschrift FROM users WHERE sub=?").get(req.session.user.sub) || {};
    const { dayCalcs, totalCosts, activeDays } = req.body;
    const html = buildAngebotHTML(vorgang.event || {}, dayCalcs || [], totalCosts || 0, activeDays || [], stamm, kosten, user);
    const browser = await puppeteer.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium-browser", args: ["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--disable-gpu"], headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    const pdf = await page.pdf({ format: "A4", margin: { top: "15mm", right: "10mm", bottom: "20mm", left: "10mm" }, displayHeaderFooter: true, headerTemplate: "<span></span>", footerTemplate: `<div style="width:100%;text-align:center;font-size:8pt;color:#aaa;font-family:Arial,sans-serif">Seite <span class="pageNumber"></span> von <span class="totalPages"></span></div>`, printBackground: true });
    await browser.close();
    const nr = (vorgang.event?.auftragsnr || req.params.id).replace(/[^a-zA-Z0-9_-]/g,"_");
    res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${nr}_Angebot.pdf"` });
    res.send(pdf);
  } catch(e) { console.error("Angebot PDF:", e); res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════
// PDF: AAB (serverseitig)
// ═══════════════════════════════════════════════════════════════════
app.post("/api/pdf/aab/:id", requireAuth, async (req, res) => {
  const puppeteer = require("puppeteer-core");
  try {
    const db = require("./db").getDb();
    const row = db.prepare("SELECT data FROM vorgaenge WHERE id=?").get(req.params.id);
    const vorgang = row ? JSON.parse(row.data) : {};
    const stamm = db.prepare("SELECT * FROM bereitschaften WHERE code=?").get(req.session.user.bereitschaftCode) || {};
    const klauseln = db.prepare("SELECT id, titel, inhalt, reihenfolge FROM klauseln WHERE dokument='aab' ORDER BY reihenfolge").all();
    const html = buildAABHTML(stamm, req.session.user.bereitschaftCode, klauseln, vorgang.event?.auftragsnr||'');
    const browser = await puppeteer.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium-browser", args: ["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--disable-gpu"], headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    const pdf = await page.pdf({ format: "A4", margin: { top: "15mm", right: "10mm", bottom: "20mm", left: "10mm" }, displayHeaderFooter: true, headerTemplate: "<span></span>", footerTemplate: `<div style="width:100%;text-align:center;font-size:8pt;color:#aaa;font-family:Arial,sans-serif">Seite <span class="pageNumber"></span> von <span class="totalPages"></span></div>`, printBackground: true });
    await browser.close();
    const nr = (vorgang.event?.auftragsnr || "AAB").replace(/[^a-zA-Z0-9_-]/g,"_");
    res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${nr}_AAB.pdf"` });
    res.send(pdf);
  } catch(e) { console.error("AAB PDF:", e); res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════
// PDF: Angebotsmappe (Gefahren + Angebot + AAB + Vertrag) – MERGED
// ═══════════════════════════════════════════════════════════════════
app.post("/api/pdf/mappe/:id", requireAuth, async (req, res) => {
  const puppeteer = require("puppeteer-core");
  const { PDFDocument } = require("pdf-lib");
  try {
    const db = require("./db").getDb();
    const row = db.prepare("SELECT data FROM vorgaenge WHERE id=?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Vorgang nicht gefunden" });
    const vorgang = JSON.parse(row.data);
    const stamm = db.prepare("SELECT * FROM bereitschaften WHERE code=?").get(req.session.user.bereitschaftCode) || {};
    const user = db.prepare("SELECT name, titel, ort, email, telefon, mobil, unterschrift FROM users WHERE sub=?").get(req.session.user.sub) || {};
    const klauselnAAB = db.prepare("SELECT id, titel, inhalt, reihenfolge FROM klauseln WHERE dokument='aab' ORDER BY reihenfolge").all();
    const { dayCalcs, totalCosts, activeDays } = req.body;

    const browser = await puppeteer.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium-browser", args: ["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--disable-gpu"], headless: true });
    const footerTpl = `<div style="width:100%;text-align:center;font-size:8pt;color:#aaa;font-family:Arial,sans-serif">Seite <span class="pageNumber"></span> von <span class="totalPages"></span></div>`;
    const pdfOpts = (marginLeft="10mm") => ({ format: "A4", margin: { top: "15mm", right: "20mm", bottom: "20mm", left: marginLeft }, displayHeaderFooter: true, headerTemplate: "<span></span>", footerTemplate: footerTpl, printBackground: true });

    const renderHTML = async (html, ml="12mm") => {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "domcontentloaded" });
      const pdf = await page.pdf(pdfOpts(ml));
      await page.close();
      return pdf;
    };

    const parts = [];

    // 1. Gefahrenanalyse (falls dayCalcs vorhanden)
    if (dayCalcs && dayCalcs.length > 0) {
      const gefahrenHTML = buildGefahrenHTML(vorgang.event || {}, activeDays || [], dayCalcs, stamm);
      parts.push(await renderHTML(gefahrenHTML));
    }

    // 2. Angebot
    const angebotHTML = buildAngebotHTML(vorgang.event || {}, dayCalcs || [], totalCosts || 0, activeDays || [], stamm, {}, user);
    parts.push(await renderHTML(angebotHTML, "20mm"));

    // 3. AAB
    const aabHTML = buildAABHTML(stamm, req.session.user.bereitschaftCode, klauselnAAB, vorgang.event?.auftragsnr||'');
    parts.push(await renderHTML(aabHTML));

    // 4. Vertrag
    const vertragHTML = buildVertragHTML(vorgang, stamm, user);
    parts.push(await renderHTML(vertragHTML));

    await browser.close();

    // Merge
    const merged = await PDFDocument.create();
    for (const pdfBytes of parts) {
      const doc = await PDFDocument.load(pdfBytes);
      const pages = await merged.copyPages(doc, doc.getPageIndices());
      pages.forEach(p => merged.addPage(p));
    }
    const result = await merged.save();

    const nr = (vorgang.event?.auftragsnr || req.params.id).replace(/[^a-zA-Z0-9_-]/g,"_");
    const name = (vorgang.event?.name || "Veranstaltung").substring(0,30).replace(/[^a-zA-Z0-9_äöüÄÖÜß -]/g,"").replace(/ /g,"_");
    res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${nr}_${name}_Angebotsmappe.pdf"` });
    res.send(Buffer.from(result));
  } catch(e) { console.error("Mappe PDF:", e); res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════
// HTML Builder: Gefahrenanalyse
// ═══════════════════════════════════════════════════════════════════
function buildGefahrenHTML(ev, activeDays, dayCalcs, stamm) {
  stamm = stamm || {};
  const ROT = "#c0392b";
  const esc = s => (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const fDate = s => s ? new Date(s).toLocaleDateString("de-DE") : "";
  const kvName = (stamm.kv_name || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const berName = (stamm.name || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const logoB64 = stamm.logo ? Buffer.from(stamm.logo).toString("base64") : null;
  const logoHtml = logoB64 ? `<img src="data:image/png;base64,${logoB64}" style="height:40px;width:auto">` : `<span style="color:${ROT};font-size:16pt;font-weight:bold">+</span>`;

  const pages = (activeDays||[]).map((day, i) => {
    const calc = dayCalcs[i] || {};
    const risk = calc.risk || {};
    const rec = calc.rec || {};
    const riskItems = [
      ["Auflagen", risk.ap], ["Fläche", risk.fp], ["Besucher", risk.bp],
      ["Zwischensumme", risk.zw], ["Faktor", risk.factor ? "×"+risk.factor : ""],
      ["Risikopunkte", risk.ro?.toFixed(1)], ["Prominente", "+"+risk.pp], ["Polizei", "+"+risk.pol]
    ].filter(([,v]) => v !== undefined && v !== null);

    return `<div class="pdf-page" style="font-family:Arial,sans-serif;font-size:9pt;color:#000;padding:15mm 10mm;page-break-after:${i < activeDays.length-1 ? 'always' : 'auto'}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
        <div style="display:flex;align-items:center;gap:8px">${logoHtml}<div style="font-size:8pt;color:#666">${kvName}</div></div>
        <div style="text-align:right">
          <div style="font-size:9pt;color:${ROT};font-weight:bold">Sanit&auml;tswachdienst</div>
          ${ev.auftragsnr?`<div style="font-size:7.5pt;color:#666;margin-top:2px">Auftragsnr: <strong>${esc(ev.auftragsnr)}</strong></div>`:""}
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid ${ROT};padding-bottom:6px;margin-bottom:12px">
        <div style="font-size:12pt;font-weight:bold;color:${ROT}">Gefahrenanalyse Sanitätswachdienst</div>
        <div style="font-size:8pt;color:#666">Tag ${i+1} von ${activeDays.length}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:10px">
        <tr><td style="width:160px;color:#666;padding:2px 0">Veranstaltung:</td><td style="font-weight:bold">${esc(ev.name||"")}</td></tr>
        <tr><td style="color:#666;padding:2px 0">Datum:</td><td>${fDate(day.date)} ${day.startTime||""} – ${day.endTime||""} Uhr</td></tr>
        <tr><td style="color:#666;padding:2px 0">Ort:</td><td>${esc(ev.ort||"")}</td></tr>
        <tr><td style="color:#666;padding:2px 0">Erwartete Besucher:</td><td><strong>${day.besucher||"—"}</strong></td></tr>
        <tr><td style="color:#666;padding:2px 0">Gesamtrisiko:</td><td style="color:${ROT};font-weight:bold">${risk.total?.toFixed(1)||"—"} Punkte</td></tr>
      </table>
      <table style="width:100%;border-collapse:collapse;margin-bottom:10px;font-size:8.5pt">
        <thead><tr style="background:#e8e8e8">
          <th style="border:1px solid #ccc;padding:3px 6px;text-align:left;width:30px">Nr.</th>
          <th style="border:1px solid #ccc;padding:3px 6px;text-align:left">Kriterium</th>
          <th style="border:1px solid #ccc;padding:3px 6px;text-align:right;width:60px">Wert</th>
          <th style="border:1px solid #ccc;padding:3px 6px;text-align:right;width:60px">Punkte</th>
        </tr></thead>
        <tbody>
          <tr><td style="border:1px solid #ccc;padding:3px 6px">1a</td><td style="border:1px solid #ccc;padding:3px 6px">Max. Besucher (Auflagen)</td><td style="border:1px solid #ccc;padding:3px 6px;text-align:right">${risk.ap??0}</td><td style="border:1px solid #ccc;padding:3px 6px;text-align:right">${risk.ap??0}</td></tr>
          <tr><td style="border:1px solid #ccc;padding:3px 6px">1b</td><td style="border:1px solid #ccc;padding:3px 6px">Flaeche: ${day.flaeche||0} m</td><td style="border:1px solid #ccc;padding:3px 6px;text-align:right">${risk.fp??0}</td><td style="border:1px solid #ccc;padding:3px 6px;text-align:right">${risk.fp??0}</td></tr>
          <tr><td style="border:1px solid #ccc;padding:3px 6px">2a</td><td style="border:1px solid #ccc;padding:3px 6px">Erwartete Besucher</td><td style="border:1px solid #ccc;padding:3px 6px;text-align:right">${day.besucher||0}</td><td style="border:1px solid #ccc;padding:3px 6px;text-align:right">${risk.bp??0}</td></tr>
          <tr style="background:#f5f5f5"><td style="border:1px solid #ccc;padding:3px 6px"></td><td style="border:1px solid #ccc;padding:3px 6px;font-weight:bold">Zwischensumme</td><td style="border:1px solid #ccc;padding:3px 6px"></td><td style="border:1px solid #ccc;padding:3px 6px;text-align:right;font-weight:bold">${risk.zw??0}</td></tr>
          <tr><td style="border:1px solid #ccc;padding:3px 6px">3</td><td style="border:1px solid #ccc;padding:3px 6px">Faktor: ${day.eventTypeName||""}</td><td style="border:1px solid #ccc;padding:3px 6px;text-align:right">${risk.factor?"x"+risk.factor:""}</td><td style="border:1px solid #ccc;padding:3px 6px"></td></tr>
          <tr><td style="border:1px solid #ccc;padding:3px 6px">4</td><td style="border:1px solid #ccc;padding:3px 6px">Risiko ohne Prom./Pol.</td><td style="border:1px solid #ccc;padding:3px 6px"></td><td style="border:1px solid #ccc;padding:3px 6px;text-align:right">${risk.ro?.toFixed(2)||"0.00"}</td></tr>
          <tr><td style="border:1px solid #ccc;padding:3px 6px"></td><td style="border:1px solid #ccc;padding:3px 6px">Prominente: ${day.prominente||0}</td><td style="border:1px solid #ccc;padding:3px 6px"></td><td style="border:1px solid #ccc;padding:3px 6px;text-align:right">+${risk.pp||0}</td></tr>
          <tr><td style="border:1px solid #ccc;padding:3px 6px"></td><td style="border:1px solid #ccc;padding:3px 6px">Polizei: ${day.polizei?"JA":"NEIN"}</td><td style="border:1px solid #ccc;padding:3px 6px"></td><td style="border:1px solid #ccc;padding:3px 6px;text-align:right">+${risk.pol||0}</td></tr>
          <tr style="background:#ffe0e0"><td style="border:1px solid #ccc;padding:3px 6px;font-weight:bold">5</td><td style="border:1px solid #ccc;padding:3px 6px;font-weight:bold">GESAMTRISIKO</td><td style="border:1px solid #ccc;padding:3px 6px"></td><td style="border:1px solid #ccc;padding:3px 6px;text-align:right;font-weight:bold;color:${ROT}">${risk.total?.toFixed(2)||"0.00"}</td></tr>
        </tbody>
      </table>
      <div style="margin-bottom:8px">
        <div style="font-weight:bold;margin-bottom:4px">Ergebnis der Berechnung:</div>
        <div style="margin-bottom:4px">Das <span style="color:${ROT};font-weight:bold">Gesamtrisiko</span> betraegt: <strong>${risk.total?.toFixed(2)||"0.00"} Punkte</strong></div>
        <div style="margin-bottom:4px">Zur Sicherung des Sanit&auml;tswachdienstes werden empfohlen:</div>
        <div style="padding-left:12px">
          ${rec.helfer>0?`<div>- ${rec.helfer} Helfer</div>`:""}
          ${rec.ktw>0?`<div>- ${rec.ktw} Krankentransportwagen (KTW)</div>`:""}
          ${rec.rtw>0?`<div>- ${rec.rtw} Rettungswagen (RTW)</div>`:""}
          ${rec.nef>0?`<div>- ${rec.nef} Notarzt</div>`:""}
          ${rec.gktw>0?`<div>- ${rec.gktw} Gro&szlig;raum-KTW (GKTW)</div>`:""}
          <div>- Einsatzleitung: ${rec.el==="im Team"?"keine stabsm&auml;&szlig;ige Einsatzleitung":rec.el||""}</div>
        </div>
        <div style="margin-top:6px;font-size:8pt;color:${ROT};font-weight:600">Fahrzeugbesatzungen gelten zus&auml;tzlich zum angegebenen Personalbedarf!</div>
      </div>
      <div style="font-size:7pt;color:#666;font-style:italic;margin-top:6px;padding-top:4px;border-top:1px solid #eee">
        Berechnung nach Maurer-Algorithmus (Dipl.Ing. Klaus Maurer, Stand 2010). Richtwerte mit empfehlendem Charakter.
        Die Richtwerte m&uuml;ssen an die &ouml;rtlichen Verh&auml;ltnisse angepasst werden.
      </div>

      </div>
    </div>`;
  });

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0}@media print{.pdf-page{page-break-after:always}}
  </style></head><body>${pages.join("")}</body></html>`;
}

// ═══════════════════════════════════════════════════════════════════
// HTML Builder: Angebot
// ═══════════════════════════════════════════════════════════════════
function buildAngebotHTML(ev, dayCalcs, totalCosts, activeDays, stamm, kosten, user) {
  const ROT = "#c0392b";
  const esc = s => (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const fDate = s => s ? new Date(s).toLocaleDateString("de-DE") : "";
  const euro = v => v != null && v !== "" ? new Intl.NumberFormat("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2}).format(v)+" €" : "";
  const num = v => (v !== null && v !== undefined && v > 0) ? String(v) : "";

  const unterzeichner = esc(user?.name || stamm.leiter_name || "");
  const unterTitel = esc(user?.titel || stamm.leiter_title || "Bereitschaftsleiter");
  const unterTelefon = esc(user?.telefon || stamm.telefon || "");
  const unterMobil = esc(user?.mobil || stamm.mobil || "");
  const unterEmail = esc(user?.email || stamm.email || "");
  const unterZeichen = (user?.name || stamm.leiter_name || "").split(" ").map(w=>w[0]).join("") || "BL";
  const ortName = esc(user?.ort || (stamm.name||"").replace(/^Bereitschaft\s*/i,"").trim() || "");
  const berName = esc(stamm.name || "");

  const logoB64 = stamm.logo ? Buffer.from(stamm.logo).toString("base64") : null;
  const logoHtml = logoB64 ? `<img src="data:image/png;base64,${logoB64}" style="height:55px;width:auto;display:block;margin-bottom:4px">` : "";

  const tKtw = dayCalcs.reduce((s,d)=>s+(d.kc||0),0);
  const tRtw = dayCalcs.reduce((s,d)=>s+(d.rc||0),0);
  const tAerzt = dayCalcs.reduce((s,d)=>s+(d.ac||0),0);
  const tGktw = dayCalcs.reduce((s,d)=>s+(d.gc||0),0);
  const tElKfz = dayCalcs.reduce((s,d)=>s+(d.ec||0),0);
  const tSeg = dayCalcs.reduce((s,d)=>s+(d.sc||0),0);
  const tMtw = dayCalcs.reduce((s,d)=>s+(d.mc||0),0);
  const tHrs = dayCalcs.reduce((s,d)=>s+(d.h||0),0);
  const tTP = dayCalcs.reduce((s,d)=>s+(d.tp||0),0);
  const isPauschal = ev.pauschalangebot && ev.pauschalangebot > 0;
  const endPreis = isPauschal ? parseFloat(ev.pauschalangebot) : totalCosts;

  // rates aus stammdaten (dayCalcs haben bereits die berechneten Kosten)
  const fzRows = [
    tKtw>0 && { pos:"KTW", anz:tKtw, pers:null, hrs:null, rate:null, summe:dayCalcs.reduce((s,d)=>s+(d.cK||0),0) },
    tRtw>0 && { pos:"RTW", anz:tRtw, pers:null, hrs:null, rate:null, summe:dayCalcs.reduce((s,d)=>s+(d.cR||0),0) },
    tAerzt>0 && { pos:"Ärzte", anz:tAerzt, pers:1, hrs:tHrs, rate:null, summe:dayCalcs.reduce((s,d)=>s+(d.cA||0),0) },
    tElKfz>0 && { pos:"Einsatzleiter KFZ", anz:tElKfz, pers:null, hrs:null, rate:null, summe:dayCalcs.reduce((s,d)=>s+(d.cEK||0),0) },
    tGktw>0 && { pos:"GKTW", anz:tGktw, pers:null, hrs:null, rate:null, summe:dayCalcs.reduce((s,d)=>s+(d.cG||0),0) },
    tSeg>0 && { pos:"SEG-LKW", anz:tSeg, pers:null, hrs:null, rate:null, summe:dayCalcs.reduce((s,d)=>s+(d.cS||0),0) },
    tMtw>0 && { pos:"MTW", anz:tMtw, pers:null, hrs:null, rate:null, summe:dayCalcs.reduce((s,d)=>s+(d.cM||0),0) },
    { pos:"Einsatzkräfte (gesamt)", anz:null, pers:tTP, hrs:tHrs, rate:null, summe:dayCalcs.reduce((s,d)=>s+(d.cH||0),0), isBold:true },
    ev.verpflegung===false && dayCalcs.reduce((s,d)=>s+(d.cV||0),0)>0 && { pos:"Verpflegungspauschale", anz:null, pers:tTP, hrs:null, rate:null, summe:dayCalcs.reduce((s,d)=>s+(d.cV||0),0) },
  ].filter(Boolean);

  const TH = 'border:1px solid #000;padding:3px 6px;font-size:9pt;font-weight:bold;background:#c8c8c8;text-align:center;white-space:nowrap';
  const TD = 'border:1px solid #000;padding:3px 6px;font-size:9pt;vertical-align:middle';
  const TDR = TD+';text-align:right';
  const TDC = TD+';text-align:center';

  const datumszeilen = activeDays.map((d,i)=>
    `<div style="font-size:10pt;margin-bottom:2px;display:flex;gap:8px">
      <span>vom</span><span style="min-width:80px">${fDate(d.date)}</span>
      <span style="min-width:55px">${esc(d.startTime||"")} Uhr</span>
      <span>bis</span><span style="min-width:80px">${fDate(d.date)}</span>
      <span>${esc(d.endTime||"")} Uhr</span>
    </div>`
  ).join("");

  const fzRowsHTML = fzRows.map(row =>
    `<tr>
      <td style="${TD};font-weight:${row.isBold?"bold":"normal"}">${esc(row.pos)}</td>
      <td style="${TDC}">${num(row.anz)}</td>
      <td style="${TDC}">${num(row.pers)}</td>
      <td style="${TDC}">${num(row.km)}</td>
      <td style="${TDC}">${row.hrs?num(row.hrs):""}</td>
      <td style="${TDR}">${row.summe!=null?euro(row.summe):""}</td>
    </tr>`
  ).join("");

  const pauschalRow = isPauschal ? `<tr>
    <td colspan="5" style="${TD};font-weight:600">Gesamtsumme</td>
    <td style="${TDR};font-weight:600">${euro(totalCosts)}</td>
  </tr><tr>
    <td colspan="5" style="${TD};font-weight:bold;font-size:11pt"><strong>Pauschalangebot</strong></td>
    <td style="${TDR};font-weight:bold;font-size:11pt"><strong>${euro(endPreis)}</strong></td>
  </tr>` : "";

  const bemerkung = ev.bemerkung ? `<table style="width:100%;border-collapse:collapse;margin-top:8px;border:1px solid #000">
    <tbody><tr>
      <td style="${TD};font-weight:bold;width:90px;vertical-align:top;white-space:nowrap">Bemerkung:</td>
      <td style="${TD};white-space:pre-wrap">${esc(ev.bemerkung)}</td>
    </tr></tbody>
  </table>` : "";

  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;font-size:10pt;color:#000}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>
  <div style="font-family:Arial,Helvetica,sans-serif;font-size:10pt;color:#000;padding:0 0 10mm 0">
    <!-- KOPFZEILE -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
      <div>
        <div style="font-size:16pt;font-weight:bold;margin-bottom:4px">${berName}</div>
        <div style="font-size:8pt;color:#444">Bayerisches Rotes Kreuz · ${berName}</div>
        <div style="height:17mm"></div>
        <div style="font-size:10pt;line-height:1.6">
          <div style="font-weight:bold">${esc(ev.rechnungsempfaenger||ev.veranstalter||"")}</div>
          ${ev.ansprechpartner?`<div>${esc(ev.ansprechpartner)}</div>`:""}
          ${ev.reStrasse?`<div>${esc(ev.reStrasse)}</div>`:""}
          <div>${esc(ev.rePlzOrt||"")}</div>
        </div>
      </div>
      <div style="font-size:9.5pt;line-height:1.6;text-align:left;min-width:165px">
        ${logoHtml}
        <div style="font-weight:bold;font-size:11pt">${unterzeichner}</div>
        <div style="font-weight:bold">${unterTitel}</div>
        ${unterTelefon?`<div>Tel.: ${unterTelefon}</div>`:""}
        ${stamm.fax?`<div>Fax: ${esc(stamm.fax)}</div>`:""}
        ${unterMobil?`<div>Mobil: ${unterMobil}</div>`:""}
        <div>E-Mail: ${unterEmail}</div>
        <div style="margin-top:6px">Unser Zeichen: <strong>${unterZeichen}</strong></div>
        <div>${ortName}, ${new Date().toLocaleDateString("de-DE")}</div>
      </div>
    </div>
    <!-- AUFTRAGSNR -->
    <div style="margin-bottom:8px"><strong>Auftrags-Nr.</strong>&nbsp;&nbsp;<strong>${esc(ev.auftragsnr||"")}</strong></div>
    <!-- BETREFF -->
    <div style="font-weight:bold;margin-bottom:10px">Angebot für einen Sanitätswachdienst</div>
    <!-- ANREDE -->
    <div style="margin-bottom:10px">${esc(ev.anrede||"Sehr geehrte Damen und Herren,")}</div>
    <div style="margin-bottom:6px">anbei die voraussichtliche Kostenaufstellung für den Sanitätswachdienst.</div>
    <div style="height:4px"></div>
    <div style="font-weight:bold;margin-bottom:6px">${esc(ev.name||"")}</div>
    <div style="height:4px"></div>
    ${datumszeilen}
    <div style="height:6px"></div>
    <!-- TABELLE -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:0">
      <thead>
        <tr>
          <th style="${TH};text-align:left;width:32%">Position</th>
          <th style="${TH}">Anzahl</th>
          <th style="${TH}">Personen</th>
          <th style="${TH}">Kilometer</th>
          <th style="${TH}">Einsatzstunden</th>
          <th style="${TH}">Summe</th>
        </tr>
      </thead>
      <tbody>
        ${fzRowsHTML}
        ${!isPauschal?`<tr>
          <td colspan="5" style="${TD};border:none;background:#fff"></td>
          <td style="${TDR};font-weight:bold;border-top:2px solid #000">${euro(totalCosts)}</td>
        </tr>`:""}
        ${pauschalRow}
      </tbody>
    </table>
    ${bemerkung}
    <!-- UNTERSCHRIFT BRK -->
    <div style="margin-top:28px;display:flex;justify-content:flex-end;font-size:9pt">
      <div style="text-align:center;min-width:200px">
        ${user.unterschrift
          ? '<img src="'+user.unterschrift+'" style="height:50px;width:auto;display:block;margin:0 auto 2px">'
          : '<div style="height:50px"></div>'}
        <div style="border-top:1px solid #000;padding-top:4px;margin-bottom:2px">${unterzeichner}</div>
        ${!user.unterschrift ? '<div style="font-size:8pt;font-style:italic;color:#555">Dieses Dokument wurde maschinell erstellt und ist ohne Unterschrift gültig.</div>' : ''}
      </div>
    </div>
    <!-- BEAUFTRAGUNG -->
    <div style="margin-top:24px;border:2px solid #000;padding:18px 20px">
      <div style="font-weight:bold;font-size:11pt;margin-bottom:10px">Beauftragung / Auftragsbestätigung</div>
      <div style="font-size:9.5pt;margin-bottom:8px;line-height:1.8">
        Hiermit bestätige ich die Beauftragung des Sanitätswachdienstes gemäß obigem Angebot und erkenne die angegebenen Konditionen an.
      </div>
      <div style="height:60px"></div>
      <div style="display:flex;justify-content:space-between;gap:28px;margin-top:4px">
        <div style="flex:1;text-align:center"><div style="border-top:1px solid #000;padding-top:5px;margin-bottom:3px">&nbsp;</div><div style="font-size:8pt;color:${ROT};font-weight:600">Ort, Datum</div></div>
        <div style="flex:2;text-align:center"><div style="border-top:1px solid #000;padding-top:5px;margin-bottom:3px">&nbsp;</div><div style="font-size:8pt;color:${ROT};font-weight:600">Unterschrift Auftraggeber</div></div>
        <div style="flex:2;text-align:center"><div style="border-top:1px solid #000;padding-top:5px;margin-bottom:3px">&nbsp;</div><div style="font-size:8pt;color:${ROT};font-weight:600">Name in Druckbuchstaben</div></div>
      </div>
    </div>
  </div>
  </body></html>`;
}

// ═══════════════════════════════════════════════════════════════════
// HTML Builder: AAB
// ═══════════════════════════════════════════════════════════════════
function buildAABHTML(stamm, bereitschaftCode, klauseln, auftragsnr) {
  const ROT = "#c0392b";
  const esc = s => (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const kvName = esc(stamm.kv_name || "");
  const logoB64 = stamm.logo ? Buffer.from(stamm.logo).toString("base64") : null;
  const logoHtml = logoB64 ? `<img src="data:image/png;base64,${logoB64}" style="height:28px;width:auto">` : `<span style="color:${ROT};font-weight:bold">✚</span>`;

  const sektionen = klauseln.map(k => {
    const absaetze = k.inhalt.split(/\n\n+/).filter(p=>p.trim());
    const absatzHTML = absaetze.map(p => {
      const zeilen = p.split(/\n/);
      if (zeilen.length === 1) return `<div style="margin-bottom:4px;padding-left:16px">${esc(p)}</div>`;
      // Erste Zeile ist die Abschnittsnummer
      return zeilen.map(z => `<div style="margin-bottom:4px;padding-left:16px">${esc(z)}</div>`).join("");
    }).join("");
    return `<div style="margin-bottom:8px">
      <div style="font-weight:bold;margin-bottom:4px">${esc(k.titel)}</div>
      ${absatzHTML}
    </div>`;
  }).join("");

  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;font-size:8.5pt;color:#000;line-height:1.55}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;orphans:0;widows:0}}
  </style></head><body style="overflow:hidden">
  <div style="padding:0">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
      <div style="font-size:8pt;color:#666;display:flex;align-items:center;gap:6px">${logoHtml} ${kvName}</div>
      <div style="text-align:right">
        <div style="font-size:8pt;color:${ROT};font-weight:bold">Sanit&auml;tswachdienst</div>
        ${auftragsnr?`<div style="font-size:7.5pt;color:#666;margin-top:2px">Auftragsnr: <strong>${auftragsnr}</strong></div>`:""}
      </div>
    </div>
    <div style="font-size:12pt;font-weight:bold;text-align:center;margin-bottom:14px;border-bottom:2pt solid ${ROT};padding-bottom:6px">Allgemeine Auftragsbedingungen</div>
    ${sektionen}
    <div style="margin-top:8px;border-top:1px solid #ccc;padding-top:4px;display:flex;justify-content:space-between;font-size:7pt;color:#999">
      <span>${kvName} · Sanitätswachdienst</span>
      <span>Stand: ${new Date().toLocaleDateString("de-DE")}</span>
    </div>
  </div>
  </body></html>`;
}

// ── Static Frontend ──────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Error Handler ────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ error: "Interner Serverfehler" });
});

// ── Start ────────────────────────────────────────────────────────
db.init();
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚑 BRK SanWD v6 gestartet auf Port ${PORT}`);
  console.log(`   Nextcloud: ${process.env.NEXTCLOUD_URL || "nicht konfiguriert"}`);
  console.log(`   OIDC: ${process.env.OIDC_ISSUER || "Dev-Modus (kein OIDC)"}`);
});
