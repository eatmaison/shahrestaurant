"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./admin.module.css";
import own from "./stock/taurus.module.css";

type Day={day:string;cents:number;receipts:number;adjustments:number};
type Product={name:string;group:string;cents:number;units:number};
type Report={daily:Day[];products:Product[];through:string};

export default function TaurusSales({nl}:{nl:boolean}) {
  const [open,setOpen]=useState(false), [days,setDays]=useState(30), [day,setDay]=useState("");
  const [data,setData]=useState<Report|null>(null), [error,setError]=useState(""), [busy,setBusy]=useState(false);
  const [group,setGroup]=useState(""), [search,setSearch]=useState(""), [expand,setExpand]=useState(false);
  useEffect(()=>{
    let active=true;
    const sync=()=>{if(active&&window.location.hash==="#taurus-sales")setOpen(true);};
    queueMicrotask(sync);
    window.addEventListener("hashchange",sync);
    return ()=>{active=false;window.removeEventListener("hashchange",sync);};
  },[]);
  useEffect(()=>{
    if(!open)return;
    const ctl=new AbortController();
    const q=new URLSearchParams({days:String(days)});
    if(day)q.set("day",day);
    fetch("/api/admin/stock/taurus/sales?"+q,{cache:"no-store",signal:ctl.signal})
      .then(async r=>{
        const x=await r.json();
        if(ctl.signal.aborted)return;
        if(r.ok){setData(x);setError("");}else{setData(null);setError(x.error);}
      })
      .catch(()=>{if(!ctl.signal.aborted){setData(null);setError("unavailable");}})
      .finally(()=>{if(!ctl.signal.aborted)setBusy(false);});
    return ()=>ctl.abort();
  },[open,days,day]);

  const currency=new Intl.NumberFormat(nl?"nl-NL":"en-NL",{style:"currency",currency:"EUR"});
  const money=(cents:number)=>currency.format(cents/100);
  const daily=data?.daily??[], products=data?.products??[];
  const receipts=daily.reduce((n,x)=>n+x.receipts,0), cents=daily.reduce((n,x)=>n+x.cents,0);
  const adjustments=daily.reduce((n,x)=>n+x.adjustments,0), max=Math.max(1,...daily.map(x=>Math.abs(x.cents)));
  const chart: {day:string; sale?:Day}[]=[];
  if(daily[0]){
    const date=new Date(daily[0].day+"T00:00:00Z"), through=data?.through??daily[daily.length-1].day;
    const byDay=new Map(daily.map(x=>[x.day,x]));
    const last=daily[daily.length-1].day>through?daily[daily.length-1].day:through;
    for(let key=date.toISOString().slice(0,10);key<=last&&chart.length<366;date.setUTCDate(date.getUTCDate()+1),key=date.toISOString().slice(0,10))
      chart.push({day:key,sale:byDay.get(key)});
  }
  const groups=[...new Set(products.map(x=>x.group).filter(Boolean))].sort();
  const visible=products.filter(x=>(!group||x.group===group)&&x.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));

  const itemMax=visible.reduce((n,x)=>Math.max(n,Math.abs(x.cents)),1);

  return <details id="taurus-sales" className={own.card} open={open} onToggle={e=>{setOpen(e.currentTarget.open);if(e.currentTarget.open&&data===null&&!error)setBusy(true);}}>
    <summary><strong>{nl?"Taurus kassaverkoop":"Taurus till sales"}</strong></summary>
    {open&&<>
      <p className={styles.muted}>{nl?"Alleen geïmporteerde kassabonnen. Dit is verkoopwaarde, geen winst. De cijfers staan los van online bestellingen om dubbeltelling te voorkomen.":"Imported till settlements only. This is sales value, not profit. It is kept separate from website orders to avoid counting the same sale twice."}</p>
      <p><Link href="/admin/stock">{nl?"Dagbestand importeren via Voorraad":"Import a day file from Stock"}</Link></p>
      <div className={styles.filters}>
        <label>{nl?"Periode":"Period"} <select value={days} onChange={e=>{setDays(Number(e.target.value));setDay("");setBusy(true);setGroup("");}}>
          {[7,30,90,365].map(n=><option key={n} value={n}>{n} {nl?"dagen":"days"}</option>)}
        </select></label>
      </div>
      {busy?<p role="status">{nl?"Kassaverkoop laden…":"Loading till sales…"}</p>:error?<p role="alert">{error==="migration_required"?(nl?"Taurus-verkoopdatabase is nog niet ingericht.":"Taurus sales database setup is pending."):(nl?"Kassaverkoop kon niet geladen worden.":"Could not load till sales.")}</p>:daily.length===0?<p>{nl?"Geen geëxporteerde dagen geïmporteerd in deze periode.":"No closed days have been imported in this period."}</p>:<>
        <dl className={styles.metrics}>
          <div className={styles.metric}><dt>{nl?"Totaal na correcties":"Total after adjustments"}</dt><dd>{money(cents)}</dd></div>
          <div className={styles.metric}><dt>{nl?"Kassabonnen":"Receipts"}</dt><dd>{receipts}</dd></div>
          <div className={styles.metric}><dt>{nl?"Kortingen en correcties":"Discounts and adjustments"}</dt><dd>{money(adjustments)}</dd></div>
        </dl>
        <h3>{nl?"Verkoop per dag":"Daily sales"}</h3>
        <div className={own.chart} tabIndex={0} role="region" aria-label={nl?"Verkoop per dag":"Daily sales"}>
          <ul className={own.bars}>
            {chart.slice().reverse().map(({day:key,sale:x})=><li key={key}>
              <span>{key}{x&&(" · "+x.receipts+" "+(nl?"bonnen":"receipts"))}</span>
              <strong>{x?money(x.cents):nl?"Niet geïmporteerd":"Not imported"}</strong>
              {x&&<div className={own.track} aria-hidden="true"><div className={x.cents<0?own.negative:undefined} style={{width:100*Math.abs(x.cents)/max+"%"}}/></div>}
            </li>)}
          </ul>
        </div>
        <h3>{nl?"Eten en drinken per artikel":"Food and drinks by item"}</h3>
        <p className={styles.muted}>{nl?"Artikelbedragen vóór losse boncorrecties. Ontbrekende dagen zijn niet hetzelfde als €0.":"Item amounts exclude separate receipt adjustments. A missing day does not mean €0."}</p>
        <div className={styles.filters}>
          <label>{nl?"Verkoopdag":"Sales day"} <select value={day} onChange={e=>{setDay(e.target.value);setBusy(true);setGroup("");}}>
            <option value="">{nl?"Hele periode":"Full period"}</option>
            {daily.slice().reverse().map(x=><option key={x.day} value={x.day}>{x.day}</option>)}
          </select></label>
          <label>{nl?"Kassagroep":"Till group"} <select value={group} onChange={e=>{setGroup(e.target.value);setExpand(false);}}>
            <option value="">{nl?"Alle groepen":"All groups"}</option>
            {groups.map(g=><option key={g} value={g}>{g}</option>)}
          </select></label>
          <label>{nl?"Zoek artikel":"Find item"} <input type="search" value={search} onChange={e=>{setSearch(e.target.value);setExpand(false);}}/></label>
        </div>
        {!visible.length?<p>{nl?"Geen artikelen voor dit filter.":"No items match this filter."}</p>:<div className={styles.tableScroll} tabIndex={0} role="region" aria-label={nl?"Verkoopartikelen":"Item sales"}>
          <table className={styles.dataTable}><thead><tr><th scope="col">{nl?"Artikel":"Item"}</th><th scope="col">{nl?"Kassagroep":"Till group"}</th><th scope="col">{nl?"Aantal":"Units"}</th><th scope="col">{nl?"Bedrag":"Amount"}</th></tr></thead>
            <tbody>{visible.slice(0,expand?undefined:12).map(x=><tr key={JSON.stringify([x.name,x.group])}><th scope="row">{x.name}</th><td>{x.group||"–"}</td><td>{x.units}</td><td><strong>{money(x.cents)}</strong><div className={own.itemTrack} aria-hidden="true">
                <div className={x.cents<0?own.negative:undefined} style={{width:100*Math.abs(x.cents)/itemMax+"%"}}/>
              </div></td></tr>)}</tbody>
          </table>
        </div>}
        {visible.length>12&&<button type="button" className={styles.button} onClick={()=>setExpand(!expand)}>{expand?(nl?"Top 12":"Top 12"):(nl?"Toon alle artikelen":"Show all items")+" ("+visible.length+")"}</button>}
      </>}
    </>}
  </details>;
}
