(() => {
  if (window.__cryptoCopilotV206) return;
  window.__cryptoCopilotV206 = true;

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let panel = null;
  let anchor = null;

  const css = document.createElement('style');
  css.textContent = `
    .ccp206-fab{position:relative!important;width:34px!important;height:34px!important;min-width:34px!important;margin:0 4px!important;padding:0!important;border:1px solid rgba(130,145,255,.7)!important;border-radius:11px!important;background:linear-gradient(135deg,#6579ff,#9a69ff)!important;color:#fff!important;font:800 16px/34px Arial!important;text-align:center!important;cursor:pointer!important;box-shadow:0 5px 18px rgba(100,115,255,.35)!important;z-index:100!important}
    .ccp206-panel{position:fixed;z-index:2147483647;width:340px;max-width:calc(100vw - 20px);background:#0b0f16;color:#f5f7fb;border:1px solid rgba(255,255,255,.12);border-radius:18px;box-shadow:0 24px 80px rgba(0,0,0,.65);font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow:hidden}
    .ccp206-head{padding:14px 16px;background:linear-gradient(135deg,rgba(105,121,255,.22),rgba(154,105,255,.08));border-bottom:1px solid rgba(255,255,255,.08)}
    .ccp206-title{font-weight:800;font-size:15px}.ccp206-sub{margin-top:3px;color:#8c96a7;font-size:10px}
    .ccp206-status{margin:10px;padding:10px;border-radius:11px;background:rgba(255,255,255,.04);color:#aab3c2;font-size:11px;line-height:1.45}.ccp206-status.ok{color:#75e0a4;background:rgba(60,210,125,.08)}.ccp206-status.err{color:#ff8a98;background:rgba(255,70,95,.08)}
    .ccp206-body{padding:8px 10px 10px}.ccp206-btn{width:100%;padding:10px;border:0;border-radius:11px;background:rgba(255,255,255,.045);color:#edf0f5;text-align:left;cursor:pointer;margin-bottom:6px}.ccp206-btn:hover{background:rgba(105,121,255,.12)}.ccp206-icon{display:inline-block;width:28px;font-size:16px}.ccp206-result{margin:10px;padding:11px;border-radius:11px;background:rgba(105,121,255,.08);border:1px solid rgba(105,121,255,.14);white-space:pre-wrap;line-height:1.5;max-height:220px;overflow:auto}.ccp206-mini{padding:7px 10px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.05);color:#fff;border-radius:8px;cursor:pointer;margin-top:8px}
  `;
  document.documentElement.appendChild(css);

  function closePanel(){ panel?.remove(); panel=null; anchor=null; }
  function placePanel(){ if(!panel||!anchor)return; const r=anchor.getBoundingClientRect(); const w=340; panel.style.left=Math.max(10,Math.min(r.left,innerWidth-w-10))+'px'; panel.style.top=Math.max(10,Math.min(r.bottom+8,innerHeight-panel.offsetHeight-10))+'px'; }
  function setStatus(text,type=''){ const el=panel?.querySelector('.ccp206-status'); if(el){el.className='ccp206-status '+type;el.textContent=text;} }
  function btn(icon,label,fn){ const b=document.createElement('button'); b.className='ccp206-btn'; b.innerHTML=`<span class="ccp206-icon">${icon}</span>${label}`; b.onclick=fn; return b; }
  function tweetText(tweet){ return tweet?.querySelector('[data-testid="tweetText"]')?.innerText?.trim() || ''; }
  function replyButton(tweet){ return tweet?.querySelector('[data-testid="reply"]'); }
  function editor(){ return document.querySelector('[role="dialog"] [contenteditable="true"]') || document.querySelector('[data-testid="tweetTextarea_0"][contenteditable="true"]') || document.querySelector('[data-testid="tweetTextarea_0"] [contenteditable="true"]'); }

  async function askAI(text){
    return new Promise(resolve=>{
      chrome.runtime.sendMessage({type:'CCP_AI',temperature:.8,messages:[
        {role:'system',content:'You write natural, concise crypto Twitter replies. Output only the reply. No hashtags. Maximum 2 emojis.'},
        {role:'user',content:text}
      ]},res=>{
        if(chrome.runtime.lastError)return resolve({ok:false,error:chrome.runtime.lastError.message});
        resolve(res?.ok?{ok:true,text:res.text||''}:{ok:false,error:res?.error||'Unknown background error'});
      });
    });
  }

  async function waitEditor(ms=7000){ const end=Date.now()+ms; while(Date.now()<end){const e=editor();if(e)return e;await sleep(100);} return null; }
  async function insert(text){ const e=await waitEditor(); if(!e)return {ok:false,error:'X composer was not found.'}; e.focus(); try{document.execCommand('insertText',false,text);}catch{} e.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:text})); return {ok:true}; }

  async function smartReply(tweet){
    const text=tweetText(tweet); if(!text){setStatus('Could not read this Tweet.','err');return;}
    setStatus('Generating reply…');
    const ai=await askAI(text); if(!ai.ok){setStatus('❌ '+ai.error,'err');return;}
    const reply=replyButton(tweet); if(!reply){setStatus('Reply button not found on this Tweet.','err');return;}
    reply.click(); await sleep(700); const inserted=await insert(ai.text); if(!inserted.ok){setStatus('⚠️ '+inserted.error,'err');return;} closePanel();
  }

  async function diagnostic(){
    setStatus('Testing extension → background → API…');
    const result=await askAI('Reply with exactly: CCP_OK');
    if(result.ok) setStatus('✓ API bridge is working. OpenRouter responded.','ok');
    else setStatus('❌ '+result.error,'err');
  }

  function openPanel(tweet,button){
    closePanel(); anchor=button; panel=document.createElement('div'); panel.className='ccp206-panel';
    panel.innerHTML='<div class="ccp206-head"><div class="ccp206-title">✦ Crypto Copilot</div><div class="ccp206-sub">V2.0.6 Core</div></div><div class="ccp206-status">Checking API…</div><div class="ccp206-body"></div>';
    document.body.appendChild(panel);
    const body=panel.querySelector('.ccp206-body');
    body.appendChild(btn('🧪','Diagnostic',diagnostic));
    body.appendChild(btn('⚡','Smart Reply',()=>smartReply(tweet)));
    body.appendChild(btn('🌍','Translate',()=>setStatus('Translate is next after Core test.')));
    body.appendChild(btn('🔁','Smart Quote',()=>setStatus('Smart Quote is next after Core test.')));
    chrome.storage.local.get(['openrouter_api_key'],d=>setStatus(d.openrouter_api_key?'✓ API connected':'⚠️ API not configured',d.openrouter_api_key?'ok':'err'));
    placePanel();
  }

  function attach(tweet){
    if(tweet.querySelector('.ccp206-fab'))return;
    const host=tweet.querySelector('[role="group"]');
    if(!host)return;
    const b=document.createElement('button'); b.className='ccp206-fab'; b.type='button'; b.textContent='✦'; b.title='Crypto Copilot'; b.setAttribute('aria-label','Crypto Copilot');
    b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openPanel(tweet,b);}); host.appendChild(b);
  }
  function scan(){document.querySelectorAll('article').forEach(attach);}
  scan(); new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(panel&&!panel.contains(e.target)&&!e.target.closest('.ccp206-fab'))closePanel();});
  window.addEventListener('resize',placePanel); window.addEventListener('scroll',closePanel,true);
  console.log('🚀 Crypto Copilot V2.0.6 loaded');
})();