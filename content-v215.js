(() => {
  if (window.__cryptoCopilotV215) return;
  window.__cryptoCopilotV215 = true;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let panel = null;
  let currentTweet = null;
  let currentFab = null;
  let busy = false;

  const style = document.createElement('style');
  style.textContent = `
    .ccp215-fab{width:34px!important;height:34px!important;min-width:34px!important;margin:0 4px!important;padding:0!important;border:1px solid rgba(130,145,255,.72)!important;border-radius:11px!important;background:linear-gradient(135deg,#6478ff,#9b69ff)!important;color:#fff!important;font:800 16px/34px Arial!important;cursor:pointer!important;box-shadow:0 7px 22px rgba(90,105,255,.35)!important;transition:transform .15s ease,filter .15s ease!important}.ccp215-fab:hover{transform:scale(1.06)!important;filter:brightness(1.08)!important}
    .ccp215-panel{position:fixed;z-index:2147483647;width:370px;max-width:calc(100vw - 20px);max-height:min(650px,calc(100vh - 20px));overflow:auto;background:#090d14;color:#f4f7fb;border:1px solid rgba(255,255,255,.12);border-radius:20px;box-shadow:0 30px 90px rgba(0,0,0,.7);font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overscroll-behavior:contain}
    .ccp215-head{padding:16px;background:linear-gradient(135deg,rgba(105,121,255,.2),rgba(154,105,255,.05));border-bottom:1px solid rgba(255,255,255,.08)}
    .ccp215-brand{display:flex;align-items:center;gap:10px}.ccp215-logo{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:linear-gradient(135deg,#6478ff,#9b69ff);font-size:17px}.ccp215-title{font-weight:850;font-size:15px}.ccp215-sub{font-size:10px;color:#8993a5;margin-top:3px}
    .ccp215-status{margin:11px 12px 4px;padding:9px 11px;border-radius:11px;background:rgba(255,255,255,.035);color:#aeb7c5;font-size:10px}.ccp215-status.ok{color:#75e2a5;background:rgba(50,210,125,.08)}.ccp215-status.err{color:#ff8796;background:rgba(255,70,95,.08)}
    .ccp215-context{margin:10px 12px;padding:11px;border:1px solid rgba(255,255,255,.07);border-radius:13px;color:#aeb7c5;font-size:11px;line-height:1.5;max-height:92px;overflow:auto}
    .ccp215-body{padding:10px}.ccp215-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ccp215-btn,.ccp215-back{border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(255,255,255,.035);color:#edf0f5;cursor:pointer}.ccp215-btn{min-height:70px;padding:10px;text-align:left}.ccp215-btn:hover,.ccp215-back:hover{background:rgba(105,121,255,.1);border-color:rgba(105,121,255,.3)}.ccp215-icon{display:block;font-size:17px;margin-bottom:6px}.ccp215-btn strong{display:block;font-size:11px}.ccp215-btn span{display:block;color:#748095;font-size:9px;margin-top:3px}.ccp215-selected{border-color:rgba(115,130,255,.72)!important;background:rgba(105,121,255,.14)!important}.ccp215-generate{width:100%;margin-top:9px;padding:12px;border:0;border-radius:12px;background:linear-gradient(135deg,#6579ff,#9a69ff);color:#fff;font-weight:850;cursor:pointer}.ccp215-back{width:100%;margin-top:8px;padding:10px}.ccp215-loading{text-align:center;padding:28px;color:#aeb7c5}.ccp215-dot{display:inline-block;width:5px;height:5px;border-radius:50%;background:#7888ff;margin:12px 3px 0;animation:ccp215p 1s infinite alternate}.ccp215-dot:nth-child(2){animation-delay:.15s}.ccp215-dot:nth-child(3){animation-delay:.3s}@keyframes ccp215p{to{opacity:.2;transform:translateY(-3px)}}
    .ccp215-translation{margin:10px!important;padding:12px!important;border-radius:13px!important;background:rgba(105,121,255,.08)!important;border:1px solid rgba(105,121,255,.15)!important;color:#eef1f7!important;direction:rtl!important;line-height:1.9!important}
  `;
  document.documentElement.appendChild(style);

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const tweetText = (tweet) => tweet?.querySelector('[data-testid="tweetText"]')?.innerText?.trim() || '';
  const replyButton = (tweet) => tweet?.querySelector('[data-testid="reply"]');
  const retweetButton = (tweet) => tweet?.querySelector('[data-testid="retweet"], [data-testid="unretweet"]');

  function close(){panel?.remove();panel=null;currentTweet=null;currentFab=null;busy=false;}
  function position(){
    if(!panel||!currentFab)return;
    const r=currentFab.getBoundingClientRect();
    const w=Math.min(370,innerWidth-20);
    const h=panel.offsetHeight||420;
    let top=r.bottom+8;
    if(top+h>innerHeight-10) top=r.top-h-8;
    panel.style.left=`${Math.max(10,Math.min(r.left,innerWidth-w-10))}px`;
    panel.style.top=`${Math.max(10,Math.min(top,innerHeight-h-10))}px`;
  }
  function setStatus(msg,type=''){const el=panel?.querySelector('.ccp215-status');if(el){el.textContent=msg;el.className=`ccp215-status ${type}`;position();}}
  function loading(msg){const body=panel?.querySelector('.ccp215-body');if(body){body.innerHTML=`<div class="ccp215-loading">${esc(msg)}<br><span class="ccp215-dot"></span><span class="ccp215-dot"></span><span class="ccp215-dot"></span></div>`;position();}}
  function actionButton(icon,title,desc,fn){const b=document.createElement('button');b.type='button';b.className='ccp215-btn';b.innerHTML=`<span class="ccp215-icon">${icon}</span><strong>${esc(title)}</strong><span>${esc(desc)}</span>`;b.onclick=(e)=>{e.preventDefault();e.stopPropagation();fn();};return b;}

  function askAI(messages,temperature=0.82){
    return new Promise(resolve=>{
      let done=false;
      const timer=setTimeout(()=>{if(!done){done=true;resolve({ok:false,error:'AI request timed out'})}},30000);
      chrome.runtime.sendMessage({type:'CCP_AI',temperature,messages},r=>{
        if(done)return;done=true;clearTimeout(timer);
        if(chrome.runtime.lastError)return resolve({ok:false,error:chrome.runtime.lastError.message});
        resolve(r?.ok?{ok:true,text:String(r.text||'').trim()}:{ok:false,error:r?.error||'AI request failed'});
      });
    });
  }

  function editorCandidates(scope=document){return [
    scope.querySelector('[data-testid="tweetTextarea_0"][contenteditable="true"]'),
    scope.querySelector('[data-testid="tweetTextarea_0"] [contenteditable="true"]'),
    scope.querySelector('[contenteditable="true"][role="textbox"]'),
    scope.querySelector('[role="textbox"][contenteditable="true"]'),
    scope.querySelector('[contenteditable="true"]')
  ].filter(Boolean);}

  function findEditor(scope=document){return editorCandidates(scope)[0]||null;}
  async function waitForEditor(timeout=8000){const end=Date.now()+timeout;while(Date.now()<end){const dialog=document.querySelector('[role="dialog"]');const editor=findEditor(dialog||document);if(editor)return editor;await sleep(120);}return null;}
  async function openReplyComposer(tweet){const button=replyButton(tweet);if(!button)return null;button.click();return waitForEditor(8000);}
  async function openNewPost(){const button=document.querySelector('[data-testid="SideNav_NewTweet_Button"]')||[...document.querySelectorAll('button,a,div[role="button"]')].find(x=>/post|tweet/i.test(x.getAttribute('aria-label')||x.textContent||''));if(!button)return null;button.click();return waitForEditor(8000);}

  function compareText(s){return String(s||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,' ').replace(/\s+/g,' ').trim();}
  function similarity(a,b){const x=compareText(a).split(' ').filter(w=>w.length>2),y=compareText(b).split(' ').filter(w=>w.length>2);if(!x.length||!y.length)return 0;const set=new Set(x);let shared=0;for(const w of y)if(set.has(w))shared++;return shared/y.length;}
  function isRepeated(t){const parts=compareText(t).split(/[.!?]+/).map(x=>x.trim()).filter(Boolean);for(let i=0;i<parts.length;i++)for(let j=i+1;j<parts.length;j++)if(parts[i].length>18&&parts[i]===parts[j])return true;return false;}
  function addEmoji(t){const s=String(t||'').trim();if(!s)return s;if(/[\p{Extended_Pictographic}]/u.test(s))return s;return `${s} 👀`;}
  function cleanReply(text,source){let s=String(text||'').trim().replace(/^reply\s*:\s*/i,'').replace(/^["'“”]+|["'“”]+$/g,'').trim();if(!s||compareText(s)===compareText(source)||similarity(source,s)>0.68||isRepeated(s))return '';return addEmoji(s);}

  // Replace whatever is currently in the editor, in one insertion. No second synthetic input event.
  function putText(editor,text){if(!editor)return false;editor.focus();try{const sel=window.getSelection();const range=document.createRange();range.selectNodeContents(editor);sel.removeAllRanges();sel.addRange(range);return document.execCommand('insertText',false,text)===true;}catch{return false;}}

  const replySystem='Write one short human Crypto Twitter reply. Never echo or summarize the source. Exactly one fitting emoji. No hashtags. No quotes. Output only the reply.';
  async function smartReply(tweet,style){
    if(busy)return;busy=true;
    const source=tweetText(tweet);if(!source){setStatus('❌ Tweet text not found','err');busy=false;return;}
    loading('Generating natural reply…');
    let r=await askAI([{role:'system',content:replySystem},{role:'user',content:`Write ONE ${style} reply to this Tweet. React to the underlying idea with a fresh opinion, observation or question. Do not restate, paraphrase, quote or summarize it. Under 25 words. Exactly one natural emoji.\n\n${source}`}]);
    let reply=r.ok?cleanReply(r.text,source):'';
    if(!reply){r=await askAI([{role:'system',content:replySystem},{role:'user',content:`Write a completely different ${style} reaction with different vocabulary and sentence structure. Do not reuse the Tweet wording. Under 25 words. Exactly one natural emoji.\n\n${source}`}],0.95);reply=r.ok?cleanReply(r.text,source):'';}
    if(!reply){setStatus(`❌ ${r.error||'Reply rejected as too similar'}`,'err');busy=false;return;}
    loading('Opening reply box for this Tweet…');
    const editor=await openReplyComposer(tweet);if(!editor){setStatus('❌ Could not open this Tweet reply box','err');busy=false;return;}
    if(!putText(editor,reply)){setStatus('❌ X rejected the reply text','err');busy=false;return;}
    setStatus('✓ Reply inserted once','ok');await sleep(500);close();
  }

  async function translate(tweet){if(busy)return;busy=true;const source=tweetText(tweet);loading('Translating…');const r=await askAI([{role:'system',content:'Translate Crypto Twitter into natural Persian. Keep names, tickers and crypto terms unchanged. Output only the translation.'},{role:'user',content:source}],0.3);if(!r.ok){setStatus(`❌ ${r.error}`,'err');busy=false;return;}let box=tweet.querySelector('.ccp215-translation');if(!box){box=document.createElement('div');box.className='ccp215-translation';tweet.appendChild(box);}box.textContent=r.text;close();}

  async function rewrite(tweet){if(busy)return;busy=true;loading('Rewriting for X…');const r=await askAI([{role:'system',content:'Rewrite this crypto post to sound sharper, clearer and genuinely human. Preserve meaning. Exactly one tasteful emoji. Output only the rewritten post.'},{role:'user',content:tweetText(tweet)}],0.78);if(!r.ok){setStatus(`❌ ${r.error}`,'err');busy=false;return;}close();const editor=await openNewPost();if(!editor||!putText(editor,r.text))console.warn('Crypto Copilot: rewrite composer unavailable');busy=false;}

  async function thread(tweet){if(busy)return;busy=true;loading('Building a 3-post thread…');const r=await askAI([{role:'system',content:'Write exactly three connected Crypto Twitter posts. Number 1/3, 2/3, 3/3. Human and non-repetitive. Up to one fitting emoji per post. Output only the thread.'},{role:'user',content:tweetText(tweet)}],0.8);if(!r.ok){setStatus(`❌ ${r.error}`,'err');busy=false;return;}close();const editor=await openNewPost();if(!editor||!putText(editor,r.text))console.warn('Crypto Copilot: thread composer unavailable');busy=false;}

  async function waitForQuoteMenu(){const end=Date.now()+5000;while(Date.now()<end){const items=[...document.querySelectorAll('[role="menuitem"], [role="option"]')];const item=items.find(el=>/quote|quote post/i.test((el.innerText||el.getAttribute('aria-label')||'').trim()));if(item)return item;await sleep(120);}return null;}
  async function quote(tweet){if(busy)return;busy=true;loading('Writing quote comment…');const r=await askAI([{role:'system',content:'Write one original quote-tweet comment reacting to the idea. Do not restate or paraphrase the source. Under 25 words. Exactly one natural emoji. Output only the comment.'},{role:'user',content:tweetText(tweet)}],0.85);if(!r.ok){setStatus(`❌ ${r.error}`,'err');busy=false;return;}const retweet=retweetButton(tweet);if(!retweet){setStatus('❌ Quote button not found','err');busy=false;return;}retweet.click();const item=await waitForQuoteMenu();if(!item){setStatus('❌ Quote option not found','err');busy=false;return;}item.click();const editor=await waitForEditor(8000);if(!editor||!putText(editor,addEmoji(r.text))){setStatus('❌ Quote composer not found','err');busy=false;return;}setStatus('✓ Quote inserted once','ok');await sleep(500);close();}

  function visibleTrends(){const seen=new Set(),out=[];for(const a of [...document.querySelectorAll('a[href*="/search?q="]')]){const text=(a.innerText||a.textContent||'').trim().replace(/\s+/g,' ');if(!text||text.length<2||text.length>120||/show more|search|what's happening/i.test(text)||seen.has(text))continue;seen.add(text);out.push(text);if(out.length>=8)break;}return out;}
  async function trendRadar(){const trends=visibleTrends();if(!trends.length){setStatus('⚠️ Open X Explore → Trending first','err');return;}const body=panel.querySelector('.ccp215-body');body.innerHTML=`<div style="padding:4px;color:#727d90;font-size:9px;font-weight:800;letter-spacing:.13em">VISIBLE X TRENDS</div>`+trends.map((x,i)=>`<button type="button" class="ccp215-back" data-trend="${i}" style="margin-top:7px">📈 ${esc(x)}</button>`).join('');body.querySelectorAll('[data-trend]').forEach(b=>b.onclick=async()=>{if(busy)return;busy=true;loading('Writing trend post…');const r=await askAI([{role:'system',content:'Write one natural crypto Twitter post about this visible trend. Do not invent facts. Exactly one fitting emoji. Output only the post.'},{role:'user',content:`Visible trend: ${trends[Number(b.dataset.trend)]}`}],0.82);if(!r.ok){setStatus(`❌ ${r.error}`,'err');busy=false;return;}close();const editor=await openNewPost();if(!editor||!putText(editor,r.text))console.warn('Crypto Copilot: trend composer unavailable');busy=false;});position();}

  function smartReplyUI(tweet){panel.innerHTML=`<div class="ccp215-head"><div class="ccp215-brand"><div class="ccp215-logo">⚡</div><div><div class="ccp215-title">Smart Reply</div><div class="ccp215-sub">Generate → insert directly into THIS Tweet</div></div></div></div><div class="ccp215-body"><div class="ccp215-grid" id="styles"></div><button class="ccp215-generate" id="generate">✨ Generate Reply</button><button class="ccp215-back" id="back">← Back</button></div>`;const styles=panel.querySelector('#styles');let selected='smart';[['◉','Short','Casual & punchy','short'],['✦','Smart','Natural & insightful','smart'],['◆','Professional','Clean & credible','professional']].forEach(([icon,title,desc,key])=>{const b=actionButton(icon,title,desc,()=>{selected=key;styles.querySelectorAll('button').forEach(x=>x.classList.remove('ccp215-selected'));b.classList.add('ccp215-selected');});if(key==='smart')b.classList.add('ccp215-selected');styles.appendChild(b);});panel.querySelector('#generate').onclick=()=>smartReply(tweet,selected);panel.querySelector('#back').onclick=()=>openPanel(tweet,currentFab);position();}

  function openPanel(tweet,fab){close();currentTweet=tweet;currentFab=fab;panel=document.createElement('div');panel.className='ccp215-panel';const text=tweetText(tweet),preview=text.length>180?text.slice(0,180)+'…':text;panel.innerHTML=`<div class="ccp215-head"><div class="ccp215-brand"><div class="ccp215-logo">✦</div><div><div class="ccp215-title">Crypto Copilot</div><div class="ccp215-sub">Natural AI tools for X</div></div></div></div>${preview?`<div class="ccp215-context">${esc(preview)}</div>`:''}<div class="ccp215-status">Checking API…</div><div class="ccp215-body"><div style="padding:4px;color:#727d90;font-size:9px;font-weight:800;letter-spacing:.13em">AI TOOLS</div><div class="ccp215-grid" id="grid"></div><button type="button" class="ccp215-back" id="test">🧪 Test API connection</button></div>`;document.body.appendChild(panel);const grid=panel.querySelector('#grid');grid.appendChild(actionButton('⚡','Smart Reply','Natural • direct reply',()=>smartReplyUI(tweet)));grid.appendChild(actionButton('🔁','Smart Quote','Fresh quote comment',()=>quote(tweet)));grid.appendChild(actionButton('🌍','Translate','Natural Persian',()=>translate(tweet)));grid.appendChild(actionButton('✎','Rewrite','Sharper new post',()=>rewrite(tweet)));grid.appendChild(actionButton('🧵','Thread','Three connected posts',()=>thread(tweet)));grid.appendChild(actionButton('📈','Trend Radar','Use visible X trends',()=>trendRadar()));panel.querySelector('#test').onclick=async()=>{if(busy)return;busy=true;loading('Testing API…');const r=await askAI([{role:'system',content:'Return exactly CCP_OK and nothing else.'},{role:'user',content:'CCP_TEST'}],0);setStatus(r.ok&&r.text==='CCP_OK'?'✓ API connected':`❌ ${r.error||'API failed'}`,r.ok&&r.text==='CCP_OK'?'ok':'err');busy=false;};chrome.storage.local.get('openrouter_api_key',d=>setStatus(d.openrouter_api_key?'✓ API connected':'⚠️ API not configured',d.openrouter_api_key?'ok':'err'));position();}

  function attach(tweet){if(tweet.querySelector('.ccp215-fab'))return;const host=tweet.querySelector('[role="group"]')||tweet.querySelector('[data-testid="reply"]')?.parentElement;if(!host)return;const b=document.createElement('button');b.className='ccp215-fab';b.type='button';b.textContent='✦';b.title='Crypto Copilot';b.setAttribute('aria-label','Crypto Copilot');b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openPanel(tweet,b)},{capture:true});host.appendChild(b);}
  function scan(){document.querySelectorAll('article').forEach(attach);}
  scan();new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});window.addEventListener('resize',position);window.addEventListener('scroll',position,true);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel)close();});document.addEventListener('click',e=>{if(panel&&!panel.contains(e.target)&&!e.target.closest('.ccp215-fab'))close();});
  console.log('🚀 Crypto Copilot V2.1.5 loaded');
})();
