(() => {
  if (window.__cryptoCopilotV209) return;
  window.__cryptoCopilotV209 = true;

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let panel = null;
  let currentTweet = null;
  let currentFab = null;
  let busy = false;

  const style = document.createElement('style');
  style.textContent = `
    .ccp209-fab{width:34px!important;height:34px!important;margin:0 4px!important;border:1px solid rgba(130,145,255,.7)!important;border-radius:11px!important;background:linear-gradient(135deg,#6478ff,#9b69ff)!important;color:#fff!important;font:800 16px/34px Arial!important;cursor:pointer!important;box-shadow:0 7px 22px rgba(90,105,255,.35)!important;z-index:50!important}
    .ccp209-fab:hover{transform:scale(1.07)!important}
    .ccp209-panel{position:fixed;z-index:2147483647;width:370px;max-width:calc(100vw - 20px);max-height:calc(100vh - 20px);overflow:auto;background:#090d14;color:#f4f7fb;border:1px solid rgba(255,255,255,.12);border-radius:20px;box-shadow:0 30px 90px rgba(0,0,0,.7);font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    .ccp209-head{padding:16px;background:linear-gradient(135deg,rgba(105,121,255,.2),rgba(154,105,255,.05));border-bottom:1px solid rgba(255,255,255,.08)}
    .ccp209-brand{display:flex;align-items:center;gap:10px}.ccp209-logo{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:linear-gradient(135deg,#6478ff,#9b69ff);font-size:17px}.ccp209-title{font-weight:850;font-size:15px}.ccp209-sub{font-size:10px;color:#8993a5;margin-top:3px}
    .ccp209-status{margin:11px 12px 4px;padding:9px 11px;border-radius:11px;background:rgba(255,255,255,.035);color:#aeb7c5;font-size:10px}.ccp209-status.ok{color:#75e2a5;background:rgba(50,210,125,.08)}.ccp209-status.err{color:#ff8796;background:rgba(255,70,95,.08)}
    .ccp209-context{margin:10px 12px;padding:11px;border:1px solid rgba(255,255,255,.07);border-radius:13px;color:#aeb7c5;font-size:11px;line-height:1.5;max-height:72px;overflow:hidden}
    .ccp209-body{padding:10px}.ccp209-label{padding:5px 3px 8px;color:#727d90;font-size:9px;font-weight:800;letter-spacing:.13em}.ccp209-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .ccp209-btn,.ccp209-back,.ccp209-action{border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(255,255,255,.035);color:#edf0f5;cursor:pointer}.ccp209-btn{min-height:70px;padding:10px;text-align:left}.ccp209-btn:hover,.ccp209-action:hover,.ccp209-back:hover{background:rgba(105,121,255,.1);border-color:rgba(105,121,255,.3)}.ccp209-icon{display:block;font-size:17px;margin-bottom:6px}.ccp209-btn strong{display:block;font-size:11px}.ccp209-btn span{display:block;color:#748095;font-size:9px;margin-top:3px}
    .ccp209-generate{width:100%;margin-top:9px;padding:12px;border:0;border-radius:12px;background:linear-gradient(135deg,#6579ff,#9a69ff);color:#fff;font-weight:850;cursor:pointer}.ccp209-back{width:100%;margin-top:8px;padding:10px}.ccp209-loading{text-align:center;padding:28px;color:#aeb7c5}.ccp209-dot{display:inline-block;width:5px;height:5px;border-radius:50%;background:#7888ff;margin:12px 3px 0;animation:ccp209p 1s infinite alternate}.ccp209-dot:nth-child(2){animation-delay:.15s}.ccp209-dot:nth-child(3){animation-delay:.3s}@keyframes ccp209p{to{opacity:.2;transform:translateY(-3px)}}
    .ccp209-style{min-height:65px;padding:10px;text-align:left}.ccp209-selected{border-color:rgba(115,130,255,.7)!important;background:rgba(105,121,255,.14)!important}.ccp209-actions{display:flex;gap:7px}.ccp209-action{flex:1;padding:10px}.ccp209-translation{margin:10px!important;padding:12px!important;border-radius:13px!important;background:rgba(105,121,255,.08)!important;border:1px solid rgba(105,121,255,.15)!important;color:#eef1f7!important;direction:rtl!important;line-height:1.9!important}
  `;
  document.documentElement.appendChild(style);

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const tweetText = t => t?.querySelector('[data-testid="tweetText"]')?.innerText?.trim() || '';
  const editor = () => document.querySelector('[role="dialog"] [contenteditable="true"]') || document.querySelector('[data-testid="tweetTextarea_0"][contenteditable="true"]') || document.querySelector('[data-testid="tweetTextarea_0"] [contenteditable="true"]');
  const replyButton = t => t?.querySelector('[data-testid="reply"]');

  function close(){ panel?.remove(); panel=null; currentTweet=null; currentFab=null; busy=false; }
  function position(){ if(!panel||!currentFab)return; const r=currentFab.getBoundingClientRect(),w=Math.min(370,innerWidth-20); panel.style.left=Math.max(10,Math.min(r.left,innerWidth-w-10))+'px'; panel.style.top=Math.max(10,Math.min(r.bottom+8,innerHeight-panel.offsetHeight-10))+'px'; }
  function setStatus(text,type=''){ const e=panel?.querySelector('.ccp209-status'); if(e){e.textContent=text;e.className='ccp209-status '+type;position();} }
  function loading(text){ if(!panel)return; const b=panel.querySelector('.ccp209-body'); if(b)b.innerHTML=`<div class="ccp209-loading">${esc(text)}<br><span class="ccp209-dot"></span><span class="ccp209-dot"></span><span class="ccp209-dot"></span></div>`;position(); }
  function button(icon,title,desc,fn){ const b=document.createElement('button'); b.className='ccp209-btn'; b.innerHTML=`<span class="ccp209-icon">${icon}</span><strong>${esc(title)}</strong><span>${esc(desc)}</span>`; b.onclick=e=>{e.preventDefault();e.stopPropagation();fn();}; return b; }

  function askAI(prompt,system='Write concise, natural Crypto Twitter copy. Output only the requested text.'){
    return new Promise(resolve=>{
      let finished=false;
      const timer=setTimeout(()=>{if(!finished)resolve({ok:false,error:'AI request timed out'});},30000);
      chrome.runtime.sendMessage({type:'CCP_AI',temperature:.8,messages:[{role:'system',content:system},{role:'user',content:prompt}]},r=>{
        if(finished)return; finished=true; clearTimeout(timer);
        if(chrome.runtime.lastError)return resolve({ok:false,error:chrome.runtime.lastError.message});
        resolve(r?.ok?{ok:true,text:r.text||''}:{ok:false,error:r?.error||'AI request failed'});
      });
    });
  }

  async function waitEditor(ms=7000){const end=Date.now()+ms;while(Date.now()<end){const e=editor();if(e)return e;await sleep(100)}return null;}
  async function openReply(t){const existing=editor();if(existing)return existing;const b=replyButton(t);if(!b)return null;b.click();return waitEditor();}
  function insert(e,text){if(!e||e.dataset.ccp209Inserted==='1')return false;e.dataset.ccp209Inserted='1';e.focus();try{document.execCommand('insertText',false,text)}catch{}if(!e.innerText.trim()){try{const r=document.createRange();r.selectNodeContents(e);r.collapse(false);const s=getSelection();s.removeAllRanges();s.addRange(r);document.execCommand('insertText',false,text)}catch{}}e.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:text}));return true;}

  async function directReply(t,styleName){
    if(busy)return; busy=true; const text=tweetText(t); if(!text){setStatus('❌ Tweet text not found','err');busy=false;return;}
    loading('Generating reply…');
    const spec={short:'under 12 words, punchy',smart:'under 25 words, insightful and natural',professional:'under 25 words, polished and credible'}[styleName];
    const r=await askAI(`Reply naturally to this Tweet. Style: ${spec}. One reply only. No hashtags.\n\n${text}`);
    if(!r.ok){setStatus('❌ '+r.error,'err');busy=false;return;}
    loading('Opening X reply…'); const e=await openReply(t); if(!e){setStatus('❌ X reply box not found','err');busy=false;return;}
    if(insert(e,r.text)){setStatus('✓ Reply inserted','ok');await sleep(500);close();}else{setStatus('❌ Could not insert reply','err');busy=false;}
  }

  async function newPost(text,doneLabel='Post inserted'){
    const b=document.querySelector('[data-testid="SideNav_NewTweet_Button"]')||document.querySelector('[data-testid="SideNav_NewTweet_Button"]'); b?.click(); await sleep(500); const e=await waitEditor(); if(!e){setStatus('❌ X composer not found','err');busy=false;return false} if(insert(e,text)){setStatus('✓ '+doneLabel,'ok');await sleep(500);close();return true} setStatus('❌ Insert failed','err');busy=false;return false;
  }

  function smartReply(t){
    panel.innerHTML=`<div class="ccp209-head"><div class="ccp209-brand"><div class="ccp209-logo">⚡</div><div><div class="ccp209-title">Smart Reply</div><div class="ccp209-sub">Choose style → Generate → direct to X</div></div></div></div><div class="ccp209-body"><div class="ccp209-grid" id="styles"></div><button class="ccp209-generate" id="gen">✨ Generate Reply</button><button class="ccp209-back" id="back">← Back</button></div>`;
    let selected='smart';const g=panel.querySelector('#styles');
    [['◉','Short','Fast & punchy','short'],['✦','Smart','Insightful & natural','smart'],['◆','Professional','Polished & credible','professional']].forEach(([i,a,d,k])=>{const b=button(i,a,d,()=>{selected=k;g.querySelectorAll('button').forEach(x=>x.classList.remove('ccp209-selected'));b.classList.add('ccp209-selected')});b.classList.add('ccp209-style');g.appendChild(b);if(k==='smart')b.classList.add('ccp209-selected')});
    panel.querySelector('#gen').onclick=()=>directReply(t,selected);panel.querySelector('#back').onclick=()=>openPanel(t,currentFab);position();
  }

  async function translate(t){if(busy)return;busy=true;const text=tweetText(t);if(!text){setStatus('❌ Tweet text not found','err');busy=false;return}loading('Translating…');const r=await askAI(`Translate into natural Persian. Preserve crypto terms, names and tone. Output only the translation.\n\n${text}`,'You are a professional Persian translator for Crypto Twitter.');if(!r.ok){setStatus('❌ '+r.error,'err');busy=false;return}let box=t.querySelector('.ccp209-translation');if(!box){box=document.createElement('div');box.className='ccp209-translation';t.appendChild(box)}box.textContent=r.text;close();}

  async function rewrite(t){if(busy)return;busy=true;const text=tweetText(t);loading('Rewriting…');const r=await askAI(`Rewrite this Tweet to be clearer, sharper and more engaging while preserving its meaning. Output only the rewritten post.\n\n${text}`);if(!r.ok){setStatus('❌ '+r.error,'err');busy=false;return}await newPost(r.text,'Rewritten post inserted');}
  async function thread(t){if(busy)return;busy=true;const text=tweetText(t);loading('Building 3-post thread…');const r=await askAI(`Turn this idea into exactly 3 connected Crypto Twitter posts. Number them 1/3, 2/3, 3/3. Output only the thread.\n\n${text}`);if(!r.ok){setStatus('❌ '+r.error,'err');busy=false;return}await newPost(r.text,'Thread inserted');}
  async function quote(t){if(busy)return;busy=true;const text=tweetText(t);loading('Generating quote…');const r=await askAI(`Write one original quote-tweet comment about this Tweet. Under 25 words. Add a genuine opinion. Output only the comment.\n\n${text}`);if(!r.ok){setStatus('❌ '+r.error,'err');busy=false;return}const rb=t.querySelector('[data-testid="retweet"]');if(rb){rb.click();await sleep(500);const menu=[...document.querySelectorAll('[role="menuitem"]')].find(x=>/Quote/i.test(x.innerText||''));if(menu){menu.click();const e=await waitEditor();if(e&&insert(e,r.text)){setStatus('✓ Quote inserted','ok');await sleep(500);close();return}}}await newPost(r.text,'Quote text inserted');}
  async function trends(){if(busy)return;const links=[...document.querySelectorAll('a[href*="/search?q="]')].map(a=>(a.innerText||'').trim()).filter(Boolean).slice(0,8);if(!links.length){setStatus('Open X Explore → Trending first','err');return}panel.querySelector('.ccp209-body').innerHTML=links.map((x,i)=>`<button class="ccp209-back trend209" data-i="${i}">📈 ${esc(x)}</button>`).join('');panel.querySelectorAll('.trend209').forEach((b,i)=>b.onclick=async()=>{if(busy)return;busy=true;loading('Generating trend post…');const r=await askAI(`Write one concise Crypto Twitter post around this visible X trend: ${links[i]}. Do not invent facts. Output only the post.`);if(!r.ok){setStatus('❌ '+r.error,'err');busy=false;return}await newPost(r.text,'Trend post inserted')});position();}

  function openPanel(t,fab){close();currentTweet=t;currentFab=fab;panel=document.createElement('div');panel.className='ccp209-panel';const text=tweetText(t),preview=text.length>180?text.slice(0,180)+'…':text;panel.innerHTML=`<div class="ccp209-head"><div class="ccp209-brand"><div class="ccp209-logo">✦</div><div><div class="ccp209-title">Crypto Copilot</div><div class="ccp209-sub">AI tools for Crypto Twitter</div></div></div></div>${preview?`<div class="ccp209-context">${esc(preview)}</div>`:''}<div class="ccp209-status">Checking API…</div><div class="ccp209-body"><div class="ccp209-label">AI TOOLS</div><div class="ccp209-grid" id="grid"></div><button class="ccp209-back" id="diag">🧪 Test API connection</button></div>`;document.body.appendChild(panel);const g=panel.querySelector('#grid');g.appendChild(button('⚡','Smart Reply','Generate and insert directly',()=>smartReply(t)));g.appendChild(button('🔁','Smart Quote','Quote comment directly',()=>quote(t)));g.appendChild(button('🌍','Translate','Persian translation',()=>translate(t)));g.appendChild(button('✎','Rewrite','Rewrite and insert',()=>rewrite(t)));g.appendChild(button('🧵','Thread','Create 3 connected posts',()=>thread(t)));g.appendChild(button('📈','Trend Radar','Use visible X trends',()=>trends()));panel.querySelector('#diag').onclick=async()=>{if(busy)return;busy=true;loading('Testing API…');const r=await askAI('Reply exactly CCP_OK','Return exactly CCP_OK');busy=false;if(r.ok)setStatus('✓ API connected','ok');else setStatus('❌ '+r.error,'err')};chrome.storage.local.get('openrouter_api_key',d=>setStatus(d.openrouter_api_key?'✓ API connected':'⚠️ API not configured',d.openrouter_api_key?'ok':'err'));position();}

  function attach(t){if(t.querySelector('.ccp209-fab'))return;const host=t.querySelector('[role="group"]')||t.querySelector('[data-testid="reply"]')?.parentElement;if(!host)return;const b=document.createElement('button');b.className='ccp209-fab';b.type='button';b.textContent='✦';b.title='Crypto Copilot';b.onclick=e=>{e.preventDefault();e.stopPropagation();openPanel(t,b)};host.appendChild(b)}
  function scan(){document.querySelectorAll('article[data-testid="tweet"]').forEach(attach)}
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
  scan();
  console.log('🚀 Crypto Copilot V2.0.9 loaded');
})();
