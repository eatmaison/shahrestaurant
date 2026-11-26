"use client";

import { useEffect, useMemo, useState } from "react";
import type { StockItem } from "../../lib/stock";
import { parseTaurusSales, stockEligible, taurusName, type TaurusLine, type TaurusSaleLine } from "../../lib/taurusStock";
import styles from "../admin.module.css";
import own from "./taurus.module.css";

type Trend = {day:string;name:string;units:number};
type Change = {id:string;name:string;before:number;after:number;units:number};
type Row = TaurusLine & {id:string;rev:number};
type Preview = {changes:Change[];duplicates:number;saleSummary:{cents:number;receipts:number;lines:number;duplicates:number}};
const url="/api/admin/stock/taurus";
const copies = {
  en:{ title:"Import Taurus sales", help:"Export a single closed day from Management → Receipts → Settlement lines (Afrekenregels). Right-click the results and choose Export table to Excel.",
    safe:"Use a Shah-only export. All items count for sales; only mapped drinks are deducted. For an earlier day already in your stock count, use Sales only.",
    choose:"Choose Taurus .xlsx file", old:"Day to import", match:"Match to Stock product", skip:"Sales only · no deduction", preview:"Preview import", apply:"Confirm import",
    before:"Before", after:"After", qty:"Sold", duplicates:"Previously imported lines skipped", done:"New receipt lines imported", omitted:"Corrections and discounts ignored",
    byDay:"Latest 7 days with imported sales", all:"All drinks",filter:"Filter daily sales by drink", top:"Top drinks · last 30 days", none:"No imported drink sales yet.", bad:"Use one closed day from Taurus Afrekenregels. The file must contain the Bedrag column and matching Totaal row.",
    check:"Confirm that this day is not already reflected in your current stock.", confirm:"This file contains only Shah sales. Any proposed deductions are not already in the stock counts.", no:"Choose one or more drinks to match.",
    failed:"Could not load or save the import.", conflict:"Stock or an imported receipt changed. Refresh Stock and preview again.", missing:"Taurus import database setup is pending.", short:"Not enough stock. Check your count before applying.",
    nothing:"No new matched sales to deduct."},
  nl:{ title:"Taurus-verkopen importeren", help:"Exporteer één afgesloten dag via Management → Bonnen → Afrekenregels. Klik met rechts op de resultaten en kies Export table to Excel.",
    safe:"Gebruik een export met alleen Shah-verkopen. Alle artikelen tellen mee voor verkoop; alleen gekoppelde dranken worden afgeboekt. Kies Alleen verkoop als de dag al in je telling zit.",
    choose:"Kies Taurus .xlsx-bestand", old:"Te importeren dag", match:"Koppel aan voorraadproduct", skip:"Alleen verkoop · geen afboeking", preview:"Voorbeeld import", apply:"Bevestig import",
    before:"Voor", after:"Na", qty:"Verkocht", duplicates:"Eerder geïmporteerde regels overgeslagen", done:"Nieuwe bonregels geïmporteerd", omitted:"Correcties en kortingen genegeerd",
    byDay:"Laatste 7 dagen met geïmporteerde verkopen", all:"Alle dranken",filter:"Filter dagverkopen op drank", top:"Meest verkocht · afgelopen 30 dagen", none:"Nog geen geïmporteerde drankverkopen.", bad:"Gebruik één afgesloten dag uit Taurus Afrekenregels met de kolom Bedrag en een kloppende Totaal-regel.",
    check:"Controleer dat deze verkoopdag nog niet in de voorraad is verwerkt.", confirm:"Dit bestand bevat alleen Shah-verkopen. De voorgestelde afboekingen zijn nog niet in de voorraad verwerkt.", no:"Koppel ten minste één drank.",
    failed:"Import laden of opslaan mislukt.", conflict:"De voorraad of een bon is gewijzigd. Ververs de voorraad en open een nieuw voorbeeld.", missing:"Database voor Taurus-import is nog niet ingericht.", short:"Onvoldoende voorraad. Controleer je telling.",
    nothing:"Geen nieuwe gekoppelde verkopen om af te boeken."}
} as const;

export default function TaurusStock({items,lang,onSaved,disabled}:{items:StockItem[];lang:"nl"|"en";onSaved:()=>void;disabled:boolean}) {
  const c=copies[lang];
  const nl=lang==="nl";
  const [batch,setBatch]=useState<{lines:TaurusSaleLine[];footerCents:number}|null>(null);
  const [salesOnly,setSalesOnly]=useState(false);
  const lines=useMemo(()=>batch?.lines.filter(stockEligible)??[],[batch]);
  const formatMoney=(cents:number)=>new Intl.NumberFormat(nl?"nl-NL":"en-NL",{style:"currency",currency:"EUR"}).format(cents/100);
  const [saved,setSaved]=useState<Record<string,string>>({}), [map,setMap]=useState<Record<string,string>>({});
  const [stats,setStats]=useState<Trend[]>([]), [approved,setApproved]=useState(false);
  const [plan,setPlan]=useState<{summary:Preview;rows:Row[]}|null>(null), [msg,setMsg]=useState("");
  const [busy,setBusy]=useState(false),[refresh,setRefresh]=useState(0), [drink,setDrink]=useState("");
  useEffect(()=>{
    const a=new AbortController();
    fetch(url,{cache:"no-store",signal:a.signal}).then(async r=>{
      const x=await r.json();
      if(r.ok){setStats(x.stats);setSaved(Object.fromEntries((x.mappings as {name:string;id:string}[]).map(y=>[y.name,y.id])));}
      else setMsg(x.error==="migration_required"?c.missing:c.failed);
    }).catch(()=>{if(!a.signal.aborted)setMsg(c.failed);});
    return ()=>a.abort();
  },[refresh,c]);
  const products=useMemo(()=>items.filter(i=>!i.archived).sort((a,b)=>a.name.localeCompare(b.name)),[items]);
  const record=useMemo(()=>new Map(products.map(x=>[x.id,x])),[products]);
  const groups=useMemo(()=>{
    const g=new Map<string,{name:string;qty:number}>();
    for(const l of lines){
      const k=taurusName(l.name);
      g.set(k,{name:l.name,qty:(g.get(k)?.qty??0)+l.qty});
    }
    return Array.from(g).sort((a,b)=>a[1].name.localeCompare(b[1].name));
  },[lines]);
  const soldItems=useMemo(()=>new Set(batch?.lines.filter(l=>!l.adjustment).map(l=>taurusName(l.name))),[batch]);
  const mappedCount=salesOnly?0:groups.filter(([key])=>record.has(map[key]??saved[key])).length;
  const agg=(key:"day"|"name")=>{
    const m=new Map<string,number>();
    for(const x of stats)if(key!=="day"||!drink||x.name===drink)m.set(x[key],(m.get(x[key])??0)+x.units);
    return Array.from(m);
  };
  const bars=(data:[string,number][])=>{
    const max=Math.max(1,...data.map(x=>x[1]));
    return <ul className={own.bars}>{data.map(([key,n])=><li key={key}><span>{key}</span><strong>{n}</strong><div aria-hidden="true" className={own.track}><div style={{width:`${n/max*100}%`}} /></div></li>)}</ul>;
  };
  async function choose(file?:File) {
    setApproved(false);setPlan(null);setBatch(null);setSalesOnly(false);setMsg("");setMap({});
    if(!file)return;
    setBusy(true);
    try{
      if(!/\.xlsx$/i.test(file.name)||file.size>2_000_000)throw Error("file");
      const read=(await import("read-excel-file")).default;
      setBatch(parseTaurusSales(await read(file)));
    }catch{setMsg(c.bad);}finally{setBusy(false);}
  }
  async function request(mode:"preview"|"apply"){
    if(busy||disabled||!batch)return;
    const rows=mode==="apply"?plan?.rows:salesOnly?[]:lines.flatMap(l=>{
      const key=taurusName(l.name), item=record.get(map[key]??saved[key]);
      return item?[{day:l.day,receipt:l.receipt,line:l.line,name:l.name,qty:l.qty,id:item.id,rev:item.revision}]:[];
    });
    if(!rows)return;
    if(mode==="apply"&&!approved){setMsg(c.check);return;}
    setBusy(true);setMsg("");
    try{
      const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode,rows,sales:batch,...(mode==="apply"?{confirmed:true}:{})})});
      const x=await r.json();
      if(!r.ok){setPlan(null);setApproved(false);setMsg(x.error==="sales_conflict"?(nl?"Een eerder geïmporteerde bonregel heeft andere verkoopgegevens. Er is niets gewijzigd.":"An imported receipt line has different sales data. Nothing changed."):x.error==="conflict"?c.conflict:x.error==="migration_required"?c.missing:c.failed);return;}
      if(mode==="preview"){setPlan({summary:x,rows});setApproved(false);}
      else {setPlan(null);setApproved(false);setBatch(null);setMap({});setMsg((nl?"Verkoopregels opgeslagen: ":"Sales lines saved: ")+x.salesImported+(nl?" · voorraadregels: ":" · stock lines: ")+x.imported);setRefresh(n=>n+1);onSaved();}
    }catch{setMsg(c.failed);}finally{setBusy(false);}
  }
  return <details className={own.card}>
    <summary><strong>{c.title}</strong></summary>
    {stats.length>0?<div className={own.stats}>
      <div><strong>{c.byDay}</strong>
        <select aria-label={c.filter} value={drink} onChange={e=>setDrink(e.target.value)}>
          <option value="">{c.all}</option>
          {agg("name").sort((a,b)=>a[0].localeCompare(b[0])).map(([name])=><option key={name}>{name}</option>)}
        </select>{bars(agg("day").sort((a,b)=>b[0].localeCompare(a[0])).slice(0,7))}</div>
      <div><strong>{c.top}</strong>{bars(agg("name").sort((a,b)=>b[1]-a[1]).slice(0,8))}</div>
    </div>:<p>{c.none}</p>}
    <p>{c.help}</p><p>{c.safe}</p><p><a href="/admin/stats#taurus-sales">{nl?"Bekijk Taurus-verkoopstatistieken":"View Taurus sales statistics"}</a></p>
    <label>{c.choose}<input type="file" accept=".xlsx" disabled={busy||disabled}
      onChange={e=>{void choose(e.target.files?.[0]);e.currentTarget.value="";}} /></label>
    {batch&&<>
      <p>{c.old}: <strong>{batch.lines[0].day}</strong> · {formatMoney(batch.footerCents)} · {batch.lines.length} {nl?"bonregels":"receipt lines"}</p>
      <label><input type="checkbox" checked={salesOnly} disabled={busy||disabled} onChange={e=>{setSalesOnly(e.target.checked);setPlan(null);setApproved(false);}}/> {nl?"Alleen verkoop, voorraad niet aanpassen":"Sales only, keep stock unchanged"}</label>
      <div className={own.legend} aria-live="polite">
        <span className={own.linkedBadge}>{nl?"Voorraad gekoppeld":"Linked to stock"} · {mappedCount}</span>
        <span className={own.salesBadge}>{nl?"Alleen verkoopstatistiek":"Sales statistics only"} · {soldItems.size-mappedCount}</span>
      </div>
      {!salesOnly&&<>
        <p>{nl?"Controleer de kassanaam en het gekoppelde voorraadproduct eronder. Niet-gekoppelde artikelen behouden hun kassanaam in Statistieken.":"Check the till name against the stock product shown below it. Unlinked items keep their till name in Stats."}</p>
        <div className={own.mapping}>{groups.map(([key,g])=>{
          const item=record.get(map[key]??saved[key]);
          return <label key={key} className={item?own.linkedCard:own.salesCard}>
            <span className={own.rowTitle}><strong>{g.name}</strong><span>×{g.qty}</span></span>
            <span className={item?own.linkedBadge:own.salesBadge}>{item?(nl?"Gekoppeld: ":"Linked: ")+item.name:nl?"Alleen verkoopstatistiek":"Sales statistics only"}</span>
            <select aria-label={`${c.match}: ${g.name}`} disabled={busy||disabled}
              value={item?.id??""}
              onChange={e=>{setMap(m=>({...m,[key]:e.target.value}));setPlan(null);setApproved(false);}}>
              <option value="">{c.skip}</option>
              {products.map(i=><option key={i.id} value={i.id}>{i.name} · {i.category}</option>)}
            </select>
          </label>;
        })}</div>
      </>}
      {salesOnly&&<p>{nl?"Alle artikelen worden opgeslagen voor statistieken. De voorraad verandert niet.":"All items are recorded for statistics. Stock will not change."}</p>}
      <button type="button" className={styles.button} disabled={busy||disabled} onClick={()=>void request("preview")}>{c.preview}</button>
    </>}
    {plan&&<div className={own.preview}>
      <p><strong>{formatMoney(plan.summary.saleSummary.cents)}</strong> · {plan.summary.saleSummary.receipts} {nl?"bonnen":"receipts"} · {plan.summary.saleSummary.duplicates} {nl?"eerder opgeslagen verkoopregels":"sales lines already recorded"}</p>
      <p>{nl?"Nieuwe verkoopregels":"New sales lines"}: <strong>{plan.summary.saleSummary.lines-plan.summary.saleSummary.duplicates}</strong> · {c.duplicates} ({nl?"voorraad":"stock"}): {plan.summary.duplicates}</p>
      {plan.summary.changes.length===0?<p>{c.nothing}</p>:<ul>{plan.summary.changes.map(x=><li key={x.id}><strong>{x.name}</strong> · {c.qty}: {x.units} · {c.before}: {x.before} → {c.after}: {x.after}</li>)}</ul>}
      {plan.summary.changes.some(x=>x.after<0)?<p role="alert">{c.short}</p>:<>
        <label><input type="checkbox" checked={approved} disabled={busy||disabled} onChange={e=>setApproved(e.target.checked)}/> {c.confirm}</label>
        <button type="button" className={styles.button} disabled={!approved||busy||disabled} onClick={()=>void request("apply")}>{c.apply}</button>
      </>}
    </div>}
    <p role="status">{msg}</p>
  </details>;
}
