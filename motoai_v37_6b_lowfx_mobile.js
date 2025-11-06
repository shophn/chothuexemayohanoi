(()=>{
/* --------------------------------------------------
   MotoAI v37_6b — LowFX Mobile Edition
   Ultra-light UI • Send button LEFT • Mobile-optimized
   -------------------------------------------------- */

const CFG = {
  brand: "MotoAI",
  phone: "09xx.xxx.xxx",
  themeColor: "#0084FF",
  maxHistory: 10,
  maxPagesPerDomain: 10,
  fetchPauseMs: 250,
  viOnly: true,
  deepContext: true,
  autoLearn: true
};

/* ---------------------- HTML ---------------------- */
const HTML = `
<div id="mta-root">
  <button id="mta-bubble" aria-controls="mta-card" aria-expanded="false">💬</button>
  <div id="mta-backdrop"></div>

  <section id="mta-card" role="dialog" aria-hidden="true" aria-label="Chat ${CFG.brand}">
    <header id="mta-header">
      <strong>${CFG.brand}</strong>
    </header>

    <main id="mta-body" role="log" aria-live="polite" aria-relevant="additions text"></main>

    <footer id="mta-input">
      <button id="mta-send">➤</button>
      <input id="mta-in" placeholder="Nhắn cho ${CFG.brand}..." autocomplete="off">
    </footer>
  </section>
</div>
`;

/* ---------------------- CSS ---------------------- */
const CSS = `
#mta-root { position: fixed; bottom: 16px; right: 16px; z-index: 99999; }

/* Bubble */
#mta-bubble{
  width:54px;height:54px;
  border-radius:50%;
  background:${CFG.themeColor};
  display:flex;align-items:center;justify-content:center;
  font-size:22px;color:white;border:none;cursor:pointer;
  box-shadow:0 4px 12px rgba(0,0,0,.15);
  transition:opacity .12s linear;
}

/* Backdrop */
#mta-backdrop{
  position:fixed;inset:0;
  background:rgba(0,0,0,.15);
  opacity:0;pointer-events:none;
  transition:opacity .12s linear;
}
#mta-backdrop.show{opacity:1;pointer-events:auto;}

/* Card */
#mta-card{
  position:fixed;
  right:16px;bottom:16px;
  width:min(420px,calc(100% - 24px));
  height:70vh;max-height:700px;
  background:white;color:#111;border-radius:14px;
  display:flex;flex-direction:column;
  transform:translateY(110%);
  transition:transform .16s ease-out;
  box-shadow:0 8px 22px rgba(0,0,0,.18);
}
#mta-card.open{transform:translateY(0);}

/* Header */
#mta-header{
  background:${CFG.themeColor};
  color:white;padding:10px 12px;
  font-size:15px;
}

/* Body */
#mta-body{
  flex:1;
  overflow-y:auto;
  padding:10px;
  background:#f2f4f7;
}

/* Message bubbles */
.m-msg{
  max-width:78%;
  padding:8px 11px;
  margin:6px 0;
  border-radius:16px;
  font-size:14px;line-height:1.4;
}
.m-msg.bot{background:white;color:#000;}
.m-msg.user{
  background:${CFG.themeColor};
  color:white;margin-left:auto;
  border-bottom-right-radius:6px;
}

/* Input row – SEND LEFT / INPUT RIGHT */
#mta-input{
  display:flex;flex-direction:row;
  align-items:center;gap:8px;
  padding:8px;background:white;
  border-top:1px solid rgba(0,0,0,.08);
}

/* input bên phải */
#mta-in{
  flex:1;
  padding:9px 12px;
  border-radius:14px;
  background:#f0f2f5;
  border:1px solid rgba(0,0,0,.08);
  font-size:14px;
}

/* nút gửi bên trái */
#mta-send{
  width:42px;height:42px;
  background:${CFG.themeColor};
  border:none;border-radius:12px;
  color:white;font-size:18px;
  box-shadow:0 4px 12px rgba(0,132,255,.32);
  cursor:pointer;
  flex-shrink:0;
}

/* Reduce motion */
@media (prefers-reduced-motion: reduce){
  *{transition:none !important;animation:none !important;}
}
`;

/* --------------------------------------------------
   Inject HTML + CSS
-------------------------------------------------- */
document.head.insertAdjacentHTML("beforeend", `<style>${CSS}</style>`);
document.body.insertAdjacentHTML("beforeend", HTML);

/* effect off */
function $(s){ return document.querySelector(s); }

const bubble = $("#mta-bubble");
const backdrop = $("#mta-backdrop");
const card = $("#mta-card");
const body = $("#mta-body");
const input = $("#mta-in");
const send = $("#mta-send");

/* --------------------------------------------------
   UI Logic
-------------------------------------------------- */
function openChat(){
  bubble.style.display = "none";
  backdrop.classList.add("show");
  card.classList.add("open");
  card.setAttribute("aria-hidden","false");
  input.focus();
}

function closeChat(){
  bubble.style.display = "flex";
  backdrop.classList.remove("show");
  card.classList.remove("open");
  card.setAttribute("aria-hidden","true");
}

bubble.onclick = openChat;
backdrop.onclick = closeChat;

/* --------------------------------------------------
   Chat engine (sẽ gửi ở phần 2 + 3)
-------------------------------------------------- */
 /* ================== PART 2 — NLP + Auto-learn + Retrieval ================== */

/* ---------- Tiny helpers ---------- */
const safeJSON = s => { try { return JSON.parse(s); } catch { return null; } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
function scrollToBottom(){ body.scrollTop = body.scrollHeight; }

/* ---------- Session storage ---------- */
const K = {
  sess:  "MotoAI_v37_6b_sess",
  ctx:   "MotoAI_v37_6b_ctx",
  learn: "MotoAI_v37_6b_learn",
  stamp: "MotoAI_v37_6b_learn_stamp",
  clean: "MotoAI_v37_6b_clean"
};
function getSess(){
  const a = safeJSON(localStorage.getItem(K.sess)) || [];
  return Array.isArray(a)? a: [];
}
function saveSess(a){
  try{ localStorage.setItem(K.sess, JSON.stringify(a.slice(-(CFG.maxHistory||10)))); }catch{}
}
function addMsg(role, text){
  if(!text) return;
  const el = document.createElement("div");
  el.className = "m-msg " + (role === "user" ? "user" : "bot");
  el.textContent = text;
  body.appendChild(el);
  scrollToBottom();

  const a = getSess();
  a.push({role, text, t: Date.now()});
  saveSess(a);
}
function renderSess(){
  body.innerHTML = "";
  const a = getSess();
  if(a.length) a.forEach(m => addMsg(m.role, m.text));
  else addMsg("bot", `Xin chào 👋, em là nhân viên hỗ trợ của ${CFG.brand}. Anh/chị cần thuê xe số, xe ga hay theo tháng?`);
}

/* ---------- Context ---------- */
function getCtx(){ return safeJSON(localStorage.getItem(K.ctx)) || {turns:[]}; }
function pushCtx(delta){
  try{
    const ctx = getCtx();
    ctx.turns.push(Object.assign({t:Date.now()}, delta||{}));
    ctx.turns = ctx.turns.slice(-5);
    localStorage.setItem(K.ctx, JSON.stringify(ctx));
  }catch{}
}

/* ---------- Lightweight NLP ---------- */
const TYPE_MAP = [
  {re:/xe số|wave|blade|sirius|jupiter|future|dream/i, canon:'xe số'},
  {re:/xe ga|vision|air\s*blade|lead|liberty|vespa|grande|janus|sh\b/i, canon:'xe ga'},
  {re:/air\s*blade|airblade|ab\b/i, canon:'air blade'},
  {re:/vision/i, canon:'vision'},
  {re:/xe điện|vinfast|yadea|dibao|klara|evo/i, canon:'xe điện'},
  {re:/50\s*cc|xe 50/i, canon:'50cc'},
  {re:/côn tay|tay côn|exciter|winner|raider|cb150|cbf190|w175|msx/i, canon:'xe côn tay'}
];
function detectType(t){
  for(const it of TYPE_MAP){ if(it.re.test(t)) return it.canon; }
  return null;
}
// Chỉ nhận khi có đơn vị để không dính số điện thoại
function detectQty(t){
  if(!t) return null;
  const m = t.match(/\b(\d{1,3})\s*(ngày|day|d|tuần|tuan|week|w|tháng|thang|month|m)\b/i);
  if(!m) return null;
  const n = parseInt(m[1],10);
  if(!n) return null;
  const u = (m[2]||"").toLowerCase();
  let unit = "ngày";
  if(/tuần|tuan|week|w/.test(u)) unit = "tuần";
  else if(/tháng|thang|month|m/.test(u)) unit = "tháng";
  return {n, unit};
}
function detectIntent(t){
  return {
    needPrice:   /(giá|bao nhiêu|thuê|tính tiền|cost|price)/i.test(t),
    needDocs:    /(thủ tục|giấy tờ|cccd|passport|hộ chiếu)/i.test(t),
    needContact: /(liên hệ|zalo|gọi|hotline|sđt|sdt|phone)/i.test(t),
    needDelivery:/(giao|ship|tận nơi|đưa xe|mang xe)/i.test(t),
    needReturn:  /(trả xe|gia hạn|đổi xe|kết thúc thuê)/i.test(t),
    needPolicy:  /(điều kiện|chính sách|bảo hiểm|hư hỏng|sự cố|đặt cọc|cọc)/i.test(t)
  };
}

/* ---------- Retrieval (auto-learn cực nhẹ) ---------- */
function tk(s){ return (s||"").toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,' ').split(/\s+/).filter(Boolean); }
function loadLearn(){ return safeJSON(localStorage.getItem(K.learn)) || {}; }
function saveLearn(o){ try{ localStorage.setItem(K.learn, JSON.stringify(o)); }catch{} }
function getIndexFlat(){
  const cache = loadLearn(), out=[];
  Object.keys(cache).forEach(key=>{
    (cache[key].pages||[]).forEach(pg=> out.push(Object.assign({source:key}, pg)));
  });
  return out;
}
function searchIndex(query,k=3){
  const qtok = tk(query); if(!qtok.length) return [];
  const idx = getIndexFlat();
  return idx.map(it=>{
    const txt = ((it.title||"")+" "+(it.text||"")+" "+(it.url||"")).toLowerCase();
    let score=0; qtok.forEach(t=>{ if(txt.includes(t)) score++; });
    return Object.assign({score}, it);
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,k);
}
function mkSnippet(text,q,max=180){
  if(!text) return "";
  const t = text.replace(/\s+/g," ").trim();
  if(t.length<=max) return t;
  const tokens = tk(q);
  for(const tok of tokens){
    const p = t.toLowerCase().indexOf(tok);
    if(p>=0){ const s = Math.max(0,p-50); return (s>0?"...":"")+t.slice(s,s+max)+"..."; }
  }
  return t.slice(0,max)+"...";
}

/* ---------- Fetch/crawl siêu nhẹ ---------- */
async function fetchText(url, timeout=8000){
  const ctl = new AbortController();
  const id = setTimeout(()=>ctl.abort(), timeout);
  try{
    const res = await fetch(url, {signal:ctl.signal});
    clearTimeout(id);
    if(!res.ok) return null;
    return await res.text();
  }catch{ clearTimeout(id); return null; }
}
function parseXML(t){ try{return (new DOMParser()).parseFromString(t,"text/xml");}catch{return null;} }
function parseHTML(t){ try{return (new DOMParser()).parseFromString(t,"text/html");}catch{return null;} }

async function readSitemapURLs(){
  const origin = location.origin;
  const urls = [];
  const candidates = [`${origin}/moto_sitemap.json`, `${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`];

  // 1) moto_sitemap.json (ưu tiên)
  try{
    const txt = await fetchText(candidates[0]);
    if(txt){
      const json = safeJSON(txt);
      const list = [
        ...(json?.categories?.datasets?.list || []),
        ...(json?.categories?.pages?.list || [])
      ];
      if(list.length) return { kind:"json", items:list };
    }
  }catch{}

  // 2) sitemap.xml / index
  for(const c of candidates.slice(1)){
    try{
      const xml = await fetchText(c);
      if(!xml) continue;
      const doc = parseXML(xml); if(!doc) continue;
      const sm = Array.from(doc.getElementsByTagName("sitemap")).map(x=>x.getElementsByTagName("loc")[0]?.textContent?.trim()).filter(Boolean);
      if(sm.length){
        const all=[];
        for(const loc of sm.slice(0,3)){ // cực nhẹ
          try{
            const childXml = await fetchText(loc);
            const cd = parseXML(childXml||"");
            const urls2 = Array.from(cd.getElementsByTagName("url")).map(u=>u.getElementsByTagName("loc")[0]?.textContent?.trim()).filter(Boolean);
            all.push(...urls2);
            await sleep(CFG.fetchPauseMs||200);
          }catch{}
        }
        if(all.length) return {kind:"xml", items: all};
      }
      const urls2 = Array.from(doc.getElementsByTagName("url")).map(u=>u.getElementsByTagName("loc")[0]?.textContent?.trim()).filter(Boolean);
      if(urls2.length) return {kind:"xml", items: urls2};
    }catch{}
  }

  // 3) fallback: trang chủ
  return {kind:"home", items:[location.origin + "/"]};
}

function looksVN(s){
  if(/[ăâêôơưđà-ỹ]/i.test(s)) return true;
  const hits = (s.match(/\b(xe|thuê|giá|cọc|liên hệ|hà nội)\b/gi)||[]).length;
  return hits>=2;
}

async function pullPages(urls){
  const out = [];
  let i=0;
  const max = Math.min(CFG.maxPagesPerDomain||10, urls.length);
  const limit = 3; // cực nhẹ trên mobile
  async function worker(){
    while(i < urls.length && out.length < max){
      const u = urls[i++];
      const txt = await fetchText(u); if(!txt) continue;
      let title = (txt.match(/<title[^>]*>([^<]+)<\/title>/i)||[])[1]||"";
      title = title.replace(/\s+/g," ").trim();
      let desc  = (txt.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"]+)["']/i)||[])[1]||"";
      if(!desc){
        // trích tóm tắt ngắn để nhẹ
        desc = txt.replace(/<script[\s\S]*?<\/script>/gi," ")
                  .replace(/<style[\s\S]*?<\/style>/gi," ")
                  .replace(/<[^>]+>/g," ")
                  .replace(/\s+/g," ").trim().slice(0,420);
      }
      const sample = (title+" "+desc).toLowerCase();
      if(CFG.viOnly && !looksVN(sample)){ await sleep(CFG.fetchPauseMs||150); continue; }
      out.push({url:u,title,text:desc});
      await sleep(CFG.fetchPauseMs||150);
    }
  }
  await Promise.all(Array.from({length:limit}, ()=>worker()));
  return out;
}

async function learnLightIfNeeded(){
  const last = parseInt(localStorage.getItem(K.stamp)||0);
  if(last && Date.now()-last < 24*3600*1000) return;  // 24h
  const cache = loadLearn();
  const found = await readSitemapURLs();
  const urls = found.items || [];
  const pages = await pullPages(urls.slice(0, 30)); // giới hạn để nhẹ
  if(pages.length){
    cache["auto"] = {domain: location.origin, pages, ts: Date.now()};
    saveLearn(cache);
    localStorage.setItem(K.stamp, Date.now());
  }
}

/* ---------- init cleanup + autolearn defer ---------- */
(function init(){
  const lastClean = parseInt(localStorage.getItem(K.clean)||0);
  if(!lastClean || Date.now()-lastClean > 7*24*3600*1000){
    localStorage.removeItem(K.learn);
    localStorage.removeItem(K.ctx);
    localStorage.setItem(K.clean, Date.now());
  }
  // defer autolearn để UI mượt
  if(CFG.autoLearn){
    const kickoff = ()=> learnLightIfNeeded().catch(()=>{});
    if("requestIdleCallback" in window) requestIdleCallback(kickoff, {timeout:1500});
    else setTimeout(kickoff, 400);
  }
})();
  /* ================== PART 3 — Pricing + Bot Logic + Handlers ================== */

/* ---------- Pricing table ---------- */
const PRICE_TABLE = {
  'xe số':      { day:[150000],          week:[600000,700000], month:[850000,1200000] },
  'xe ga':      { day:[150000,200000],   week:[600000,1000000], month:[1100000,2000000] },
  'air blade':  { day:[200000],          week:[800000],         month:[1600000,1800000] },
  'vision':     { day:[200000],          week:[700000,850000],  month:[1400000,1900000] },
  'xe điện':    { day:[170000],          week:[800000],         month:[1600000] },
  '50cc':       { day:[200000],          week:[800000],         month:[1700000] },
  'xe côn tay': { day:[300000],          week:[1200000],        month:null }
};
function nf(n){ return (n||0).toLocaleString("vi-VN"); }
function baseFor(type,unit){
  const it=PRICE_TABLE[type]; if(!it) return null;
  const key=unit==="tuần"?"week":(unit==="tháng"?"month":"day");
  const arr=it[key];
  if(!arr) return null;
  return Array.isArray(arr)?arr[0]:arr;
}

/* ---------- Tone helpers ---------- */
const PREFIX = ["Chào anh/chị,","Xin chào 👋,","Em chào anh/chị,","Em ở "+CFG.brand+" đây,"];
const pick = a => a[Math.floor(Math.random()*a.length)];
function naturalize(t){
  if(!t) return t;
  let s = " " + t + " ";
  s = s.replace(/\s+ạ([.!?,\s]|$)/gi, "$1")
       .replace(/\s+nhé([.!?,\s]|$)/gi, "$1")
       .replace(/\s+nha([.!?,\s]|$)/gi, "$1")
       .replace(/\s{2,}/g, " ").trim();
  if(!/[.!?]$/.test(s)) s += ".";
  return s.replace(/\.\./g,".");
}
function polite(s){ s = s || "em chưa nhận được câu hỏi, anh/chị nhập lại giúp em."; return naturalize(`${pick(PREFIX)} ${s}`); }

/* ---------- Compose price ---------- */
function composePrice(type, qty){
  if(!type) type="xe số";
  if(!qty)  return naturalize(`Anh/chị thuê ${type} theo ngày, tuần hay tháng để em báo đúng giá nhé.`);
  const base = baseFor(type, qty.unit);
  if(!base)  return naturalize(`Giá thuê ${type} theo ${qty.unit} cần kiểm tra. Anh/chị nhắn Zalo ${CFG.phone} để em chốt theo mẫu xe ạ.`);
  const total = base * qty.n;
  const unitLabel = qty.unit==="ngày"?"ngày":qty.unit==="tuần"?"tuần":"tháng";
  const text = qty.n===1
    ? `Giá thuê ${type} 1 ${unitLabel} khoảng ${nf(base)}đ`
    : `Giá thuê ${type} ${qty.n} ${unitLabel} khoảng ${nf(total)}đ`;
  const hint = (qty.unit==="ngày" && qty.n>=3) ? " Nếu thuê theo tuần sẽ tiết kiệm hơn." : "";
  return naturalize(`${text}. Anh/chị cần em giữ xe và gửi ảnh xe qua Zalo ${CFG.phone} không?${hint}`);
}

/* ---------- Main answer ---------- */
async function deepAnswer(userText){
  const q = (userText||"").trim();
  const intents = detectIntent(q);
  let type = detectType(q);
  let qty  = detectQty(q);

  // giữ ngữ cảnh nhưng không tự trả giá nếu user không hỏi
  if(CFG.deepContext){
    const ctx = getCtx();
    for(let i=ctx.turns.length-1;i>=0;i--){
      const t = ctx.turns[i];
      if(!type && t.type) type=t.type;
      if(!qty  && t.qty)  qty=t.qty;
      if(type && qty) break;
    }
  }

  if(intents.needContact)
    return polite(`anh/chị gọi ${CFG.phone} hoặc nhắn Zalo là có người nhận ngay.`);
  if(intents.needDocs)
    return polite(`thủ tục gọn: CCCD/hộ chiếu + cọc theo xe. Không để giấy tờ có thể thêm 500k thay giấy tờ.`);
  if(intents.needPolicy)
    return polite(`đặt cọc tham khảo: xe số 2–3 triệu; xe ga 2–5 triệu; 50cc cọc ~4 triệu. Liên hệ Zalo ${CFG.phone} để chốt theo mẫu.`);
  if(intents.needDelivery)
    return polite(`thuê 1–4 ngày mời ghé cửa hàng; thuê tuần/tháng em giao tận nơi. Phí nội thành 20–100k tuỳ quận. Nhắn Zalo ${CFG.phone} để em set lịch.`);
  if(intents.needReturn)
    return polite(`trả xe tại cửa hàng hoặc hẹn trả tận nơi (thoả thuận). Báo trước 30 phút để em sắp xếp, hoàn cọc nhanh.`);

  if(intents.needPrice || qty) return composePrice(type, qty);

  // thử retrieval
  try{
    const top = searchIndex(q, 3);
    if(top && top.length){
      const lines = top.map(t=>{
        const sn = mkSnippet(t.title||t.text||"", q, 140);
        let dom = t.source || "nguồn";
        try{ if(t.url) dom = new URL(t.url).hostname.replace(/^www\./,""); }catch{}
        return `• ${sn} (${dom})`;
      });
      return naturalize(`em tìm được vài nội dung liên quan:\n${lines.join("\n")}\nAnh/chị muốn em tóm tắt mục nào không?`);
    }
  }catch{}

  return polite(`anh/chị muốn thuê loại nào (xe số, xe ga, xe điện, 50cc) và thuê mấy ngày để em báo đúng giá?`);
}

/* ---------- Typing indicator (rất nhẹ) ---------- */
function showTyping(){
  const box = document.createElement("div");
  box.id = "mta-typing";
  box.style.margin = "6px 0";
  box.textContent = "Đang nhập...";
  body.appendChild(box);
  scrollToBottom();
}
function hideTyping(){
  const t = document.getElementById("mta-typing");
  if(t) t.remove();
}

/* ---------- Send flow ---------- */
let sending = false;

async function sendUser(text){
  if(sending) return;
  const v = (text||"").trim();
  if(!v) return;
  sending = true;

  addMsg("user", v);
  pushCtx({from:"user", raw:v, type:detectType(v), qty:detectQty(v)});

  // delay nhẹ để cảm giác “máy đang gõ”
  showTyping();
  await sleep(180);  // ultra-light
  const ans = await deepAnswer(v);
  hideTyping();

  addMsg("bot", ans);
  pushCtx({from:"bot", raw:ans});

  sending = false;
  scrollToBottom();
}

/* ---------- Bind input + keyboard ---------- */
send.addEventListener("click", ()=>{
  const v = input.value;
  if(!v.trim()) return;
  input.value="";
  sendUser(v);
});
input.addEventListener("keydown", (e)=>{
  if(e.key==="Enter" && !e.shiftKey){
    e.preventDefault();
    const v = input.value;
    if(!v.trim()) return;
    input.value="";
    sendUser(v);
  }
});

/* ---------- Open on first load ---------- */
renderSess();

/* ---------- Expose minimal API ---------- */
window.MotoAI_v37_6b = {
  open: ()=> bubble.click(),
  close: ()=> closeChat(),
  send: (t)=> sendUser(t),
  learnNow: ()=> learnLightIfNeeded()
};

/* ---------- Done ---------- */
})(); // END of v37_6b
