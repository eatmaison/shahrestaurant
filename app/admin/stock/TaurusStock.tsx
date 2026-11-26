"use client";

import { useEffect, useMemo, useState } from "react";
import type { StockItem } from "../../lib/stock";
import { parseTaurusRows, taurusName, type TaurusLine } from "../../lib/taurusStock";
import styles from "../admin.module.css";
import own from "./taurus.module.css";

type Trend = {day:string;name:string;units:number};
type Change = {id:string;name:string;before:number;after:number;units:number};
type Row = TaurusLine & {id:string;rev:number};
type Preview = {changes:Change[];duplicates:number};
const url="/api/admin/stock/taurus";
const copies = {
  en:{ title:"Taurus drink sales", help:"Export a single closed day from Management → Receipts → Settlement lines (Afrekenregels). Right-click the results and choose Export table to Excel.",
    safe:"Use the first day after your latest stock count. Only matched drinks are deducted. Ignore food, discounts and corrections; verify returns separately.",
    choose:"Choose Taurus .xlsx file", old:"Day to import", match:"Match to Stock product", skip:"Do not import", preview:"Preview deductions", apply:"Confirm stock deductions",
    before:"Before", after:"After", qty:"Sold", duplicates:"Previously imported lines skipped", done:"New receipt lines imported", omitted:"Corrections and discounts ignored",
    byDay:"Latest 7 days with imported sales", all:"All drinks",filter:"Filter daily sales by drink", top:"Top drinks · last 30 days", none:"No imported drink sales yet.", bad:"Could not read a single-day Taurus settlement export.",
    check:"Confirm that this day is not already reflected in your current stock.", confirm:"This export contains only Shah sales not already included in my stock counts.", no:"Choose one or more drinks to match.",
    failed:"Could not load or save the import.", conflict:"Stock or an imported receipt changed. Refresh Stock and preview again.", missing:"Taurus import database setup is pending.", short:"Not enough stock. Check your count before applying.",
    nothing:"No new matched sales to deduct."},
  nl:{ title:"Taurus drankverkopen", help:"Exporteer één afgesloten dag via Management → Bonnen → Afrekenregels. Klik met rechts op de resultaten en kies Export table to Excel.",
    safe:"Gebruik de eerste dag na je laatste voorraadtelling. Alleen gekoppelde dranken worden afgeboekt; controleer retouren apart.",
    choose:"Kies Taurus .xlsx-bestand", old:"Te importeren dag", match:"Koppel aan voorraadproduct", skip:"Niet importeren", preview:"Voorbeeld afboekingen", apply:"Bevestig afboekingen",
    before:"Voor", after:"Na", qty:"Verkocht", duplicates:"Eerder geïmporteerde regels overgeslagen", done:"Nieuwe bonregels geïmporteerd", omitted:"Correcties en kortingen genegeerd",
    byDay:"Laatste 7 dagen met geïmporteerde verkopen", all:"Alle dranken",filter:"Filter dagverkopen op drank", top:"Meest verkocht · afgelopen 30 dagen", none:"Nog geen geïmporteerde drankverkopen.", bad:"Kon geen Taurus-export voor één dag lezen.",
    check:"Controleer dat deze verkoopdag nog niet in de voorraad is verwerkt.", confirm:"Deze export bevat alleen Shah-verkopen die nog niet in mijn voorraad verwerkt zijn.", no:"Koppel ten minste één drank.",
    failed:"Import laden of opslaan mislukt.", conflict:"De voorraad of een bon is gewijzigd. Ververs de voorraad en open een nieuw voorbeeld.", missing:"Database voor Taurus-import is nog niet ingericht.", short:"Onvoldoende voorraad. Controleer je telling.",
    nothing:"Geen nieuwe gekoppelde verkopen om af te boeken."}
} as const;

export default function TaurusStock({items,lang,onSaved,disabled}:{items:StockItem[];lang:"nl"|"en";onSaved:()=>void;disabled:boolean}) {
  const c=copies[lang];
  const [lines,setLines]=useState<TaurusLine[]>([]), [ignored,setIgnored]=useState(0);
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
    setApproved(false);setPlan(null);setLines([]);setIgnored(0);setMsg("");setMap({});
    if(!file)return;
    setBusy(true);
    try{
      if(!/\.xlsx$/i.test(file.name)||file.size>2_000_000)throw Error("file");
      const read=(await import("read-excel-file")).default;
      const p=parseTaurusRows(await read(file));
      if(new Set(p.lines.map(l=>l.day)).size!==1)throw Error("day");
      setLines(p.lines);setIgnored(p.ignored);
    }catch{setMsg(c.bad);}finally{setBusy(false);}
  }
  async function request(mode:"preview"|"apply"){
    if(busy||disabled)return;
    const rows=mode==="apply"?plan?.rows:lines.flatMap(l=>{
      const key=taurusName(l.name), item=record.get(map[key]??saved[key]);
      return item?[{...l,id:item.id,rev:item.revision}]:[];
    });
    if(!rows?.length){setMsg(c.no);return;}
    if(mode==="apply"&&!approved){setMsg(c.check);return;}
    setBusy(true);setMsg("");
    try{
      const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode,rows})});
      const x=await r.json();
      if(!r.ok){setPlan(null);setApproved(false);setMsg(x.error==="conflict"?c.conflict:x.error==="migration_required"?c.missing:c.failed);return;}
      if(mode==="preview"){setPlan({summary:x,rows});setApproved(false);}
      else {setPlan(null);setApproved(false);setLines([]);setMap({});setMsg(`${c.done}: ${x.imported}`);setRefresh(n=>n+1);onSaved();}
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
    <p>{c.help}</p><p>{c.safe}</p>
    <label>{c.choose}<input type="file" accept=".xlsx" disabled={busy||disabled}
      onChange={e=>{void choose(e.target.files?.[0]);e.currentTarget.value="";}} /></label>
    {lines.length>0&&<>
      <p>{c.old}: <strong>{lines[0].day}</strong>{ignored>0&&` · ${c.omitted}: ${ignored}`}</p>
      <div className={own.mapping}>{groups.map(([key,g])=><label key={key}>
        <span>{g.name} <strong>×{g.qty}</strong></span>
        <select aria-label={`${c.match}: ${g.name}`} disabled={busy||disabled}
          value={record.has(map[key]??saved[key])?(map[key]??saved[key]):""}
          onChange={e=>{setMap(m=>({...m,[key]:e.target.value}));setPlan(null);setApproved(false);}}>
          <option value="">{c.skip}</option>
          {products.map(i=><option key={i.id} value={i.id}>{i.name} · {i.category}</option>)}
        </select>
      </label>)}</div>
      <button type="button" className={styles.button} disabled={busy||disabled} onClick={()=>void request("preview")}>{c.preview}</button>
    </>}
    {plan&&<div className={own.preview}>
      <p>{c.duplicates}: {plan.summary.duplicates}</p>
      {plan.summary.changes.length===0?<p>{c.nothing}</p>:<>
        <ul>{plan.summary.changes.map(x=><li key={x.id}><strong>{x.name}</strong> · {c.qty}: {x.units} · {c.before}: {x.before} → {c.after}: {x.after}</li>)}</ul>
        {plan.summary.changes.some(x=>x.after<0)?<p role="alert">{c.short}</p>:<>
          <label><input type="checkbox" checked={approved} disabled={busy||disabled} onChange={e=>setApproved(e.target.checked)}/> {c.confirm}</label>
          <button type="button" className={styles.button} disabled={!approved||busy||disabled} onClick={()=>void request("apply")}>{c.apply}</button>
        </>}
      </>}
    </div>}
    <p role="status">{msg}</p>
  </details>;
}
