<!-- motoai_v37_6a_autositemap_pricing_lowfx.js -->
(function(){
  if (window.MotoAI_v37_6a_LOADED) return; 
  window.MotoAI_v37_6a_LOADED = true;

  /* ====== CONFIG ====== */
  const DEF = {
    brand: "Nguyen Tu",
    phone: "0942467674",
    zalo: "https://zalo.me/0942467674",
    map: "https://maps.app.goo.gl/SR1hcwnCQjPkAvDh7",
    avatar: "👩‍💼",
    themeColor: "#0084FF",
    autolearn: true,
    deepContext: true,
    maxContextTurns: 5,
    viOnly: true,
    extraSites: [location.origin],
    crawlDepth: 1,
    refreshHours: 24,
    maxPagesPerDomain: 50,
    maxTotalPages: 180,
    fetchTimeoutMs: 9000,
    fetchPauseMs: 120,
    maxParallelFetch: 4,
    disableQuickMap: false,
    /* NEW: bật giao diện ít hiệu ứng */
    lowEffects: true
  };
  const ORG = (window.MotoAI_CONFIG || {});
  const CFG = Object.assign({}, DEF, ORG);
  const MAX_MSG = 10;

  /* ====== HELPERS ====== */
  const $ = s => document.querySelector(s);
  const safeJSON = s => { try{return JSON.parse(s);}catch{return null;} };
  const sleep = ms => new Promise(r=>setTimeout(r,ms));
  const nowSec = ()=>Math.floor(Date.now()/1000);
  const matchReducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // tự nhiên tiếng Việt, bỏ “ạ/nhé/nha”, và chỉ thêm dấu nếu chưa có .?! ở cuối
  function naturalize(t){
    if(!t) return t;
    let s = " " + t + " ";
    s = s.replace(/\s+ạ([.!?,\s]|$)/gi, "$1");
    s = s.replace(/\s+nhé([.!?,\s]|$)/gi, "$1");
    s = s.replace(/\s+nha([.!?,\s]|$)/gi, "$1");
    s = s.replace(/\s{2,}/g, " ").trim();
    if(!/[.!?]$/.test(s)) s += ".";
    return s.replace(/\.\./g,".");
  }

  /* ====== STORAGE KEYS ====== */
  const K = {
    sess:  "MotoAI_v37_6_session",
    ctx:   "MotoAI_v37_6_ctx",
    learn: "MotoAI_v37_6_learn",
    clean: "MotoAI_v37_6_lastClean",
    stamp: "MotoAI_v37_6_learnStamp"
  };

  /* ====== UI ====== */
  const CSS = `
  :root{
    --mta-z:2147483647;
    --m-blue:${CFG.themeColor};
    --m-bg:#fff;
    --m-text:#0b1220;
    --m-radius:16px;
    --m-shadow:0 6px 18px rgba(0,0,0,.12);
    --m-shadow-heavy:0 12px 32px rgba(0,0,0,.18);
    --m-trans:.18s cubic-bezier(.22,1,.36,1);
  }
  /* Low effects mode (ít hiệu ứng) */
  .mta-lowfx{
    --m-shadow:none;
    --m-shadow-heavy:none;
    --m-trans:0.01ms linear;
  }
  #mta-root{
    position:fixed;
    right:16px;
    bottom:calc(16px + env(safe-area-inset-bottom,0));
    z-index:var(--mta-z);
    font-family:-apple-system,system-ui,Segoe UI,Roboto,"Helvetica Neue",Arial,sans-serif;
  }
  #mta-bubble{
    width:56px;height:56px;border:none;border-radius:999px;
    background:var(--m-blue);
    display:flex;align-items:center;justify-content:center;
    cursor:pointer;box-shadow:var(--m-shadow);
    color:#fff;font-size:22px;
  }
  /* Low effects: không gradient */
  .mta-lowfx #mta-bubble{ background:var(--m-blue); }

  #mta-backdrop{
    position:fixed;inset:0;background:rgba(0,0,0,.15);
    opacity:0;pointer-events:none;transition:opacity var(--m-trans);
  }
  #mta-backdrop.show{opacity:1;pointer-events:auto;}

  #mta-card{
    position:fixed;
    right:16px;bottom:16px;
    width:min(420px,calc(100% - 24px));
    height:70vh;max-height:740px;
    background:var(--m-bg);color:var(--m-text);
    border-radius:18px;
    box-shadow:var(--m-shadow-heavy);
    display:flex;flex-direction:column;overflow:hidden;
    transform:translateY(110%);
    transition:transform var(--m-trans);
  }
  #mta-card.open{transform:translateY(0);}

  #mta-header{
    background:var(--m-blue);
    color:#fff;
  }
  #mta-header .bar{
    display:flex;align-items:center;gap:10px;
    padding:11px 12px;
  }
  #mta-header .avatar{
    width:30px;height:30px;border-radius:50%;
    background:rgba(255,255,255,.18);
    display:flex;align-items:center;justify-content:center;
    font-size:15px;
  }
  #mta-header .name{font-weight:700;font-size:14px;line-height:1.1;}
  #mta-header .status{font-size:12px;opacity:.95;display:flex;align-items:center;gap:4px;}
  #mta-header .status-dot{width:8px;height:8px;border-radius:50%;background:#3fff6c;}
  #mta-header .actions{margin-left:auto;display:flex;gap:6px;align-items:center;}
  #mta-header .act{
    width:28px;height:28px;border-radius:999px;
    background:rgba(255,255,255,.16);
    border:1px solid rgba(255,255,255,.25);
    display:flex;align-items:center;justify-content:center;
    color:#fff;font-size:13px;text-decoration:none;
  }
  #mta-close{background:none;border:none;color:#fff;font-size:20px;cursor:pointer;}

  #mta-body{
    flex:1;overflow-y:auto;
    background:#eef2f7;
    padding:14px 10px 12px;
  }
  .m-msg{
    max-width:78%;margin:6px 0;
    padding:8px 11px;border-radius:20px;
    line-height:1.45;word-break:break-word;
    box-shadow:0 1px 1px rgba(0,0,0,.05);
    font-size:14px;
  }
  .m-msg.bot{
    background:#fff;color:#0d1117;
    border:1px solid rgba(0,0,0,.03);
  }
  .m-msg.user{
    background:#0084FF;color:#fff;
    margin-left:auto;border-bottom-right-radius:3px;
  }
  #mta-typing{display:inline-flex;gap:6px;align-items:center;margin:6px 0;}
  #mta-typing span{background:#fff;padding:6px 8px;border-radius:999px;font-size:12px;}

  #mta-tags{background:#f6f7f9;border-top:1px solid rgba(0,0,0,.05);transition:max-height var(--m-trans),opacity var(--m-trans);}
  #mta-tags.hidden{max-height:0;opacity:0;overflow:hidden;}
  #mta-tags .track{display:block;white-space:nowrap;overflow-x:auto;padding:8px 10px 10px;}
  #mta-tags button{
    display:inline-block;margin-right:8px;
    background:#fff;border:1px solid rgba(0,0,0,.05);
    border-radius:999px;padding:6px 12px;font-size:13px;cursor:pointer;
  }

  #mta-input{background:#fff;border-top:1px solid rgba(0,0,0,.05);padding:8px;display:flex;gap:8px;align-items:center;}
  #mta-in{
    flex:1;border:1px solid rgba(0,0,0,.1);border-radius:16px;
    padding:9px 10px 9px 12px;background:#F2F4F7;
  }
  #mta-send{
    width:40px;height:40px;border:none;border-radius:50%;
    background:var(--m-blue);
    color:#fff;cursor:pointer;box-shadow:0 4px 12px rgba(0,132,255,.25);
  }
  .mta-lowfx #mta-send{ box-shadow:none; }

  @media(max-width:520px){
    #mta-card{right:8px;left:8px;width:auto;height:70vh;}
    #mta-body{padding-bottom:8px;}
  }
  @media(prefers-color-scheme:dark){
    :root{--m-bg:#1a1c20;--m-text:#ecf0f5;}
    #mta-body{background:#1a1c20;}
    .m-msg.bot{background:#23252a;color:#fff;border:1px solid rgba(255,255,255,.03);}
    #mta-input{background:#1a1c20;border-top:1px solid rgba(255,255,255,.04);}
    #mta-in{background:#121317;color:#fff;border:1px solid rgba(255,255,255,.1);}
    #mta-tags{background:#1c1e22;border-top:1px solid rgba(255,255,255,.05);}
    #mta-tags button{background:#22242a;color:#fff;border:1px solid rgba(255,255,255,.1);}
  }
  /* Tôn trọng hệ thống: giảm chuyển động */
  @media (prefers-reduced-motion: reduce){
    *{
      animation-duration:0.01ms !important;
      animation-iteration-count:1 !important;
      transition-duration:0.01ms !important;
      scroll-behavior:auto !important;
    }
  }
  `;

  const HTML = `
  <div id="mta-root" aria-live="polite">
    <button id="mta-bubble" aria-label="Mở chat cùng ${CFG.brand}" aria-controls="mta-card" aria-expanded="false">
      💬
    </button>
    <div id="mta-backdrop"></div>
    <section id="mta-card" role="dialog" aria-label="Chat ${CFG.brand}" aria-hidden="true">
      <header id="mta-header">
        <div class="bar">
          <div class="avatar">${CFG.avatar}</div>
          <div class="info">
            <div class="name">${CFG.brand} — Đang hoạt động</div>
            <div class="status"><span class="status-dot"></span>Trực tuyến</div>
          </div>
          <div class="actions">
            ${CFG.phone?`<a class="act" href="tel:${CFG.phone}" title="Gọi nhanh">📞</a>`:""}
            ${CFG.zalo?`<a class="act" href="${CFG.zalo}" target="_blank" rel="noopener" title="Zalo">Z</a>`:""}
          </div>
          <button id="mta-close" aria-label="Đóng">×</button>
        </div>
      </header>
      <main id="mta-body" role="log" aria-live="polite" aria-relevant="additions text"></main>
      <div id="mta-tags" role="toolbar" aria-label="Gợi ý nhanh">
        <div class="track" id="mta-tag-track">
          <button data-q="Giá thuê xe máy">💰 Giá thuê</button>
          <button data-q="Thuê xe ga">🛵 Xe ga</button>
          <button data-q="Thuê xe số">🏍 Xe số</button>
          <button data-q="Thuê theo tháng">📆 Theo tháng</button>
          <button data-q="Giao xe tận nơi">🚚 Giao tận nơi</button>
          <button data-q="Thủ tục">📄 Thủ tục</button>
          <button data-q="Đặt cọc">💳 Đặt cọc</button>
        </div>
      </div>
      <footer id="mta-input">
        <input id="mta-in" placeholder="Nhắn cho ${CFG.brand}..." autocomplete="off" />
        <button id="mta-send" aria-label="Gửi tin">➤</button>
      </footer>
    </section>
  </div>
  `;

  /* ====== SESSION ====== */
  function getSess(){
    const arr = safeJSON(localStorage.getItem(K.sess)) || [];
    return Array.isArray(arr) ? arr : [];
  }
  function saveSess(arr){
    try{ localStorage.setItem(K.sess, JSON.stringify(arr.slice(-MAX_MSG))); }catch{}
  }
  function addMsg(role, text){
    if(!text) return;
    const body = $("#mta-body");
    if(!body) return;
    const el = document.createElement("div");
    el.className = "m-msg " + (role === "user" ? "user" : "bot");
    el.textContent = text;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;

    const arr = getSess();
    arr.push({role, text, t: Date.now()});
    saveSess(arr);
  }
  function renderSess(){
    const body = $("#mta-body");
    body.innerHTML = "";
    const arr = getSess();
    if (arr.length) {
      arr.forEach(m => addMsg(m.role, m.text));
    } else {
      addMsg("bot", naturalize(`Xin chào 👋, em là nhân viên hỗ trợ của ${CFG.brand}. Anh/chị cần thuê xe số, xe ga hay theo tháng ạ?`));
    }
  }

  /* ====== CONTEXT ====== */
  function getCtx(){ return safeJSON(localStorage.getItem(K.ctx)) || {turns:[]}; }
  function pushCtx(delta){
    try{
      const ctx = getCtx();
      ctx.turns.push(Object.assign({t:Date.now()}, delta||{}));
      ctx.turns = ctx.turns.slice(-(CFG.maxContextTurns||5));
      localStorage.setItem(K.ctx, JSON.stringify(ctx));
    }catch{}
  }

  /* ====== NLP nhỏ ====== */
  const TYPE_MAP = [
    {k:'xe số',     re:/xe số|wave|blade|sirius|jupiter|future|dream/i, canon:'xe số'},
    {k:'xe ga',     re:/xe ga|vision|air\s*blade|lead|liberty|vespa|grande|janus|sh\b/i, canon:'xe ga'},
    {k:'air blade', re:/air\s*blade|airblade|ab\b/i, canon:'air blade'},
    {k:'vision',    re:/vision/i, canon:'vision'},
    {k:'xe điện',   re:/xe điện|vinfast|yadea|dibao|klara|evo/i, canon:'xe điện'},
    {k:'50cc',      re:/50\s*cc|xe 50/i, canon:'50cc'},
    {k:'xe côn tay',re:/côn tay|tay côn|exciter|winner|raider|cb150|cbf190|w175|msx/i, canon:'xe côn tay'}
  ];
  function detectType(t){
    for(const it of TYPE_MAP){ if(it.re.test(t)) return it.canon; }
    return null;
  }
  // Chỉ khớp khi có đơn vị (ngày/tuần/tháng) để tránh nhầm số điện thoại
  function detectQty(t){
    if(!t) return null;
    const m = t.match(/\b(\d{1,3})\s*(ngày|day|d|tuần|tuan|week|w|tháng|thang|month|m)\b/i);
    if(!m) return null;
    const n = parseInt(m[1],10);
    if(!n) return null;
    let unit = "ngày";
    const u = m[2].toLowerCase();
    if(/tuần|tuan|week|w/.test(u)) unit = "tuần";
    else if(/tháng|thang|month|m/.test(u)) unit = "tháng";
    else unit = "ngày";
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

  /* ====== BẢNG GIÁ ====== */
  const PRICE_TABLE = {
    'xe số':      { day:[150000],          week:[600000,700000], month:[850000,1200000] },
    'xe ga':      { day:[150000,200000],   week:[600000,1000000], month:[1100000,2000000] },
    'air blade':  { day:[200000],          week:[800000], month:[1600000,1800000] },
    'vision':     { day:[200000],          week:[700000,850000], month:[1400000,1900000] },
    'xe điện':    { day:[170000],          week:[800000], month:[1600000] },
    '50cc':       { day:[200000],          week:[800000], month:[1700000] },
    'xe côn tay': { day:[300000],          week:[1200000], month:null }
  };
  function nf(n){ return (n||0).toLocaleString("vi-VN"); }
  function baseFor(type,unit){
    const it=PRICE_TABLE[type]; if(!it) return null;
    const key=unit==="tuần"?"week":(unit==="tháng"?"month":"day");
    const arr=it[key];
    if(!arr) return null;
    return Array.isArray(arr)?arr[0]:arr;
  }

  /* ====== SIMPLE INDEX / RETRIEVAL ====== */
  function tk(s){ return (s||"").toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,' ').split(/\s+/).filter(Boolean); }
  function loadLearn(){ return safeJSON(localStorage.getItem(K.learn)) || {}; }
  function saveLearn(o){ try{ localStorage.setItem(K.learn, JSON.stringify(o)); }catch{} }
  function getIndexFlat(){
    const cache = loadLearn();
    const out = [];
    Object.keys(cache).forEach(key=>{
      (cache[key].pages||[]).forEach(pg=>{
        out.push(Object.assign({source:key}, pg));
      });
    });
    return out;
  }
  function searchIndex(query, k=3){
    const qtok = tk(query);
    if(!qtok.length) return [];
    const idx = getIndexFlat();
    return idx.map(it=>{
      const txt = ((it.title||"")+" "+(it.text||"")+" "+(it.url||"")).toLowerCase();
      let score=0; qtok.forEach(t=>{ if(txt.includes(t)) score++; });
      return Object.assign({score}, it);
    }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,k);
  }
  function mkSnippet(text,q,max=200){
    if(!text) return "";
    const t = text.replace(/\s+/g," ").trim();
    if(t.length<=max) return t;
    const tokens = tk(q);
    for(const tok of tokens){
      const p = t.toLowerCase().indexOf(tok);
      if(p>=0){
        const start = Math.max(0, p-50);
        return (start>0?"...":"")+t.slice(start,start+max)+"...";
      }
    }
    return t.slice(0,max)+"...";
  }

  /* ====== FETCH / CRAWL ====== */
  async function fetchText(url){
    const ctl = new AbortController();
    const id = setTimeout(()=>ctl.abort(), CFG.fetchTimeoutMs);
    try{
      const res = await fetch(url, {signal:ctl.signal});
      clearTimeout(id);
      if(!res.ok) return null;
      return await res.text();
    }catch(e){ clearTimeout(id); return null; }
  }
  function parseXML(t){ try{return (new DOMParser()).parseFromString(t,"text/xml");}catch{return null;} }
  function parseHTML(t){ try{return (new DOMParser()).parseFromString(t,"text/html");}catch{return null;} }
  async function readSitemap(url){
    const xml = await fetchText(url); if(!xml) return [];
    const doc = parseXML(xml); if(!doc) return [];
    const items = Array.from(doc.getElementsByTagName("item"));
    if(items.length){
      return items.map(it=>it.getElementsByTagName("link")[0]?.textContent?.trim()).filter(Boolean);
    }
    const sm = Array.from(doc.getElementsByTagName("sitemap")).map(x=>x.getElementsByTagName("loc")[0]?.textContent?.trim()).filter(Boolean);
    if(sm.length){
      const all=[]; for(const loc of sm){ try{ const child = await readSitemap(loc); all.push(...child); }catch{} }
      return all;
    }
    const urls = Array.from(doc.getElementsByTagName("url")).map(u=>u.getElementsByTagName("loc")[0]?.textContent?.trim()).filter(Boolean);
    return urls;
  }
  async function fallbackCrawl(root){
    const start = root.endsWith("/")?root:root+"/";
    const html = await fetchText(start); if(!html) return [start];
    const doc = parseHTML(html); if(!doc) return [start];
    const links = Array.from(doc.querySelectorAll("a[href]"));
    const set = new Set([start]);
    links.forEach(a=>{
      try{
        const u = new URL(a.getAttribute("href"), start).toString().split("#")[0];
        if(u.startsWith(start)) set.add(u);
      }catch{}
    });
    return Array.from(set).slice(0,40);
  }
  function looksVN(s){
    if(/[ăâêôơưđà-ỹ]/i.test(s)) return true;
    const hits = (s.match(/\b(xe|thuê|giá|cọc|liên hệ|hà nội)\b/gi)||[]).length;
    return hits>=2;
  }
  async function pullPages(urls){
    const out=[];
    const maxPer = CFG.maxPagesPerDomain;
    const limit = CFG.maxParallelFetch || 4;
    let i = 0;

    async function worker(){
      while(i < urls.length && out.length < maxPer){
        const u = urls[i++];
        const txt = await fetchText(u); if(!txt) continue;
        let title = (txt.match(/<title[^>]*>([^<]+)<\/title>/i)||[])[1]||"";
        title = title.replace(/\s+/g," ").trim();
        let desc = (txt.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"]+)["']/i)||[])[1]||"";
        if(!desc){
          desc = txt.replace(/<script[\s\S]*?<\/script>/gi," ")
                    .replace(/<style[\s\S]*?<\/style>/gi," ")
                    .replace(/<[^>]+>/g," ")
                    .replace(/\s+/g," ")
                    .trim()
                    .slice(0,600);
        }
        const sample = (title+" "+desc).toLowerCase();
        if(CFG.viOnly && !looksVN(sample)){ await sleep(CFG.fetchPauseMs); continue; }
        out.push({url:u,title,text:desc});
        await sleep(CFG.fetchPauseMs);
      }
    }

    const workers = Array.from({length:limit}, ()=>worker());
    await Promise.all(workers);
    return out;
  }

  /* ====== AUTO-LEARN ====== */
  async function learnFromSitemapOrSite(){
    const last = parseInt(localStorage.getItem(K.stamp)||0);
    if (last && (Date.now()-last) < CFG.refreshHours*3600*1000) {
      return loadLearn();
    }

    const cache = loadLearn();
    const results = {};
    let total=0;

    const sitemapUrl = location.origin + "/moto_sitemap.json";
    try{
      const r = await fetch(sitemapUrl);
      if (r.ok) {
        const json = await r.json();
        const ds = [
          ...(json.categories?.datasets?.list || []),
          ...(json.categories?.pages?.list || [])
        ];
        const grouped = {"sitemap-json": {pages:[]}};
        for (const u of ds) {
          const txt = await fetchText(u);
          if(!txt) continue;
          if (/\.txt($|\?)/i.test(u)) {
            const title = u.split("/").slice(-1)[0];
            const text = txt.replace(/\s+/g," ").trim().slice(0,2000);
            grouped["sitemap-json"].pages.push({url:u,title,text});
          } else {
            let title = (txt.match(/<title[^>]*>([^<]+)<\/title>/i)||[])[1]||"";
            title = title.replace(/\s+/g," ").trim();
            let desc = (txt.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"]+)["']/i)||[])[1]||"";
            if(!desc){
              desc = txt.replace(/<script[\s\S]*?<\/script>/gi," ")
                        .replace(/<style[\s\S]*?<\/style>/gi," ")
                        .replace(/<[^>]+>/g," ")
                        .replace(/\s+/g," ").trim().slice(0,600);
            }
            const sample = (title+" "+desc).toLowerCase();
            if(CFG.viOnly && !looksVN(sample)) continue;
            grouped["sitemap-json"].pages.push({url:u,title,text:desc});
          }
          total++;
          if (total>=CFG.maxTotalPages) break;
          await sleep(CFG.fetchPauseMs);
        }
        if (grouped["sitemap-json"].pages.length){
          cache["sitemap-json"] = {domain:sitemapUrl, ts:nowSec(), pages: grouped["sitemap-json"].pages};
          saveLearn(cache);
          localStorage.setItem(K.stamp, Date.now());
          return cache;
        }
      }
    }catch(e){ console.warn("MotoAI: sitemap fetch error", e); }

    // Fallback crawl
    const origin = location.origin;
    const old=cache[origin];
    if(old && old.pages?.length && (nowSec()-old.ts)/3600 < CFG.refreshHours){
      localStorage.setItem(K.stamp, Date.now());
      return cache;
    }
    try{
      let urls=[];
      const candidates = [origin+"/sitemap.xml", origin+"/sitemap_index.xml"];
      for(const c of candidates){
        try{ const u = await readSitemap(c); if(u && u.length){ urls=u; break; } }catch{}
      }
      if(!urls.length) urls = await fallbackCrawl(origin);
      const pages = await pullPages(urls);
      if(pages?.length){
        cache[origin] = {domain:origin, ts:nowSec(), pages};
        saveLearn(cache);
      }
      localStorage.setItem(K.stamp, Date.now());
    }catch(e){ console.warn("MotoAI: fallback crawl error", e); }
    return cache;
  }

  /* ====== ANSWER ENGINE ====== */
  const PREFIX = ["Chào anh/chị,","Xin chào 👋,","Em chào anh/chị,","Em ở Nguyễn Tú đây,"];
  const pick = a => a[Math.floor(Math.random()*a.length)];
  function polite(s){
    s = s || "em chưa nhận được câu hỏi, anh/chị nhập lại giúp em.";
    return naturalize(`${pick(PREFIX)} ${s}`);
  }

  function composePrice(type, qty){
    if(!type) type="xe số";
    if(!qty){
      return naturalize(`Anh/chị thuê ${type} theo ngày, tuần hay tháng để em báo đúng giá nhé.`);
    }
    const base = baseFor(type, qty.unit);
    if(!base){
      return naturalize(`Giá thuê ${type} theo ${qty.unit} cần kiểm tra. Anh/chị nhắn Zalo ${CFG.phone} để em chốt theo mẫu xe ạ.`);
    }
    const total = base * qty.n;
    const unitLabel = qty.unit==="ngày"?"ngày":qty.unit==="tuần"?"tuần":"tháng";
    const text = qty.n===1
      ? `Giá thuê ${type} 1 ${unitLabel} khoảng ${nf(base)}đ`
      : `Giá thuê ${type} ${qty.n} ${unitLabel} khoảng ${nf(total)}đ`;
    let hint = "";
    if (qty.unit==="ngày" && qty.n>=3) hint = " Nếu thuê theo tuần sẽ tiết kiệm hơn.";
    return naturalize(`${text}. Anh/chị cần em giữ xe và gửi ảnh xe qua Zalo ${CFG.phone} không?${hint}`);
  }

  async function deepAnswer(userText){
    const q = (userText||"").trim();
    const intents = detectIntent(q);
    let type = detectType(q);
    let qty = detectQty(q);

    // GIỮ NGỮ CẢNH nhưng không return sớm
    if(CFG.deepContext){
      const ctx = getCtx();
      for(let i=ctx.turns.length-1;i>=0;i--){
        const t = ctx.turns[i];
        if(!type && t.type) type=t.type;
        if(!qty && t.qty) qty=t.qty;
        if(type && qty) break;
      }
    }

    if(intents.needContact)
      return polite(`anh/chị gọi ${CFG.phone} hoặc Zalo ${CFG.zalo||CFG.phone} là có người nhận ngay.`);
    if(intents.needDocs)
      return polite(`thủ tục gọn: CCCD/hộ chiếu + cọc theo xe. Không để giấy tờ có thể thêm 500k thay giấy tờ.`);
    if(intents.needPolicy)
      return polite(`đặt cọc tham khảo: xe số 2–3 triệu; xe ga 2–5 triệu; 50cc cọc 4 triệu. Liên hệ Zalo ${CFG.phone} để chốt theo mẫu xe.`);
    if(intents.needDelivery)
      return polite(`thuê 1–4 ngày vui lòng đến cửa hàng để chọn xe; thuê tuần/tháng em giao tận nơi. Phí nội thành 20–100k tuỳ quận. Nhắn Zalo ${CFG.phone} để em set lịch.`);
    if(intents.needReturn)
      return polite(`trả xe tại cửa hàng hoặc hẹn trả tận nơi (thoả thuận). Báo trước 30 phút để em sắp xếp, hoàn cọc nhanh.`);

    if(intents.needPrice || qty) return composePrice(type, qty);

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
    }catch(e){}

    return polite(`anh/chị muốn thuê loại nào (xe số, xe ga, xe điện, 50cc) và thuê mấy ngày để em báo đúng giá?`);
  }

  /* ====== SEND / UI CONTROL ====== */
  let isOpen = false;
  let sending = false;
  let trapHandler = null;

  function showTyping(){
    const body = $("#mta-body");
    if(!body) return;
    const box = document.createElement("div");
    box.id = "mta-typing";
    box.innerHTML = `<span>Đang nhập</span>`;
    body.appendChild(box);
    body.scrollTop = body.scrollHeight;
  }
  function hideTyping(){
    const t = $("#mta-typing");
    if(t) t.remove();
  }

  async function sendUser(text){
    if(sending) return;
    const v = (text||"").trim();
    if(!v) return;
    sending = true;
    addMsg("user", v);
    pushCtx({from:"user",raw:v,type:detectType(v),qty:detectQty(v)});

    // Low effects: rút ngắn delay
    const isMobile = window.innerWidth < 480;
    const baseWait = (isMobile ? 1200 : 1600);
    const jitter = (isMobile ? 600 : 900);
    const wait = (CFG.lowEffects || matchReducedMotion()) ? 200 : (baseWait + Math.random()*jitter);

    showTyping();
    await sleep(wait);

    const ans = await deepAnswer(v);
    hideTyping();
    addMsg("bot", ans);
    pushCtx({from:"bot",raw:ans});
    sending = false;
  }

  function openChat(){
    if(isOpen) return;
    const card = $("#mta-card");
    const backdrop = $("#mta-backdrop");
    const bubble = $("#mta-bubble");

    card.classList.add("open");
    backdrop.classList.add("show");
    bubble.style.display = "none";
    bubble.setAttribute("aria-expanded","true");

    // A11y
    card.setAttribute("aria-hidden","false");
    card.setAttribute("aria-modal","true");

    // Low effects class lên root
    const root = $("#mta-root");
    if(root){
      if(CFG.lowEffects || matchReducedMotion()) root.classList.add("mta-lowfx");
      else root.classList.remove("mta-lowfx");
    }

    isOpen = true;
    renderSess();
    setTimeout(()=>{ const i=$("#mta-in"); if(i) i.focus();}, 120);

    // Focus trap + Esc
    const focusables = card.querySelectorAll('button, a[href], input, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusables[0], last = focusables[focusables.length-1];
    trapHandler = (e)=>{
      if(e.key === "Escape"){ e.preventDefault(); closeChat(); }
      else if(e.key === "Tab"){
        if(focusables.length === 0) return;
        if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
        else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
      }
    };
    card.addEventListener("keydown", trapHandler);
  }

  function closeChat(){
    if(!isOpen) return;
    const card = $("#mta-card");
    const backdrop = $("#mta-backdrop");
    const bubble = $("#mta-bubble");

    card.classList.remove("open");
    backdrop.classList.remove("show");
    bubble.style.display = "flex";
    bubble.setAttribute("aria-expanded","false");

    card.setAttribute("aria-hidden","true");
    card.removeAttribute("aria-modal");

    if(trapHandler){ card.removeEventListener("keydown", trapHandler); trapHandler = null; }
    isOpen = false;
    hideTyping();
  }

  function autoAvoid(){
    const root = $("#mta-root");
    if(!root) return;
    let bottom = 16;
    const blockers = document.querySelector(".qca, #quickcall, .bottom-appbar");
    if(blockers){
      const r = blockers.getBoundingClientRect();
      const gap = window.innerHeight - r.top;
      if(gap < 140) bottom = gap + 72;
    }
    if(window.visualViewport && window.visualViewport.height < window.innerHeight - 120){
      bottom = 110;
    }
    root.style.bottom = bottom + "px";
  }

  function bindEvents(){
    $("#mta-bubble").addEventListener("click", openChat);
    $("#mta-backdrop").addEventListener("click", closeChat);
    $("#mta-close").addEventListener("click", closeChat);
    $("#mta-send").addEventListener("click", ()=>{
      const inp=$("#mta-in");
      const v=inp.value.trim();
      if(!v) return;
      inp.value="";
      sendUser(v);
    });
    $("#mta-in").addEventListener("keydown", e=>{
      if(e.key==="Enter" && !e.shiftKey){
        e.preventDefault();
        const v=e.target.value.trim();
        if(!v) return;
        e.target.value="";
        sendUser(v);
      }
    });
    const track = $("#mta-tag-track");
    if(track){
      track.querySelectorAll("button").forEach(btn=>{
        btn.addEventListener("click", ()=> sendUser(btn.dataset.q||btn.textContent));
      });
    }
    window.addEventListener("resize", autoAvoid, {passive:true});
    window.addEventListener("scroll", autoAvoid, {passive:true});
    if(window.visualViewport) window.visualViewport.addEventListener("resize", autoAvoid, {passive:true});
  }

  function maybeDisableQuickMap(){
    if(!CFG.disableQuickMap) return;
    const m = document.querySelector(".q-map, #mta-header .q-map");
    if(m){
      m.removeAttribute("href");
      m.style.opacity=".4";
      m.style.pointerEvents="none";
    }
  }

  function ready(fn){
    if(document.readyState==="complete"||document.readyState==="interactive") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(()=>{
    // dọn cache mỗi 7 ngày
    const lastClean = parseInt(localStorage.getItem(K.clean)||0);
    if (!lastClean || (Date.now()-lastClean) > 7*24*3600*1000){
      localStorage.removeItem(K.learn);
      localStorage.removeItem(K.ctx);
      localStorage.setItem(K.clean, Date.now());
      console.log("MotoAI v37_6a: cache cleaned");
    }

    // UI
    const wrap = document.createElement("div");
    wrap.innerHTML = HTML;
    document.body.appendChild(wrap.firstElementChild);
    const st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);
    bindEvents();
    autoAvoid();
    maybeDisableQuickMap();

    // autolearn: defer để UI mượt hơn
    if(CFG.autolearn){
      const kickoff = async ()=>{
        try{
          await learnFromSitemapOrSite();
          console.log("%cMotoAI v37_6a — learned from sitemap/site","color:"+CFG.themeColor+";font-weight:bold;");
        }catch(e){ console.warn("MotoAI v37_6a autoLearn err",e); }
      };
      if("requestIdleCallback" in window) requestIdleCallback(kickoff, {timeout:2000});
      else setTimeout(kickoff, 500);
    }    
  });

  // Public API
  window.MotoAI_v37_6 = {
    open: openChat,
    close: closeChat,
    send: sendUser,
    learnNow: ()=>learnFromSitemapOrSite(),
    getIndex: getIndexFlat
  };

})();
