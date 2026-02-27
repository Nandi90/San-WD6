import React from "react";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import API, { getPapierkorb, restoreVorgang, purgeVorgang } from "./api";

// ═══════════════════════════════════════════════════════════════════════════
// DRK CORPORATE IDENTITY
// ═══════════════════════════════════════════════════════════════════════════
const C={rot:"#E60005",softrot:"#E46450",dunkelrot:"#A51E0F",dunkelblau:"#002F5F",hellblau:"#D9E8F5",mittelblau:"#004B91",dunkelgrau:"#554F4A",mittelgrau:"#B4B4B4",hellgrau:"#EFEEEA",weiss:"#FFFFFF",schwarz:"#1A1A1A",bgrau:"#A0A0A0"};
const FONT={serif:"'Merriweather',Georgia,serif",sans:"'Open Sans','Helvetica Neue',Arial,sans-serif",mono:"'JetBrains Mono','Courier New',monospace"};
const BRK_LOGO="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABQCAYAAABcbTqwAAAMH0lEQVR42u1dWWhU1x/+zswYrU1ijE2sEe1DEZFWTNuniltfJLgjWGxrEaQPfbI6c4cQQ7SlisrMxEopCoIPKogEJWLEpQ8uWEv7YHFBWyNtRUSJS6RxwczMPf8HPed/7p1z79yZzJr5fXDhLuee7Z7v/JazXADg5Xr8/vvvvJzzT+Uu/YMB4JxzEAgEKxhj8FE1EAjOIIIQCEQQAqEECMLBwRnL7kBh7KCamhowxhyPQCBQ0joxYww1NTV5i5sxRqzIF0EYWFHezSWSySQ1EoJEoJILr3rvOOfw+Xxlk18C2CAFV18mTZrk2DDtqlhLS0uKerJ27VpPaot6f8aMGZZnjY2Nlnd057W1ta55cyKSPZxXlUsXX1dXV9owra2tnvNW4h1T7mACWR2FQnV1tRwEsuTbNC0DRAKPHz92HUh6PYikjVPc++OPPzjnnH/55Zeu8XDOeUNDQ9p0qqurU9KwH729vTJMbW2tYzjTNF3jsYdzC1tVVZU2DAr4rYeK1/mtXILojvXr12sbOWNMe9/pWiWc7tr+Xk1NjZYgV69eTQkrCKJrdEeOHHFMt7+/X9uA7deCDOq7//zzD+ec81mzZrmWw044XZi3336bCFKuBPHSy+nCietNmzZpw4wdO1Yb9507dyz3VYI4pasjiFOenZ7H43He19fH+/r6PEnBjz76SEsEe7j6+vqU+C5evMjLEcjHVBOepQeI8cK5eZ8+fepo9ArdvL+/H3V1dZZ7boazz+eT58IuAADTND27TznnaGxsxIMHD7T5E3FUV1djYGDA1bEg3lXTdfvOTuHE/WnTpuH69euey2GaJvx+f1k7G2iqiQvGjh2rbTimaWo/sGmanhsA51x7ZPMBxbvxeNyxwecDoh6cyiE6DNM0cfz48YLmjbxYBXCjfvbZZ1oCMMbw559/uleq0quLxvDvv/86hm9qakJTU1NWBBEkCQQCWqL19vZqy6cOmGY1PmAbUJ04cSKampqwevXqFC/YggULytpFTTaIiw0irufMmZNWr7927Zqj58f+3rNnz3gwGHT1YmVig5im6eiJU+/F43FeV1fn6sXSpTlt2rSMDHxx7ff7Xb2EpW6DBEhueNORz58/L3vblpYWnDx5MsXeeO+991xVCdM0pXR588035f0JEyZknU+Rht0WUcugpjtixAh5f8aMGVlJkNu3b+Odd95JKaOwt9S86WYmlJM0qTiCDAwM5G30Wg27ZMkSR5vBDX19fRnlxUv+vKTr9Fx3f/LkyVqHRLka4651V2lerHx6PIZb46h0kBcrTwgGg1QJwwSBXEqBYkieUpE+qv5NGD6oOAmSbj1Ito1c1fNJvSKCDHvdMxu0tLS80lt9VK1EkGEA+wjw0qVL5bN79+5R6yCQBFHR3d0tz5cvX255du3aNde1DYwxnD592nLttg7EyfVqD3PkyBH6MMXUJqBx8/IyMzYzMdLdJiuqk/90E/bcjHO3sYBjx45px0Xsxr2XSZGEwqravkqvAPVIZzsIVUydmKgSav78+Slhgf8PGuomJor31bSHMoGRQCpWQWwTN+nBGLOQxA1dXV2OksMtTdUjRkQhghTdSFenoHjxYnldZ/Hpp59qJZbb3CkhUcp5HTcRZJihurras1TINF4dIXVqlKrCqZMKyW1MBCkZm8SO999/Xxt28eLFniTOf//9l9YGUs/7+/vBGMPg4CBJDiJI6eLy5csAgKtXr1oadHd3Nxhj6OnpAQB8//338vnMmTO16pR6r6OjA1OnTpX3VdcwANTX10tpQlNXSqDTBLl5PdkWusY6c+ZM/PLLL65SSLc2XGD06NF49uxZWklEkqR4GkXFEaQQhr9bQyepUF4E0S+Y6r0JZPMhOYApU7LLza3e7Bvla1FYqnaMl2eEMlKxhtSDVuiCKcLwlCBkpBMILqjo9SBao+z10djYSK2DQBJEZx/U1dW5bp5AIIJUFKqqquT5qFGj0N/fT5VCIIIAQENDg9y20+fz4cWLF5bn48aNc/xfBwAkEgnXJbsbN25MuzbEfp2rZcAEIsiQcOjQITx8+FBeJ5NJz2oYANTW1lrmTDmFI5QvKnpnxZUrV2b8jrrAScwA1i16ynQWrtNO7gBSNqYmkAQpuqHu1IhFmHfffVf7Xi7GlNT4Nm3aVNJ/3iWCDHPYG/T9+/c9vff3339r7Ymhqlfjx4+3XH/77bfUSknFKi45VMkwYcKEjDeBy9VMhJs3b1rcyzRJsQS0CtAfpuS5fV048MqL9fjxY1c7wU4odYfzR48e4a233nK0VdR4c62qEYau6pIN4mB/TMlg0qW6PFYlhyCYLly69MnNSzZIyUFdcnvr1q2sfxlw7NixtGk1NDRQhVeaijWU9Q6lNGU9H2UXz2lNSHlpFTm3QQgEskEIBLJBCAQCEYRAIIIQCEQQAiHn0E41MQyDaoaQV0SjUZIgBMKwlCC5wqpVq1LuPX36FF1dXQgEAkUdMPviiy/AGMP+/ftT5kDlI18rVqzAyJEjceDAgZzGyzlHNBqVg5DhcJhadblIkObm5pRj1qxZ2LlzJ2KxGMaMGVO0gn/wwQdobm62kCESiWDy5Ml5SW/69Olobm7OOTlisVgKoctFfal4CeJm00QiEXR0dCAUChVFkoRCIQDQzsItF4j8ks04DG0Q8VGdemyv01+y/QNTNrNkc7osIAdx0RShYSJB3PDo0SNXDwfnHEePHsWFCxdSwhiGIcMyxiTpTNNEZ2enqxQT7xmGgWQyiR07dgAA1q5d6xoX5xyhUEj7hyjVFmCMOUrHSCRimRavsxsikUiKVNu7dy+uX78unwuCiLL8+uuv+Pjjj1PKJ7Bt2zb4/X7XtKPRKE6cOIGzZ89i27ZtsjzxeBwbNmwgCVIoiA/4/PlzbcNobW2VatCyZcvkfXsc9t+UjRgxQjboUCgEwzBk43XqcX0+H9ra2gAAu3btkucA0NnZKUkh8tPZ2WnZASWRSEhbQKQJALFYLCVNUe7169fj+fPnYIyllE2U6+jRowiFQli3bh0AYM2aNXj58iUAoL29He3t7QCAtrY2tLW1obu7W+Zd3FPjDAQCSCQSMAwD3333nTZt4NVfsbZv346DBw/KtKuqqvD5558TQfJFBvuh9tL2njUUCiGZTIIxhnA4LPeW0v222TAMGIYhe8KtW7fKnlP0lOFwWBq0TuqW2DkkHo/Lc9GYw+GwJKJIR0gcAPjhhx8saYoyCGKq+O233xAOh+H3+7Fx40bcvXtXK2WCwSAuXLjwagv+QEDW1Y8//ggAGBwcxODgoCXPyWRSW45EIiHjFKQZGBiQEi4YDFrSnj17NgzDwKVLlxAIBGSZP/zwQyJIIWHvvZz+Fy6kjL2x3bhxQ6uT64xWQY5M9PY7d+5IgtjVNXsaHR0dKWVRiStg/+utXRUU8efyv4SCwPY4RT03NTWRvVNqXizRo0ciEa0e7Oa1Edi9e7dl29DW1lbX9zP1VO3cuRORSATjx4+3xKl6wISqZd+RcahesUQigR07duTUszYU92+lLvIqmpHuJC3++uuvlP/2ef1o4v9+Qg3JBQR5VcNaSCNh3wjC56oRiYYs4o7FYrh3796QxzdyWS9EkCJh6tSp2LNnj1bipGuA33zzDX766Sfcvn07q/e9EMVuy4hN3RKJRMo2pJFIBD09PTh37lzGameuxzY459p6yTW5yQbJMexb7ziFicVi+Prrr13jeuONN7S2jeooSIfRo0e7vsMY06pTQs+3h1V/Fz0UVSbdvsFuuHjxouNWqNFo1NF5QSiSFysSiVg8RHZbRW2UL1++lB9w165dadOKx+NgjFniUMcn0uGrr77CJ598AuCVK9aen8HBQUlEgc2bN6e4THXjEF5w6tSplDTnzp1r8Zp5rfNFixYBAA4fPixVtYkTJ8pOJ9s8kopVAPtDuGjtUz0Mw7AQSHxM4WpNh7a2NtTX12PDhg2WOK5cuYJ9+/Z5ytvChQtx5swZ+P1+tLe3Y8uWLdr8CDx58kQOWqrhgsFgxt6on3/+GfPnz7eQXIzDeO3phco0b9489PT0yHqNRqOS9G4OFILSHqDZ1YQqjVAIraLkyUG7mhAIJW6kEwhlp2IRCARSsQgEUrEIBCIIgZBPG4SqgUDQ439Ml76p8f57dAAAAABJRU5ErkJggg==";
const BRKLogo=({size=48,full,customLogo})=>{if(full&&customLogo)return <img src={customLogo} alt="Logo" style={{height:size,width:"auto"}}/>;if(full)return <img src={BRK_LOGO} alt="BRK Bereitschaften" style={{height:size,width:"auto"}}/>;return(<svg width={size} height={size} viewBox="0 0 100 100" fill="none"><rect x="35" y="5" width="30" height="90" rx="2" fill={C.rot}/><rect x="5" y="35" width="90" height="30" rx="2" fill={C.rot}/></svg>);};

// ═══════════════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════════════
const BEREITSCHAFTEN=[{code:"KBL",name:"Kreisbereitschaftsleitung",short:"KBL"},{code:"BSOB",name:"Bereitschaft Schrobenhausen",short:"SOB"},{code:"BND",name:"Bereitschaft Neuburg",short:"ND"},{code:"BKAHU",name:"Bereitschaft Karlshuld",short:"KAHU"},{code:"BKK",name:"Bereitschaft Karlskron",short:"KK"},{code:"BBGH",name:"Bereitschaft Burgheim",short:"BGH"},{code:"BWEIG",name:"Bereitschaft Weichering",short:"WEIG"}];
const DEFAULT_STAMMDATEN={kvName:"Kreisverband Neuburg-Schrobenhausen",kgf:"Anton Gutmann",kvAdresse:"Karl Konrad Str. 3",kvPlzOrt:"86633 Neuburg",bereitschaftIdx:0,bereitschaftsleiterTitle:"Bereitschaftsleiter",bereitschaftsleiter:"Kreisbereitschaftsleitung",telefon:"08431/6799-0",fax:"08431/6799-0",mobil:"-",email:"info@kvndsob.brk.de",funkgruppe:"",customLogo:null,rates:{helfer:14,ktw:125,rtw:155,aerzte:0,gktw:105,einsatzleiter:14,einsatzleiterKfz:155,mobileSanstation:115,segLkw:125,mtw:50,zelt:60,kmKtw:0.4,kmRtw:0.4,kmGktw:0.4,kmElKfz:0.6,kmSegLkw:0.6,kmMtw:0.4,verpflegung:17}};
const EVENT_TYPES=[{id:1,name:"Kurkonzert",factor:0.1},{id:2,name:"Reitsportveranstaltung",factor:0.1},{id:3,name:"Klassikkonzert, Oper, Operette",factor:0.2},{id:4,name:"Schauspiel, Theater",factor:0.2},{id:5,name:"Show",factor:0.2},{id:6,name:"Allg. Sportveranstaltung",factor:0.3},{id:7,name:"Ausstellung, Basar, Flohmarkt",factor:0.3},{id:8,name:"Langlauf, Radrennen",factor:0.3},{id:9,name:"Messe, Martinszug",factor:0.3},{id:10,name:"Kombi Sport-Musik-Show",factor:0.35},{id:11,name:"Volksfest, Straßenfest",factor:0.4},{id:12,name:"Feuerwerk",factor:0.4},{id:13,name:"Schützenfest, Festzug",factor:0.5},{id:14,name:"Festzug mit Pferdewagen",factor:0.7},{id:15,name:"Musikveranstaltung",factor:0.5},{id:16,name:"Kundgebung",factor:0.5},{id:17,name:"Triathlon, Crosslauf",factor:0.6},{id:18,name:"Faschingsveranstaltung",factor:0.7},{id:19,name:"Wintersport Ski/Snowboard",factor:0.8},{id:20,name:"Wintersport Rodel/Bob",factor:0.8},{id:21,name:"Motorsportveranstaltung",factor:0.8},{id:22,name:"Demonstration",factor:0.8},{id:23,name:"Flugveranstaltung",factor:0.9},{id:24,name:"Rock-/Popkonzert",factor:1.0},{id:25,name:"Individueller Faktor",factor:0}];
const PERSONNEL_TABLE=[{min:0,max:2,h:2,k:0},{min:2,max:4,h:3,k:0},{min:4,max:13,h:5,k:1},{min:13,max:25,h:10,k:2},{min:25,max:40,h:20,k:3},{min:40,max:60,h:30,k:4},{min:60,max:80,h:40,k:5},{min:80,max:100,h:80,k:6},{min:100,max:120,h:120,k:8},{min:120,max:9999,h:140,k:10}];
const RTW_T=[{min:0,max:6,v:0},{min:6,max:25.5,v:1},{min:25.5,max:45.5,v:2},{min:45.5,max:60.5,v:3},{min:60.5,max:75.5,v:4},{min:75.5,max:100,v:5},{min:100,max:120,v:6},{min:120,max:9999,v:8}];
const NEF_T=[{min:0,max:13,v:0},{min:13,max:30,v:1},{min:30,max:60,v:2},{min:60,max:90,v:3},{min:90,max:9999,v:4}];

// CHECKLIST ITEMS
const CHECKLIST_ITEMS=[
  {key:"angebotVersendet",label:"Angebot versendet",icon:"📨"},
  {key:"vertragAabVersendet",label:"Vertrag + AAB versendet",icon:"📝"},
  {key:"angebotSigniertVorliegend",label:"Angebot akzeptiert und liegt signiert vor",icon:"✍️"},
  {key:"hiorgAngelegt",label:"SanWD in HiOrg/DRK Server angelegt",icon:"🖥️"},
  {key:"ilsAngemeldet",label:"Anmeldung ILS",icon:"📡"},
  {key:"einsatzprotokollGedruckt",label:"Einsatzprotokoll für Helfer gedruckt",icon:"🖨️"},
  {key:"fibuWeitergeleitet",label:"Weiterleitung an FiBu",icon:"💳"},
  {key:"abgeschlossen",label:"Abgeschlossen",icon:"✅"},
];

// ═══════════════════════════════════════════════════════════════════════════
// CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════
function vPts(n){if(!n)return 0;if(n<=500)return 1;if(n<1000)return 2;if(n<1500)return 3;if(n<3000)return 4;if(n<6000)return 5;if(n<10000)return 6;if(n<20000)return 7;return Math.round((n-20000)/10000)+7;}
function calcRisk(d){const ap=d.auflagen?(d.geschlossen?vPts(d.auflagen)*2:vPts(d.auflagen)):0;const fc=d.flaeche?d.flaeche*(d.geschlossenFlaeche?2:1):0;const fp=fc>0?vPts(fc):0;const bp=d.besucher?Math.round(d.besucher/500):0;const bfp=d.besucherFlaeche?Math.round((d.besucherFlaeche*2)/500):0;const zw=ap+fp+bp+bfp;const factor=d.eventTypeId===25?(d.customFactor||0):(EVENT_TYPES.find(e=>e.id===d.eventTypeId)?.factor||0.4);const ro=zw*factor;const pp=Math.round((d.prominente||0)/5)*10;const pol=d.polizeiRisiko?10:0;return{ap,fp,bp,bfp,zw,factor,ro,pp,pol,total:ro+pp+pol};}
function getRec(risk){const p=PERSONNEL_TABLE.find(r=>risk>=r.min&&risk<r.max)||PERSONNEL_TABLE[9];const rtw=(RTW_T.find(r=>risk>=r.min&&risk<r.max)||RTW_T[7]).v;const nef=(NEF_T.find(r=>risk>=r.min&&risk<r.max)||NEF_T[4]).v;let el="im Team";if(risk>60)el="volle stabsmäßige EL";else if(risk>30)el="stabsm. EL, reduziert";else if(p.h>=21)el="Zugführer";else if(p.h>=6)el="Gruppenführer";return{helfer:p.h,ktw:p.k,rtw,nef,el,elKfz:risk>=110?3:risk>=80?2:risk>=50?1:0,gktw:risk>=90?1:0};}
function calcH(s,e){if(!s||!e)return 0;const[sh,sm]=s.split(":").map(Number);const[eh,em]=e.split(":").map(Number);let d=(eh*60+em)-(sh*60+sm);if(d<=0)d+=1440;return Math.ceil(d/15)*0.25;}
function calcDay(d,rates,verpfVA){const h=calcH(d.startTime,d.endTime);const risk=calcRisk(d);const rec=getRec(risk.total);const hc=d.oHelfer??rec.helfer,kc=d.oKtw??rec.ktw,rc=d.oRtw??rec.rtw,ac=d.oAerzte??0,gc=d.oGktw??rec.gktw,el=d.oEl??rec.el;const ec=d.oElKfz??rec.elKfz,sc=d.oSeg??0,mc=d.oMtw??0,zc=d.oZelt??0;const tp=el==="im Team"?hc+kc*2+rc*2+gc*2+ac:hc+kc*2+rc*2+gc*2+ac+1;const hfc=el==="im Team"?tp-ac:tp-ac-1;const cH=hfc*h*rates.helfer,cK=kc*rates.ktw+(d.kmKtw||0)*kc*rates.kmKtw,cR=rc*rates.rtw+(d.kmRtw||0)*rc*rates.kmRtw,cA=ac*rates.aerzte,cG=gc*rates.gktw+(d.kmGktw||0)*gc*rates.kmGktw,cE=el==="im Team"?0:h*rates.einsatzleiter,cEK=ec*rates.einsatzleiterKfz+(d.kmElKfz||0)*rates.kmElKfz,cS=sc*rates.segLkw+(d.kmSeg||0)*sc*rates.kmSegLkw,cM=mc*rates.mtw+(d.kmMtw||0)*mc*rates.kmMtw,cZ=zc*rates.zelt;const vB=verpfVA?0:Math.ceil(h/8);const cV=verpfVA?0:vB*tp*rates.verpflegung;return{h,risk,rec,hc,kc,rc,ac,gc,el,ec,sc,mc,zc,tp,hfc,cH,cK,cR,cA,cG,cE,cEK,cS,cM,cZ,cV,total:cH+cK+cR+cA+cG+cE+cEK+cS+cM+cZ+cV,vB};}
const mkDay=(n)=>({id:n,active:n===1,date:"",startTime:"18:00",endTime:"23:00",auflagen:0,geschlossen:false,flaeche:0,geschlossenFlaeche:false,besucher:1000,besucherFlaeche:0,eventTypeId:11,customFactor:0,prominente:0,polizeiRisiko:false,oHelfer:null,oKtw:null,oRtw:null,oAerzte:null,oGktw:null,oEl:null,oElKfz:null,oSeg:null,oMtw:null,oZelt:null,kmKtw:0,kmRtw:0,kmGktw:0,kmElKfz:0,kmSeg:0,kmMtw:0,fahrzeuge:[]});
const EMPTY_EVENT={auftragsnr:"",rechnungsnr:"",name:"",ort:"",adresse:"",veranstalter:"",ansprechpartner:"",telefon:"",email:"",rechnungsempfaenger:"",reStrasse:"",rePlzOrt:"",anrede:"Sehr geehrte Damen und Herren,",auflagen:"keine",kfzStellplatz:true,sanitaetsraum:false,strom:true,verpflegung:true,pauschalangebot:0,bemerkung:"",coords:null,w3w:"",hausnr:"",checklist:{},ilsEL:"",ilsTelefon:"",ilsFunk:"",ilsAbkoemmlich:"",ilsFzg1:"",ilsFzg2:"",ilsFzg3:"",ilsSonstige:""};
const f2=(v)=>new Intl.NumberFormat("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2}).format(v);
const fDate=(d)=>d?new Date(d).toLocaleDateString("de-DE"):"";
const buildAddrStr=(addr)=>{
  if(!addr)return"";
  const road=addr.road||addr.pedestrian||addr.path||addr.footway||"";
  const hnr=addr.house_number||"";
  const sub=addr.suburb||addr.quarter||addr.neighbourhood||"";
  const city=addr.city||addr.town||addr.village||addr.hamlet||"";
  const plz=addr.postcode||"";
  const parts=[];
  if(road&&hnr)parts.push(road+" "+hnr);else if(road)parts.push(road);
  if(sub)parts.push(sub);if(city)parts.push(city);if(plz)parts.push(plz);
  parts.push("Deutschland");
  return parts.join(", ");
};
const fTS=(ts)=>{if(!ts)return"";const d=typeof ts==="number"?new Date(ts):new Date(String(ts).includes("T")||String(ts).endsWith("Z")?ts:String(ts).replace(" ","T")+"Z");if(isNaN(d))return"";return d.toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})};

// ═══════════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════
const ChangelogItem=({v,d,items,defaultOpen})=>{
  const [open,setOpen]=React.useState(!!defaultOpen);
  return(<div style={{borderBottom:`1px solid ${C.mittelgrau}20`}}>
    <div onClick={()=>setOpen(!open)} style={{display:"flex",alignItems:"center",gap:10,padding:"14px 20px",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=C.hellgrau} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      <span style={{fontSize:12,color:C.bgrau,transition:"transform 0.2s",transform:open?"rotate(90deg)":"rotate(0deg)"}}>▶</span>
      <span style={{background:C.rot,color:"#fff",borderRadius:4,padding:"2px 8px",fontWeight:700,fontSize:12,fontFamily:"monospace"}}>{v}</span>
      <span style={{fontSize:11,color:C.dunkelgrau}}>({items.length})</span>
      <span style={{fontSize:11,color:C.dunkelgrau}}>{d}</span>
    </div>
    {open&&<div style={{padding:"0 20px 14px 46px"}}><ul style={{margin:0,paddingLeft:18}}>
      {items.map((item,i)=><li key={i} style={{fontSize:13,color:C.schwarz,marginBottom:3}}>{item}</li>)}
    </ul></div>}
  </div>);
};
const Card=({children,title,accent,sub,action})=>(<div style={{background:C.weiss,borderRadius:8,border:`1px solid ${C.mittelgrau}40`,borderTop:accent?`3px solid ${accent}`:undefined,padding:"18px 22px",marginBottom:14,boxShadow:"0 1px 4px #0001"}}>{(title||action)&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><div><h3 style={{margin:0,fontSize:15,fontWeight:700,color:C.dunkelgrau,fontFamily:FONT.sans}}>{title}</h3>{sub&&<div style={{fontSize:11,color:C.bgrau,marginTop:2}}>{sub}</div>}</div>{action}</div>}{children}</div>);
const Inp=({label,value,onChange,type="text",min,max,step,disabled,suffix,small,placeholder})=>(<label style={{display:"block",marginBottom:small?6:10}}><span style={{display:"block",fontSize:11,color:C.dunkelgrau,marginBottom:3,fontWeight:600,fontFamily:FONT.sans}}>{label}</span><div style={{display:"flex",alignItems:"center",gap:6}}><input type={type} value={value} placeholder={placeholder} onChange={e=>onChange(type==="number"?(e.target.value===""?"":Number(e.target.value)):e.target.value)} min={min} max={max} step={step} disabled={disabled} style={{width:"100%",padding:"8px 10px",background:C.weiss,border:`1px solid ${C.mittelgrau}`,borderRadius:4,color:C.schwarz,fontSize:13,outline:"none",fontFamily:FONT.sans,boxSizing:"border-box"}} onFocus={e=>e.target.style.borderColor=C.mittelblau} onBlur={e=>e.target.style.borderColor=C.mittelgrau}/>{suffix&&<span style={{color:C.dunkelgrau,fontSize:12}}>{suffix}</span>}</div></label>);
const Sel=({label,value,onChange,options,small})=>(<label style={{display:"block",marginBottom:small?6:10}}><span style={{display:"block",fontSize:11,color:C.dunkelgrau,marginBottom:3,fontWeight:600,fontFamily:FONT.sans}}>{label}</span><select value={value} onChange={e=>onChange(isNaN(e.target.value)?e.target.value:Number(e.target.value))} style={{width:"100%",padding:"8px 10px",background:C.weiss,border:`1px solid ${C.mittelgrau}`,borderRadius:4,color:C.schwarz,fontSize:13,fontFamily:FONT.sans,cursor:"pointer",boxSizing:"border-box"}}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>);
const Chk=({label,checked,onChange})=>(<label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",marginBottom:6,fontSize:13,color:C.dunkelgrau,fontFamily:FONT.sans}}><div onClick={()=>onChange(!checked)} style={{width:18,height:18,borderRadius:3,border:`2px solid ${checked?C.rot:C.mittelgrau}`,background:checked?C.rot:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>{checked&&<svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}</div>{label}</label>);
const Btn=({children,onClick,variant="primary",small,icon,style:sx,disabled})=>{const st={primary:{background:C.rot,color:C.weiss,border:"none"},secondary:{background:C.weiss,color:C.dunkelgrau,border:`1px solid ${C.mittelgrau}`},ghost:{background:"transparent",color:C.dunkelgrau,border:"none"},blue:{background:C.mittelblau,color:C.weiss,border:"none"},success:{background:"#1a7a3a",color:C.weiss,border:"none"}};return(<button onClick={onClick} disabled={disabled} style={{padding:small?"5px 12px":"9px 18px",borderRadius:4,fontSize:small?12:13,fontWeight:600,cursor:disabled?"not-allowed":"pointer",fontFamily:FONT.sans,display:"inline-flex",alignItems:"center",gap:6,opacity:disabled?0.5:1,...st[variant],...sx}}>{icon&&<span>{icon}</span>}{children}</button>);};
const Gauge=({value})=>{const pct=Math.min(value/120*100,100);const c=pct<20?"#1a7a3a":pct<50?"#d4920a":C.rot;return(<div style={{margin:"8px 0"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}><span style={{fontSize:12,color:C.dunkelgrau,fontFamily:FONT.sans}}>Gesamtrisiko</span><span style={{fontSize:28,fontWeight:800,color:c,fontFamily:FONT.mono}}>{value.toFixed(1)}</span></div><div style={{height:6,background:C.hellgrau,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,#1a7a3a,${c})`,borderRadius:3,transition:"width 0.5s"}}/></div></div>);};
const Stat=({label,value,color=C.rot})=>(<div style={{textAlign:"center",padding:"12px 8px"}}><div style={{fontSize:10,color:C.dunkelgrau,textTransform:"uppercase",letterSpacing:1,marginBottom:4,fontFamily:FONT.sans}}>{label}</div><div style={{fontSize:22,fontWeight:800,color,fontFamily:FONT.mono}}>{value}</div></div>);

// ═══════════════════════════════════════════════════════════════════════════
// TOAST NOTIFICATION SYSTEM
// ═══════════════════════════════════════════════════════════════════════════
const TOAST_ICONS={success:"✅",error:"❌",warning:"⚠️",info:"ℹ️"};
const TOAST_COLORS={success:{bg:"#e8f5e9",border:"#2e7d32",text:"#1b5e20"},error:{bg:"#ffebee",border:"#c62828",text:"#b71c1c"},warning:{bg:"#fff3e0",border:"#e65100",text:"#bf360c"},info:{bg:"#e3f2fd",border:"#1565c0",text:"#0d47a1"}};
function ToastContainer({toasts,onDismiss}){
  if(!toasts.length)return null;
  return(<div style={{position:"fixed",top:60,right:16,zIndex:9999,display:"flex",flexDirection:"column",gap:8,maxWidth:400,minWidth:300}}>
    {toasts.map(t=>{const c=TOAST_COLORS[t.type]||TOAST_COLORS.info;return(
      <div key={t.id} style={{background:c.bg,border:`1px solid ${c.border}40`,borderLeft:`4px solid ${c.border}`,borderRadius:6,padding:"12px 16px",boxShadow:"0 4px 12px #0002",display:"flex",alignItems:"flex-start",gap:10,animation:"slideIn 0.3s ease",fontFamily:FONT.sans}}>
        <span style={{fontSize:16,flexShrink:0,marginTop:1}}>{TOAST_ICONS[t.type]}</span>
        <div style={{flex:1,fontSize:13,color:c.text,lineHeight:1.4}}>{t.message}</div>
        <button onClick={()=>onDismiss(t.id)} style={{background:"none",border:"none",cursor:"pointer",color:c.text,fontSize:16,padding:0,lineHeight:1,opacity:0.6}}>×</button>
      </div>
    );})}
    <style>{`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
  </div>);
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIRM DIALOG
// ═══════════════════════════════════════════════════════════════════════════
function ConfirmDialog({open,title,message,confirmLabel,cancelLabel,variant,onConfirm,onCancel}){
  if(!open)return null;
  const isDanger=variant==="danger";
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:10000,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT.sans}} onClick={onCancel}>
    <div onClick={e=>e.stopPropagation()} style={{background:C.weiss,borderRadius:10,padding:"24px 28px",maxWidth:420,width:"90%",boxShadow:"0 8px 32px #0003",borderTop:`3px solid ${isDanger?C.rot:C.mittelblau}`}}>
      <div style={{fontSize:16,fontWeight:700,color:C.schwarz,marginBottom:8}}>{title||"Bestätigung"}</div>
      <div style={{fontSize:13,color:C.dunkelgrau,lineHeight:1.5,marginBottom:20}}>{message}</div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
        <Btn variant="secondary" onClick={onCancel}>{cancelLabel||"Abbrechen"}</Btn>
        <Btn variant={isDanger?"primary":"success"} onClick={onConfirm}>{confirmLabel||"Bestätigen"}</Btn>
      </div>
    </div>
  </div>);
}
// 4-Augen-Prinzip: Planungsgrößen für Unterzeichner
function getSignAuthority(maxStellen) {
  if (maxStellen > 15) return { erstellt: "BL unterstützt KFDL und KBL", kontrolle: "KGF", stufe: 4 };
  if (maxStellen >= 15) return { erstellt: "BL unterstützt KFDL", kontrolle: "KBL", stufe: 3 };
  if (maxStellen >= 10) return { erstellt: "BL", kontrolle: "KFDL oder vergleichbare Person", stufe: 2 };
  if (maxStellen >= 5) return { erstellt: "BL", kontrolle: "stellv. BL oder vergleichbare Person", stufe: 1 };
  return { erstellt: "BL", kontrolle: "—", stufe: 0 };
}

function AddressAutocomplete({label,value,onChange,onResult}){
  const [suggestions,setSuggestions]=useState([]);
  const debounceRef=useRef(null);
  const search=async(q)=>{
    if(!q||q.length<4)return setSuggestions([]);
    try{
      const url=`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6&countrycodes=de&accept-language=de`;
      const resp=await fetch(url,{headers:{"Accept-Language":"de","User-Agent":"BRK-SanWD/6.0"}});
      const data=await resp.json();
      const mapped=await Promise.all(data.map(async r=>{
        const lat=parseFloat(r.lat),lng=parseFloat(r.lon);
        let w3w=null;
        try{const wr=await fetch(`/api/w3w?lat=${lat}&lng=${lng}`,{credentials:"include"});const wd=await wr.json();w3w=wd.w3w||null;}catch{}
        // Strukturierte Adresse mit Hausnummer aufbauen
        const addr = r.address || {};
        const road = addr.road || addr.pedestrian || addr.path || addr.footway || "";
        let hnr = addr.house_number || "";
        // Wenn Nominatim keine Hausnummer liefert, aus User-Input extrahieren
        if (!hnr && q) {
          const hnrMatch = q.match(/\b(\d+\s*[a-zA-Z]?)\b/);
          if (hnrMatch && road && q.toLowerCase().includes(road.toLowerCase().substring(0,5))) hnr = hnrMatch[1].trim();
        }
        const sub  = addr.suburb || addr.quarter || addr.neighbourhood || "";
        const city = addr.city || addr.town || addr.village || addr.hamlet || "";
        const plz  = addr.postcode || "";
        const parts = [];
        if (road && hnr) parts.push(road + " " + hnr);
        else if (road) parts.push(road);
        if (plz && city) parts.push(plz + " " + city);
        else if (city) parts.push(city);
        const addrStr = parts.length > 0 ? parts.join(", ") : r.display_name;
        return{address:addrStr,display:r.display_name,lat,lng,w3w,hnr,road,city,plz};
      }));
      setSuggestions(mapped);
    }catch{setSuggestions([]);}
  };
  const handleChange=(v)=>{onChange(v);clearTimeout(debounceRef.current);debounceRef.current=setTimeout(()=>search(v),600);};
  const selectAddr=async(s)=>{
    onChange(s.address);setSuggestions([]);
    if(s.hnr && s.road){
      // 1. Versuch: Nominatim strukturiert
      try{
        const params=new URLSearchParams({street:s.hnr+" "+s.road,format:"json",addressdetails:"1",limit:"1",countrycodes:"de","accept-language":"de"});
        if(s.city)params.set("city",s.city);
        if(s.plz)params.set("postalcode",s.plz);
        const rr=await fetch(`https://nominatim.openstreetmap.org/search?${params}`,{headers:{"User-Agent":"BRK-SanWD/6.0"}});
        const rd=await rr.json();
        if(rd[0] && rd[0].address && rd[0].address.house_number){
          const rlat=parseFloat(rd[0].lat),rlng=parseFloat(rd[0].lon);
          let rw3w=null;
          try{const wr=await fetch(`/api/w3w?lat=${rlat}&lng=${rlng}`,{credentials:"include"});const wd=await wr.json();rw3w=wd.w3w||null;}catch{}
          if(onResult)onResult({...s,lat:rlat,lng:rlng,w3w:rw3w||s.w3w,imprecise:false});
          return;
        }
      }catch{}
      // 2. Fallback: HERE Geocoding (praezise Hausnummer-Aufloesung)
      try{
        const hq=s.road+" "+s.hnr+(s.plz?" "+s.plz:"")+(s.city?" "+s.city:"");
        const hr=await fetch(`/api/geocode?q=${encodeURIComponent(hq)}`,{credentials:"include"});
        const hd=await hr.json();
        if(hd.lat && hd.houseNumber){
          let rw3w=null;
          try{const wr=await fetch(`/api/w3w?lat=${hd.lat}&lng=${hd.lng}`,{credentials:"include"});const wd=await wr.json();rw3w=wd.w3w||null;}catch{}
          if(onResult)onResult({...s,lat:hd.lat,lng:hd.lng,w3w:rw3w||s.w3w,imprecise:false});
          return;
        }
      }catch{}
      // Beide Geocoder gescheitert
      if(onResult)onResult({...s,imprecise:true});
      return;
    }
    if(onResult)onResult(s);
  };
  return(<label style={{display:"block",marginBottom:10}}><span style={{display:"block",fontSize:11,color:C.dunkelgrau,marginBottom:3,fontWeight:600,fontFamily:FONT.sans}}>{label}</span>
    <input type="text" value={value} onChange={e=>handleChange(e.target.value)} placeholder="Adresse eingeben..." style={{width:"100%",padding:"8px 10px",background:C.weiss,border:`1px solid ${C.mittelgrau}`,borderRadius:4,color:C.schwarz,fontSize:13,fontFamily:FONT.sans,outline:"none",boxSizing:"border-box"}} onFocus={e=>e.target.style.borderColor=C.mittelblau} onBlur={e=>{setTimeout(()=>setSuggestions([]),200);e.target.style.borderColor=C.mittelgrau}}/>
    {suggestions.length>0&&<div style={{background:C.weiss,border:`1px solid ${C.mittelgrau}`,borderRadius:4,marginTop:2,maxHeight:180,overflowY:"auto",boxShadow:"0 4px 12px #0002",position:"absolute",zIndex:999,minWidth:"100%"}}>{suggestions.map((s,i)=>(<div key={i} onClick={()=>selectAddr(s)} style={{padding:"8px 12px",cursor:"pointer",fontSize:12,borderBottom:`1px solid ${C.hellgrau}`,color:C.schwarz}} onMouseEnter={e=>e.currentTarget.style.background=C.hellblau} onMouseLeave={e=>e.currentTarget.style.background=C.weiss}>{s.address}{s.w3w&&<span style={{marginLeft:8,color:"#e60005",fontSize:10,fontWeight:600}}>{s.w3w}</span>}</div>))}</div>}
  </label>);
}

// ═══════════════════════════════════════════════════════════════════════════
// MINI MAP
// ═══════════════════════════════════════════════════════════════════════════
function LeafletMap({coords,w3w,onChange,onW3W}){
  const mapRef=useRef(null);const mapInst=useRef(null);const markerRef=useRef(null);
  const [search,setSearch]=useState("");
  useEffect(()=>{
    if(!mapRef.current||mapInst.current)return;
    const loadLeaflet=()=>{
      if(!document.querySelector('link[href*="leaflet"]')){
        const css=document.createElement("link");css.rel="stylesheet";css.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";document.head.appendChild(css);
      }
      if(!window.L){
        const s=document.createElement("script");s.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";s.onload=()=>initMap();document.head.appendChild(s);return;
      }
      initMap();
    };
    const initMap=()=>{
    const L=window.L;if(!L)return;
    const lat=coords?.lat||48.75;const lng=coords?.lng||11.4;
    const map=L.map(mapRef.current,{scrollWheelZoom:true}).setView([lat,lng],coords?.lat?15:10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OSM"}).addTo(map);
    if(coords?.lat){
      markerRef.current=L.marker([lat,lng],{draggable:true}).addTo(map);
      markerRef.current.on("dragend",async(e)=>{
        const p=e.target.getLatLng();
        onChange({lat:p.lat,lng:p.lng});
        try{const r=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${p.lat}&lon=${p.lng}&format=json&addressdetails=1&accept-language=de`,{headers:{"User-Agent":"BRK-SanWD/6.5"}});const d=await r.json();if(d.address){const a=buildAddrStr(d.address);onChange({lat:p.lat,lng:p.lng,address:a||d.display_name});}}catch{}
        try{const wr=await fetch(`/api/w3w?lat=${p.lat}&lng=${p.lng}`,{credentials:"include"});const wd=await wr.json();if(wd.w3w)onW3W(wd.w3w);}catch{}
      });
    }
    map.on("click",async(e)=>{
      const{lat:la,lng:ln}=e.latlng;
      if(markerRef.current)markerRef.current.setLatLng([la,ln]);
      else{markerRef.current=L.marker([la,ln],{draggable:true}).addTo(map);
        markerRef.current.on("dragend",async(ev)=>{
          const p=ev.target.getLatLng();onChange({lat:p.lat,lng:p.lng});
          try{const r=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${p.lat}&lon=${p.lng}&format=json&addressdetails=1&accept-language=de`,{headers:{"User-Agent":"BRK-SanWD/6.5"}});const d=await r.json();if(d.address){const a=buildAddrStr(d.address);onChange({lat:p.lat,lng:p.lng,address:a||d.display_name});}}catch{}
          try{const wr=await fetch(`/api/w3w?lat=${p.lat}&lng=${p.lng}`,{credentials:"include"});const wd=await wr.json();if(wd.w3w)onW3W(wd.w3w);}catch{}
        });
      }
      onChange({lat:la,lng:ln});
      try{const r=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${la}&lon=${ln}&format=json&addressdetails=1&accept-language=de`,{headers:{"User-Agent":"BRK-SanWD/6.5"}});const d=await r.json();if(d.address){const a=buildAddrStr(d.address);onChange({lat:la,lng:ln,address:a||d.display_name});}}catch{}
      try{const wr=await fetch(`/api/w3w?lat=${la}&lng=${ln}`,{credentials:"include"});const wd=await wr.json();if(wd.w3w)onW3W(wd.w3w);}catch{}
    });
    mapInst.current=map;
    };
    loadLeaflet();
    return()=>{if(mapInst.current){mapInst.current.remove();mapInst.current=null;}};
  },[]);
  useEffect(()=>{
    if(!mapInst.current||!coords?.lat)return;
    const L=window.L;if(!L)return;
    if(markerRef.current)markerRef.current.setLatLng([coords.lat,coords.lng]);
    else{markerRef.current=L.marker([coords.lat,coords.lng],{draggable:true}).addTo(mapInst.current);}
    mapInst.current.flyTo([coords.lat,coords.lng],15);
  },[coords?.lat,coords?.lng]);
  const flyToSearch=async()=>{
    if(!search||search.length<3)return;
    try{const r=await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=1&countrycodes=de&accept-language=de`,{headers:{"User-Agent":"BRK-SanWD/6.5"}});const d=await r.json();
      if(d[0]){const lat=parseFloat(d[0].lat),lng=parseFloat(d[0].lon);
        onChange({lat,lng,address:d[0].display_name});
        if(mapInst.current){mapInst.current.flyTo([lat,lng],15);const L=window.L;
          if(markerRef.current)markerRef.current.setLatLng([lat,lng]);
          else{markerRef.current=L.marker([lat,lng],{draggable:true}).addTo(mapInst.current);}
        }
        try{const wr=await fetch(`/api/w3w?lat=${lat}&lng=${lng}`,{credentials:"include"});const wd=await wr.json();if(wd.w3w)onW3W(wd.w3w);}catch{}
      }
    }catch{}
  };
  return(<div style={{borderRadius:6,overflow:"hidden",border:`1px solid ${C.mittelgrau}40`,marginTop:8}}>
    <div style={{display:"flex",gap:4,padding:"6px 8px",background:C.hellgrau}}>
      <input type="text" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&flyToSearch()} placeholder="Adresse suchen..." style={{flex:1,padding:"4px 8px",border:`1px solid ${C.mittelgrau}`,borderRadius:3,fontSize:11,fontFamily:FONT.sans}}/>
      <button onClick={flyToSearch} style={{padding:"4px 10px",background:C.mittelblau,color:"#fff",border:"none",borderRadius:3,fontSize:11,cursor:"pointer"}}>🔍</button>
    </div>
    <div ref={mapRef} style={{height:280,width:"100%"}}/>
    <div style={{padding:"6px 10px",background:C.hellgrau,display:"flex",gap:12,fontSize:11,flexWrap:"wrap"}}>
      {coords?.lat&&<span style={{color:C.mittelblau}}>📍 {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span>}
      {w3w&&<span style={{color:C.rot,fontWeight:600}}>{w3w}</span>}
      {!coords?.lat&&<span style={{color:C.bgrau,fontStyle:"italic"}}>Klick auf Karte setzt Pin · Pin verschiebbar</span>}
    </div>
  </div>);
}

// ═══════════════════════════════════════════════════════════════════════════
// CHECKLIST COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
function VorgangChecklist({checklist={},onChange,eventDate}){
  const toggle=(key)=>{if((key==="angebotVersendet"||key==="abgeschlossen")&&checklist[key])return;const now=Date.now();const cur=checklist[key];onChange({...checklist,[key]:cur?null:now});};
  // Wiedervorlage: 4 Wochen nach Event
  const wvDate=eventDate?new Date(new Date(eventDate).getTime()+28*24*60*60*1000):null;
  const wvPast=wvDate&&new Date()>=wvDate;
  const allDone=CHECKLIST_ITEMS.every(i=>checklist[i.key]);
  return(<div>
    {CHECKLIST_ITEMS.map(item=>{const done=!!checklist[item.key];return(<div key={item.key} onClick={()=>toggle(item.key)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",marginBottom:4,background:done?`${C.rot}08`:C.weiss,borderRadius:6,cursor:"pointer",border:`1px solid ${done?C.rot+"30":C.mittelgrau+"40"}`,transition:"all 0.2s"}}>
      <div style={{width:22,height:22,borderRadius:4,border:`2px solid ${done?"#1a7a3a":C.mittelgrau}`,background:done?"#1a7a3a":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{done&&<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}</div>
      <span style={{fontSize:14}}>{item.icon}</span>
      <div style={{flex:1}}><div style={{fontSize:13,fontWeight:done?600:400,color:done?"#1a7a3a":C.dunkelgrau,textDecoration:done?"line-through":"none"}}>{item.label}</div>
        {done&&<div style={{fontSize:10,color:C.bgrau}}>Erledigt: {fTS(checklist[item.key])}</div>}
        {item.key==="abgeschlossen"&&!done&&wvDate&&<div style={{fontSize:10,color:wvPast?C.rot:"#d4920a",fontWeight:wvPast?700:400}}>Wiedervorlage: {fDate(wvDate.toISOString().split("T")[0])}{wvPast?" ⚠️ Fällig!":""}</div>}
      </div>
    </div>);})}
    {allDone&&<div style={{textAlign:"center",padding:"10px",background:"#d4edda",borderRadius:6,marginTop:8,fontSize:13,color:"#155724",fontWeight:600}}>✅ Vorgang vollständig abgeschlossen</div>}
  </div>);
}

// ═══════════════════════════════════════════════════════════════════════════
// ILS PREVIEW (with w3w in Sonstiges)
// ═══════════════════════════════════════════════════════════════════════════
function ILSPreview({event,days,stammdaten,user,updateEvent,currentEventId,saveEvent,toast}){
  const bereitschaft=BEREITSCHAFTEN[stammdaten.bereitschaftIdx];
  const activeDays=days.filter(d=>d.active);
  const firstDay=activeDays[0]||{};
  const lastDay=activeDays[activeDays.length-1]||firstDay;
  const fields=[
    {section:"Absendende Person",items:[{label:"Organisation",value:`BRK ${bereitschaft.name}`},{label:"Name",value:user?.name||stammdaten.bereitschaftsleiter},{label:"Funktion",value:stammdaten.bereitschaftsleiterTitle||"Bereitschaftsleiter"},{label:"Rückrufnummer",value:stammdaten.mobil}]},
    {section:"Örtlichkeit",items:[{label:"Straße",value:event.adresse||""},{label:"Objekt",value:event.ort||""},{label:"PLZ / Ort",value:event.rePlzOrt||event.ort||""}]},
    {section:"Allgemeine Informationen",items:[{label:"Name Veranstaltung",value:event.name||""}]},
  ];
  const sonstigeDefault=event.w3w?`what3words: ${event.w3w}`:"";
  const ilsInp={width:"100%",border:"none",background:"transparent",padding:"6px 10px",fontSize:12,fontFamily:FONT.sans,color:C.schwarz,outline:"none",boxSizing:"border-box"};
  return(<div>
    <div style={{padding:"14px 18px",background:C.hellblau,borderRadius:6,marginBottom:14,border:`1px solid ${C.mittelblau}33`}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><span style={{fontSize:20}}>📄</span><div style={{fontSize:14,fontWeight:700,color:C.dunkelblau}}>ILS-Anmeldung Sanitätsdienst</div></div>
      <div style={{padding:"10px 14px",background:C.weiss,borderRadius:6,border:`1px solid ${C.mittelblau}44`}}>
        <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:C.schwarz,marginBottom:4}}>✉️ Weiterleiten an: <strong style={{color:C.dunkelblau}}>anmeldung@ils-ingolstadt.de</strong> · Fax: <strong>0841/14254-160</strong></div>
        <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#c62828",fontWeight:600}}>⏰ Mindestens 1 Stunde vor Dienstbeginn einreichen</div>
      </div>
    </div>
    <div style={{fontSize:13,fontWeight:700,color:C.dunkelblau,marginBottom:10}}>Automatisch befüllte Felder:</div>
    {fields.map((sec,si)=>(<div key={si} style={{marginBottom:12}}><div style={{fontSize:11,fontWeight:700,color:C.rot,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>{sec.section}</div><div style={{background:C.weiss,borderRadius:4,border:`1px solid ${C.mittelgrau}40`,overflow:"hidden"}}>{sec.items.map((item,ii)=>(<div key={ii} style={{display:"flex",borderBottom:ii<sec.items.length-1?`1px solid ${C.hellgrau}`:"none"}}><div style={{width:140,padding:"6px 10px",fontSize:11,color:C.dunkelgrau,background:C.hellgrau,fontWeight:600,flexShrink:0}}>{item.label}</div><div style={{flex:1,padding:"6px 10px",fontSize:12,color:item.value?C.schwarz:C.bgrau}}>{item.value||"n/a"}</div></div>))}</div></div>))}
    <div style={{padding:"10px 14px",background:"#fff3cd",borderRadius:6,border:"1px solid #ffc10744",fontSize:12,color:"#856404",marginTop:14}}><strong>Händisch auszufüllende Felder</strong> <span style={{fontSize:10,color:"#856404",fontStyle:"italic"}}>(werden vor Versand durch den Ersteller ergänzt)</span></div>
    {[{section:"Einsatzleitung / Kontakt vor Ort",items:[
      {label:"EL / Kontaktperson vor Ort",key:"ilsEL",hint:"Name der Einsatzleitung bzw. verantwortliche Person vor Ort"},
      {label:"Erreichbarkeit Telefon",key:"ilsTelefon",hint:"Mobilnummer der EL vor Ort"},
      {label:"Erreichbarkeit Funkgruppe",key:"ilsFunk",hint:"z.B. 2m-Band Kanal, TMO-Gruppe"},
      {label:"Abkömmlich",key:"ilsAbkoemmlich",hint:"JA / NEIN — ob Fahrzeuge für Einsätze abkömmlich sind"},
    ]},{section:"Eingesetzte Fahrzeuge (Funkrufnamen)",items:[
      {label:"Fahrzeug 1 + Status",key:"ilsFzg1",hint:"z.B. Rotkreuz SOB 71/1 — Status 1 / Status 6"},
      {label:"Fahrzeug 2 + Status",key:"ilsFzg2",hint:"z.B. Rotkreuz SOB 71/2"},
      {label:"Fahrzeug 3 + Status",key:"ilsFzg3",hint:"weitere Fahrzeuge nach Bedarf"},
    ]},{section:"Sonstige Hinweise",items:[
      {label:"Sonstige Hinweise",key:"ilsSonstige",hint:"Besonderheiten, Zufahrtswege, what3words-Adresse etc."},
    ]}].map((sec,si)=>(<div key={si} style={{marginTop:8}}><div style={{fontSize:11,fontWeight:700,color:"#856404",textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>{sec.section}</div><div style={{background:C.weiss,borderRadius:4,border:`1px solid #ffc10740`,overflow:"hidden"}}>{sec.items.map((item,ii)=>(<div key={ii} style={{display:"flex",alignItems:"center",borderBottom:ii<sec.items.length-1?`1px solid ${C.hellgrau}`:"none"}}><div style={{width:180,padding:"6px 10px",fontSize:11,color:"#856404",background:"#fffbf0",fontWeight:600,flexShrink:0}}>{item.label}</div><div style={{flex:1}}><input style={ilsInp} placeholder={item.hint} value={item.key==="ilsSonstige"?(event.ilsSonstige||sonstigeDefault):(event[item.key]||"")} onChange={e=>updateEvent(item.key,e.target.value)}/></div></div>))}</div></div>))}
    <div style={{marginTop:14,display:"flex",flexWrap:"wrap",gap:8}}>
      {days.filter(d=>d.active).map((d,i)=>(
        <Btn key={i} small variant="primary" onClick={async()=>{
          if(!currentEventId){toast("Bitte zuerst Vorgang speichern","warning");return;}
          try{
            await saveEvent();
            const blob=await API.getILSPDF(currentEventId,i);
            const url=URL.createObjectURL(blob);
            const a=document.createElement("a");
            a.href=url;
            const nr=(event.auftragsnr||"ILS").replace(/[^a-zA-Z0-9_-]/g,"_");
            a.download=nr+"_ILS-Anmeldung_Tag"+(i+1)+".pdf";
            a.click();
          }catch(e){toast(e.message,"error");}
        }}>
          ILS-Anmeldung Tag {i+1}{d.date?" ("+new Date(d.date).toLocaleDateString("de-DE")+")":""}
        </Btn>
      ))}
    </div>
  </div>);
}


// ═══════════════════════════════════════════════════════════════════════════
// LOCK BANNER (v6.1: Concurrent Editing)
// ═══════════════════════════════════════════════════════════════════════════
function LockBanner({lockInfo,onUnlock,isOwner}){
  if(!lockInfo||!lockInfo.locked||lockInfo.isOwner)return null;
  return(<div style={{padding:"10px 16px",background:isOwner?"#e8f5e9":"#fff3cd",border:`1px solid ${isOwner?"#a5d6a7":"#ffc107"}`,borderRadius:6,marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <span style={{fontSize:18}}>{isOwner?"✏️":"🔒"}</span>
      <div><div style={{fontSize:13,fontWeight:600,color:isOwner?"#2e7d32":"#856404"}}>{isOwner?"Du bearbeitest diesen Vorgang":"Gesperrt von "+lockInfo.lockedBy}</div>
        <div style={{fontSize:10,color:"#666"}}>Seit {new Date(lockInfo.lockedAt).toLocaleTimeString("de-DE")}</div>
      </div>
    </div>
    {isOwner&&<button onClick={onUnlock} style={{padding:"4px 12px",background:"transparent",border:"1px solid #a5d6a7",borderRadius:4,fontSize:11,cursor:"pointer",color:"#2e7d32"}}>Sperre aufheben</button>}
  </div>);
}
function StatusBanner({angebotVersendet,abgeschlossen,onUnlock}){
  const [showModal,setShowModal]=React.useState(false);
  const [begruendung,setBegruendung]=React.useState("");
  const [err,setErr]=React.useState("");
  const [loading,setLoading]=React.useState(false);
  if(!angebotVersendet && !abgeschlossen)return null;
  const doEntsperre=async()=>{
    if(begruendung.trim().length<5){setErr("Bitte mind. 5 Zeichen eingeben");return;}
    setLoading(true);setErr("");
    try{await onUnlock(begruendung.trim());setShowModal(false);setBegruendung("");}
    catch(e){setErr(e.message||"Fehler");}
    finally{setLoading(false);}
  };
  return(<>
    <div style={{padding:"10px 16px",background:"#e8f5e9",border:"1px solid #a5d6a7",borderRadius:6,marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:18}}>{abgeschlossen?"✅":"📨"}</span>
        <div><div style={{fontSize:13,fontWeight:600,color:abgeschlossen?"#1a237e":"#2e7d32"}}>{abgeschlossen?"Vorgang abgeschlossen – dauerhaft gesperrt":"Angebot versendet – Vorgang ist schreibgeschützt"}</div>
          <div style={{fontSize:10,color:"#666"}}>Zum Bearbeiten entsperren (Begründung erforderlich)</div>
        </div>
      </div>
      <button onClick={()=>setShowModal(true)} style={{padding:"5px 14px",background:"#e53935",color:"#fff",border:"none",borderRadius:4,fontSize:12,fontWeight:600,cursor:"pointer"}}>🔓 Entsperren</button>
    </div>
    {showModal&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"#fff",borderRadius:8,padding:24,maxWidth:420,width:"90%",boxShadow:"0 8px 32px rgba(0,0,0,0.2)"}}>
        <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>🔓 Angebot entsperren</div>
        <div style={{fontSize:12,color:"#666",marginBottom:16}}>Bitte begründe warum das Angebot entsperrt wird. Die Begründung wird im Audit-Log gespeichert.</div>
        <textarea value={begruendung} onChange={e=>setBegruendung(e.target.value)} placeholder="z.B. Korrektur der Personenzahl nach Rücksprache mit Veranstalter..." rows={4} style={{width:"100%",padding:"8px 10px",border:"1px solid #ccc",borderRadius:4,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",resize:"vertical"}}/>
        {err&&<div style={{color:"#e53935",fontSize:11,marginTop:4}}>{err}</div>}
        <div style={{display:"flex",gap:8,marginTop:12,justifyContent:"flex-end"}}>
          <button onClick={()=>{setShowModal(false);setBegruendung("");setErr("");}} style={{padding:"7px 16px",background:"#f5f5f5",border:"1px solid #ccc",borderRadius:4,fontSize:13,cursor:"pointer"}}>Abbrechen</button>
          <button onClick={doEntsperre} disabled={loading} style={{padding:"7px 16px",background:"#e53935",color:"#fff",border:"none",borderRadius:4,fontSize:13,fontWeight:600,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1}}>{loading?"Bitte warten...":"Entsperren"}</button>
        </div>
      </div>
    </div>}
  </>);
}

// ═══════════════════════════════════════════════════════════════════════════
// EDIT HISTORY WIDGET (v6.1 #5-6)
// ═══════════════════════════════════════════════════════════════════════════
function HistoryWidget({history}){
  if(!history||history.length===0)return null;
  const iconMap={create:"🆕",update:"✏️",edit:"✏️",checklist:"☑️",status:"📊",status_versendet:"📤",status_entsperrt:"🔓",lock:"🔒",unlock:"🔓",entsperrt:"🔓",gesperrt:"🔒",save:"💾",delete:"🗑️"};
  return(<Card title="Änderungsverlauf" accent="#78909c" sub={`${history.length} Einträge`}>
    <div style={{maxHeight:300,overflowY:"auto"}}>
      {history.map((h,i)=>(<div key={i} style={{display:"flex",gap:10,padding:"6px 0",borderBottom:i<history.length-1?`1px solid ${C.hellgrau}`:"none",fontSize:12}}>
        <span style={{fontSize:14,flexShrink:0}}>{iconMap[h.action]||"📝"}</span>
        <div style={{flex:1}}>
          <div style={{fontWeight:600,color:C.schwarz}}>{h.description||h.action}</div>
          {h.details&&<div style={{fontSize:10,color:C.bgrau,marginTop:2,whiteSpace:"pre-wrap"}}>{typeof h.details==="string"?h.details:JSON.stringify(h.details,null,2)}</div>}
          <div style={{fontSize:10,color:C.bgrau,marginTop:2}}>{h.user||h.user_name||"System"} · {fTS(h.time||h.timestamp)}</div>
        </div>
      </div>))}
    </div>
  </Card>);
}

// ═══════════════════════════════════════════════════════════════════════════
// KUNDEN MANAGER TAB (v6.5 #4-6)
// ═══════════════════════════════════════════════════════════════════════════
function KundenManager({kunden,setKunden,user,toast,showConfirm}){
  const [edit,setEdit]=useState(null);
  const [csvMsg,setCsvMsg]=useState("");
  const [search,setSearch]=useState("");
  const empty={name:"",kundennummer:"",ansprechpartner:"",telefon:"",email:"",rechnungsempfaenger:"",reStrasse:"",rePlzOrt:"",anrede:"Sehr geehrte Damen und Herren,",bemerkung:""};
  const filtered=kunden.filter(k=>{const s=search.toLowerCase();return !s||k.name?.toLowerCase().includes(s)||k.kundennummer?.toLowerCase().includes(s)||k.ansprechpartner?.toLowerCase().includes(s);});
  const save=async()=>{if(!edit?.name)return;try{await API.saveKunde(edit);const k=await API.getKunden();setKunden(k);setEdit(null);}catch(e){toast(e.message,"error");}};
  const del=async(name)=>{if(!await showConfirm({title:"Kunde löschen",message:`"${name}" wirklich löschen?`,confirmLabel:"Löschen",variant:"danger"}))return;try{await API.deleteKunde(name);const k=await API.getKunden();setKunden(k);}catch(e){toast(e.message,"error");}};
  const handleCSV=async(e)=>{
    const file=e.target.files[0];if(!file)return;setCsvMsg("Importiere...");
    const text=await file.text();const lines=text.split("\n").filter(l=>l.trim());
    if(lines.length<2){setCsvMsg("Keine Daten gefunden");return;}
    const headers=lines[0].split(";").map(h=>h.trim().replace(/"/g,""));
    const nameIdx=headers.findIndex(h=>/firma|name|organisation|company/i.test(h));
    const apIdx=headers.findIndex(h=>/ansprech|kontakt|contact/i.test(h));
    const telIdx=headers.findIndex(h=>/telefon|tel|phone/i.test(h));
    const mailIdx=headers.findIndex(h=>/mail|email/i.test(h));
    const strIdx=headers.findIndex(h=>/stra(ss|ß)e|street|adress/i.test(h));
    const plzIdx=headers.findIndex(h=>/plz|ort|city|postleitzahl/i.test(h));
    const nrIdx=headers.findIndex(h=>/nummer|nr|number|kunden/i.test(h));
    if(nameIdx<0){setCsvMsg("Spalte 'Firma/Name' nicht gefunden");return;}
    let count=0;
    for(let i=1;i<lines.length;i++){
      const cols=lines[i].split(";").map(c=>c.trim().replace(/^"|"$/g,""));
      const name=cols[nameIdx];if(!name)continue;
      const kunde={name,kundennummer:nrIdx>=0?cols[nrIdx]||"":"",ansprechpartner:apIdx>=0?cols[apIdx]||"":"",telefon:telIdx>=0?cols[telIdx]||"":"",email:mailIdx>=0?cols[mailIdx]||"":"",rechnungsempfaenger:name,reStrasse:strIdx>=0?cols[strIdx]||"":"",rePlzOrt:plzIdx>=0?cols[plzIdx]||"":"",anrede:"Sehr geehrte Damen und Herren,",bemerkung:""};
      try{await API.saveKunde(kunde);count++;}catch{}
    }
    const k=await API.getKunden();setKunden(k);
    setCsvMsg(`${count} Kunden importiert`);setTimeout(()=>setCsvMsg(""),5000);
  };
  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <div><h2 style={{margin:0,fontSize:18,fontWeight:700}}>👥 Kundenverwaltung</h2><p style={{margin:"2px 0 0",fontSize:12,color:C.dunkelgrau}}>{kunden.length} Kunden</p></div>
      <div style={{display:"flex",gap:6}}>
        <Btn small variant="secondary" onClick={()=>{const el=document.createElement("input");el.type="file";el.accept=".csv";el.onchange=handleCSV;el.click();}}>📥 CSV Import</Btn>
        <Btn onClick={()=>setEdit({...empty})} icon="➕">Neuer Kunde</Btn>
      </div>
    </div>
    {csvMsg&&<div style={{padding:"8px 14px",background:"#e8f5e9",borderRadius:6,marginBottom:10,fontSize:12,color:"#2e7d32"}}>{csvMsg}</div>}
    <div style={{marginBottom:10}}><input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Kunden suchen..." style={{width:"100%",padding:"8px 12px",border:`1px solid ${C.mittelgrau}`,borderRadius:4,fontSize:13,fontFamily:FONT.sans,boxSizing:"border-box"}}/></div>
    {edit&&<Card title={edit.name?"Kunde bearbeiten":"Neuer Kunde"} accent="#1a7a3a">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
        <Inp label="Firma / Name *" value={edit.name} onChange={v=>setEdit(p=>({...p,name:v}))}/>
        <Inp label="Kundennummer" value={edit.kundennummer||""} onChange={v=>setEdit(p=>({...p,kundennummer:v}))}/>
        <Inp label="Ansprechpartner" value={edit.ansprechpartner} onChange={v=>setEdit(p=>({...p,ansprechpartner:v}))}/>
        <Inp label="Telefon" value={edit.telefon} onChange={v=>setEdit(p=>({...p,telefon:v}))}/>
        <Inp label="E-Mail" value={edit.email} onChange={v=>setEdit(p=>({...p,email:v}))}/>
        <Inp label="Anrede" value={edit.anrede} onChange={v=>setEdit(p=>({...p,anrede:v}))}/>
        <Inp label="Rechnungsempfänger" value={edit.rechnungsempfaenger} onChange={v=>setEdit(p=>({...p,rechnungsempfaenger:v}))}/>
        <Inp label="Straße" value={edit.reStrasse} onChange={v=>setEdit(p=>({...p,reStrasse:v}))}/>
        <Inp label="PLZ / Ort" value={edit.rePlzOrt} onChange={v=>setEdit(p=>({...p,rePlzOrt:v}))}/>
      </div>
      <div style={{marginTop:6}}><label style={{display:"block",fontSize:11,color:C.dunkelgrau,marginBottom:3,fontWeight:600}}>Bemerkung</label>
        <textarea value={edit.bemerkung||""} onChange={e=>setEdit(p=>({...p,bemerkung:e.target.value}))} rows={2} style={{width:"100%",padding:"6px 10px",border:`1px solid ${C.mittelgrau}`,borderRadius:4,fontSize:12,fontFamily:FONT.sans,resize:"vertical",boxSizing:"border-box"}}/>
      </div>
      <div style={{display:"flex",gap:6,marginTop:10}}><Btn variant="success" onClick={save}>💾 Speichern</Btn><Btn variant="secondary" onClick={()=>setEdit(null)}>Abbrechen</Btn></div>
    </Card>}
    {filtered.map((k,i)=>(<Card key={i}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{cursor:"pointer",flex:1}} onClick={()=>setEdit({...k})}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:14,fontWeight:700}}>{k.name}</span>
            {k.kundennummer&&<span style={{fontSize:10,color:C.rot,fontWeight:600,background:`${C.rot}11`,padding:"1px 6px",borderRadius:8}}>#{k.kundennummer}</span>}
          </div>
          <div style={{fontSize:12,color:C.dunkelgrau,marginTop:2}}>
            {k.ansprechpartner&&<span style={{marginRight:10}}>👤 {k.ansprechpartner}</span>}
            {k.telefon&&<span style={{marginRight:10}}>📞 {k.telefon}</span>}
            {k.email&&<span>✉️ {k.email}</span>}
          </div>
          {k.bemerkung&&<div style={{fontSize:11,color:C.bgrau,marginTop:3,fontStyle:"italic"}}>{k.bemerkung}</div>}
        </div>
        <div style={{display:"flex",gap:4}}>
          <Btn small variant="secondary" onClick={()=>setEdit({...k})}>✏️</Btn>
          <Btn small variant="ghost" onClick={()=>del(k.name)} style={{color:C.rot}}>✕</Btn>
        </div>
      </div>
    </Card>))}
    {filtered.length===0&&!edit&&<Card><div style={{textAlign:"center",padding:30,color:C.dunkelgrau}}><div style={{fontSize:32,marginBottom:8}}>👥</div>Keine Kunden gefunden</div></Card>}
  </div>);
}

// ═══════════════════════════════════════════════════════════════════════════
// GEFAHRENANALYSE PDF
// ═══════════════════════════════════════════════════════════════════════════
function GefahrenPDF({day,calc,eventData,stammdaten,dayNum}){
  const r=calc.risk,b=BEREITSCHAFTEN[stammdaten.bereitschaftIdx],ev=EVENT_TYPES.find(e=>e.id===day.eventTypeId);
  return(<div className="pdf-page" style={{fontFamily:"Arial,sans-serif",fontSize:"10pt",color:"#000",background:"#fff",padding:"15mm 12mm",lineHeight:1.35,pageBreakAfter:"always"}}>
    <div style={{display:"flex",justifyContent:"space-between",borderBottom:`2pt solid ${C.rot}`,paddingBottom:8,marginBottom:12}}><div>{stammdaten.customLogo&&<img src={stammdaten.customLogo} alt="Logo" style={{height:28,width:"auto",marginBottom:4,display:"block"}}/>}<div style={{fontSize:"8pt",color:"#666"}}>{stammdaten.kvName}</div><div style={{fontSize:"13pt",fontWeight:"bold"}}>Gefahrenanalyse {dayNum}. Tag</div></div><div style={{textAlign:"right",fontSize:"9pt",fontWeight:"bold",color:C.rot}}>Sanitätswachdienst</div></div>
    <table style={{width:"100%",marginBottom:10,borderCollapse:"collapse"}}><tbody><tr><td style={{fontWeight:"bold"}}>{eventData.name}</td><td style={{textAlign:"right"}}>{fDate(day.date)} {day.startTime}—{day.endTime}</td></tr><tr><td colSpan={2} style={{textAlign:"right",fontSize:"9pt",color:"#666"}}>Einsatzdauer: <strong>{calc.h.toFixed(2).replace('.',',')} Std.</strong></td></tr></tbody></table>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:"9pt",marginBottom:14}}><thead><tr style={{background:"#eee",fontWeight:"bold"}}><th style={{border:"1px solid #999",padding:"4px 6px",textAlign:"left",width:30}}>Nr.</th><th style={{border:"1px solid #999",padding:"4px 6px",textAlign:"left"}}>Kriterium</th><th style={{border:"1px solid #999",padding:"4px 6px",textAlign:"right",width:80}}>Wert</th><th style={{border:"1px solid #999",padding:"4px 6px",textAlign:"right",width:60}}>Punkte</th></tr></thead>
      <tbody>{[["1a","Max. Besucher (Auflagen)",day.auflagen||"n/a",r.ap],["","Geschlossen: "+(day.geschlossen?"JA":"NEIN"),"",""],["1b",`Fläche: ${day.flaeche||0} m²`,day.flaeche||"n/a",r.fp],["2a","Erwartete Besucher",day.besucher||"n/a",r.bp],["","Zwischensumme","",r.zw],["3",`Faktor: ${ev?.name||""}`,`×${r.factor}`,""],["4","Risiko ohne Prom./Pol.","",f2(r.ro)],["","Prominente: "+(day.prominente||0),"","+"+r.pp],["","Polizei: "+(day.polizeiRisiko?"JA":"NEIN"),"","+"+r.pol],["5","GESAMTRISIKO","",""]].map((row,i)=>(<tr key={i} style={{background:row[0]==="5"?"#ffeaea":i%2===0?"#fff":"#f8f8f8",fontWeight:row[0]==="5"||row[1].startsWith("Zwischen")?"bold":"normal"}}><td style={{border:"1px solid #ccc",padding:"3px 6px",color:"#666"}}>{row[0]}</td><td style={{border:"1px solid #ccc",padding:"3px 6px"}}>{row[1]}</td><td style={{border:"1px solid #ccc",padding:"3px 6px",textAlign:"right"}}>{row[2]}</td><td style={{border:"1px solid #ccc",padding:"3px 6px",textAlign:"right",color:row[0]==="5"?C.rot:undefined,fontWeight:row[0]==="5"?"bold":undefined}}>{row[0]==="5"?f2(r.total):row[3]}</td></tr>))}</tbody></table>
    <div style={{marginTop:14,fontWeight:"bold",fontSize:"11pt",marginBottom:6}}>Ergebnis der Berechnung:</div>
    <div style={{marginBottom:4}}>Das <span style={{color:C.rot,fontWeight:"bold"}}>Gesamtrisiko</span> beträgt: <strong>{f2(r.total)} Punkte</strong></div>
    <div style={{marginBottom:6}}>Zur Sicherung des Sanitätswachdienstes werden empfohlen:</div>
    <div style={{paddingLeft:16,marginBottom:8,fontSize:"9.5pt",lineHeight:1.7}}>
      {calc.rec.helfer>0&&<div>• {calc.rec.helfer} Helfer</div>}
      {calc.rec.ktw>0&&<div>• {calc.rec.ktw} Krankentransportwagen (KTW)</div>}
      {calc.rec.rtw>0&&<div>• {calc.rec.rtw} Rettungswagen (RTW)</div>}
      {calc.rec.nef>0&&<div>• {calc.rec.nef} Notarzt</div>}
      {calc.rec.gktw>0&&<div>• {calc.rec.gktw} Großraum-KTW (GKTW)</div>}
      <div>• Einsatzleitung: {calc.rec.el==="im Team"?"keine stabsmäßige Einsatzleitung":calc.rec.el}</div>
    </div>
    <div style={{fontSize:"9pt",color:"#c00",marginBottom:10}}>Fahrzeugbesatzungen gelten grundsätzlich <strong>zuzüglich</strong> zum angegebenen Personalbedarf!</div>
    <div style={{marginTop:10,fontSize:"7.5pt",color:"#666",lineHeight:1.4}}>Diese Berechnung basiert auf dem "Maurer-Algorithmus" (nach Dipl.Ing. Klaus Maurer, Stand 2010).<br/>Die hier angegebenen Richtwerte haben lediglich empfehlenden Charakter und müssen an die örtlichen Verhältnisse unter Berücksichtigung der Erfahrungswerte früherer, vergleichbarer Veranstaltungen angepasst werden.</div>
    <div style={{marginTop:16,fontSize:"7pt",color:"#999",borderTop:"1px solid #ccc",paddingTop:6}}>{b.name} · BRK {stammdaten.kvName}</div>
  </div>);
}

// ═══════════════════════════════════════════════════════════════════════════
// ANGEBOT PDF

// ═══════════════════════════════════════════════════════════════════════════
// SIGNATURE PAD
// ═══════════════════════════════════════════════════════════════════════════
function SignaturePad({value,onChange}){
  const canvasRef=useRef(null);
  const drawing=useRef(false);
  const [hasSignature,setHasSignature]=useState(!!value);
  useEffect(()=>{
    if(value&&canvasRef.current){
      const img=new Image();img.onload=()=>{if(!canvasRef.current)return;const canvas=canvasRef.current;const ctx=canvas.getContext("2d");ctx.clearRect(0,0,canvas.width,canvas.height);const scale=Math.min(canvas.width/img.width,canvas.height/img.height);const w=img.width*scale;const h=img.height*scale;const x=(canvas.width-w)/2;const y=(canvas.height-h)/2;ctx.drawImage(img,x,y,w,h);};img.src=value;
      setHasSignature(true);
    } else if(!value&&canvasRef.current){
      const ctx=canvasRef.current.getContext("2d");ctx.clearRect(0,0,300,100);
      setHasSignature(false);
    }
  },[value]);
  const getPos=(e,canvas)=>{const r=canvas.getBoundingClientRect();const src=e.touches?e.touches[0]:e;return{x:(src.clientX-r.left)*(canvas.width/r.width),y:(src.clientY-r.top)*(canvas.height/r.height)};};
  const startDraw=(e)=>{e.preventDefault();drawing.current=true;const canvas=canvasRef.current;const ctx=canvas.getContext("2d");const p=getPos(e,canvas);ctx.beginPath();ctx.moveTo(p.x,p.y);};
  const draw=(e)=>{e.preventDefault();if(!drawing.current)return;const canvas=canvasRef.current;const ctx=canvas.getContext("2d");ctx.strokeStyle="#000";ctx.lineWidth=2;ctx.lineCap="round";const p=getPos(e,canvas);ctx.lineTo(p.x,p.y);ctx.stroke();setHasSignature(true);};
  const endDraw=(e)=>{if(!drawing.current)return;drawing.current=false;const data=canvasRef.current.toDataURL("image/png");onChange(data);};
  const clear=()=>{const ctx=canvasRef.current.getContext("2d");ctx.clearRect(0,0,300,100);onChange(null);setHasSignature(false);};
  return(<div>
    <canvas ref={canvasRef} width={300} height={100}
      style={{border:"1px solid #ccc",borderRadius:4,cursor:"crosshair",background:"#fafafa",display:"block",touchAction:"none"}}
      onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
      onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}/>
    <div style={{display:"flex",gap:8,marginTop:4}}>
      <button onClick={clear} style={{fontSize:11,padding:"2px 10px",background:"transparent",border:"1px solid #ccc",borderRadius:3,cursor:"pointer"}}>✕ Löschen</button>
      {hasSignature&&<span style={{fontSize:11,color:"#2e7d32"}}>✓ Unterschrift vorhanden</span>}
    </div>
  </div>);
}

function AngebotPDF({event,dayCalcs,totalCosts,stammdaten,activeDays,bereitschaft,user}){
  const unterzeichner=user?.name||stammdaten.bereitschaftsleiter;
  const unterTelefon=user?.telefon||stammdaten.telefon;
  const unterMobil=user?.mobil||stammdaten.mobil;
  const unterEmail=user?.email||stammdaten.email;
  const unterTitel=user?.titel||stammdaten.bereitschaftsleiterTitle||"Bereitschaftsleiter";
  const unterZeichen=(user?.name||stammdaten.bereitschaftsleiter||"").split(" ").map(w=>w[0]).join("")||"BL";
  const isPauschal=event.pauschalangebot&&event.pauschalangebot>0;
  const endPreis=isPauschal?parseFloat(event.pauschalangebot):totalCosts;
  const tKtw=dayCalcs.reduce((s,d)=>s+d.kc,0);
  const tRtw=dayCalcs.reduce((s,d)=>s+d.rc,0);
  const tAerzt=dayCalcs.reduce((s,d)=>s+(d.ac||0),0);
  const tGktw=dayCalcs.reduce((s,d)=>s+d.gc,0);
  const tElKfz=dayCalcs.reduce((s,d)=>s+d.ec,0);
  const tSeg=dayCalcs.reduce((s,d)=>s+d.sc,0);
  const tMtw=dayCalcs.reduce((s,d)=>s+d.mc,0);
  const tHrs=dayCalcs.reduce((s,d)=>s+d.h,0);
  const tTP=dayCalcs.reduce((s,d)=>s+d.tp,0);
  const tHelferPers=dayCalcs.reduce((s,d)=>s+d.hc,0);
  const tHelferGes=tHelferPers+(dayCalcs.some(d=>d.el!=="im Team")?1:0);
  const rates=stammdaten.rates||{};
  const euro=(v)=>{if(!v&&v!==0)return"";return new Intl.NumberFormat("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2}).format(v)+" €";};
  const num=(v)=>(v!==null&&v!==undefined&&v>0)?String(v):"";
  const fDate2=(d)=>d?new Date(d).toLocaleDateString("de-DE"):"";
  const ortName=user?.ort||bereitschaft.name.replace(/^Bereitschaft\s*/i,"").trim()||"Schrobenhausen";
  const fzRows=[
    tKtw>0&&{pos:"KTW",anz:tKtw,pers:dayCalcs.reduce((s,d)=>s+(d.kc>0?d.kpk||0:0),0)||null,km:null,hrs:null,rate:rates.ktw,summe:dayCalcs.reduce((s,d)=>s+(d.cK||0),0)},
    tRtw>0&&{pos:"RTW",anz:tRtw,pers:dayCalcs.reduce((s,d)=>s+(d.rc>0?d.kpr||0:0),0)||null,km:null,hrs:null,rate:rates.rtw,summe:dayCalcs.reduce((s,d)=>s+(d.cR||0),0)},
    tAerzt>0&&{pos:"Ärzte",anz:tAerzt,pers:1,km:null,hrs:tHrs,rate:rates.aerzte||0,summe:dayCalcs.reduce((s,d)=>s+(d.cA||0),0)},
    tElKfz>0&&{pos:"Einsatzleiter KFZ",anz:tElKfz,pers:dayCalcs.reduce((s,d)=>s+(d.ec>0?d.kpe||0:0),0)||null,km:null,hrs:null,rate:rates.einsatzleiterKfz,summe:dayCalcs.reduce((s,d)=>s+(d.cEK||0),0)},
    tGktw>0&&{pos:"GKTW",anz:tGktw,pers:null,km:null,hrs:null,rate:rates.gktw,summe:dayCalcs.reduce((s,d)=>s+(d.cG||0),0)},
    tSeg>0&&{pos:"SEG-LKW",anz:tSeg,pers:null,km:null,hrs:null,rate:rates.segLkw,summe:dayCalcs.reduce((s,d)=>s+(d.cS||0),0)},
    tMtw>0&&{pos:"MTW",anz:tMtw,pers:null,km:null,hrs:null,rate:rates.mtw,summe:dayCalcs.reduce((s,d)=>s+(d.cM||0),0)},
    {pos:"Einsatzkräfte",anz:null,pers:tHelferPers,km:null,hrs:null,rate:null,summe:null,isSpacer:true},
    {pos:"Summe Einsatzkräfte",anz:null,pers:tTP,km:null,hrs:tHrs,rate:rates.helfer,summe:dayCalcs.reduce((s,d)=>s+(d.cH||0),0),isBold:true},
    !event.verpflegung&&dayCalcs.reduce((s,d)=>s+(d.cV||0),0)>0&&{pos:"Verpflegungspauschale",anz:null,pers:tTP,km:null,hrs:null,rate:rates.verpflegung,summe:dayCalcs.reduce((s,d)=>s+(d.cV||0),0)},
  ].filter(Boolean);
  const TH={border:"1px solid #000",padding:"3px 6px",fontSize:"9pt",fontWeight:"bold",background:"#c8c8c8",textAlign:"center",whiteSpace:"nowrap"};
  const TD={border:"1px solid #000",padding:"3px 6px",fontSize:"9pt",verticalAlign:"middle"};
  const TDR={...TD,textAlign:"right"};
  const TDC={...TD,textAlign:"center"};
  return(
    <div className="pdf-page" style={{fontFamily:"Arial,Helvetica,sans-serif",fontSize:"10pt",color:"#000",background:"#fff",width:"210mm",minHeight:"297mm",boxSizing:"border-box",padding:"12mm 12mm 10mm 12mm",position:"relative"}}>

      {/* KOPFZEILE + ZWEISPALTIG */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div>
          <div style={{fontSize:"16pt",fontWeight:"bold",marginBottom:4}}>{bereitschaft.name}</div>
          <div style={{fontSize:"8pt",color:"#444",marginBottom:0}}>BRK {bereitschaft.name}</div>
          <div style={{height:"17mm"}}/>  {/* DIN 5008: Anschriftfeld bei 45mm */}
          <div style={{fontSize:"10pt",lineHeight:1.6}}>
            <div style={{fontWeight:"bold"}}>{event.rechnungsempfaenger||event.veranstalter||""}</div>
            {event.ansprechpartner&&<div>{event.ansprechpartner}</div>}
            {event.reStrasse&&<div>{event.reStrasse}</div>}
            <div>{event.rePlzOrt||""}</div>
          </div>
        </div>
        <div style={{fontSize:"9.5pt",lineHeight:1.6,textAlign:"left",minWidth:160}}>
          {stammdaten.customLogo&&<img src={stammdaten.customLogo} alt="Logo" style={{height:60,width:"auto",display:"block",marginBottom:6}}/>}
          <div style={{fontWeight:"bold",fontSize:"11pt"}}>{unterzeichner}</div>
          <div style={{fontWeight:"bold"}}>{unterTitel}</div>
          <div>Tel.: {unterTelefon}</div>
          {stammdaten.fax&&<div>Fax: {stammdaten.fax}</div>}
          {unterMobil&&<div>Mobil: {unterMobil}</div>}
          <div>E-Mail: {unterEmail}</div>
          <div style={{marginTop:6}}>Unser Zeichen:&nbsp;&nbsp;<strong>{unterZeichen}</strong></div>
          <div>{ortName},&nbsp;{new Date().toLocaleDateString("de-DE")}</div>
        </div>
      </div>

      {/* AUFTRAGS-NR */}
      <div style={{marginBottom:8,fontSize:"10pt"}}>
        <strong>Auftrags-Nr.</strong>&nbsp;&nbsp;<strong>{event.auftragsnr||""}</strong>
      </div>

      {/* BETREFF */}
      <div style={{fontWeight:"bold",fontSize:"10pt",marginBottom:10}}>Angebot für einen Sanitätswachdienst</div>

      {/* ANREDE */}
      <div style={{fontSize:"10pt",marginBottom:10}}>{event.anrede||"Sehr geehrte Damen und Herren,"}</div>

      {/* EINLEITUNG */}
      <div style={{fontSize:"10pt",marginBottom:6}}>
        anbei die vorraussichtliche Kostenaufstellung für den Sanitätswachdienst
      </div>
      <div style={{height:6}}/>
      <div style={{fontWeight:"bold",fontSize:"10pt",marginBottom:6}}>{event.name||""}</div>
      <div style={{height:6}}/>

      {/* DATUMSZEILEN */}
      {activeDays.map((d,i)=>(
        <div key={i} style={{fontSize:"10pt",marginBottom:2,display:"flex",gap:8,alignItems:"baseline"}}>
          <span>vom</span>
          <span style={{minWidth:80}}>{fDate2(d.date)}</span>
          <span style={{minWidth:60}}>{d.startTime} Uhr</span>
          <span>bis</span>
          <span style={{minWidth:80}}>{fDate2(activeDays[i+1]?.date||d.date)}</span>
          <span>{d.endTime} Uhr</span>
        </div>
      ))}

      <div style={{height:6}}/>

      {/* TABELLE */}
      <table style={{width:"100%",borderCollapse:"collapse",marginBottom:0}}>
        <thead>
          <tr>
            <th style={{...TH,textAlign:"left",width:"30%"}}></th>
            <th style={TH}>Anzahl</th>
            <th style={TH}>Personen</th>
            <th style={TH}>Kilometer</th>
            <th style={TH}>a&apos; Einsatzst.</th>
            <th style={TH}>a&apos; Euro</th>
            <th style={TH}>Summe</th>
          </tr>
        </thead>
        <tbody>
          {fzRows.map((row,i)=>(
            <tr key={i}>
              <td style={{...TD,fontWeight:row.isBold?"bold":"normal"}}>{row.pos}</td>
              <td style={TDC}>{num(row.anz)}</td>
              <td style={TDC}>{num(row.pers)}</td>
              <td style={TDC}>{num(row.km)}</td>
              <td style={TDC}>{row.hrs&&!row.isSpacer?num(row.hrs):""}</td>
              <td style={TDR}>{row.rate&&row.rate>0&&!row.isSpacer?euro(row.rate):""}</td>
              <td style={TDR}>{row.summe!==null&&row.summe!==undefined&&!row.isSpacer?euro(row.summe):""}</td>
            </tr>
          ))}

          {/* Summenzeile */}
          <tr>
            <td colSpan={6} style={{...TD,border:"none",background:"#fff"}}></td>
            <td style={{...TDR,fontWeight:"bold",borderTop:"2px solid #000"}}>{euro(totalCosts)}</td>
          </tr>
          {/* Pauschalangebot */}
          {isPauschal?(
            <tr>
              <td style={{...TD,fontWeight:"bold",fontSize:"13pt",border:"1px solid #000"}}><strong>Pauschalangebot</strong></td>
              <td colSpan={5} style={{...TD,border:"1px solid #000",borderLeft:"none"}}></td>
              <td style={{...TDR,fontWeight:"bold",fontSize:"13pt",border:"1px solid #000",borderLeft:"none"}}><strong>{euro(endPreis)}</strong></td>
            </tr>
          ):null}        </tbody>
      </table>

      {/* BEMERKUNG */}
      {event.bemerkung&&(
        <table style={{width:"100%",borderCollapse:"collapse",marginTop:8,border:"1px solid #000"}}>
          <tbody><tr>
            <td style={{border:"1px solid #000",padding:"3px 6px",fontSize:"9pt",fontWeight:"bold",width:90,verticalAlign:"top",whiteSpace:"nowrap"}}>Bemerkung:</td>
            <td style={{border:"1px solid #000",padding:"3px 6px",fontSize:"9pt",lineHeight:1.5,whiteSpace:"pre-wrap",textAlign:"center"}}>{event.bemerkung}</td>
          </tr></tbody>
        </table>
      )}

      {/* UNTERSCHRIFT BRK */}
      <div style={{marginTop:30,display:"flex",justifyContent:"flex-end",fontSize:"9pt"}}>
        <div style={{textAlign:"center",minWidth:220}}>
          {user?.signatur
            ?<img src={user?.signatur} alt="Unterschrift" style={{height:50,width:"auto",display:"block",margin:"0 auto 2px"}}/>
            :<div style={{height:50}}/>}
          <div style={{borderTop:"1px solid #000",paddingTop:4,marginBottom:2}}>{unterzeichner}</div>
          {!user?.signatur&&<div style={{fontSize:"8pt",fontStyle:"italic",color:"#555"}}>Dieses Dokument wurde maschinell erstellt<br/>und ist ohne Unterschrift gültig.</div>}
        </div>
      </div>

      {/* BEAUFTRAGUNG */}
      <div style={{marginTop:24,border:"2px solid #000",padding:"18px 20px"}}>
        <div style={{fontWeight:"bold",fontSize:"11pt",marginBottom:10}}>Beauftragung / Auftragsbestätigung</div>
        <div style={{fontSize:"9.5pt",marginBottom:8,lineHeight:1.8}}>
          Hiermit bestätige ich die Beauftragung des Sanitätswachdienstes gemäß obigem Angebot und erkenne die angegebenen Konditionen an.
        </div>
        <div style={{height:60}}/>
        <div style={{display:"flex",justifyContent:"space-between",gap:28,marginTop:4}}>
          <div style={{flex:1,textAlign:"center"}}>
            <div style={{borderTop:"1px solid #000",paddingTop:5,marginBottom:3}}>&nbsp;</div>
            <div style={{fontSize:"8pt",color:"#c0392b",fontWeight:600}}>Ort, Datum</div>
          </div>
          <div style={{flex:2,textAlign:"center"}}>
            <div style={{borderTop:"1px solid #000",paddingTop:5,marginBottom:3}}>&nbsp;</div>
            <div style={{fontSize:"8pt",color:"#c0392b",fontWeight:600}}>Unterschrift Auftraggeber</div>
          </div>
          <div style={{flex:2,textAlign:"center"}}>
            <div style={{borderTop:"1px solid #000",paddingTop:5,marginBottom:3}}>&nbsp;</div>
            <div style={{fontSize:"8pt",color:"#c0392b",fontWeight:600}}>Name in Druckbuchstaben</div>
          </div>
        </div>
      </div>
    </div>
  );
}



// ═══════════════════════════════════════════════════════════════════════════
// VERTRAG PDF
// ═══════════════════════════════════════════════════════════════════════════
function VertragPDF({event,dayCalcs,totalCosts,stammdaten,activeDays,bereitschaft,user}){
  const vOrt=user?.ort||bereitschaft.name.replace(/^Bereitschaft\s*/i,"").trim()||"Schrobenhausen";
  const vUnterzeichner=user?.name||stammdaten.bereitschaftsleiter;
  const vTitel=user?.titel||stammdaten.bereitschaftsleiterTitle||"Bereitschaftsleiter";
  return(<div className="pdf-page" style={{fontFamily:"Arial,sans-serif",fontSize:"9.5pt",color:"#000",background:"#fff",padding:"12mm 12mm",lineHeight:1.5}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
      <div style={{fontSize:"8pt",color:"#666"}}>{stammdaten.customLogo?<img src={stammdaten.customLogo} alt="Logo" style={{height:32,width:"auto"}}/>:<span style={{color:C.rot,fontWeight:"bold",fontSize:"10pt"}}>✚</span>} {stammdaten.kvName}</div>
      <div style={{textAlign:"right",fontSize:"8pt",color:"#666"}}>Auftragsnr: <strong>{event.auftragsnr}</strong></div>
    </div>

    <div style={{fontSize:"12pt",fontWeight:"bold",textAlign:"center",marginBottom:14,borderBottom:`2pt solid ${C.rot}`,paddingBottom:6}}>
      Vereinbarung zur sanitätsdienstlichen Absicherung der Veranstaltung:
    </div>
    <div style={{textAlign:"center",fontSize:"13pt",fontWeight:"bold",marginBottom:16}}>{event.name||"[Veranstaltung]"}</div>

    <div style={{fontSize:"9.5pt",lineHeight:1.7,marginBottom:10}}>
      Zwischen dem <strong>Bayerischen Roten Kreuz, {stammdaten.kvName}</strong><br/>
      vertreten durch:<br/>
      <div style={{marginLeft:30}}>{stammdaten.kgf}<br/>Kreisgeschäftsführer<br/>{stammdaten.kvAdresse}<br/>{stammdaten.kvPlzOrt}</div>
      <div style={{textAlign:"right",fontStyle:"italic",marginTop:-10}}>- nachstehend "BRK" genannt -</div>
    </div>
    <div style={{fontSize:"9.5pt",lineHeight:1.7,marginBottom:14}}>
      und der Firma / Organisation / Verein: <strong>{event.veranstalter||event.rechnungsempfaenger||"[Veranstalter]"}</strong><br/>
      vertreten durch:<br/>
      <div style={{marginLeft:30}}>{event.rechnungsempfaenger||event.veranstalter||"[Name]"}<br/>{event.reStrasse||"[Straße]"}<br/>{event.rePlzOrt||"[PLZ Ort]"}</div>
      <div style={{textAlign:"right",fontStyle:"italic",marginTop:-10}}>- nachstehend "Veranstalter" genannt -</div>
    </div>
    <div style={{marginBottom:10}}>wird folgende Vereinbarung getroffen:</div>

    <div style={{}}>
    <div style={{fontWeight:"bold",marginBottom:4}}>§1 Vertragsgegenstand</div>
    <div style={{marginBottom:6}}>Der Veranstalter führt die nachfolgende Veranstaltung durch:</div>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:"9pt",marginBottom:8}}>
      <tbody>
        <tr><td style={{width:160,padding:"2px 0"}}>Zu betreuende Veranstaltung:</td><td style={{fontWeight:"bold"}}>{event.name}</td></tr>
        <tr><td style={{padding:"2px 0"}}>Veranstaltungsort:</td><td>{event.ort}{event.adresse?`, ${event.adresse}`:""}</td></tr>
      </tbody>
    </table>
    <div style={{fontSize:"9pt",marginBottom:6}}>Veranstaltungsdauer:</div>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:"9pt",marginBottom:8}}>
      <tbody>{activeDays.map((d,i)=>(<tr key={i}><td style={{width:30,padding:"1px 6px"}}>am</td><td style={{width:100}}>{fDate(d.date)}</td><td style={{width:50}}>{d.startTime} Uhr</td><td style={{width:30}}>bis</td><td style={{width:100}}>{fDate(d.date)}</td><td>{d.endTime} Uhr</td></tr>))}</tbody>
    </table>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:"9pt",marginBottom:8}}>
      <tbody>
        <tr><td style={{padding:"2px 0"}}>Erwartete Teilnehmer/Besucher/Helfer:</td>{activeDays.map((d,i)=><td key={i} style={{padding:"2px 6px"}}>{i+1}. Tag: <strong>{d.besucher||"n/a"}</strong></td>)}</tr>
        <tr><td>Behördliche Auflagen:</td><td colSpan={8}>{event.auflagen||"keine"}</td></tr>
        <tr><td>Risiken / Pol. Erkenntnisse:</td><td colSpan={8}>{activeDays.some(d=>d.polizeiRisiko)?"ja":"nein"}</td></tr>
        <tr><td>Beteiligung Prominenter:</td><td colSpan={8}>{activeDays.reduce((s,d)=>s+(d.prominente||0),0)}</td></tr>
      </tbody>
    </table>

    </div>
    <div style={{fontWeight:"bold",marginTop:10,marginBottom:4}}>§2 Verpflichtung des BRK</div>
    <div style={{marginBottom:4,}}>1. Das BRK verpflichtet sich, nach Maßgabe dieser Vereinbarung einschließlich Anlagen die vorstehende Veranstaltung sanitätsdienstlich abzusichern. Hierzu stellt das BRK geeignetes Personal und die erforderliche Ausrüstung. Anzahl und Qualifikation des eingesetzten Personals, die erforderliche Ausstattung und Ausrüstung sowie die Bereitstellungszeiten richten sich nach Anlage 1, die Bestandteil dieser Vereinbarung ist.</div>
    <div style={{marginBottom:4,}}>2. Das BRK ist gegenüber den Besuchern der Veranstaltung, die einer sanitätsdienstlichen Betreuung bedürfen (Patienten) verpflichtet, die sanitätsdienstliche Hilfe zu erbringen. Die Patienten haben gegen das BRK einen unmittelbaren Anspruch auf diese Leistungen. Die Leistungen werden vom Veranstalter gem. §5 dieses Vertrages vergütet. Die vorliegende Vereinbarung ist somit ein Vertrag zugunsten Dritter.</div>
    <div style={{marginBottom:4}}>3. Die medizinische Versorgung und der Transport von Notfallpatienten im Sinne des Art. 2 Abs. 2 BayRDG ist nicht Gegenstand dieser Vereinbarung. Soweit Versorgung und/oder Transport von Notfallpatienten erforderlich ist, wird dies durch die Rettungsleitstelle/Integrierte Leitstelle Ingolstadt gemäß Art. 9 BayRDG erledigt. Das BRK wird zur Erstversorgung der Patienten tätig, bis ein Rettungsmittel des öffentlich-rechtlichen Rettungsdienstes eingetroffen ist.</div>
    <div style={{marginBottom:4}}>4. Die Verpflichtungen in den Ziffern 1-3 dieses Abschnitts beschränken sich (auch gegenüber dritten) auf eine sanitätsdienstliche Absicherung, die im Regelfall nach billigem Ermessen des BRK auf der Grundlage der mitgeteilten Daten des Veranstalters (§§ 1, 3 Abs. 1) voraussichtlich als angemessen zu erwarten ist. Das BRK behält sich für den Katastrophenfall (auch außerhalb der Veranstaltung) nach dem BayKSG vor, Einsatzkräfte nach billigem Ermessen unter Beachtung der Verhältnismäßigkeit und den Anforderungen des BayKSG jederzeit von der Veranstaltung abzuziehen. Hierüber ist der Veranstalter unverzüglich zu unterrichten. In diesem Falle vermindert sich das nach §4 zu entrichtende Entgelt anteilig im Verhältnis der abgezogenen Einsatzkräfte.</div>
    <div style={{marginBottom:4,}}>5. Das BRK übernimmt keinerlei Aufgaben der Veranstaltungsorganisation und -durchführung. Sämtliche Aufgaben der Veranstaltungsorganisation und -durchführung obliegen allein dem Veranstalter.</div>

    <div style={{fontWeight:"bold",marginTop:10,marginBottom:4,}}>§ 2a Bereitstellung von Ärzten (soweit im Einzelfall erforderlich)</div>
    <div style={{marginBottom:4,paddingLeft:16}}>Das BRK stellt dem Veranstalter im Rahmen der sanitätsdienstlichen Absicherung <strong>{activeDays.reduce((s,d)=>s+(d.oAerzte||0),0)}</strong> Ärzte zur Verfügung.</div>
    <div style={{marginBottom:4,paddingLeft:16}}>Die Einzelheiten der Bereitstellung und die Kostenerstattung sind in Anlage 3 geregelt, die Bestandteil dieser Vereinbarung ist.</div>

    <div className="brk-break" style={{fontWeight:"bold",marginTop:10,marginBottom:4}}>§ 3 Verpflichtung des Veranstalters</div>
    <div style={{marginBottom:4,}}>1. Der Veranstalter informiert das BRK rechtzeitig und vollständig über alle Umstände, die für die Planung des sanitätsdienstlichen Einsatzes erforderlich sind. Dies sind insbesondere:</div>
    <div style={{paddingLeft:24,marginBottom:4,fontSize:"9pt"}}>· Erwartete Teilnehmerzahl<br/>· Erwartete Zuschauer- bzw. Besucherzahl<br/>· Erwartete Personen mit erhöhtem Sicherheitsrisiko (VIP)<br/>· Besondere oder aus früheren Veranstaltungen bekannte Risiken der Veranstaltung<br/>· Risikoschwerpunkte<br/>· Streckenverlauf einschließlich Standort der Streckenposten des Veranstalters<br/>· Zu- und Abwege zur Veranstaltung einschließlich Rettungswege<br/>· Veranstaltungsdauer einschl. Vor- und Nachlaufzeiten</div>
    <div style={{marginBottom:4,}}>2. Der Veranstalter stellt während der gesamten Veranstaltung und in angemessene Zeit vorher und nachher einen gesicherten Kommunikationsweg zwischen dem BRK und einer verantwortlichen Person des Veranstalters sicher (z.B. Festnetz- oder gesicherte Mobilnetzverbindung, Funkverbindung über Veranstaltungsfunk, etc.). Soweit vom Veranstalter ein Sicherheitsdienst für die Veranstaltung eingesetzt wird, ist auch die ständige Kommunikation zum Sicherheitsdienst sicherzustellen.</div>
    <div style={{marginBottom:4,}}>3. Der Veranstalter stellt dem BRK die für den Sanitätswachdienst erforderlichen Stellflächen gemäß im Vorfeld zu treffender Abstimmung zur Verfügung und stellt die notwendige Strom- und Wasserversorgung sicher.</div>
    <div style={{marginBottom:4,}}>4. Der Veranstalter informiert das BRK während des Verlaufes der Veranstaltung über alle Vorkommnisse und Ereignisse, die für die sanitätsdienstliche Absicherung und etwaige rettungsdienstliche Einsätze von Bedeutung sind.</div>
    <div style={{marginBottom:4,}}>5. Der Veranstalter verpflichtet sich, das BRK bei rettungs- oder sanitätsdienstlichen Einsätzen nach Kräften zu unterstützen. Dies gilt insbesondere für die Sperrung und/oder Freihaltung von Zu- und Abfahrtswegen, soweit notwendig auch die Unterbrechung der Veranstaltung bis zum Abschluss von Rettungsmaßnahmen, die Zurverfügungstellung von Fahrzeugen, Personal und Kommunikationsmitteln, soweit diese vorhanden sind und vom BRK benötigt werden.</div>
    <div style={{marginBottom:4,}}>6. Der Veranstalter verpflichtet sich ferner, dem BRK alle etwaigen Auflagen von Genehmigungsbehörden oder sonstigen Behörden und Organisationen, die die Veranstaltung betreffen, rechtzeitig und vollständig bekannt zu geben.</div>

    <div style={{fontWeight:"bold",marginTop:10,marginBottom:4,}}>§4 Vergütung</div>
    <div style={{marginBottom:4}}>Der Veranstalter verpflichtet sich, an das BRK für die sanitätsdienstliche Absicherung der Veranstaltung ein Entgelt zu entrichten. Die Vergütung und die Abrechnungsmodalitäten sind im Einzelnen in Anlage 2 geregelt, die Bestandteil dieser Vereinbarung ist.</div>

    <div style={{}}>
    <div className="brk-break" style={{fontWeight:"bold",marginTop:10,marginBottom:4}}>§5 Haftung</div>
    <div style={{marginBottom:4}}>Die Haftung des BRK aus dieser Vereinbarung wird auf Vorsatz und grobe Fahrlässigkeit beschränkt.</div>

    <div style={{fontWeight:"bold",marginTop:10,marginBottom:4,}}>§6 Allgemeine Regeln</div>
    <div style={{marginBottom:4}}>Änderungen oder Ergänzungen dieser Vereinbarung bedürfen der Schriftform. Mündliche Nebenabreden sind nicht getroffen worden.</div>
    <div style={{marginBottom:14,}}>Soweit eine der Regelungen dieser Vereinbarung unwirksam ist oder wird, berührt dies nicht die Wirksamkeit der Vereinbarung insgesamt. In diesem Fall verpflichten sich die Parteien, die unwirksame Regelung durch eine wirksame zu ersetzen, die dem wirtschaftlichen Zweck der unwirksamen Regelung möglichst nahe kommt.</div>

    <div style={{marginTop:24,display:"flex",justifyContent:"space-between",}}>
      <div style={{width:200,textAlign:"center"}}><div style={{padding:"4px 0",fontSize:"9pt"}}>{vOrt}, {new Date().toLocaleDateString("de-DE")}</div><div style={{borderTop:"1px solid #000",paddingTop:4,fontSize:"8pt"}}>Ort, Datum</div></div>
      <div style={{width:10}}/>
      <div style={{width:200,textAlign:"center"}}><div style={{padding:"4px 0",fontSize:"9pt"}}>&nbsp;</div><div style={{borderTop:"1px solid #000",paddingTop:4,fontSize:"8pt"}}>Ort, Datum</div></div>
    </div>
    <div style={{marginTop:30,display:"flex",justifyContent:"space-between"}}>
      <div style={{width:200,textAlign:"center"}}>
        {user?.signatur?<img src={user?.signatur} alt="Unterschrift" style={{height:40,width:"auto",display:"block",margin:"0 auto"}}/>:<div style={{padding:"4px 0",fontSize:"8pt",fontStyle:"italic",color:"#999"}}>Dieses Dokument wurde maschinell<br/>angefertigt und ist ohne Unterschrift gültig.</div>}
        <div style={{borderTop:"1px solid #000",paddingTop:4,fontSize:"8pt"}}>{vUnterzeichner}<br/>{vTitel}</div>
      </div>
      <div style={{width:10}}/>
      <div style={{width:200,textAlign:"center"}}><div style={{padding:"4px 0",fontSize:"9pt"}}>&nbsp;</div><div style={{borderTop:"1px solid #000",paddingTop:4,fontSize:"8pt"}}>Name, Veranstalter</div></div>
    </div>

    </div>
    <div style={{marginTop:20,fontSize:"7pt",color:"#999",textAlign:"center"}}>{bereitschaft.name} · BRK {stammdaten.kvName} · {stammdaten.kvAdresse}, {stammdaten.kvPlzOrt}</div>
  </div>);
}

// ═══════════════════════════════════════════════════════════════════════════
// AAB PDF (Allgemeine Auftragsbedingungen - Original aus Excel)
// ═══════════════════════════════════════════════════════════════════════════
function AABPDF({stammdaten,bereitschaft}){
  return(<div className="pdf-page" style={{fontFamily:"Arial,sans-serif",fontSize:"8.5pt",color:"#000",background:"#fff",padding:"12mm 12mm",lineHeight:1.55}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
      <div style={{fontSize:"8pt",color:"#666"}}>{stammdaten.kvName}</div>
      <div style={{fontSize:"8pt",color:C.rot,fontWeight:"bold"}}>Sanitätswachdienst</div>
    </div>
    <div style={{fontSize:"12pt",fontWeight:"bold",textAlign:"center",marginBottom:14,borderBottom:`2pt solid ${C.rot}`,paddingBottom:6}}>allg. Auftragsbedingungen</div>

    <div style={{fontWeight:"bold",marginBottom:4}}>1. Dienstanforderung, nachträgliche Verstärkung</div>
    <div style={{marginBottom:4,paddingLeft:16}}>1.1 Die Anforderung eines Sanitätswachdienstes sollte rechtzeitig, spätestens jedoch einen Monat vor Veranstaltungsbeginn, erfolgen, um uns und unseren ehrenamtlichen Mitarbeitern eine entsprechende langfristige Disposition zu ermöglichen. Kurzfristige Anforderungen versuchen wir nach Möglichkeit ebenfalls zu erfüllen.</div>
    <div style={{marginBottom:4,paddingLeft:16}}>1.2 In Fragen der erforderlichen Personalstärke, sowie bezüglich der Notwendigkeit zum Einsatz von Fahrzeugen, beraten wir den Anforderer gerne. Diesbezüglich müssen die Auflagen der Genehmigungs- bzw. Ordnungsbehörde beigefügt werden.</div>
    <div style={{marginBottom:4,paddingLeft:16}}>1.3 Soweit das anwesende Personal und/oder das eingesetzte Material nicht ausreichen und wir auf Weisung des Einsatzleiters Sanitätswachdienst oder der Ordnungsbehörde kurzfristig bzw. während des laufenden Einsatzes zusätzliche Kräfte oder Ausrüstung nachführen müssen, berechnen wir den doppelten Satz der regulären Vergütung.</div>

    <div style={{fontWeight:"bold",marginTop:8,marginBottom:4}}>2. Personal, Material, Einsatzfahrzeuge</div>
    <div style={{marginBottom:4,paddingLeft:16}}>2.1 Unsere Helfer verfügen über eine organisationsinterne Ausbildung in erweiterter Erster Hilfe und sanitätsdienstlichen Maßnahmen, die zur Erstversorgung von Patienten bzw. zur Arztassistenz qualifizieren. Rettungssanitäter haben die staatliche Prüfung nach der jeweils geltenden Landesprüfungsordnung abgelegt.</div>
    <div style={{marginBottom:4,paddingLeft:16}}>2.2 Die für die sanitätsdienstliche Versorgung erforderliche Grundausstattung (Verbandmittel, Notfallausstattung, Decken) führen unsere Helfer mit. Weiteren Ausstattungswünschen und Auflagen kommen wir, soweit möglich, gerne nach.</div>
    <div style={{marginBottom:4,paddingLeft:16}}>2.3 Soweit wir Krankentransport- und/oder Rettungswagen zur Verfügung stellen, entsprechen diese mindestens der DIN 75080.</div>
    <div style={{marginBottom:4,paddingLeft:16}}>2.4 Das beim Sanitätswachdienst eingesetzte ärztliche Personal handelt in eigenem Namen und auf eigene Rechnung. Das BRK wird hier nur vermittelnd tätig und übernimmt keine Haftung für das ärztliche Personal.</div>
    <div style={{marginBottom:4,paddingLeft:16}}>2.5 Den Vorgaben des Einsatzleiters Sanitätswachdienst ist, hinsichtlich der Einsatztaktik, dem Aufstellungsort der Fahrzeuge sowie Sanitätszelte, mobilen Sanitätsstationen und Gerätschaften, absolut Folge zu leisten.</div>
    <div style={{marginBottom:4,paddingLeft:16}}>2.6 Vom Veranstalter ist sicherzustellen, dass unserem Personal zu allen Bereichen der Veranstaltung ungehinderter Zugang gewährt wird und außerdem ist er für ungehinderte An- bzw. Abfahrt der Sanitäts- wie auch der Rettungsfahrzeuge zu jeder Zeit verantwortlich.</div>
    <div style={{marginBottom:4,paddingLeft:16}}>2.7 Die Haftung des BRK wird auf Vorsatz und grobe Fahrlässigkeit beschränkt.</div>

    <div style={{fontWeight:"bold",marginTop:8,marginBottom:4}}>3. Abrechnungsmodalitäten, weitere Kosten</div>
    <div style={{marginBottom:4,paddingLeft:16}}>3.1 Personal berechnen wir nach Einsatzstunden, ab Eintreffen am Einsatzort, angebrochene Viertelstunden werden zur nächsten vollen Viertelstunde aufgerundet. Entscheidend für die Berechnung sind nicht die vorgeplanten Zeiten, sondern die tatsächliche Anwesenheit. Die Fahrzeuge werden pauschal zuzüglich der gefahrenen Kilometer abgerechnet.</div>
    <div style={{marginBottom:4,paddingLeft:16}}>3.2 Alle Hilfeleistungen durch unser Personal sind mit den Bereitstellungskosten abgegolten. Den unvorhersehbaren Materialaufwand stellen wir dem Veranstalter/Anforderer gesondert in Rechnung. Anfallende Krankentransporte und Rettungsdiensteinsätze mit unseren Fahrzeugen rechnet der Rettungsdienst Bayern gesondert ab.</div>
    <div style={{marginBottom:4,paddingLeft:16}}>3.3 Die Verpflegung des BRK-Personals obliegt dem Veranstalter (ab 4 Stunden Warmverpflegung). Sollte dies nicht möglich sein, so berechnen wir einen höheren Stundensatz.</div>
    <div style={{marginBottom:4,paddingLeft:16}}>3.4 Die Bezahlung erfolgt gegen Rechnung, die sofort ab Zugang, ohne Abzug zu begleichen ist.</div>

    <div style={{fontWeight:"bold",marginTop:8,marginBottom:4}}>4. Ende eines Sanitätswachdienstes</div>
    <div style={{marginBottom:4,paddingLeft:16}}>4.1 Das Ende eines Sanitätswachdienstes ist spätestens eine Stunde nach der im Auftrag festgelegten Endzeit. Damit endet auch unsere Verantwortung für diesen Einsatz.</div>
    <div style={{marginBottom:4,paddingLeft:16}}>4.2 Die Nichteinhaltung unserer Auftragsbedingungen kann einen sofortigen Abbruch des Sanitätswachdienstes zur Folge haben. Für die möglicherweise hieraus resultierenden Folgen übernehmen wir keine Haftung.</div>

    <div style={{fontWeight:"bold",marginTop:8,marginBottom:4}}>5. Nebenabreden, salvatorische Klausel</div>
    <div style={{marginBottom:4,paddingLeft:16}}>5.1 Soweit wir im Rahmen des Sanitätswachdienstes personenbezogene Daten erheben, werden wir diese nicht an unbefugte Dritte weitergeben.</div>
    <div style={{marginBottom:4,paddingLeft:16}}>5.2 Mündliche Nebenabreden wurden und werden nicht getroffen. Bei Unwirksamkeit einer der vorstehenden Regelung bleibt die Wirksamkeit der Übrigen unberührt.</div>
    <div style={{marginBottom:4,paddingLeft:16}}>5.3 Eventuelle Änderungen bedürfen der Schriftform.</div>

    <div style={{marginTop:16,borderTop:"1px solid #ccc",paddingTop:6,display:"flex",justifyContent:"space-between",fontSize:"7pt",color:"#999"}}>
      <span>Version: 1.00 · Stand: 01.01.2012</span>
      <span>Ersteller: BRK Bereitschaften LLG2</span>
      <span>Freigabe: BRK Landesbereitschaftsleitung</span>
      <span>EQ SAN · Seite 1 von 1</span>
    </div>
  </div>);
}

// ═══════════════════════════════════════════════════════════════════════════
// VORGÄNGE LIST with ARCHIVE + ÜBERSICHT
// ═══════════════════════════════════════════════════════════════════════════
function PapierkorbTab({user,bereitschaft,allBereitschaften,stammdaten,onRestore,toast,showConfirm}){
  const [items,setItems]=React.useState([]);
  const [loading,setLoading]=React.useState(true);
  const [error,setError]=React.useState(null);
  const isAdmin=user.rolle==="admin";
  const load=async()=>{
    setLoading(true);setError(null);
    try{const data=await getPapierkorb(isAdmin);setItems(data);}
    catch(e){setError(e.message);}
    setLoading(false);
  };
  useEffect(()=>{load();},[]);
  const restore=async(id,name)=>{
    if(!await showConfirm({title:"Wiederherstellen",message:`"${name}" wiederherstellen?`,confirmLabel:"Wiederherstellen",variant:"default"}))return;
    try{await restoreVorgang(id);if(onRestore)onRestore();else load();}
    catch(e){toast(e.message,"error");}
  };
  const purge=async(id,name)=>{
    if(!await showConfirm({title:"Endgültig löschen",message:`"${name}" ENDGÜLTIG löschen? Dies kann nicht rückgängig gemacht werden!`,confirmLabel:"Endgültig löschen",variant:"danger"}))return;
    try{await purgeVorgang(id);load();}
    catch(e){toast(e.message,"error");}
  };
  const daysLeft=(deletedAt)=>{
    const d=new Date(deletedAt);
    d.setDate(d.getDate()+60);
    const diff=Math.ceil((d-new Date())/(1000*60*60*24));
    return Math.max(0,diff);
  };
  if(loading)return <div style={{padding:32,textAlign:"center",color:C.dunkelgrau,fontFamily:FONT.sans}}>Lade Papierkorb…</div>;
  if(error)return <div style={{padding:32,color:C.rot,fontFamily:FONT.sans}}>Fehler: {error}</div>;
  return(
    <div style={{maxWidth:900,margin:"0 auto",padding:"24px 16px"}}>

      {items.length===0?(
        <div style={{textAlign:"center",padding:48,color:C.dunkelgrau,fontFamily:FONT.sans,background:C.weiss,borderRadius:8,border:`1px solid ${C.mittelgrau}40`}}>
          <div style={{fontSize:40,marginBottom:12}}>🗑️</div>
          <div style={{fontSize:15,fontWeight:600}}>Papierkorb ist leer</div>
          <div style={{fontSize:13,marginTop:6}}>Gelöschte Vorgänge erscheinen hier.</div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {items.map(v=>{
            const left=daysLeft(v.deletedAt);
            const urgent=left<=7;
            const name=(v.event?.auftragsnr?v.event.auftragsnr+"-del":null)||v.event?.name||v.id;
            const bc=allBereitschaften?.find(b=>b.code===v._bc);
            return(
              <div key={v.id} style={{background:C.weiss,borderRadius:8,border:`1px solid ${urgent?"#e53e3e40":C.mittelgrau+"40"}`,padding:"14px 16px",display:"flex",alignItems:"center",gap:16,boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:14,fontFamily:FONT.sans,color:C.schwarz,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
                  <div style={{fontSize:12,color:C.dunkelgrau,marginTop:3,fontFamily:FONT.sans,display:"flex",gap:12,flexWrap:"wrap"}}>
                    {bc&&<span>📍 {bc.name}</span>}
                    {v.datum&&<span>📅 {v.datum}</span>}
                    {v.deletedAt&&<span>🗑️ Gelöscht: {new Date(v.deletedAt).toLocaleDateString("de-DE")}</span>}
                    <span style={{color:urgent?"#e53e3e":C.dunkelgrau,fontWeight:urgent?700:400}}>⏳ Noch {left} Tag{left!==1?"e":""}</span>
                  </div>
                </div>
                <div style={{display:"flex",gap:8,flexShrink:0}}>
                  <button onClick={()=>restore(v.id,name)} style={{padding:"6px 14px",borderRadius:4,border:`1px solid #1a7a3a`,background:"#f0fff4",color:"#1a7a3a",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:FONT.sans}}>↩ Wiederherstellen</button>
                  {isAdmin&&<button onClick={()=>purge(v.id,name)} style={{padding:"6px 14px",borderRadius:4,border:`1px solid ${C.rot}`,background:`${C.rot}11`,color:C.rot,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:FONT.sans}}>✕ Endgültig löschen</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function VorgaengeListe({bereitschaftCode,user,onLoad,onNew,onCopy,bereitschaft,allBereitschaften,onFilterChange,toast,showConfirm}){
  const [showPapierkorb,setShowPapierkorb]=useState(false);
  const [papierkorbKey,setPapierkorbKey]=useState(0);
  const thisYear=new Date().getFullYear();
  const [viewYear,setViewYear]=useState(thisYear);
  const [events,setEvents]=useState([]);
  const [loading,setLoading]=useState(true);
  const [searchQ,setSearchQ]=useState("");
  const [filterBereitschaft,setFilterBereitschaft]=useState(""); // liste | uebersicht

  const prefix=`sanwd:${bereitschaftCode}:${viewYear}`;
  useEffect(()=>{loadEvents();},[prefix]);
  const loadEvents=async(bcFilter)=>{setLoading(true);try{const bc=bcFilter!==undefined?bcFilter:filterBereitschaft;const data=await API.getVorgaenge(viewYear,bc);setEvents(data.map(v=>({...v,id:v.id})));}catch{setEvents([]);}setLoading(false);};
  const del=async(id)=>{if(!await showConfirm({title:"In Papierkorb verschieben",message:"Vorgang in den Papierkorb verschieben? Er kann innerhalb von 60 Tagen wiederhergestellt werden.",confirmLabel:"In Papierkorb",variant:"danger"}))return;try{await API.deleteVorgang(id);loadEvents();}catch(e){toast("Fehler beim Löschen: "+e.message,"error");}};
  const years=[];for(let y=thisYear;y>=2025;y--)years.push(y);
  const isArchive=viewYear<thisYear;
  const totalBetrag=events.reduce((s,ev)=>{const e=ev.event;if(!e)return s;const dc=(ev.days||[]).filter(d=>d.active);let t=0;try{dc.forEach(d=>{const c=calcDay(d,DEFAULT_STAMMDATEN.rates,e.verpflegung);t+=c.total;});}catch{}return s+t;},0);

  return(<div>
    {/* Year tabs */}
    <div style={{display:"flex",gap:4,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
      {years.map(y=>(<button key={y} onClick={()=>setViewYear(y)} style={{padding:"5px 12px",borderRadius:4,border:`1px solid ${y===viewYear?C.rot:C.mittelgrau+"60"}`,background:y===viewYear?`${C.rot}11`:C.weiss,color:y===viewYear?C.rot:y<thisYear?C.bgrau:C.schwarz,cursor:"pointer",fontSize:12,fontWeight:y===viewYear?700:400,fontFamily:FONT.sans}}>{y}{y===thisYear?" ●":""}</button>))}
    </div>

    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div>
        <h2 style={{margin:0,fontSize:18,fontWeight:700,color:C.schwarz}}>
          {isArchive?"📦 Archiv":"📁 Vorgänge"} {viewYear}
        </h2>
        <p style={{margin:"2px 0 0",fontSize:12,color:C.dunkelgrau}}>{bereitschaft.name} · {events.length} Vorgang/Vorgänge</p>
      </div>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        <input type="text" value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Suche (Name, Nr., Kunde...)" style={{padding:"5px 10px",borderRadius:4,border:"1px solid "+C.mittelgrau,fontSize:12,fontFamily:FONT.sans,width:200}}/>
        {(user?.rolle==="admin"||user?.rolle==="kbl")&&<select value={filterBereitschaft} onChange={e=>{const v=e.target.value;setFilterBereitschaft(v);loadEvents(v);if(onFilterChange)onFilterChange(v);}} style={{padding:"5px 10px",borderRadius:4,border:`1px solid ${C.mittelgrau}`,fontSize:12,fontFamily:FONT.sans}}><option value="">Alle Bereitschaften</option>{(allBereitschaften||[]).map(b=><option key={b.code} value={b.code}>{b.short} — {b.name}</option>)}</select>}
        {!isArchive&&<Btn onClick={onNew} icon="➕">Neuer Vorgang</Btn>}
      </div>
    </div>

    {/* ÜBERSICHT TABLE */}
    {(<Card title={`Angebote/Rechnungen ${viewYear}`} accent={C.mittelblau} sub={`Gesamt: ${f2(totalBetrag)} €`}>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
        <thead><tr style={{background:C.hellgrau}}>{["Lfd.Nr.","Datum","Ansprechpartner","Veranstaltung","Kunde","AG","RG","Betrag","Status",""].map(h=><th key={h} style={{padding:"6px 8px",textAlign:h==="Betrag"?"right":"left",borderBottom:`2px solid ${C.mittelgrau}40`,fontSize:10,color:C.dunkelgrau,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
        <tbody>{events.filter(ev=>{if(!searchQ)return true;const q=searchQ.toLowerCase();const e=ev.event||{};return(e.name||"").toLowerCase().includes(q)||(e.auftragsnr||"").toLowerCase().includes(q)||(e.veranstalter||"").toLowerCase().includes(q)||(e.rechnungsempfaenger||"").toLowerCase().includes(q)||(e.ansprechpartner||"").toLowerCase().includes(q)||(e.ort||"").toLowerCase().includes(q);}).sort((a,b)=>{const na=a.event?.auftragsnr||"";const nb=b.event?.auftragsnr||"";return nb.localeCompare(na,undefined,{numeric:true});}).map((ev,i)=>{const e=ev.event||{};const cl=e.checklist||{};const dc=(ev.days||[]).filter(d=>d.active);const firstDate=dc[0]?.date;let betrag=0;try{dc.forEach(d=>{betrag+=calcDay(d,DEFAULT_STAMMDATEN.rates,e.verpflegung).total;});}catch{}
          return(<tr key={i} style={{borderBottom:`1px solid ${C.hellgrau}`,cursor:"pointer"}} onClick={()=>isArchive?onCopy(ev):onLoad(ev)}>
            <td style={{padding:"5px 8px",fontWeight:600,color:C.rot,fontFamily:FONT.mono,whiteSpace:"nowrap"}}>{e.auftragsnr||"n/a"}</td>
            <td style={{padding:"5px 8px",whiteSpace:"nowrap"}}>{firstDate?fDate(firstDate):""}</td>
            <td style={{padding:"5px 8px"}}>{e.ansprechpartner||""}</td>
            <td style={{padding:"5px 8px",fontWeight:600}}>{e.name||"n/a"}</td>
            <td style={{padding:"5px 8px"}}>{e.veranstalter||e.rechnungsempfaenger||""}</td>
            <td style={{padding:"5px 8px",textAlign:"center"}}>{cl.angebotVersendet?<span style={{color:"#1a7a3a",fontSize:14}}>✅</span>:<span style={{color:"#e53935",fontSize:14}}>❌</span>}</td>
            <td style={{padding:"5px 8px",textAlign:"center"}}>{cl.fibuWeitergeleitet?<span style={{color:"#1a7a3a",fontSize:14}}>✅</span>:<span style={{color:"#e53935",fontSize:14}}>❌</span>}</td>
            <td style={{padding:"5px 8px",textAlign:"right",fontFamily:FONT.mono,fontWeight:600}}>{betrag>0?f2(betrag):""}</td>
            <td style={{padding:"5px 8px"}}>{cl.abgeschlossen?<span style={{color:"#1a7a3a",fontSize:10}}>✅ Abgeschl.</span>:<span style={{color:"#d4920a",fontSize:10}}>⏳ Offen</span>}</td>
            <td style={{padding:"5px 4px",textAlign:"center"}}><button onClick={(e)=>{e.stopPropagation();del(ev.id);}} title="Vorgang löschen" style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:"#ccc",padding:"2px 4px"}} onMouseEnter={e=>e.currentTarget.style.color="#e53935"} onMouseLeave={e=>e.currentTarget.style.color="#ccc"}>🗑️</button></td>
          </tr>);})}</tbody>
        <tfoot><tr style={{borderTop:`2px solid ${C.rot}`}}><td colSpan={8} style={{padding:"6px 8px",fontWeight:700}}>Summe</td><td style={{padding:"6px 8px",textAlign:"right",fontWeight:800,color:C.rot,fontFamily:FONT.mono}}>{f2(totalBetrag)}</td><td></td></tr></tfoot>
      </table></div>
    </Card>)}

    
{/* Papierkorb Button unten rechts */}
    <div style={{display:"flex",justifyContent:"flex-end",marginTop:16}}>
      <button onClick={()=>setShowPapierkorb(true)} style={{padding:"7px 16px",borderRadius:4,border:`1px solid ${C.mittelgrau}`,background:C.weiss,cursor:"pointer",fontSize:12,color:C.dunkelgrau,fontFamily:FONT.sans,display:"flex",alignItems:"center",gap:6}}>🗑️ Papierkorb</button>
    </div>
    {/* Papierkorb Modal */}
    {showPapierkorb&&(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setShowPapierkorb(false)}>
        <div style={{background:C.weiss,borderRadius:10,boxShadow:"0 8px 32px rgba(0,0,0,0.18)",width:"min(860px,95vw)",maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:`1px solid ${C.mittelgrau}40`}}>
            <div>
              <div style={{fontWeight:700,fontSize:16,fontFamily:FONT.sans}}>🗑️ Papierkorb</div>
              <div style={{fontSize:12,color:C.dunkelgrau,marginTop:3,fontFamily:FONT.sans}}>Gelöschte Vorgänge werden nach 60 Tagen automatisch entfernt.</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button onClick={()=>setPapierkorbKey(k=>k+1)} style={{padding:"6px 14px",borderRadius:4,border:`1px solid ${C.mittelgrau}`,background:C.weiss,cursor:"pointer",fontSize:12,fontFamily:FONT.sans}}>↻ Aktualisieren</button>
              <button onClick={()=>setShowPapierkorb(false)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:C.dunkelgrau,lineHeight:1}}>✕</button>
            </div>
          </div>
          <PapierkorbTab key={papierkorbKey} user={user} bereitschaft={bereitschaftCode} allBereitschaften={allBereitschaften} stammdaten={{}} onRestore={()=>{setShowPapierkorb(false);loadEvents();}} toast={toast} showConfirm={showConfirm}/>
        </div>
      </div>
    )}
  </div>);
}


// ═══════════════════════════════════════════════════════════════════════════
// FEEDBACK BUTTON + MODAL
// ═══════════════════════════════════════════════════════════════════════════
function FeedbackButton({user,currentView,toast}){
  const [open,setOpen]=useState(false);
  const [kat,setKat]=useState("bug");
  const [betreff,setBetreff]=useState("");
  const [beschreibung,setBeschreibung]=useState("");
  const [sending,setSending]=useState(false);
  const [done,setDone]=useState(null);
  const reset=()=>{setBetreff("");setBeschreibung("");setKat("bug");setDone(null);};
  const send=async()=>{
    if(!betreff.trim()||!beschreibung.trim()){toast("Bitte Betreff und Beschreibung ausfüllen","warning");return;}
    setSending(true);
    try{
      const r=await API.submitFeedback({kategorie:kat,betreff,beschreibung,ansicht:currentView,browser:navigator.userAgent});
      setDone(r.ticket);
    }catch(e){toast(e.message,"error");}
    finally{setSending(false);}
  };
  if(!user)return null;
  return(<>
    <div onClick={()=>{setOpen(true);reset();}} style={{position:"fixed",bottom:20,right:20,zIndex:9999,background:C.rot,color:"#fff",borderRadius:"50%",width:48,height:48,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 4px 12px #0004",fontSize:22,transition:"transform 0.2s"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"} title="Feedback senden">💬</div>
    {open&&<div style={{position:"fixed",inset:0,zIndex:10000,background:"#0005",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)setOpen(false);}}>
      <div style={{background:C.weiss,borderRadius:10,padding:"24px 28px",width:"90%",maxWidth:480,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 8px 32px #0003"}}>
        {done?(<div style={{textAlign:"center",padding:20}}>
          <div style={{fontSize:40,marginBottom:12}}>✅</div>
          <div style={{fontSize:16,fontWeight:700,color:C.dunkelgrau,marginBottom:6}}>Ticket #{done} erstellt</div>
          <div style={{fontSize:13,color:C.bgrau,marginBottom:16}}>Vielen Dank für dein Feedback!</div>
          <Btn onClick={()=>setOpen(false)} variant="primary">Schließen</Btn>
        </div>):(<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h3 style={{margin:0,fontSize:16,fontWeight:700,color:C.dunkelgrau}}>Feedback senden</h3>
            <span onClick={()=>setOpen(false)} style={{cursor:"pointer",fontSize:20,color:C.bgrau,lineHeight:1}}>✕</span>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            <Btn onClick={()=>setKat("bug")} variant={kat==="bug"?"primary":"secondary"} small>🐛 Fehler melden</Btn>
            <Btn onClick={()=>setKat("feature")} variant={kat==="feature"?"primary":"secondary"} small>💡 Wunsch / Idee</Btn>
          </div>
          <Inp label="Betreff" value={betreff} onChange={setBetreff} placeholder={kat==="bug"?"Kurze Fehlerbeschreibung...":"Was wünschst du dir?"}/>
          <label style={{display:"block",marginBottom:14}}><span style={{display:"block",fontSize:11,color:C.dunkelgrau,marginBottom:3,fontWeight:600}}>Beschreibung</span>
            <textarea value={beschreibung} onChange={e=>setBeschreibung(e.target.value)} rows={5} placeholder={kat==="bug"?"Was ist passiert? Was hast du erwartet?\nWelche Schritte führen zum Fehler?":"Beschreibe deinen Wunsch so genau wie möglich..."} style={{width:"100%",padding:"8px 10px",background:C.weiss,border:"1px solid "+C.mittelgrau,borderRadius:4,color:C.schwarz,fontSize:13,fontFamily:FONT.sans,resize:"vertical",boxSizing:"border-box"}}/>
          </label>
          <div style={{fontSize:10,color:C.bgrau,marginBottom:12,lineHeight:1.4}}>Automatisch mitgesendet: dein Name, E-Mail, Bereitschaft und aktuelle Ansicht.</div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
            <Btn onClick={()=>setOpen(false)} variant="secondary">Abbrechen</Btn>
            <Btn onClick={send} variant="primary" disabled={sending}>{sending?"Sende...":"Absenden"}</Btn>
          </div>
        </>)}
      </div>
    </div>}
    </>);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════
const TABS=[{id:"events",label:"Vorgänge",icon:"📁"},{id:"event",label:"Veranstaltung",icon:"📋"},{id:"days",label:"Tage & Analyse",icon:"📊"},{id:"costs",label:"Kosten",icon:"💰"},{id:"pdf",label:"Dokumente",icon:"🖨️"},{id:"kunden",label:"Kunden",icon:"👥"},{id:"settings",label:"Stammdaten",icon:"⚙️"},{id:"releases",label:"Changelog",icon:"🆕"}];

export default function App(){
  const [user,setUser]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  useEffect(()=>{API.getStatus().then(d=>{if(d.authenticated){const bc=d.user.bereitschaftCode;const bIdx=BEREITSCHAFTEN.findIndex(b=>b.code===bc);const u={sub:d.user.sub,name:d.user.name,email:d.user.email,bereitschaftCode:bc,bereitschaftIdx:bIdx>=0?bIdx:0,bereitschaft:(d.user.bereitschaft&&d.user.bereitschaft.name)||bc||"",rolle:d.user.rolle,telefon:"",mobil:"",titel:""};setUser(u);API.getProfile().then(p=>{if(p)setUser(prev=>({...prev,telefon:p.telefon||prev.telefon,mobil:p.mobil||prev.mobil,titel:p.titel||prev.titel,email:p.email||prev.email,ort:p.ort||prev.ort||'',signatur:p.unterschrift||prev.signatur||''}));}).catch(()=>{});}}).catch(()=>{}).finally(()=>setAuthLoading(false));},[]);
  const [tab,setTab]=useState("events");
  const [stammdaten,setStammdaten]=useState(DEFAULT_STAMMDATEN);
  useEffect(()=>{if(!user)return;API.getStammdaten().then(d=>{if(d){const bIdxS=user?BEREITSCHAFTEN.findIndex(b=>b.code===user.bereitschaftCode):-1;setStammdaten(prev=>({...prev,bereitschaftIdx:bIdxS>=0?bIdxS:prev.bereitschaftIdx,kvName:d.kv_name||prev.kvName,kgf:d.kgf||prev.kgf,kvAdresse:d.kv_adresse||prev.kvAdresse,kvPlzOrt:d.kv_plz_ort||prev.kvPlzOrt,bereitschaftsleiter:d.leiter_name||prev.bereitschaftsleiter,bereitschaftsleiterTitle:d.leiter_title||prev.bereitschaftsleiterTitle,telefon:d.telefon||prev.telefon,fax:d.fax||prev.fax,mobil:d.mobil||prev.mobil,email:d.email||prev.email,funkgruppe:d.funkgruppe||prev.funkgruppe,customLogo:d.logo||null,rates:d.kostensaetze?{helfer:d.kostensaetze.helfer,ktw:d.kostensaetze.ktw,rtw:d.kostensaetze.rtw,gktw:d.kostensaetze.gktw,einsatzleiter:d.kostensaetze.einsatzleiter,aerzte:0,einsatzleiterKfz:d.kostensaetze.einsatzleiter_kfz,mobileSanstation:d.kostensaetze.seg_lkw,segLkw:d.kostensaetze.seg_lkw,mtw:d.kostensaetze.mtw,zelt:d.kostensaetze.zelt,kmKtw:d.kostensaetze.km_ktw,kmRtw:d.kostensaetze.km_rtw,kmGktw:d.kostensaetze.km_gktw,kmElKfz:d.kostensaetze.km_el_kfz,kmSegLkw:d.kostensaetze.km_seg_lkw,kmMtw:d.kostensaetze.km_mtw,verpflegung:d.kostensaetze.verpflegung}:prev.rates}));}setStammdatenLoaded(true);}).catch(e=>{console.warn("Stammdaten laden:",e);setStammdatenLoaded(true);});},[user]);
  useEffect(()=>{
  if(!user||user.rolle==="helfer")return;
  const t=setTimeout(()=>{
    if(user.rolle==="admin"||user.rolle==="kbl"){
      // Admin: alles speichern
      API.saveStammdaten({leiter_name:stammdaten.bereitschaftsleiter,leiter_title:stammdaten.bereitschaftsleiterTitle,telefon:stammdaten.telefon,fax:stammdaten.fax,mobil:stammdaten.mobil,email:stammdaten.email,funkgruppe:stammdaten.funkgruppe,kv_name:stammdaten.kvName,kgf:stammdaten.kgf,kv_adresse:stammdaten.kvAdresse,kv_plz_ort:stammdaten.kvPlzOrt}).catch(e=>console.warn("Stammdaten speichern:",e));
    } else {
      // BL: nur Bereitschaftsleiter-Daten
      API.saveBereitschaftsleiter({leiter_name:stammdaten.bereitschaftsleiter,leiter_title:stammdaten.bereitschaftsleiterTitle,telefon:stammdaten.telefon,fax:stammdaten.fax,mobil:stammdaten.mobil,email:stammdaten.email,funkgruppe:stammdaten.funkgruppe}).catch(e=>console.warn("BL-Daten speichern:",e));
    }
  },2000);return()=>clearTimeout(t);
},[stammdaten,user]);
  /* stammdaten via API geladen */
  const [currentEventId,setCurrentEventId]=useState(null);
  const [event,setEvent]=useState({...EMPTY_EVENT});
  const [days,setDays]=useState(Array.from({length:8},(_,i)=>mkDay(i+1)));
  const [activeDay,setActiveDay]=useState(0);
  const [showOverrides,setShowOverrides]=useState(false);
  const [laufendeNr,setLaufendeNr]=useState(1);
  const [klauseln,setKlauseln]=useState([]);
  const [klauselnEdit,setKlauselnEdit]=useState({});
  const [klauselnSaving,setKlauselnSaving]=useState(false);
  const [mappePending,setMappePending]=useState(false);
  const [gefahrenPending,setGefahrenPending]=useState(false);
  const [angebotPending,setAngebotPending]=useState(false);
  const [aabPending,setAabPending]=useState(false);
  const [vertragPending,setVertragPending]=useState(false);
  const [pdfView,setPdfView]=useState("gefahren");
  const [saving,setSaving]=useState(false);
  const [kunden,setKunden]=useState([]);
  // Toast notification system
  const [toasts,setToasts]=useState([]);
  const toastIdRef=useRef(0);
  const toast=useCallback((message,type="info",duration=4000)=>{const id=++toastIdRef.current;setToasts(p=>[...p,{id,message,type}]);if(duration>0)setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),duration);},[]);
  const dismissToast=useCallback((id)=>setToasts(p=>p.filter(t=>t.id!==id)),[]);
  // Confirm dialog system
  const [confirmDlg,setConfirmDlg]=useState(null);
  const confirmRef=useRef(null);
  const showConfirm=useCallback((opts)=>new Promise(resolve=>{confirmRef.current=resolve;setConfirmDlg({title:opts.title||"Bestätigung",message:opts.message,confirmLabel:opts.confirmLabel,cancelLabel:opts.cancelLabel,variant:opts.variant||"default"});}),[]);
  const handleConfirm=useCallback(()=>{if(confirmRef.current)confirmRef.current(true);confirmRef.current=null;setConfirmDlg(null);},[]);
  const handleCancel=useCallback(()=>{if(confirmRef.current)confirmRef.current(false);confirmRef.current=null;setConfirmDlg(null);},[]);
  const [lockInfo,setLockInfo]=useState(null);
  // Lock-Heartbeat: alle 30s verlängern
  useEffect(()=>{
    if(!currentEventId||lockInfo?.lockedBy)return;
    const iv=setInterval(()=>{API.lockVorgang(currentEventId).catch(()=>{});},30000);
    return()=>clearInterval(iv);
  },[currentEventId,lockInfo]);
  // Lock freigeben bei Verlassen
  useEffect(()=>{
    const cleanup=()=>{if(currentEventId)navigator.sendBeacon("/api/vorgaenge/"+currentEventId+"/lock-release");};
    window.addEventListener("beforeunload",cleanup);
    return()=>{window.removeEventListener("beforeunload",cleanup);if(currentEventId)API.unlockVorgang(currentEventId).catch(()=>{});};
  },[currentEventId]);
  const [vorgangStatus,setVorgangStatus]=useState(null);
  const [editHistory,setEditHistory]=useState([]);
  const [stammdatenLoaded,setStammdatenLoaded]=useState(false);
  const printRef=useRef(null);

  const year=new Date().getFullYear();
  const storagePrefix=useMemo(()=>`sanwd:${user?.bereitschaftCode||BEREITSCHAFTEN[stammdaten.bereitschaftIdx]?.code||"BSOB"}:${year}`,[stammdaten.bereitschaftIdx,year]);
  const kundenKey=useMemo(()=>`sanwd:${BEREITSCHAFTEN[stammdaten.bereitschaftIdx].code}:kunden`,[stammdaten.bereitschaftIdx]);

  useEffect(()=>{if(!user)return;(async()=>{try{const k=await API.getKunden();setKunden(k);}catch{setKunden([]);}try{const kl=await API.getKlauseln();setKlauseln(kl);const ed={};kl.forEach(k=>ed[k.id]=k.inhalt);setKlauselnEdit(ed);}catch{}})();},[user,kundenKey]);

  const saveKunden=useCallback(async(k)=>{try{for(const kunde of k){await API.saveKunde(kunde);}}catch{}},[]);

  const upsertKunde=useCallback((ev)=>{if(!ev.veranstalter&&!ev.rechnungsempfaenger)return;const name=ev.veranstalter||ev.rechnungsempfaenger;const entry={name,ansprechpartner:ev.ansprechpartner||"",telefon:ev.telefon||"",email:ev.email||"",rechnungsempfaenger:ev.rechnungsempfaenger||"",reStrasse:ev.reStrasse||"",rePlzOrt:ev.rePlzOrt||"",anrede:ev.anrede||"Sehr geehrte Damen und Herren,"};API.saveKunde(entry).catch(()=>{});setKunden(prev=>{const idx=prev.findIndex(k=>k.name===name);return idx>=0?prev.map((k,i)=>i===idx?entry:k):[...prev,entry];});},[]);

  useEffect(()=>{if(!user)return;(async()=>{try{const c=await API.getCounter(year);setLaufendeNr(c.nextNr||1);}catch{}})();},[user,storagePrefix]);

  const generateNr=useCallback(()=>{const b=BEREITSCHAFTEN[stammdaten.bereitschaftIdx];const yr=String(year).slice(-2);const nr=String(laufendeNr).padStart(3,"0");setEvent(p=>({...p,auftragsnr:`${b.code} ${yr}/${nr}`}));const next=laufendeNr+1;setLaufendeNr(next);if(user)try{API.incrementCounter(year).catch(()=>{});}catch{}},[stammdaten.bereitschaftIdx,laufendeNr,year,user,storagePrefix]);

  const saveEvent=useCallback(async()=>{
  if(event?.checklist?.angebotVersendet||event?.checklist?.abgeschlossen){console.log("⏭️ Speichern übersprungen: Vorgang gesperrt");return;}
    // Auto-Nummer wenn noch keine gesetzt
    if(!event.auftragsnr){
      const b=BEREITSCHAFTEN[stammdaten.bereitschaftIdx];
      const yr=String(year).slice(-2);
      try{
        const res=await API.incrementCounter(year);
        const nr=String((res&&res.next_nr?res.next_nr-1:laufendeNr)).padStart(3,"0");
        const autoNr=`${b.code} ${yr}/${nr}`;
        setEvent(p=>({...p,auftragsnr:autoNr}));
        setLaufendeNr(prev=>prev+1);
      }catch{}
    }if(!user)return;setSaving(true);const id=currentEventId||`evt-${Date.now()}`;if(!currentEventId)setCurrentEventId(id);try{
      const bc=BEREITSCHAFTEN[stammdaten.bereitschaftIdx]?.code;
      await API.saveVorgang(id,{id,event,days,year,updatedAt:Date.now(),activeDays:days.filter(d=>d.active).length,createdBy:user.name,bereitschaftCode:bc});
      upsertKunde(event);
      console.log("✅ Gespeichert:",id);
    }catch(e){
      if(e.message&&(e.message.includes("423")||e.message.includes("Gesperrt")||e.message.includes("versendet"))){
        console.warn("⏭️ Speichern übersprungen (gesperrt):",e.message);
      }else{
        console.error("❌ Speichern fehlgeschlagen:",e.message,e);
        toast("Speichern fehlgeschlagen: "+e.message,"error");
      }
    }setSaving(false);},[user,currentEventId,event,days,stammdaten.bereitschaftIdx,upsertKunde,year]);

  useEffect(()=>{if(!user||!currentEventId||tab==="events")return;if(event?.checklist?.angebotVersendet||event?.checklist?.abgeschlossen)return;if(lockInfo&&lockInfo.locked&&lockInfo.lockedBy!==user?.name)return;const t=setTimeout(saveEvent,2000);return()=>clearTimeout(t);},[event,days,currentEventId,user,tab,saveEvent,lockInfo]);


  // Lock + History (v6.1 - temporarily simplified)
  useEffect(()=>{
    if(!user||!currentEventId)return;
    (async()=>{
      try{const h=await API.getVorgangHistory(currentEventId);setEditHistory(h||[]);}catch{setEditHistory([]);}
    })();
  },[currentEventId,user]);
  const updateEvent=useCallback((k,v)=>setEvent(p=>({...p,[k]:v})),[]);
  const updateDay=useCallback((i,k,v)=>setDays(p=>p.map((d,j)=>j===i?{...d,[k]:v}:d)),[]);
  const updateStamm=useCallback((k,v)=>setStammdaten(p=>({...p,[k]:v})),[]);
  const updateRate=useCallback((k,v)=>setStammdaten(p=>({...p,rates:{...p.rates,[k]:v}})),[]);
  useEffect(()=>{if(!user||user.rolle==="helfer"||user.rolle==="bl")return;const t=setTimeout(()=>{const r=stammdaten.rates;API.saveKostensaetze({helfer:r.helfer,ktw:r.ktw,rtw:r.rtw,gktw:r.gktw,einsatzleiter:r.einsatzleiter,einsatzleiter_kfz:r.einsatzleiterKfz,seg_lkw:r.segLkw,mtw:r.mtw,zelt:r.zelt,km_ktw:r.kmKtw,km_rtw:r.kmRtw,km_gktw:r.kmGktw,km_el_kfz:r.kmElKfz,km_seg_lkw:r.kmSegLkw,km_mtw:r.kmMtw,verpflegung:r.verpflegung}).catch(e=>console.warn("Kostensätze speichern:",e));},2000);return()=>clearTimeout(t);},[stammdaten.rates,user]);
  /* stammdaten via API gespeichert */
  const updateChecklist=useCallback((cl)=>setEvent(p=>({...p,checklist:cl})),[]);
  const isLocked=!!(event?.checklist?.angebotVersendet||event?.checklist?.abgeschlossen);
  const isEditLocked=!!(lockInfo&&lockInfo.locked&&lockInfo.lockedBy!==user?.name);

  const activeDays=days.filter(d=>d.active);
  const dayCalcs=useMemo(()=>activeDays.map(d=>calcDay(d,stammdaten.rates,event.verpflegung)),[activeDays,stammdaten.rates,event.verpflegung]);
  const totalCosts=useMemo(()=>dayCalcs.reduce((s,d)=>s+d.total,0),[dayCalcs]);
  const f$=(v)=>new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(v);
  const bereitschaft=BEREITSCHAFTEN[stammdaten.bereitschaftIdx];

  const handlePrint=()=>{const pc=printRef.current;if(!pc)return;const w=window.open("","_blank");w.document.write(`<!DOCTYPE html><html><head><title>SanWD ${event.name}</title><style>@page{size:A4;margin:15mm 12mm 20mm 12mm}body{margin:0;font-family:Arial,sans-serif;font-size:9.5pt}.pdf-page{page-break-after:always}.brk-absatz{page-break-inside:avoid}.brk-break{page-break-before:always}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>${pc.innerHTML}</body></html>`);w.document.close();setTimeout(()=>{const allPages=w.document.querySelectorAll('.pdf-page');const total=allPages.length;if(total>0){allPages.forEach((pg,i)=>{const f=w.document.createElement('div');f.style.cssText='text-align:center;font-size:8pt;color:#999;padding-top:6px;';f.textContent='Seite '+(i+1)+' von '+total;pg.appendChild(f);});}w.print();},400);};

  const handlePrintAll=async()=>{
    const nr=(event.auftragsnr||"unbekannt").replace(/[^a-zA-Z0-9_-]/g,"_");
    const evName=(event.name||"Veranstaltung").replace(/ +/g,"_").substring(0,40);
    if(currentEventId){
      await saveEvent();
      try{
        const r=await fetch("/api/pdf/vertrag/"+currentEventId,{method:"POST",credentials:"include"});
        if(r.ok){const blob=await r.blob();const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=nr+"_Vertrag.pdf";a.click();}
      }catch(e){console.warn("Vertrag:",e);}
    }
    setPdfView("angebot");
    await new Promise(res=>setTimeout(res,600));
    const pc=printRef.current;
    if(!pc){toast("Druckbereich nicht gefunden","error");return;}
    const angebotEl=pc.querySelector("[data-print='angebot']");
    const angebotHTML=angebotEl?angebotEl.innerHTML:"";
    setPdfView("aab");
    await new Promise(res=>setTimeout(res,600));
    const aabEl=pc.querySelector("[data-print='aab']");
    const aabHTML=aabEl?aabEl.innerHTML:"";
    setPdfView("angebot");
    const getStyles=()=>{let s="";for(const ss of document.styleSheets){try{for(const rule of ss.cssRules)s+=rule.cssText+" ";}catch{}}return s;};
    const w2=window.open("","_blank");
    w2.document.write("<!DOCTYPE html><html><head><title>"+nr+"_"+evName+"_Angebotsmappe</title><style>"+getStyles()+"@page{size:A4;margin:15mm 12mm}@media print{.pagebreak{page-break-before:always}}</style></head><body>");
    if(angebotHTML)w2.document.write("<div>"+angebotHTML+"</div>");
    if(aabHTML)w2.document.write("<div class='pagebreak'>"+aabHTML+"</div>");
    w2.document.write("</body></html>");
    w2.document.close();
    setTimeout(()=>{w2.focus();w2.print();},800);
  };

  const saveKlauseln=async()=>{
    setKlauselnSaving(true);
    try{
      for(const [id,inhalt] of Object.entries(klauselnEdit)){
        await API.saveKlausel(id,inhalt);
      }
      const k=await API.getKlauseln();setKlauseln(k);
      toast("Textvorlagen gespeichert","success");
    }catch(e){toast(e.message,"error");}finally{setKlauselnSaving(false);}
  };
  // Lock freigeben beim Vorgang-Wechsel
  const releaseLock=useCallback(async()=>{if(currentEventId){try{await API.unlockVorgang(currentEventId);}catch{}setLockInfo(null);}},[currentEventId]);
  const newEvent=useCallback(()=>{setCurrentEventId(null);setEvent({...EMPTY_EVENT});setDays(Array.from({length:8},(_,i)=>mkDay(i+1)));setActiveDay(0);setTab("event");},[]);
  const loadEvent=useCallback(async(ev)=>{
    setCurrentEventId(ev.id);setEvent({...EMPTY_EVENT,...(ev.event||{})});setDays(ev.days||Array.from({length:8},(_,i)=>mkDay(i+1)));setTab("event");setActiveDay(0);
    // Lock prüfen und setzen
    try{
      const status=await API.getLockStatus(ev.id);
      if(status.locked&&status.lockedBy!==user?.name){
        setLockInfo(status);
      }else{
        await API.lockVorgang(ev.id);
        setLockInfo(null);
      }
    }catch{setLockInfo(null);}
    // History laden
    try{const h=await API.json("/api/vorgaenge/"+ev.id+"/history");setEditHistory(h||[]);}catch{setEditHistory([]);}
  },[user]);
  const copyEvent=useCallback((ev)=>{setCurrentEventId(null);const e={...EMPTY_EVENT,...(ev.event||{}),auftragsnr:"",rechnungsnr:"",checklist:{}};setEvent(e);setDays((ev.days||Array.from({length:8},(_,i)=>mkDay(i+1))).map(d=>({...d,date:""})));setActiveDay(0);setTab("event");},[]);

  // LOGIN
  if(!user)return(
    <div style={{minHeight:"100vh",background:C.hellgrau,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT.sans}}>
      <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Open+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet"/>
      <div style={{width:440,padding:40}}>
        <div style={{textAlign:"center",marginBottom:32}}><BRKLogo size={80} full/><h1 style={{margin:"12px 0 4px",fontSize:20,fontWeight:800,color:C.schwarz}}>SanWD Gefahrenanalyse</h1><p style={{margin:0,fontSize:13,color:C.dunkelgrau}}>Bayerisches Rotes Kreuz · Bereitschaften</p></div>
        <Card accent={C.rot}><button onClick={()=>window.location.href="/auth/login"} style={{width:"100%",padding:"14px 20px",background:C.rot,border:"none",borderRadius:4,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:FONT.sans,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}><BRKLogo size={22}/>Mit BRK.id anmelden</button><p style={{textAlign:"center",fontSize:11,color:C.dunkelgrau,margin:"8px 0 0"}}>Single Sign-On über Keycloak / BRK.id</p></Card>
        
        
      </div>
    </div>
  );

  // MAIN APP
  return(
    <div style={{minHeight:"100vh",background:C.hellgrau,color:C.schwarz,fontFamily:FONT.sans}}>
      <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Open+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet"/>
      <div style={{height:4,background:C.rot}}/>
      <header style={{background:C.weiss,borderBottom:`1px solid ${C.mittelgrau}40`,padding:"10px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 4px #0001"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}><BRKLogo size={36} full customLogo={stammdaten.customLogo}/><div><div style={{fontSize:15,fontWeight:700,color:C.schwarz}}>Bayerisches Rotes Kreuz</div><div style={{fontSize:11,color:C.dunkelgrau}}>{bereitschaft.name} · Sanitätswachdienst</div></div></div>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          {saving&&<span style={{fontSize:11,color:"#1a7a3a"}}>💾 Speichert...</span>}
          {currentEventId&&!saving&&<span style={{fontSize:11,color:C.dunkelgrau,display:"flex",alignItems:"center",gap:6,background:"#f5f5f5",padding:"3px 10px",borderRadius:12,maxWidth:280,overflow:"hidden"}}>
            <span style={{color:"#27ae60"}}>✓</span>
            <span style={{fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{event.name||"Unbenannte Veranstaltung"}</span>
            {event.auftragsnr&&<span style={{color:C.rot,fontWeight:700,whiteSpace:"nowrap"}}>&nbsp;·&nbsp;{event.auftragsnr}</span>}
          </span>}
          {!currentEventId&&!saving&&tab!=="events"&&<span style={{fontSize:11,color:C.dunkelgrau,fontStyle:"italic"}}>Kein Vorgang geöffnet</span>}
          <div onClick={()=>setTab("settings")} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} title="Mein Profil"><div style={{width:30,height:30,borderRadius:15,background:C.rot,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff"}}>{user.name.charAt(0)}</div><div><div style={{fontSize:12,fontWeight:600}}>{user.name}</div><div style={{fontSize:10,color:C.dunkelgrau}}>{user.bereitschaft}{user.rolle==="admin"?" (Admin)":user.rolle==="bl"?" (BL)":""}</div></div></div>
          <Btn small variant="ghost" onClick={()=>window.location.href="/auth/logout"}>Abmelden</Btn>
        </div>
      </header>
      <nav style={{display:"flex",gap:1,padding:"0 12px",background:C.weiss,borderBottom:`1px solid ${C.mittelgrau}40`,overflowX:"auto"}}>{TABS.map(t=>(<button key={t.id} onClick={()=>{if(t.id==="events"){releaseLock();setCurrentEventId(null);setEvent({...EMPTY_EVENT});setDays(Array.from({length:8},(_,i)=>mkDay(i+1)));}setTab(t.id);}} style={{padding:"10px 14px",background:"none",border:"none",color:tab===t.id?C.rot:C.dunkelgrau,fontSize:12,fontWeight:tab===t.id?700:500,cursor:"pointer",display:"flex",alignItems:"center",gap:5,borderBottom:tab===t.id?`2px solid ${C.rot}`:"2px solid transparent",fontFamily:FONT.sans,whiteSpace:"nowrap"}}><span style={{fontSize:13}}>{t.icon}</span> {t.label}</button>))}</nav>

      <main style={{maxWidth:1100,margin:"0 auto",padding:"16px 14px"}}>

        {/* VORGÄNGE + ARCHIV */}
        {tab==="events"&&<VorgaengeListe bereitschaftCode={BEREITSCHAFTEN[stammdaten.bereitschaftIdx].code} user={user} onLoad={loadEvent} onNew={newEvent} onCopy={copyEvent} bereitschaft={bereitschaft} allBereitschaften={BEREITSCHAFTEN} toast={toast} showConfirm={showConfirm}/>}

        {/* VERANSTALTUNG */}
        {tab==="event"&&(<div>
          <LockBanner lockInfo={lockInfo} isOwner={lockInfo?.lockedBy===user?.name} onUnlock={async()=>{try{await API.unlockVorgang(currentEventId);setLockInfo(null);}catch{}}}/>
          <StatusBanner angebotVersendet={event?.checklist?.angebotVersendet} abgeschlossen={event?.checklist?.abgeschlossen} onUnlock={async(begruendung)=>{await API.entsperrenVorgang(currentEventId,begruendung);updateEvent("checklist",{...event.checklist,angebotVersendet:false,abgeschlossen:false});}}/>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14}}>
            <div style={{position:"relative"}}>
              {(isLocked||isEditLocked)&&<div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"rgba(255,255,255,0.55)",zIndex:10,borderRadius:8,pointerEvents:"all"}}/>}
              <Card title="Auftrag" accent={C.rot} sub={event.auftragsnr?`Nr. ${event.auftragsnr}`:"Noch keine Nummer"} action={<div style={{display:"flex",gap:6}}><Btn small onClick={generateNr} icon="🔢">Nr. generieren</Btn><Btn small variant="success" onClick={saveEvent} icon="💾" disabled={isLocked}>Speichern</Btn></div>}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 16px"}}>
                  <Sel label="Bereitschaft" value={stammdaten.bereitschaftIdx} onChange={v=>updateStamm("bereitschaftIdx",v)} options={BEREITSCHAFTEN.map((b,i)=>({value:i,label:`${b.code} — ${b.name}`}))}/>
                  <Inp label="Auftragsnummer" value={event.auftragsnr} onChange={v=>updateEvent("auftragsnr",v)} placeholder="Auto-generiert"/>
                  <Inp label="Rechnungsnummer" value={event.rechnungsnr} onChange={v=>updateEvent("rechnungsnr",v)}/>
                </div>
                <div style={{display:"flex",gap:12,alignItems:"center",padding:"6px 10px",background:C.hellgrau,borderRadius:4,fontSize:11,color:C.dunkelgrau}}>
                  <span>Nächste Nr:</span>
                  <input type="number" min={1} value={laufendeNr} onChange={e=>{const v=parseInt(e.target.value)||1;setLaufendeNr(v);if(user)API.incrementCounter(year).catch(()=>{})}} style={{width:60,padding:"2px 6px",border:`1px solid ${C.mittelgrau}`,borderRadius:3,fontSize:12,fontFamily:FONT.mono}}/>
                  <span style={{color:C.bgrau}}>Speicherung: {bereitschaft.code} / {year}</span>
                </div>
              </Card>
              <Card title="Veranstaltung" accent={isLocked?"#a5d6a7":"#1a7a3a"}>
                <Inp label="Name der Veranstaltung" value={event.name} onChange={v=>updateEvent("name",v)} disabled={isLocked}/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
                  <Inp label="Veranstaltungsort" value={event.ort} onChange={v=>updateEvent("ort",v)} disabled={isLocked}/>
                  <AddressAutocomplete label="Adresse inkl. Hausnummer (z.B. Karl-Konrad-Str. 3)" value={event.adresse} onChange={v=>updateEvent("adresse",v)} onResult={s=>{updateEvent("coords",{lat:s.lat,lng:s.lng});if(s.w3w)updateEvent("w3w",s.w3w);updateEvent("addrImprecise",!!s.imprecise);}}/>
                </div>
                <LeafletMap coords={event.coords} w3w={event.w3w} onChange={r=>{updateEvent("coords",{lat:r.lat,lng:r.lng});if(r.address)updateEvent("adresse",r.address);updateEvent("addrImprecise",false);}} onW3W={w=>updateEvent("w3w",w)}/>
                {event.addrImprecise&&<div style={{background:"#fff3cd",border:"1px solid #ffc107",borderRadius:4,padding:"8px 12px",marginTop:6,fontSize:12,color:"#856404",display:"flex",alignItems:"center",gap:8}}>⚠️ <span>Hausnummer konnte nicht exakt aufgelöst werden. <strong>Bitte Pin auf der Karte zur genauen Position verschieben</strong> – der what3words-Code wird automatisch aktualisiert.</span></div>}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px",marginTop:10}}>
                  <Chk label="Kfz-Stellplatz vorhanden" checked={event.kfzStellplatz} onChange={v=>{if(!isLocked)updateEvent("kfzStellplatz",v)}}/>
                  <Chk label="Sanitätsraum vorhanden" checked={event.sanitaetsraum} onChange={v=>{if(!isLocked)updateEvent("sanitaetsraum",v)}}/>
                  <Chk label="Stromanschluss vorhanden" checked={event.strom} onChange={v=>{if(!isLocked)updateEvent("strom",v)}}/>
                  <Chk label="Verpflegung durch Veranstalter" checked={event.verpflegung} onChange={v=>{if(!isLocked)updateEvent("verpflegung",v)}}/>
                </div>
                {!event.verpflegung&&<div style={{padding:"8px 12px",background:"#fff3cd",border:"1px solid #ffc10744",borderRadius:4,fontSize:12,color:"#856404",marginTop:6}}>Verpflegungspauschale: {stammdaten.rates.verpflegung}€/Person/8h wird automatisch berechnet</div>}
                <Card accent="#ff6f00"><div style={{fontSize:13,fontWeight:700,marginBottom:8,color:"#e65100"}}>✉ Pauschalangebot</div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <input type="checkbox" checked={event.pauschalangebot>0} onChange={e=>updateEvent("pauschalangebot",e.target.checked?Math.round(totalCosts):0)}/>
                  <span style={{fontSize:12}}>Pauschalpreis im Angebot verwenden</span>
                </div>
                {event.pauschalangebot>0&&<div style={{marginTop:8,display:"flex",alignItems:"center",gap:12}}>
                  <div><div style={{fontSize:11,color:"#666",marginBottom:2}}>Pauschalpreis (€)</div><input type="number" value={event.pauschalangebot} onChange={e=>updateEvent("pauschalangebot",parseFloat(e.target.value)||0)} style={{width:120,padding:"6px 8px",border:"1px solid #ccc",borderRadius:4,fontFamily:FONT.mono,fontSize:14,fontWeight:700}}/></div>
                  <div style={{fontSize:11,color:"#666",marginTop:14}}>Kalkulation: {f$(totalCosts)}<br/>Differenz: <span style={{color:event.pauschalangebot<totalCosts?"#c62828":"#2e7d32",fontWeight:600}}>{f$(event.pauschalangebot-totalCosts)}</span></div>
                </div>}
                </Card>
              </Card>

              <Card title="Veranstalter / Rechnungsempfänger" accent={C.dunkelblau}>
                {kunden.length>0&&<div style={{marginBottom:10}}>
                  <label style={{fontSize:11,fontWeight:600,color:C.dunkelgrau,display:"block",marginBottom:3}}>Aus Kundenstamm wählen</label>
                  <select style={{width:"100%",padding:"7px 10px",border:`1px solid ${C.mittelgrau}80`,borderRadius:4,fontSize:13,fontFamily:FONT.sans,background:C.weiss,color:C.schwarz}} value="" onChange={e=>{const k=kunden.find(c=>c.name===e.target.value);if(k){setEvent(p=>({...p,veranstalter:k.name,ansprechpartner:k.ansprechpartner,telefon:k.telefon,email:k.email,rechnungsempfaenger:k.rechnungsempfaenger||k.name,reStrasse:k.reStrasse,rePlzOrt:k.rePlzOrt,anrede:k.anrede||p.anrede}));}}}>
                    <option value="">— Kunde wählen —</option>
                    {kunden.sort((a,b)=>a.name.localeCompare(b.name)).map((k,i)=><option key={i} value={k.name}>{k.name}{k.kundennummer?` #${k.kundennummer}`:""}{k.ansprechpartner?` (${k.ansprechpartner})`:""}</option>)}
                  </select>
                  <div style={{fontSize:10,color:C.bgrau,marginTop:2}}>💡 Kundendaten werden automatisch beim Speichern aktualisiert</div>
                </div>}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
                  <Inp label="Veranstalter" value={event.veranstalter} onChange={v=>updateEvent("veranstalter",v)}/>
                  <Inp label="Rechnungsempfänger" value={event.rechnungsempfaenger} onChange={v=>updateEvent("rechnungsempfaenger",v)}/>
                  <Inp label="Ansprechpartner" value={event.ansprechpartner} onChange={v=>updateEvent("ansprechpartner",v)}/>
                  <Inp label="Telefon" value={event.telefon} onChange={v=>updateEvent("telefon",v)}/>
                  <Inp label="E-Mail" value={event.email} onChange={v=>updateEvent("email",v)}/>
                  <Inp label="Anrede" value={event.anrede} onChange={v=>updateEvent("anrede",v)}/>
                  <Inp label="Straße" value={event.reStrasse} onChange={v=>updateEvent("reStrasse",v)}/>
                  <Inp label="PLZ / Ort" value={event.rePlzOrt} onChange={v=>updateEvent("rePlzOrt",v)}/>
                </div>
                <div style={{marginTop:10}}>
                  <label style={{display:"block",fontSize:11,color:C.dunkelgrau,marginBottom:3,fontWeight:600,fontFamily:FONT.sans}}>Bemerkung (Angebot)</label>
                  <textarea value={event.bemerkung||""} onChange={e=>updateEvent("bemerkung",e.target.value)} rows={3} style={{width:"100%",padding:"8px 10px",border:`1px solid ${C.mittelgrau}`,borderRadius:4,fontSize:13,fontFamily:FONT.sans,color:C.schwarz,background:C.weiss,resize:"vertical",boxSizing:"border-box"}} placeholder="Wird im Angebot unter der Kostenaufstellung angezeigt..."/>
                  {event.verpflegung&&!( event.bemerkung||"").includes("Verpflegung wird")&&<button onClick={()=>{const prefix="Verpflegung wird durch den Veranstalter bereitgestellt.";updateEvent("bemerkung",(event.bemerkung?prefix+"\n"+event.bemerkung:prefix));}} style={{marginTop:4,padding:"3px 10px",fontSize:11,background:C.hellgrau,border:`1px solid ${C.mittelgrau}`,borderRadius:3,cursor:"pointer",fontFamily:FONT.sans}}>+ Verpflegungshinweis einfügen</button>}
                </div>
              </Card>
            </div>
            {/* RIGHT COLUMN: Checkliste */}
            <div>
              <Card title="Checkliste" accent="#d4920a" sub="Vorgangs-Status">
                <VorgangChecklist checklist={event.checklist||{}} onChange={updateChecklist} eventDate={activeDays[activeDays.length-1]?.date||activeDays[0]?.date}/>
              </Card>
              <Card title="Zusammenfassung">
                <div style={{display:"grid",gap:6}}>
                  <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12}}><span style={{color:C.dunkelgrau}}>Aktive Tage</span><span style={{fontWeight:700}}>{activeDays.length}</span></div>
                  <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12}}><span style={{color:C.dunkelgrau}}>Gesamtkosten</span><span style={{fontWeight:700,color:C.rot,fontFamily:FONT.mono}}>{f$(totalCosts)}</span></div>
                  {event.w3w&&<div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12}}><span style={{color:C.dunkelgrau}}>what3words</span><span style={{fontWeight:600,color:C.rot,fontSize:11}}>{event.w3w}</span></div>}
                </div>
                <div style={{borderTop:"1px solid "+C.mittelgrau+"40",marginTop:10,paddingTop:10}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.dunkelgrau,marginBottom:6}}>4-Augen-Prinzip</div>
                  {(()=>{const maxTP=Math.max(...dayCalcs.map(d=>d.tp),0);const auth=getSignAuthority(maxTP);return(<div style={{fontSize:12,lineHeight:1.6}}>
                    <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.bgrau}}>Max. Stellen:</span><strong>{maxTP}</strong></div>
                    <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.bgrau}}>Erstellt:</span><strong>{auth.erstellt}</strong></div>
                    <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.bgrau}}>Kontrolle:</span><strong style={{color:C.rot}}>{auth.kontrolle}</strong></div>
                  </div>);})()}
                </div>
              </Card>
              {currentEventId&&editHistory.length>0&&<HistoryWidget history={editHistory}/>}
            </div>
          </div>
        </div>)}

        {/* TAGE & ANALYSE */}
        {tab==="days"&&(<div>
          <LockBanner lockInfo={lockInfo} isOwner={lockInfo?.lockedBy===user?.name} onUnlock={async()=>{try{await API.unlockVorgang(currentEventId);setLockInfo(null);}catch{}}}/>
          <StatusBanner angebotVersendet={event?.checklist?.angebotVersendet} abgeschlossen={event?.checklist?.abgeschlossen} onUnlock={async(begruendung)=>{await API.entsperrenVorgang(currentEventId,begruendung);updateEvent("checklist",{...event.checklist,angebotVersendet:false,abgeschlossen:false});}}/>
          <div style={{display:"flex",gap:4,marginBottom:12,flexWrap:"wrap"}}>{days.map((d,i)=>(<div key={i} style={{display:"inline-flex",alignItems:"center",gap:0}}>
              <button onClick={()=>{if(!(isLocked||isEditLocked)&&!d.active)updateDay(i,"active",true);if(d.active)setActiveDay(i);}} style={{padding:"6px 14px",borderRadius:d.active&&i>0?"4px 0 0 4px":4,border:`1px solid ${d.active?(activeDay===i?C.rot:C.mittelgrau):"#e0e0e0"}`,background:activeDay===i?`${C.rot}11`:d.active?C.weiss:C.hellgrau,color:d.active?C.schwarz:C.bgrau,cursor:d.active?"pointer":"default",fontSize:12,fontWeight:activeDay===i?700:500,fontFamily:FONT.sans,borderRight:d.active&&i>0?"none":undefined,opacity:!d.active&&(isLocked||isEditLocked)?0.4:1}}>Tag {i+1}{d.active&&d.date&&<span style={{marginLeft:4,fontSize:10,opacity:0.6}}>{fDate(d.date)}</span>}</button>
              {d.active&&i>0&&!(isLocked||isEditLocked)&&<button onClick={(e)=>{e.stopPropagation();updateDay(i,"active",false);if(activeDay===i)setActiveDay(0);}} title="Tag deaktivieren" style={{padding:"6px 8px",borderRadius:"0 4px 4px 0",border:`1px solid ${activeDay===i?C.rot:C.mittelgrau}`,borderLeft:"none",background:activeDay===i?`${C.rot}11`:C.weiss,color:C.rot,cursor:"pointer",fontSize:11,fontWeight:700,lineHeight:1}}>✕</button>}
            </div>))}</div>
          <div style={{position:"relative"}}>
          {(isLocked||isEditLocked)&&<div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"rgba(255,255,255,0.55)",zIndex:10,borderRadius:8,pointerEvents:"all"}}/>}
          {(()=>{const i=activeDay,d=days[i];if(!d.active)return<Card><p style={{color:C.dunkelgrau,textAlign:"center",padding:32}}>Tag {i+1} nicht aktiv. <Btn small onClick={()=>updateDay(i,"active",true)}>Aktivieren</Btn></p></Card>;
            const calc=calcDay(d,stammdaten.rates,event.verpflegung);
            return(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div>
                <Card title={`Tag ${i+1}`} accent={C.mittelblau}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 10px"}}><Inp label="Datum" type="date" value={d.date} onChange={v=>updateDay(i,"date",v)}/><Inp label="Beginn" type="time" value={d.startTime} onChange={v=>updateDay(i,"startTime",v)}/><Inp label="Ende" type="time" value={d.endTime} onChange={v=>updateDay(i,"endTime",v)}/></div>
                  <div style={{padding:"5px 10px",background:C.hellgrau,borderRadius:4,fontSize:12}}>Einsatzdauer: <strong style={{color:C.mittelblau}}>{calc.h.toFixed(2).replace('.',',')} Stunden</strong>{!event.verpflegung&&<span style={{marginLeft:10,color:"#856404"}}>Verpfl.: {calc.vB}×8h</span>}</div>
                </Card>
                <Card title="Besucher & Risiko" accent="#d4920a">
                  <Inp label="Max. Besucher (Auflagen)" type="number" min={0} value={d.auflagen} onChange={v=>updateDay(i,"auflagen",v)}/>
                  <Chk label="Geschlossene Anlage" checked={d.geschlossen} onChange={v=>updateDay(i,"geschlossen",v)}/>
                  <Inp label="Erwartete Besucherzahl" type="number" min={0} value={d.besucher} onChange={v=>updateDay(i,"besucher",v)}/>
                  <Sel label="Art der Veranstaltung" value={d.eventTypeId} onChange={v=>updateDay(i,"eventTypeId",v)} options={EVENT_TYPES.map(e=>({value:e.id,label:`${e.name} (×${e.factor})`}))}/>
                  <Inp label="Prominente" type="number" min={0} value={d.prominente} onChange={v=>updateDay(i,"prominente",v)}/>
                  <Chk label="Polizeiliche Erkenntnisse" checked={d.polizeiRisiko} onChange={v=>updateDay(i,"polizeiRisiko",v)}/>
                </Card>
              </div>
              <div>
                <Card title="Gefahrenanalyse" accent={C.rot}><Gauge value={calc.risk.total}/>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:10}}>{[["Auflagen",calc.risk.ap],["Fläche",calc.risk.fp],["Besucher",calc.risk.bp],["Zwischensum.",calc.risk.zw],["Faktor","×"+calc.risk.factor],["Risiko",calc.risk.ro.toFixed(1)],["Prominente","+"+calc.risk.pp],["Polizei","+"+calc.risk.pol]].map(([l,v])=>(<div key={l} style={{display:"flex",justifyContent:"space-between",padding:"3px 8px",background:C.hellgrau,borderRadius:4,fontSize:11}}><span style={{color:C.dunkelgrau}}>{l}</span><span style={{fontWeight:600,fontFamily:FONT.mono}}>{v}</span></div>))}</div>
                </Card>
                <Card title="Ergebnis der Berechnung" accent="#1a7a3a">
                  <div style={{marginBottom:6,fontSize:12}}>Gesamtrisiko: <strong style={{color:C.rot}}>{calc.risk.total.toFixed(1)} Punkte</strong></div>
                  <div style={{fontSize:11,color:C.dunkelgrau,marginBottom:6}}>Eingesetzte Kräfte{(d.oHelfer!=null||d.oKtw!=null||d.oRtw!=null||d.oAerzte!=null||d.oGktw!=null)?" (manuell angepasst)":""}:</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
                    {[[calc.hc,"Helfer",d.oHelfer,calc.rec.helfer,"🧑‍⚕️"],[calc.kc,"KTW",d.oKtw,calc.rec.ktw,"🚑"],[calc.rc,"RTW",d.oRtw,calc.rec.rtw,"🚒"],[calc.ac,"Notarzt",d.oAerzte,0,"👨‍⚕️"],[calc.gc,"GKTW",d.oGktw,calc.rec.gktw,"🚐"],[null,calc.el==="im Team"?"keine stabsm. EL":calc.el,null,null,"📋"]].map(([val,label,ov,rec,icon],idx)=>{const isOv=ov!=null;return(<div key={idx} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px",background:isOv?"#fff3cd":C.hellgrau,borderRadius:4,fontSize:11}}><span>{icon}</span><span style={{fontWeight:600,color:isOv?"#e65100":undefined}}>{val!=null?`${val} ${label}`:label}</span>{isOv&&<span style={{fontSize:9,color:C.bgrau,marginLeft:"auto"}}>(empf. {rec})</span>}</div>);})}
                  </div>
                  <div style={{fontSize:10,color:"#c00",marginTop:6,fontWeight:600}}>Fahrzeugbesatzungen gelten grundsätzlich zuzüglich zum angegebenen Personalbedarf!</div>
                  <div style={{fontSize:9,color:C.bgrau,marginTop:8,lineHeight:1.3,fontStyle:"italic"}}>Diese Berechnung basiert auf dem "Maurer-Algorithmus" (nach Dipl.Ing. Klaus Maurer, Stand 2010). Die hier angegebenen Richtwerte haben lediglich empfehlenden Charakter und müssen an die örtlichen Verhältnisse unter Berücksichtigung der Erfahrungswerte früherer, vergleichbarer Veranstaltungen angepasst werden.</div>
                </Card>
                <Card title="Personal" accent="#1a7a3a">
                  {showOverrides?(<div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 6px"}}>
                      {[["Helfer","oHelfer",calc.rec.helfer],["KTW","oKtw",calc.rec.ktw],["RTW","oRtw",calc.rec.rtw],["Ärzte","oAerzte",0],["GKTW","oGktw",calc.rec.gktw],["EL-KFZ","oElKfz",calc.rec.elKfz],["SEG","oSeg",0],["MTW","oMtw",0],["Zelt","oZelt",0]].map(([l,k,rec])=><Inp key={k} small label={`${l} (empf. ${rec})`} type="number" min={0} value={d[k]!=null?d[k]:rec} onChange={v=>updateDay(i,k,v===""?null:v)}/>)}
                    </div>
                    <div style={{display:"flex",gap:6,marginTop:10}}>
                      <Btn small variant="success" onClick={()=>setShowOverrides(false)}>✓ Fertig</Btn>
                      <Btn small onClick={()=>{setDays(p=>p.map((dd,j)=>j===i?{...dd,oHelfer:null,oKtw:null,oRtw:null,oAerzte:null,oGktw:null,oElKfz:null,oSeg:null,oMtw:null,oZelt:null}:dd));setShowOverrides(false);}}>↺ Zurücksetzen</Btn>
                    </div>
                  </div>):(<div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                      {[["Helfer",calc.hc,"oHelfer"],["KTW",calc.kc,"oKtw"],["RTW",calc.rc,"oRtw"],["NEF",calc.ac,"oAerzte"],["GKTW",calc.gc,"oGktw"],["EL",calc.el,null]].map(([l,v,k])=>{const isOv=k&&d[k]!=null;return(<div key={l} style={{display:"flex",justifyContent:"space-between",padding:"4px 8px",background:isOv?"#fff3cd":C.hellgrau,borderRadius:4,fontSize:12}}><span style={{color:C.dunkelgrau}}>{l}</span><span style={{fontWeight:700,color:isOv?"#e65100":"#1a7a3a",fontFamily:FONT.mono}}>{v}</span></div>);})}
                      {calc.ec>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"4px 8px",background:"#fff3cd",borderRadius:4,fontSize:12}}><span style={{color:C.dunkelgrau}}>EL-KFZ</span><span style={{fontWeight:700,color:"#e65100",fontFamily:FONT.mono}}>{calc.ec}</span></div>}
                      {calc.sc>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"4px 8px",background:"#fff3cd",borderRadius:4,fontSize:12}}><span style={{color:C.dunkelgrau}}>SEG</span><span style={{fontWeight:700,color:"#e65100",fontFamily:FONT.mono}}>{calc.sc}</span></div>}
                      {calc.mc>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"4px 8px",background:"#fff3cd",borderRadius:4,fontSize:12}}><span style={{color:C.dunkelgrau}}>MTW</span><span style={{fontWeight:700,color:"#e65100",fontFamily:FONT.mono}}>{calc.mc}</span></div>}
                      {calc.zc>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"4px 8px",background:"#fff3cd",borderRadius:4,fontSize:12}}><span style={{color:C.dunkelgrau}}>Zelt</span><span style={{fontWeight:700,color:"#e65100",fontFamily:FONT.mono}}>{calc.zc}</span></div>}
                    </div>
                    <Btn small variant="secondary" onClick={()=>setShowOverrides(true)} style={{marginTop:10}}>✎ Anpassen</Btn>
                  </div>)}
                </Card>
                <Card><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{color:C.dunkelgrau}}>Kosten Tag {i+1}</span><span style={{fontSize:22,fontWeight:800,color:C.rot,fontFamily:FONT.mono}}>{f$(calc.total)}</span></div></Card>
              </div>
            </div>);
          })()}
        </div></div>)}

        {/* KOSTEN */}
        {tab==="costs"&&(<div><LockBanner lockInfo={lockInfo} isOwner={lockInfo?.lockedBy===user?.name} onUnlock={async()=>{try{await API.unlockVorgang(currentEventId);setLockInfo(null);}catch{}}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14}}><Card><Stat label="Personal" value={dayCalcs.reduce((s,d)=>s+d.tp,0)}/></Card><Card><Stat label="Stunden" value={dayCalcs.reduce((s,d)=>s+d.h,0)} color="#1a7a3a"/></Card><Card><Stat label="Gesamtkosten" value={f$(totalCosts)} color={C.rot}/></Card></div>
          <Card title="Kostenübersicht" accent={C.mittelblau}>
            <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr style={{borderBottom:`2px solid ${C.mittelgrau}40`}}><th style={{textAlign:"left",padding:"6px 10px",color:C.dunkelgrau}}>Position</th>{activeDays.map((d,i)=><th key={i} style={{textAlign:"right",padding:"6px 10px",color:C.dunkelgrau}}>Tag {d.id}</th>)}<th style={{textAlign:"right",padding:"6px 10px",color:C.rot,fontWeight:700}}>Gesamt</th></tr></thead>
              <tbody>{[{l:"Helfer",k:"cH"},{l:"KTW",k:"cK"},{l:"RTW",k:"cR"},{l:"GKTW",k:"cG"},{l:"EL",k:"cE"},{l:"EL-KFZ",k:"cEK"},{l:"Zelt",k:"cZ"},...(!event.verpflegung?[{l:"Verpflegung",k:"cV",hl:true}]:[])].map((r,ri)=>(<tr key={ri} style={{borderBottom:`1px solid ${C.hellgrau}`}}><td style={{padding:"5px 10px",color:r.hl?"#856404":C.dunkelgrau}}>{r.l}</td>{dayCalcs.map((dc,di)=><td key={di} style={{textAlign:"right",padding:"5px 10px",fontFamily:FONT.mono,fontSize:11}}>{dc[r.k]>0?f$(dc[r.k]):"n/a"}</td>)}<td style={{textAlign:"right",padding:"5px 10px",fontWeight:600,fontFamily:FONT.mono,fontSize:11}}>{dayCalcs.reduce((s,dc)=>s+dc[r.k],0)>0?f$(dayCalcs.reduce((s,dc)=>s+dc[r.k],0)):"n/a"}</td></tr>))}
                <tr style={{borderTop:`2px solid ${C.rot}`}}><td style={{padding:"8px 10px",fontWeight:700}}>Summe</td>{dayCalcs.map((dc,di)=><td key={di} style={{textAlign:"right",padding:"8px 10px",fontWeight:700,fontFamily:FONT.mono,color:C.rot}}>{f$(dc.total)}</td>)}<td style={{textAlign:"right",padding:"8px 10px",fontWeight:800,fontSize:14,fontFamily:FONT.mono,color:C.rot}}>{f$(totalCosts)}</td></tr>
              </tbody></table></div>
          </Card>
        </div>)}

        {/* DOKUMENTE */}
        {tab==="pdf"&&(<div>
          <Card accent={C.rot}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {["gefahren","angebot","vertrag","aab","ils","einsatzprotokoll"].map(v=>(<Btn key={v} variant={pdfView===v?"primary":"secondary"} small onClick={()=>setPdfView(v)}>{{gefahren:"Gefahrenanalyse",angebot:"Angebot",vertrag:"Vertrag",aab:"AAB",ils:"ILS Anmeldung",einsatzprotokoll:"Einsatzprotokoll"}[v]}</Btn>))}
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                {(pdfView==="gefahren")&&<Btn onClick={async()=>{if(!currentEventId){toast("Bitte zuerst speichern","warning");return;}setGefahrenPending(true);try{const blob=await API.generateGefahrenPDF(currentEventId,dayCalcs,activeDays);const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=(event.auftragsnr||"Gefahren").replace(/[^a-zA-Z0-9_-]/g,"_")+"_Gefahrenanalyse.pdf";a.click();}catch(e){toast(e.message,"error");}finally{setGefahrenPending(false);}}} icon="⬇️" variant="blue" disabled={gefahrenPending}>{gefahrenPending?"Erstelle PDF...":"PDF herunterladen"}</Btn>}
                {(pdfView==="angebot")&&<Btn onClick={async()=>{if(!currentEventId){toast("Bitte zuerst speichern","warning");return;}setAngebotPending(true);try{const blob=await API.generateAngebotPDF(currentEventId,dayCalcs,totalCosts,activeDays);const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=(event.auftragsnr||"Angebot").replace(/[^a-zA-Z0-9_-]/g,"_")+"_Angebot.pdf";a.click();}catch(e){toast(e.message,"error");}finally{setAngebotPending(false);}}} icon="⬇️" variant="blue" disabled={angebotPending}>{angebotPending?"Erstelle PDF...":"PDF herunterladen"}</Btn>}
                {(pdfView==="aab")&&<Btn onClick={async()=>{if(!currentEventId){toast("Bitte zuerst speichern","warning");return;}setAabPending(true);try{const blob=await API.generateAABPDF(currentEventId);const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=(event.auftragsnr||"AAB").replace(/[^a-zA-Z0-9_-]/g,"_")+"_AAB.pdf";a.click();}catch(e){toast(e.message,"error");}finally{setAabPending(false);}}} icon="⬇️" variant="blue" disabled={aabPending}>{aabPending?"Erstelle PDF...":"AAB herunterladen"}</Btn>}
                <Btn onClick={async()=>{if(!currentEventId){toast("Bitte zuerst Vorgang speichern","warning");return;}setMappePending(true);await saveEvent();try{const blob=await API.generateMappePDF(currentEventId,dayCalcs,totalCosts,activeDays);const url=URL.createObjectURL(blob);const a=document.createElement("a");const nr=(event.auftragsnr||"").replace(/[^a-zA-Z0-9_-]/g,"_");const name=(event.name||"Veranstaltung").substring(0,30).replace(/ /g,"_");a.href=url;a.download=nr+"_"+name+"_Angebotsmappe.pdf";a.click();}catch(e){toast("Fehler bei Angebotsmappe: "+e.message,"error");}finally{setMappePending(false);}}} icon="📦" variant="success" disabled={mappePending}>{mappePending?"Erstelle PDF...":"Angebotsmappe (PDF)"}</Btn>
              </div>
            </div>
          </Card>
          <div ref={printRef} style={{background:"#fff",borderRadius:8,overflow:"hidden"}}>
            {pdfView==="gefahren"&&activeDays.map((d,i)=><GefahrenPDF key={i} day={d} calc={dayCalcs[i]} eventData={event} stammdaten={stammdaten} dayNum={i+1}/>)}
            {pdfView==="angebot"&&<div data-print="angebot"><AngebotPDF event={event} dayCalcs={dayCalcs} totalCosts={totalCosts} stammdaten={stammdaten} activeDays={activeDays} bereitschaft={bereitschaft} user={user}/></div>}
            {pdfView==="vertrag"&&<Card accent={C.dunkelblau}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><span style={{fontSize:20}}>📄</span><div><div style={{fontSize:14,fontWeight:700,color:C.dunkelblau}}>Vereinbarung</div><div style={{fontSize:11,color:C.dunkelgrau}}>Serverseitig generiertes PDF mit Seitenzahlen</div></div></div><Btn variant="primary" onClick={async()=>{if(!currentEventId){toast("Bitte zuerst Vorgang speichern","warning");return;}setVertragPending(true);await saveEvent();try{const r=await fetch("/api/pdf/vertrag/"+currentEventId,{method:"POST",credentials:"include"});if(!r.ok){const e=await r.json();toast(e.error||"Fehler","error");return;}const blob=await r.blob();const url=URL.createObjectURL(blob);window.open(url,"_blank");}catch(e){toast(e.message,"error");}finally{setVertragPending(false);}}} disabled={vertragPending}>{vertragPending?"Erstelle PDF...":"Vertrag-PDF generieren und öffnen"}</Btn></Card>}
            {pdfView==="aab"&&<div data-print="aab"><AABPDF stammdaten={stammdaten} bereitschaft={bereitschaft}/></div>}
            {pdfView==="ils"&&<ILSPreview event={event} days={days} stammdaten={stammdaten} user={user} updateEvent={updateEvent} currentEventId={currentEventId} saveEvent={saveEvent} toast={toast}/>}
            {pdfView==="einsatzprotokoll"&&<Card accent={C.dunkelblau}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <span style={{fontSize:20}}>🖨️</span>
                <div><div style={{fontSize:14,fontWeight:700,color:C.dunkelblau}}>Einsatzprotokoll</div>
                <div style={{fontSize:11,color:C.dunkelgrau}}>Helferausdruck für den Einsatz · Pro Tag oder Gesamt</div></div>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {(days||[]).filter(d=>d.active!==false).map((d,i)=>(
                  <Btn key={i} variant="primary" onClick={async()=>{if(!currentEventId){toast("Bitte zuerst Vorgang speichern","warning");return;}await saveEvent();try{const blob=await API.getEinsatzprotokollPDF(currentEventId,i);const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;const nr=(event.auftragsnr||"EP").replace(/[^a-zA-Z0-9_-]/g,"_");a.download=nr+"_Einsatzprotokoll_Tag"+(i+1)+".pdf";a.click();}catch(e){toast(e.message,"error");}}} icon="🖨️">
                    Einsatzprotokoll Tag {d.id||i+1}{d.date?" ("+new Date(d.date).toLocaleDateString("de-DE")+")":""}
                  </Btn>
                ))}
              </div>
            </Card>}
            
          </div>
        </div>)}

        {/* KUNDEN */}
        {tab==="kunden"&&<KundenManager kunden={kunden} setKunden={setKunden} user={user} toast={toast} showConfirm={showConfirm}/>}

        {/* STAMMDATEN */}
        {tab==="releases"&&(
        <div style={{maxWidth:700,margin:"0 auto"}}>
          <div style={{background:C.weiss,borderRadius:8,border:`1px solid ${C.mittelgrau}40`,overflow:"hidden",marginBottom:16}}>
            <div style={{background:C.rot,color:"#fff",padding:"14px 20px",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:20}}>🆕</span>
              <div><div style={{fontWeight:700,fontSize:16}}>SanWD Changelog</div><div style={{fontSize:11,opacity:0.85}}>Versionshistorie und Änderungen</div></div>
            </div>
            {[
              {v:"v6.7",d:"27.02.2026",c:[
                "Toast-Notifications: Native Browser-Alerts durch eigenes Notification-System im BRK-Design ersetzt",
                "Bestätigungsdialoge: Native confirm() durch modale ConfirmDialogs mit Danger/Default-Variante ersetzt",
                "Personal Inline-Editing: Direkte Bearbeitung in der Personal-Card statt separatem Override-Bereich",
                "Personal Anzeige: Überschriebene Werte gelb markiert mit (empf. X) Hinweis",
                "Ergebnis-Card: Zeigt tatsächliche statt nur empfohlene Werte, mit manuell-angepasst Markierung",
                "Zurücksetzen-Button: Alle Personal-Overrides eines Tages mit einem Klick auf Empfehlung zurücksetzen",
                "Auto-Save Lock-Fix: Kein Speichern-Fehlgeschlagen mehr bei gesperrten Vorgängen",
                "Tage-Tabs Readonly: Tag-Auswahl bei gesperrten Vorgängen wieder anklickbar",
                "ILS-Vorschau: Überflüssige Felder (Anmeldung Art, Zeitraum) entfernt",
                "ILS-Vorschau: Info-Zeile (ILS auszufüllen) entfernt, E-Mail/Fax/1h-Hinweis prominenter",
                "Angebot-Preview: Tel./Fax/Mobil Kürzel vor Rufnummern ergänzt",
                "Seitenränder: Alle Dokumente einheitlich 12mm links/rechts (Frontend + Backend)",
              ]},
              {v:"v6.6",d:"26.02.2026",c:[
                "Papierkorb: Soft-Delete statt Hard-Delete – gelöschte Vorgänge 60 Tage wiederherstellbar",
                "Papierkorb: Modal in Vorgangsliste, Wiederherstellen für alle, Endgültig löschen nur Admin",
                "Papierkorb: Auto-Cleanup täglich + beim Serverstart (>60 Tage endgültig gelöscht)",
                "ILS-Anmeldung: Download mit Dateiname Auftragsnr_ILS-Anmeldung_Tag1.pdf",
                "Einsatzprotokoll: Serverseitige PDF-Generierung pro Tag",
                "Checkliste: +3 neue Items (Angebot signiert, ILS-Anmeldung, Einsatzprotokoll gedruckt)",
                "Gefahrenanalyse: Serverseitige PDF-Generierung statt Browser-Druck",
                "Adress-Autocomplete: Hausnummer korrekt übernommen, HERE Geocoding Fallback",
                "Warnung bei ungenauer Adressauflösung: Pin manuell verschieben",
                "Berechnung: 15-Minuten-Takt statt volle Stunden (Viertelstunden-Aufrundung)",
                "AAB: Abrechnungstext an Viertelstunden-Takt angepasst",
                "Feedback-System: Direktes Ticket an Zammad (Bug/Feature-Request)",
                "4-Augen-Prinzip: Planungsgrößen-Vorschlag in Zusammenfassung",
                "Dateisperre: Gleichzeitige Bearbeitung verhindert (Lock + Heartbeat)",
                "Checkliste: Angebot-Status nur über Entsperren-Dialog deaktivierbar",
                "Schreibschutz: Formularfelder ausgegraut bei versendetem Angebot",
                "Emergency-Login für Admin-Zugang bei Keycloak-Ausfall",
                "Persistenter Session-Store (SQLite) gegen Login-Verlust bei Restart",
                "ILS Rückrufnummer: Mobilnummer des Users statt Bereitschafts-Telefon",
                "Infrastruktur: Einheitliches deploy.sh (Build + Deploy in einem Schritt)",
                "Beginn erweiterter Testbetrieb in den Bereitschaften",
              ]},
              {v:"v6.5",d:"25.02.2026",c:[
                "Interaktive Karte (Leaflet): dauerhaft sichtbar, Klick setzt Pin mit Koordinaten + w3w + Reverse-Geocode",
                "Karten-Pin per Drag verschiebbar für Feinpositionierung",
                "Adresssuche fliegt zur Position auf der Karte",
                "Neuer Tab: Kundenverwaltung mit Anlegen, Bearbeiten, Löschen",
                "CSV-Import für HiOrg-Firmendaten (Semikolon-Format, automatisches Mapping)",
                "Kundennummer + Bemerkung als neue Felder",
                "Unterschrift ins Benutzerprofil verschoben (nicht mehr pro Vorgang)",
                "Unterschrift per Zeichenpad oder Bild-Upload (PNG/JPG/SVG)",
                "PDF nutzt immer Daten des aktuellen Bearbeiters (Name, Titel, Ort, Unterschrift)",
                "Tage deaktivierbar: x-Button im Tag-Tab (außer Tag 1)",
                "Inaktive Tage erscheinen nicht mehr in PDFs und Kostenberechnung",
                "Übersicht: AG/RG Status mit grünem Haken / rotem X statt n/a",
                "Vorgangs-Löschung für Admin über alle Bereitschaften",
                "Changelog: Einträge jetzt aus-/einklappbar",
              ]},
              {v:"v6.1",d:"25.02.2026",c:[
                "ILS-Button wiederhergestellt (Render-Block + Route-Reihenfolge gefixt)",
                "Concurrent Editing: Live-Sperre mit Heartbeat (30s Intervall, 60s Timeout)",
                "Gesperrt-Banner zeigt aktuellen Bearbeiter",
                "Status-System: Angebot versendet sperrt Vorgang (grünes Banner + Entsperren)",
                "Edit-History: Vollständiges Audit-Log mit Checklist-Diffs",
                "History-Widget am Seitenende mit Icons je Aktionstyp",
                "Stammdaten Race-Condition behoben (stammdatenLoaded Flag)",
                "Bereitschaft-Isolation: BL sieht nur eigene Vorgänge/Stammdaten",
                "Admin/KBL: Filter-Dropdown für alle Bereitschaften",
                "Bereitschaft-Code wird korrekt aus Vorgang übernommen",
                "BL-Ansicht: Organisation, Logo, Textvorlagen ausgeblendet",
                "Kostensätze/km-Sätze für BL sichtbar aber read-only",
                "Umlaute-Korrektur in UI-Labels",
              ]},
              {v:"v6.0.5",d:"Feb 2026",c:[
                "Vorgangsliste: Standard-Ansicht auf Uebersicht geaendert",
                "Vorgaenge-Tab schliesst automatisch den aktiven Vorgang",
                "Aktueller Vorgang wird in der Kopfzeile angezeigt",
                "Auftragsnummer wird automatisch beim ersten Speichern vergeben",
                "Bereitschaft wird automatisch aus dem Login gesetzt",
                "Demo-Login entfernt",
              ]},
              {v:"v6.0.4",d:"Feb 2026",c:[
                "RBAC: Bereitschaftsleiter darf nur eigene Kontaktdaten aendern",
                "Admin-only: KV-Daten, Kostensaetze, Logo",
                "Neuer Endpunkt PUT /api/stammdaten/bereitschaftsleiter",
              ]},
              {v:"v6.0.3",d:"Feb 2026",c:[
                "Auth: UCS-Gruppen-Mapping (GRP_Bereitschaft_* zu bereitschaftCode)",
                "GRP_Kreisbereitschaftsleitung = Rolle admin",
                "Demo-Login-Seite bereinigt",
              ]},
              {v:"v6.0.2",d:"Feb 2026",c:[
                "Profil: ort-Feld wurde nicht gespeichert - behoben",
                "Stammdaten: korrekte Datenquelle (bereitschaften-Tabelle)",
              ]},
              {v:"v6.0.1",d:"Feb 2026",c:[
                "Vertrag-PDF: Serverseitige Generierung mit Puppeteer/Chromium",
                "Zuverlaessige Seitenzahlen (Seite X von Y)",
                "BRK Corporate Design im Vertrag",
                "Seitenumbruch vor Paragraf 4 statt Paragraf 3",
              ]},
              {v:"v6.0",d:"Feb 2026",c:[
                "Kompletter Rewrite: React SPA + Node.js/Express Backend",
                "Kubernetes-Deployment auf RKE2-Cluster",
                "OIDC Single Sign-On ueber BRK.id / Keycloak",
                "Mehrbereitschaft-Mandantenfaehigkeit",
                "Serverseitige PDF-Generierung aller Dokumente via Puppeteer/Chromium",
                "Angebotsmappe: alle 4 Dokumente als eine zusammengefuehrte PDF",
                "Klausel-Editor: AAB und Vertragstexte direkt in Stammdaten bearbeitbar",
                "Gefahrenanalyse PDF: Layout mit Logo, KV-Kopfzeile und Auftragsnr.",
                "Angebot: Tel./Mobil-Beschriftung, Gesamtsumme vor Pauschale",
                "AAB: Auftragsnummer im Header, einheitliche Seitenraender",
                "Automatische Gefahren- und Ressourcenberechnung (Maurer-Algorithmus)",
              ]},
              {v:"v5.0",d:"2024",c:[
                "Letzter stabiler Produktionsstand als klassische Web-Applikation",
                "Vollstaendige Mandantentrennung je Bereitschaft",
                "PDF-Export aller Dokumente serverseitig via wkhtmltopdf",
                "Angebotsmappe als zusammengefuehrtes Gesamtdokument eingefuehrt",
              ]},
              {v:"v4.0",d:"2023",c:[
                "Vollstaendige Ueberarbeitung des Kostenkalkulationsmoduls",
                "Pauschalangebot-Option neben Einzelpostenabrechnung eingefuehrt",
                "Mehrtages-Veranstaltungen mit tagesbezogener Einzelberechnung",
                "Verbessertes Drucklayout fuer Angebot und Vertrag",
              ]},
              {v:"v3.0",d:"2022",c:[
                "Einfuehrung der digitalen AAB (Allgemeine Auftragsbedingungen)",
                "Gefahrenanalyse nach Maurer-Algorithmus implementiert",
                "Automatische Ressourcenempfehlung (Helfer, Fahrzeuge, Einsatzleitung)",
                "Erste Unterstuetzung fuer mehrere Bereitschaften",
              ]},
              {v:"v2.0",d:"2020",c:[
                "Einfuehrung Benutzerverwaltung und rollenbasierter Zugriffskontrolle",
                "Kundenstammdaten-Verwaltung und Wiederverwendung",
                "Erweiterte Kostenkalkulation mit km-Saetzen und Verpflegungspauschale",
              ]},
              {v:"v1.0",d:"2018",c:[
                "Initiale Entwicklung als internes Werkzeug der Bereitschaft Schrobenhausen",
                "Einfache Angebotserstellung fuer Sanitaetswacheinsaetze",
                "Grundlegende Kostenberechnung nach BRK-Kostensaetzen",
                "Ausgabe als druckbares PDF-Dokument",
              ]},
            ].map(({v,d,c:items},i)=><ChangelogItem key={v} v={v} d={d} items={items} defaultOpen={i<2}/>)}
          </div>
        </div>
      )}
      {tab==="settings"&&(<div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div>
            {(user?.rolle==="admin"||user?.rolle==="kbl")&&<Card title="Organisation" accent={C.rot}><Inp label="Kreisverband" value={stammdaten.kvName} onChange={v=>updateStamm("kvName",v)}/><Inp label="Kreisgeschäftsführer" value={stammdaten.kgf} onChange={v=>updateStamm("kgf",v)}/><Inp label="Adresse" value={stammdaten.kvAdresse} onChange={v=>updateStamm("kvAdresse",v)}/><Inp label="PLZ Ort" value={stammdaten.kvPlzOrt} onChange={v=>updateStamm("kvPlzOrt",v)}/></Card>}
            <Card title="Mein Profil" accent={C.rot} sub="Persönliche Kontaktdaten (nur für Sie)">
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
              <Inp label="Titel / Funktion" value={user.titel||""} onChange={v=>setUser(p=>({...p,titel:v}))}/>
              <Inp label="Ort (für Datum-Zeile)" value={user.ort||""} onChange={v=>setUser(p=>({...p,ort:v}))} placeholder="z.B. Schrobenhausen"/>
              <Inp label="Telefon (dienstlich)" value={user.telefon||""} onChange={v=>setUser(p=>({...p,telefon:v}))}/>
              <Inp label="Mobil" value={user.mobil||""} onChange={v=>setUser(p=>({...p,mobil:v}))}/>
              </div>
              <Inp label="E-Mail (dienstlich)" value={user.email||""} onChange={v=>setUser(p=>({...p,email:v}))}/>
              <Card title="Meine Unterschrift" accent="#5c6bc0" sub="Wird in allen Angeboten/Verträgen verwendet">
                <div style={{fontSize:12,color:C.dunkelgrau,marginBottom:8}}>Zeichnen oder Bild hochladen (PNG/JPG/SVG)</div>
                <SignaturePad value={user.signatur||null} onChange={v=>setUser(p=>({...p,signatur:v}))}/>
                <div style={{marginTop:8}}>
                  <input type="file" accept="image/png,image/jpeg,image/svg+xml" id="sigUpload" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{setUser(p=>({...p,signatur:ev.target.result}));};r.readAsDataURL(f);}}/>
                  <label htmlFor="sigUpload" style={{display:"inline-block",padding:"4px 12px",background:C.hellgrau,border:`1px solid ${C.mittelgrau}`,borderRadius:3,fontSize:11,cursor:"pointer"}}>📁 Bild hochladen</label>
                </div>
              </Card>
              <Btn small variant="success" onClick={async()=>{try{const r=await API.saveProfile({telefon:user.telefon||"",mobil:user.mobil||"",titel:user.titel||"",email:user.email||"",ort:user.ort||"",signatur:user.signatur||""});if(r&&r.success){toast("Profil gespeichert","success");}else{toast("Fehler beim Speichern","error");}}catch(e){toast(e.message,"error");}}}>Profil speichern</Btn>
              <div style={{fontSize:10,color:C.bgrau,marginTop:4}}>Diese Daten erscheinen als Unterzeichner im Angebot</div>
            </Card>
            {(user?.rolle==="admin"||user?.rolle==="kbl")&&<Card title="Logo für Drucksachen" accent={C.dunkelblau} sub="Wird auf allen Dokumenten und der Website angezeigt (außer ILS)">
              <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:10}}>
                <div style={{width:120,height:60,border:`2px dashed ${C.mittelgrau}60`,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",background:C.hellgrau,overflow:"hidden",flexShrink:0}}>
                  {stammdaten.customLogo?<img src={stammdaten.customLogo} alt="Logo" style={{maxWidth:"100%",maxHeight:"100%"}}/>:<span style={{fontSize:10,color:C.bgrau}}>Kein Logo</span>}
                </div>
                <div style={{flex:1}}>
                  <input type="file" accept="image/*" id="logoUpload" style={{display:"none"}} onChange={async e=>{const f=e.target.files[0];if(!f)return;const fd=new FormData();fd.append("logo",f);try{const r=await fetch("/api/stammdaten/logo",{method:"POST",body:fd,credentials:"include"});const d=await r.json();if(d.logo){updateStamm("customLogo",d.logo+"?t="+Date.now());}}catch(err){console.error("Logo-Upload fehlgeschlagen:",err);}}}/>
                  <label htmlFor="logoUpload" style={{display:"inline-block",padding:"6px 14px",background:C.mittelblau,color:"#fff",borderRadius:4,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT.sans}}>📁 Logo hochladen</label>
                  {stammdaten.customLogo&&<button onClick={async()=>{try{await fetch("/api/stammdaten/logo",{method:"DELETE",credentials:"include"});}catch{}updateStamm("customLogo",null);}} style={{marginLeft:8,padding:"6px 12px",background:"transparent",border:`1px solid ${C.rot}`,borderRadius:4,fontSize:11,color:C.rot,cursor:"pointer",fontFamily:FONT.sans}}>✕ Entfernen</button>}
                  <div style={{fontSize:10,color:C.bgrau,marginTop:4}}>Empfohlen: PNG/JPG, ca. 300×150px</div>
                </div>
              </div>
            </Card>}
            <Card title="Bereitschaftsleitung" accent={C.mittelblau}><Inp label="Bereitschaftsleiter" value={stammdaten.bereitschaftsleiter} onChange={v=>updateStamm("bereitschaftsleiter",v)}/><Inp label="Telefon" value={stammdaten.telefon} onChange={v=>updateStamm("telefon",v)}/><Inp label="Fax" value={stammdaten.fax} onChange={v=>updateStamm("fax",v)}/><Inp label="Mobil" value={stammdaten.mobil} onChange={v=>updateStamm("mobil",v)}/><Inp label="E-Mail" value={stammdaten.email} onChange={v=>updateStamm("email",v)}/><Inp label="Funkgruppe" value={stammdaten.funkgruppe} onChange={v=>updateStamm("funkgruppe",v)}/></Card>
          </div>
          <div>
            <Card title="Kostensätze (EUR)" sub={user?.rolle!=="admin"?"Nur Admin kann diese Daten ändern – Ansicht nur lesend":undefined} accent="#d4920a"><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>{[["Helfer (€/Std)","helfer"],["KTW","ktw"],["RTW","rtw"],["GKTW","gktw"],["EL (€/Std)","einsatzleiter"],["EL-KFZ","einsatzleiterKfz"],["SEG-LKW","segLkw"],["MTW","mtw"],["Zelt","zelt"],["Verpfl. (€/P/8h)","verpflegung"]].map(([l,k])=><Inp key={k} small label={l} type="number" min={0} step={0.5} value={stammdaten.rates[k]} onChange={v=>updateRate(k,v)} disabled={user?.rolle!=="admin"}/>)}</div></Card>
            <Card title="km-Saetze" accent={C.mittelblau}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 10px"}}>{[["KTW","kmKtw"],["RTW","kmRtw"],["GKTW","kmGktw"],["EL-KFZ","kmElKfz"],["SEG","kmSegLkw"],["MTW","kmMtw"]].map(([l,k])=><Inp key={k} small label={l} type="number" min={0} step={0.1} value={stammdaten.rates[k]} onChange={v=>updateRate(k,v)} disabled={user?.rolle!=="admin"}/>)}</div></Card>
          </div>
        </div>

        {/* KLAUSEL EDITOR */}
        <Card title="Textvorlagen (AAB & Vertrag)" accent={C.mittelblau} sub="Klauseln koennen bei Bedarf angepasst werden - nur Admin">
          {user?.rolle==="admin"?(
            <div>
              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12,gap:8}}>
                <Btn small variant="success" onClick={saveKlauseln} disabled={klauselnSaving}>
                  {klauselnSaving?"Speichert...":"Alle Textvorlagen speichern"}
                </Btn>
              </div>
              {["aab","vertrag"].map(dok=>(
                <div key={dok} style={{marginBottom:16}}>
                  <div style={{fontWeight:700,fontSize:13,color:C.dunkelgrau,marginBottom:8,paddingBottom:4,borderBottom:"2px solid "+(dok==="aab"?C.rot:C.mittelblau)}}>
                    {dok==="aab"?"Allgemeine Auftragsbedingungen (AAB)":"Vereinbarung - Vertragsklauseln"}
                  </div>
                  {klauseln.filter(k=>k.dokument===dok).sort((a,b)=>a.reihenfolge-b.reihenfolge).map(k=>(
                    <div key={k.id} style={{marginBottom:14}}>
                      <div style={{fontWeight:600,fontSize:12,color:C.schwarz,marginBottom:4}}>{k.titel}</div>
                      <textarea
                        value={klauselnEdit[k.id]||""}
                        onChange={e=>setKlauselnEdit(prev=>({...prev,[k.id]:e.target.value}))}
                        style={{width:"100%",minHeight:120,padding:"8px 10px",border:`1px solid ${C.mittelgrau}`,borderRadius:4,fontFamily:"Arial,sans-serif",fontSize:11,lineHeight:1.5,resize:"vertical",background:"#fafafa"}}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ):(
            <div style={{padding:16,background:"#f5f5f5",borderRadius:4,color:C.dunkelgrau,fontSize:12}}>
              Nur Administratoren koennen Textvorlagen bearbeiten.
            </div>
          )}
        </Card>

        </div>)}
      </main>
      <footer style={{padding:"12px 20px",borderTop:`1px solid ${C.mittelgrau}40`,textAlign:"center",fontSize:10,color:C.dunkelgrau,background:C.weiss}}>BRK Sanitätswachdienst v6.7 · {bereitschaft.name} · {stammdaten.kvName} · {year}</footer>
      <FeedbackButton user={user} currentView={tab} toast={toast}/>
      <ToastContainer toasts={toasts} onDismiss={dismissToast}/>
      <ConfirmDialog open={!!confirmDlg} title={confirmDlg?.title} message={confirmDlg?.message} confirmLabel={confirmDlg?.confirmLabel} cancelLabel={confirmDlg?.cancelLabel} variant={confirmDlg?.variant} onConfirm={handleConfirm} onCancel={handleCancel}/>
    </div>
  );
}
