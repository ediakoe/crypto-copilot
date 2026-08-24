(() => {
  if (window.__cryptoCopilotV212) return;
  window.__cryptoCopilotV212 = true;

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let panel = null, currentTweet = null, currentFab = null, busy = false;

  const css = document.createElement('style');
  css.textContent = `
    .ccp212-fab{width:34px!important;height:34px!important;margin:0 4px!important;border:1px solid rgba(130,145,255,.72)!important;border-radius:11px!important;background:linear-gradient(135deg,#6478ff,#9b69ff)!important;color:#fff!important;font:800 16px/34px Arial!important;cursor:pointer!important;box-shadow:0 7px 22px rgba(90,105,255,.35)!important;z-index:50!important}
    .ccp212-panel{position:fixed;z-index:2147483647;width:370px;max-width:calc(100vw - 20px);max-height:min(650px,calc(100vh - 20px));overflow-y:auto;overflow-x:hidden;background:#090d14;color:#f4f7fb;border:1px solid rgba(255,255,255,.12);border-radius:20px;box-shadow:0 30px 90px rgba(0,0,0,.7);font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overscroll-behavior:contain}
    .ccp212-head{padding:16px;background:linear-gradient(135deg,rgba(105,121,255,.2),rgba(154,105,255,.05));border-bottom:1px solid rgba(255,255,255,.08)}
    .ccp212-brand{display:flex;align-items:center;gap:10px}.ccp212-logo{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:linear-gradient(135deg,#6478ff,#9b69ff);font-size:17px}.ccp212-title{font-weight:850;font-size:15px}.ccp212-sub{font-size:10px;color:#8993a5;margin-top:3px}
    .ccp212-status{margin:11px 12px 4px;padding:9px 11px;border-radius:11px;background:rgba(255,255,255,.035);color:#aeb7c5;font-size:10px}.ccp212-status.ok{color:#75e2a5;background:rgba(50,210,125,.08)}.ccp212-status.err{color:#ff8796;background:rgba(255,70,95,.08)}
    .ccp212-context{margin:10px 12px;padding:11px;border:1px solid rgba(255,255,255,.07);border-radius:13px;color:#aeb7c5;font-size:11px;line-height:1.5;max-height:92px;overflow:auto}
    .ccp212-body{padding:10px}.ccp212-label{padding:5px 3px 8px;color:#727d90;font-size:9px;font-weight:800;letter-spacing:.13em}.ccp212-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .ccp212-btn,.ccp212-back{border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(255,255,255,.035);color:#edf0f5;cursor:pointer}.ccp212-btn{min-height:70px;padding:10px;text-align:left}.ccp212-btn:hover,.ccp212-back:hover{background:rgba(105,121,255,.1);border-color:rgba(105,121,255,.3)}.ccp212-icon{display:block;font-size:17px;margin-bottom:6px}.ccp212-btn strong{display:block;font-size:11px}.ccp212-btn span{display:block;color:#748095;font-size:9px;margin-top:3px}.ccp212-selected{border-color:rgba(115,130,255,.72)!important;background:rgba(105,121,255,.14)!important}
    .ccp212-generate{width:100%;margin-top:9px;padding:12px;border:0;border-radius:12px;background:linear-gradient(135deg,#6579ff,#9a69ff);color:#fff;font-weight:850;cursor:pointer}.ccp212-back{width:100%;margin-top:8px;padding:10px}.ccp212-loading{text-align:center;padding:28px;color:#aeb7c5}.ccp212-dot{display:inline-block;width:5px;height:5px;border-radius:50%;background:#7888ff;margin:12px 3px 0;animation:p 1s infinite alternate}.ccp212-dot:nth-child(2){animation-delay:.15s}.ccp212-dot:nth-child(3){animation-delay:.3s}@keyframes p{to{opacity:.2;transform:translateY(-3px)}}
    .ccp212-translation{margin:10px!important;padding:12px!important;border-radius:13px!important;background:rgba(105,121,255,.08)!important;border:1px solid rgba(105,121,255,.15)!important;color:#eef1f7!important;direction:rtl!important;line-height:1.9!important}
  `;
  document.documentElement.appendChild(css);

  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const tweetText = t => t?.querySelector('[data-testid="tweetText"]')?.innerText?.trim() || '';
  const replyButton = t => t?.querySelector('[data-testid="reply"]');
  const retweetButton = t => t?.querySelector('[data-testid="retweet"]');
  const dialogEditor = () => document.querySelector('[role="dialog"] [contenteditable="true"]') || document.querySelector('[role="dialog"] [role="textbox"]');
  const anyEditor = () => dialogEditor() || document.querySelector('[data-testid="tweetTextarea_0"][contenteditable="true"]') || document.querySelector('[data-testid="tweetTextarea_0"] [contenteditable="true"]');

  function close(){ panel?.remove(); panel=null; currentTweet=null; currentFab=null; busy=false; }
  function position(){ if(!panel||!currentFab)return; const r=currentFab.getBoundingClientRect(),w=Math.min(370,innerWidth-20),h=panel.offsetHeight||420; let top=r.bottom+8; if(top+h>innerHeight-10)top=r.top-h-8; panel.style.left=Math.max(10,Math.min(r.left,innerWidth-w-10))+'px'; panel.style.top=Math.max(10,Math.min(top,innerHeight-h-10))+'px'; }
  function setStatus(msg,type=''){const e=panel?.querySelector('.ccp212-status');if(e){e.textContent=msg;e.className='ccp212-status '+type;position();}}
  function loading(msg){const b=panel?.querySelector('.ccp212-body');if(b)b.innerHTML=`<div class="ccp212-loading">${esc(msg)}<br><span class="ccp212-dot"></span><span class="ccp212-dot"></span><span class="ccp212-dot"></span></div>`;position();}
  function button(icon,title,desc,fn){const b=document.createElement('button');b.type='button';b.className='ccp212-btn';b.innerHTML=`<span class="ccp212-icon">${icon}</span><strong>${esc(title)}</strong><span>${esc(desc)}</span>`;b.onclick=e=>{e.preventDefault();e.stopPropagation();fn();};return b;}

  function askAI(prompt,system='You write natural human Crypto Twitter copy. Sound like a real person, not a bot. Use 0-2 emojis only when they naturally fit. Never use hashtags unless explicitly requested. Output only the requested text.'){
    return new Promise(resolve=>{let done=false;const timer=setTimeout(()=>{if(!done){done=true;resolve({ok:false,error:'AI request timed out'})}},30000);chrome.runtime.sendMessage({type:'CCP_AI',temperature:.85,messages:[{role:'system',content:system},{role:'user',content:prompt}]},r=>{if(done)return;done=true;clearTimeout(timer);if(chrome.runtime.lastError)return resolve({ok:false,error:chrome.runtime.lastError.message});resolve(r?.ok?{ok:true,text:(r.text||'').trim()}:{ok:false,error:r?.error||'AI request failed'});});});
  }

  async function waitFor(fn,ms=8000){const end=Date.now()+ms;while(Date.now()<end){const v=fn();if(v)return v;await sleep(120)}return null;}
  async function openReplyComposer(tweet){const b=replyButton(tweet);if(!b)return null;b.click();return waitFor(dialogEditor,8000);}
  async function openNewPost(){const b=document.querySelector('[data-testid="SideNav_NewTweet_Button"]');if(!b)return null;b.click();return waitFor(anyEditor,8000);}

  // Single insertion strategy: use execCommand once. Do NOT manually fire another input event after success.
  function putText(editor,text){
    if(!editor)return false;
    editor.focus();
    const range=document.createRange();range.selectNodeContents(editor);range.collapse(false);
    const sel=getSelection();sel.removeAllRanges();sel.addRange(range);
    let inserted=false;
    try{inserted=document.execCommand('insertText',false,text)===true||!!String(editor.innerText||'').trim()}catch{}
    if(inserted)return true;
    try{
      editor.textContent='';
      const node=document.createTextNode(text);
      editor.appendChild(node);
      editor.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:text}));
      return !!String(editor.innerText||editor.textContent||'').trim();
    }catch{return false}
  }

  const replyPrompt=(style,text)=>`Reply naturally to this exact Tweet. Style: ${style}. React to the actual point; do not summarize or restate it. Sound like a real person on X. Maximum 25 words. Use 0-2 emojis only when they genuinely fit. No hashtags. No quotes. Output ONE reply only.\n\nTweet:\n${text}`;

  async function smartReply(tweet,style){
    if(busy)return;busy=true;const text=tweetText(tweet);if(!text){setStatus('❌ Tweet text not found','err');busy=false;return}
    loading('Generating natural reply…');const r=await askAI(replyPrompt(style,text));if(!r.ok){setStatus('❌ '+r.error,'err');busy=false;return}
    loading('Opening this Tweet reply box…');const editor=await openReplyComposer(tweet);if(!editor){setStatus('❌ Could not open the reply box for this Tweet','err');busy=false;return}
    const ok=putText(editor,r.text);if(!ok){setStatus('❌ X did not accept the generated text','err');busy=false;return}
    setStatus('✓ Reply inserted once','ok');await sleep(650);close();
  }

  async function translate(tweet){if(busy)return;busy=true;const text=tweetText(tweet);if(!text){setStatus('❌ Tweet text not found','err');busy=false;return}loading('Translating…');const r=await askAI(`Translate into natural Persian. Keep names, tickers and crypto terms unchanged. Preserve tone. Output only the translation.\n\n${text}`,'You are a professional Persian translator for Crypto Twitter. Output only the translation.');if(!r.ok){setStatus('❌ '+r.error,'err');busy=false;return}let box=tweet.querySelector('.ccp212-translation');if(!box){box=document.createElement('div');box.className='ccp212-translation';tweet.appendChild(box)}box.textContent=r.text;close();}

  async function rewrite(tweet){if(busy)return;busy=true;const text=tweetText(tweet);loading('Rewriting…');const r=await askAI(`Rewrite this post so it sounds sharper, clearer and genuinely human while preserving its meaning. Use natural punctuation and 0-2 emojis if appropriate. Output only the rewritten post.\n\n${text}`);if(!r.ok){setStatus('❌ '+r.error,'err');busy=false;return}close();const e=await openNewPost();if(e)putText(e,r.text);busy=false;}
  async function thread(tweet){if(busy)return;busy=true;const text=tweetText(tweet);loading('Building thread…');const r=await askAI(`Turn this idea into exactly 3 connected Crypto Twitter posts. Each post should be natural and non-repetitive. Number them 1/3, 2/3, 3/3. Use emojis sparingly. Output only the 3 posts separated by a blank line.\n\n${text}`);if(!r.ok){setStatus('❌ '+r.error,'err');busy=false;return}close();const e=await openNewPost();if(e)putText(e,r.text);busy=false;}
  async function quote(tweet){if(busy)return;busy=true;const text=tweetText(tweet);loading('Writing quote comment…');const r=await askAI(`Write ONE natural quote-tweet comment reacting to this exact post. Add a genuine opinion or observation. Maximum 25 words. Use 0-2 fitting emojis. No hashtags. Output only the comment.\n\n${text}`);if(!r.ok){setStatus('❌ '+r.error,'err');busy=false;return}const rb=retweetButton(tweet);if(!rb){setStatus('❌ Quote button not found','err');busy=false;return}rb.click();const menu=await waitFor(()=>[...document.querySelectorAll('[role="menuitem"]')].find(x=>/Quote/i.test(x.innerText||'')),4000);if(!menu){setStatus('❌ Quote option not found','err');busy=false;return}menu.click();const e=await waitFor(dialogEditor,8000);if(!e||!putText(e,r.text)){setStatus('❌ Quote composer not found','err');busy=false;return}setStatus('✓ Quote inserted once','ok');await sleep(650);close();}
  async function trends(){if(busy)return;const links=[...document.querySelectorAll('a[href*="/search?q="]')].map(a=>(a.innerText||'').trim()).filter(Boolean).slice(0,8);if(!links.length){setStatus('Open Explore → Trending on X first','err');return}const body=panel.querySelector('.ccp212-body');body.innerHTML=links.map((x,i)=>`<button class="ccp212-back trend212" data-i="${i}">📈 ${esc(x)}</button>`).join('');panel.querySelectorAll('.trend212').forEach((b,i)=>b.onclick=async()=>{if(busy)return;busy=true;loading('Writing trend post…');const r=await askAI(`Write one concise, natural Crypto Twitter post around this visible X trend: ${links[i]}. Do not invent facts. Use 0-2 emojis only if natural. Output only the post.`);if(!r.ok){setStatus('❌ '+r.error,'err');busy=false;return}close();const e=await openNewPost();if(e)putText(e,r.text);busy=false});position();}

  function smartReplyUI(tweet){panel.innerHTML=`<div class="ccp212-head"><div class="ccp212-brand"><div class="ccp212-logo">⚡</div><div><div class="ccp212-title">Smart Reply</div><div class="ccp212-sub">Generate once → insert directly into THIS Tweet</div></div></div></div><div class="ccp212-body"><div class="ccp212-grid" id="styles"></div><button class="ccp212-generate" id="gen">✨ Generate Reply</button><button class="ccp212-back" id="back">← Back</button></div>`;let selected='smart',g=panel.querySelector('#styles');[['◉','Short','Casual & punchy','short'],['✦','Smart','Natural & insightful','smart'],['◆','Professional','Clean & credible','professional']].forEach(([i,t,d,k])=>{const b=button(i,t,d,()=>{selected=k;g.querySelectorAll('button').forEach(x=>x.classList.remove('ccp212-selected'));b.classList.add('ccp212-selected')});if(k==='smart')b.classList.add('ccp212-selected');g.appendChild(b)});panel.querySelector('#gen').onclick=()=>smartReply(tweet,selected);panel.querySelector('#back').onclick=()=>openPanel(tweet,currentFab);position();}

  function openPanel(tweet,fab){close();currentTweet=tweet;currentFab=fab;panel=document.createElement('div');panel.className='ccp212-panel';const text=tweetText(tweet),preview=text.length>180?text.slice(0,180)+'…':text;panel.innerHTML=`<div class="ccp212-head"><div class="ccp212-brand"><div class="ccp212-logo">✦</div><div><div class="ccp212-title">Crypto Copilot</div><div class="ccp212-sub">Natural AI tools for X</div></div></div></div>${preview?`<div class="ccp212-context">${esc(preview)}</div>`:''}<div class="ccp212-status">Checking API…</div><div class="ccp212-body"><div class="ccp212-label">AI TOOLS</div><div class="ccp212-grid" id="grid"></div><button class="ccp212-back" id="test">🧪 Test API connection</button></div>`;document.body.appendChild(panel);const g=panel.querySelector('#grid');g.appendChild(button('⚡','Smart Reply','Natural • direct reply',()=>smartReplyUI(tweet)));g.appendChild(button('🔁','Smart Quote','Quote comment directly',()=>quote(tweet)));g.appendChild(button('🌍','Translate','Persian translation',()=>translate(tweet)));g.appendChild(button('✎','Rewrite','Rewrite and insert',()=>rewrite(tweet)));g.appendChild(button('🧵','Thread','Create 3 connected posts',()=>thread(tweet)));g.appendChild(button('📈','Trend Radar','Use visible X trends',trends));panel.querySelector('#test').onclick=async()=>{if(busy)return;busy=true;loading('Testing API…');const r=await askAI('Return exactly CCP_OK','Return exactly CCP_OK');setStatus(r.ok?'✓ API connected':'❌ '+r.error,r.ok?'ok':'err');busy=false};chrome.storage.local.get('openrouter_api_key',d=>setStatus(d.openrouter_api_key?'✓ API connected':'⚠️ API not configured',d.openrouter_api_key?'ok':'err'));position();}

  function attach(tweet){if(tweet.querySelector('.ccp212-fab'))return;const host=tweet.querySelector('[role="group"]')||tweet.querySelector('[data-testid="reply"]')?.parentElement;if(!host)return;const b=document.createElement('button');b.className='ccp212-fab';b.type='button';b.textContent='✦';b.title='Crypto Copilot';b.setAttribute('aria-label','Crypto Copilot');b.onclick=e=>{e.preventDefault();e.stopPropagation();openPanel(tweet,b)};host.appendChild(b)}
  function scan(){document.querySelectorAll('article').forEach(attach)}
  scan();new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(panel&&!panel.contains(e.target)&&!e.target.closest('.ccp212-fab'))close()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel)close()});window.addEventListener('resize',position);window.addEventListener('scroll',position,true);
  console.log('🚀 Crypto Copilot V2.1.2 loaded');
})();