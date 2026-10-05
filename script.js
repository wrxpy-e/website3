const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const safeUrl=u=>/^(https?:\/\/|data:(?:image|audio)\/|assets\/)/i.test(u||'')?u:'';
const safeLink=u=>/^https?:\/\//i.test(u||'')?u:'';

/* ---------- core effects ---------- */
const nav=$('.nav'),pointer=$('.pointer');
addEventListener('scroll',()=>nav?.classList.toggle('scrolled',scrollY>45),{passive:true});
addEventListener('pointermove',e=>pointer?.animate({left:e.clientX+'px',top:e.clientY+'px'},{duration:120,fill:'forwards'}));
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.08});
function observeReveals(root=document){$$('.reveal:not([data-obs])',root).forEach((el,i)=>{el.dataset.obs=1;el.style.transitionDelay=Math.min(i*.06,.3)+'s';io.observe(el)})}
observeReveals();
$$('.magnetic').forEach(el=>{el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();el.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.07}px,${(e.clientY-r.top-r.height/2)*.07}px)`});el.addEventListener('pointerleave',()=>el.style.transform='')});

const loader=$('.loader');
if(loader){addEventListener('load',()=>setTimeout(()=>loader.classList.add('done'),1300));setTimeout(()=>loader.classList.add('done'),3500)}

const wipe=$('.wipe');
document.addEventListener('click',e=>{const a=e.target.closest('a[href$=".html"]');if(!a||!wipe||e.metaKey||e.ctrlKey||a.target==='_blank')return;
  e.preventDefault();wipe.classList.add('go');setTimeout(()=>location.href=a.href,480)});
addEventListener('pageshow',e=>{if(e.persisted&&wipe)wipe.classList.remove('go')});

/* light that follows the cursor (all cards and tiles) */
if(matchMedia('(hover:hover)').matches&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
  let lightPanel=null;
  const reset=c=>{if(!c)return;['--lx','--ly'].forEach(p=>c.style.removeProperty(p))};
  document.addEventListener('pointermove',e=>{
    const c=e.target?.closest?.('.card,.tile')||null;
    pointer?.classList.toggle('on-panel',!!c);
    if(c&&c!==lightPanel){reset(lightPanel);lightPanel=c}
    if(!lightPanel)return;
    const r=lightPanel.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
    lightPanel.style.setProperty('--lx',(x*100)+'%');lightPanel.style.setProperty('--ly',(y*100)+'%');
  },{passive:true});
  document.addEventListener('pointerleave',()=>{reset(lightPanel);lightPanel=null;pointer?.classList.remove('on-panel')});
}

/* ---------- Cloudflare site data layer ---------- */
const SITE=(()=>{
  const CATS=['Clothing','Liveries','Logos','Graphics'];
  const DEF_CFG={
    name:'wrxpy',role:'Roblox clothing & graphics',
    bio:'I design clean, recognisable uniforms, liveries and graphics for communities that want a look of their own.',
    status:'open',statusText:'open for commissions',
    quote:'The details are the design.',quoteBy:'wrxpy',
    discord:'https://discord.gg/tNuhT86Av',roblox:'',avatar:'',
    cta_title:'Need a uniform, livery or logo?',
    cta_text:'Message me on Discord with the brief. Slots are limited.',
    specialties:[{t:'Clothing',d:'Uniforms, apparel and full department packages.'},{t:'Liveries',d:'Vehicle graphics built around your branding.'},{t:'Logos & graphics',d:'Badges, banners, decals and marks.'}],
    process:[{t:'Brief',d:'Understand the department, look and direction.'},{t:'Build',d:'Draft options and refine the strongest one.'},{t:'Deliver',d:'Polish the details and hand over clean files.'}]
  };
  const DEF_ITEMS=[
    {title:'Police uniform set',cat:'Clothing',img:'assets/police-uniform-01.png'},
    {title:'Coming soon',cat:'Graphics',ph:'g1 tall'},
    {title:'Uniform details',cat:'Clothing',img:'assets/police-uniform-02.png'},
    {title:'Livery concept',cat:'Liveries',ph:'g2 sq'},
    {title:'Department logo',cat:'Logos',ph:'g3 sq'},
    {title:'Banner / header',cat:'Graphics',ph:'g4 banner'},
    {title:'Badge & patch set',cat:'Clothing',ph:'g5 tall'},
    {title:'Vehicle livery',cat:'Liveries',ph:'g2 banner'}
  ];
  const DEF_TRACKS=[{title:'night shift',src:'assets/music/night-shift.mp3'},{title:'after hours',src:'assets/music/after-hours.mp3'}];
  let data={config:null,showcase:null,music:null};
  let readyResolve; const ready=new Promise(r=>readyResolve=r);
  async function load(){
    try{const r=await fetch('/api/site',{cache:'no-store'});if(r.ok)data=await r.json()}catch(e){}
    readyResolve(data);
  }
  load();
  const watchDoc=(path,fn,def)=>{
    fn(def,false);
    ready.then(()=>{
      if(path==='site/config')fn(data.config||def,!!data.config);
      if(path==='site/music')fn(data.music||def,!!data.music);
    });
  };
  const watchItems=fn=>ready.then(()=>fn(data.showcase||null));
  const admin=async()=>{try{const r=await fetch('/api/session',{cache:'no-store'});return r.ok&&(await r.json()).authenticated}catch(e){return false}};
  return {CATS,DEF_CFG,DEF_ITEMS,DEF_TRACKS,watchDoc,watchItems,admin,ready,get db(){return null}};
})();
SITE.admin().then(()=>{const l=$('#adminLink');if(l)l.hidden=true});

/* config -> page */
SITE.watchDoc('site/config',d=>{
  const c={...SITE.DEF_CFG,...d};
  $$('[data-cfg]').forEach(el=>el.textContent=c[el.dataset.cfg]||'');
  $$('[data-cfg-href]').forEach(el=>{const u=safeLink(c[el.dataset.cfgHref]);el.hidden=!u;if(u)el.href=u});
  const st=$('.status');if(st){st.classList.toggle('open',c.status!=='closed');st.classList.toggle('closed',c.status==='closed')}
  const av=$('.avatar img');if(av){const u=safeUrl(c.avatar);av.hidden=!u;if(u)av.src=u;const b=$('.avatar [data-initial]');if(b){b.hidden=!!u;b.textContent=(c.name||'w').trim().charAt(0).toLowerCase()}}
  const list=(sel,arr,mk)=>{const box=$(sel);if(!box)return;box.replaceChildren(...(arr||[]).map(mk))};
  list('#specs',c.specialties,(s,i)=>{const d=document.createElement('div');d.className='spec';const n=document.createElement('span');n.textContent=String(i+1).padStart(2,'0');const b=document.createElement('b');b.textContent=s.t;const p=document.createElement('p');p.textContent=s.d||'';d.append(n,b,p);return d});
  list('#process',c.process,(s,i)=>{const li=document.createElement('li');const n=document.createElement('span');n.textContent=String(i+1).padStart(2,'0');const w=document.createElement('div');const b=document.createElement('b');b.textContent=s.t;const p=document.createElement('p');p.textContent=s.d||'';w.append(b,p);li.append(n,w);return li});
},SITE.DEF_CFG);

/* ---------- showcase wall ---------- */
const wall=$('#wall');
if(wall){
  let filter='all',items=SITE.DEF_ITEMS;
  const lb=$('.lightbox'),lbi=$('img',lb),cap=$('.lb-cap',lb);
  const closeLb=()=>{lb.classList.remove('open');lb.setAttribute('aria-hidden','true')};
  function render(){
    wall.replaceChildren(...items.filter(it=>!it.hidden).map((it,i)=>{
      const t=document.createElement('button');t.type='button';t.className='tile reveal';t.dataset.cat=it.cat;if(filter!=='all'&&it.cat!==filter)t.classList.add('hide');
      const u=safeUrl(it.img);
      if(u){const im=document.createElement('img');im.src=u;im.alt=it.title||'';im.loading='lazy';t.append(im)}
      else{const ph=document.createElement('div');ph.className='ph '+(it.ph||'sq g1');const s=document.createElement('span');s.textContent='coming soon';ph.append(s);t.append(ph)}
      const m=document.createElement('div');m.className='tile-meta';const a=document.createElement('span');a.textContent=String(i+1).padStart(2,'0')+' / '+String(it.cat||'').toLowerCase();const b=document.createElement('b');b.textContent=it.title||'';m.append(a,b);t.append(m);
      t.addEventListener('click',()=>{cap.textContent=(it.title||'').toUpperCase()+' / '+String(it.cat||'').toUpperCase();if(u){lbi.src=u;lbi.style.display=''}else{lbi.removeAttribute('src');lbi.style.display='none'}lb.classList.add('open');lb.setAttribute('aria-hidden','false')});
      return t}));
    observeReveals(wall);
  }
  $$('.chip').forEach(c=>c.addEventListener('click',()=>{$$('.chip').forEach(x=>x.classList.toggle('on',x===c));filter=c.dataset.filter;$$('.tile',wall).forEach(t=>t.classList.toggle('hide',filter!=='all'&&t.dataset.cat!==filter))}));
  lb.addEventListener('click',e=>{if(e.target===lb||e.target.classList.contains('lb-close'))closeLb()});
  addEventListener('keydown',e=>{if(e.key==='Escape')closeLb()});
  SITE.watchItems(list=>{items=list||SITE.DEF_ITEMS;render()});
}

/* ---------- music player (persists across pages) ---------- */
const TRACKS=[...SITE.DEF_TRACKS];
let setTracks=()=>{};
(function(){
  const store={get(k){try{return sessionStorage.getItem('wp_'+k)}catch(e){return null}},set(k,v){try{sessionStorage.setItem('wp_'+k,v)}catch(e){}}};
  const el=document.createElement('div');el.className='player';
  el.innerHTML=`<div class="pl-top"><div class="pl-art"><i></i><i></i><i></i></div>
  <div class="pl-info"><small>NOW PLAYING</small><b></b></div>
  <button class="pl-btn" data-a="prev" aria-label="previous">⏮</button><button class="pl-btn main" data-a="play" aria-label="play">▶</button><button class="pl-btn" data-a="next" aria-label="next">⏭</button><button class="pl-btn" data-a="hide" aria-label="hide music player">×</button></div>
  <div class="pl-bar"><span class="t1">0:00</span><input type="range" min="0" max="1000" value="0" aria-label="seek"><span class="t2">0:00</span></div>
  <div class="pl-vol">🔈<input type="range" class="vol" min="0" max="100" value="60" aria-label="volume"></div>`;
  document.body.appendChild(el);
  const restore=document.createElement('button');restore.className='player-restore';restore.type='button';restore.textContent='♫';restore.setAttribute('aria-label','show music player');restore.hidden=true;document.body.appendChild(restore);
  const audio=new Audio();audio.preload='metadata';
  const title=$('b',el),play=$('[data-a=play]',el),seek=$('.pl-bar input',el),vol=$('.vol',el),t1=$('.t1',el),t2=$('.t2',el);
  let i=Math.min(+store.get('i')||0,TRACKS.length-1);
  const fmt=s=>isFinite(s)?Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0'):'0:00';
  function load(n,t=0){if(!TRACKS.length)return;i=(n+TRACKS.length)%TRACKS.length;audio.src=TRACKS[i].src;title.textContent=TRACKS[i].title||'untitled';store.set('i',i);if(t)audio.addEventListener('loadedmetadata',()=>{audio.currentTime=t},{once:true})}
  function setUI(){const on=!audio.paused;el.classList.toggle('playing',on);play.textContent=on?'❚❚':'▶';play.setAttribute('aria-label',on?'pause':'play');store.set('on',on?1:0)}
  audio.volume=(+store.get('vol')||60)/100;vol.value=audio.volume*100;
  load(i,+store.get('t')||0);
  if(store.get('min')==='1'||(innerWidth<800&&store.get('min')===null))el.classList.add('min');
  if(store.get('hidden')==='1'){el.classList.add('hidden');restore.hidden=false;}
  if(store.get('on')==='1')audio.play().catch(()=>{});
  audio.addEventListener('play',setUI);audio.addEventListener('pause',setUI);
  audio.addEventListener('ended',()=>{load(i+1);audio.play().catch(()=>{})});
  audio.addEventListener('timeupdate',()=>{seek.value=audio.duration?audio.currentTime/audio.duration*1000:0;t1.textContent=fmt(audio.currentTime);t2.textContent=fmt(audio.duration);store.set('t',audio.currentTime)});
  seek.addEventListener('input',()=>{if(audio.duration)audio.currentTime=seek.value/1000*audio.duration});
  vol.addEventListener('input',()=>{audio.volume=vol.value/100;store.set('vol',vol.value)});
  el.addEventListener('click',e=>{const a=e.target.closest('[data-a]')?.dataset.a;if(!a){if(el.classList.contains('min')&&e.target.closest('.pl-top')){el.classList.remove('min');store.set('min',0)}return}
    const was=!audio.paused;
    if(a==='play')audio.paused?audio.play().catch(()=>{}):audio.pause();
    if(a==='next'){load(i+1);if(was)audio.play().catch(()=>{})}
    if(a==='prev'){if(audio.currentTime>3)audio.currentTime=0;else{load(i-1);if(was)audio.play().catch(()=>{})}}
    if(a==='min'){el.classList.toggle('min');store.set('min',el.classList.contains('min')?1:0)}
    if(a==='hide'){el.classList.add('hidden');restore.hidden=false;store.set('hidden',1)}});
  restore.addEventListener('click',()=>{el.classList.remove('hidden');restore.hidden=true;store.set('hidden',0)});
  setTracks=list=>{
    const clean=(list||[]).map(t=>({title:String(t.title||'untitled'),src:safeUrl(t.src)})).filter(t=>t.src);
    const next=clean.length?clean:SITE.DEF_TRACKS;
    if(JSON.stringify(next)===JSON.stringify(TRACKS))return;
    const cur=TRACKS[i]?.src,was=!audio.paused;TRACKS.length=0;TRACKS.push(...next);
    const idx=TRACKS.findIndex(t=>t.src===cur);
    if(idx>=0){i=idx;title.textContent=TRACKS[i].title}else{load(0);if(was)audio.play().catch(()=>{})}
  };
  setUI();
})();
SITE.watchDoc('site/music',(d,ex)=>setTracks(ex?d.tracks:null),{});
