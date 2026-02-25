#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════
BRK SanWD v5 → v6 Migration
Transforms the v5 App.jsx to use the new modular backend API
═══════════════════════════════════════════════════════════════════
"""
import re
import sys

V5_PATH = "/home/k8susr/SanWD/sanwd-k8s/src/frontend/src/App.jsx"
V6_PATH = "/home/k8susr/SanWD/sanwd-k8s/sanwd-v6/src/frontend/src/App.jsx"

print("🔄 Lese v5 App.jsx...")
with open(V5_PATH, "r") as f:
    code = f.read()

# ═══════════════════════════════════════════════════════════════════
# 1. IMPORTS — useAuth, API hooks hinzufügen
# ═══════════════════════════════════════════════════════════════════
print("  1/8 Imports aktualisieren...")

# Add API import after React import
code = code.replace(
    'import { useState, useMemo, useCallback, useEffect, useRef } from "react";',
    '''import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import API from "./api";'''
)

# ═══════════════════════════════════════════════════════════════════
# 2. AUTH — Login-Screen durch API-Auth ersetzen
# ═══════════════════════════════════════════════════════════════════
print("  2/8 Auth-Flow umbauen...")

# Replace user state + add auth loading
code = code.replace(
    'const [user,setUser]=useState(null);',
    '''const [user,setUser]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  useEffect(()=>{API.getStatus().then(d=>{if(d.authenticated){setUser({...d.user,bereitschaftIdx:0,bereitschaft:d.user.bereitschaft?.name||"",rolle:d.user.rolle});}}).catch(()=>{}).finally(()=>setAuthLoading(false));},[]);'''
)

# Replace login button onClick
code = code.replace(
    'onClick={()=>{}} style={{width:"100%",padding:"14px 20px",background:C.rot',
    'onClick={()=>window.location.href="/auth/login"} style={{width:"100%",padding:"14px 20px",background:C.rot'
)

# Replace logout
code = code.replace(
    'onClick={()=>{setUser(null);setTab("events");}}',
    'onClick={()=>window.location.href="/auth/logout"}'
)

# Add loading screen before login check
code = code.replace(
    '// LOGIN\nif(!user)return(',
    '// LOADING\nif(authLoading)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.hellgrau}}><div style={{textAlign:"center"}}><BRKLogo size={60}/><p style={{marginTop:16,color:C.dunkelgrau}}>Wird geladen...</p></div></div>);\n// LOGIN\nif(!user)return('
)

# ═══════════════════════════════════════════════════════════════════
# 3. STAMMDATEN — aus API laden statt Defaults
# ═══════════════════════════════════════════════════════════════════
print("  3/8 Stammdaten-Loading einbauen...")

# After stammdaten useState, add load effect
stamm_load = '''
  useEffect(()=>{if(!user)return;API.getStammdaten().then(d=>{if(d){setStammdaten(prev=>({...prev,kvName:d.kv_name||prev.kvName,kgf:d.kgf||prev.kgf,kvAdresse:d.kv_adresse||prev.kvAdresse,kvPlzOrt:d.kv_plz_ort||prev.kvPlzOrt,bereitschaftsleiter:d.leiter_name||prev.bereitschaftsleiter,bereitschaftsleiterTitle:d.leiter_title||prev.bereitschaftsleiterTitle,telefon:d.telefon||prev.telefon,fax:d.fax||prev.fax,mobil:d.mobil||prev.mobil,email:d.email||prev.email,funkgruppe:d.funkgruppe||prev.funkgruppe,customLogo:d.logo||null,rates:d.kostensaetze?{helfer:d.kostensaetze.helfer,ktw:d.kostensaetze.ktw,rtw:d.kostensaetze.rtw,gktw:d.kostensaetze.gktw,einsatzleiter:d.kostensaetze.einsatzleiter,einsatzleiterKfz:d.kostensaetze.einsatzleiter_kfz,mobileSanstation:d.kostensaetze.seg_lkw,segLkw:d.kostensaetze.seg_lkw,mtw:d.kostensaetze.mtw,zelt:d.kostensaetze.zelt,kmKtw:d.kostensaetze.km_ktw,kmRtw:d.kostensaetze.km_rtw,kmGktw:d.kostensaetze.km_gktw,kmElKfz:d.kostensaetze.km_el_kfz,kmSegLkw:d.kostensaetze.km_seg_lkw,kmMtw:d.kostensaetze.km_mtw,verpflegung:d.kostensaetze.verpflegung}:prev.rates}));}}).catch(e=>console.warn("Stammdaten laden:",e));},[user]);'''

# Add auto-save for stammdaten
stamm_save = '''
  useEffect(()=>{if(!user||user.rolle==="helfer")return;const t=setTimeout(()=>{API.saveStammdaten({leiter_name:stammdaten.bereitschaftsleiter,leiter_title:stammdaten.bereitschaftsleiterTitle,telefon:stammdaten.telefon,fax:stammdaten.fax,mobil:stammdaten.mobil,email:stammdaten.email,funkgruppe:stammdaten.funkgruppe,kv_name:stammdaten.kvName,kgf:stammdaten.kgf,kv_adresse:stammdaten.kvAdresse,kv_plz_ort:stammdaten.kvPlzOrt}).catch(e=>console.warn("Stammdaten speichern:",e));},2000);return()=>clearTimeout(t);},[stammdaten,user]);'''

# Insert after the stammdaten useState line
old_stamm = 'const [stammdaten,setStammdaten]=useState(DEFAULT_STAMMDATEN);'
code = code.replace(old_stamm, old_stamm + stamm_load + stamm_save)

# ═══════════════════════════════════════════════════════════════════
# 4. KOSTENSÄTZE — auto-save
# ═══════════════════════════════════════════════════════════════════
print("  4/8 Kostensätze auto-save...")

rate_save = '''
  useEffect(()=>{if(!user||user.rolle==="helfer")return;const t=setTimeout(()=>{const r=stammdaten.rates;API.saveKostensaetze({helfer:r.helfer,ktw:r.ktw,rtw:r.rtw,gktw:r.gktw,einsatzleiter:r.einsatzleiter,einsatzleiter_kfz:r.einsatzleiterKfz,seg_lkw:r.segLkw,mtw:r.mtw,zelt:r.zelt,km_ktw:r.kmKtw,km_rtw:r.kmRtw,km_gktw:r.kmGktw,km_el_kfz:r.kmElKfz,km_seg_lkw:r.kmSegLkw,km_mtw:r.kmMtw,verpflegung:r.verpflegung}).catch(e=>console.warn("Kostensätze speichern:",e));},2000);return()=>clearTimeout(t);},[stammdaten.rates,user]);'''

old_rate = 'const updateRate=useCallback((k,v)=>setStammdaten(p=>({...p,rates:{...p.rates,[k]:v}})),[]);'
code = code.replace(old_rate, old_rate + rate_save)

# ═══════════════════════════════════════════════════════════════════
# 5. VORGÄNGE — window.storage → API
# ═══════════════════════════════════════════════════════════════════
print("  5/8 Vorgänge auf API umstellen...")

# Replace window.storage.get for events loading
code = re.sub(
    r'const r=await window\.storage\.get\(`\$\{storagePrefix\}:evt-\$\{id\}`\);',
    'const r=await API.getVorgang(year, id).then(d=>({value:JSON.stringify(d)})).catch(()=>null);',
    code
)

# Replace window.storage.set for events saving
code = re.sub(
    r'await window\.storage\.set\(`\$\{storagePrefix\}:evt-\$\{currentEventId\}`',
    'await API.saveVorgang(currentEventId, {...saveData, year}',
    code
)

# Replace window.storage.delete for events
code = re.sub(
    r'await window\.storage\.delete\(`\$\{storagePrefix\}:evt-\$\{id\}`\)',
    'await API.deleteVorgang(id)',
    code
)

# Replace window.storage.list for events listing
code = re.sub(
    r'const result=await window\.storage\.list\(`\$\{storagePrefix\}:evt-`\);',
    'const allVorgaenge=await API.getVorgaenge(year);const result={keys:allVorgaenge.map(v=>"evt-"+v.id)};',
    code
)

# ═══════════════════════════════════════════════════════════════════
# 6. KUNDEN — window.storage → API
# ═══════════════════════════════════════════════════════════════════
print("  6/8 Kunden auf API umstellen...")

# Replace kunden load
code = re.sub(
    r'const r=await window\.storage\.get\(kundenKey\);if\(r\?\.\s*value\)setKunden\(JSON\.parse\(r\.value\)\);',
    'const k=await API.getKunden();setKunden(k);',
    code
)

# Replace counter load
code = re.sub(
    r'const r=await window\.storage\.get\(`\$\{storagePrefix\}:counter`\);if\(r\?\.\s*value\)setLaufendeNr\(parseInt\(r\.value\)\|\|1\);',
    'const c=await API.getCounter(year);setLaufendeNr(c.nextNr||1);',
    code
)

# Replace counter save
code = re.sub(
    r'window\.storage\.set\(`\$\{storagePrefix\}:counter`,String\(next\)\);',
    'API.incrementCounter(year).catch(()=>{});',
    code
)

# ═══════════════════════════════════════════════════════════════════
# 7. LOGO — Upload über API
# ═══════════════════════════════════════════════════════════════════
print("  7/8 Logo-Upload auf API umstellen...")

# Replace logo upload handler (FileReader → API)
# Find the logo upload section and replace with API call
code = re.sub(
    r'const reader=new FileReader\(\);reader\.onload=e=>\{[^}]*setStammdaten[^}]*\};reader\.readAsDataURL\(file\);',
    'API.uploadLogo(file).then(r=>{if(r.logo)setStammdaten(p=>({...p,customLogo:r.logo}));}).catch(e=>alert("Logo-Upload fehlgeschlagen: "+e.message));',
    code,
    flags=re.DOTALL
)

# ═══════════════════════════════════════════════════════════════════
# 8. BEREITSCHAFT — aus User Session statt Dropdown
# ═══════════════════════════════════════════════════════════════════
print("  8/8 Bereitschaft aus Session...")

# Fix storagePrefix to use user's bereitschaftCode
code = re.sub(
    r'const storagePrefix=useMemo\(\(\)=>`sanwd:\$\{BEREITSCHAFTEN\[stammdaten\.bereitschaftIdx\]\.code\}:\$\{year\}`',
    'const storagePrefix=useMemo(()=>`sanwd:${user?.bereitschaftCode||BEREITSCHAFTEN[stammdaten.bereitschaftIdx]?.code||"BSOB"}:${year}`',
    code
)

# Add role display in header
code = code.replace(
    '{user.isDemo&&" (Demo)"}',
    '{user.rolle==="admin"?" (Admin)":user.rolle==="bl"?" (BL)":""}'
)

# ═══════════════════════════════════════════════════════════════════
# DONE
# ═══════════════════════════════════════════════════════════════════
print(f"💾 Schreibe v6 App.jsx → {V6_PATH}")
with open(V6_PATH, "w") as f:
    f.write(code)

print("✅ Migration abgeschlossen!")
print()
print("Änderungen:")
print("  ✓ API import hinzugefügt")
print("  ✓ Auth über /auth/login + /auth/status")
print("  ✓ Stammdaten laden/speichern über API")
print("  ✓ Kostensätze auto-save über API")
print("  ✓ Vorgänge CRUD über API")
print("  ✓ Kunden über API")
print("  ✓ Logo-Upload über API")
print("  ✓ Bereitschaft aus Keycloak Session")
print("  ✓ Rollen-Anzeige im Header")
