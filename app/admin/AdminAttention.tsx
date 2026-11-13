"use client";
import { useLang,useStore } from "../providers";
import { makeRangeCheck } from "../lib/adminMetrics";
import { absoluteTime } from "./adminFormat";
import styles from "./admin.module.css";
export function AdminAttention(){
  const {lang}=useLang(),nl=lang==="nl",{orders,reservations,vipRequests,dataUpdatedAt}=useStore();
  const today=makeRangeCheck({preset:"today"},dataUpdatedAt||1);
  const failed=orders.filter(order=>!order.paid&&order.accountType==="personal"&&["failed","canceled","expired"].includes(order.paymentStatus||"")&&today(order.createdAt));
  const pending=reservations.filter(item=>item.status==="pending"),vip=vipRequests.filter(item=>item.status==="pending");
  const oldest=pending.map(item=>item.createdAt).filter(value=>Number.isFinite(value)&&value>0&&value<=dataUpdatedAt).sort((a,b)=>a-b)[0];
  if(!failed.length&&!pending.length&&!vip.length)return <p role="status" className={styles.notice}>{nl?"Geen open taken in deze drie controles. Dit is geen volledige controle van alle bedrijfsprocessen.":"No open tasks in these three checks. This is not a complete audit of every business process."}</p>;
  return <section className={styles.notice} aria-labelledby="attention-title"><h2 id="attention-title" className={styles.resultHeading}>{nl?"Volgende controles":"Next checks"}</h2><div className={styles.actions}>{failed.length>0&&<a className={styles.button} href="#workspace-orders">{failed.length} {nl?"mislukte/geannuleerde betaalpogingen vandaag":"failed/cancelled payment attempts today"}</a>}{pending.length>0&&<a className={styles.button} href="#workspace-reservations">{pending.length} {nl?"reserveringen in afwachting":"pending reservations"}</a>}{vip.length>0&&<a className={styles.button} href="#workspace-vip">{vip.length} {nl?"VIP-aanvragen":"VIP requests"}</a>}</div>{oldest&&<p className={`${styles.muted} mt-3`}>{nl?"Oudste geladen reserveringsaanvraag":"Oldest loaded reservation request"}: {absoluteTime(oldest,lang)}</p>}<p className={styles.muted}>{nl?"Controleer de actuele status vóór u betalingen of reserveringen wijzigt. Er is geen automatische afhandeling.":"Check the current status before changing payments or reservations. Nothing is processed automatically."}</p></section>;
}
