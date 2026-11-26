"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./admin.module.css";
import own from "./stock/taurus.module.css";

type Day={day:string;cents:number;receipts:number;adjustments:number};
type Product={name:string;group:string;cents:number;units:number};
type Report={daily:Day[];products:Product[];through:string};

export default function TaurusSales({nl}:{nl:boolean}) {
  const [open,setOpen]=useState(true), [days,setDays]=useState(30), [day,setDay]=useState("");
  const [data,setData]=useState<Report|null>(null), [error,setError]=useState(""), [busy,setBusy]=useState(true);
  const [group,setGroup]=useState<string|null>(null), [search,setSearch]=useState(""), [expand,setExpand]=useState(false), [rank,setRank]=useState<"cents"|"units">("cents");
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
  const totalsByGroup=new Map<string,{cents:number;units:number}>();
  for(const product of products){
    const total=totalsByGroup.get(product.group)??{cents:0,units:0};
    total.cents+=product.cents;
    total.units+=product.units;
    totalsByGroup.set(product.group,total);
  }
  const breakdown=[...totalsByGroup].sort((a,b)=>b[1].cents-a[1].cents||a[0].localeCompare(b[0]));
  const groups=[...totalsByGroup.keys()].sort();
  const groupName=(key:string)=>key||(nl?"Zonder kassagroep":"No till group");
  const visible=products.filter(x=>(group===null||x.group===group)&&x.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())).sort((a,b)=>b[rank]-a[rank]||a.name.localeCompare(b.name));
  const recent=chart.slice(-30);
  const barMax=Math.max(1,...recent.map(x=>Math.abs(x.sale?.cents??0)));
  const dayState=(key:string)=>new Date(key+"T00:00:00Z").getUTCDay()===1?(nl?"Normaal gesloten":"Normally closed"):nl?"Niet geïmporteerd":"Not imported";
  const dateLabel=new Intl.DateTimeFormat(nl?"nl-NL":"en-GB",{day:"numeric",month:"short",timeZone:"UTC"});
  function selectDay(key:string){
    if(key===day)return;
    setDay(key);setBusy(true);setGroup(null);setExpand(false);
  }

  const itemMax=visible.reduce((n,x)=>Math.max(n,Math.abs(x.cents)),1);

  return <details id="taurus-sales" className={own.card} open={open} onToggle={e=>{setOpen(e.currentTarget.open);if(e.currentTarget.open&&data===null&&!error)setBusy(true);}}>
    <summary><strong>{nl?"Taurus kassaverkoop":"Taurus till sales"}</strong></summary>
    {open&&<>
      <p className={styles.muted}>{nl?"Alleen geïmporteerde kassabonnen. Dit is verkoopwaarde, geen winst. De cijfers staan los van online bestellingen om dubbeltelling te voorkomen.":"Imported till settlements only. This is sales value, not profit. It is kept separate from website orders to avoid counting the same sale twice."}</p>
      <p><Link href="/admin/stock">{nl?"Dagbestand importeren via Voorraad":"Import a day file from Stock"}</Link></p>
      <div className={styles.filters}>
        <label>{nl?"Periode":"Period"} <select value={days} onChange={e=>{setDays(Number(e.target.value));setDay("");setBusy(true);setGroup(null);}}>
          {[7,30,90,365].map(n=><option key={n} value={n}>{n} {nl?"dagen":"days"}</option>)}
        </select></label>
      </div>
      {busy&&<p role="status">{nl?"Kassaverkoop laden…":"Loading till sales…"}</p>}
      {error?<p role="alert">{error==="migration_required"?(nl?"Taurus-verkoopdatabase is nog niet ingericht.":"Taurus sales database setup is pending."):(nl?"Kassaverkoop kon niet geladen worden.":"Could not load till sales.")}</p>:daily.length===0?(!busy&&<p>{nl?"Geen geëxporteerde dagen geïmporteerd in deze periode.":"No closed days have been imported in this period."}</p>):<>
        <dl className={styles.metrics}>
          <div className={styles.metric}><dt>{nl?"Totaal na correcties":"Total after adjustments"}</dt><dd>{money(cents)}</dd></div>
          <div className={styles.metric}><dt>{nl?"Kassabonnen":"Receipts"}</dt><dd>{receipts}</dd></div>
          <div className={styles.metric}><dt>{nl?"Gemiddelde bonwaarde":"Average per receipt"}</dt><dd>{receipts?money(Math.round(cents/receipts)):"–"}</dd></div>
          <div className={styles.metric}><dt>{nl?"Kortingen en correcties":"Discounts and adjustments"}</dt><dd>{money(adjustments)}</dd></div>
        </dl>
        <h3>{nl?"Kassaomzet per dag":"Daily till sales"}</h3>
        <p className={styles.muted}>{daily.length} {nl?"dagen geïmporteerd. Selecteer een balk om de artikelen van die dag te zien.":"days imported. Select a bar to see that day's items."} {chart.length>30&&(nl?"Grafiek: laatste 30 dagen; volledige periode in de daglijst.":"Chart: latest 30 days; full period in the day list.")}</p>
        <div className={own.columns} role="region" aria-label={nl?"Grafiek kassaomzet":"Till sales chart"} tabIndex={0}>
          {recent.map(({day:key,sale:x})=>{
            const label=dateLabel.format(new Date(key+"T00:00:00Z"));
            const hint=key+" · "+(x?money(x.cents):dayState(key));
            return <div key={key} className={own.column}>
              {x?<button type="button" title={hint} aria-label={hint} aria-pressed={day===key} onClick={()=>selectDay(day===key?"":key)}>
                <span className={x.cents<0?own.negative:undefined} style={{height:Math.max(3,Math.abs(x.cents)/barMax*100)+"%"}}/>
              </button>:<span className={own.missingDay} title={hint} role="img" aria-label={hint}>·</span>}
              <span className={own.dateTick}>{label}</span>
            </div>;
          })}
        </div>
        <div className={own.chart} tabIndex={0} role="region" aria-label={nl?"Verkoop per dag":"Daily sales"}>
          <ul className={own.bars}>
            {chart.slice().reverse().map(({day:key,sale:x})=><li key={key}>
              <span>{key}{x&&(" · "+x.receipts+" "+(nl?"bonnen":"receipts"))}</span>
              <strong>{x?money(x.cents):dayState(key)}</strong>
              {x&&<div className={own.track} aria-hidden="true"><div className={x.cents<0?own.negative:undefined} style={{width:100*Math.abs(x.cents)/max+"%"}}/></div>}
            </li>)}
          </ul>
        </div>
        <h3>{nl?"Eten en drinken per artikel":"Food and drinks by item"}</h3>
        <p className={styles.muted}>{nl?"Artikelbedragen vóór losse boncorrecties. Ontbrekende dagen zijn niet hetzelfde als €0.":"Item amounts exclude separate receipt adjustments. A missing day does not mean €0."}</p>
        <p className={styles.muted}>{day?(nl?"Artikelen op ":"Items on ")+day:nl?"Artikelen voor de hele periode":"Items for the full period"}</p>
        {!busy&&breakdown.length>0&&<details className={own.breakdown}>
          <summary>{nl?"Omzet per kassagroep":"Sales by till group"} · {breakdown.length}</summary>
          <ul className={own.bars}>{breakdown.map(([key,total])=><li key={key}><span>{groupName(key)} · {total.units} {nl?"stuks":"units"}</span><strong>{money(total.cents)}</strong></li>)}</ul>
        </details>}
        <div className={styles.filters}>
          <label>{nl?"Verkoopdag":"Sales day"} <select value={day} onChange={e=>selectDay(e.target.value)}>
            <option value="">{nl?"Hele periode":"Full period"}</option>
            {daily.slice().reverse().map(x=><option key={x.day} value={x.day}>{x.day}</option>)}
          </select></label>
          <label>{nl?"Kassagroep":"Till group"} <select value={group===null?"":"group:"+group} onChange={e=>{setGroup(e.target.value?e.target.value.slice(6):null);setExpand(false);}}>
            <option value="">{nl?"Alle groepen":"All groups"}</option>
            {groups.map(g=><option key={g} value={"group:"+g}>{groupName(g)}</option>)}
          </select></label>
          <label>{nl?"Rangschik op":"Rank by"} <select value={rank} onChange={e=>{setRank(e.target.value==="units"?"units":"cents");setExpand(false);}}>
            <option value="cents">{nl?"Bedrag":"Amount"}</option><option value="units">{nl?"Aantal":"Units"}</option>
          </select></label>
          <label>{nl?"Zoek artikel":"Find item"} <input type="search" value={search} onChange={e=>{setSearch(e.target.value);setExpand(false);}}/></label>
        </div>
        {!busy&&(!visible.length?<p>{nl?"Geen artikelen voor dit filter.":"No items match this filter."}</p>:<div className={styles.tableScroll} tabIndex={0} role="region" aria-label={nl?"Verkoopartikelen":"Item sales"}>
          <table className={styles.dataTable}><thead><tr><th scope="col">{nl?"Artikel":"Item"}</th><th scope="col">{nl?"Kassagroep":"Till group"}</th><th scope="col">{nl?"Aantal":"Units"}</th><th scope="col">{nl?"Bedrag":"Amount"}</th></tr></thead>
            <tbody>{visible.slice(0,expand?undefined:12).map(x=><tr key={JSON.stringify([x.name,x.group])}><th scope="row">{x.name}</th><td>{x.group||"–"}</td><td>{x.units}</td><td><strong>{money(x.cents)}</strong><div className={own.itemTrack} aria-hidden="true">
                <div className={x.cents<0?own.negative:undefined} style={{width:100*Math.abs(x.cents)/itemMax+"%"}}/>
              </div></td></tr>)}</tbody>
          </table>
        </div>)}
        {!busy&&visible.length>12&&<button type="button" className={styles.button} onClick={()=>setExpand(!expand)}>{expand?(nl?"Top 12":"Top 12"):(nl?"Toon alle artikelen":"Show all items")+" ("+visible.length+")"}</button>}
      </>}
    </>}
  </details>;
}
