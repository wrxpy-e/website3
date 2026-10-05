(async()=>{
  const gate=$('#gate'),panel=$('#panel');
  const errorMap={unauthorized:'That Discord account is not the site owner.',invalid_state:'The Discord sign-in expired. Try again.',discord_token:'Discord sign-in could not be completed.',discord_user:'Discord could not verify the account.'};
  const params=new URLSearchParams(location.search);
  const ok=await SITE.admin();
  if(!ok){
    gate.hidden=false;
    const msg=errorMap[params.get('error')]||'Only the site owner can access this panel.';
    $('p',gate).textContent=msg;
    const b=document.createElement('a');b.className='btn solid';b.href='/auth/discord';b.textContent='verify with discord';b.style.display='inline-flex';b.style.marginTop='18px';gate.append(b);
    return;
  }
  panel.hidden=false;
  const toastEl=$('#toast');let tt;
  const toast=(m,bad)=>{toastEl.textContent=m;toastEl.className='toast show'+(bad?' bad':'');clearTimeout(tt);tt=setTimeout(()=>toastEl.className='toast',3200)};
  const api=async(url,opts={})=>{const r=await fetch(url,{...opts,headers:{'Content-Type':'application/json',...(opts.headers||{})}});let d={};try{d=await r.json()}catch(e){}if(r.status===401){location.href='/auth/discord';throw new Error('session expired')}if(!r.ok)throw new Error(d.error||'request failed');return d};
  const run=async(fn,msg)=>{try{await fn();toast(msg||'saved')}catch(e){toast('Could not save: '+(e.message||'error'),true)}};
  const pairs=t=>t.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{const [a,...b]=l.split('|');return {t:a.trim(),d:b.join('|').trim()}});
  const unpairs=a=>(a||[]).map(x=>x.t+(x.d?' | '+x.d:'')).join('\n');
  const simple=['name','role','bio','statusText','avatar','discord','roblox','quote','quoteBy','cta_title','cta_text'];

  /* profile */
  let cfg=SITE.DEF_CFG;
  try{const d=await api('/api/admin/config');cfg={...SITE.DEF_CFG,...(d.config||{})}}catch(e){}
  simple.forEach(k=>$('#f-'+k).value=cfg[k]||'');$('#f-status').value=cfg.status==='closed'?'closed':'open';
  $('#f-specialties').value=unpairs(cfg.specialties);$('#f-process').value=unpairs(cfg.process);
  $('#saveCfg').onclick=()=>{
    const c={status:$('#f-status').value,specialties:pairs($('#f-specialties').value),process:pairs($('#f-process').value)};
    simple.forEach(k=>c[k]=$('#f-'+k).value.trim());
    for(const k of ['discord','roblox','avatar'])if(c[k]&&!/^https?:\/\//i.test(c[k]))return toast(k+' must start with https://',true);
    run(()=>api('/api/admin/config',{method:'PUT',body:JSON.stringify(c)}),'profile saved — live now');
  };
  $('#resetCfg').onclick=function(){if(!this.dataset.sure){this.dataset.sure=1;this.textContent='click again to confirm';setTimeout(()=>{delete this.dataset.sure;this.textContent='reset to defaults'},3000);return}
    delete this.dataset.sure;this.textContent='reset to defaults';run(async()=>{await api('/api/admin/config',{method:'DELETE'});const c=SITE.DEF_CFG;simple.forEach(k=>$('#f-'+k).value=c[k]||'');$('#f-status').value='open';$('#f-specialties').value=unpairs(c.specialties);$('#f-process').value=unpairs(c.process)},'profile reset')};

  /* showcase */
  let items=[];const list=$('#itemList');
  async function refreshItems(){const d=await api('/api/admin/showcase');items=(d.items||[]).sort((a,b)=>(a.order||0)-(b.order||0));list.replaceChildren(...items.map(row));$('#importStarter').hidden=items.length>0;if(!items.length){const p=document.createElement('p');p.className='hint';p.textContent='No pieces saved yet, so visitors see the starter layout. Add your first piece above, or import the starter pieces to edit them.';list.append(p)}}
  function row(it,idx){
    const r=document.createElement('div');r.className='item'+(it.hidden?' off':'');
    const th=document.createElement('div');th.className='thumb';const u=safeUrl(it.img);if(u){const im=document.createElement('img');im.src=u;im.alt='';th.append(im)}
    const ti=document.createElement('input');ti.value=it.title||'';ti.onchange=()=>run(()=>api('/api/admin/showcase',{method:'PUT',body:JSON.stringify({id:it.id,title:ti.value.trim()})}));
    const ca=document.createElement('select');SITE.CATS.forEach(c=>{const o=document.createElement('option');o.textContent=c;ca.append(o)});ca.value=it.cat;ca.onchange=()=>run(()=>api('/api/admin/showcase',{method:'PUT',body:JSON.stringify({id:it.id,cat:ca.value})}));
    const mk=(txt,fn,cls)=>{const b=document.createElement('button');b.type='button';b.className='ib '+(cls||'');b.textContent=txt;b.onclick=fn;return b};
    const swap=async d=>{const o=items[idx+d];if(!o)return;await run(async()=>{await api('/api/admin/showcase',{method:'PUT',body:JSON.stringify({id:it.id,order:o.order})});await api('/api/admin/showcase',{method:'PUT',body:JSON.stringify({id:o.id,order:it.order})});await refreshItems()},'reordered')};
    const del=mk('delete',function(){if(!this.dataset.sure){this.dataset.sure=1;this.textContent='sure?';setTimeout(()=>{delete this.dataset.sure;this.textContent='delete'},2500);return}run(async()=>{await api('/api/admin/showcase?id='+encodeURIComponent(it.id),{method:'DELETE'});await refreshItems()},'deleted')},'danger');
    r.append(th,ti,ca,mk('↑',()=>swap(-1)),mk('↓',()=>swap(1)),mk(it.hidden?'show':'hide',()=>run(async()=>{await api('/api/admin/showcase',{method:'PUT',body:JSON.stringify({id:it.id,hidden:!it.hidden})});await refreshItems()})),del);return r;
  }
  await refreshItems();
  $('#importStarter').onclick=()=>run(async()=>{let o=Date.now();for(const it of SITE.DEF_ITEMS.filter(x=>x.img))await api('/api/admin/showcase',{method:'POST',body:JSON.stringify({title:it.title,cat:it.cat,img:it.img,hidden:false,order:o++})});await refreshItems()},'starter pieces imported');

  async function upload(file){const fd=new FormData();fd.append('file',file);const r=await fetch('/api/admin/upload',{method:'POST',body:fd});let d={};try{d=await r.json()}catch(e){}if(r.status===401){location.href='/auth/discord';throw new Error('session expired')}if(!r.ok)throw new Error(d.error||'upload failed');return d.src}
  let uploaded='';
  $('#n-file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{uploaded=await upload(f);$('#n-url').value='';$('#n-url').placeholder='✓ '+f.name+' uploaded';toast('image uploaded')}catch(err){uploaded='';toast(err.message,true)}};
  $('#addItem').onclick=()=>{const title=$('#n-title').value.trim(),link=$('#n-url').value.trim(),img=uploaded||link;if(!title)return toast('give it a title',true);if(!img)return toast('add an image link or upload one',true);if(!uploaded&&!/^https?:\/\//i.test(img))return toast('image link must start with https://',true);run(async()=>{await api('/api/admin/showcase',{method:'POST',body:JSON.stringify({title,cat:$('#n-cat').value,img,hidden:false,order:Date.now()})});$('#n-title').value='';$('#n-url').value='';$('#n-url').placeholder='Image link (https://…) — or upload →';$('#n-file').value='';uploaded='';await refreshItems()},'piece added')};

  /* music */
  let musicUpload='';
  $('#music-file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{musicUpload=await upload(f);$('#music-upload-name').textContent='✓ '+f.name;toast('audio uploaded')}catch(err){musicUpload='';e.target.value='';toast(err.message,true)}};
  $('#addTrack').onclick=()=>{const title=$('#music-title').value.trim(),link=$('#music-url').value.trim(),src=musicUpload||link;if(!title)return toast('give the track a title',true);if(!src)return toast('upload an audio file or add a direct link',true);if(!musicUpload&&!/^https?:\/\//i.test(src))return toast('audio link must start with https://',true);const box=$('#f-tracks');box.value+=(box.value?'\n':'')+title+' | '+src;$('#music-title').value='';$('#music-url').value='';$('#music-file').value='';$('#music-upload-name').textContent='';musicUpload='';toast('track added — save music to publish')};
  try{const d=await api('/api/admin/music');$('#f-tracks').value=d.music?(d.music.tracks||[]).map(t=>t.title+' | '+t.src).join('\n'):''}catch(e){}
  $('#saveTracks').onclick=()=>{const tracks=pairs($('#f-tracks').value).map(x=>({title:x.t,src:x.d}));if(!tracks.length)return $('#resetTracks').click();if(tracks.some(t=>!/^https?:\/\//i.test(t.src)&&!/^\/api\/assets\//i.test(t.src)&&!/^data:audio\//i.test(t.src)))return toast('each line needs a direct link or uploaded audio file',true);run(()=>api('/api/admin/music',{method:'PUT',body:JSON.stringify({tracks})}),'music saved')};
  $('#resetTracks').onclick=()=>run(async()=>{await api('/api/admin/music',{method:'DELETE'});$('#f-tracks').value=''},'using built-in tracks');

  const logout=document.createElement('a');logout.className='btn ghost';logout.href='/api/logout';logout.textContent='log out';document.querySelector('.admin-head')?.append(logout);
})();
