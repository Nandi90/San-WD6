import React from "react";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import API, { getPapierkorb, restoreVorgang, purgeVorgang } from "./api";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSIVE HOOK
// ═══════════════════════════════════════════════════════════════════════════
function useResponsive(){
  const [w,setW]=useState(typeof window!=="undefined"?window.innerWidth:1200);
  useEffect(()=>{const h=()=>setW(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  return{mob:w<=768,tab:w>768&&w<=1024};
}

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
const EMPTY_EVENT={auftragsnr:"",name:"",ort:"",adresse:"",veranstalter:"",ansprechpartner:"",telefon:"",email:"",rechnungsempfaenger:"",reStrasse:"",rePlzOrt:"",anrede:"Sehr geehrte Damen und Herren,",auflagen:"keine",kfzStellplatz:true,sanitaetsraum:false,strom:true,verpflegung:true,pauschalangebot:0,bemerkung:"",veranstalterInfo:"",coords:null,w3w:"",hausnr:"",checklist:{},ilsEL:"",ilsTelefon:"",ilsFunk:"",ilsAbkoemmlich:"",ilsFzg1:"",ilsFzg2:"",ilsFzg3:"",ilsSonstige:""};
const f2=(v)=>new Intl.NumberFormat("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2}).format(v);
const fDate=(d)=>d?new Date(d).toLocaleDateString("de-DE"):"";
const buildAddrStr=(addr)=>{
  if(!addr)return"";
  const road=addr.road||addr.pedestrian||addr.path||addr.footway||"";
  const hnr=addr.house_number||"";
  const city=addr.city||addr.town||addr.village||addr.hamlet||"";
  const plz=addr.postcode||"";
  const parts=[];
  if(road&&hnr)parts.push(road+" "+hnr);else if(road)parts.push(road);
  if(plz&&city)parts.push(plz+" "+city);else if(city)parts.push(city);
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
const Btn=({children,onClick,variant="primary",small,icon,style:sx,disabled,className})=>{const st={primary:{background:C.rot,color:C.weiss,border:"none"},secondary:{background:C.weiss,color:C.dunkelgrau,border:`1px solid ${C.mittelgrau}`},ghost:{background:"transparent",color:C.dunkelgrau,border:"none"},blue:{background:C.mittelblau,color:C.weiss,border:"none"},success:{background:"#1a7a3a",color:C.weiss,border:"none"}};return(<button className={className} onClick={onClick} disabled={disabled} style={{padding:small?"5px 12px":"9px 18px",borderRadius:4,fontSize:small?12:13,fontWeight:600,cursor:disabled?"not-allowed":"pointer",fontFamily:FONT.sans,display:"inline-flex",alignItems:"center",gap:6,opacity:disabled?0.5:1,...st[variant],...sx}}>{icon&&<span>{icon}</span>}{children}</button>);};
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

// ═══════════════════════════════════════════════════════════════════════════
// WHAT'S NEW BANNER (einmalig pro Version)
// ═══════════════════════════════════════════════════════════════════════════
function WhatsNewBanner({release,onDismiss,onChangelog}){
  if(!release)return null;
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:10001,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT.sans}} onClick={onDismiss}>
    <div onClick={e=>e.stopPropagation()} style={{background:C.weiss,borderRadius:12,maxWidth:480,width:"92%",boxShadow:"0 12px 40px #0003",overflow:"hidden",animation:"slideIn 0.3s ease"}}>
      <div style={{background:`linear-gradient(135deg, ${C.rot}, ${C.dunkelrot})`,padding:"20px 24px",color:"#fff"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:11,opacity:0.85,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Neu in SanWD</div>
            <div style={{fontSize:22,fontWeight:800}}>{release.v}</div>
          </div>
          <div style={{fontSize:36}}>🚀</div>
        </div>
        <div style={{fontSize:11,opacity:0.7,marginTop:4}}>{release.d}</div>
      </div>
      <div style={{padding:"16px 24px",maxHeight:"40vh",overflowY:"auto"}}>
        {release.c.map((item,i)=>(<div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"6px 0",borderBottom:i<release.c.length-1?`1px solid ${C.hellgrau}`:"none"}}>
          <span style={{color:C.rot,fontWeight:700,fontSize:12,flexShrink:0,marginTop:1}}>•</span>
          <span style={{fontSize:13,color:C.dunkelgrau,lineHeight:1.4}}>{item}</span>
        </div>))}
      </div>
      <div style={{padding:"12px 24px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:`1px solid ${C.hellgrau}`}}>
        <button onClick={()=>{onDismiss();onChangelog();}} style={{background:"none",border:"none",color:C.mittelblau,fontSize:12,cursor:"pointer",fontFamily:FONT.sans,textDecoration:"underline"}}>Vollständiges Changelog →</button>
        <Btn variant="primary" onClick={onDismiss}>Verstanden</Btn>
      </div>
    </div>
  </div>);
}
// 4-Augen-Prinzip: Planungsgrößen für Unterzeichner
function getSignAuthority(maxStellen) {
  if (maxStellen > 15) return { erstellt: "BL unterstützt KFDL San und KBL", kontrolle: "KGF", stufe: 4 };
  if (maxStellen >= 15) return { erstellt: "BL unterstützt KFDL San", kontrolle: "KBL", stufe: 3 };
  if (maxStellen >= 10) return { erstellt: "BL", kontrolle: "KFDL San oder vergleichbare Person", stufe: 2 };
  if (maxStellen >= 5) return { erstellt: "BL", kontrolle: "stellv. BL oder vergleichbare Person", stufe: 1 };
  return { erstellt: "BL", kontrolle: "—", stufe: 0 };
}
function getUserMaxStufe(rolle){
  if(rolle==="admin"||rolle==="kgf")return 99;
  if(rolle==="kbl")return 3;
  if(rolle==="bl")return 1;
  return 0;
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
        try{const wr=await fetch(`/api/w3w?lat=${lat}&lng=${lng}`,{credentials:"include"});const wd=await wr.json();w3w=wd.w3w||null;}catch(e){console.error("Fehler:",e);}
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
      // 1. Versuch: HERE Geocoding (praeziseste Hausnummer-Aufloesung)
      try{
        const hq=s.road+" "+s.hnr+(s.plz?" "+s.plz:"")+(s.city?" "+s.city:"");
        const hr=await fetch(`/api/geocode?q=${encodeURIComponent(hq)}`,{credentials:"include"});
        const hd=await hr.json();
        if(hd.lat && hd.houseNumber){
          let rw3w=null;
          try{const wr=await fetch(`/api/w3w?lat=${hd.lat}&lng=${hd.lng}`,{credentials:"include"});const wd=await wr.json();rw3w=wd.w3w||null;}catch(e){console.error("Fehler:",e);}
          if(onResult)onResult({...s,lat:hd.lat,lng:hd.lng,w3w:rw3w||s.w3w,imprecise:false});
          return;
        }
      }catch(e){console.error("Fehler:",e);}
      // 2. Fallback: Nominatim Freitext
      try{
        const fq=`${s.road} ${s.hnr}${s.plz?", "+s.plz:""}${s.city?(" "+s.city):""}`;
        const rr=await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fq)}&format=json&addressdetails=1&limit=1&countrycodes=de&accept-language=de`,{headers:{"User-Agent":"BRK-SanWD/7.0"}});
        const rd=await rr.json();
        if(rd[0] && rd[0].address && rd[0].address.house_number){
          const rlat=parseFloat(rd[0].lat),rlng=parseFloat(rd[0].lon);
          let rw3w=null;
          try{const wr=await fetch(`/api/w3w?lat=${rlat}&lng=${rlng}`,{credentials:"include"});const wd=await wr.json();rw3w=wd.w3w||null;}catch(e){console.error("Fehler:",e);}
          if(onResult)onResult({...s,lat:rlat,lng:rlng,w3w:rw3w||s.w3w,imprecise:false});
          return;
        }
      }catch(e){console.error("Fehler:",e);}
      // 3. Fallback: Nominatim strukturiert
      try{
        const params=new URLSearchParams({street:`${s.hnr} ${s.road}`,format:"json",addressdetails:"1",limit:"1",countrycodes:"de","accept-language":"de"});
        if(s.city)params.set("city",s.city);
        if(s.plz)params.set("postalcode",s.plz);
        const rr=await fetch(`https://nominatim.openstreetmap.org/search?${params}`,{headers:{"User-Agent":"BRK-SanWD/7.0"}});
        const rd=await rr.json();
        if(rd[0]){
          const rlat=parseFloat(rd[0].lat),rlng=parseFloat(rd[0].lon);
          let rw3w=null;
          try{const wr=await fetch(`/api/w3w?lat=${rlat}&lng=${rlng}`,{credentials:"include"});const wd=await wr.json();rw3w=wd.w3w||null;}catch(e){console.error("Fehler:",e);}
          if(onResult)onResult({...s,lat:rlat,lng:rlng,w3w:rw3w||s.w3w,imprecise:!(rd[0].address&&rd[0].address.house_number)});
          return;
        }
      }catch(e){console.error("Fehler:",e);}
      // Alle Geocoder gescheitert
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
  const mapRef=useRef(null);const mapInst=useRef(null);const markerRef=useRef(null);const layersRef=useRef({});
  const [search,setSearch]=useState("");
  const [activeLayer,setActiveLayer]=useState("karte");
  const reverseGeocode=async(lat,lng)=>{
    try{const r=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=de`,{headers:{"User-Agent":"BRK-SanWD/7.0"}});const d=await r.json();if(d.address){const a=buildAddrStr(d.address);onChange({lat,lng,address:a||d.display_name});}}catch(e){console.error("Fehler:",e);}
    try{const wr=await fetch(`/api/w3w?lat=${lat}&lng=${lng}`,{credentials:"include"});const wd=await wr.json();if(wd.w3w)onW3W(wd.w3w);}catch(e){console.error("Fehler:",e);}
  };
  const setupDrag=(marker)=>{
    marker.on("dragend",async(e)=>{const p=e.target.getLatLng();onChange({lat:p.lat,lng:p.lng});reverseGeocode(p.lat,p.lng);});
  };
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
    const lat=coords?.lat||48.63;const lng=coords?.lng||11.25;
    const map=L.map(mapRef.current,{scrollWheelZoom:true}).setView([lat,lng],coords?.lat?17:10);
    // BKG TopPlusOpen WMTS (OpenData, weltweit, amtliche Daten für DE)
    const BKG="© BKG 2025 dl-de/by-2-0";
    const TPO="https://sgx.geodatenzentrum.de/wmts_topplus_open/tile/1.0.0";
    const BA="© Bayer. Vermessungsverwaltung";
    layersRef.current={
      karte:L.tileLayer(TPO+"/web/default/WEBMERCATOR/{z}/{y}/{x}.png",{attribution:BKG,maxZoom:18,tileSize:256}),
      luftbild:L.tileLayer.wms("https://geoservices.bayern.de/od/wms/dop/v1/dop20?",{layers:"by_dop20c",format:"image/png",transparent:false,attribution:BA,maxZoom:20,version:"1.3.0"}),
      osm:L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OSM",maxZoom:19})
    };
    layersRef.current.karte.addTo(map);
    if(coords?.lat){
      markerRef.current=L.marker([lat,lng],{draggable:true}).addTo(map);
      setupDrag(markerRef.current);
    }
    map.on("click",async(e)=>{
      const{lat:la,lng:ln}=e.latlng;
      if(markerRef.current)markerRef.current.setLatLng([la,ln]);
      else{markerRef.current=L.marker([la,ln],{draggable:true}).addTo(map);setupDrag(markerRef.current);}
      onChange({lat:la,lng:ln});
      reverseGeocode(la,ln);
    });
    mapInst.current=map;
    };
    loadLeaflet();
    return()=>{if(mapInst.current){mapInst.current.remove();mapInst.current=null;}};
  },[]);
  // Layer switch
  useEffect(()=>{
    if(!mapInst.current||!layersRef.current[activeLayer])return;
    Object.values(layersRef.current).forEach(l=>{if(mapInst.current.hasLayer(l))mapInst.current.removeLayer(l);});
    layersRef.current[activeLayer].addTo(mapInst.current);
  },[activeLayer]);
  useEffect(()=>{
    if(!mapInst.current||!coords?.lat)return;
    const L=window.L;if(!L)return;
    if(markerRef.current)markerRef.current.setLatLng([coords.lat,coords.lng]);
    else{markerRef.current=L.marker([coords.lat,coords.lng],{draggable:true}).addTo(mapInst.current);setupDrag(markerRef.current);}
    mapInst.current.flyTo([coords.lat,coords.lng],17);
  },[coords?.lat,coords?.lng]);
  const flyToSearch=async()=>{
    if(!search||search.length<3)return;
    try{const r=await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=1&countrycodes=de&accept-language=de`,{headers:{"User-Agent":"BRK-SanWD/7.0"}});const d=await r.json();
      if(d[0]){const lat=parseFloat(d[0].lat),lng=parseFloat(d[0].lon);
        onChange({lat,lng,address:d[0].display_name});
        if(mapInst.current){mapInst.current.flyTo([lat,lng],17);const L=window.L;
          if(markerRef.current)markerRef.current.setLatLng([lat,lng]);
          else{markerRef.current=L.marker([lat,lng],{draggable:true}).addTo(mapInst.current);setupDrag(markerRef.current);}
        }
        try{const wr=await fetch(`/api/w3w?lat=${lat}&lng=${lng}`,{credentials:"include"});const wd=await wr.json();if(wd.w3w)onW3W(wd.w3w);}catch(e){console.error("Fehler:",e);}
      }
    }catch(e){console.error("Fehler:",e);}
  };
  const layerBtns=[{id:"karte",label:"Karte"},{id:"luftbild",label:"Luftbild"},{id:"osm",label:"OSM"}];
  return(<div style={{borderRadius:6,overflow:"hidden",border:`1px solid ${C.mittelgrau}40`,marginTop:8}}>
    <div style={{display:"flex",gap:4,padding:"6px 8px",background:C.hellgrau,flexWrap:"wrap"}}>
      <input type="text" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&flyToSearch()} placeholder="Adresse suchen..." style={{flex:1,padding:"4px 8px",border:`1px solid ${C.mittelgrau}`,borderRadius:3,fontSize:11,fontFamily:FONT.sans,minWidth:120}}/>
      <button onClick={flyToSearch} style={{padding:"4px 10px",background:C.mittelblau,color:"#fff",border:"none",borderRadius:3,fontSize:11,cursor:"pointer"}}>🔍</button>
      <div style={{display:"flex",gap:2,marginLeft:4}}>
        {layerBtns.map(b=><button key={b.id} onClick={()=>setActiveLayer(b.id)} style={{padding:"3px 7px",fontSize:9,fontWeight:activeLayer===b.id?700:400,border:`1px solid ${activeLayer===b.id?C.rot:C.mittelgrau}`,borderRadius:3,background:activeLayer===b.id?`${C.rot}15`:"#fff",color:activeLayer===b.id?C.rot:C.dunkelgrau,cursor:"pointer",fontFamily:FONT.sans}}>{b.label}</button>)}
      </div>
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

// ═══════════════════════════════════════════════════════════════
// CONFIRM MODAL (BRK Design)
// ═══════════════════════════════════════════════════════════════
function ConfirmModal({open,title,message,icon,onConfirm,onCancel,confirmText="Bestätigen",cancelText="Abbrechen",accent="#c1272d"}){
  if(!open)return null;
  return(<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(2px)"}} onClick={onCancel}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:12,padding:0,width:420,maxWidth:"90vw",boxShadow:"0 20px 60px rgba(0,0,0,0.3)",overflow:"hidden",animation:"fadeIn 0.15s ease"}}>
      <div style={{padding:"20px 24px 16px",borderBottom:"1px solid #f0f0f0"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {icon&&<span style={{fontSize:28}}>{icon}</span>}
          <div style={{fontSize:16,fontWeight:700,color:"#1a1a2e"}}>{title}</div>
        </div>
      </div>
      <div style={{padding:"16px 24px",fontSize:13,color:"#555",lineHeight:1.6}}>{message}</div>
      <div style={{padding:"12px 24px 20px",display:"flex",justifyContent:"flex-end",gap:10}}>
        <button onClick={onCancel} style={{padding:"9px 20px",background:"#fff",border:"1px solid #d0d0d0",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",color:"#555"}}>
          {cancelText}
        </button>
        <button onClick={onConfirm} style={{padding:"9px 20px",background:accent,border:"none",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",color:"#fff"}}>
          {confirmText}
        </button>
      </div>
    </div>
  </div>);
}

// ═══════════════════════════════════════════════════════════════════
// Nextcloud Config (Admin)
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// SMTP / E-Mail Config (Admin)
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// Einstellungen Tab (Admin) mit Sub-Tabs
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// Statistik Dashboard
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// Anfragen-Verwaltung
// ═══════════════════════════════════════════════════════════════════
function AnfragenTab({user,toast,bereitschaften,onOpenVorgang}){
  const [anfragen,setAnfragen]=useState([]);
  const [loading,setLoading]=useState(true);
  const [selected,setSelected]=useState(null);
  const [filter,setFilter]=useState("alle");
  const [annBC,setAnnBC]=useState(user?.bereitschaftCode||"BSOB");
  const [showReassign,setShowReassign]=useState(false);
  const [reassignBC,setReassignBC]=useState("");
  const [cfm,setCfm]=useState(null);
  const [showAblehnen,setShowAblehnen]=useState(null);
  const [ablehnGrund,setAblehnGrund]=useState("");

  const load=()=>{setLoading(true);API.getAnfragen().then(r=>{setAnfragen(r);if(selected){const upd=r.find(a=>a.id===selected.id);if(upd)setSelected(upd);}setLoading(false);}).catch(e=>{toast(e.message,"error");setLoading(false);});};
  useEffect(load,[]);

  const STATUS_C={neu:"#1565c0",angenommen:"#2e7d32",abgelehnt:"#c62828",archiviert:"#757575"};
  const STATUS_L={neu:"Neu",angenommen:"Angenommen",abgelehnt:"Abgelehnt",archiviert:"Archiviert"};

  const filtered=anfragen.filter(a=>filter==="alle"||a.status===filter);
  const counts={};anfragen.forEach(a=>{counts[a.status]=(counts[a.status]||0)+1;});

  const annehmen=(a)=>{
    setCfm({title:"Anfrage annehmen",message:`„${a.name}" annehmen und Vorgang für ${(bereitschaften||[]).find(b=>b.code===annBC)?.name||annBC} erstellen?`,icon:"✅",confirmText:"Annehmen & Vorgang erstellen",accent:"#2e7d32",onConfirm:async()=>{setCfm(null);try{
      const r=await API.anfrageAnnehmen(a.id,annBC);
      if(r.success){toast(`✅ Vorgang ${r.auftragsnr} erstellt`,"success");load();setSelected(null);
        if(onOpenVorgang)onOpenVorgang(r.vorgangId);
      }else toast(r.error||"Fehler","error");
    }catch(e){toast(e.message,"error");}}});
  };

  const ablehnen=(a)=>{
    setAblehnGrund("");setShowAblehnen(a);
  };
  const doAblehnen=async()=>{
    if(!showAblehnen||!ablehnGrund)return;
    try{await API.updateAnfrageStatus(showAblehnen.id,"abgelehnt",ablehnGrund);toast("Anfrage abgelehnt","success");setShowAblehnen(null);load();setSelected(null);}catch(e){toast(e.message,"error");}
  };

  const archivieren=async(a)=>{
    try{await API.updateAnfrageStatus(a.id,"archiviert");load();setSelected(null);}catch(e){toast(e.message,"error");}
  };

  const loeschen=(a)=>{
    setCfm({title:"Endgültig löschen",message:"Diese Anfrage wird unwiderruflich gelöscht. Fortfahren?",icon:"🗑️",confirmText:"Endgültig löschen",accent:"#c62828",onConfirm:async()=>{setCfm(null);try{await API.deleteAnfrage(a.id);toast("Gelöscht","success");load();setSelected(null);}catch(e){toast(e.message,"error");}}});
  };

  const parseTage=(datum)=>{try{const t=JSON.parse(datum||"[]");return Array.isArray(t)?t:[];}catch{return[];}};
  const fDate=d=>{if(!d)return"-";try{return new Date(d).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"});}catch{return d;}};
  const fDateTime=d=>{if(!d)return"-";try{return new Date(d).toLocaleString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});}catch{return d;}};

  if(loading)return <div style={{padding:40,textAlign:"center",color:C.dunkelgrau}}>Lade Anfragen...</div>;

  return(<div style={{display:"grid",gridTemplateColumns:selected?"1fr 1fr":"1fr",gap:16}}>
    {/* Liste */}
    <div>
      <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
        {["alle","neu","angenommen","abgelehnt","archiviert"].map(f=>{
          const cnt=f==="alle"?anfragen.length:(counts[f]||0);
          return <button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 12px",background:filter===f?(STATUS_C[f]||C.rot):"#fff",color:filter===f?"#fff":C.dunkelgrau,border:`1px solid ${filter===f?(STATUS_C[f]||C.rot):C.mittelgrau}`,borderRadius:20,fontSize:11,fontWeight:filter===f?700:500,cursor:"pointer",fontFamily:FONT.sans}}>{STATUS_L[f]||"Alle"} ({cnt})</button>;
        })}
        <div style={{flex:1}}/>
        <button onClick={load} style={{padding:"5px 12px",background:C.hellgrau,border:`1px solid ${C.mittelgrau}`,borderRadius:6,fontSize:11,cursor:"pointer",fontFamily:FONT.sans}}>🔄 Aktualisieren</button>
      </div>

      {filtered.length===0&&<div style={{padding:40,textAlign:"center",color:C.bgrau}}>
        <div style={{fontSize:36,marginBottom:8}}>📭</div>
        <div style={{fontSize:14}}>Keine {filter!=="alle"?STATUS_L[filter]+"n":""} Anfragen</div>
        <div style={{fontSize:11,marginTop:4}}>Link zum Formular: <a href="/anfrage" target="_blank" style={{color:C.mittelblau}}>/anfrage</a></div>
      </div>}

      {filtered.map(a=>{
        const tage=parseTage(a.datum);
        const isNew=a.status==="neu";
        return <div key={a.id} onClick={()=>{setSelected(a);setShowReassign(false);if(a.suggested_bc)setAnnBC(a.suggested_bc);}} style={{padding:"12px 16px",background:selected?.id===a.id?`${C.mittelblau}10`:"#fff",border:`1px solid ${selected?.id===a.id?C.mittelblau:C.mittelgrau}40`,borderLeft:`4px solid ${STATUS_C[a.status]||"#999"}`,borderRadius:8,marginBottom:6,cursor:"pointer",transition:"all 0.15s"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:isNew?C.mittelblau:C.dunkelgrau}}>{a.name||"Ohne Name"}</div>
              <div style={{fontSize:11,color:C.dunkelgrau,marginTop:2}}>
                {a.veranstalter} · {a.ort||"-"}{tage.length>0?` · ${tage.length} Tag${tage.length>1?"e":""}`:""}{a.besucher?` · ~${a.besucher} Besucher`:""}
              </div>
              {a.bereitschaft_code&&<div style={{fontSize:10,color:"#2e7d32",marginTop:2}}>→ {(bereitschaften||[]).find(b=>b.code===a.bereitschaft_code)?.name||a.bereitschaft_code}</div>}
            </div>
            <div style={{textAlign:"right"}}>
              <span style={{display:"inline-block",padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,background:(STATUS_C[a.status]||"#999")+"20",color:STATUS_C[a.status]||"#999"}}>{STATUS_L[a.status]||a.status}</span>
              <div style={{fontSize:9,color:C.bgrau,marginTop:2}}>{fDateTime(a.created_at)}</div>
            </div>
          </div>
        </div>;
      })}
    </div>

    {/* Detail */}
    {selected&&<div>
      <Card title={selected.name||"Anfrage"} accent={STATUS_C[selected.status]||C.mittelblau}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <span style={{padding:"3px 10px",borderRadius:12,fontSize:11,fontWeight:700,background:(STATUS_C[selected.status]||"#999")+"20",color:STATUS_C[selected.status]||"#999"}}>{STATUS_L[selected.status]||selected.status}</span>
          <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#999"}}>✕</button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 16px",fontSize:12,marginBottom:14}}>
          <div><span style={{fontWeight:600,color:"#555"}}>Veranstalter:</span> {selected.veranstalter}</div>
          <div><span style={{fontWeight:600,color:"#555"}}>Ansprechpartner:</span> {selected.ansprechpartner}</div>
          <div><span style={{fontWeight:600,color:"#555"}}>Telefon:</span> <a href={`tel:${selected.telefon}`} style={{color:C.mittelblau}}>{selected.telefon}</a></div>
          <div><span style={{fontWeight:600,color:"#555"}}>E-Mail:</span> <a href={`mailto:${selected.email}`} style={{color:C.mittelblau}}>{selected.email}</a></div>
          <div><span style={{fontWeight:600,color:"#555"}}>Ort:</span> {selected.ort||"-"}{selected.plz?` (${selected.plz})`:""}</div>
          <div><span style={{fontWeight:600,color:"#555"}}>Adresse:</span> {selected.adresse||"-"}</div>
          <div><span style={{fontWeight:600,color:"#555"}}>Besucher:</span> {selected.besucher||"-"}</div>
          <div><span style={{fontWeight:600,color:"#555"}}>Art:</span> {selected.art||"-"}</div>
          {selected.suggested_bc&&<div><span style={{fontWeight:600,color:"#555"}}>Vorgeschlagene BC:</span> <span style={{color:"#e65100",fontWeight:600}}>{(bereitschaften||[]).find(b=>b.code===selected.suggested_bc)?.name||selected.suggested_bc}</span> <span style={{fontSize:10,color:"#888"}}>(PLZ {selected.plz})</span></div>}
          <div style={{gridColumn:"1/-1"}}><span style={{fontWeight:600,color:"#555"}}>Eingegangen:</span> {fDateTime(selected.created_at)}</div>
          {(selected.rechnungsempfaenger||selected.re_strasse||selected.re_plz_ort)&&<div style={{gridColumn:"1/-1",marginTop:4,padding:"8px 12px",background:"#f5f5f5",borderRadius:6}}>
            <div style={{fontSize:11,fontWeight:600,color:"#555",marginBottom:4}}>Angebots-/Rechnungsadresse:</div>
            <div style={{fontSize:12}}>{selected.rechnungsempfaenger||selected.veranstalter}</div>
            {selected.re_strasse&&<div style={{fontSize:12}}>{selected.re_strasse}</div>}
            {selected.re_plz_ort&&<div style={{fontSize:12}}>{selected.re_plz_ort}</div>}
          </div>}
        </div>

        {/* Tage */}
        {(()=>{const tage=parseTage(selected.datum);return tage.length>0?<div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:600,color:"#555",marginBottom:4}}>Veranstaltungstage:</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {tage.map((t,i)=><div key={i} style={{padding:"6px 12px",background:C.hellgrau,borderRadius:6,fontSize:11}}>
              <span style={{fontWeight:700}}>{fDate(t.datum)}</span> {t.von||"?"} – {t.bis||"?"}
            </div>)}
          </div>
        </div>:null;})()}

        {selected.bemerkung&&<div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:600,color:"#555",marginBottom:4}}>Bemerkung:</div>
          <div style={{padding:"8px 12px",background:"#f5f5f5",borderRadius:6,fontSize:12,lineHeight:1.5,whiteSpace:"pre-wrap"}}>{selected.bemerkung}</div>
        </div>}

        {/* Aktionen */}
        {selected.status==="neu"&&<div style={{borderTop:`1px solid ${C.mittelgrau}40`,paddingTop:14,marginTop:14}}>
          <div style={{fontSize:12,fontWeight:600,color:"#555",marginBottom:8}}>Anfrage bearbeiten:</div>
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:11,color:"#555"}}>Zuweisen an:</div>
            <select value={annBC} onChange={e=>setAnnBC(e.target.value)} style={{padding:"5px 10px",border:`1px solid ${C.mittelgrau}`,borderRadius:5,fontSize:12,fontFamily:FONT.sans}}>
              {(bereitschaften||[]).map(b=><option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
            {selected.suggested_bc&&annBC===selected.suggested_bc&&<span style={{fontSize:10,color:"#2e7d32",fontWeight:600}}>✓ PLZ-Vorschlag</span>}
            {selected.suggested_bc&&annBC!==selected.suggested_bc&&<span style={{fontSize:10,color:"#e65100",cursor:"pointer"}} onClick={()=>setAnnBC(selected.suggested_bc)}>↩ PLZ-Vorschlag: {(bereitschaften||[]).find(b=>b.code===selected.suggested_bc)?.short||selected.suggested_bc}</span>}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>annehmen(selected)} style={{flex:1,padding:"10px 16px",background:"#2e7d32",color:"#fff",border:"none",borderRadius:6,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:FONT.sans}}>✅ Annehmen & Vorgang erstellen</button>
            <button onClick={()=>ablehnen(selected)} style={{padding:"10px 16px",background:"#fff",color:"#c62828",border:"1px solid #ef9a9a",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:FONT.sans}}>✕ Ablehnen</button>
          </div>
        </div>}

        {selected.status==="angenommen"&&<div style={{borderTop:`1px solid ${C.mittelgrau}40`,paddingTop:14,marginTop:14}}>
          <div style={{padding:"12px 14px",background:"#e8f5e9",borderRadius:6,marginBottom:10}}>
            <div style={{fontSize:12,color:"#2e7d32",fontWeight:700,marginBottom:6}}>✅ Diese Anfrage wurde angenommen.</div>
            <div style={{display:"flex",gap:16,fontSize:12,color:"#333",flexWrap:"wrap"}}>
              <div><span style={{color:"#555"}}>Zugewiesen an:</span> <strong>{(bereitschaften||[]).find(b=>b.code===selected.bereitschaft_code)?.name||selected.bereitschaft_code||"Unbekannt"}</strong></div>
              {selected.vorgang_id&&<div><span style={{color:"#555"}}>Vorgang:</span> <button onClick={()=>onOpenVorgang&&onOpenVorgang(selected.vorgang_id)} style={{background:"none",border:"none",color:C.mittelblau,fontWeight:700,cursor:"pointer",fontSize:12,fontFamily:FONT.sans,textDecoration:"underline",padding:0}}>{selected.auftragsnr||selected.vorgang_id}</button></div>}
            </div>
          </div>
          {showReassign?<div style={{background:"#fff8e1",border:"1px solid #ffe082",borderRadius:6,padding:12,marginBottom:10}}>
            <div style={{fontSize:12,fontWeight:600,color:"#555",marginBottom:6}}>Bereitschaft umzuweisen:</div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <select value={reassignBC} onChange={e=>setReassignBC(e.target.value)} style={{flex:1,padding:"6px 10px",border:"1px solid #ccc",borderRadius:5,fontSize:12,fontFamily:FONT.sans}}>
                {(bereitschaften||[]).map(b=><option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
              <button onClick={async()=>{try{await API.anfrageUmzuweisen(selected.id,reassignBC);toast("Umzugewiesen an "+(bereitschaften||[]).find(b=>b.code===reassignBC)?.name,"success");setShowReassign(false);load();}catch(e){toast(e.message,"error");}}} disabled={reassignBC===selected.bereitschaft_code} style={{padding:"6px 14px",background:reassignBC===selected.bereitschaft_code?"#ccc":"#e65100",color:"#fff",border:"none",borderRadius:5,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT.sans}}>Umzuweisen</button>
              <button onClick={()=>setShowReassign(false)} style={{padding:"6px 10px",background:"#fff",border:"1px solid #ccc",borderRadius:5,fontSize:12,cursor:"pointer",fontFamily:FONT.sans}}>✕</button>
            </div>
          </div>
          :<button onClick={()=>{setReassignBC(selected.bereitschaft_code||user?.bereitschaftCode||"BSOB");setShowReassign(true);}} style={{padding:"6px 14px",background:"#fff",border:"1px solid #ffe082",borderRadius:6,fontSize:11,cursor:"pointer",fontFamily:FONT.sans,color:"#e65100",fontWeight:600,marginBottom:10,display:"block"}}>🔄 Bereitschaft umzuweisen</button>}
          <button onClick={()=>archivieren(selected)} style={{padding:"8px 16px",background:C.hellgrau,border:`1px solid ${C.mittelgrau}`,borderRadius:6,fontSize:12,cursor:"pointer",fontFamily:FONT.sans}}>📦 Archivieren</button>
        </div>}

        {selected.status==="abgelehnt"&&<div style={{borderTop:`1px solid ${C.mittelgrau}40`,paddingTop:14,marginTop:14}}>
          <div style={{padding:"10px 14px",background:"#ffebee",borderRadius:6,marginBottom:10}}>
            <div style={{fontSize:12,color:"#c62828",fontWeight:700}}>✕ Diese Anfrage wurde abgelehnt.</div>
            {selected.ablehnung_grund&&<div style={{fontSize:12,color:"#b71c1c",marginTop:4}}>Grund: <strong>{selected.ablehnung_grund}</strong></div>}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>archivieren(selected)} style={{padding:"8px 16px",background:C.hellgrau,border:`1px solid ${C.mittelgrau}`,borderRadius:6,fontSize:12,cursor:"pointer",fontFamily:FONT.sans}}>📦 Archivieren</button>
            <button onClick={()=>loeschen(selected)} style={{padding:"8px 16px",background:"#fff",color:"#c62828",border:"1px solid #ef9a9a",borderRadius:6,fontSize:12,cursor:"pointer",fontFamily:FONT.sans}}>🗑️ Endgültig löschen</button>
          </div>
        </div>}

        {selected.status==="archiviert"&&<div style={{borderTop:`1px solid ${C.mittelgrau}40`,paddingTop:14,marginTop:14}}>
          <button onClick={()=>loeschen(selected)} style={{padding:"8px 16px",background:"#fff",color:"#c62828",border:"1px solid #ef9a9a",borderRadius:6,fontSize:12,cursor:"pointer",fontFamily:FONT.sans}}>🗑️ Endgültig löschen</button>
        </div>}
      </Card>
    </div>}

    {/* Ablehnung Modal */}
    {showAblehnen&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(3px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setShowAblehnen(null)}>
      <div style={{background:"#fff",borderRadius:10,padding:"24px 28px",maxWidth:400,width:"90%",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}><span style={{fontSize:24}}>✕</span><div><div style={{fontSize:16,fontWeight:700,color:"#c62828"}}>Anfrage ablehnen</div><div style={{fontSize:11,color:C.dunkelgrau}}>Warum wird die Anfrage „{showAblehnen.name}" abgelehnt?</div></div></div>
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
          {["Zu teuer","Anderer Anbieter","Veranstaltung abgesagt","Veranstalter stellt eigene Sanitäter","Kapazität nicht verfügbar","Sonstiges"].map(g=>(
            <button key={g} onClick={()=>setAblehnGrund(g)} style={{padding:"8px 14px",background:ablehnGrund===g||(g==="Anderer Anbieter"&&ablehnGrund.startsWith("Anderer Anbieter"))||(g==="Sonstiges"&&ablehnGrund&&!["Zu teuer","Anderer Anbieter","Veranstaltung abgesagt","Veranstalter stellt eigene Sanitäter","Kapazität nicht verfügbar"].includes(ablehnGrund)&&!ablehnGrund.startsWith("Anderer Anbieter"))?"#ffebee":"#f5f5f5",border:`1px solid ${ablehnGrund===g||(g==="Anderer Anbieter"&&ablehnGrund.startsWith("Anderer Anbieter"))?"#e53935":"#ddd"}`,borderRadius:6,textAlign:"left",fontSize:13,cursor:"pointer",fontWeight:ablehnGrund===g||(g==="Anderer Anbieter"&&ablehnGrund.startsWith("Anderer Anbieter"))?600:400,color:ablehnGrund===g||(g==="Anderer Anbieter"&&ablehnGrund.startsWith("Anderer Anbieter"))?"#c62828":C.schwarz,fontFamily:FONT.sans}}>{g}</button>
          ))}
        </div>
        {(ablehnGrund==="Anderer Anbieter"||ablehnGrund.startsWith("Anderer Anbieter:"))&&<input type="text" autoFocus placeholder="Welcher Anbieter? (z.B. ASB, MHD, JUH...)" value={ablehnGrund.startsWith("Anderer Anbieter:")?ablehnGrund.replace("Anderer Anbieter: ",""):""} onChange={e=>setAblehnGrund(e.target.value?`Anderer Anbieter: ${e.target.value}`:"Anderer Anbieter")} style={{width:"100%",padding:"8px 12px",border:"1px solid #e53935",borderRadius:6,fontSize:13,marginBottom:12,fontFamily:FONT.sans,boxSizing:"border-box"}}/>}
        {ablehnGrund==="Sonstiges"&&<input type="text" autoFocus placeholder="Grund eingeben..." onChange={e=>{if(e.target.value)setAblehnGrund(e.target.value);}} style={{width:"100%",padding:"8px 12px",border:"1px solid #ccc",borderRadius:6,fontSize:13,marginBottom:12,fontFamily:FONT.sans,boxSizing:"border-box"}}/>}
        <div style={{fontSize:11,color:"#888",marginBottom:12}}>Der Veranstalter wird nicht automatisch benachrichtigt.</div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button onClick={()=>setShowAblehnen(null)} style={{padding:"8px 18px",background:C.hellgrau,border:"none",borderRadius:6,fontSize:13,cursor:"pointer",fontFamily:FONT.sans}}>Abbrechen</button>
          <button disabled={!ablehnGrund} onClick={doAblehnen} style={{padding:"8px 22px",background:"#c62828",color:"#fff",border:"none",borderRadius:6,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:FONT.sans,opacity:ablehnGrund?1:0.4}}>Ablehnen</button>
        </div>
      </div>
    </div>}

    <ConfirmModal open={!!cfm} title={cfm?.title} message={cfm?.message} icon={cfm?.icon} confirmText={cfm?.confirmText} accent={cfm?.accent} onConfirm={cfm?.onConfirm} onCancel={()=>setCfm(null)}/>
  </div>);
}

function StatistikDashboard({user,year:appYear,toast}){
  const [year,setYear]=useState(appYear||new Date().getFullYear());
  const [bc,setBc]=useState("ALL");
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{setLoading(true);API.getStatistik(year,bc).then(d=>{setData(d);setLoading(false);}).catch(e=>{toast(e.message,"error");setLoading(false);});},[year,bc]);

  const exportCSV=()=>{
    if(!data||!data.events.length)return;
    const hdr="Auftragsnr;Name;Ort;Veranstalter;Status;Datum;Tage;Bereitschaft\n";
    const rows=data.events.map(e=>`${e.auftragsnr};${e.name};${e.ort};${e.veranstalter};${e.status};${e.date};${e.days};${e.bc}`).join("\n");
    const blob=new Blob(["\uFEFF"+hdr+rows],{type:"text/csv;charset=utf-8;"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`SanWD_Statistik_${year}.csv`;a.click();
  };

  const MONATE=["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
  const STATUS_COLORS={entwurf:"#bdbdbd",versendet:"#42a5f5",akzeptiert:"#66bb6a",abgeschlossen:"#1b5e20",abgelehnt:"#ef5350"};
  const STATUS_LABELS={entwurf:"Entwurf",versendet:"Versendet",akzeptiert:"Akzeptiert",abgeschlossen:"Abgeschlossen",abgelehnt:"Abgelehnt"};

  if(loading)return <div style={{textAlign:"center",padding:40,color:C.dunkelgrau}}>Lade Statistik...</div>;
  if(!data)return <div style={{textAlign:"center",padding:40}}>Keine Daten</div>;

  const maxMonth=Math.max(...data.byMonth.map(m=>m.count),1);
  const totalByStatus=Object.values(data.byStatus).reduce((a,b)=>a+b,0)||1;

  return(<div>
    {/* Filter */}
    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:16,flexWrap:"wrap"}}>
      <select value={year} onChange={e=>setYear(+e.target.value)} style={{padding:"7px 12px",border:`1px solid ${C.mittelgrau}`,borderRadius:6,fontSize:13,fontFamily:FONT.sans}}>
        {[...Array(5)].map((_,i)=>{const y=new Date().getFullYear()-i;return <option key={y} value={y}>{y}</option>;})}
      </select>
      {(user?.rolle==="admin"||user?.rolle==="kbl")&&<select value={bc} onChange={e=>setBc(e.target.value)} style={{padding:"7px 12px",border:`1px solid ${C.mittelgrau}`,borderRadius:6,fontSize:13,fontFamily:FONT.sans}}>
        <option value="ALL">Alle Bereitschaften</option>
        {(data.bereitschaften||[]).map(b=><option key={b.code} value={b.code}>{b.name||b.code}</option>)}
      </select>}
      <button onClick={exportCSV} style={{padding:"7px 14px",background:C.hellgrau,border:`1px solid ${C.mittelgrau}`,borderRadius:6,fontSize:12,cursor:"pointer",fontFamily:FONT.sans}}>📥 CSV Export</button>
    </div>

    {/* KPI Karten */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:20}}>
      {[
        {label:"Einsätze",value:data.totalEinsaetze,icon:"🚑",color:"#1565c0"},
        {label:"Behandelte",value:data.totalPatienten,icon:"🏥",color:"#c62828"},
        {label:"Transporte",value:data.totalTransporte||0,icon:"🚑",color:"#e65100"},
        {label:"Bereitschaften",value:data.byBc?.length||0,icon:"🏢",color:"#2e7d32"},
      ].map((kpi,i)=><div key={i} style={{background:"#fff",border:`1px solid ${C.mittelgrau}40`,borderRadius:10,padding:"16px 20px",borderLeft:`4px solid ${kpi.color}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontSize:10,color:C.dunkelgrau,textTransform:"uppercase",fontWeight:600,letterSpacing:0.5}}>{kpi.label}</div>
          <div style={{fontSize:28,fontWeight:800,color:kpi.color,fontFamily:FONT.sans}}>{kpi.value}</div></div>
          <span style={{fontSize:28}}>{kpi.icon}</span>
        </div>
      </div>)}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14}}>
      {/* Einsätze pro Monat */}
      <Card title="Einsätze pro Monat" accent={C.mittelblau}>
        <div style={{display:"flex",alignItems:"flex-end",gap:4,height:140,paddingTop:10}}>
          {data.byMonth.map((m,i)=><div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
            <div style={{fontSize:10,fontWeight:700,color:m.count>0?C.mittelblau:C.bgrau}}>{m.count||""}</div>
            <div style={{width:"100%",background:m.count>0?C.mittelblau:C.hellgrau,borderRadius:"4px 4px 0 0",height:`${Math.max(m.count/maxMonth*100,4)}%`,minHeight:4,transition:"height 0.3s"}}/>
            <div style={{fontSize:9,color:C.dunkelgrau}}>{MONATE[i]}</div>
          </div>)}
        </div>
      </Card>

      {/* Status Verteilung */}
      <Card title="Status" accent={C.rot}>
        {Object.entries(data.byStatus).sort((a,b)=>b[1]-a[1]).map(([st,cnt])=><div key={st} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <div style={{width:10,height:10,borderRadius:5,background:STATUS_COLORS[st]||"#999",flexShrink:0}}/>
          <div style={{flex:1,fontSize:12}}>{STATUS_LABELS[st]||st}</div>
          <div style={{background:STATUS_COLORS[st]||"#999",height:8,borderRadius:4,width:`${cnt/totalByStatus*100}%`,minWidth:8,maxWidth:120,transition:"width 0.3s"}}/>
          <div style={{fontSize:12,fontWeight:700,minWidth:24,textAlign:"right"}}>{cnt}</div>
        </div>)}
      </Card>
    </div>

    {/* Pro Bereitschaft */}
    {data.byBc.length>1&&<Card title="Nach Bereitschaft" accent={C.dunkelblau} style={{marginTop:14}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:8}}>
        {data.byBc.sort((a,b)=>b.count-a.count).map(b=><div key={b.code} style={{padding:"10px 14px",background:C.hellgrau,borderRadius:8,border:`1px solid ${C.mittelgrau}40`}}>
          <div style={{fontSize:13,fontWeight:700}}>{b.name}</div>
          <div style={{fontSize:11,color:C.dunkelgrau}}>{b.count} Einsätze</div>
        </div>)}
      </div>
    </Card>}

    {/* Alle Vorgänge Tabelle */}
    <Card title={`Alle Vorgänge ${year}`} accent={C.dunkelgrau} style={{marginTop:14}}>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead><tr style={{borderBottom:`2px solid ${C.mittelgrau}`}}>
            {["Nr","Veranstaltung","Ort","Veranstalter","Status","Datum","Tage"].map(h=><th key={h} style={{padding:"6px 8px",textAlign:"left",fontWeight:700,color:C.dunkelgrau,fontSize:10,textTransform:"uppercase"}}>{h}</th>)}
          </tr></thead>
          <tbody>{data.events.sort((a,b)=>(a.date||"").localeCompare(b.date||"")).map(ev=><tr key={ev.id} style={{borderBottom:`1px solid ${C.hellgrau}`}}>
            <td style={{padding:"5px 8px",fontWeight:600,color:C.mittelblau}}>{ev.auftragsnr}</td>
            <td style={{padding:"5px 8px"}}>{ev.name}</td>
            <td style={{padding:"5px 8px",color:C.dunkelgrau}}>{ev.ort}</td>
            <td style={{padding:"5px 8px",color:C.dunkelgrau}}>{ev.veranstalter}</td>
            <td style={{padding:"5px 8px"}}><span style={{display:"inline-block",padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,background:(STATUS_COLORS[ev.status]||"#999")+"20",color:STATUS_COLORS[ev.status]||"#999"}}>{STATUS_LABELS[ev.status]||ev.status}</span></td>
            <td style={{padding:"5px 8px"}}>{ev.date?new Date(ev.date).toLocaleDateString("de-DE"):"-"}</td>
            <td style={{padding:"5px 8px",textAlign:"center"}}>{ev.days}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </Card>
  </div>);
}

function EinstellungenTab({stammdaten,updateStamm,updateRate,user,toast,klauseln,klauselnEdit,setKlauselnEdit,klauselnSaving,saveKlauseln,bereitschaft,reloadStammdaten}){
  const [sub,setSub]=useState("org");
  const subs=[{id:"org",label:"Organisation",icon:"🏢"},{id:"bereitschaften",label:"Bereitschaften",icon:"🏥"},{id:"kosten",label:"Kostensätze",icon:"💰"},{id:"klauseln",label:"Textvorlagen",icon:"📝"},{id:"nextcloud",label:"Nextcloud",icon:"☁️"},{id:"email",label:"E-Mail",icon:"✉️"}];
  return(<div>
    <div style={{display:"flex",gap:4,marginBottom:16,flexWrap:"wrap"}}>
      {subs.map(s=><button key={s.id} onClick={()=>setSub(s.id)} style={{padding:"7px 14px",background:sub===s.id?C.rot:"#fff",color:sub===s.id?"#fff":C.dunkelgrau,border:`1px solid ${sub===s.id?C.rot:C.mittelgrau}`,borderRadius:6,fontSize:12,fontWeight:sub===s.id?700:500,cursor:"pointer",fontFamily:FONT.sans,display:"flex",alignItems:"center",gap:5}}><span style={{fontSize:13}}>{s.icon}</span>{s.label}</button>)}
    </div>

    {sub==="org"&&<div style={{maxWidth:600}}>
      <Card title="🏢 Organisation" accent={C.rot}><Inp label="Kreisverband" value={stammdaten.kvName} onChange={v=>updateStamm("kvName",v)}/><Inp label="Kreisgeschäftsführer" value={stammdaten.kgf} onChange={v=>updateStamm("kgf",v)}/><Inp label="Adresse" value={stammdaten.kvAdresse} onChange={v=>updateStamm("kvAdresse",v)}/><Inp label="PLZ Ort" value={stammdaten.kvPlzOrt} onChange={v=>updateStamm("kvPlzOrt",v)}/></Card>
      <Card title="Logo für Drucksachen" accent={C.dunkelblau} sub="Wird auf allen Dokumenten angezeigt (außer ILS)">
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:10}}>
          <div style={{width:120,height:60,border:`2px dashed ${C.mittelgrau}60`,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",background:C.hellgrau,overflow:"hidden",flexShrink:0}}>
            {stammdaten.customLogo?<img src={stammdaten.customLogo} alt="Logo" style={{maxWidth:"100%",maxHeight:"100%"}}/>:<span style={{fontSize:10,color:C.bgrau}}>Kein Logo</span>}
          </div>
          <div style={{flex:1}}>
            <input type="file" accept="image/*" id="logoUpload" style={{display:"none"}} onChange={async e=>{const f=e.target.files[0];if(!f)return;const fd=new FormData();fd.append("logo",f);try{const r=await fetch("/api/stammdaten/logo",{method:"POST",body:fd,credentials:"include"});const d=await r.json();if(d.logo){updateStamm("customLogo",d.logo+"?t="+Date.now());}}catch(err){console.error("Logo-Upload fehlgeschlagen:",err);}}}/>
            <label htmlFor="logoUpload" style={{display:"inline-block",padding:"6px 14px",background:C.mittelblau,color:"#fff",borderRadius:4,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT.sans}}>📁 Logo hochladen</label>
            {stammdaten.customLogo&&<button onClick={async()=>{try{await fetch("/api/stammdaten/logo",{method:"DELETE",credentials:"include"});}catch(e){console.error("Fehler:",e);}updateStamm("customLogo",null);}} style={{marginLeft:8,padding:"6px 12px",background:"transparent",border:`1px solid ${C.rot}`,borderRadius:4,fontSize:11,color:C.rot,cursor:"pointer",fontFamily:FONT.sans}}>✕ Entfernen</button>}
            <div style={{fontSize:10,color:C.bgrau,marginTop:4}}>Empfohlen: PNG/JPG, ca. 300×150px</div>
          </div>
        </div>
      </Card>
      <div style={{padding:"14px 16px",background:"#e8eaf6",borderRadius:8,border:"1px solid #c5cae9",marginTop:8}}>
        <div style={{fontSize:12,color:"#3949ab"}}>🏥 <strong>Bereitschaftsdaten</strong> (Leiter, E-Mail, Telefon) werden jetzt im Tab <button onClick={()=>setSub("bereitschaften")} style={{background:"none",border:"none",color:C.mittelblau,fontWeight:700,cursor:"pointer",textDecoration:"underline",fontSize:12,fontFamily:FONT.sans,padding:0}}>Bereitschaften</button> verwaltet.</div>
      </div>
    </div>}

    {sub==="bereitschaften"&&<BereitschaftenAdmin toast={toast} userBC={user?.bereitschaftCode} reloadStammdaten={reloadStammdaten}/>}

    {sub==="kosten"&&<div style={{maxWidth:600}}>
      <Card title="Kostensätze (EUR)" accent="#d4920a"><div className="rg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>{[["Helfer (€/Std)","helfer"],["KTW","ktw"],["RTW","rtw"],["GKTW","gktw"],["EL (€/Std)","einsatzleiter"],["EL-KFZ","einsatzleiterKfz"],["SEG-LKW","segLkw"],["MTW","mtw"],["Zelt","zelt"],["Verpfl. (€/P/8h)","verpflegung"]].map(([l,k])=><Inp key={k} small label={l} type="number" min={0} step={0.5} value={stammdaten.rates[k]} onChange={v=>updateRate(k,v)}/>)}</div></Card>
      <Card title="km-Sätze" accent={C.mittelblau}><div className="rg3" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 10px"}}>{[["KTW","kmKtw"],["RTW","kmRtw"],["GKTW","kmGktw"],["EL-KFZ","kmElKfz"],["SEG","kmSegLkw"],["MTW","kmMtw"]].map(([l,k])=><Inp key={k} small label={l} type="number" min={0} step={0.1} value={stammdaten.rates[k]} onChange={v=>updateRate(k,v)}/>)}</div></Card>
    </div>}

    {sub==="klauseln"&&<Card title="Textvorlagen (AAB & Vertrag)" accent={C.mittelblau} sub="Klauseln können bei Bedarf angepasst werden">
      <div>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12,gap:8}}>
          <Btn small variant="success" onClick={saveKlauseln} disabled={klauselnSaving}>{klauselnSaving?"Speichert...":"Alle Textvorlagen speichern"}</Btn>
        </div>
        {["aab","vertrag"].map(dok=>(
          <div key={dok} style={{marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:13,color:C.dunkelgrau,marginBottom:8,paddingBottom:4,borderBottom:"2px solid "+(dok==="aab"?C.rot:C.mittelblau)}}>
              {dok==="aab"?"Allgemeine Auftragsbedingungen (AAB)":"Vereinbarung - Vertragsklauseln"}
            </div>
            {klauseln.filter(k=>k.dokument===dok).sort((a,b)=>a.reihenfolge-b.reihenfolge).map(k=>(
              <div key={k.id} style={{marginBottom:14}}>
                <div style={{fontWeight:600,fontSize:12,color:C.schwarz,marginBottom:4}}>{k.titel}</div>
                <textarea value={klauselnEdit[k.id]||""} onChange={e=>setKlauselnEdit(prev=>({...prev,[k.id]:e.target.value}))} style={{width:"100%",minHeight:120,padding:"8px 10px",border:`1px solid ${C.mittelgrau}`,borderRadius:4,fontFamily:"Arial,sans-serif",fontSize:11,lineHeight:1.5,resize:"vertical",background:"#fafafa"}}/>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Card>}

    {sub==="nextcloud"&&<NextcloudConfig toast={toast}/>}
    {sub==="email"&&<SmtpConfig toast={toast}/>}
  </div>);
}


// ═══════════════════════════════════════════════════════════════════
// Digitales Einsatzprotokoll (Live-Formular)
// ═══════════════════════════════════════════════════════════════════
function EinsatzprotokollLive({event:ev,currentEventId,days,user,toast}){
  const activeDays=(days||[]).filter(d=>d.active!==false);
  const [dayIdx,setDayIdx]=useState(0);
  const [proto,setProto]=useState({helfer:"",fahrzeuge:"",ankunftPlan:"",ankunftReal:"",abfahrtPlan:"",abfahrtReal:"",behandelt:0,bagatelle:0,transporte:0,besonderheiten:"",tagebuch:[]});
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [lastSaved,setLastSaved]=useState(null);
  const [tbText,setTbText]=useState("");

  useEffect(()=>{
    if(!currentEventId)return;
    setLoading(true);
    API.getProtokoll(currentEventId).then(r=>{
      const p=r.protokoll?.[String(dayIdx)];
      const day=activeDays[dayIdx];
      if(p){setProto({helfer:"",fahrzeuge:"",ankunftPlan:day?.startTime||"",ankunftReal:"",abfahrtPlan:day?.endTime||"",abfahrtReal:"",behandelt:0,bagatelle:0,transporte:0,besonderheiten:"",tagebuch:[],...p});}
      else{setProto({helfer:"",fahrzeuge:"",ankunftPlan:day?.startTime||"",ankunftReal:"",abfahrtPlan:day?.endTime||"",abfahrtReal:"",behandelt:0,bagatelle:0,transporte:0,besonderheiten:"",tagebuch:[]});}
      setLoading(false);
    }).catch(()=>setLoading(false));
  },[currentEventId,dayIdx]);

  const save=async()=>{
    if(!currentEventId){toast("Vorgang zuerst speichern","warning");return;}
    setSaving(true);
    try{await API.saveProtokoll(currentEventId,dayIdx,proto);setLastSaved(new Date().toLocaleTimeString("de-DE"));toast("Protokoll gespeichert","success");}
    catch(e){toast(e.message,"error");}
    finally{setSaving(false);}
  };

  useEffect(()=>{
    if(!currentEventId||loading)return;
    const t=setTimeout(()=>{API.saveProtokoll(currentEventId,dayIdx,proto).then(()=>setLastSaved(new Date().toLocaleTimeString("de-DE"))).catch(()=>{});},30000);
    return()=>clearTimeout(t);
  },[proto,currentEventId,dayIdx,loading]);

  const up=(k,v)=>setProto(p=>({...p,[k]:v}));

  const addTbEntry=()=>{
    if(!tbText.trim())return;
    const entry={zeit:new Date().toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"}),text:tbText.trim(),autor:user?.name||""};
    up("tagebuch",[...proto.tagebuch,entry]);
    setTbText("");
  };

  const removeTbEntry=(i)=>{const t=[...proto.tagebuch];t.splice(i,1);up("tagebuch",t);};

  const day=activeDays[dayIdx];
  const dayLabel=day?.date?new Date(day.date).toLocaleDateString("de-DE",{weekday:"long",day:"2-digit",month:"2-digit",year:"numeric"}):`Tag ${(day?.id||dayIdx+1)}`;

  const F=({label,value,onChange,placeholder,type,wide,half})=><div style={{flex:wide?"1 1 100%":half?"1 1 45%":"1 1 200px",minWidth:half?140:undefined,marginBottom:8}}>
    <div style={{fontSize:10,fontWeight:600,color:"#555",marginBottom:2}}>{label}</div>
    <input type={type||"text"} value={value??""} onChange={e=>onChange(type==="number"?+e.target.value:e.target.value)} placeholder={placeholder||""} style={{width:"100%",padding:"6px 10px",border:"1px solid #ccc",borderRadius:5,fontSize:12,fontFamily:FONT.sans}} min={type==="number"?0:undefined}/>
  </div>;

  if(loading)return <div style={{padding:20,textAlign:"center",color:C.dunkelgrau}}>Lade Protokoll...</div>;

  return(<div>
    {activeDays.length>1&&<div style={{display:"flex",gap:4,marginBottom:12,flexWrap:"wrap"}}>
      {activeDays.map((d,i)=><button key={i} onClick={()=>setDayIdx(i)} style={{padding:"6px 12px",background:dayIdx===i?C.dunkelblau:"#fff",color:dayIdx===i?"#fff":C.dunkelgrau,border:`1px solid ${dayIdx===i?C.dunkelblau:C.mittelgrau}`,borderRadius:6,fontSize:11,fontWeight:dayIdx===i?700:500,cursor:"pointer",fontFamily:FONT.sans}}>
        {d.date?new Date(d.date).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit"}):`Tag ${d.id||i+1}`}
      </button>)}
    </div>}

    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div style={{fontSize:15,fontWeight:700,color:C.dunkelblau}}>📋 Einsatzprotokoll – {dayLabel}</div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        {lastSaved&&<span style={{fontSize:10,color:C.dunkelgrau}}>💾 {lastSaved}</span>}
        <button onClick={save} disabled={saving} style={{padding:"6px 16px",background:C.dunkelblau,color:"#fff",border:"none",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT.sans}}>{saving?"Speichern...":"💾 Speichern"}</button>
      </div>
    </div>

    {/* Helfer & Fahrzeuge */}
    <Card title="Einsatzkräfte & Fahrzeuge" accent={C.dunkelblau}>
      <div style={{marginBottom:8}}>
        <div style={{fontSize:10,fontWeight:600,color:"#555",marginBottom:2}}>Eingesetzte Helfer (Namen)</div>
        <textarea value={proto.helfer||""} onChange={e=>up("helfer",e.target.value)} rows={3} placeholder={"Name 1, Name 2, Name 3\noder je Zeile ein Name"} style={{width:"100%",padding:"6px 10px",border:"1px solid #ccc",borderRadius:5,fontSize:12,fontFamily:FONT.sans,lineHeight:1.4,resize:"vertical"}}/>
      </div>
      <div>
        <div style={{fontSize:10,fontWeight:600,color:"#555",marginBottom:2}}>Eingesetzte Fahrzeuge</div>
        <textarea value={proto.fahrzeuge||""} onChange={e=>up("fahrzeuge",e.target.value)} rows={2} placeholder="z.B. KTW 41/1, RTW 41/2, ELW 41/1" style={{width:"100%",padding:"6px 10px",border:"1px solid #ccc",borderRadius:5,fontSize:12,fontFamily:FONT.sans,lineHeight:1.4,resize:"vertical"}}/>
      </div>
    </Card>

    {/* Zeiten */}
    <Card title="Einsatzzeiten" accent={C.mittelblau}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div style={{padding:"10px 14px",background:"#f5f5f5",borderRadius:8}}>
          <div style={{fontSize:11,fontWeight:700,color:C.dunkelgrau,marginBottom:8}}>Ankunft</div>
          <div style={{display:"flex",gap:8}}>
            <F label="Geplant" value={proto.ankunftPlan} onChange={v=>up("ankunftPlan",v)} type="time" half/>
            <F label="Tatsächlich" value={proto.ankunftReal} onChange={v=>up("ankunftReal",v)} type="time" half/>
          </div>
        </div>
        <div style={{padding:"10px 14px",background:"#f5f5f5",borderRadius:8}}>
          <div style={{fontSize:11,fontWeight:700,color:C.dunkelgrau,marginBottom:8}}>Abfahrt</div>
          <div style={{display:"flex",gap:8}}>
            <F label="Geplant" value={proto.abfahrtPlan} onChange={v=>up("abfahrtPlan",v)} type="time" half/>
            <F label="Tatsächlich" value={proto.abfahrtReal} onChange={v=>up("abfahrtReal",v)} type="time" half/>
          </div>
        </div>
      </div>
    </Card>

    {/* Einsatzzahlen */}
    <Card title="Einsatzzahlen" accent={C.rot}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14}}>
        <div style={{textAlign:"center",padding:"14px 10px",background:`${C.rot}08`,borderRadius:8,border:`1px solid ${C.rot}30`}}>
          <div style={{fontSize:10,fontWeight:600,color:C.dunkelgrau,marginBottom:4}}>Behandelt</div>
          <input type="number" min={0} value={proto.behandelt||0} onChange={e=>up("behandelt",+e.target.value)} style={{width:80,padding:"8px",border:`2px solid ${C.rot}`,borderRadius:8,fontSize:22,fontWeight:800,textAlign:"center",color:C.rot,fontFamily:FONT.sans}}/>
        </div>
        <div style={{textAlign:"center",padding:"14px 10px",background:"#fff8e1",borderRadius:8,border:"1px solid #ffcc80"}}>
          <div style={{fontSize:10,fontWeight:600,color:C.dunkelgrau,marginBottom:4}}>Bagatelle</div>
          <input type="number" min={0} value={proto.bagatelle||0} onChange={e=>up("bagatelle",+e.target.value)} style={{width:80,padding:"8px",border:"2px solid #f9a825",borderRadius:8,fontSize:22,fontWeight:800,textAlign:"center",color:"#f9a825",fontFamily:FONT.sans}}/>
        </div>
        <div style={{textAlign:"center",padding:"14px 10px",background:"#e3f2fd",borderRadius:8,border:"1px solid #90caf9"}}>
          <div style={{fontSize:10,fontWeight:600,color:C.dunkelgrau,marginBottom:4}}>Transport</div>
          <input type="number" min={0} value={proto.transporte||0} onChange={e=>up("transporte",+e.target.value)} style={{width:80,padding:"8px",border:"2px solid #1565c0",borderRadius:8,fontSize:22,fontWeight:800,textAlign:"center",color:"#1565c0",fontFamily:FONT.sans}}/>
        </div>
      </div>
      <div style={{textAlign:"center",padding:"12px 16px",background:"#f5f5f5",borderRadius:8,border:`1px solid ${C.mittelgrau}`}}>
        <div style={{fontSize:10,fontWeight:600,color:C.dunkelgrau,marginBottom:2}}>Gesamte Behandelte</div>
        <div style={{fontSize:30,fontWeight:900,color:C.rot,fontFamily:FONT.sans}}>{(proto.behandelt||0)+(proto.bagatelle||0)+(proto.transporte||0)}</div>
      </div>
    </Card>

    {/* Tagebuch */}
    <Card title={`Einsatztagebuch (${proto.tagebuch.length} Einträge)`} accent="#5c6bc0">
      <div style={{marginBottom:10}}>
        {proto.tagebuch.map((e,i)=><div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",padding:"6px 10px",background:i%2===0?"#fafafe":"#fff",borderRadius:4,marginBottom:2,border:"1px solid #e8eaf6"}}>
          <span style={{fontSize:11,fontWeight:700,color:"#5c6bc0",whiteSpace:"nowrap",minWidth:42}}>{e.zeit}</span>
          <span style={{fontSize:12,flex:1,lineHeight:1.4}}>{e.text}</span>
          <span style={{fontSize:9,color:"#999",whiteSpace:"nowrap"}}>{e.autor}</span>
          <button onClick={()=>removeTbEntry(i)} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#ccc",padding:"0 2px"}} title="Entfernen">✕</button>
        </div>)}
        {proto.tagebuch.length===0&&<div style={{padding:"16px",textAlign:"center",color:C.bgrau,fontSize:12,background:"#f5f5f5",borderRadius:6}}>Noch keine Einträge – Dokumentiere den Einsatzverlauf chronologisch</div>}
      </div>
      <div style={{display:"flex",gap:6}}>
        <input value={tbText} onChange={e=>setTbText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();addTbEntry();}}} placeholder="Was passiert? z.B. Einsatzkräfte vor Ort, Veranstaltung eröffnet, Patient versorgt..." style={{flex:1,padding:"8px 12px",border:"1px solid #c5cae9",borderRadius:6,fontSize:12,fontFamily:FONT.sans}}/>
        <button onClick={addTbEntry} disabled={!tbText.trim()} style={{padding:"8px 16px",background:"#5c6bc0",color:"#fff",border:"none",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT.sans,whiteSpace:"nowrap"}}>+ Eintrag</button>
      </div>
    </Card>

    {/* Besonderheiten */}
    <Card title="Besonderheiten" accent={C.dunkelgrau}>
      <textarea value={proto.besonderheiten||""} onChange={e=>up("besonderheiten",e.target.value)} rows={4} placeholder="Besondere Vorkommnisse, Polizeieinsatz, technische Probleme, Wetter, etc." style={{width:"100%",padding:"8px 10px",border:"1px solid #ccc",borderRadius:5,fontSize:12,fontFamily:FONT.sans,lineHeight:1.4,resize:"vertical"}}/>
    </Card>

    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12}}>
      <div style={{fontSize:10,color:C.dunkelgrau}}>Auto-Speicherung alle 30s{lastSaved?` · Zuletzt: ${lastSaved}`:""}</div>
      <button onClick={save} disabled={saving} style={{padding:"8px 24px",background:C.dunkelblau,color:"#fff",border:"none",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:FONT.sans}}>{saving?"Speichern...":"💾 Protokoll speichern"}</button>
    </div>
  </div>);
}

function SmtpConfig({toast}){
  const [cfg,setCfg]=useState({});const [loading,setLoading]=useState(true);const [test,setTest]=useState(null);const [saving,setSaving]=useState(false);
  useEffect(()=>{(async()=>{try{const c=await API.getSmtpConfig();setCfg(c);}catch{}finally{setLoading(false);}})();},[]);
  const save=async()=>{setSaving(true);try{await API.saveSmtpConfig(cfg);toast("E-Mail Einstellungen gespeichert","success");}catch(e){toast(e.message,"error");}finally{setSaving(false);}};
  const doTest=async()=>{setTest(null);try{const r=await API.testSmtp();setTest(r);}catch(e){setTest({success:false,error:e.message});}};
  if(loading)return <Card accent={C.mittelblau}><div style={{textAlign:"center",padding:20}}>Lade...</div></Card>;
  return(<div style={{maxWidth:700}}>
    <Card title="✉️ E-Mail / SMTP Konfiguration" accent="#e65100">
      <div style={{marginBottom:16}}>
        <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",marginBottom:16}}>
          <div style={{width:42,height:24,borderRadius:12,background:cfg.smtp_enabled==="true"?"#e65100":"#ccc",position:"relative",transition:"0.2s",cursor:"pointer"}} onClick={()=>setCfg(p=>({...p,smtp_enabled:p.smtp_enabled==="true"?"false":"true"}))}>
            <div style={{width:20,height:20,borderRadius:10,background:"#fff",position:"absolute",top:2,left:cfg.smtp_enabled==="true"?20:2,transition:"0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.3)"}}/>
          </div>
          <span style={{fontSize:14,fontWeight:600}}>E-Mail Versand {cfg.smtp_enabled==="true"?"aktiv":"deaktiviert"}</span>
        </label>

        <div style={{display:"flex",gap:8,marginBottom:12}}>
          {[{v:"smtp",l:"Standard SMTP"},{v:"365",l:"Microsoft 365"},{v:"exchange",l:"Exchange"}].map(m=>(
            <button key={m.v} onClick={()=>setCfg(p=>({...p,smtp_mode:m.v}))} style={{flex:1,padding:"8px 12px",background:(cfg.smtp_mode||"smtp")===m.v?"#e65100":"#fff",color:(cfg.smtp_mode||"smtp")===m.v?"#fff":"#333",border:`1px solid ${(cfg.smtp_mode||"smtp")===m.v?"#e65100":"#ccc"}`,borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT.sans}}>{m.l}</button>
          ))}
        </div>

        {(cfg.smtp_mode||"smtp")!=="365"&&<div style={{display:"grid",gridTemplateColumns:"3fr 1fr",gap:8,marginBottom:8}}>
          <div><div style={{fontSize:11,fontWeight:600,color:"#555",marginBottom:3}}>SMTP Host</div>
            <input value={cfg.smtp_host||""} onChange={e=>setCfg(p=>({...p,smtp_host:e.target.value}))} placeholder="mail.example.com" style={{width:"100%",padding:"7px 10px",border:"1px solid #ccc",borderRadius:5,fontSize:12,fontFamily:FONT.sans}}/></div>
          <div><div style={{fontSize:11,fontWeight:600,color:"#555",marginBottom:3}}>Port</div>
            <input value={cfg.smtp_port||"587"} onChange={e=>setCfg(p=>({...p,smtp_port:e.target.value}))} style={{width:"100%",padding:"7px 10px",border:"1px solid #ccc",borderRadius:5,fontSize:12,fontFamily:FONT.sans}}/></div>
        </div>}

        {(cfg.smtp_mode||"smtp")==="365"&&<div style={{fontSize:11,color:"#666",padding:"8px 12px",background:"#fff3e0",borderRadius:6,marginBottom:8}}>Microsoft 365: Verwendet automatisch smtp.office365.com:587</div>}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <div><div style={{fontSize:11,fontWeight:600,color:"#555",marginBottom:3}}>Benutzer / E-Mail</div>
            <input value={cfg.smtp_user||""} onChange={e=>setCfg(p=>({...p,smtp_user:e.target.value}))} placeholder="user@brk.de" style={{width:"100%",padding:"7px 10px",border:"1px solid #ccc",borderRadius:5,fontSize:12,fontFamily:FONT.sans}}/></div>
          <div><div style={{fontSize:11,fontWeight:600,color:"#555",marginBottom:3}}>Passwort</div>
            <input type="password" value={cfg.smtp_password||""} onChange={e=>setCfg(p=>({...p,smtp_password:e.target.value}))} style={{width:"100%",padding:"7px 10px",border:"1px solid #ccc",borderRadius:5,fontSize:12,fontFamily:FONT.sans}}/></div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
          <div><div style={{fontSize:11,fontWeight:600,color:"#555",marginBottom:3}}>Absender E-Mail</div>
            <input value={cfg.smtp_from_email||""} onChange={e=>setCfg(p=>({...p,smtp_from_email:e.target.value}))} placeholder="sanwd@brk-sob.de" style={{width:"100%",padding:"7px 10px",border:"1px solid #ccc",borderRadius:5,fontSize:12,fontFamily:FONT.sans}}/></div>
          <div><div style={{fontSize:11,fontWeight:600,color:"#555",marginBottom:3}}>Absender Name</div>
            <input value={cfg.smtp_from_name||""} onChange={e=>setCfg(p=>({...p,smtp_from_name:e.target.value}))} placeholder="BRK Sanitätswachdienst" style={{width:"100%",padding:"7px 10px",border:"1px solid #ccc",borderRadius:5,fontSize:12,fontFamily:FONT.sans}}/></div>
        </div>

        <div style={{background:"#f5f5f5",borderRadius:6,padding:"10px 14px",marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:600,color:"#555",marginBottom:6}}>Optionen</div>
          <label style={{display:"flex",alignItems:"center",gap:8,fontSize:12,cursor:"pointer",marginBottom:6}}>
            <input type="checkbox" checked={cfg.smtp_on_behalf==="true"} onChange={e=>setCfg(p=>({...p,smtp_on_behalf:e.target.checked?"true":"false"}))} style={{accentColor:"#e65100"}}/>
            Im Auftrag von: Bearbeitende Person als Reply-To setzen
          </label>
          <label style={{display:"flex",alignItems:"center",gap:8,fontSize:12,cursor:"pointer"}}>
            <input type="checkbox" checked={cfg.smtp_cc_bereitschaft==="true"} onChange={e=>setCfg(p=>({...p,smtp_cc_bereitschaft:e.target.checked?"true":"false"}))} style={{accentColor:"#e65100"}}/>
            CC: Bereitschafts-E-Mail bei jedem Versand in Kopie
          </label>
        </div>

        <div style={{background:"#fff3e0",borderRadius:6,padding:"14px 14px",marginBottom:12,border:"1px solid #ffe0b2"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#e65100",marginBottom:10}}>📩 Anfrage-Benachrichtigungen</div>
          <div style={{marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:600,color:"#555",marginBottom:3}}>Empfänger bei neuer Anfrage</div>
            <input value={cfg.smtp_notify_recipients||""} onChange={e=>setCfg(p=>({...p,smtp_notify_recipients:e.target.value}))} placeholder="mail1@brk.de, mail2@brk.de (leer = Bereitschafts-E-Mails)" style={{width:"100%",padding:"7px 10px",border:"1px solid #ccc",borderRadius:5,fontSize:12,fontFamily:FONT.sans}}/>
            <div style={{fontSize:10,color:"#888",marginTop:3}}>Kommagetrennte E-Mail-Adressen. Wenn leer, werden die E-Mails der Bereitschaften verwendet.</div>
          </div>
          <label style={{display:"flex",alignItems:"center",gap:8,fontSize:12,cursor:"pointer"}}>
            <input type="checkbox" checked={cfg.smtp_anfrage_confirm==="true"} onChange={e=>setCfg(p=>({...p,smtp_anfrage_confirm:e.target.checked?"true":"false"}))} style={{accentColor:"#e65100"}}/>
            Bestätigungsmail an den Anfragenden senden
          </label>
          <div style={{fontSize:10,color:"#888",marginTop:3,marginLeft:26}}>Der Veranstalter erhält automatisch eine Eingangsbestätigung per E-Mail.</div>
        </div>

        <div style={{background:"#e8eaf6",borderRadius:6,padding:"14px 14px",marginBottom:12,border:"1px solid #c5cae9"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#1a237e",marginBottom:10}}>💳 FiBu-Weiterleitung</div>
          <div>
            <div style={{fontSize:11,fontWeight:600,color:"#555",marginBottom:3}}>FiBu E-Mail-Adresse</div>
            <input value={cfg.fibu_email||""} onChange={e=>setCfg(p=>({...p,fibu_email:e.target.value}))} placeholder="fibu@brk-ndsob.de" style={{width:"100%",padding:"7px 10px",border:"1px solid #ccc",borderRadius:5,fontSize:12,fontFamily:FONT.sans}}/>
            <div style={{fontSize:10,color:"#888",marginTop:3}}>Standard-Empfänger für die FiBu-Weiterleitung aus der Checkliste.</div>
          </div>
        </div>

        <div style={{display:"flex",gap:8}}>
          <button onClick={save} disabled={saving} style={{padding:"8px 20px",background:"#e65100",color:"#fff",border:"none",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:FONT.sans}}>{saving?"Speichern...":"Speichern"}</button>
          <button onClick={doTest} style={{padding:"8px 20px",background:C.hellgrau,border:"1px solid #ccc",borderRadius:6,fontSize:13,cursor:"pointer",fontFamily:FONT.sans}}>Verbindung testen</button>
        </div>

        {test&&<div style={{marginTop:12,padding:"10px 14px",background:test.success?"#e8f5e9":"#ffebee",border:`1px solid ${test.success?"#a5d6a7":"#ef9a9a"}`,borderRadius:6,fontSize:12,color:test.success?"#2e7d32":"#c62828"}}>
          {test.success?"✅ "+test.message:"❌ "+test.error}
        </div>}
      </div>
    </Card>
  </div>);
}

// ═══════════════════════════════════════════════════════════════════
// Mail Compose Modal
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
// BEREITSCHAFTEN ADMIN (Einstellungen Tab)
// ═══════════════════════════════════════════════════════════════════════════
function BereitschaftenAdmin({toast,userBC,reloadStammdaten}){
  const [bcs,setBcs]=useState([]);
  const [loading,setLoading]=useState(true);
  const [editBC,setEditBC]=useState(null);
  const [saving,setSaving]=useState(false);

  useEffect(()=>{loadBCs();},[]);
  const loadBCs=async()=>{try{const r=await API.getAllBereitschaftenDetails();setBcs(r);}catch(e){toast("Fehler: "+e.message,"error");}finally{setLoading(false);}};

  const save=async()=>{
    if(!editBC)return;
    setSaving(true);
    try{
      const r=await API.updateBereitschaftAdmin(editBC.code,{leiter_name:editBC.leiter_name||"",leiter_title:editBC.leiter_title||"",telefon:editBC.telefon||"",fax:editBC.fax||"",mobil:editBC.mobil||"",email:editBC.email||"",funkgruppe:editBC.funkgruppe||""});
      if(r?.success){toast(`${editBC.name} gespeichert`,"success");setBcs(p=>p.map(b=>b.code===editBC.code?{...b,...editBC}:b));if(editBC.code===userBC&&reloadStammdaten)reloadStammdaten();setEditBC(null);}
      else toast("Fehler","error");
    }catch(e){toast(e.message,"error");}
    finally{setSaving(false);}
  };

  if(loading)return <div style={{textAlign:"center",padding:40,color:C.dunkelgrau}}>Lade Bereitschaften...</div>;

  return(<div style={{maxWidth:700}}>
    <Card title="🏥 Bereitschaften verwalten" accent={C.mittelblau} sub="Kontaktdaten aller Bereitschaften bearbeiten">
      <div style={{fontSize:12,color:C.dunkelgrau,marginBottom:12}}>Die E-Mail-Adresse wird für Angebotsversand (CC), FiBu-Benachrichtigungen und Anfrage-Weiterleitung verwendet.</div>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead><tr style={{borderBottom:`2px solid ${C.mittelgrau}40`}}>
          <th style={{textAlign:"left",padding:"6px 8px",fontWeight:600,color:C.dunkelgrau}}>Bereitschaft</th>
          <th style={{textAlign:"left",padding:"6px 8px",fontWeight:600,color:C.dunkelgrau}}>Leiter</th>
          <th style={{textAlign:"left",padding:"6px 8px",fontWeight:600,color:C.dunkelgrau}}>E-Mail</th>
          <th style={{textAlign:"left",padding:"6px 8px",fontWeight:600,color:C.dunkelgrau}}>Telefon</th>
          <th style={{padding:"6px 4px",width:40}}></th>
        </tr></thead>
        <tbody>{bcs.map(b=><tr key={b.code} style={{borderBottom:`1px solid ${C.hellgrau}`}} onDoubleClick={()=>setEditBC({...b})}>
          <td style={{padding:"8px 8px",fontWeight:600}}>{b.short||b.code}</td>
          <td style={{padding:"8px 8px"}}>{b.leiter_name||"–"}</td>
          <td style={{padding:"8px 8px",color:b.email?"inherit":C.rot,fontWeight:b.email?400:600}}>{b.email||"⚠️ Fehlt!"}</td>
          <td style={{padding:"8px 8px"}}>{b.telefon||"–"}</td>
          <td style={{padding:"8px 4px"}}><button onClick={()=>setEditBC({...b})} style={{background:"none",border:"none",cursor:"pointer",fontSize:14}} title="Bearbeiten">✏️</button></td>
        </tr>)}</tbody>
      </table>
    </Card>

    {/* Edit Modal */}
    {editBC&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(3px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setEditBC(null)}>
      <div style={{background:"#fff",borderRadius:12,maxWidth:520,width:"92%",maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"16px 22px",borderBottom:"1px solid #f0f0f0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:20}}>🏥</span>
            <div><div style={{fontSize:15,fontWeight:700}}>{editBC.name}</div><div style={{fontSize:11,color:C.dunkelgrau}}>Code: {editBC.code}</div></div>
          </div>
          <button onClick={()=>setEditBC(null)} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#999"}}>✕</button>
        </div>
        <div style={{padding:"18px 22px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}} className="rg2">
            <Inp label="Bereitschaftsleiter" value={editBC.leiter_name||""} onChange={v=>setEditBC(p=>({...p,leiter_name:v}))}/>
            <Inp label="Funktion/Titel" value={editBC.leiter_title||""} onChange={v=>setEditBC(p=>({...p,leiter_title:v}))}/>
            <Inp label="Telefon" value={editBC.telefon||""} onChange={v=>setEditBC(p=>({...p,telefon:v}))}/>
            <Inp label="Fax" value={editBC.fax||""} onChange={v=>setEditBC(p=>({...p,fax:v}))}/>
            <Inp label="Mobil" value={editBC.mobil||""} onChange={v=>setEditBC(p=>({...p,mobil:v}))}/>
          </div>
          <div style={{marginTop:4,padding:"12px 14px",background:"#e8eaf6",borderRadius:6,border:"1px solid #c5cae9"}}>
            <Inp label="E-Mail der Bereitschaft *" value={editBC.email||""} onChange={v=>setEditBC(p=>({...p,email:v}))} placeholder="bereitschaft@brk.de"/>
            <div style={{fontSize:10,color:"#3949ab",marginTop:2}}>Wird als CC beim Angebotsversand, für FiBu-Benachrichtigungen und Anfrage-Weiterleitung verwendet.</div>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}>
            <button onClick={()=>setEditBC(null)} style={{padding:"8px 18px",background:"#fff",border:"1px solid #d0d0d0",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer",color:"#555",fontFamily:FONT.sans}}>Abbrechen</button>
            <button onClick={save} disabled={saving} style={{padding:"8px 22px",background:C.mittelblau,color:"#fff",border:"none",borderRadius:6,fontSize:12,fontWeight:700,cursor:saving?"default":"pointer",fontFamily:FONT.sans}}>{saving?"Speichert...":"Speichern"}</button>
          </div>
        </div>
      </div>
    </div>}
  </div>);
}

// ═══════════════════════════════════════════════════════════════════════════
// BEREITSCHAFT PROFIL CARD (Mein Profil Tab)
// ═══════════════════════════════════════════════════════════════════════════
function BereitschaftProfilCard({stammdaten,updateStamm,user,toast,bereitschaft}){
  const canEdit=user?.rolle==="admin"||user?.rolle==="bl";
  const [saving,setSaving]=useState(false);
  const save=async()=>{
    setSaving(true);
    try{
      const data={leiter_name:stammdaten.bereitschaftsleiter||"",leiter_title:stammdaten.bereitschaftsleiterTitle||"",telefon:stammdaten.telefon||"",fax:stammdaten.fax||"",mobil:stammdaten.mobil||"",email:stammdaten.email||"",funkgruppe:stammdaten.funkgruppe||""};
      const r=user?.rolle==="admin"?await API.saveStammdaten({...data,kv_name:stammdaten.kvName,kgf:stammdaten.kgf,kv_adresse:stammdaten.kvAdresse,kv_plz_ort:stammdaten.kvPlzOrt}):await API.saveBereitschaftsleiter(data);
      if(r?.success)toast("Bereitschaftsdaten gespeichert","success");else toast("Fehler","error");
    }catch(e){toast(e.message,"error");}
    finally{setSaving(false);}
  };
  const noop=()=>{};
  return(<Card title={`🏥 Meine Bereitschaft – ${bereitschaft?.name||""}`} accent={C.mittelblau} sub="Kontaktdaten der Bereitschaft (für Dokumente & E-Mail-Versand)">
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}} className="rg2">
      <div style={{gridColumn:"1/-1"}}><Inp label="Bereitschaft" value={bereitschaft?.name||""} disabled onChange={noop}/></div>
      <Inp label="Bereitschaftsleiter" value={stammdaten.bereitschaftsleiter||""} onChange={canEdit?v=>updateStamm("bereitschaftsleiter",v):noop} disabled={!canEdit}/>
      <Inp label="Funktion/Titel" value={stammdaten.bereitschaftsleiterTitle||""} onChange={canEdit?v=>updateStamm("bereitschaftsleiterTitle",v):noop} disabled={!canEdit}/>
      <Inp label="Telefon" value={stammdaten.telefon||""} onChange={canEdit?v=>updateStamm("telefon",v):noop} disabled={!canEdit}/>
      <Inp label="Fax" value={stammdaten.fax||""} onChange={canEdit?v=>updateStamm("fax",v):noop} disabled={!canEdit}/>
      <Inp label="Mobil" value={stammdaten.mobil||""} onChange={canEdit?v=>updateStamm("mobil",v):noop} disabled={!canEdit}/>
    </div>
    <div style={{marginTop:4}}>
      <Inp label="E-Mail der Bereitschaft *" value={stammdaten.email||""} onChange={canEdit?v=>updateStamm("email",v):noop} disabled={!canEdit} placeholder="bereitschaft@brk.de"/>
      <div style={{fontSize:10,color:C.dunkelgrau,marginTop:2}}>Diese E-Mail wird als CC bei Angebotsversand und für FiBu-Benachrichtigungen verwendet.</div>
    </div>
    {canEdit&&<div style={{marginTop:10}}>
      <Btn small variant="success" onClick={save} disabled={saving}>{saving?"Speichern...":"Bereitschaftsdaten speichern"}</Btn>
    </div>}
    {!canEdit&&<div style={{marginTop:8,fontSize:10,color:C.bgrau}}>Kontaktdaten können nur von Bereitschaftsleitung oder Admin geändert werden.</div>}
  </Card>);
}

function MailComposeModal({event:ev, currentEventId, user, stammdaten, dayCalcs, totalCosts, activeDays, toast, onClose, onSent}){
  const anrede=ev?.anrede||"Sehr geehrte Damen und Herren,";
  const absender=user?.name||"";
  const orgName=stammdaten?.kvName||"BRK Kreisverband";

  // Frist berechnen: 4 Wochen vor erster Veranstaltung
  const ersteDatum=activeDays?.find(d=>d.date)?.date;
  const fristInfo=(()=>{
    if(!ersteDatum)return{fristStr:"",tageHin:"",hinweis:""};
    const va=new Date(ersteDatum);
    const frist=new Date(va);frist.setDate(frist.getDate()-28);
    const heute=new Date();heute.setHours(0,0,0,0);
    const tage=Math.ceil((frist-heute)/(1000*60*60*24));
    const fristStr=frist.toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"});
    const vaStr=va.toLocaleDateString("de-DE",{day:"2-digit",month:"long",year:"numeric"});
    let hinweis="";
    if(tage<=0)hinweis=`Da Ihre Veranstaltung am ${vaStr} bereits in weniger als vier Wochen stattfindet, bitten wir Sie um besonders zeitnahe Rückmeldung.`;
    else if(tage<=14)hinweis=`Bitte beachten Sie, dass die Rücksendefrist am ${fristStr} endet – das sind nur noch ${tage} Tage.`;
    return{fristStr,tage,hinweis,vaStr};
  })();

  const [to,setTo]=useState(ev?.email||"");
  const [subject,setSubject]=useState(`Angebot Sanitätswachdienst – ${ev?.name||""} ${ev?.auftragsnr||""}`);
  const [body,setBody]=useState(`${anrede}\n\nanbei erhalten Sie unser Angebot für die sanitätsdienstliche Absicherung Ihrer Veranstaltung „${ev?.name||""}". Wir haben die Anforderungen auf Basis Ihrer Angaben kalkuliert und freuen uns, Ihnen ein individuelles Angebot unterbreiten zu können.\n\nSollte Ihnen unser Angebot zusagen, senden Sie uns bitte das beigefügte Angebot sowie den Vertrag unterschrieben zurück. Damit wir die Einsatzplanung und Personalkoordination rechtzeitig sicherstellen können, benötigen wir die unterzeichneten Unterlagen spätestens vier Wochen vor Veranstaltungsbeginn${fristInfo.fristStr?` (bis zum ${fristInfo.fristStr})`:""}.${fristInfo.hinweis?"\n\n"+fristInfo.hinweis:""}\n\nBitte haben Sie Verständnis, dass bei kurzfristigen Beauftragungen innerhalb dieser Frist ein Aufschlag von bis zu 30 % auf die Einsatzkosten anfallen kann, da wir in diesem Fall gegebenenfalls auf externe Einsatzkräfte zurückgreifen müssen.\n\nFür Rückfragen stehen wir Ihnen selbstverständlich gerne zur Verfügung – sprechen Sie uns einfach an.\n\nMit freundlichen Grüßen\n${absender}\n${orgName}`);
  const [attachPdf,setAttachPdf]=useState("mappe");
  const [sending,setSending]=useState(false);
  const [sent,setSent]=useState(false);

  const send=async()=>{
    if(!to){toast("Empfänger fehlt","warning");return;}
    if(!to.includes("@")){toast("Ungültige E-Mail-Adresse","warning");return;}
    setSending(true);
    try{
      const htmlBody=body.split("\n").map(l=>l.trim()?`<p>${l}</p>`:"<p>&nbsp;</p>").join("");
      const r=await API.sendMail(currentEventId,{to,subject,body:htmlBody,attachPdf,dayCalcs,totalCosts,activeDays});
      if(r.success){setSent(true);toast("✉️ E-Mail gesendet an "+to,"success");if(onSent)onSent(attachPdf);}
      else toast("Fehler: "+(r.error||""),"error");
    }catch(e){toast("E-Mail: "+e.message,"error");}
    finally{setSending(false);}
  };

  const attachLabels={mappe:"Angebotsmappe (Angebot + Gefahrenanalyse + AAB + Vertrag)",angebot:"Nur Angebot (PDF)",none:"Kein Anhang"};

  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(3px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
    <div style={{background:"#fff",borderRadius:12,maxWidth:600,width:"92%",maxHeight:"88vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}} onClick={e=>e.stopPropagation()}>
      {/* Header */}
      <div style={{padding:"18px 24px",borderBottom:"1px solid #f0f0f0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:24}}>✉️</span>
          <div><div style={{fontSize:16,fontWeight:700,color:"#1a1a2e"}}>Angebot per E-Mail senden</div>
          <div style={{fontSize:11,color:C.dunkelgrau}}>{ev?.name} · {ev?.auftragsnr}</div></div>
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#999"}}>✕</button>
      </div>

      {sent?<div style={{padding:"40px 24px",textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>✅</div>
        <div style={{fontSize:16,fontWeight:700,color:"#2e7d32",marginBottom:6}}>E-Mail erfolgreich gesendet</div>
        <div style={{fontSize:13,color:C.dunkelgrau,marginBottom:12}}>An: {to}{attachPdf!=="none"?` · Anhang: ${attachPdf==="mappe"?"Angebotsmappe":"Angebot PDF"}`:""}</div>
        {attachPdf!=="none"&&<div style={{background:"#e8f5e9",borderRadius:8,padding:"12px 16px",marginBottom:20,textAlign:"left",fontSize:12,color:"#2e7d32"}}>
          <div style={{fontWeight:700,marginBottom:6}}>📋 Checkliste aktualisiert:</div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>☑️ Angebot versendet</div>
          {attachPdf==="mappe"&&<div style={{display:"flex",alignItems:"center",gap:6}}>☑️ Vertrag + AAB versendet</div>}
          <div style={{marginTop:8,fontSize:11,color:"#1b5e20"}}>🔒 Vorgang wurde gesperrt</div>
        </div>}
        <button onClick={onClose} style={{padding:"10px 28px",background:C.dunkelblau,color:"#fff",border:"none",borderRadius:6,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:FONT.sans}}>Schließen</button>
      </div>

      :<div style={{padding:"20px 24px"}}>
        {/* Empfänger */}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:600,color:"#555",marginBottom:3}}>An *</div>
          <input value={to} onChange={e=>setTo(e.target.value)} placeholder="veranstalter@example.com" style={{width:"100%",padding:"9px 12px",border:`1px solid ${to&&!to.includes("@")?"#ef5350":"#ccc"}`,borderRadius:6,fontSize:13,fontFamily:FONT.sans}}/>
          {!to&&ev?.veranstalter&&<div style={{fontSize:10,color:"#f57c00",marginTop:3}}>⚠️ Keine E-Mail-Adresse beim Kunden hinterlegt</div>}
        </div>

        {/* Betreff */}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:600,color:"#555",marginBottom:3}}>Betreff</div>
          <input value={subject} onChange={e=>setSubject(e.target.value)} style={{width:"100%",padding:"9px 12px",border:"1px solid #ccc",borderRadius:6,fontSize:13,fontFamily:FONT.sans}}/>
        </div>

        {/* Anhang */}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:600,color:"#555",marginBottom:4}}>PDF-Anhang</div>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {[{v:"mappe",l:"📦 Angebotsmappe",d:"Deckblatt + Angebot + Vertrag + AAB"},{v:"angebot",l:"📄 Nur Angebot",d:"Einzelnes Angebots-PDF"},{v:"none",l:"📭 Kein Anhang",d:"Nur Text-E-Mail"}].map(o=>(
              <label key={o.v} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:attachPdf===o.v?"#fff3e0":"#fafafa",border:`1px solid ${attachPdf===o.v?"#e65100":"#e0e0e0"}`,borderRadius:6,cursor:"pointer",transition:"all 0.15s"}} onClick={()=>setAttachPdf(o.v)}>
                <div style={{width:16,height:16,borderRadius:8,border:`2px solid ${attachPdf===o.v?"#e65100":"#bbb"}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {attachPdf===o.v&&<div style={{width:8,height:8,borderRadius:4,background:"#e65100"}}/>}
                </div>
                <div><div style={{fontSize:12,fontWeight:600}}>{o.l}</div><div style={{fontSize:10,color:"#888"}}>{o.d}</div></div>
              </label>
            ))}
          </div>
        </div>

        {/* Nachricht */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:600,color:"#555",marginBottom:3}}>Nachricht</div>
          <textarea value={body} onChange={e=>setBody(e.target.value)} rows={10} style={{width:"100%",padding:"10px 12px",border:"1px solid #ccc",borderRadius:6,fontSize:12,fontFamily:FONT.sans,lineHeight:1.6,resize:"vertical"}}/>
        </div>

        {/* Info-Footer */}
        <div style={{background:"#f5f5f5",borderRadius:6,padding:"10px 14px",marginBottom:16,fontSize:11,color:C.dunkelgrau}}>
          <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
            <div><span style={{fontWeight:600}}>Von:</span> {user?.email||stammdaten?.email||"(SMTP Absender)"}</div>
            {stammdaten?.email&&user?.email&&user.email!==stammdaten.email&&<div><span style={{fontWeight:600}}>CC:</span> {stammdaten.email}</div>}
          </div>
        </div>

        {/* Buttons */}
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{padding:"9px 20px",background:"#fff",border:"1px solid #d0d0d0",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",color:"#555",fontFamily:FONT.sans}}>Abbrechen</button>
          <button onClick={send} disabled={sending||!to} style={{padding:"9px 28px",background:sending?"#bbb":"#e65100",color:"#fff",border:"none",borderRadius:6,fontSize:13,fontWeight:700,cursor:sending?"default":"pointer",fontFamily:FONT.sans}}>{sending?"Wird gesendet...":"✉️ Senden"}</button>
        </div>
      </div>}
    </div>
  </div>);
}

function NextcloudConfig({toast}){
  const [ncCfg,setNcCfg]=useState({});const [ncLoading,setNcLoading]=useState(true);const [ncTest,setNcTest]=useState(null);const [ncSaving,setNcSaving]=useState(false);
  useEffect(()=>{(async()=>{try{const c=await API.getNextcloudConfig();setNcCfg(c);}catch{}finally{setNcLoading(false);}})();},[]);
  const save=async()=>{setNcSaving(true);try{await API.saveNextcloudConfig(ncCfg);toast("Nextcloud Einstellungen gespeichert","success");}catch(e){toast(e.message,"error");}finally{setNcSaving(false);}};
  const test=async()=>{setNcTest(null);try{const r=await API.testNextcloud();setNcTest(r);}catch(e){setNcTest({ok:false,error:e.message});}};
  if(ncLoading)return <Card accent={C.mittelblau}><div style={{textAlign:"center",padding:20}}>Lade...</div></Card>;
  return(<div style={{maxWidth:700}}>
    <Card title="☁️ Nextcloud Konfiguration" accent="#0288d1">
      <div style={{marginBottom:16}}>
        <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",marginBottom:16}}>
          <div style={{width:42,height:24,borderRadius:12,background:ncCfg.nextcloud_enabled==="true"?"#0288d1":"#ccc",position:"relative",transition:"0.2s",cursor:"pointer"}} onClick={()=>setNcCfg(p=>({...p,nextcloud_enabled:p.nextcloud_enabled==="true"?"false":"true"}))}>
            <div style={{width:20,height:20,borderRadius:10,background:"#fff",position:"absolute",top:2,left:ncCfg.nextcloud_enabled==="true"?20:2,transition:"0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.3)"}}/>
          </div>
          <span style={{fontSize:14,fontWeight:600}}>Nextcloud Synchronisierung {ncCfg.nextcloud_enabled==="true"?"aktiv":"deaktiviert"}</span>
        </label>

        <div style={{marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:600,color:C.dunkelgrau,marginBottom:4}}>Nextcloud URL</div>
          <input value={ncCfg.nextcloud_url||""} onChange={e=>setNcCfg(p=>({...p,nextcloud_url:e.target.value}))} placeholder="https://office.brkndsob.org" style={{width:"100%",padding:"8px 12px",border:"1px solid #ccc",borderRadius:6,fontSize:13,fontFamily:FONT.sans}}/>
        </div>

        <div style={{marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:600,color:C.dunkelgrau,marginBottom:4}}>Basis-Pfad (Ordner-Template)</div>
          <input value={ncCfg.nextcloud_base_path||""} onChange={e=>setNcCfg(p=>({...p,nextcloud_base_path:e.target.value}))} placeholder="Verwaltung Bereitschaft $bereitschaft/SanWD" style={{width:"100%",padding:"8px 12px",border:"1px solid #ccc",borderRadius:6,fontSize:13,fontFamily:FONT.mono}}/>
          <div style={{fontSize:10,color:"#888",marginTop:4}}>Platzhalter: <code>$bereitschaft</code> = Name, <code>$bc</code> = Code, <code>$jahr</code> = Jahr</div>
        </div>

        <div style={{marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:600,color:C.dunkelgrau,marginBottom:4}}>Unterordner pro Vorgang</div>
          <input value={ncCfg.nextcloud_subfolder||""} onChange={e=>setNcCfg(p=>({...p,nextcloud_subfolder:e.target.value}))} placeholder="$auftragsnr - $veranstaltung" style={{width:"100%",padding:"8px 12px",border:"1px solid #ccc",borderRadius:6,fontSize:13,fontFamily:FONT.mono}}/>
          <div style={{fontSize:10,color:"#888",marginTop:4}}>Platzhalter: <code>$auftragsnr</code>, <code>$veranstaltung</code>, <code>$bereitschaft</code>, <code>$bc</code>, <code>$jahr</code></div>
        </div>

        <div style={{marginBottom:16,padding:"12px 14px",background:"#f0f7ff",border:"1px solid #bbdefb",borderRadius:6}}>
          <div style={{fontSize:12,fontWeight:600,color:"#1565c0",marginBottom:8}}>Authentifizierung</div>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            {[{v:"service",l:"🔑 Service-Account (App-Passwort)",d:"Empfohlen"},{v:"bearer",l:"🎫 Bearer Token (OIDC)",d:"Nextcloud muss OIDC WebDAV unterstützen"}].map(m=>(
              <button key={m.v} onClick={()=>setNcCfg(p=>({...p,nextcloud_auth_mode:m.v}))} style={{flex:1,padding:"8px 12px",background:(ncCfg.nextcloud_auth_mode||"service")===m.v?"#1565c0":"#fff",color:(ncCfg.nextcloud_auth_mode||"service")===m.v?"#fff":"#333",border:`1px solid ${(ncCfg.nextcloud_auth_mode||"service")===m.v?"#1565c0":"#ccc"}`,borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT.sans,textAlign:"left"}}>
                <div>{m.l}</div><div style={{fontSize:10,fontWeight:400,opacity:0.8,marginTop:2}}>{m.d}</div>
              </button>
            ))}
          </div>
          {(ncCfg.nextcloud_auth_mode||"service")==="service"&&<>
            <div style={{marginBottom:8}}>
              <div style={{fontSize:11,fontWeight:600,color:"#555",marginBottom:3}}>Nextcloud Benutzer</div>
              <input value={ncCfg.nextcloud_service_user||""} onChange={e=>setNcCfg(p=>({...p,nextcloud_service_user:e.target.value}))} placeholder="admin oder service-user" style={{width:"100%",padding:"7px 10px",border:"1px solid #ccc",borderRadius:5,fontSize:12,fontFamily:FONT.sans}}/>
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:600,color:"#555",marginBottom:3}}>App-Passwort</div>
              <input type="password" value={ncCfg.nextcloud_service_password||""} onChange={e=>setNcCfg(p=>({...p,nextcloud_service_password:e.target.value}))} placeholder="Nextcloud → Einstellungen → Sicherheit → App-Passwort" style={{width:"100%",padding:"7px 10px",border:"1px solid #ccc",borderRadius:5,fontSize:12,fontFamily:FONT.sans}}/>
              <div style={{fontSize:10,color:"#888",marginTop:3}}>Erstelle ein App-Passwort in Nextcloud: Einstellungen → Sicherheit → Neues App-Passwort</div>
            </div>
          </>}
          {(ncCfg.nextcloud_auth_mode||"service")==="bearer"&&<div style={{fontSize:11,color:"#666",padding:"6px 0"}}>Nutzt den BRK.id Token des eingeloggten Users. Nextcloud benötigt die <code>user_oidc</code> App mit aktiviertem Bearer-Token Support für WebDAV.</div>}
        </div>

        <div style={{background:"#f5f5f5",borderRadius:6,padding:"10px 14px",marginBottom:16,fontSize:11,fontFamily:FONT.mono,color:"#555"}}>
          <div style={{fontSize:10,fontWeight:600,color:C.dunkelgrau,marginBottom:4}}>Vorschau Pfad (Bereitschaft Schrobenhausen, BSOB 26/001)</div>
          /{(ncCfg.nextcloud_base_path||"SanWD").replace(/\$bereitschaft/g,"Schrobenhausen").replace(/\$bc/g,"BSOB").replace(/\$jahr/g,"2026")}/{(ncCfg.nextcloud_subfolder||"$auftragsnr").replace(/\$auftragsnr/g,"BSOB_26_001").replace(/\$veranstaltung/g,"Volksfest").replace(/\$bereitschaft/g,"Schrobenhausen").replace(/\$bc/g,"BSOB").replace(/\$jahr/g,"2026")}
        </div>

        <div style={{display:"flex",gap:8}}>
          <button onClick={save} disabled={ncSaving} style={{padding:"8px 20px",background:"#0288d1",color:"#fff",border:"none",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:FONT.sans}}>{ncSaving?"Speichern...":"Speichern"}</button>
          <button onClick={test} style={{padding:"8px 20px",background:C.hellgrau,border:"1px solid #ccc",borderRadius:6,fontSize:13,cursor:"pointer",fontFamily:FONT.sans}}>Verbindung testen</button>
        </div>

        {ncTest&&<div style={{marginTop:12,padding:"10px 14px",background:ncTest.ok?"#e8f5e9":"#ffebee",border:`1px solid ${ncTest.ok?"#a5d6a7":"#ef9a9a"}`,borderRadius:6,fontSize:12,color:ncTest.ok?"#2e7d32":"#c62828"}}>
          {ncTest.ok?"✅ "+ncTest.message:"❌ "+ncTest.error}
        </div>}
      </div>
    </Card>

    <Card title="ℹ️ Hinweise" accent={C.dunkelgrau} style={{marginTop:14}}>
      <div style={{fontSize:12,color:C.dunkelgrau,lineHeight:1.8}}>
        <div>• Die Synchronisierung nutzt den <strong>BRK.id Token</strong> des jeweiligen Benutzers</div>
        <div>• Dateien werden im Nextcloud-Konto des eingeloggten Users abgelegt</div>
        <div>• Der Benutzer benötigt Schreibrechte auf den konfigurierten Pfad</div>
        <div>• Sync erfolgt manuell per Button oder automatisch bei Mappe-Generierung</div>
        <div>• Bei fehlender Verbindung wird der PDF-Download nicht blockiert</div>
      </div>
    </Card>
  </div>);
}

// ═══════════════════════════════════════════════════════════════════════════
// FIBU WEITERLEITUNG MODAL
// ═══════════════════════════════════════════════════════════════════════════
function FiBuModal({currentEventId,event:ev,user,stammdaten,dayCalcs,totalCosts,activeDays,toast,onClose,onSent}){
  const ownBC=BEREITSCHAFTEN[stammdaten?.bereitschaftIdx]||BEREITSCHAFTEN[0];
  const otherBCs=BEREITSCHAFTEN.filter(b=>b.code!==ownBC.code&&b.code!=="KBL");
  const absender=user?.name||"";
  const orgName=stammdaten?.kvName||"BRK Kreisverband";

  const isKorrektur=!!ev?.checklist?.fibuWeitergeleitet;
  const [fibuEmail,setFibuEmail]=useState("");
  const [subject,setSubject]=useState(`${isKorrektur?"KORREKTUR: ":""}FiBu-Abrechnung – ${ev?.name||""} ${ev?.auftragsnr||""}`);
  const [hasFremdHelfer,setHasFremdHelfer]=useState(false);
  const [fremdHelfer,setFremdHelfer]=useState([{bc:otherBCs[0]?.code||"",anzahl:""}]);
  const [externeHelfer,setExterneHelfer]=useState("");
  const [hasFzg,setHasFzg]=useState(false);
  const [fahrzeuge,setFahrzeuge]=useState([{typ:"KTW",kennzeichen:"",bc:""}]);
  const [sending,setSending]=useState(false);
  const [sent,setSent]=useState(false);
  const [notifiedBCs,setNotifiedBCs]=useState([]);

  // FiBu-Mail laden
  useEffect(()=>{API.getFiBuConfig().then(r=>setFibuEmail(r.fibu_email||"")).catch(()=>{});},[]);

  const helferSummary=()=>{
    if(!hasFremdHelfer)return"";
    const lines=fremdHelfer.filter(h=>h.bc&&h.anzahl).map(h=>{
      const b=BEREITSCHAFTEN.find(x=>x.code===h.bc);
      return`- ${h.anzahl} Helfer von ${b?.name||h.bc}`;
    });
    if(externeHelfer.trim())lines.push(`- Externe: ${externeHelfer.trim()}`);
    return lines.length?"\n\nHelfer anderer Bereitschaften / Externe:\n"+lines.join("\n"):"";
  };
  const fzgSummary=()=>{
    if(!hasFzg)return"";
    const lines=fahrzeuge.filter(f=>f.typ||f.kennzeichen).map(f=>{
      const bcInfo=f.bc?` (${BEREITSCHAFTEN.find(x=>x.code===f.bc)?.name||f.bc})`:"";
      return`- ${f.typ||"Fahrzeug"}${f.kennzeichen?" – "+f.kennzeichen:""}${bcInfo}`;
    });
    return lines.length?"\n\nEingesetzte Fahrzeuge:\n"+lines.join("\n"):"";
  };

  const bodyText=`Sehr geehrte Damen und Herren,\n${isKorrektur?"\n⚠️ ACHTUNG KORREKTUR – Diese Abrechnung ersetzt die vorherige Weiterleitung.\n":""}\nanbei die ${isKorrektur?"korrigierte ":""}Abrechnung für den Sanitätswachdienst der Veranstaltung „${ev?.name||""}" (${ev?.auftragsnr||""}).\n\nVeranstalter: ${ev?.veranstalter||""}\nDatum: ${activeDays?.filter(d=>d.date).map(d=>new Date(d.date).toLocaleDateString("de-DE")).join(", ")||""}\nGesamtkosten: ${totalCosts?new Intl.NumberFormat("de-DE",{minimumFractionDigits:2}).format(totalCosts)+" €":""}${helferSummary()}${fzgSummary()}\n\nDas Angebot liegt als PDF bei.\n\nMit freundlichen Grüßen\n${absender}\n${ownBC.name} · ${orgName}`;

  const [body,setBody]=useState("");
  useEffect(()=>{setBody(bodyText);},[hasFremdHelfer,hasFzg,fremdHelfer,fahrzeuge,externeHelfer]);
  // Init body
  useEffect(()=>{setBody(bodyText);},[]);

  const send=async()=>{
    if(!fibuEmail){toast("FiBu-E-Mail-Adresse fehlt","warning");return;}
    if(!fibuEmail.includes("@")){toast("Ungültige E-Mail-Adresse","warning");return;}
    setSending(true);
    try{
      // FiBu-Mail an config speichern
      await API.saveFiBuConfig({fibu_email:fibuEmail});
      const r=await API.sendFiBuMail(currentEventId,{
        to:fibuEmail,subject,body,
        fremdHelfer:hasFremdHelfer?fremdHelfer.filter(h=>h.bc&&h.anzahl):[],
        fremdFahrzeuge:hasFzg?fahrzeuge.filter(f=>f.typ||f.kennzeichen):[],
        dayCalcs,totalCosts,activeDays
      });
      if(r.success){setSent(true);setNotifiedBCs(r.notifiedBCs||[]);toast("✉️ FiBu-Mail gesendet","success");if(onSent)onSent();}
      else toast("Fehler: "+(r.error||""),"error");
    }catch(e){toast("Fehler: "+e.message,"error");}
    finally{setSending(false);}
  };

  const addHelfer=()=>setFremdHelfer(p=>[...p,{bc:otherBCs[0]?.code||"",anzahl:""}]);
  const removeHelfer=(i)=>setFremdHelfer(p=>p.filter((_,j)=>j!==i));
  const updHelfer=(i,k,v)=>setFremdHelfer(p=>p.map((h,j)=>j===i?{...h,[k]:v}:h));
  const addFzg=()=>setFahrzeuge(p=>[...p,{typ:"KTW",kennzeichen:"",bc:""}]);
  const removeFzg=(i)=>setFahrzeuge(p=>p.filter((_,j)=>j!==i));
  const updFzg=(i,k,v)=>setFahrzeuge(p=>p.map((f,j)=>j===i?{...f,[k]:v}:f));

  const sI={width:"100%",padding:"8px 10px",border:"1px solid #ccc",borderRadius:5,fontSize:12,fontFamily:FONT.sans,boxSizing:"border-box"};
  const sL={fontSize:11,fontWeight:600,color:"#555",marginBottom:3,display:"block"};

  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(3px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
    <div style={{background:"#fff",borderRadius:12,maxWidth:640,width:"92%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}} onClick={e=>e.stopPropagation()}>
      {/* Header */}
      <div style={{padding:"18px 24px",borderBottom:"1px solid #f0f0f0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:24}}>💳</span>
          <div><div style={{fontSize:16,fontWeight:700,color:isKorrektur?"#e65100":"#1a1a2e"}}>{isKorrektur?"⚠️ Korrektur: ":""}Weiterleitung an FiBu</div>
          <div style={{fontSize:11,color:C.dunkelgrau}}>{ev?.name} · {ev?.auftragsnr}</div></div>
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#999"}}>✕</button>
      </div>

      {sent?<div style={{padding:"40px 24px",textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>✅</div>
        <div style={{fontSize:16,fontWeight:700,color:"#2e7d32",marginBottom:6}}>FiBu-Mail erfolgreich gesendet</div>
        <div style={{fontSize:13,color:C.dunkelgrau,marginBottom:6}}>An: {fibuEmail}</div>
        <div style={{background:"#e8f5e9",borderRadius:8,padding:"12px 16px",marginBottom:12,textAlign:"left",fontSize:12,color:"#2e7d32"}}>
          <div style={{fontWeight:700,marginBottom:6}}>📋 Erledigt:</div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>☑️ Weiterleitung an FiBu</div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>☑️ Vorgang abgeschlossen</div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>📎 Angebot als PDF angehängt</div>
          {notifiedBCs.length>0&&<div style={{marginTop:8,borderTop:"1px solid #c8e6c9",paddingTop:6}}>
            <div style={{fontWeight:600}}>📨 Benachrichtigt:</div>
            {notifiedBCs.map((bc,i)=><div key={i} style={{marginLeft:8}}>• {bc}</div>)}
          </div>}
        </div>
        <button onClick={onClose} style={{padding:"10px 28px",background:C.dunkelblau,color:"#fff",border:"none",borderRadius:6,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:FONT.sans}}>Schließen</button>
      </div>

      :<div style={{padding:"20px 24px"}}>
        {isKorrektur&&<div style={{marginBottom:14,padding:"10px 14px",background:"#fff3e0",border:"1px solid #ffcc80",borderRadius:6,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:18}}>⚠️</span>
          <div><div style={{fontSize:12,fontWeight:700,color:"#e65100"}}>Korrektur-Abrechnung</div>
          <div style={{fontSize:11,color:"#bf360c"}}>Erste Weiterleitung: {fTS(ev?.checklist?.fibuWeitergeleitet)} – Diese E-Mail ersetzt die vorherige.</div></div>
        </div>}
        {/* FiBu E-Mail */}
        <div style={{marginBottom:14}}>
          <label style={sL}>FiBu E-Mail-Adresse *</label>
          <input value={fibuEmail} onChange={e=>setFibuEmail(e.target.value)} placeholder="fibu@brk-ndsob.de" style={{...sI,border:`1px solid ${fibuEmail&&!fibuEmail.includes("@")?"#ef5350":"#ccc"}`}}/>
          <div style={{fontSize:10,color:"#888",marginTop:2}}>Wird gespeichert und beim nächsten Mal vorausgefüllt</div>
        </div>

        {/* Betreff */}
        <div style={{marginBottom:14}}>
          <label style={sL}>Betreff</label>
          <input value={subject} onChange={e=>setSubject(e.target.value)} style={sI}/>
        </div>

        {/* Helfer anderer Bereitschaften */}
        <div style={{marginBottom:14,padding:"14px 16px",background:hasFremdHelfer?"#fff8e1":"#fafafa",border:`1px solid ${hasFremdHelfer?"#ffe082":"#e0e0e0"}`,borderRadius:8}}>
          <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",marginBottom:hasFremdHelfer?12:0}} onClick={()=>setHasFremdHelfer(!hasFremdHelfer)}>
            <div style={{width:20,height:20,borderRadius:4,border:`2px solid ${hasFremdHelfer?"#e65100":"#bbb"}`,background:hasFremdHelfer?"#e65100":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{hasFremdHelfer&&<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}</div>
            <div><div style={{fontSize:13,fontWeight:600}}>👥 Helfer anderer Bereitschaften</div>
              <div style={{fontSize:10,color:"#888"}}>Waren Helfer einer anderen Bereitschaft oder externer Organisation im Einsatz?</div></div>
          </label>
          {hasFremdHelfer&&<div>
            <div style={{fontSize:11,fontWeight:600,color:"#555",marginBottom:6}}>BRK-Bereitschaften:</div>
            {fremdHelfer.map((h,i)=><div key={i} style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
              <select value={h.bc} onChange={e=>updHelfer(i,"bc",e.target.value)} style={{...sI,flex:2}}>
                {otherBCs.map(b=><option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
              <input type="number" min="1" placeholder="Anz." value={h.anzahl} onChange={e=>updHelfer(i,"anzahl",e.target.value)} style={{...sI,flex:1,textAlign:"center"}}/>
              {fremdHelfer.length>1&&<button onClick={()=>removeHelfer(i)} style={{background:"none",border:"none",color:C.rot,cursor:"pointer",fontSize:14,padding:2}}>✕</button>}
            </div>)}
            <button onClick={addHelfer} style={{background:"none",border:"1px dashed #bbb",borderRadius:4,padding:"4px 12px",fontSize:11,cursor:"pointer",color:"#555",fontFamily:FONT.sans,marginBottom:12}}>+ Weitere Bereitschaft</button>
            <div style={{fontSize:11,fontWeight:600,color:"#555",marginBottom:4,marginTop:4}}>Externe Helfer (ohne Benachrichtigung):</div>
            <input value={externeHelfer} onChange={e=>setExterneHelfer(e.target.value)} placeholder="z.B. 2 Helfer THW, 1 Helfer ASB Ingolstadt..." style={{...sI}}/>
            <div style={{fontSize:10,color:"#888",marginTop:3}}>Freitext – diese Angabe fließt in die Mail ein, es wird aber keine Benachrichtigung versendet.</div>
          </div>}
        </div>

        {/* Fahrzeuge */}
        <div style={{marginBottom:14,padding:"14px 16px",background:hasFzg?"#e3f2fd":"#fafafa",border:`1px solid ${hasFzg?"#90caf9":"#e0e0e0"}`,borderRadius:8}}>
          <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",marginBottom:hasFzg?12:0}} onClick={()=>setHasFzg(!hasFzg)}>
            <div style={{width:20,height:20,borderRadius:4,border:`2px solid ${hasFzg?"#1565c0":"#bbb"}`,background:hasFzg?"#1565c0":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{hasFzg&&<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}</div>
            <div><div style={{fontSize:13,fontWeight:600}}>🚑 Eingesetzte Fahrzeuge</div>
              <div style={{fontSize:10,color:"#888"}}>Fahrzeuge mit Typ und Kennzeichen angeben</div></div>
          </label>
          {hasFzg&&<div>
            {fahrzeuge.map((f,i)=><div key={i} style={{display:"flex",gap:6,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
              <select value={f.typ} onChange={e=>updFzg(i,"typ",e.target.value)} style={{...sI,flex:1,minWidth:80}}>
                {["KTW","RTW","GKTW","MTW","EL-KFZ","SEG","Sonstige"].map(t=><option key={t} value={t}>{t}</option>)}
              </select>
              <input placeholder="Kennzeichen" value={f.kennzeichen} onChange={e=>updFzg(i,"kennzeichen",e.target.value)} style={{...sI,flex:1.5,minWidth:120}}/>
              <select value={f.bc||""} onChange={e=>updFzg(i,"bc",e.target.value)} style={{...sI,flex:2,minWidth:120,color:f.bc?"":C.bgrau}}>
                <option value="">Eigene Bereitschaft</option>
                {otherBCs.map(b=><option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
              {fahrzeuge.length>1&&<button onClick={()=>removeFzg(i)} style={{background:"none",border:"none",color:C.rot,cursor:"pointer",fontSize:14,padding:2}}>✕</button>}
            </div>)}
            <button onClick={addFzg} style={{background:"none",border:"1px dashed #bbb",borderRadius:4,padding:"4px 12px",fontSize:11,cursor:"pointer",color:"#555",fontFamily:FONT.sans}}>+ Weiteres Fahrzeug</button>
          </div>}
        </div>

        {/* Benachrichtigungshinweis */}
        {(()=>{
          const allBCs=new Set();
          if(hasFremdHelfer)fremdHelfer.filter(h=>h.bc&&h.anzahl).forEach(h=>allBCs.add(h.bc));
          if(hasFzg)fahrzeuge.filter(f=>f.bc).forEach(f=>allBCs.add(f.bc));
          if(allBCs.size===0)return null;
          return <div style={{marginBottom:14,padding:"10px 14px",background:"#e8f5e9",border:"1px solid #a5d6a7",borderRadius:6,fontSize:11,color:"#2e7d32"}}>
            <div style={{fontWeight:700,marginBottom:4}}>📨 Automatische Benachrichtigung an:</div>
            {[...allBCs].map(bc=>{const b=BEREITSCHAFTEN.find(x=>x.code===bc);return <div key={bc}>• {b?.name||bc}</div>;})}
            <div style={{marginTop:4,fontSize:10,color:"#388e3c"}}>Die Bereitschaften werden an ihre hinterlegte E-Mail informiert, dass eine Abrechnung mit ihren Helfern/Fahrzeugen an die FiBu ging.</div>
          </div>;
        })()}

        {/* Nachricht */}
        <div style={{marginBottom:14}}>
          <label style={sL}>Nachricht an FiBu</label>
          <textarea value={body} onChange={e=>setBody(e.target.value)} rows={10} style={{...sI,resize:"vertical",lineHeight:1.6}}/>
        </div>

        {/* Anhang-Info */}
        <div style={{background:"#f5f5f5",borderRadius:6,padding:"10px 14px",marginBottom:16,fontSize:11,color:C.dunkelgrau}}>
          <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
            <div>📎 <span style={{fontWeight:600}}>Anhang:</span> Angebot (PDF)</div>
            <div><span style={{fontWeight:600}}>Von:</span> {user?.email||"(Benutzer-E-Mail)"}</div>
            {stammdaten?.email&&<div><span style={{fontWeight:600}}>CC:</span> {stammdaten.email}</div>}
          </div>
        </div>

        {/* Buttons */}
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{padding:"9px 20px",background:"#fff",border:"1px solid #d0d0d0",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",color:"#555",fontFamily:FONT.sans}}>Abbrechen</button>
          <button onClick={send} disabled={sending||!fibuEmail} style={{padding:"9px 28px",background:sending?"#bbb":isKorrektur?"#e65100":"#1a237e",color:"#fff",border:"none",borderRadius:6,fontSize:13,fontWeight:700,cursor:sending?"default":"pointer",fontFamily:FONT.sans,opacity:fibuEmail?1:0.4}}>{sending?"Wird gesendet...":isKorrektur?"⚠️ Korrektur an FiBu senden":"💳 An FiBu senden & abschließen"}</button>
        </div>
      </div>}
    </div>
  </div>);
}

function VorgangChecklist({checklist={},onChange,onLockSave,eventDate,currentEventId,event:ev,user,stammdaten,dayCalcs,totalCosts,activeDays,toast}){
  const [confirmKey,setConfirmKey]=useState(null);
  const [showAblehnung,setShowAblehnung]=useState(false);
  const [ablehnGrund,setAblehnGrund]=useState("");
  const [showFiBu,setShowFiBu]=useState(false);
  const isLocked=!!(checklist.angebotVersendet||checklist.abgeschlossen);
  const toggle=(key)=>{
    if((key==="angebotVersendet"||key==="abgeschlossen")&&checklist[key])return;
    if(key==="fibuWeitergeleitet"){setShowFiBu(true);return;}
    if((key==="angebotVersendet"||key==="abgeschlossen")&&!checklist[key]){
      setConfirmKey(key);return;
    }
    const now=Date.now();const cur=checklist[key];
    const newCL={...checklist,[key]:cur?null:now};
    onChange(newCL);
    if(isLocked&&onLockSave)onLockSave(newCL);
  };
  const confirmLock=()=>{
    if(!confirmKey)return;
    const now=Date.now();
    const newCL={...checklist,[confirmKey]:now};
    onChange(newCL);
    setConfirmKey(null);
    if(onLockSave)onLockSave(newCL);
  };
  // Wiedervorlage: 4 Wochen nach Event
  const wvDate=eventDate?new Date(new Date(eventDate).getTime()+28*24*60*60*1000):null;
  const wvPast=wvDate&&new Date()>=wvDate;
  const allDone=CHECKLIST_ITEMS.every(i=>checklist[i.key]);
  const confirmLabels={angebotVersendet:{title:"Angebot versendet markieren?",msg:"Der Vorgang wird anschließend gesperrt. Alle Eingabefelder werden schreibgeschützt. Änderungen sind nur nach Entsperren mit Begründung möglich.",icon:"📨",accent:"#1a7a3a"},abgeschlossen:{title:"Vorgang abschließen?",msg:"Der Vorgang wird dauerhaft gesperrt. Dies markiert den Auftrag als final abgeschlossen. Änderungen sind nur nach Entsperren mit Begründung möglich.",icon:"✅",accent:"#1a237e"}};
  return(<div>
    {CHECKLIST_ITEMS.map(item=>{const done=!!checklist[item.key];return(<div key={item.key} onClick={()=>toggle(item.key)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",marginBottom:4,background:done?`${C.rot}08`:C.weiss,borderRadius:6,cursor:"pointer",border:`1px solid ${done?C.rot+"30":C.mittelgrau+"40"}`,transition:"all 0.2s"}}>
      <div style={{width:22,height:22,borderRadius:4,border:`2px solid ${done?"#1a7a3a":C.mittelgrau}`,background:done?"#1a7a3a":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{done&&<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}</div>
      <span style={{fontSize:14}}>{item.icon}</span>
      <div style={{flex:1}}><div style={{fontSize:13,fontWeight:done?600:400,color:done?"#1a7a3a":C.dunkelgrau,textDecoration:done?"line-through":"none"}}>{item.label}</div>
        {done&&<div style={{fontSize:10,color:C.bgrau}}>Erledigt: {fTS(checklist[item.key])}</div>}
        {item.key==="fibuWeitergeleitet"&&done&&<div style={{fontSize:10,color:C.mittelblau,fontWeight:600,marginTop:1}}>↻ Erneut an FiBu senden</div>}
        {item.key==="abgeschlossen"&&!done&&wvDate&&<div style={{fontSize:10,color:wvPast?C.rot:"#d4920a",fontWeight:wvPast?700:400}}>Wiedervorlage: {fDate(wvDate.toISOString().split("T")[0])}{wvPast?" ⚠️ Fällig!":""}</div>}
      </div>
    </div>);})}
    {allDone&&<div style={{textAlign:"center",padding:"10px",background:"#d4edda",borderRadius:6,marginTop:8,fontSize:13,color:"#155724",fontWeight:600}}>✅ Vorgang vollständig abgeschlossen</div>}

    {/* Angebot abgelehnt Banner */}
    {checklist.angebotAbgelehnt&&<div style={{marginTop:8,padding:"10px 14px",background:"#ffebee",border:"1px solid #ef9a9a",borderRadius:6,display:"flex",alignItems:"center",gap:10}}>
      <span style={{fontSize:20}}>🚫</span>
      <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"#c62828"}}>Angebot abgelehnt</div>
        <div style={{fontSize:11,color:"#b71c1c"}}>Grund: {checklist.ablehnungsGrund||"Nicht angegeben"}</div>
        <div style={{fontSize:10,color:"#999"}}>Am {fTS(checklist.angebotAbgelehnt)}</div>
      </div>
      <button onClick={()=>{const newCL={...checklist};delete newCL.angebotAbgelehnt;delete newCL.ablehnungsGrund;onChange(newCL);if(isLocked&&onLockSave)onLockSave(newCL);}} style={{padding:"4px 10px",background:"#fff",border:"1px solid #ccc",borderRadius:4,fontSize:11,cursor:"pointer",fontFamily:FONT.sans}}>Zurücknehmen</button>
    </div>}

    {/* Ablehnung Button */}
    {!checklist.angebotAbgelehnt&&!checklist.abgeschlossen&&<button onClick={()=>{setAblehnGrund("");setShowAblehnung(true);}} style={{marginTop:8,width:"100%",padding:"10px",background:"#fff",border:"1px dashed #e53935",borderRadius:6,color:"#c62828",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT.sans,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>🚫 Angebot abgelehnt</button>}

    {/* Ablehnung Modal */}
    {showAblehnung&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(3px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setShowAblehnung(false)}>
      <div style={{background:"#fff",borderRadius:10,padding:"24px 28px",maxWidth:400,width:"90%",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}><span style={{fontSize:24}}>🚫</span><div><div style={{fontSize:16,fontWeight:700,color:"#c62828"}}>Angebot abgelehnt</div><div style={{fontSize:11,color:C.dunkelgrau}}>Warum wurde das Angebot nicht angenommen?</div></div></div>
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
          {["Zu teuer","Anderer Anbieter","Veranstaltung abgesagt","Veranstalter stellt eigene Sanitäter","Kapazität nicht verfügbar","Sonstiges"].map(g=>(
            <button key={g} onClick={()=>setAblehnGrund(g)} style={{padding:"8px 14px",background:ablehnGrund===g||(g==="Anderer Anbieter"&&ablehnGrund.startsWith("Anderer Anbieter"))||(g==="Sonstiges"&&ablehnGrund&&!["Zu teuer","Anderer Anbieter","Veranstaltung abgesagt","Veranstalter stellt eigene Sanitäter","Kapazität nicht verfügbar"].includes(ablehnGrund)&&!ablehnGrund.startsWith("Anderer Anbieter"))?"#ffebee":"#f5f5f5",border:`1px solid ${ablehnGrund===g||(g==="Anderer Anbieter"&&ablehnGrund.startsWith("Anderer Anbieter"))?"#e53935":"#ddd"}`,borderRadius:6,textAlign:"left",fontSize:13,cursor:"pointer",fontWeight:ablehnGrund===g||(g==="Anderer Anbieter"&&ablehnGrund.startsWith("Anderer Anbieter"))?600:400,color:ablehnGrund===g||(g==="Anderer Anbieter"&&ablehnGrund.startsWith("Anderer Anbieter"))?"#c62828":C.schwarz,fontFamily:FONT.sans}}>{g}</button>
          ))}
        </div>
        {(ablehnGrund==="Anderer Anbieter"||ablehnGrund.startsWith("Anderer Anbieter:"))&&<input type="text" autoFocus placeholder="Welcher Anbieter? (z.B. ASB, MHD, JUH...)" value={ablehnGrund.startsWith("Anderer Anbieter:")?ablehnGrund.replace("Anderer Anbieter: ",""):""} onChange={e=>setAblehnGrund(e.target.value?`Anderer Anbieter: ${e.target.value}`:"Anderer Anbieter")} style={{width:"100%",padding:"8px 12px",border:"1px solid #e53935",borderRadius:6,fontSize:13,marginBottom:12,fontFamily:FONT.sans,boxSizing:"border-box"}}/>}
        {ablehnGrund==="Sonstiges"&&<input type="text" autoFocus placeholder="Grund eingeben..." onChange={e=>{if(e.target.value)setAblehnGrund(e.target.value);}} style={{width:"100%",padding:"8px 12px",border:"1px solid #ccc",borderRadius:6,fontSize:13,marginBottom:12,fontFamily:FONT.sans,boxSizing:"border-box"}}/>}
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button onClick={()=>setShowAblehnung(false)} style={{padding:"8px 18px",background:C.hellgrau,border:"none",borderRadius:6,fontSize:13,cursor:"pointer",fontFamily:FONT.sans}}>Abbrechen</button>
          <button disabled={!ablehnGrund} onClick={()=>{const newCL={...checklist,angebotAbgelehnt:Date.now(),ablehnungsGrund:ablehnGrund};onChange(newCL);if(onLockSave)onLockSave(newCL);setShowAblehnung(false);}} style={{padding:"8px 22px",background:"#c62828",color:"#fff",border:"none",borderRadius:6,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:FONT.sans,opacity:ablehnGrund?1:0.4}}>Ablehnung speichern</button>
        </div>
      </div>
    </div>}
    {/* FiBu Weiterleitung Modal */}
    {showFiBu&&<FiBuModal currentEventId={currentEventId} event={ev} user={user} stammdaten={stammdaten} dayCalcs={dayCalcs} totalCosts={totalCosts} activeDays={activeDays} toast={toast} onClose={()=>setShowFiBu(false)} onSent={()=>{setShowFiBu(false);const now=Date.now();const newCL={...checklist,fibuWeitergeleitet:now,abgeschlossen:now};onChange(newCL);if(onLockSave)onLockSave(newCL);}}/>}
    <ConfirmModal open={!!confirmKey} title={confirmLabels[confirmKey]?.title||""} message={confirmLabels[confirmKey]?.msg||""} icon={confirmLabels[confirmKey]?.icon} accent={confirmLabels[confirmKey]?.accent} confirmText="Ja, sperren" cancelText="Abbrechen" onConfirm={confirmLock} onCancel={()=>setConfirmKey(null)}/>
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
  const iconMap={create:"🆕",update:"✏️",edit:"✏️",checklist:"☑️",status:"📊",status_versendet:"📤",status_entsperrt:"🔓",lock:"🔒",unlock:"🔓",entsperrt:"🔓",gesperrt:"🔒",save:"💾",delete:"🗑️",kompetenz_override:"⚠️"};
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
  const [selected,setSelected]=useState(new Set());
  const [bcFilter,setBcFilter]=useState("alle");
  const editRef=useRef(null);
  const isAdmin=user?.rolle==="admin";
  const empty={name:"",kundennummer:"",ansprechpartner:"",telefon:"",email:"",rechnungsempfaenger:"",reStrasse:"",rePlzOrt:"",anrede:"Sehr geehrte Damen und Herren,",bemerkung:""};
  const bcName=(code)=>BEREITSCHAFTEN.find(b=>b.code===code)?.short||code||"?";
  const bcColor=(code)=>{const m={"BSOB":"#1565c0","BND":"#2e7d32","BBGH":"#6a1b9a","BKAHU":"#e65100","BKK":"#00838f","BWEIG":"#4e342e","KBL":"#c62828"};return m[code]||"#555";};
  const filtered=kunden.filter(k=>{
    if(bcFilter!=="alle"&&k.bereitschaft_code!==bcFilter)return false;
    const s=search.toLowerCase();return !s||k.name?.toLowerCase().includes(s)||k.kundennummer?.toLowerCase().includes(s)||k.ansprechpartner?.toLowerCase().includes(s)||k.email?.toLowerCase().includes(s);
  });
  // Group by BC for display
  const grouped=useMemo(()=>{
    const g={};filtered.forEach(k=>{const bc=k.bereitschaft_code||"?";if(!g[bc])g[bc]=[];g[bc].push(k);});
    return Object.entries(g).sort((a,b)=>a[0].localeCompare(b[0]));
  },[filtered]);

  const openEdit=(k,e)=>{
    setEdit(k?{...k,_id:k.id,_origName:k.name}:{...empty,_id:null,_origName:null});
  };
  const closeEdit=()=>{setEdit(null);};
  const save=async()=>{
    if(!edit?.name){toast("Name ist erforderlich","error");return;}
    try{
      const data={name:edit.name,kundennummer:edit.kundennummer||"",ansprechpartner:edit.ansprechpartner||"",telefon:edit.telefon||"",email:edit.email||"",rechnungsempfaenger:edit.rechnungsempfaenger||edit.name,re_strasse:edit.reStrasse||edit.re_strasse||"",re_plz_ort:edit.rePlzOrt||edit.re_plz_ort||"",anrede:edit.anrede||"Sehr geehrte Damen und Herren,",bemerkung:edit.bemerkung||""};
      if(edit._id){await API.updateKunde(edit._id,data);}else{await API.saveKunde(data);}
      const k=await API.getKunden();setKunden(k);closeEdit();toast("Kunde gespeichert","success");
    }catch(e){toast(e.message,"error");}
  };
  const del=async(k)=>{
    if(!await showConfirm({title:"Kunde löschen",message:`"${k.name}" wirklich löschen?`,confirmLabel:"Löschen",variant:"danger"}))return;
    try{await API.deleteKunde(k.id);const r=await API.getKunden();setKunden(r);selected.delete(k.id);setSelected(new Set(selected));}catch(e){toast(e.message,"error");}
  };
  const batchDel=async()=>{
    if(selected.size===0)return;
    if(!await showConfirm({title:`${selected.size} Kunden löschen`,message:`Wirklich ${selected.size} ausgewählte Kunden endgültig löschen?`,confirmLabel:`${selected.size} löschen`,variant:"danger"}))return;
    try{await API.batchDeleteKunden([...selected]);const k=await API.getKunden();setKunden(k);setSelected(new Set());toast(`${selected.size} Kunden gelöscht`,"success");}catch(e){toast(e.message,"error");}
  };
  const toggleSel=(id)=>{const s=new Set(selected);if(s.has(id))s.delete(id);else s.add(id);setSelected(s);};
  const toggleAll=()=>{if(selected.size===filtered.length){setSelected(new Set());}else{setSelected(new Set(filtered.map(k=>k.id)));}};
  const handleCSV=async(e)=>{
    const file=e.target.files[0];if(!file)return;setCsvMsg("Importiere...");
    try{const text=await file.text();const r=await API.importKunden(text);const k=await API.getKunden();setKunden(k);setCsvMsg(`${r.imported} Kunden importiert${r.skipped?`, ${r.skipped} übersprungen`:""}`);setTimeout(()=>setCsvMsg(""),5000);}catch(e){setCsvMsg("Fehler: "+e.message);}
  };
  // Close popover on outside click
  useEffect(()=>{if(!edit)return;const h=(e)=>{if(editRef.current&&!editRef.current.contains(e.target))closeEdit();};const t=setTimeout(()=>document.addEventListener("mousedown",h),100);return()=>{clearTimeout(t);document.removeEventListener("mousedown",h);};},[edit]);

  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
      <div><h2 style={{margin:0,fontSize:18,fontWeight:700}}>👥 Kundenverwaltung</h2><p style={{margin:"2px 0 0",fontSize:12,color:C.dunkelgrau}}>{kunden.length} Kunden{bcFilter!=="alle"?` (Filter: ${bcName(bcFilter)})`:""}</p></div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {selected.size>0&&<Btn small variant="ghost" onClick={batchDel} style={{color:C.rot}}>🗑 {selected.size} löschen</Btn>}
        <Btn small variant="secondary" onClick={()=>{const el=document.createElement("input");el.type="file";el.accept=".csv";el.onchange=handleCSV;el.click();}}>📥 CSV Import</Btn>
        <Btn onClick={(e)=>openEdit(null,e)} icon="➕">Neuer Kunde</Btn>
      </div>
    </div>
    {csvMsg&&<div style={{padding:"8px 14px",background:"#e8f5e9",borderRadius:6,marginBottom:10,fontSize:12,color:"#2e7d32"}}>{csvMsg}</div>}
    <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
      <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Kunden suchen..." style={{flex:1,minWidth:200,padding:"8px 12px",border:`1px solid ${C.mittelgrau}`,borderRadius:4,fontSize:13,fontFamily:FONT.sans,boxSizing:"border-box"}}/>
      {isAdmin&&<select value={bcFilter} onChange={e=>setBcFilter(e.target.value)} style={{padding:"8px 10px",border:`1px solid ${C.mittelgrau}`,borderRadius:4,fontSize:12,fontFamily:FONT.sans}}>
        <option value="alle">Alle Bereitschaften</option>
        {BEREITSCHAFTEN.map(b=><option key={b.code} value={b.code}>{b.short}</option>)}
      </select>}
    </div>
    {/* Select all */}
    {filtered.length>0&&<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,padding:"4px 8px"}}>
      <input type="checkbox" checked={selected.size===filtered.length&&filtered.length>0} onChange={toggleAll} style={{cursor:"pointer",width:16,height:16,accentColor:C.rot}}/>
      <span style={{fontSize:11,color:C.bgrau}}>{selected.size>0?`${selected.size} ausgewählt`:"Alle auswählen"}</span>
    </div>}
    {/* Table */}
    <div style={{border:`1px solid ${C.mittelgrau}40`,borderRadius:6,overflow:"hidden"}}>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,fontFamily:FONT.sans}}>
      <thead><tr style={{background:C.hellgrau,fontSize:11,fontWeight:600,color:C.dunkelgrau}}>
        <th style={{padding:"8px 6px",width:30}}></th>
        <th style={{padding:"8px 6px",textAlign:"left"}}>Firma / Name</th>
        <th style={{padding:"8px 6px",textAlign:"left"}} className="mob-hide">Ansprechpartner</th>
        <th style={{padding:"8px 6px",textAlign:"left"}} className="mob-hide">Kontakt</th>
        <th style={{padding:"8px 6px",textAlign:"left"}} className="mob-hide">Adresse</th>
        {isAdmin&&<th style={{padding:"8px 6px",textAlign:"center",width:60}}>BC</th>}
        <th style={{padding:"8px 6px",textAlign:"right",width:80}}>Aktion</th>
      </tr></thead>
      <tbody>{filtered.map((k,i)=><tr key={k.id} style={{borderBottom:`1px solid ${C.mittelgrau}30`,background:selected.has(k.id)?"#fff3e0":i%2===0?"#fff":"#fafafa",cursor:"pointer"}} onDoubleClick={(e)=>openEdit(k,e)}>
        <td style={{padding:"6px",textAlign:"center"}}><input type="checkbox" checked={selected.has(k.id)} onChange={()=>toggleSel(k.id)} style={{cursor:"pointer",accentColor:C.rot}} onClick={e=>e.stopPropagation()}/></td>
        <td style={{padding:"6px"}}>
          <div style={{fontWeight:600}}>{k.name}</div>
          {k.kundennummer&&<span style={{fontSize:10,color:C.rot,fontWeight:600,background:`${C.rot}11`,padding:"0 5px",borderRadius:6}}>#{k.kundennummer}</span>}
          {k.bemerkung&&<div style={{fontSize:10,color:C.bgrau,fontStyle:"italic",marginTop:1}}>{k.bemerkung}</div>}
        </td>
        <td style={{padding:"6px",color:C.dunkelgrau}} className="mob-hide">{k.ansprechpartner||"—"}</td>
        <td style={{padding:"6px"}} className="mob-hide">
          {k.telefon&&<div style={{fontSize:11}}>📞 {k.telefon}</div>}
          {k.email&&<div style={{fontSize:11}}>✉️ <a href={`mailto:${k.email}`} style={{color:C.mittelblau}} onClick={e=>e.stopPropagation()}>{k.email}</a></div>}
        </td>
        <td style={{padding:"6px",fontSize:11,color:C.dunkelgrau}} className="mob-hide">
          {(k.re_strasse||k.reStrasse)&&<div>{k.re_strasse||k.reStrasse}</div>}
          {(k.re_plz_ort||k.rePlzOrt)&&<div>{k.re_plz_ort||k.rePlzOrt}</div>}
          {!(k.re_strasse||k.reStrasse||k.re_plz_ort||k.rePlzOrt)&&"—"}
        </td>
        {isAdmin&&<td style={{padding:"6px",textAlign:"center"}}><span style={{fontSize:10,fontWeight:700,color:bcColor(k.bereitschaft_code),background:bcColor(k.bereitschaft_code)+"18",padding:"2px 6px",borderRadius:8}}>{bcName(k.bereitschaft_code)}</span></td>}
        <td style={{padding:"6px",textAlign:"right"}}>
          <button onClick={(e)=>{e.stopPropagation();openEdit(k,e);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,padding:"2px 6px"}} title="Bearbeiten">✏️</button>
          <button onClick={(e)=>{e.stopPropagation();del(k);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,padding:"2px 6px",color:C.rot}} title="Löschen">✕</button>
        </td>
      </tr>)}</tbody>
    </table></div>
    {filtered.length===0&&!edit&&<Card><div style={{textAlign:"center",padding:30,color:C.dunkelgrau}}><div style={{fontSize:32,marginBottom:8}}>👥</div>Keine Kunden gefunden</div></Card>}
    {edit&&<div ref={editRef} style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:999}}>
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"#0002"}} onClick={closeEdit}/>
      <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:1000,background:C.weiss,border:`2px solid ${C.rot}`,borderRadius:8,padding:16,boxShadow:"0 8px 32px #0003",width:520,maxWidth:"95vw",maxHeight:"80vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <span style={{fontSize:15,fontWeight:700,color:C.rot}}>{edit._id?"✏️ Kunde bearbeiten":"➕ Neuer Kunde"}</span>
          <button onClick={closeEdit} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:C.bgrau}}>✕</button>
        </div>
        <div className="rg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 12px"}}>
          <Inp label="Firma / Name *" value={edit.name} onChange={v=>setEdit(p=>({...p,name:v}))}/>
          <Inp label="Kundennummer" value={edit.kundennummer||""} onChange={v=>setEdit(p=>({...p,kundennummer:v}))}/>
          <Inp label="Ansprechpartner" value={edit.ansprechpartner||""} onChange={v=>setEdit(p=>({...p,ansprechpartner:v}))}/>
          <Inp label="Telefon" value={edit.telefon||""} onChange={v=>setEdit(p=>({...p,telefon:v}))}/>
          <Inp label="E-Mail" value={edit.email||""} onChange={v=>setEdit(p=>({...p,email:v}))}/>
          <Inp label="Anrede" value={edit.anrede||""} onChange={v=>setEdit(p=>({...p,anrede:v}))}/>
          <Inp label="Rechnungsempfänger" value={edit.rechnungsempfaenger||""} onChange={v=>setEdit(p=>({...p,rechnungsempfaenger:v}))}/>
          <Inp label="Straße" value={edit.reStrasse||edit.re_strasse||""} onChange={v=>setEdit(p=>({...p,reStrasse:v,re_strasse:v}))}/>
          <Inp label="PLZ / Ort" value={edit.rePlzOrt||edit.re_plz_ort||""} onChange={v=>setEdit(p=>({...p,rePlzOrt:v,re_plz_ort:v}))}/>
        </div>
        <div style={{marginTop:6}}><label style={{display:"block",fontSize:11,color:C.dunkelgrau,marginBottom:3,fontWeight:600}}>Bemerkung</label>
          <textarea value={edit.bemerkung||""} onChange={e=>setEdit(p=>({...p,bemerkung:e.target.value}))} rows={2} style={{width:"100%",padding:"6px 10px",border:`1px solid ${C.mittelgrau}`,borderRadius:4,fontSize:12,fontFamily:FONT.sans,resize:"vertical",boxSizing:"border-box"}}/>
        </div>
        <div style={{display:"flex",gap:6,marginTop:10}}><Btn variant="success" onClick={save}>💾 Speichern</Btn><Btn variant="secondary" onClick={closeEdit}>Abbrechen</Btn></div>
      </div>
    </div>}
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
  const isPauschal=!!event.pauschalAktiv||(event.pauschalangebot&&event.pauschalangebot>0);
  const endPreis=isPauschal?parseFloat(event.pauschalangebot||0):totalCosts;
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
  const years=[thisYear+1];for(let y=thisYear;y>=2025;y--)years.push(y);
  const isArchive=viewYear<thisYear;
  const isVorplanung=viewYear>thisYear;
  const totalBetrag=events.reduce((s,ev)=>{const e=ev.event;if(!e)return s;if(e.checklist?.angebotAbgelehnt)return s;if(!!e.pauschalAktiv||(e.pauschalangebot&&parseFloat(e.pauschalangebot)>0))return s+parseFloat(e.pauschalangebot||0);const dc=(ev.days||[]).filter(d=>d.active);let t=0;try{dc.forEach(d=>{const c=calcDay(d,DEFAULT_STAMMDATEN.rates,e.verpflegung);t+=c.total;});}catch(e){console.error("Fehler:",e);}return s+t;},0);

  return(<div>
    {/* Year tabs */}
    <div style={{display:"flex",gap:4,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
      {years.map(y=>(<button key={y} onClick={()=>setViewYear(y)} style={{padding:"5px 12px",borderRadius:4,border:`1px solid ${y===viewYear?C.rot:C.mittelgrau+"60"}`,background:y===viewYear?`${C.rot}11`:C.weiss,color:y===viewYear?C.rot:y<thisYear?C.bgrau:C.schwarz,cursor:"pointer",fontSize:12,fontWeight:y===viewYear?700:400,fontFamily:FONT.sans}}>{y}{y===thisYear?" ●":""}{y>thisYear?" Vorplanung":""}</button>))}
    </div>

    <div className="r-vorg-bar" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div>
        <h2 style={{margin:0,fontSize:18,fontWeight:700,color:C.schwarz}}>
          {isArchive?"📦 Archiv":"📁 Vorgänge"} {viewYear}
        </h2>
        <p style={{margin:"2px 0 0",fontSize:12,color:C.dunkelgrau}}>{bereitschaft.name} · {events.length} Vorgang/Vorgänge</p>
      </div>
      <div className="r-vorg-actions" style={{display:"flex",gap:6,alignItems:"center"}}>
        <input type="text" value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Suche (Name, Nr., Kunde...)" style={{padding:"5px 10px",borderRadius:4,border:"1px solid "+C.mittelgrau,fontSize:12,fontFamily:FONT.sans,width:200}}/>
        {(user?.rolle==="admin"||user?.rolle==="kbl")&&<select value={filterBereitschaft} onChange={e=>{const v=e.target.value;setFilterBereitschaft(v);loadEvents(v);if(onFilterChange)onFilterChange(v);}} style={{padding:"5px 10px",borderRadius:4,border:`1px solid ${C.mittelgrau}`,fontSize:12,fontFamily:FONT.sans}}><option value="">Alle Bereitschaften</option>{(allBereitschaften||[]).map(b=><option key={b.code} value={b.code}>{b.short} — {b.name}</option>)}</select>}
        {!isArchive&&<Btn onClick={onNew} icon="➕">Neuer Vorgang</Btn>}
      </div>
    </div>

    {/* ÜBERSICHT TABLE */}
    {(<Card title={`Angebote/Rechnungen ${viewYear}`} accent={C.mittelblau} sub={`Gesamt: ${f2(totalBetrag)} €`}>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
        <thead><tr style={{background:C.hellgrau}}>{[{l:"Lfd.Nr."},{l:"Datum"},{l:"Ansprechpartner",hide:true},{l:"Veranstaltung"},{l:"Kunde",hide:true},{l:"AG",hide:true},{l:"Akz."},{l:"☁️",hide:true},{l:"RG",hide:true},{l:"Betrag",right:true},{l:"Status"},{l:""}].map((h,hi)=><th key={hi} className={h.hide?"mob-hide":""} style={{padding:"6px 8px",textAlign:h.right?"right":"left",borderBottom:`2px solid ${C.mittelgrau}40`,fontSize:10,color:C.dunkelgrau,whiteSpace:"nowrap"}}>{h.l}</th>)}</tr></thead>
        <tbody>{events.filter(ev=>{if(!searchQ)return true;const q=searchQ.toLowerCase();const e=ev.event||{};return(e.name||"").toLowerCase().includes(q)||(e.auftragsnr||"").toLowerCase().includes(q)||(e.veranstalter||"").toLowerCase().includes(q)||(e.rechnungsempfaenger||"").toLowerCase().includes(q)||(e.ansprechpartner||"").toLowerCase().includes(q)||(e.ort||"").toLowerCase().includes(q);}).sort((a,b)=>{const na=a.event?.auftragsnr||"";const nb=b.event?.auftragsnr||"";return nb.localeCompare(na,undefined,{numeric:true});}).map((ev,i)=>{const e=ev.event||{};const cl=e.checklist||{};const dc=(ev.days||[]).filter(d=>d.active);const firstDate=dc[0]?.date;let betrag=0;if(!!e.pauschalAktiv||(e.pauschalangebot&&parseFloat(e.pauschalangebot)>0)){betrag=parseFloat(e.pauschalangebot||0);}else{try{dc.forEach(d=>{betrag+=calcDay(d,DEFAULT_STAMMDATEN.rates,e.verpflegung).total;});}catch(e){console.error("Fehler:",e);}}
          const isAbgelehnt=!!cl.angebotAbgelehnt;const isAkzeptiert=!!cl.angebotSigniertVorliegend;
          return(<tr key={i} style={{borderBottom:`1px solid ${C.hellgrau}`,cursor:"pointer",opacity:isAbgelehnt?0.5:1,textDecoration:isAbgelehnt?"line-through":"none"}} onClick={()=>isArchive?onCopy(ev):onLoad(ev)}>
            <td style={{padding:"5px 8px",fontWeight:600,color:C.rot,fontFamily:FONT.mono,whiteSpace:"nowrap"}}>{e.auftragsnr||"n/a"}</td>
            <td style={{padding:"5px 8px",whiteSpace:"nowrap"}}>{firstDate?fDate(firstDate):""}</td>
            <td className="mob-hide" style={{padding:"5px 8px"}}>{e.ansprechpartner||""}</td>
            <td style={{padding:"5px 8px",fontWeight:600}}>{e.name||"n/a"}</td>
            <td className="mob-hide" style={{padding:"5px 8px"}}>{e.veranstalter||e.rechnungsempfaenger||""}</td>
            <td className="mob-hide" style={{padding:"5px 8px",textAlign:"center"}}>{cl.angebotVersendet?<span style={{color:"#1a7a3a",fontSize:14}}>✅</span>:<span style={{color:"#e53935",fontSize:14}}>❌</span>}</td>
            <td style={{padding:"5px 8px",textAlign:"center"}} title={isAbgelehnt?("Abgelehnt: "+(cl.ablehnungsGrund||"")):isAkzeptiert?"Akzeptiert":"Offen"}>{isAbgelehnt?<span style={{color:"#c62828",fontSize:14,fontWeight:700}}>✖</span>:isAkzeptiert?<span style={{color:"#1a7a3a",fontSize:14}}>✔</span>:<span style={{color:"#bbb",fontSize:14}}>❓</span>}</td>
            <td className="mob-hide" style={{padding:"5px 8px",textAlign:"center"}} title={e.nextcloudSync?("Sync: "+e.nextcloudSync.syncedAt?.substring(0,10)+" von "+e.nextcloudSync.syncedBy):"Nicht synchronisiert"}>{e.nextcloudSync?<span style={{color:"#0288d1",fontSize:14}}>☁️</span>:<span style={{color:"#ddd",fontSize:13}}>☁️</span>}</td>
            <td className="mob-hide" style={{padding:"5px 8px",textAlign:"center"}}>{cl.fibuWeitergeleitet?<span style={{color:"#1a7a3a",fontSize:14}}>✅</span>:<span style={{color:"#e53935",fontSize:14}}>❌</span>}</td>
            <td style={{padding:"5px 8px",textAlign:"right",fontFamily:FONT.mono,fontWeight:600}}>{betrag>0?f2(betrag):""}</td>
            <td style={{padding:"5px 8px"}}>{cl.abgeschlossen?<span style={{color:"#1a7a3a",fontSize:10}}>✅ Abgeschl.</span>:<span style={{color:"#d4920a",fontSize:10}}>⏳ Offen</span>}</td>
            <td style={{padding:"5px 4px",textAlign:"center"}}><button onClick={(e)=>{e.stopPropagation();del(ev.id);}} title="Vorgang löschen" style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:"#ccc",padding:"2px 4px"}} onMouseEnter={e=>e.currentTarget.style.color="#e53935"} onMouseLeave={e=>e.currentTarget.style.color="#ccc"}>🗑️</button></td>
          </tr>);})}</tbody>
        <tfoot><tr style={{borderTop:`2px solid ${C.rot}`}}><td colSpan={10} style={{padding:"6px 8px",fontWeight:700}}>Summe</td><td style={{padding:"6px 8px",textAlign:"right",fontWeight:800,color:C.rot,fontFamily:FONT.mono}}>{f2(totalBetrag)}</td><td></td></tr></tfoot>
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
const TABS=[{id:"events",label:"Vorgänge",icon:"📁"},{id:"event",label:"Veranstaltung",icon:"📋"},{id:"days",label:"Tage & Analyse",icon:"📊"},{id:"costs",label:"Kosten",icon:"💰"},{id:"pdf",label:"Dokumente",icon:"🖨️"},{id:"kunden",label:"Kunden",icon:"👥"},{id:"anfragen",label:"Anfragen",icon:"📩"},{id:"statistik",label:"Statistik",icon:"📈"},{id:"profil",label:"Mein Profil",icon:"👤"},{id:"einstellungen",label:"Einstellungen",icon:"⚙️",admin:true},{id:"releases",label:"Changelog",icon:"🆕"}];
const APP_VERSION="v7.6";
const LATEST_RELEASE={v:"v7.6",d:"04.03.2026",c:[
"FiBu: Weiterleitung per E-Mail mit Angebots-PDF als Anhang",
"FiBu: Abfrage Helfer/Fahrzeuge anderer Bereitschaften (BC, Anzahl, Kennzeichen)",
"FiBu: Freitext-Feld für externe Helfer (THW, ASB etc.) ohne Benachrichtigung",
"FiBu: Fahrzeuge allgemein erfassbar (Typ + Kennzeichen + optionale BC-Zuordnung)",
"FiBu: Automatische Benachrichtigung betroffener Bereitschaften per E-Mail",
"FiBu: Markiert Checkliste 'Weiterleitung an FiBu' + 'Abgeschlossen' automatisch",
"FiBu: Korrektur-Modus bei erneutem Senden (KORREKTUR-Prefix in Betreff + Nachricht)",
"FiBu: Erneutes Senden jederzeit möglich (auch nach Abschluss)",
"FiBu: E-Mail-Adresse in SMTP-Konfiguration konfigurierbar",
"Kunden: Tabellenansicht statt Karten-Layout mit Checkbox-Mehrfachauswahl",
"Kunden: Popover-Bearbeitungsmaske öffnet sich über dem Datensatz",
"Kunden: Name ändern aktualisiert den Kunden statt einen neuen anzulegen",
"Kunden: Bereitschafts-Zuordnung sichtbar für Admins (farbige BC-Badges)",
"Kunden: CSV-Import nutzt Backend-Route (Adresse + PLZ/Ort werden korrekt importiert)",
"Kunden: Batch-Löschung mehrerer Kunden gleichzeitig",
"Profil: Bereitschaftsdaten (E-Mail, Leiter, Telefon) direkt im Profil sichtbar und editierbar",
"Einstellungen: Neuer Sub-Tab 'Bereitschaften' – Admin kann alle Bereitschafts-Kontaktdaten pflegen",
"Einstellungen: Datensynchronisation Profil ↔ Bereitschaften-Tab",
"Einstellungen: Funkgruppe-Feld aus Bereitschafts-Verwaltung entfernt",
"E-Mail: 'Von' zeigt immer die Benutzer-E-Mail (nicht Bereitschafts-E-Mail)",
"Ablehnungsgründe: Anbieter-Eingabefeld bei 'Anderer Anbieter'",
"Ablehnungsgründe: 'Eigene ABsanitäter' umbenannt zu 'Veranstalter stellt eigene Sanitäter'",
"Ablehnungsgründe: Neuer Grund 'Kapazität nicht verfügbar'",
"Session: Sitzungsabbruch bei Keycloak-Timeout behoben (Grace Period statt Destroy)",
]};
const RELEASE_V75={v:"v7.5",d:"04.03.2026",c:[
"Anfragen-Tab: Verwaltung eingehender Anfragen vom öffentlichen Formular",
"Anfragen: Annehmen → automatisch Vorgang mit Auftragsnr erstellen",
"Anfragen: Status-Workflow (Neu → Angenommen/Abgelehnt → Archiviert)",
"Anfragen: Zuweisung an Bereitschaft bei Annahme",
"Anfragen: Detail-Ansicht mit Kontaktdaten, Tagen, Bemerkungen",
"Anfragen: Bestätigungsmail an Veranstalter bei neuer Anfrage",
"Anfragen: Konfigurierbare Empfänger-Liste (Einstellungen → E-Mail)",
"Anfragen: Zugewiesene Bereitschaft + Auftragsnr in Detail-Ansicht sichtbar",
"Anfragen: Bereitschaft umzuweisen (nachträgliche Korrektur der Zuweisung)",
"Anfragen: Vorgang-Link klickbar → öffnet direkt den zugehörigen Vorgang",
"Anfrageformular: PLZ-Feld mit automatischer Bereitschafts-Vorauswahl",
"Anfrageformular: Angebots-/Rechnungsadresse im Formular erfassbar",
"Anfragen: Bemerkung des Veranstalters als separate Infobox im Vorgang",
"Anfragen: Automatische Geocodierung bei Annahme (Karte + what3words)",
"Anfrageformular: 18 PLZ im Landkreis ND-SOB → Bereitschafts-Zuordnung",
"Anfrageformular: iFrame-Embed-Modus (?embed=1) für BRK-Website",
"Anfrageformular: Auto-Resize des iFrames via postMessage",
"Angebotsversand: Mail-Dialog komplett überarbeitet",
"Angebotsversand: Angebotsmappe als Anhang (Deckblatt + Angebot + Vertrag + AAB)",
"Angebotsversand: Professioneller Standard-Mailtext mit automatischer Fristberechnung",
"Angebotsversand: Checkliste wird automatisch aktualisiert nach Versand",
"Angebotsversand: Vorgang wird nach Versand automatisch gesperrt",
"Anfragen: Badge am Tab zeigt Anzahl neuer Anfragen (Polling alle 60s)",
]};
const RELEASE_V74={v:"v7.4",d:"04.03.2026",c:[
"Statistik-Dashboard: Einsätze pro Monat, Status-Verteilung, Bereitschafts-Übersicht",
"Statistik: CSV-Export aller Vorgänge, Jahres- und Bereitschafts-Filter",
"Digitales Einsatzprotokoll: Live-Formular für Einsatztage",
"Einsatzprotokoll: Einsatzzahlen (Behandelt, Bagatelle, Transport) mit berechneter Gesamtsumme",
"Einsatzprotokoll: Einsatztagebuch mit chronologischen Einträgen",
"Einsatzprotokoll: Einsatzkräfte, Fahrzeuge, Zeiten erfassen",
"Einsatzprotokoll: Auto-Speicherung alle 30 Sekunden",
"Einsatzprotokoll: Wechsel zwischen PDF-Druck und Live-Modus",
]};
const RELEASE_V73={v:"v7.3",d:"04.03.2026",c:[
"Tab-Umstrukturierung: Mein Profil + Einstellungen (Admin) mit Sub-Tabs",
"Nextcloud: Konfigurierbarer Pfad-Template ($bereitschaft, $auftragsnr, ...)",
"Nextcloud: Auto-Sync bei jeder PDF-Generierung im Hintergrund",
"Nextcloud: Service-Account (App-Passwort) oder Bearer Token Authentifizierung",
"E-Mail/SMTP: Konfiguration für SMTP, Microsoft 365, Exchange",
"E-Mail: Angebot/Mappe als PDF-Anhang direkt aus SanWD versenden",
"E-Mail: Im Auftrag von Bearbeiter + CC an Bereitschaft",
"Einzel-PDF-Download-Buttons entfernt (Angebotsmappe deckt alles ab)",
]};
const RELEASE_V72={v:"v7.2",d:"03.03.2026",c:[
  "📦 Angebotsmappe: Dokument-Auswahl per Modal – jede Kombination frei wählbar",
  "📑 Deckblatt: Anlagen-Liste passt sich dynamisch an gewählte Dokumente an",
  "📅 Planjahr: Vorgänge für das Folgejahr vorplanen (Dropdown statt Rechnungsnummer)",
  "📋 Vorgänge: Vorplanungs-Tab für nächstes Jahr in der Übersicht",
  "💰 Pauschalangebot: 0 € auf Spendenbasis möglich + korrekte Anzeige in Vorgänge-Liste",
  "🚫 Angebot abgelehnt: Button mit Grund-Popup (Zu teuer, Anderer Anbieter, etc.)",
  "📊 Vorgänge-Liste: Akzeptanz-Spalte (❓/✔/✖), Durchstreichung + Summe ohne Abgelehnte",
  "🔄 BRK.id Callback: Automatischer Re-Login bei verlorener Session statt Fehlermeldung",
]};

export default function App(){
  const [user,setUser]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  const [sessionExpired,setSessionExpired]=useState(false);
  useEffect(()=>{API._onSessionExpired=()=>setSessionExpired(true);return()=>{API._onSessionExpired=null;};},[]);
  useEffect(()=>{API.getStatus().then(d=>{if(d.authenticated){const bc=d.user.bereitschaftCode;const bIdx=BEREITSCHAFTEN.findIndex(b=>b.code===bc);const u={sub:d.user.sub,name:d.user.name,email:d.user.email,bereitschaftCode:bc,bereitschaftIdx:bIdx>=0?bIdx:0,bereitschaft:(d.user.bereitschaft&&d.user.bereitschaft.name)||bc||"",rolle:d.user.rolle,telefon:"",mobil:"",titel:""};setUser(u);API.getProfile().then(p=>{if(p)setUser(prev=>({...prev,telefon:p.telefon||prev.telefon,mobil:p.mobil||prev.mobil,titel:p.titel||prev.titel,email:p.email||prev.email,ort:p.ort||prev.ort||'',signatur:p.unterschrift||prev.signatur||''}));}).catch(()=>{});}}).catch(()=>{}).finally(()=>setAuthLoading(false));},[]);
  const [tab,setTab]=useState("events");
  const [stammdaten,setStammdaten]=useState(DEFAULT_STAMMDATEN);
  const reloadStammdaten=useCallback(()=>{if(!user)return;API.getStammdaten().then(d=>{if(d){const bIdxS=user?BEREITSCHAFTEN.findIndex(b=>b.code===user.bereitschaftCode):-1;setStammdaten(prev=>({...prev,bereitschaftIdx:bIdxS>=0?bIdxS:prev.bereitschaftIdx,kvName:d.kv_name||prev.kvName,kgf:d.kgf||prev.kgf,kvAdresse:d.kv_adresse||prev.kvAdresse,kvPlzOrt:d.kv_plz_ort||prev.kvPlzOrt,bereitschaftsleiter:d.leiter_name||prev.bereitschaftsleiter,bereitschaftsleiterTitle:d.leiter_title||prev.bereitschaftsleiterTitle,telefon:d.telefon||prev.telefon,fax:d.fax||prev.fax,mobil:d.mobil||prev.mobil,email:d.email||prev.email,funkgruppe:d.funkgruppe||prev.funkgruppe,customLogo:d.logo||null,rates:d.kostensaetze?{helfer:d.kostensaetze.helfer,ktw:d.kostensaetze.ktw,rtw:d.kostensaetze.rtw,gktw:d.kostensaetze.gktw,einsatzleiter:d.kostensaetze.einsatzleiter,aerzte:0,einsatzleiterKfz:d.kostensaetze.einsatzleiter_kfz,mobileSanstation:d.kostensaetze.seg_lkw,segLkw:d.kostensaetze.seg_lkw,mtw:d.kostensaetze.mtw,zelt:d.kostensaetze.zelt,kmKtw:d.kostensaetze.km_ktw,kmRtw:d.kostensaetze.km_rtw,kmGktw:d.kostensaetze.km_gktw,kmElKfz:d.kostensaetze.km_el_kfz,kmSegLkw:d.kostensaetze.km_seg_lkw,kmMtw:d.kostensaetze.km_mtw,verpflegung:d.kostensaetze.verpflegung}:prev.rates}));}setStammdatenLoaded(true);}).catch(e=>{console.warn("Stammdaten laden:",e);setStammdatenLoaded(true);});},[user]);
  useEffect(()=>{reloadStammdaten();},[user]);
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
  const [mappeModal,setMappeModal]=useState(false);
  const [ncEnabled,setNcEnabled]=useState(false);
  const [bereitschaften,setBereitschaften]=useState([]);
  const [smtpEnabled,setSmtpEnabled]=useState(false);
  const [mailModal,setMailModal]=useState(false);
  const [epLive,setEpLive]=useState(false);
  useEffect(()=>{
    API.json("/api/nextcloud/status").then(r=>setNcEnabled(!!r.configured)).catch(()=>{});
    API.json("/api/config/smtp").then(r=>setSmtpEnabled(r.smtp_enabled==="true")).catch(()=>{});
    API.json("/api/stammdaten/bereitschaften").then(r=>setBereitschaften(r||[])).catch(()=>{});
  },[]);
  const [mappeDocs,setMappeDocs]=useState({deckblatt:true,angebot:true,vertrag:true,aab:true,gefahren:true});
  const [gefahrenPending,setGefahrenPending]=useState(false);
  const [angebotPending,setAngebotPending]=useState(false);
  const [aabPending,setAabPending]=useState(false);
  const [vertragPending,setVertragPending]=useState(false);
  const [pdfView,setPdfView]=useState("gefahren");
  const {mob,tab:isTablet}=useResponsive();
  const [menuOpen,setMenuOpen]=useState(false);
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
  // What's New banner (einmalig pro Version)
  const [showWhatsNew,setShowWhatsNew]=useState(()=>{try{return localStorage.getItem("sanwd-seen-version")!==APP_VERSION;}catch{return false;}});
  const dismissWhatsNew=useCallback(()=>{setShowWhatsNew(false);try{localStorage.setItem("sanwd-seen-version",APP_VERSION);}catch(e){console.error("Fehler:",e);}},[]);
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
  const [kompOverride,setKompOverride]=useState({ack:false,kommentar:"",saving:false});
  const [showKompModal,setShowKompModal]=useState(false);
  const [stammdatenLoaded,setStammdatenLoaded]=useState(false);
  const printRef=useRef(null);

  const [year,setYear]=useState(new Date().getFullYear());
  const [anfragenNeu,setAnfragenNeu]=useState(0);
  useEffect(()=>{if(!user)return;const poll=()=>API.getAnfragenCount().then(d=>setAnfragenNeu(d.neu||0)).catch(()=>{});poll();const iv=setInterval(poll,60000);return()=>clearInterval(iv);},[user,tab]);
  const storagePrefix=useMemo(()=>`sanwd:${user?.bereitschaftCode||BEREITSCHAFTEN[stammdaten.bereitschaftIdx]?.code||"BSOB"}:${year}`,[stammdaten.bereitschaftIdx,year]);
  const kundenKey=useMemo(()=>`sanwd:${BEREITSCHAFTEN[stammdaten.bereitschaftIdx].code}:kunden`,[stammdaten.bereitschaftIdx]);

  useEffect(()=>{if(!user)return;(async()=>{try{const k=await API.getKunden();setKunden(k);}catch{setKunden([]);}try{const kl=await API.getKlauseln();setKlauseln(kl);const ed={};kl.forEach(k=>ed[k.id]=k.inhalt);setKlauselnEdit(ed);}catch(e){console.error("Fehler:",e);}})();},[user,kundenKey]);

  const saveKunden=useCallback(async(k)=>{try{for(const kunde of k){await API.saveKunde(kunde);}}catch(e){console.error("Fehler:",e);}},[]);

  const upsertKunde=useCallback((ev)=>{if(!ev.veranstalter&&!ev.rechnungsempfaenger)return;const name=ev.veranstalter||ev.rechnungsempfaenger;const entry={name,ansprechpartner:ev.ansprechpartner||"",telefon:ev.telefon||"",email:ev.email||"",rechnungsempfaenger:ev.rechnungsempfaenger||"",re_strasse:ev.reStrasse||"",re_plz_ort:ev.rePlzOrt||"",anrede:ev.anrede||"Sehr geehrte Damen und Herren,"};API.saveKunde(entry).catch(()=>{});setKunden(prev=>{const idx=prev.findIndex(k=>k.name===name);return idx>=0?prev.map((k,i)=>i===idx?{...k,...entry}:k):[...prev,entry];});},[]);

  useEffect(()=>{if(!user)return;(async()=>{try{const c=await API.getCounter(year);setLaufendeNr(c.nextNr||1);}catch(e){console.error("Fehler:",e);}})();},[user,year]);

  const generateNr=useCallback(()=>{const b=BEREITSCHAFTEN[stammdaten.bereitschaftIdx];const yr=String(year).slice(-2);const nr=String(laufendeNr).padStart(3,"0");setEvent(p=>({...p,auftragsnr:`${b.code} ${yr}/${nr}`}));const next=laufendeNr+1;setLaufendeNr(next);if(user)try{API.incrementCounter(year).catch(()=>{});}catch(e){console.error("Fehler:",e);}},[stammdaten.bereitschaftIdx,laufendeNr,year,user,storagePrefix]);

  const saveEvent=useCallback(async()=>{
  /* Lock-Check entfernt - Backend prueft serverseitig, initialer Save muss durchgehen */
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
      }catch(e){console.error("Fehler:",e);}
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
    const getStyles=()=>{let s="";for(const ss of document.styleSheets){try{for(const rule of ss.cssRules)s+=rule.cssText+" ";}catch(e){console.error("Fehler:",e);}}return s;};
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
  const releaseLock=useCallback(async()=>{if(currentEventId){try{await API.unlockVorgang(currentEventId);}catch(e){console.error("Fehler:",e);}setLockInfo(null);}},[currentEventId]);
  const newEvent=useCallback(()=>{setCurrentEventId(null);setEvent({...EMPTY_EVENT});setDays(Array.from({length:8},(_,i)=>mkDay(i+1)));setActiveDay(0);setTab("event");},[]);
  const loadEvent=useCallback(async(ev)=>{
    setCurrentEventId(ev.id);setEvent({...EMPTY_EVENT,...(ev.event||{})});setDays(ev.days||Array.from({length:8},(_,i)=>mkDay(i+1)));setTab("event");setActiveDay(0);
    setKompOverride({ack:false,kommentar:"",saving:false});setShowKompModal(false);
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
  const copyEvent=useCallback((ev)=>{setCurrentEventId(null);const e={...EMPTY_EVENT,...(ev.event||{}),auftragsnr:"",checklist:{}};setEvent(e);setDays((ev.days||Array.from({length:8},(_,i)=>mkDay(i+1))).map(d=>({...d,date:""})));setActiveDay(0);setTab("event");},[]);

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
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
        /* ═══ RESPONSIVE v7 ═══ */
        @media(max-width:768px){
          .rg2,.rg3,.rg21{grid-template-columns:1fr!important}
          .rg3s{grid-template-columns:1fr 1fr!important}
          .mob-hide{display:none!important}
          .top-nav{display:none!important}
          .r-main{padding-left:8px!important;padding-right:8px!important}
          .r-header{padding:8px 12px!important}
          .r-header-right .r-user-name,.r-header-right .r-abmelden{display:none!important}
          .r-header-right .r-event-badge{display:none!important}
          .r-vorg-bar{flex-direction:column!important;align-items:stretch!important;gap:8px!important}
          .r-vorg-bar input{width:100%!important}
          .r-vorg-bar select{width:100%!important}
          .r-vorg-actions{flex-direction:column!important;gap:6px!important}
          .r-vorg-actions button{width:100%!important;justify-content:center!important}
          .r-tab-content{overflow-x:auto!important}
          .pdf-page{width:100%!important;min-height:auto!important;padding:8mm 6mm!important;transform:none!important}
          .r-modal{width:95vw!important;max-height:90vh!important}
          .r-stat-grid{grid-template-columns:1fr 1fr 1fr!important;gap:6px!important}
          .r-card{padding:12px 14px!important}
        }
        @media(min-width:769px)and(max-width:1024px){
          .rg3{grid-template-columns:1fr 1fr!important}
          .rg21{grid-template-columns:1fr 1fr!important}
          .r-main{padding-left:10px!important;padding-right:10px!important}
        }
        @media(min-width:769px){
          .mob-show{display:none!important}
          .hamburger-btn{display:none!important}
        }
        /* Hamburger Drawer */
        .drawer-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:1100;opacity:0;transition:opacity 0.25s ease}
        .drawer-overlay.open{opacity:1}
        .drawer{position:fixed;top:0;left:-280px;width:280px;height:100%;background:#fff;z-index:1101;transition:left 0.25s ease;box-shadow:4px 0 20px rgba(0,0,0,0.15);display:flex;flex-direction:column}
        .drawer.open{left:0}
        .drawer-item{display:flex;align-items:center;gap:10px;padding:14px 20px;border:none;background:none;cursor:pointer;font-size:14px;color:#554F4A;font-family:'Open Sans',sans-serif;border-bottom:1px solid #f0f0f0;text-align:left;width:100%}
        .drawer-item:hover{background:#f5f5f5}
        .drawer-item.active{color:#E60005;background:#E6000508;font-weight:700}
        .drawer-item .drawer-icon{font-size:18px;width:24px;text-align:center}
      `}</style>
      <div style={{height:4,background:C.rot}}/>
      <header className="r-header" style={{background:C.weiss,borderBottom:`1px solid ${C.mittelgrau}40`,padding:"10px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 4px #0001"}}>
        <div style={{display:"flex",alignItems:"center",gap:mob?8:12}}>
          <button className="hamburger-btn" onClick={()=>setMenuOpen(true)} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:C.schwarz,padding:"2px 6px",lineHeight:1}}>☰</button>
          <BRKLogo size={mob?28:36} full customLogo={stammdaten.customLogo}/>
          {!mob&&<div><div style={{fontSize:15,fontWeight:700,color:C.schwarz}}>Bayerisches Rotes Kreuz</div><div style={{fontSize:11,color:C.dunkelgrau}}>{bereitschaft.name} · Sanitätswachdienst</div></div>}
          {mob&&<div style={{fontSize:13,fontWeight:700,color:C.schwarz}}>SanWD</div>}
        </div>
        <div className="r-header-right" style={{display:"flex",alignItems:"center",gap:mob?8:14}}>
          {saving&&<span style={{fontSize:11,color:"#1a7a3a"}}>💾</span>}
          {currentEventId&&!saving&&<span className="r-event-badge" style={{fontSize:11,color:C.dunkelgrau,display:"flex",alignItems:"center",gap:6,background:"#f5f5f5",padding:"3px 10px",borderRadius:12,maxWidth:280,overflow:"hidden"}}>
            <span style={{color:"#27ae60"}}>✓</span>
            <span style={{fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{event.name||"Unbenannte Veranstaltung"}</span>
            {event.auftragsnr&&<span style={{color:C.rot,fontWeight:700,whiteSpace:"nowrap"}}>&nbsp;·&nbsp;{event.auftragsnr}</span>}
          </span>}
          <div onClick={()=>setTab("profil")} style={{display:"flex",alignItems:"center",gap:mob?4:8,cursor:"pointer"}} title="Mein Profil"><div style={{width:30,height:30,borderRadius:15,background:C.rot,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff"}}>{user.name.charAt(0)}</div>{!mob&&<div className="r-user-name"><div style={{fontSize:12,fontWeight:600}}>{user.name}</div><div style={{fontSize:10,color:C.dunkelgrau}}>{user.bereitschaft}{user.rolle==="admin"?" (Admin)":user.rolle==="bl"?" (BL)":""}</div></div>}</div>
          <Btn className="r-abmelden" small variant="ghost" onClick={()=>window.location.href="/auth/logout"}>{mob?"⏻":"Abmelden"}</Btn>
        </div>
      </header>
      <nav className="top-nav" style={{display:"flex",gap:1,padding:"0 12px",background:C.weiss,borderBottom:`1px solid ${C.mittelgrau}40`,overflowX:"auto"}}>{TABS.filter(t=>!t.admin||user?.rolle==="admin").map(t=>(<button key={t.id} onClick={()=>{if(t.id==="events"){releaseLock();setCurrentEventId(null);setEvent({...EMPTY_EVENT});setDays(Array.from({length:8},(_,i)=>mkDay(i+1)));}setTab(t.id);}} style={{padding:"10px 14px",background:"none",border:"none",color:tab===t.id?C.rot:C.dunkelgrau,fontSize:12,fontWeight:tab===t.id?700:500,cursor:"pointer",display:"flex",alignItems:"center",gap:5,borderBottom:tab===t.id?`2px solid ${C.rot}`:"2px solid transparent",fontFamily:FONT.sans,whiteSpace:"nowrap"}}><span style={{fontSize:13}}>{t.icon}</span> {t.label}{t.id==="anfragen"&&anfragenNeu>0&&<span style={{marginLeft:4,background:C.rot,color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:10,fontWeight:700,lineHeight:"16px",minWidth:16,textAlign:"center",display:"inline-block",animation:"pulse 2s infinite"}}>{anfragenNeu}</span>}</button>))}</nav>

      <main className="r-main" style={{maxWidth:1100,margin:"0 auto",padding:"16px 14px"}}>

        {/* VORGÄNGE + ARCHIV */}
        {tab==="events"&&<VorgaengeListe bereitschaftCode={BEREITSCHAFTEN[stammdaten.bereitschaftIdx].code} user={user} onLoad={loadEvent} onNew={newEvent} onCopy={copyEvent} bereitschaft={bereitschaft} allBereitschaften={BEREITSCHAFTEN} toast={toast} showConfirm={showConfirm}/>}

        {/* VERANSTALTUNG */}
        {tab==="event"&&(<div>
          <LockBanner lockInfo={lockInfo} isOwner={lockInfo?.lockedBy===user?.name} onUnlock={async()=>{try{await API.unlockVorgang(currentEventId);setLockInfo(null);}catch(e){console.error("Fehler:",e);}}}/>
          <StatusBanner angebotVersendet={event?.checklist?.angebotVersendet} abgeschlossen={event?.checklist?.abgeschlossen} onUnlock={async(begruendung)=>{await API.entsperrenVorgang(currentEventId,begruendung);updateEvent("checklist",{...event.checklist,angebotVersendet:false,abgeschlossen:false});}}/>
          <div className="rg21" style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14}}>
            <div style={{position:"relative"}}>
              {(isLocked||isEditLocked)&&<div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"rgba(255,255,255,0.55)",zIndex:10,borderRadius:8,pointerEvents:"all"}}/>}
              <Card title="Auftrag" accent={C.rot} sub={event.auftragsnr?`Nr. ${event.auftragsnr}`:"Noch keine Nummer"} action={<div style={{display:"flex",gap:6}}><Btn small onClick={generateNr} icon="🔢">Nr. generieren</Btn><Btn small variant="success" onClick={saveEvent} icon="💾" disabled={isLocked}>Speichern</Btn></div>}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 16px",className:"rg3"}}>
                  <Sel label="Bereitschaft" value={stammdaten.bereitschaftIdx} onChange={v=>updateStamm("bereitschaftIdx",v)} disabled={user?.rolle!=="admin"&&user?.rolle!=="kbl"} options={(user?.rolle==="admin"||user?.rolle==="kbl")?BEREITSCHAFTEN.map((b,i)=>({value:i,label:`${b.code} — ${b.name}`})):BEREITSCHAFTEN.map((b,i)=>({value:i,label:`${b.code} — ${b.name}`})).filter(o=>BEREITSCHAFTEN[o.value]?.code===user?.bereitschaftCode)}/>
                  <Inp label="Auftragsnummer" value={event.auftragsnr} onChange={v=>updateEvent("auftragsnr",v)} placeholder="Auto-generiert"/>
                  <Sel label="Planjahr" value={year} onChange={v=>setYear(Number(v))} options={[{value:new Date().getFullYear(),label:String(new Date().getFullYear())},{value:new Date().getFullYear()+1,label:String(new Date().getFullYear()+1)+" (Vorplanung)"}]}/>
                </div>
                <div style={{display:"flex",gap:12,alignItems:"center",padding:"6px 10px",background:C.hellgrau,borderRadius:4,fontSize:11,color:C.dunkelgrau}}>
                  <span>Nächste Nr:</span>
                  <input type="number" min={1} value={laufendeNr} onChange={e=>{const v=parseInt(e.target.value)||1;setLaufendeNr(v);if(user)API.incrementCounter(year).catch(()=>{})}} style={{width:60,padding:"2px 6px",border:`1px solid ${C.mittelgrau}`,borderRadius:3,fontSize:12,fontFamily:FONT.mono}}/>
                  <span style={{color:C.bgrau}}>Speicherung: {bereitschaft.code} / {year}</span>
                </div>
              </Card>
              <Card title="Veranstaltung" accent={isLocked?"#a5d6a7":"#1a7a3a"}>
                <Inp label="Name der Veranstaltung" value={event.name} onChange={v=>updateEvent("name",v)} disabled={isLocked}/>
                <div className="rg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
                  <Inp label="Veranstaltungsort" value={event.ort} onChange={v=>updateEvent("ort",v)} disabled={isLocked}/>
                  <AddressAutocomplete label="Adresse inkl. Hausnummer (z.B. Karl-Konrad-Str. 3)" value={event.adresse} onChange={v=>updateEvent("adresse",v)} onResult={s=>{updateEvent("coords",{lat:s.lat,lng:s.lng});if(s.w3w)updateEvent("w3w",s.w3w);updateEvent("addrImprecise",!!s.imprecise);}}/>
                </div>
                <LeafletMap coords={event.coords} w3w={event.w3w} onChange={r=>{updateEvent("coords",{lat:r.lat,lng:r.lng});if(r.address)updateEvent("adresse",r.address);updateEvent("addrImprecise",false);}} onW3W={w=>updateEvent("w3w",w)}/>
                {event.addrImprecise&&<div style={{background:"#fff3cd",border:"1px solid #ffc107",borderRadius:4,padding:"8px 12px",marginTop:6,fontSize:12,color:"#856404",display:"flex",alignItems:"center",gap:8}}>⚠️ <span>Hausnummer konnte nicht exakt aufgelöst werden. <strong>Bitte Pin auf der Karte zur genauen Position verschieben</strong> – der what3words-Code wird automatisch aktualisiert.</span></div>}
                <div className="rg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px",marginTop:10}}>
                  <Chk label="Kfz-Stellplatz vorhanden" checked={event.kfzStellplatz} onChange={v=>{if(!isLocked)updateEvent("kfzStellplatz",v)}}/>
                  <Chk label="Sanitätsraum vorhanden" checked={event.sanitaetsraum} onChange={v=>{if(!isLocked)updateEvent("sanitaetsraum",v)}}/>
                  <Chk label="Stromanschluss vorhanden" checked={event.strom} onChange={v=>{if(!isLocked)updateEvent("strom",v)}}/>
                  <Chk label="Verpflegung durch Veranstalter" checked={event.verpflegung} onChange={v=>{if(!isLocked)updateEvent("verpflegung",v)}}/>
                </div>
                {!event.verpflegung&&<div style={{padding:"8px 12px",background:"#fff3cd",border:"1px solid #ffc10744",borderRadius:4,fontSize:12,color:"#856404",marginTop:6}}>Verpflegungspauschale: {stammdaten.rates.verpflegung}€/Person/8h wird automatisch berechnet</div>}
                <Card accent="#ff6f00"><div style={{fontSize:13,fontWeight:700,marginBottom:8,color:"#e65100"}}>✉ Pauschalangebot</div>
                <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                  <input type="checkbox" checked={!!event.pauschalAktiv||(event.pauschalangebot>0)} onChange={e=>{if(e.target.checked){updateEvent("pauschalAktiv",true);updateEvent("pauschalangebot",Math.round(totalCosts));}else{updateEvent("pauschalAktiv",false);updateEvent("pauschalangebot",0);}}}/>
                  <span style={{fontSize:12}}>Pauschalpreis im Angebot verwenden</span>
                </div>
                {(!!event.pauschalAktiv||(event.pauschalangebot>0))&&<div style={{marginTop:8,display:"flex",alignItems:"center",gap:12}}>
                  <div><div style={{fontSize:11,color:"#666",marginBottom:2}}>Pauschalpreis (€)</div><input type="number" value={event.pauschalangebot||0} onChange={e=>{updateEvent("pauschalangebot",parseFloat(e.target.value)||0);updateEvent("pauschalAktiv",true);}} style={{width:120,padding:"6px 8px",border:"1px solid #ccc",borderRadius:4,fontFamily:FONT.mono,fontSize:14,fontWeight:700}}/></div>
                  <div style={{fontSize:11,color:"#666",marginTop:14}}>Kalkulation: {f$(totalCosts)}<br/>Differenz: <span style={{color:(event.pauschalangebot||0)<totalCosts?"#c62828":"#2e7d32",fontWeight:600}}>{f$((event.pauschalangebot||0)-totalCosts)}</span></div>
                  <div style={{marginTop:2}}><button onClick={()=>{updateEvent("pauschalangebot",0);}} style={{padding:"4px 12px",background:"#e65100",color:"#fff",border:"none",borderRadius:4,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:FONT.sans}}>0 € auf Spendenbasis</button><span style={{fontSize:10,color:"#c62828",fontStyle:"italic",marginLeft:8}}>⚠ Offiziell nicht zulässig – nur in Ausnahmefällen</span></div>
                </div>}
                </Card>
              </Card>

              <Card title="Veranstalter / Rechnungsempfänger" accent={C.dunkelblau}>
                {kunden.length>0&&<div style={{marginBottom:10}}>
                  <label style={{fontSize:11,fontWeight:600,color:C.dunkelgrau,display:"block",marginBottom:3}}>Aus Kundenstamm wählen</label>
                  <select style={{width:"100%",padding:"7px 10px",border:`1px solid ${C.mittelgrau}80`,borderRadius:4,fontSize:13,fontFamily:FONT.sans,background:C.weiss,color:C.schwarz}} value="" onChange={e=>{const k=kunden.find(c=>c.name===e.target.value);if(k){setEvent(p=>({...p,veranstalter:k.name,ansprechpartner:k.ansprechpartner,telefon:k.telefon,email:k.email,rechnungsempfaenger:k.rechnungsempfaenger||k.name,reStrasse:k.re_strasse||k.reStrasse||"",rePlzOrt:k.re_plz_ort||k.rePlzOrt||"",anrede:k.anrede||p.anrede}));}}}>
                    <option value="">— Kunde wählen —</option>
                    {kunden.sort((a,b)=>a.name.localeCompare(b.name)).map((k,i)=><option key={i} value={k.name}>{k.name}{k.kundennummer?` #${k.kundennummer}`:""}{k.ansprechpartner?` (${k.ansprechpartner})`:""}</option>)}
                  </select>
                  <div style={{fontSize:10,color:C.bgrau,marginTop:2}}>💡 Kundendaten werden automatisch beim Speichern aktualisiert</div>
                </div>}
                <div className="rg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
                  <Inp label="Veranstalter" value={event.veranstalter} onChange={v=>updateEvent("veranstalter",v)}/>
                  <Inp label="Rechnungsempfänger" value={event.rechnungsempfaenger} onChange={v=>updateEvent("rechnungsempfaenger",v)}/>
                  <Inp label="Ansprechpartner" value={event.ansprechpartner} onChange={v=>updateEvent("ansprechpartner",v)}/>
                  <Inp label="Telefon" value={event.telefon} onChange={v=>updateEvent("telefon",v)}/>
                  <Inp label="E-Mail" value={event.email} onChange={v=>updateEvent("email",v)}/>
                  <Inp label="Anrede" value={event.anrede} onChange={v=>updateEvent("anrede",v)}/>
                  <Inp label="Straße" value={event.reStrasse} onChange={v=>updateEvent("reStrasse",v)}/>
                  <Inp label="PLZ / Ort" value={event.rePlzOrt} onChange={v=>updateEvent("rePlzOrt",v)}/>
                </div>
                {event.veranstalterInfo&&<div style={{margin:"10px 0",padding:"10px 14px",background:"#fff3e0",border:"1px solid #ffe0b2",borderRadius:6}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#e65100",marginBottom:4}}>📋 Info vom Veranstalter (Anfrage)</div>
                  <div style={{fontSize:12,color:"#333",whiteSpace:"pre-wrap",lineHeight:1.5}}>{event.veranstalterInfo}</div>
                </div>}
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
                <VorgangChecklist checklist={event.checklist||{}} onChange={updateChecklist} onLockSave={async(newCL)=>{const id=currentEventId;if(!id||!user)return;try{const bc=BEREITSCHAFTEN[stammdaten.bereitschaftIdx]?.code;const lockEvent={...event,checklist:newCL};await API.saveVorgang(id,{id,event:lockEvent,days,year,updatedAt:Date.now(),activeDays:days.filter(d=>d.active).length,createdBy:user.name,bereitschaftCode:bc});console.log("Lock-Save OK:",id);toast("Status gespeichert","success");}catch(e){console.error("Lock-Save Fehler:",e);toast("Speichern fehlgeschlagen: "+e.message,"error");}}} eventDate={activeDays[activeDays.length-1]?.date||activeDays[0]?.date} currentEventId={currentEventId} event={event} user={user} stammdaten={stammdaten} dayCalcs={dayCalcs} totalCosts={totalCosts} activeDays={activeDays} toast={toast}/>
              </Card>
              <Card title="Zusammenfassung">
                <div style={{display:"grid",gap:6}}>
                  <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12}}><span style={{color:C.dunkelgrau}}>Aktive Tage</span><span style={{fontWeight:700}}>{activeDays.length}</span></div>
                  <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12}}><span style={{color:C.dunkelgrau}}>Gesamtkosten</span><span style={{fontWeight:700,color:C.rot,fontFamily:FONT.mono}}>{f$(totalCosts)}</span></div>
                  {event.w3w&&<div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12}}><span style={{color:C.dunkelgrau}}>what3words</span><span style={{fontWeight:600,color:C.rot,fontSize:11}}>{event.w3w}</span></div>}
                </div>
              </Card>
              {currentEventId&&editHistory.length>0&&<HistoryWidget history={editHistory}/>}
            </div>
          </div>
        </div>)}

        {/* TAGE & ANALYSE */}
        {tab==="days"&&(<div>
          <LockBanner lockInfo={lockInfo} isOwner={lockInfo?.lockedBy===user?.name} onUnlock={async()=>{try{await API.unlockVorgang(currentEventId);setLockInfo(null);}catch(e){console.error("Fehler:",e);}}}/>
          <StatusBanner angebotVersendet={event?.checklist?.angebotVersendet} abgeschlossen={event?.checklist?.abgeschlossen} onUnlock={async(begruendung)=>{await API.entsperrenVorgang(currentEventId,begruendung);updateEvent("checklist",{...event.checklist,angebotVersendet:false,abgeschlossen:false});}}/>
          <div style={{display:"flex",gap:4,marginBottom:12,flexWrap:"wrap"}}>{days.map((d,i)=>(<div key={i} style={{display:"inline-flex",alignItems:"center",gap:0}}>
              <button onClick={()=>{if(!(isLocked||isEditLocked)&&!d.active)updateDay(i,"active",true);if(d.active)setActiveDay(i);}} style={{padding:"6px 14px",borderRadius:d.active&&i>0?"4px 0 0 4px":4,border:`1px solid ${d.active?(activeDay===i?C.rot:C.mittelgrau):"#e0e0e0"}`,background:activeDay===i?`${C.rot}11`:d.active?C.weiss:C.hellgrau,color:d.active?C.schwarz:C.bgrau,cursor:d.active?"pointer":"default",fontSize:12,fontWeight:activeDay===i?700:500,fontFamily:FONT.sans,borderRight:d.active&&i>0?"none":undefined,opacity:!d.active&&(isLocked||isEditLocked)?0.4:1}}>Tag {i+1}{d.active&&d.date&&<span style={{marginLeft:4,fontSize:10,opacity:0.6}}>{fDate(d.date)}</span>}</button>
              {d.active&&i>0&&!(isLocked||isEditLocked)&&<button onClick={(e)=>{e.stopPropagation();updateDay(i,"active",false);if(activeDay===i)setActiveDay(0);}} title="Tag deaktivieren" style={{padding:"6px 8px",borderRadius:"0 4px 4px 0",border:`1px solid ${activeDay===i?C.rot:C.mittelgrau}`,borderLeft:"none",background:activeDay===i?`${C.rot}11`:C.weiss,color:C.rot,cursor:"pointer",fontSize:11,fontWeight:700,lineHeight:1}}>✕</button>}
            </div>))}</div>
          <div style={{position:"relative"}}>
          {(isLocked||isEditLocked)&&<div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"rgba(255,255,255,0.55)",zIndex:10,borderRadius:8,pointerEvents:"all"}}/>}
          {(()=>{const i=activeDay,d=days[i];if(!d.active)return<Card><p style={{color:C.dunkelgrau,textAlign:"center",padding:32}}>Tag {i+1} nicht aktiv. <Btn small onClick={()=>updateDay(i,"active",true)}>Aktivieren</Btn></p></Card>;
            const calc=calcDay(d,stammdaten.rates,event.verpflegung);
            return(<div className="rg21" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div>
                <Card title={`Tag ${i+1}`} accent={C.mittelblau}>
                  <div className="rg3s" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 10px"}}><Inp label="Datum" type="date" value={d.date} onChange={v=>updateDay(i,"date",v)}/><Inp label="Beginn" type="time" value={d.startTime} onChange={v=>updateDay(i,"startTime",v)}/><Inp label="Ende" type="time" value={d.endTime} onChange={v=>updateDay(i,"endTime",v)}/></div>
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
                    <div className="rg3s" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 6px"}}>
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
                {(()=>{const maxTP=Math.max(...dayCalcs.map(d=>d.tp),0);const auth=getSignAuthority(maxTP);const userMax=getUserMaxStufe(user?.rolle);const exceeded=auth.stufe>userMax;return(
                  <Card title="4-Augen-Prinzip" accent={exceeded?"#e65100":"#1a7a3a"}>
                    <div style={{fontSize:12,lineHeight:1.6}}>
                      <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.bgrau}}>Max. Stellen:</span><strong>{maxTP}</strong></div>
                      <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.bgrau}}>Erstellt:</span><strong>{auth.erstellt}</strong></div>
                      <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.bgrau}}>Kontrolle:</span><strong style={{color:exceeded?"#e65100":C.rot}}>{auth.kontrolle}</strong></div>
                    </div>
                    {exceeded&&!kompOverride.ack&&<button onClick={()=>setShowKompModal(true)} style={{marginTop:8,width:"100%",padding:"8px 10px",background:"#fff3cd",border:"1px solid #ffc10766",borderRadius:4,fontSize:12,fontWeight:600,color:"#856404",cursor:"pointer",fontFamily:FONT.sans,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>⚠️ Prüfung durch {auth.kontrolle} notwendig</button>}
                    {kompOverride.ack&&<div style={{marginTop:8,padding:"6px 10px",background:"#e8f5e9",border:"1px solid #a5d6a766",borderRadius:4,fontSize:11,color:"#2e7d32",display:"flex",alignItems:"center",gap:6}}>✅ Override bestätigt</div>}
                  </Card>
                );})()}
              </div>
            </div>);
          })()}
        </div></div>)}

        {/* KOSTEN */}
        {tab==="costs"&&(<div><LockBanner lockInfo={lockInfo} isOwner={lockInfo?.lockedBy===user?.name} onUnlock={async()=>{try{await API.unlockVorgang(currentEventId);setLockInfo(null);}catch(e){console.error("Fehler:",e);}}}/>
          <div className="r-stat-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14}}><Card><Stat label="Personal" value={dayCalcs.reduce((s,d)=>s+d.tp,0)}/></Card><Card><Stat label="Stunden" value={dayCalcs.reduce((s,d)=>s+d.h,0)} color="#1a7a3a"/></Card><Card><Stat label="Gesamtkosten" value={f$(totalCosts)} color={C.rot}/></Card></div>
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
                <Btn onClick={()=>{if(!currentEventId){toast("Bitte zuerst Vorgang speichern","warning");return;}setMappeDocs({deckblatt:true,angebot:true,vertrag:true,aab:true,gefahren:true});setMappeModal(true);}} icon="📦" variant="success" disabled={mappePending}>{mappePending?"Erstelle PDF...":"Angebotsmappe erstellen"}</Btn>
                {ncEnabled&&<button title="Alle Dokumente in Nextcloud synchronisieren" onClick={async()=>{if(!currentEventId){toast("Bitte zuerst Vorgang speichern","warning");return;}await saveEvent();try{const r=await API.syncToNextcloud(currentEventId,{dayCalcs,totalCosts,activeDays});if(r.success){toast("☁️ "+r.results.length+" Dateien synchronisiert","success");setEvent(p=>({...p,nextcloudSync:{syncedAt:r.syncedAt,folder:r.folder,files:r.results.map(f=>f.file),syncedBy:user?.name}}));}else{toast("Sync: "+(r.error||"Fehler"),"error");}}catch(e){toast("Nextcloud: "+e.message,"error");}}} disabled={mappePending} style={{width:36,height:36,borderRadius:8,border:"1px solid #90caf9",background:event.nextcloudSync?"#e3f2fd":"#fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,transition:"all 0.2s",position:"relative"}} onMouseEnter={e=>e.currentTarget.style.background="#bbdefb"} onMouseLeave={e=>e.currentTarget.style.background=event.nextcloudSync?"#e3f2fd":"#fff"}>🔄☁️</button>}
                {smtpEnabled&&<button title="Angebot per E-Mail senden" onClick={()=>{if(!currentEventId){toast("Bitte zuerst Vorgang speichern","warning");return;}setMailModal(true);}} style={{width:36,height:36,borderRadius:8,border:"1px solid #ef9a9a",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,transition:"all 0.2s"}} onMouseEnter={e=>e.currentTarget.style.background="#ffebee"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>✉️</button>}
                {ncEnabled&&event.nextcloudSync&&<span style={{fontSize:10,color:"#1565c0"}} title={event.nextcloudSync.folder}>✓ {event.nextcloudSync.syncedAt?.substring(0,10)}</span>}
              </div>
            </div>
          </Card>
          <div ref={printRef} style={{background:"#fff",borderRadius:8,overflow:"hidden"}}>
            {pdfView==="gefahren"&&activeDays.map((d,i)=><GefahrenPDF key={i} day={d} calc={dayCalcs[i]} eventData={event} stammdaten={stammdaten} dayNum={i+1}/>)}
            {pdfView==="angebot"&&<div data-print="angebot"><AngebotPDF event={event} dayCalcs={dayCalcs} totalCosts={totalCosts} stammdaten={stammdaten} activeDays={activeDays} bereitschaft={bereitschaft} user={user}/></div>}
            {pdfView==="vertrag"&&<Card accent={C.dunkelblau}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><span style={{fontSize:20}}>📄</span><div><div style={{fontSize:14,fontWeight:700,color:C.dunkelblau}}>Vereinbarung</div><div style={{fontSize:11,color:C.dunkelgrau}}>Serverseitig generiertes PDF mit Seitenzahlen</div></div></div><Btn variant="primary" onClick={async()=>{if(!currentEventId){toast("Bitte zuerst Vorgang speichern","warning");return;}setVertragPending(true);await saveEvent();try{const r=await fetch("/api/pdf/vertrag/"+currentEventId,{method:"POST",credentials:"include"});if(!r.ok){const e=await r.json();toast(e.error||"Fehler","error");return;}const blob=await r.blob();const url=URL.createObjectURL(blob);window.open(url,"_blank");}catch(e){toast(e.message,"error");}finally{setVertragPending(false);}}} disabled={vertragPending}>{vertragPending?"Erstelle PDF...":"Vertrag-PDF generieren und öffnen"}</Btn></Card>}
            {pdfView==="aab"&&<div data-print="aab"><AABPDF stammdaten={stammdaten} bereitschaft={bereitschaft}/></div>}
            {pdfView==="ils"&&<ILSPreview event={event} days={days} stammdaten={stammdaten} user={user} updateEvent={updateEvent} currentEventId={currentEventId} saveEvent={saveEvent} toast={toast}/>}
            {pdfView==="einsatzprotokoll"&&<div>
              <div style={{display:"flex",gap:6,marginBottom:12}}>
                <Btn variant={!epLive?"primary":"secondary"} small onClick={()=>setEpLive(false)}>🖨️ PDF Druck</Btn>
                <Btn variant={epLive?"primary":"secondary"} small onClick={()=>setEpLive(true)}>📋 Live Protokoll</Btn>
              </div>
              {epLive?<EinsatzprotokollLive event={event} currentEventId={currentEventId} days={days} user={user} toast={toast}/>
              :<Card accent={C.dunkelblau}>
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
            </Card>}</div>}
            
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
              LATEST_RELEASE,
              RELEASE_V75,
              RELEASE_V74,
              RELEASE_V73,
              {v:"v7.2",d:"03.03.2026",c:[
                "Angebotsmappe: Dokument-Auswahl per Modal statt zwei Buttons – Deckblatt, Angebot, Vertrag, AAB und Gefahrenanalyse frei kombinierbar",
                "Deckblatt Anlagen-Liste dynamisch: zeigt nur die tatsächlich gewählten Dokumente mit korrekter Nummerierung",
                "Planjahr-Dropdown: Vorgänge für das Folgejahr anlegen mit eigener Auftragsnummer-Serie",
                "Vorplanungs-Tab in Vorgänge-Übersicht für Folgejahr sichtbar",
                "Pauschalangebot: 0 € auf Spendenbasis mit Warnhinweis, Button im ausgeklappten Bereich",
                "Pauschalangebot-Fix Backend: pauschalAktiv-Flag wird korrekt ausgewertet (auch 0 € Pauschale möglich)",
                "Vorgänge-Liste: Zeigt Pauschalpreis statt berechneten Wert wenn Pauschale aktiv",
                "Angebot abgelehnt: Checklist-Button mit Grund-Popup (Zu teuer, Anderer Anbieter, etc.)",
                "Vorgänge-Liste: Akzeptanz-Spalte (❓/✔/✖), Durchstreichung bei Ablehnung, Summe ohne Abgelehnte",
                "BRK.id Callback: Fehlende Session-State löst automatischen Re-Login aus statt Fehlermeldung",
              ]},
              {v:"v7.1",d:"02.03.2026",c:[
                "Angebotsmappe: Professionelles Deckblatt mit Logo, Kreisverband, Bereitschaft, Veranstaltungsinfo und Inhaltsverzeichnis",
                "Angebotsmappe: Neue Reihenfolge – Deckblatt → Angebot → Vertrag → AAB → Gefahrenanalyse",
                "Angebotsmappe: Single-Render Architektur – alle Dokumente in einem PDF-Durchlauf (5x schneller)",
                "Angebot versendet: BRK-Design Bestätigungsmodal statt nativer Browser-Confirm",
                "Angebot versendet: Checklist bleibt vollständig editierbar bei gesperrtem Formular",
                "Angebot versendet: Race-Condition beim Lock-Save behoben (direkter API-Call statt Closure)",
                "Angebot PDF: Beauftragung mit Bezug-Zeile wenn auf Folgeseite (Auftragsnr + Veranstaltung)",
                "Vertrag: Ansprechpartner des Veranstalters wird angezeigt",
                "Vertrag: §4 erzwungener Seitenumbruch entfernt – natürlicher Textfluss",
                "Vertrag: Unterschriftenfelder auf gleicher Höhe, Veranstalter mit 2 Feldern (Unterschrift + Name)",
                "Vertrag: Fußzeile mit Name, KV und Adresse sichtbar gestaltet",
                "Alle PDFs: Kopfzeilen auf Folgeseiten mit Dokumenttyp + Auftragsnr",
                "Alle PDFs: Fußzeilen mit Dokumentenzugehörigkeit, Anlagen-Referenzen und Auftragsnr",
                "AAB: Leere zweite Seite durch redundanten Inline-Footer behoben",
                "PDF-Engine: Persistenter Chromium Browser-Pool – einmaliger Start statt 9x pro Request",
                "Entsperren: Setzt sowohl angebotVersendet als auch abgeschlossen zurück + Status auf Entwurf",
                "Sicherheit: BRK.id Token-Validierung – Session wird bei BRK.id Abmeldung ungültig",
                "Planjahr: Dropdown im Veranstaltungs-Tab – Vorgänge 1 Jahr im Voraus anlegen mit korrekter Nummerierung",
                "Vorgänge-Übersicht: Vorplanungs-Tab für Folgejahr sichtbar",
                "BRK.id Callback: Fehlende Session-State führt zu automatischem Re-Login statt Fehlermeldung",
              ]},
              {v:"v7.0",d:"27.02.2026",c:[
                "🎉 Major Release: Vollständiges Responsive Design für Smartphone und Tablet",
                "Hamburger-Menü: Slide-Drawer Navigation auf Mobile mit allen Tabs",
                "Header: Kompakte Darstellung auf Mobile (Logo + SanWD + Avatar)",
                "Formulare: Alle Grids automatisch einspaltig auf Smartphone, zweispaltig auf Tablet",
                "Vorgangsliste: Kompakte Tabelle auf Mobile (unwichtige Spalten ausgeblendet)",
                "PDF-Vorschau: Responsive Skalierung für alle Dokumententypen",
                "Stammdaten/Einstellungen: Optimiertes Layout für alle Bildschirmgrößen",
                "What's New Banner: Einmaliger Hinweis auf neue Version nach Login",
                "4-Augen-Prinzip: Anzeige von Veranstaltung nach Tage & Analyse verschoben",
                "4-Augen-Prinzip: Popup-Warnung wenn Prüfung durch höhere Stufe notwendig",
                "4-Augen-Prinzip: Pflicht-Begründung + Audit-Logging bei Übersteuerung",
                "4-Augen-Prinzip: KFDL → KFDL San in allen Planungsgrößen",
                "CSS Media Queries: Breakpoints bei 768px (Mobile) und 1024px (Tablet)",
              ]},
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
      {tab==="anfragen"&&<AnfragenTab user={user} toast={toast} bereitschaften={bereitschaften} onOpenVorgang={(id)=>{setCurrentEventId(id);API.json(`/api/vorgaenge/${year}?bc=ALL`).then(r=>{const v=r.find(v=>v.id===id);if(v){setEvent({...EMPTY_EVENT,...(v.event||{})});setDays(v.days||Array.from({length:8},(_,i)=>mkDay(i+1)));setTab("event");}}).catch(()=>setTab("events"));}}/>}

      {tab==="statistik"&&<StatistikDashboard user={user} year={year} toast={toast}/>}

      {tab==="profil"&&(<div style={{maxWidth:550}}>
            <Card title="👤 Mein Profil" accent={C.rot} sub="Persönliche Kontaktdaten (nur für Sie)">
              <div className="rg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
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
            <BereitschaftProfilCard stammdaten={stammdaten} updateStamm={updateStamm} user={user} toast={toast} bereitschaft={bereitschaft}/>
        </div>)}

      {tab==="einstellungen"&&user?.rolle==="admin"&&<EinstellungenTab stammdaten={stammdaten} updateStamm={updateStamm} updateRate={updateRate} user={user} toast={toast} klauseln={klauseln} klauselnEdit={klauselnEdit} setKlauselnEdit={setKlauselnEdit} klauselnSaving={klauselnSaving} saveKlauseln={saveKlauseln} bereitschaft={bereitschaft} reloadStammdaten={reloadStammdaten}/>}
      </main>
      {/* HAMBURGER DRAWER (mobile) */}
      {menuOpen&&<div className="drawer-overlay open" onClick={()=>setMenuOpen(false)}/>}
      <div className={`drawer${menuOpen?" open":""}`}>
        <div style={{padding:"16px 20px",borderBottom:`3px solid ${C.rot}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <BRKLogo size={28} customLogo={stammdaten.customLogo}/>
            <div><div style={{fontSize:14,fontWeight:700,color:C.schwarz}}>SanWD</div><div style={{fontSize:10,color:C.dunkelgrau}}>{bereitschaft.name}</div></div>
          </div>
          <button onClick={()=>setMenuOpen(false)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:C.dunkelgrau,lineHeight:1}}>✕</button>
        </div>
        <div style={{flex:1,overflowY:"auto",paddingTop:4}}>
          {TABS.filter(t=>!t.admin||user?.rolle==="admin").map(t=>(<button key={t.id} className={`drawer-item${tab===t.id?" active":""}`} onClick={()=>{if(t.id==="events"){releaseLock();setCurrentEventId(null);setEvent({...EMPTY_EVENT});setDays(Array.from({length:8},(_,j)=>mkDay(j+1)));}setTab(t.id);setMenuOpen(false);}}><span className="drawer-icon">{t.icon}</span>{t.label}{t.id==="anfragen"&&anfragenNeu>0&&<span style={{marginLeft:"auto",background:C.rot,color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:10,fontWeight:700,minWidth:16,textAlign:"center"}}>{anfragenNeu}</span>}</button>))}
        </div>
        <div style={{padding:"12px 20px",borderTop:`1px solid ${C.hellgrau}`}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <div style={{width:30,height:30,borderRadius:15,background:C.rot,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff"}}>{user.name.charAt(0)}</div>
            <div><div style={{fontSize:12,fontWeight:600}}>{user.name}</div><div style={{fontSize:10,color:C.dunkelgrau}}>{user.bereitschaft}{user.rolle==="admin"?" (Admin)":user.rolle==="bl"?" (BL)":""}</div></div>
          </div>
          <button onClick={()=>window.location.href="/auth/logout"} style={{width:"100%",padding:"8px 12px",background:C.hellgrau,border:"none",borderRadius:4,fontSize:12,cursor:"pointer",fontFamily:FONT.sans,color:C.dunkelgrau}}>⏻ Abmelden</button>
        </div>
      </div>
      <footer className="mob-hide" style={{padding:"12px 20px",borderTop:`1px solid ${C.mittelgrau}40`,textAlign:"center",fontSize:10,color:C.dunkelgrau,background:C.weiss}}>BRK Sanitätswachdienst v7.6 · {bereitschaft.name} · {stammdaten.kvName} · {year}</footer>

      {/* ── Angebotsmappe Modal ──────────────────────────────── */}
      {mailModal&&<MailComposeModal event={event} currentEventId={currentEventId} user={user} stammdaten={stammdaten} dayCalcs={dayCalcs} totalCosts={totalCosts} activeDays={activeDays} toast={toast} onClose={()=>setMailModal(false)} onSent={async(attachType)=>{
        const now=Date.now();const newCL={...(event.checklist||{})};
        if(attachType==="mappe"){newCL.angebotVersendet=newCL.angebotVersendet||now;newCL.vertragAabVersendet=newCL.vertragAabVersendet||now;}
        else if(attachType==="angebot"){newCL.angebotVersendet=newCL.angebotVersendet||now;}
        if(attachType==="mappe"||attachType==="angebot"){
          setEvent(p=>({...p,checklist:newCL}));
          try{const bc=BEREITSCHAFTEN[stammdaten.bereitschaftIdx]?.code;await API.saveVorgang(currentEventId,{id:currentEventId,event:{...event,checklist:newCL},days,year,updatedAt:now,activeDays:days.filter(d=>d.active).length,createdBy:user?.name,bereitschaftCode:bc});toast("Checkliste aktualisiert + Vorgang gesperrt","success");}catch(e){console.error("Checklist-Save:",e);}
        }
      }}/>}

      {mappeModal&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(3px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setMappeModal(false)}>
        <div style={{background:"#fff",borderRadius:10,padding:"24px 28px",maxWidth:420,width:"90%",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}} onClick={e=>e.stopPropagation()}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}><span style={{fontSize:24}}>📦</span><div><div style={{fontSize:16,fontWeight:700}}>Angebotsmappe erstellen</div><div style={{fontSize:11,color:C.dunkelgrau}}>Dokumente für die Mappe auswählen</div></div></div>
          {[{k:"deckblatt",l:"Deckblatt",d:"Titelseite mit Logo und Veranstaltungsinfo"},{k:"angebot",l:"Kostenaufstellung (Angebot)",d:"Kalkulation mit Beauftragung"},{k:"vertrag",l:"Vereinbarung (Vertrag)",d:"Vertrag über Sanitätswachdienst"},{k:"aab",l:"Allgemeine Auftragsbedingungen",d:"AAB Anlage"},{k:"gefahren",l:"Gefahrenanalyse",d:"Risikobeurteilung pro Einsatztag"}].map(doc=>(
            <label key={doc.k} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 10px",borderRadius:6,cursor:"pointer",background:mappeDocs[doc.k]?`${C.rot}08`:"transparent",border:`1px solid ${mappeDocs[doc.k]?C.rot+"40":"transparent"}`,marginBottom:4,transition:"all 0.15s"}}>
              <input type="checkbox" checked={mappeDocs[doc.k]} onChange={e=>setMappeDocs(p=>({...p,[doc.k]:e.target.checked}))} style={{marginTop:2,accentColor:C.rot}}/>
              <div><div style={{fontSize:13,fontWeight:600,color:C.schwarz}}>{doc.l}</div><div style={{fontSize:10,color:C.dunkelgrau}}>{doc.d}</div></div>
            </label>
          ))}
          <div style={{display:"flex",gap:8,marginTop:16,justifyContent:"flex-end"}}>
            <button onClick={()=>setMappeModal(false)} style={{padding:"8px 18px",background:C.hellgrau,border:"none",borderRadius:6,fontSize:13,cursor:"pointer",fontFamily:FONT.sans}}>Abbrechen</button>
            <button disabled={mappePending||!Object.values(mappeDocs).some(v=>v)} onClick={async()=>{setMappeModal(false);setMappePending(true);await saveEvent();try{const skip={};if(!mappeDocs.deckblatt)skip.skipDeckblatt=true;if(!mappeDocs.angebot)skip.skipAngebot=true;if(!mappeDocs.vertrag)skip.skipVertrag=true;if(!mappeDocs.aab)skip.skipAAB=true;if(!mappeDocs.gefahren)skip.skipGefahren=true;const blob=await API.generateMappePDF(currentEventId,dayCalcs,totalCosts,activeDays,Object.keys(skip).length?skip:undefined);const url=URL.createObjectURL(blob);const a=document.createElement("a");const nr=(event.auftragsnr||"").replace(/[^a-zA-Z0-9_-]/g,"_");const name=(event.name||"Veranstaltung").substring(0,30).replace(/ /g,"_");a.href=url;a.download=nr+"_"+name+"_Angebotsmappe.pdf";a.click();}catch(e){toast("Fehler: "+e.message,"error");}finally{setMappePending(false);}}} style={{padding:"8px 22px",background:C.rot,color:"#fff",border:"none",borderRadius:6,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:FONT.sans,opacity:mappePending||!Object.values(mappeDocs).some(v=>v)?0.5:1}}>{mappePending?"Erstelle...":"PDF erstellen"}</button>
          </div>
        </div>
      </div>}
      <FeedbackButton user={user} currentView={tab} toast={toast}/>
      <ToastContainer toasts={toasts} onDismiss={dismissToast}/>
      <ConfirmDialog open={!!confirmDlg} title={confirmDlg?.title} message={confirmDlg?.message} confirmLabel={confirmDlg?.confirmLabel} cancelLabel={confirmDlg?.cancelLabel} variant={confirmDlg?.variant} onConfirm={handleConfirm} onCancel={handleCancel}/>
      {sessionExpired&&<div style={{position:"fixed",top:0,left:0,right:0,zIndex:99999,background:"#c62828",color:"#fff",padding:"12px 20px",textAlign:"center",fontSize:14,fontWeight:600,fontFamily:FONT.sans,boxShadow:"0 2px 12px #0004",display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
        <span>⚠️ Ihre Sitzung ist abgelaufen.</span>
        <button onClick={()=>window.location.href="/auth/login"} style={{padding:"6px 18px",background:"#fff",color:"#c62828",border:"none",borderRadius:4,fontWeight:700,cursor:"pointer",fontSize:13,fontFamily:FONT.sans}}>Neu anmelden</button>
        <button onClick={()=>setSessionExpired(false)} style={{padding:"4px 10px",background:"transparent",color:"#fff",border:"1px solid #fff8",borderRadius:4,cursor:"pointer",fontSize:11,fontFamily:FONT.sans}}>Später</button>
      </div>}
      {showWhatsNew&&<WhatsNewBanner release={LATEST_RELEASE} onDismiss={dismissWhatsNew} onChangelog={()=>setTab("releases")}/>}
      {/* KOMPETENZ-OVERRIDE POPUP */}
      {showKompModal&&(()=>{const maxTP=Math.max(...dayCalcs.map(d=>d.tp),0);const auth=getSignAuthority(maxTP);const userMax=getUserMaxStufe(user?.rolle);return(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:10002,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT.sans}} onClick={()=>setShowKompModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.weiss,borderRadius:10,maxWidth:460,width:"92%",boxShadow:"0 8px 32px #0003",overflow:"hidden"}}>
            <div style={{background:"linear-gradient(135deg, #e65100, #bf360c)",padding:"18px 22px",color:"#fff"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:28}}>⚠️</span><div>
                <div style={{fontSize:16,fontWeight:800}}>Prüfung durch {auth.kontrolle} notwendig</div>
                <div style={{fontSize:11,opacity:0.85,marginTop:2}}>4-Augen-Prinzip · Stufe {auth.stufe}</div>
              </div></div>
            </div>
            <div style={{padding:"16px 22px"}}>
              <div style={{fontSize:13,color:C.dunkelgrau,lineHeight:1.6,marginBottom:12}}>
                Dieser Vorgang hat <strong>{maxTP} Stellen</strong> und erfordert Kontrolle durch <strong>{auth.kontrolle}</strong> (Stufe {auth.stufe}).
                Deine Rolle <strong>{user?.rolle?.toUpperCase()}</strong> deckt bis Stufe {userMax} ab.
              </div>
              <div style={{padding:"10px 14px",background:C.hellgrau,borderRadius:6,marginBottom:12,fontSize:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span>Erstellt durch:</span><strong>{auth.erstellt}</strong></div>
                <div style={{display:"flex",justifyContent:"space-between"}}><span>Kontrolle durch:</span><strong style={{color:"#e65100"}}>{auth.kontrolle}</strong></div>
              </div>
              <div style={{fontSize:12,fontWeight:600,color:C.dunkelgrau,marginBottom:6}}>Begründung (Pflichtfeld):</div>
              <textarea placeholder="z.B. Rücksprache mit KBL erfolgt, Genehmigung mündlich erteilt..." value={kompOverride.kommentar} onChange={e=>setKompOverride(p=>({...p,kommentar:e.target.value}))} rows={3} style={{width:"100%",padding:"8px 10px",border:"1px solid "+C.mittelgrau,borderRadius:4,fontSize:12,fontFamily:FONT.sans,boxSizing:"border-box",resize:"vertical"}}/>
            </div>
            <div style={{padding:"12px 22px 18px",display:"flex",justifyContent:"flex-end",gap:8,borderTop:"1px solid "+C.hellgrau}}>
              <Btn variant="secondary" onClick={()=>setShowKompModal(false)}>Abbrechen</Btn>
              <Btn variant="primary" disabled={kompOverride.kommentar.trim().length<5||kompOverride.saving} style={{background:kompOverride.kommentar.trim().length<5?"#ccc":"#e65100"}} onClick={async()=>{
                setKompOverride(p=>({...p,saving:true}));
                try{
                  await API.kompetenzOverride(currentEventId,{kommentar:kompOverride.kommentar.trim(),maxStellen:maxTP,erforderlicheStufe:auth.stufe,benutzerRolle:user?.rolle});
                  setKompOverride(p=>({...p,ack:true,saving:false}));
                  setShowKompModal(false);
                  toast("Kompetenz-Override bestätigt und im Audit gespeichert","success");
                }catch(e){toast(e.message,"error");setKompOverride(p=>({...p,saving:false}));}
              }}>{kompOverride.saving?"Speichert...":"☑ Zur Kenntnis genommen"}</Btn>
            </div>
          </div>
        </div>
      );})()}
    </div>
  );
}
