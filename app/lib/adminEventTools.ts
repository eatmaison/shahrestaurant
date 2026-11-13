import type { PartyEvent } from "./partyTypes";
import { safeImageUrl, searchText } from "./adminList";
export type EventDraft = Pick<PartyEvent,"slug"|"title"|"description"|"event_date"|"start_time"|"end_time"|"price_cents"|"capacity"|"image"|"status"|"published"> & { id?: string };
export const emptyEventDraft = (image: string): EventDraft => ({ slug:"",title:"",description:"",event_date:"",start_time:"22:00",end_time:"03:00",price_cents:1699,capacity:100,image,status:"active",published:false });
export function eventSlug(title: string) { return searchText(title).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,100).replace(/-$/g,""); }
export function eventDraftErrors(draft: EventDraft, events: readonly PartyEvent[]) {
  const errors: {field:string;code:string}[]=[];
  if(draft.title.trim().length<3||draft.title.trim().length>120)errors.push({field:"title",code:"title"});
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug)||draft.slug.length<3||draft.slug.length>100)errors.push({field:"slug",code:"slug"});
  else if(events.some(event=>event.id!==draft.id&&event.slug===draft.slug))errors.push({field:"slug",code:"duplicateSlug"});
  if(draft.description.trim().length<10||draft.description.length>4000)errors.push({field:"description",code:"description"});
  const date=new Date(draft.event_date+"T12:00:00Z");
  if(!/^\d{4}-\d{2}-\d{2}$/.test(draft.event_date)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==draft.event_date)errors.push({field:"event_date",code:"date"});
  const time=/^([01]\d|2[0-3]):[0-5]\d$/;
  if(!time.test(draft.start_time))errors.push({field:"start_time",code:"time"});
  if(!time.test(draft.end_time))errors.push({field:"end_time",code:"time"});
  if(draft.start_time===draft.end_time)errors.push({field:"end_time",code:"sameTime"});
  if(!Number.isSafeInteger(draft.price_cents)||draft.price_cents<100||draft.price_cents>100000)errors.push({field:"price_cents",code:"price"});
  if(!Number.isSafeInteger(draft.capacity)||draft.capacity<1||draft.capacity>10000)errors.push({field:"capacity",code:"capacity"});
  else if(draft.capacity<(events.find(event=>event.id===draft.id)?.tickets_sold||0))errors.push({field:"capacity",code:"soldCapacity"});
  if(!["active","sold_out","cancelled"].includes(draft.status))errors.push({field:"status",code:"status"});
  if(!safeImageUrl(draft.image))errors.push({field:"image",code:"image"});
  return errors;
}
