(() => {
  if (window.__cryptoCopilotV210) return;
  window.__cryptoCopilotV210 = true;

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let panel = null, currentTweet = null, currentFab = null, busy = false;

  const css = document.createElement('style');
  css.textContent = `
  .ccp210-fab{width:34px!important;height:34px!important;margin:0 4px!important;border:1px solid rgba(130,145,255,.7)!important;border-radius:11px!important;background:linear-gradient(135deg,#6478ff,#9b69ff)!important;color:#fff!important;font:800 16px/34px Arial!important;cursor:pointer!important;box-shadow:0 7px 22px rgba(90,105,255,.35)!important;z-index:50!important}.ccp210-fab:hover{transform:scale(1.07)!important}
  .ccp210-panel{position:fixed;z-index:2147483647;width:370px;max-width:calc(100vw - 20px);max-height:calc(100vh - 20px);overflow:auto;background:#090d14;color:#f4f7fb;border:1px solid rgba(255,255,255,.12);border-radius:20px;box-shadow:0 30px 90px rgba(0,0,0,.7);font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.ccp210-head{padding:16px;background:linear-gradient(135deg,rgba(105,121,255,.2),rgba(154,105,255,.05));border-bottom:1px solid rgba(255,255,255,.08)}.ccp210-brand{display:flex;align-items:center;gap:10px}.ccp210-logo{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:linear-gradient(135deg,#6478ff,#9b69ff);font-size:17px}.ccp210-title{font-weight:850;font-size:15px}.ccp210-sub{font-size:10px;color:#8993a5;margin-top:3px}.ccp210-status{margin:11px 12px 4px;padding:9px 11px;border-radius:11px;background:rgba(255,255,255,.035);color:#aeb7c5;font-size:10px}.ccp210-status.ok{color:#75e2a5;background:rgba(50,210,125,.08)}.ccp210-status.err{color:#ff8796;background:rgba(255,70,95,.08)}.ccp210-context{margin:10px 12px;padding:11px;border:1px solid rgba(255,255,255,.07);border-radius:13px;color:#aeb7c5;font-size:11px;line-height:1.5;max-height:72px;overflow:hidden}.ccp210-body{padding:10px}.ccp210-label{padding:5px 3px 8px;color:#727d90;font-size:9px;font-weight:800;letter-spacing:.13em}.ccp210-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ccp210-btn,.ccp210-back{border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(255,255,255,.035);color:#edf0f5;cursor:pointer}.ccp210-btn{min-height:70px;padding:10px;text-align:left}.ccp210-btn:hover,.ccp210-back:hover{background:rgba(105,121,255,.1);border-color:rgba(105,121,255,.3)}.ccp210-icon{display:block;font-size:17px;margin-bottom:6px}.ccp210-btn strong{display:block;font-size:11px}.ccp210-btn span{display:block;color:#748095;font-size:9px;margin-top:3px}.ccp210-generate{width:100%;margin-top:9px;padding:12px;border:0;border-radius:12px;background:linear-gradient(135deg,#6579ff,#9a69ff);color:#fff;font-weight:850;cursor:pointer}.ccp210-back{width:100%;margin-top:8px;padding:10px}.ccp210-loading{text-align:center;padding:28px;color:#aeb7c5}.ccp210-dot{display:inline-block;width:5px;height:5px;border-radius:50%;background:#7888ff;margin:12px 3px 0;animation:p 1s infinite alternate}.ccp210-dot:nth-child(2){animation-delay:.15s}.ccp210-dot:nth-child(3){animation-delay:.3s}@keyframes p{to{opacity:.2;transform:translateY(-3px)}}.ccp210-selected{border-color:rgba(115,130,255,.7)!important;background:rgba(105,121,255,.14)!important}.ccp210-translation{margin:10px!important;padding:12px!important;border-radius:13px!important;background:rgba(105,121,255,.08)!important;border:1px solid rgba(105,121,255,.15)!important;color:#eef1f7!important;direction:rtl!important;line-height:1.9!important}
  `;
  document.documentElement.appendChild(css);

  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const tweetText = t => t?.querySelector('[data-testid="tweetText"]')?.innerText?.trim() || '';
  const replyButton = t => t?.querySelector('[data-testid="reply"]');
  const dialogEditor = () => document.querySelector('[role="dialog"] [contenteditable="true"]') || document.querySelector('[role="dialog"] [role="textbox"]');
  const anyEditor = () => dialogEditor() || document.querySelector('[data-testid="tweetTextarea_0"][contenteditable="true"]') || document.querySelector('[data-testid="tweetTextarea_0"] [contenteditable="true"]');

  function close(){panel?.remove();panel=null;currentTweet=null;currentFab=null;busy=false;}
  function position(){if(!panel||!currentFab)return;const r=currentFab.getBoundingClientRect(),w=Math.min(370,innerWidth-20);panel.style.left=Math.max(10,Math.min(r.left,innerWidth-w-10))+'px';panel.style.top=Math.max(10,Math.min(r.bottom+8,innerHeight-panel.offsetHeight-10))+'px';}
  function status(msg,type=''){const e=panel?.querySelector('.ccp210-status');if(e){e.textContent=msg;e.className='ccp210-status '+type;position();}}
  function loading(msg){const b=panel?.querySelector('.ccp210-body');if(b)b.innerHTML=`<div class="ccp210-loading">${esc(msg)}<br><span class="ccp210-dot"></span><span class="ccp210-dot"></span><span class="ccp210-dot"></span></div>`;position();}
  function button(icon,title,desc,fn){const b=document.createElement('button');b.className='ccp210-btn';b.innerHTML=`<span class="ccp210-icon">${icon}</span><strong>${esc(title)}</strong><span>${esc(desc)}</span>`;b.onclick=e=>{e.preventDefault();e.stopPropagation();fn()};return b;}

  function askAI(prompt,system){return new Promise(resolve=>{let done=false;const timer=setTimeout(()=>{if(!done){done=true;resolve({ok:false,error:'AI request timed out'})}},30000);chrome.runtime.sendMessage({type:'CCP_AI',temperature:.85,messages:[{role:'system',content:system||'You write natural human Crypto Twitter copy. Sound like a real person, not an AI. Use emojis naturally when appropriate. Never use hashtags unless requested. Output only the requested text.'},{role:'user',content:prompt}]},r=>{if(done)return;done=true;clearTimeout(timer);if(chrome.runtime.lastError)return resolve({ok:false,error:chrome.runtime.lastError.message});resolve(r?.ok?{ok:true,text:(r.text||'').trim()}:{ok:false,error:r?.error||'AI request failed'})})})}

  async function waitFor(fn,ms=8000){const end=Date.now()+ms;while(Date.now()<end){const v=fn();if(v)return v;await sleep(120)}return null;}

  async function openReplyComposer(tweet){
    const b=replyButton(tweet);if(!b)return null;
    b.click();
    const e=await waitFor(dialogEditor,8000);
    return e;
  }

  function putText(e,text){
    if(!e)return false;
    e.focus();
    const sel=window.getSelection();const range=document.createRange();range.selectNodeContents(e);range.collapse(false);sel.removeAllRanges();sel.addRange(range);
    try{document.execCommand('insertText',false,text)}catch{}
    if(!String(e.innerText||'').trim()){
      try{range.selectNodeContents(e);range.collapse(false);sel.removeAllRanges();sel.addRange(range);document.execCommand('insertText',false,text)}catch{}
    }
    e.dispatchEvent(new InputEvent('beforeinput',{bubbles:true,inputType:'insertText',data:text}));
    e.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:text}));
    return !!String(e.innerText||'').trim();
  }

  function naturalPrompt(style,text){
    const rules={short:'very short, casual and punchy',smart:'thoughtful, conversational and insightful',professional:'clean and credible but still human'};
    return `Write ONE natural reply to this Crypto Twitter post. Style: ${rules[style]}. Sound like a real person replying on X, not a marketing bot. React to the actual point instead of restating it. Use 0-2 emojis only when they genuinely fit. No hashtags. No quotation marks. No intro. Maximum 25 words.\n\nTweet:\n${text}`;
  }

  async function smartReply(tweet,style){
    if(busy)return;busy=true;const text=tweetText(tweet);if(!text){status('❌ Tweet text not found','err');busy=false;return}
    loading('Generating natural reply…');const r=await askAI(naturalPrompt(style,text));if(!r.ok){status('❌ '+r.error,'err');busy=false;return}
    loading('Opening the reply box…');const e=await openReplyComposer(tweet);if(!e){status('❌ Could not open this Tweet reply box','err');busy=false;return}
    if(putText(e,r.text)){status('✓ Reply added to this Tweet','ok');busy=false;await sleep(700);close()}else{status('❌ X rejected the reply text','err');busy=false}
  }

  async function translate(tweet){if(busy)return;busy=true;const text=tweetText(tweet);if(!text){status('❌ Tweet text not found','err');busy=false;return}loading('Translating…');const r=await askAI(`Translate this Tweet into natural Persian. Keep names, tickers and crypto terminology unchanged. Preserve the tone. Output only the translation.\n\n${text}`,'You are a natural Persian translator for Crypto Twitter. Do not add explanations.');if(!r.ok){status('❌ '+r.error,'err');busy=false;return}let box=tweet.querySelector('.ccp210-translation');if(!box){box=document.createElement('div');box.className='ccp210-translation';tweet.appendChild(box)}box.textContent=r.text;close()}

  async function rewrite(tweet){if(busy)return;busy=true;const text=tweetText(tweet);loading('Rewriting…');const r=await askAI(`Rewrite this post so it sounds sharper, more natural and engaging while keeping its original meaning. Use natural punctuation and 0-2 emojis if appropriate. Output only the rewritten post.\n\n${text}`);if(!r.ok){status('❌ '+r.error,'err');busy=false;return}busy=false;status('✓ Rewrite ready — use X composer','ok');await sleep(300);close();openNewPost(r.text)}

  async function openNewPost(text){const b=document.querySelector('[data-testid="SideNav_NewTweet_Button"]');if(!b){alert('X New Post button was not found');return}b.click();const e=await waitFor(anyEditor,8000);if(e)putText(e,text)}

  async function thread(tweet){if(busy)return;busy=true;const text=tweetText(tweet);loading('Building thread…');const r=await askAI(`Turn this idea into exactly 3 connected Crypto Twitter posts. Make each post natural and useful, not repetitive. Number them 1/3, 2/3, 3/3. Use emojis sparingly. Output only the 3 posts separated by a blank line.\n\n${text}`);if(!r.ok){status('❌ '+r.error,'err');busy=false;return}busy=false;close();await openNewPost(r.text)}

  async function quote(tweet){if(busy)return;busy=true;const text=tweetText(tweet);loading('Writing quote comment…');const r=await askAI(`Write ONE natural quote-tweet comment reacting to this post. Add a genuine opinion or observation. Maximum 25 words. Use 0-2 fitting emojis. No hashtags. Output only the comment.\n\n${text}`);if(!r.ok){status('❌ '+r.error,'err');busy=false;return}const rb=tweet.querySelector('[data-testid="retweet"]');if(!rb){status('❌ Quote button not found','err');busy=false;return}rb.click();const menu=await waitFor(()=>[...document.querySelectorAll('[role="menuitem"]')].find(x=>/Quote/i.test(x.innerText||'')),4000);if(menu){menu.click();const e=await waitFor(dialogEditor,8000);if(e&&putText(e,r.text)){status('✓ Quote comment added','ok');await sleep(700);close();return}}status('❌ Could not open Quote Tweet composer','err');busy=false}

  async function trends(){if(busy)return;const links=[...document.querySelectorAll('a[href*="/search?q="]')].map(a=>(a.innerText||'').trim()).filter(Boolean).slice(0,8);if(!links.length){status('Open Explore → Trending on X first','err');return}panel.querySelector('.ccp210-body').innerHTML=links.map((x,i)=>`<button class="ccp210-back trend210" data-i="${i}">📈 ${esc(x)}</button>`).join('');panel.querySelectorAll('.trend210').forEach((b,i)=>b.onclick=async()=>{if(busy)return;busy=true;loading('Writing trend post…');const r=await askAI(`Write one natural Crypto Twitter post about this visible X trend: ${links[i]}. Do not invent facts. Keep it conversational and concise. Use 0-2 emojis if appropriate. Output only the post.`);if(!r.ok){status('❌ '+r.error,'err');busy=false;return}busy=false;close();openNewPost(r.text)});position()}

  function smartReplyUI(tweet){panel.innerHTML=`<div class="ccp210-head"><div class="ccp210-brand"><div class="ccp210-logo">⚡</div><div><div class="ccp210-title">Smart Reply</div><div class="ccp210-sub">It will be inserted into THIS Tweet's reply box</div></div></div></div><div class="ccp210-body"><div class="ccp210-grid" id="styles"></div><button class="ccp210-generate" id="gen">✨ Generate Reply</button><button class="ccp210-back" id="back">← Back</button></div>`;let selected='smart',g=panel.querySelector('#styles');[['◉','Short','Casual & punchy','short'],['✦','Smart','Natural & insightful','smart'],['◆','Professional','Clean & credible','professional']].forEach(([i,t,d,k])=>{const b=button(i,t,d,()=>{selected=k;g.querySelectorAll('button').forEach(x=>x.classList.remove('ccp210-selected'));b.classList.add('ccp210-selected')});if(k==='smart')b.classList.add('ccp210-selected');g.appendChild(b)});panel.querySelector('#gen').onclick=()=>smartReply(tweet,selected);panel.querySelector('#back').onclick=()=>openPanel(tweet,currentFab);position()}

  function openPanel(tweet,fab){close();currentTweet=tweet;currentFab=fab;panel=document.createElement('div');panel.className='ccp210-panel';const text=tweetText(tweet),p=text.length>180?text.slice(0,180)+'…':text;panel.innerHTML=`<div class="ccp210-head"><div class="ccp210-brand"><div class="ccp210-logo">✦</div><div><div class="ccp210-title">Crypto Copilot</div><div class="ccp210-sub">Natural AI tools for X</div></div></div></div>${p?`<div class="ccp210-context">${esc(p)}</div>`:''}<div class="ccp210-status">Checking API…</div><div class="ccp210-body"><div class="ccp210-label">AI TOOLS</div><div class="ccp210-grid" id="grid"></div><button class="ccp210-back" id="test">🧪 Test API connection</button></div>`;document.body.appendChild(panel);const g=panel.querySelector('#grid');g.appendChild(button('⚡','Smart Reply','Natural • direct reply',()=>smartReplyUI(tweet)));g.appendChild(button('🔁','Smart Quote','Natural quote comment',()=>quote(tweet)));g.appendChild(button('🌍','Translate','Persian translation',()=>translate(tweet)));g.appendChild(button('✎','Rewrite','Rewrite this post',()=>rewrite(tweet)));g.appendChild(button('🧵','Thread','Build 3 connected posts',()=>thread(tweet)));g.appendChild(button('📈','Trend Radar','Use visible X trends',()=>trends()));panel.querySelector('#test').onclick=async()=>{if(busy)return;busy=true;loading('Testing API…');const r=await askAI('Reply with exactly: CCP_OK','Reply with exactly CCP_OK and nothing else.');busy=false;status(r.ok?'✓ API connected':'❌ '+r.error,r.ok?'ok':'err')};chrome.storage.local.get('openrouter_api_key',d=>status(d.openrouter_api_key?'✓ API connected':'⚠️ API not configured',d.openrouter_api_key?'ok':'err'));position()}

  function attach(tweet){if(tweet.querySelector('.ccp210-fab'))return;const host=tweet.querySelector('[role="group"]')||tweet.querySelector('[data-testid="reply"]')?.parentElement;if(!host)return;const b=document.createElement('button');b.className='ccp210-fab';b.type='button';b.textContent='✦';b.title='Crypto Copilot';b.onclick=e=>{e.preventDefault();e.stopPropagation();openPanel(tweet,b)};host.appendChild(b)}
  function scan(){document.querySelectorAll('article[data-testid="tweet"]').forEach(attach)}
  new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});scan();console.log('🚀 Crypto Copilot V2.1.0 loaded');
})();