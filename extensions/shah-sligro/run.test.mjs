import test from 'node:test';
import assert from 'node:assert/strict';
import {validateRequest,adminSender,LOGIN,REQUEST,RESULT,PROGRESS,productSku} from './protocol.mjs';
import {runPreview} from './run.mjs';

const url = 'https://www.sligro.nl/p.900001.html/test-product.html';
const loginUrl = LOGIN+'?target='+encodeURIComponent(new URL(url).pathname);
const item = {id:'one',url,packUnits:24,revision:'1'};
const request = (products=[item]) => validateRequest({type:REQUEST,requestId:'preview-123',products});
const valid = {
  state:'authenticated-product',sku:'900001',units:24,currency:'EUR',priceUnit:'pack',
  vat:'excluded',deposit:'excluded',standard:['€31,45'],
  promo:{state:'present',prices:['€30,48'],from:'2026-11-19',through:'2026-12-07'}
};
function setup(readings=[], completingLogin=true){
  let time=0, living, page, loginCount=0;
  const track = [], observed = [];
  const ctl = new AbortController();
  const chrome = {
    tabs: {
      create: async fields => { living=true; track.push(['create', fields]); page=fields.url; return {id:2}; },
      update: async (id, fields) => { assert.equal(id,2); assert.ok(living); track.push(['update',fields]); page=fields.url; },
      get: async id => {
        assert.equal(id,2);
        if (page === loginUrl && completingLogin && loginCount++ > 0) page = url;
        return {status:'complete',url:page};
      },
      remove: async id => { assert.equal(id,2); track.push(['remove']); living=false; }
    },
    scripting: {
      executeScript: async query => {
        assert.equal(query.target.tabId,2);
        assert.deepEqual(query.target.frameIds,[0]);
        assert.ok(productSku(page));
        track.push(['read']);
        return [{result:readings.shift()}];
      }
    }
  };
  const options={adapterReady:true,now:()=>time,today:()=>'2026-11-24',sleep:async ms=>{time+=ms;}};
  const run = (req=request(), override={}) => runPreview(req,chrome,msg=>observed.push(msg),ctl.signal,{...options,...override});
  return {chrome,ctl,track,observed,run};
}
test('sender only allows exact secure Stock URL and main frame',()=>{
  const sender={frameId:0,tab:{id:1},url:'https://shahrestaurant.nl/admin/stock'};
  assert.ok(adminSender(sender));
  assert.ok(!adminSender({...sender,frameId:2}));
  for (const wrong of ['https://www.shahrestaurant.nl/admin/stock','http://shahrestaurant.nl/admin/stock','https://shahrestaurant.nl/admin/stock-check']) {
    assert.ok(!adminSender({...sender,url:wrong}));
  }
});
test('blocks queries including credential-like parameters and all other hosts and paths',()=>{
  for(const wrong of [url+'?something=1',url+'#thing',url.replace('sligro.nl','example.invalid'),url.replace('https://','http://'),url.replace('https://','https://a@'),LOGIN]){
    assert.equal(productSku(wrong),null);
  }
  assert.equal(request(Array.from({length:51}, (_,i)=>({...item,id:String(i)}))),null);
  assert.equal(request([item,item]),null);
});
test('unverified production adapter stops without opening any browser tabs',async()=>{
  const x=setup([valid]);
  await x.run(request(),{adapterReady:false});
  assert.equal(x.track.length,0);
  assert.deepEqual(x.observed.at(-1).skipped,[{id:'one',reason:'adapter-unverified'}]);
});
test('signed-in product returns review only, uses one tab, no login',async()=>{
  const x=setup([valid]);
  await x.run();
  assert.equal(x.track.some(([,v])=>v?.url===loginUrl),false);
  assert.deepEqual(x.observed.at(-1),{
    type:RESULT,requestId:'preview-123',results:[{...item,sku:'900001',regularCents:3145,offerCents:3048,offerStart:'2026-11-19',offerEnd:'2026-12-07'}],skipped:[]
  });
  assert.deepEqual(x.track.at(-1),['remove']);
});
test('logged-out run waits for user and automatically resumes product read once',async()=>{
  const x=setup([{state:'logged-out'},valid]);
  await x.run();
  assert.equal(x.track.filter(([,v])=>v?.url===loginUrl).length,1);
  assert.ok(x.observed.some(m=>m.type===PROGRESS && m.state==='waiting-login'));
  assert.equal(x.observed.at(-1).results[0].regularCents,3145);
});
test('never reads login DOM; timeout keeps all prices unchanged',async()=>{
  const x=setup([{state:'logged-out'}],false);
  await x.run(request([item,{...item,id:'two'}]));
  assert.equal(x.track.filter(([act])=>act==='read').length,1);
  assert.deepEqual(x.observed.at(-1).skipped,[{id:'one',reason:'login-needed'},{id:'two',reason:'login-needed'}]);
  assert.equal(x.observed.at(-1).results.length,0);
});
test('blocked product stops remaining reads; wrong carton keeps saved price',async()=>{
  const x=setup([{...valid,units:12},{state:'blocked'},valid]);
  await x.run(request([item,{...item,id:'two'},{...item,id:'three'}]));
  assert.equal(x.track.filter(([act])=>act==='read').length,2);
  assert.deepEqual(x.observed.at(-1).skipped,[{id:'one',reason:'product-mismatch'},{id:'two',reason:'supplier-blocked'},{id:'three',reason:'supplier-blocked'}]);
});
test('superseded run suppresses late result and closes owned tab',async()=>{
  const x=setup();
  x.chrome.scripting.executeScript=async()=>{x.ctl.abort();return[{result:valid}];};
  await x.run();
  assert.ok(x.observed.every(m=>m.type!==RESULT));
  assert.deepEqual(x.track.at(-1),['remove']);
});

import {readArticleLabel,readBeveragePackLabel} from './visible-labels.mjs';
test('separately scoped article and explicit pack factors, not fluid volume',()=>{
  assert.equal(readBeveragePackLabel('Krat 4 multipacks x 6 flesjes x 30 cl'),24);
  assert.equal(readBeveragePackLabel('Doos 12 flessen × 0,75 l'),12);
  for (const txt of ['30 cl','12 × 30 cl','Krat of 4 multipacks x 6 flesjes x 30 cl','Krat 4 multipacks x 6 flesjes x 30 cl of 12 flessen x 0,75 l','Doos 0 flessen x 30 cl']) {
    assert.equal(readBeveragePackLabel(txt),null);
  }
  assert.equal(readArticleLabel('Artikelnummer: 900001'),'900001');
  assert.equal(readArticleLabel('Artikelnummer: 900001 / 900002'),null);
});

import {normalizeRenderedProduct,readPromoRange} from './visible-labels.mjs';
const rendered = {
  state:'rendered-product',articleLabels:['Artikelnummer: 900001'],packLabels:['Krat 24 flesjes x 30 cl'],
  regularPromoLabels:['31,45'],currentPromoLabels:['30,48'],promoDateLabels:['GELDIG VAN 21 NOV T/M 8 DEC'],
  standaloneLabels:[],hasPromoLayout:true,depositLabels:['Emballage: 3,00'],
  taxLabels:['Alle prijzen zijn in EUR en exclusief BTW']
};
test('real-shaped rendered promotion extracts pack price separately from deposit',async()=>{
  const x=setup([rendered]);
  await x.run();
  assert.deepEqual(x.observed.at(-1).results,[{...item,sku:'900001',regularCents:3145,offerCents:3048,offerStart:'2026-11-21',offerEnd:'2026-12-08'}]);
});
test('standalone verified layout clears old promo only when expected pack matches',async()=>{
  const noPromo={...rendered,packLabels:['Fles 75 cl'],standaloneLabels:['12,53'],hasPromoLayout:false,
    regularPromoLabels:[],currentPromoLabels:[],promoDateLabels:[],depositLabels:[]};
  const x=setup([noPromo,noPromo]);
  await x.run(request([{...item,packUnits:1},{...item,id:'two'}]));
  assert.deepEqual(x.observed.at(-1).results,[{...item,packUnits:1,sku:'900001',regularCents:1253,offerCents:null,offerStart:null,offerEnd:null}]);
  assert.deepEqual(x.observed.at(-1).skipped,[{id:'two',reason:'product-mismatch'}]);
});
test('mis-scoped prices, unsigned amount or ambiguous tax/deposit remain unread',()=>{
  for(const delta of [{standaloneLabels:['42,41']},{taxLabels:['Inclusief BTW']},
    {regularPromoLabels:['31,45','31,45']},{depositLabels:['Emballage: wisselend']},{hasPromoLayout:false}]){
    assert.equal(normalizeRenderedProduct({...rendered,...delta},'2026-11-24').state,'ambiguous-rendered-labels');
  }
});
test('Amsterdam calendar and yearless cross-year expiry',()=>{
  assert.deepEqual(readPromoRange('Geldig van 28 dec t/m 4 jan','2027-01-04'),{from:'2026-12-28',through:'2027-01-04'});
  assert.equal(readPromoRange('Geldig van 28 dec t/m 4 jan','2027-01-05'),null);
  assert.equal(readPromoRange('Geldig van 31 nov t/m 8 dec','2026-12-02'),null);
  assert.equal(readPromoRange('Geldig van 5 dec t/m 4 dec','2026-12-04'),null);
});

import {runInNewContext} from 'node:vm';
import {readFileSync} from 'node:fs';
const domReader = readFileSync(new URL('./sligro-dom.js',import.meta.url),'utf8');
function fakePage({ linkUrl, header=true, priceVisible=false, copy='Inloggen' }) {
  const element = (innerText, selectors = {}, more = {}) => ({
    innerText, querySelectorAll: s => selectors[s] ?? [],
    getClientRects:()=>[{}],closest:()=>null,...more,
  });
  const anchors = linkUrl ? [element(copy,{},{
    href:linkUrl,closest: s=>s==='header, [role="banner"], .site-header, #site-header' && header ? {} : null
  })] : [];
  const price = priceVisible ? element('',{'.cmp-price__price, .cmp-price__old':[element('31,45')]}) : null;
  const root = price ? element('',{'.cmp-productdetail__price':[price],
    '.cmp-productdetail__head .cmp-productdetail__subinfo':[element('Artikelnummer: 900001')]}) : null;
  const doc=element('',{'a[href^="/inloggen.html"], a[href^="https://www.sligro.nl/inloggen.html"]':anchors,'.cmp-productdetail-top':root?[root]:[]});
  return runInNewContext(domReader,{document:doc,URL,location:new URL(url),getComputedStyle:()=>({visibility:'visible',opacity:'1'})});
}
test('bare exact official Inloggen link in the header only triggers login when price absent',()=>{
  assert.equal(fakePage({linkUrl:LOGIN}).state,'logged-out');
  assert.equal(fakePage({linkUrl:LOGIN,header:false}).state,'loading');
  assert.equal(fakePage({linkUrl:LOGIN,copy:'Andere tekst'}).state,'loading');
  assert.equal(fakePage({linkUrl:LOGIN,priceVisible:true}).state,'rendered-product');
  assert.equal(fakePage({linkUrl:'https://example.invalid/inloggen.html'}).state,'loading');
  assert.equal(fakePage({linkUrl:loginUrl,header:false}).state,'logged-out');
  assert.equal(fakePage({linkUrl:loginUrl+'&foo=bar'}).state,'loading');
  assert.equal(fakePage({}).state,'loading');
});
