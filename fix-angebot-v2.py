#!/usr/bin/env python3
"""Fix AngebotPDF: BRK Absenderblock, Pauschal, Bemerkungen, Auftragsnr"""

APP = "/home/k8susr/SanWD/sanwd-k8s/sanwd-v6/src/frontend/src/App.jsx"

with open(APP, "r") as f:
    code = f.read()

old_start = 'function AngebotPDF({event,dayCalcs,totalCosts,stammdaten,activeDays,bereitschaft}){'
old_end = '// ═══════════════════════════════════════════════════════════════════════════\n// VERTRAG PDF'

start_idx = code.index(old_start)
end_idx = code.index(old_end)

new_angebot = r'''function AngebotPDF({event,dayCalcs,totalCosts,stammdaten,activeDays,bereitschaft}){
  const isPauschal=event.pauschalangebot&&event.pauschalangebot>0;
  const endPreis=isPauschal?event.pauschalangebot:totalCosts;
  const tH=dayCalcs.reduce((s,d)=>s+d.hc,0),tK=dayCalcs.reduce((s,d)=>s+d.kc,0),tR=dayCalcs.reduce((s,d)=>s+d.rc,0);
  const tG=dayCalcs.reduce((s,d)=>s+d.gc,0),tEL=dayCalcs.some(d=>d.el!=="im Team")?1:0,tEK=dayCalcs.reduce((s,d)=>s+d.ec,0);
  const tS=dayCalcs.reduce((s,d)=>s+d.sc,0),tM=dayCalcs.reduce((s,d)=>s+d.mc,0),tZ=dayCalcs.reduce((s,d)=>s+d.zc,0);
  const tTP=dayCalcs.reduce((s,d)=>s+d.tp,0),tHrs=dayCalcs.reduce((s,d)=>s+d.h,0);
  const fz=(v)=>typeof v==="number"?v.toFixed(2).replace(".",",")+" €":"";
  const rows=[
    {pos:"Helfer / Sanitäter",pers:tH,h:tHrs,betrag:dayCalcs.reduce((s,d)=>s+d.cH,0)},
    tK>0&&{pos:"KTW",anz:tK,betrag:dayCalcs.reduce((s,d)=>s+d.cK,0)},
    tR>0&&{pos:"RTW",anz:tR,betrag:dayCalcs.reduce((s,d)=>s+d.cR,0)},
    tG>0&&{pos:"GKTW",anz:tG,betrag:dayCalcs.reduce((s,d)=>s+d.cG,0)},
    tEL>0&&{pos:"Einsatzleitung",pers:1,h:tHrs,betrag:dayCalcs.reduce((s,d)=>s+d.cE,0)},
    tEK>0&&{pos:"EL-KFZ",anz:tEK,betrag:dayCalcs.reduce((s,d)=>s+d.cEK,0)},
    tS>0&&{pos:"SEG-LKW",anz:tS,betrag:dayCalcs.reduce((s,d)=>s+d.cS,0)},
    tM>0&&{pos:"MTW",anz:tM,betrag:dayCalcs.reduce((s,d)=>s+d.cM,0)},
    tZ>0&&{pos:"Zelt / Sanitätsstation",anz:tZ,betrag:dayCalcs.reduce((s,d)=>s+d.cZ,0)},
    !event.verpflegung&&dayCalcs.reduce((s,d)=>s+d.cV,0)>0&&{pos:"Verpflegungspauschale",pers:tTP,betrag:dayCalcs.reduce((s,d)=>s+d.cV,0)},
  ].filter(Boolean);
  const summeHelfer=rows.filter(r=>r.pers).reduce((s,r)=>s+r.pers,0);
  const th={border:"1px solid #999",padding:"5px 8px",fontSize:"8pt",fontWeight:"bold",background:"#f0f0f0"};
  const td={border:"1px solid #ccc",padding:"4px 8px",fontSize:"9pt"};
  const tdr={...td,textAlign:"right",fontFamily:"monospace"};
  const tdc={...td,textAlign:"center"};
  return(<div className="pdf-page" style={{fontFamily:"Arial,Helvetica,sans-serif",fontSize:"10pt",color:"#000",background:"#fff",width:"210mm",minHeight:"297mm",padding:0,boxSizing:"border-box",position:"relative"}}>
    <div style={{padding:"15mm 20mm 0 20mm"}}>

      {/* ── Absenderblock BRK ───────────────────────── */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
        <div style={{width:"60%"}}>
          {stammdaten.customLogo?<img src={stammdaten.customLogo} alt="Logo" style={{height:50,width:"auto"}}/>:
          <div><div style={{fontSize:"14pt",fontWeight:"bold",lineHeight:1.2}}>Bayerisches<br/>Rotes<br/>Kreuz</div>
          <div style={{background:C.rot,color:"#fff",fontSize:"9pt",fontWeight:"bold",padding:"3px 8px",display:"inline-block",marginTop:4}}>Bereitschaften</div></div>}
        </div>
        <div style={{fontSize:"8pt",color:"#333",lineHeight:1.7,textAlign:"left"}}>
          <div style={{fontWeight:"bold",fontSize:"9pt",marginBottom:6}}>{stammdaten.bereitschaftsleiterTitle||"Bereitschaftsleiter"}</div>
          <div style={{fontWeight:"bold",fontSize:"10pt"}}>{stammdaten.bereitschaftsleiter}</div>
          <div>Telefon: {stammdaten.telefon}</div>
          {stammdaten.fax&&<div>Fax: {stammdaten.fax}</div>}
          <div>Mobil: {stammdaten.mobil}</div>
          <div style={{marginTop:4}}>E-Mail: {stammdaten.email}</div>
        </div>
      </div>

      {/* ── Empfänger ───────────────────────────────── */}
      <div style={{fontSize:"10pt",lineHeight:1.5,minHeight:50,marginTop:10,marginBottom:6}}>
        {event.rechnungsempfaenger||event.veranstalter||""}<br/>
        {event.reStrasse&&<>{event.reStrasse}<br/></>}
        {event.rePlzOrt||""}
      </div>

      {/* ── Unser Zeichen + Datum ───────────────────── */}
      <div style={{display:"flex",justifyContent:"space-between",fontSize:"9pt",marginBottom:16}}>
        <div>Unser Zeichen: <strong>{event.auftragsnr}</strong></div>
        <div>{stammdaten.kvPlzOrt?.split(" ").slice(1).join(" ")||"Neuburg"}, {activeDays[0]?.date?fDate(activeDays[0].date):new Date().toLocaleDateString("de-DE")}</div>
      </div>

      {/* ── Betreff ─────────────────────────────────── */}
      <div style={{fontSize:"11pt",fontWeight:"bold",marginBottom:12}}>Angebot Sanitätswachdienst</div>

      {/* ── Anrede + Einleitung ─────────────────────── */}
      <div style={{fontSize:"10pt",lineHeight:1.6,marginBottom:14}}>
        {event.anrede||"Sehr geehrte Damen und Herren,"}<br/><br/>
        hiermit erlauben wir uns Ihnen die Kosten für den Sanitätswachdienst bei der Veranstaltung <strong>„{event.name}"</strong>
        {event.ort?` in ${event.ort}`:""}
        {activeDays.length>0?<> am {activeDays.map(d=>fDate(d.date)).join(", ")}</>:null} wie folgt anzubieten:
      </div>

      {/* ── Kostenaufstellung ───────────────────────── */}
      <table style={{width:"100%",borderCollapse:"collapse",marginBottom:8}}>
        <thead><tr>
          <th style={{...th,textAlign:"left",width:"40%"}}></th>
          <th style={{...th,textAlign:"center",width:"10%"}}>Anzahl</th>
          <th style={{...th,textAlign:"center",width:"12%"}}>Personen</th>
          <th style={{...th,textAlign:"center",width:"12%"}}>Einsatzst.</th>
          <th style={{...th,textAlign:"right",width:"13%"}}>a' Euro</th>
          <th style={{...th,textAlign:"right",width:"13%"}}>Summe</th>
        </tr></thead>
        <tbody>
          {rows.map((r,i)=>(<tr key={i}>
            <td style={td}>{r.pos}</td>
            <td style={tdc}>{r.anz||""}</td>
            <td style={tdc}>{r.pers||""}</td>
            <td style={tdc}>{r.h||""}</td>
            <td style={tdr}>{r.pers&&r.h?fz(r.betrag/(r.pers*r.h)):r.anz?fz(r.betrag/r.anz):""}</td>
            <td style={tdr}>{fz(r.betrag)}</td>
          </tr>))}
          <tr><td colSpan={5} style={{...td,fontWeight:"bold",textAlign:"right",background:"#f0f0f0"}}>Summe Personalkosten + Fahrzeuge</td>
            <td style={{...tdr,fontWeight:"bold",background:"#f0f0f0"}}>{fz(totalCosts)}</td></tr>
          {isPauschal&&<tr style={{background:"#e0f7fa"}}>
            <td colSpan={5} style={{...td,fontWeight:"bold",fontSize:"12pt"}}>Pauschalangebot</td>
            <td style={{...tdr,fontWeight:"bold",fontSize:"12pt",color:C.rot,background:"#e0f7fa"}}>{fz(endPreis)}</td>
          </tr>}
        </tbody>
      </table>

      {/* ── Bemerkungen ─────────────────────────────── */}
      {event.bemerkung&&<div style={{marginBottom:14}}>
        <div style={{fontSize:"9pt",fontWeight:"bold",marginBottom:4}}>Bemerkung:</div>
        <div style={{fontSize:"9pt",lineHeight:1.5,whiteSpace:"pre-wrap"}}>{event.bemerkung}</div>
      </div>}

      {/* ── Schluss ─────────────────────────────────── */}
      <div style={{fontSize:"10pt",lineHeight:1.6,marginBottom:20,marginTop:14}}>
        Wir bitten um schriftliche Rückbestätigung des Angebotes. Bei Rückfragen stehen wir Ihnen gerne zur Verfügung.<br/><br/>
        Mit freundlichen Grüßen
      </div>

      <div style={{fontSize:"10pt",marginBottom:30}}>
        {stammdaten.bereitschaftsleiter}<br/>
        <span style={{fontSize:"9pt",color:"#444"}}>{stammdaten.bereitschaftsleiterTitle}</span>
      </div>
    </div>

    {/* ── Fußzeile ──────────────────────────────────── */}
    <div style={{position:"absolute",bottom:"10mm",left:"20mm",right:"20mm",textAlign:"center",borderTop:"0.5pt solid #ccc",paddingTop:6}}>
      <div style={{fontSize:"7pt",color:"#999"}}>{bereitschaft.name} · BRK {stammdaten.kvName} · {stammdaten.kvAdresse}, {stammdaten.kvPlzOrt}</div>
    </div>
  </div>);
}

'''

code = code[:start_idx] + new_angebot + '\n' + code[end_idx:]

with open(APP, "w") as f:
    f.write(code)

print("✅ AngebotPDF neu erstellt:")
print("   ✓ BRK Absenderblock (wie Vorlage)")
print("   ✓ Tabelle mit Anzahl/Personen/Einsatzst./a' Euro/Summe")
print("   ✓ Pauschalangebot überschreibt Gesamtsumme")
print("   ✓ Bemerkungen-Feld angezeigt")
print("   ✓ Auftragsnr als 'Unser Zeichen'")
print("   ✓ USt-Befreiung entfernt")
