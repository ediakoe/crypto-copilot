(() => {
  if (window.__cryptoCopilotV204) return;
  window.__cryptoCopilotV204 = true;

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let menu = null;
  let anchor = null;

  const css = document.createElement('style');
  css.textContent = `
    .ccp204-anchor{position:relative!important}
    .ccp204-fab{width:32px!important;height:32px!important;border:1px solid rgba(140,150,255,.7)!important;border-radius:10px!important;background:linear-gradient(135deg,#6478ff,#9b6cff)!important;color:#fff!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;font:900 15px/1 Arial,sans-serif!important;cursor:pointer!important;padding:0!important;margin:0 4px!important;box-shadow:0 4px 18px rgba(100,110,255,.35)!important;z-index:20!important}
    .ccp204-overlay{position:absolute!important;right:12px!important;top:8px!important;z-index:50!important}
    .ccp204-menu{position:fixed!important;z-index:2147483647!important;width:340px!important;max-width:calc(100vw - 16px)!important;background:#0b0e15!important;color:#f5f7fb!important;border:1px solid rgba(255,255,255,.14)!important;border-radius:18px!important;box-shadow:0 24px 80px rgba(0,0,0,.65)!important;overflow:hidden!important;font-family:Arial,sans-serif!important}
    .ccp204-head{padding:15px 16px!important;background:linear-gradient(135deg,rgba(100,120,255,.22),rgba(155,108,255,.08))!important;border-bottom:1px solid rgba(255,255,255,.08)!important}
    .ccp204-title{display:flex;align-items:center;gap:9px;font-size:14px;font-weight:800}.ccp204-logo{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:linear-gradient(135deg,#6478ff,#9b6cff)}.ccp204-sub{margin:4px 0 0 39px;color:#8993a5;font-size:10px}
    .ccp204-body{padding:8px!important}.ccp204-context{margin:10px;padding:10px;border-radius:11px;background:rgba(255,255,255,.04);color:#aeb7c6;font-size:11px;line-height:1.45;max-height:62px;overflow:hidden}
    .ccp204-item{width:100%;display:flex;align-items:center;gap:10px;padding:10px;border:0;border-radius:11px;background:transparent;color:#eef1f6;text-align:left;cursor:pointer}.ccp204-item:hover{background:rgba(255,255,255,.07)}.ccp204-icon{width:30px;height:30px;border-radius:8px;background:rgba(255,255,255,.06);display:grid;place-items:center}.ccp204-label{font-size:12px;font-weight:700}.ccp204-desc{font-size:10px;color:#7f899b;margin-top:2px}.ccp204-arrow{margin-left:auto;color:#687386}
    .ccp204-status{margin:10px;padding:10px;border-radius:10px;background:rgba(255,255,255,.04);font-size:11px;line-height:1.45;color:#aab3c2}.ccp204-ok{color:#71e2a1;background:rgba(50,210,120,.08)}.ccp204-err{color:#ff8b98;background:rgba(255,70,95,.08)}.ccp204-loading{padding:25px;text-align:center;color:#aab3c2;font-size:11px}.ccp204-result{margin:10px;padding:12px;border-radius:11px;background:rgba(100,120,255,.09);white-space:pre-wrap;font-size:12px;line-height:1.55}.ccp204-actions{display:flex;gap:7px;margin-top:10px}.ccp204-mini{flex:1;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:#eee;cursor:pointer}
  `;
  document.documentElement.appendChild(css);

  const esc = s => String(s || '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const textOf = article => article?.querySelector('[data-testid="tweetText"]')?.innerText?.trim() || '';
  const replyBtn = article => article?.querySelector('[data-testid="reply"]');
  const retweetBtn = article => article?.querySelector('[data-testid="retweet"]');
  const editor = () => document.querySelector('[role="dialog"] [contenteditable="true"]') || document.querySelector('[data-testid="tweetTextarea_0"] [contenteditable="true"]') || document.querySelector('[contenteditable="true"][data-testid="tweetTextarea_0"]');

  const apiState = async () => {
    try { const x = await chrome.storage.local.get('openrouter_api_key'); return !!x.openrouter_api_key; }
    catch { return false; }
  };

  function close(){ if(menu) menu.remove(); menu=null; anchor=null; }
  function place(){ if(!menu || !anchor) return; const r=anchor.getBoundingClientRect(); const w=340; const h=menu.offsetHeight||420; menu.style.left=Math.max(8,Math.min(r.left,innerWidth-w-8))+'px'; menu.style.top=Math.max(8,Math.min(r.bottom+7,innerHeight-h-8))+'px'; }
  function status(msg, ok=false){ if(!menu)return; let el=menu.querySelector('.ccp204-status'); if(!el){el=document.createElement('div');el.className='ccp204-status';menu.appendChild(el)} el.className='ccp204-status '+(ok?'ccp204-ok':'ccp204-err');el.textContent=msg;place(); }
  function loading(msg){ if(menu) menu.innerHTML='<div class="ccp204-loading">'+esc(msg)+'<br><br>● ● ●</div>'; }

  function ask(messages, temperature=.8){
    return new Promise(resolve => {
      chrome.runtime.sendMessage({type:'CCP_AI',messages,temperature}, res => {
        if(chrome.runtime.lastError) return resolve({ok:false,error:chrome.runtime.lastError.message});
        resolve(res?.ok ? {ok:true,text:res.text||''} : {ok:false,error:res?.error||'Unknown AI error'});
      });
    });
  }

  async function waitEditor(){ for(let i=0;i<70;i++){const e=editor();if(e)return e;await sleep(100)} return null; }
  async function insert(text){
    const e=await waitEditor(); if(!e)return {ok:false,error:'X composer was not found.'};
    e.focus();
    try { document.execCommand('insertText',false,text); } catch {}
    e.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:text}));
    if(!(e.innerText||'').trim()) return {ok:false,error:'X rejected the generated text.'};
    return {ok:true};
  }

  function item(icon,label,desc,fn){
    const b=document.createElement('button'); b.className='ccp204-item'; b.innerHTML=`<span class="ccp204-icon">${icon}</span><span><div class="ccp204-label">${esc(label)}</div><div class="ccp204-desc">${esc(desc)}</div></span><span class="ccp204-arrow">›</span>`; b.onclick=fn; return b;
  }

  async function reply(article, style){
    const t=textOf(article); if(!t)return status('⚠️ Tweet text could not be read.');
    loading('Generating Smart Reply…');
    const rules={short:'under 12 words, punchy and human',smart:'under 25 words, insightful with one original opinion',professional:'under 25 words, credible and natural'};
    const ai=await ask([{role:'system',content:`Write ONE ${rules[style]} crypto Twitter reply. Output only the reply. No hashtags. Maximum 2 emojis.`},{role:'user',content:t}],.82);
    if(!ai.ok){showError('Smart Reply',ai.error);return;}
    const b=replyBtn(article); if(!b){showError('Smart Reply','X reply button was not found.');return;}
    b.click(); await sleep(700); const r=await insert(ai.text); if(!r.ok)status('⚠️ '+r.error); else close();
  }

  function showError(title,msg){ if(!menu)return; menu.innerHTML=`<div class="ccp204-head"><div class="ccp204-title"><span class="ccp204-logo">⚠️</span>${esc(title)}</div><div class="ccp204-sub">Crypto Copilot diagnostic</div></div>`; status('❌ '+msg); }

  async function open(article, btn){
    close(); anchor=btn; menu=document.createElement('div'); menu.className='ccp204-menu';
    const configured=await apiState(); const t=textOf(article);
    menu.innerHTML=`<div class="ccp204-head"><div class="ccp204-title"><span class="ccp204-logo">✦</span>Crypto Copilot</div><div class="ccp204-sub">Core test • V2.0.6</div></div>${t?`<div class="ccp204-context">${esc(t.slice(0,160))}${t.length>160?'…':''}</div>`:''}<div class="ccp204-body"></div>`;
    document.body.appendChild(menu);
    const body=menu.querySelector('.ccp204-body');
    const s=document.createElement('div'); s.className='ccp204-status '+(configured?'ccp204-ok':'ccp204-err'); s.textContent=configured?'🟢 API Connected':'🔴 API Not Configured'; body.appendChild(s);
    if(!configured){body.appendChild(item('🔐','API Settings','Open extension settings',()=>chrome.runtime.openOptionsPage()));}
    body.appendChild(item('⚡','Smart Reply','Test OpenRouter + X composer',()=>{
      menu.innerHTML='<div class="ccp204-head"><div class="ccp204-title"><span class="ccp204-logo">⚡</span>Smart Reply</div><div class="ccp204-sub">Choose a style</div></div><div class="ccp204-body"></div>';
      const b=menu.querySelector('.ccp204-body'); b.appendChild(item('◉','Short','Fast and punchy',()=>reply(article,'short'))); b.appendChild(item('✦','Smart','Original opinion',()=>reply(article,'smart'))); b.appendChild(item('◆','Professional','Credible and natural',()=>reply(article,'professional'))); place();
    }));
    body.appendChild(item('🌍','Translate','Test AI translation',async()=>{loading('Translating…');const ai=await ask([{role:'system',content:'Translate into natural Persian. Preserve crypto terminology. Output only the translation.'},{role:'user',content:t}],.2);if(!ai.ok){status('❌ '+ai.error);return;}menu.innerHTML='<div class="ccp204-head"><div class="ccp204-title"><span class="ccp204-logo">🌍</span>Translation</div></div><div class="ccp204-result">'+esc(ai.text)+'</div>';place();}));
    body.appendChild(item('🔧','Diagnostic','Test the extension bridge',async()=>{loading('Running diagnostics…');const ok=await apiState();const ping=await ask([{role:'system',content:'Reply with exactly OK.'},{role:'user',content:'Connection test'}],.1);if(ping.ok)status('🟢 Extension + API bridge is working.',true);else status((ok?'🔴 API request failed: ':'🔴 ')+ping.error); }));
    place();
  }

  function add(article){
    if(article.dataset.ccp204Attached==='1')return;
    const button=document.createElement('button'); button.className='ccp204-fab'; button.type='button'; button.textContent='✦'; button.title='Crypto Copilot'; button.setAttribute('aria-label','Crypto Copilot');
    button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open(article,button);});
    const group=article.querySelector('[role="group"]');
    if(group){group.appendChild(button);article.dataset.ccp204Attached='1';return;}
    article.classList.add('ccp204-anchor'); button.classList.add('ccp204-overlay'); article.appendChild(button); article.dataset.ccp204Attached='1';
  }

  function scan(){document.querySelectorAll('article[data-testid="tweet"],article').forEach(add);}
  scan();
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(menu&&!menu.contains(e.target)&&!e.target.closest('.ccp204-fab'))close();});
  window.addEventListener('resize',place);
  window.addEventListener('scroll',close,true);
  console.log('🚀 Crypto Copilot V2.0.6 core loaded');
})();
