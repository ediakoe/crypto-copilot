(() => {
  if (window.__cryptoCopilotV217) return;
  window.__cryptoCopilotV217 = true;

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let panel = null;
  let currentTweet = null;
  let currentFab = null;
  let busy = false;

  const style = document.createElement('style');
  style.textContent = `
    .ccp217-fab{width:34px!important;height:34px!important;min-width:34px!important;margin:0 4px!important;padding:0!important;border:1px solid rgba(130,145,255,.72)!important;border-radius:11px!important;background:linear-gradient(135deg,#6478ff,#9b69ff)!important;color:#fff!important;font:800 16px/34px Arial!important;cursor:pointer!important;box-shadow:0 7px 22px rgba(90,105,255,.35)!important;transition:transform .15s ease,filter .15s ease!important}.ccp217-fab:hover{transform:scale(1.06)!important;filter:brightness(1.08)!important}
    .ccp217-panel{position:fixed;z-index:2147483647;width:370px;max-width:calc(100vw - 20px);max-height:min(650px,calc(100vh - 20px));overflow:auto;background:#090d14;color:#f4f7fb;border:1px solid rgba(255,255,255,.12);border-radius:20px;box-shadow:0 30px 90px rgba(0,0,0,.7);font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overscroll-behavior:contain}
    .ccp217-head{padding:16px;background:linear-gradient(135deg,rgba(105,121,255,.2),rgba(154,105,255,.05));border-bottom:1px solid rgba(255,255,255,.08)}
    .ccp217-brand{display:flex;align-items:center;gap:10px}.ccp217-logo{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:linear-gradient(135deg,#6478ff,#9b69ff);font-size:17px}.ccp217-title{font-weight:850;font-size:15px}.ccp217-sub{font-size:10px;color:#8993a5;margin-top:3px}
    .ccp217-status{margin:11px 12px 4px;padding:9px 11px;border-radius:11px;background:rgba(255,255,255,.035);color:#aeb7c5;font-size:10px}.ccp217-status.ok{color:#75e2a5;background:rgba(50,210,125,.08)}.ccp217-status.err{color:#ff8796;background:rgba(255,70,95,.08)}
    .ccp217-context{margin:10px 12px;padding:11px;border:1px solid rgba(255,255,255,.07);border-radius:13px;color:#aeb7c5;font-size:11px;line-height:1.5;max-height:92px;overflow:auto}
    .ccp217-body{padding:10px}.ccp217-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ccp217-btn,.ccp217-back{border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(255,255,255,.035);color:#edf0f5;cursor:pointer}.ccp217-btn{min-height:70px;padding:10px;text-align:left}.ccp217-btn:hover,.ccp217-back:hover{background:rgba(105,121,255,.1);border-color:rgba(105,121,255,.3)}.ccp217-icon{display:block;font-size:17px;margin-bottom:6px}.ccp217-btn strong{display:block;font-size:11px}.ccp217-btn span{display:block;color:#748095;font-size:9px;margin-top:3px}.ccp217-selected{border-color:rgba(115,130,255,.72)!important;background:rgba(105,121,255,.14)!important}.ccp217-generate{width:100%;margin-top:9px;padding:12px;border:0;border-radius:12px;background:linear-gradient(135deg,#6579ff,#9a69ff);color:#fff;font-weight:850;cursor:pointer}.ccp217-back{width:100%;margin-top:8px;padding:10px}.ccp217-loading{text-align:center;padding:28px;color:#aeb7c5}.ccp217-dot{display:inline-block;width:5px;height:5px;border-radius:50%;background:#7888ff;margin:12px 3px 0;animation:ccp217p 1s infinite alternate}.ccp217-dot:nth-child(2){animation-delay:.15s}.ccp217-dot:nth-child(3){animation-delay:.3s}@keyframes ccp217p{to{opacity:.2;transform:translateY(-3px)}}
    .ccp217-translation{margin:10px!important;padding:12px!important;border-radius:13px!important;background:rgba(105,121,255,.08)!important;border:1px solid rgba(105,121,255,.15)!important;color:#eef1f7!important;direction:rtl!important;line-height:1.9!important}
  `;
  document.documentElement.appendChild(style);

  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const tweetText = t => t?.querySelector('[data-testid="tweetText"]')?.innerText?.trim() || '';
  const replyButton = t => t?.querySelector('[data-testid="reply"]');
  const retweetButton = t => t?.querySelector('[data-testid="retweet"],[data-testid="unretweet"]');

  const isVisible = el => {
    if(!el || !el.isConnected) return false;
    const r=el.getBoundingClientRect();
    const cs=getComputedStyle(el);
    return r.width>0&&r.height>0&&cs.display!=='none'&&cs.visibility!=='hidden';
  };

  const editorCandidates = scope => [...scope.querySelectorAll('[data-testid="tweetTextarea_0"][contenteditable="true"],[data-testid="tweetTextarea_0"] [contenteditable="true"],[role="textbox"][contenteditable="true"],[contenteditable="true"]')].filter(isVisible);
  const normalizeText = s => String(s||'').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
  const editorText = editor => normalizeText(editor?.innerText||editor?.textContent||'');

  function findReplyEditor(tweet,before=new Set()){
    const local=editorCandidates(tweet);
    if(local.length)return local[0];
    const dialog=document.querySelector('[role="dialog"]');
    const scoped=editorCandidates(dialog||document);
    const fresh=scoped.find(e=>!before.has(e));
    return fresh||scoped[0]||null;
  }

  async function waitForReplyEditor(tweet,before){
    const end=Date.now()+9000;
    while(Date.now()<end){
      const editor=findReplyEditor(tweet,before);
      if(editor)return editor;
      await sleep(120);
    }
    return null;
  }

  async function openReplyComposer(tweet){
    const existing=findReplyEditor(tweet);
    if(existing)return existing;
    const before=new Set(editorCandidates(document));
    const button=replyButton(tweet);
    if(!button)return null;
    button.click();
    return waitForReplyEditor(tweet,before);
  }

  async function openDialogEditor(){
    const end=Date.now()+9000;
    while(Date.now()<end){
      const dialog=document.querySelector('[role="dialog"]');
      const editor=editorCandidates(dialog||document)[0];
      if(editor)return editor;
      await sleep(120);
    }
    return null;
  }

  async function openNewPost(){
    const before=new Set(editorCandidates(document));
    const btn=document.querySelector('[data-testid="SideNav_NewTweet_Button"]')||[...document.querySelectorAll('button,[role="button"]')].find(x=>/post|tweet/i.test(x.getAttribute('aria-label')||''));
    if(!btn)return null;
    btn.click();
    const end=Date.now()+9000;
    while(Date.now()<end){
      const dialog=document.querySelector('[role="dialog"]');
      const list=editorCandidates(dialog||document);
      const fresh=list.find(e=>!before.has(e));
      if(fresh)return fresh;
      if(list[0])return list[0];
      await sleep(120);
    }
    return null;
  }

  function comparable(s){return normalizeText(s).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,' ').replace(/\s+/g,' ').trim();}
  function similarity(a,b){const x=comparable(a).split(' ').filter(w=>w.length>2),y=comparable(b).split(' ').filter(w=>w.length>2);if(!x.length||!y.length)return 0;const set=new Set(x);let n=0;for(const w of y)if(set.has(w))n++;return n/y.length;}
  function repeated(s){const parts=comparable(s).split(/[.!?]+/).map(x=>x.trim()).filter(Boolean);for(let i=0;i<parts.length;i++)for(let j=i+1;j<parts.length;j++)if(parts[i].length>16&&parts[i]===parts[j])return true;return false;}
  const emojiRe=/[\p{Extended_Pictographic}]/gu;
  function ensureOneEmoji(text,source=''){
    const s=String(text||'').trim();
    const found=s.match(emojiRe)||[];
    if(found.length===1)return s;
    if(found.length>1){let first=true;return s.replace(emojiRe,()=>first?(first=false,found[0]):'').replace(/\s{2,}/g,' ').trim();}
    const lower=String(source).toLowerCase();
    const emoji=/rocket|launch|base|token|airdrop|profit|bull|market|trade|price|pump|up|growth/.test(lower)?'🚀':/smart|learn|idea|think|analysis|why/.test(lower)?'🧠':'👀';
    return `${s} ${emoji}`.trim();
  }

  function cleanReply(text,source){
    let out=normalizeText(text).replace(/^reply\s*:\s*/i,'').replace(/^['"“”]+|['"“”]+$/g,'').trim();
    if(!out||comparable(out)===comparable(source)||similarity(source,out)>0.68||repeated(out))return '';
    return ensureOneEmoji(out,source);
  }

  function selectAllEditorContent(editor){
    editor.focus();
    const sel=window.getSelection();
    const range=document.createRange();
    range.selectNodeContents(editor);
    sel.removeAllRanges();
    sel.addRange(range);
    return sel;
  }

  function insertReactFriendly(editor,text){
    const sel=selectAllEditorContent(editor);
    let changed=false;
    try{changed=document.execCommand('insertText',false,text)===true;}catch{}
    if(changed)return true;
    try{
      editor.textContent=text;
      editor.focus();
      const range=document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      editor.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:text}));
      return true;
    }catch{return false;}
  }

  async function insertIntoComposer(editor,text){
    if(!editor||!isVisible(editor))return {ok:false,error:'Editor is not visible'};
    if(editorText(editor))return {ok:false,error:'Composer already contains text'};
    const expected=normalizeText(text);
    try{
      if(!insertReactFriendly(editor,text))return {ok:false,error:'X rejected the insertion operation'};
      await sleep(120);
      let actual=editorText(editor);
      if(actual===expected)return {ok:true,actualText:actual};
      await sleep(300);
      actual=editorText(editor);
      if(actual===expected)return {ok:true,actualText:actual};
      return {ok:false,error:`Composer verification failed. Actual: ${actual||'(empty)'}`};
    }catch(e){return {ok:false,error:e?.message||'Composer insertion failed'};}
  }

  let panel=null,currentTweet=null,currentFab=null,busy=false;
  function close(){panel?.remove();panel=null;currentTweet=null;currentFab=null;busy=false;}
  function position(){if(!panel||!currentFab)return;const r=currentFab.getBoundingClientRect(),w=Math.min(370,innerWidth-20),h=panel.offsetHeight||420;let top=r.bottom+8;if(top+h>innerHeight-10)top=r.top-h-8;panel.style.left=Math.max(10,Math.min(r.left,innerWidth-w-10))+'px';panel.style.top=Math.max(10,Math.min(top,innerHeight-h-10))+'px';}
  function setStatus(msg,type=''){const el=panel?.querySelector('.ccp217-status');if(el){el.textContent=msg;el.className='ccp217-status '+type;position();}}
  function loading(msg){const body=panel?.querySelector('.ccp217-body');if(body){body.innerHTML=`<div class="ccp217-loading">${esc(msg)}<br><span class="ccp217-dot"></span><span class="ccp217-dot"></span><span class="ccp217-dot"></span></div>`;position();}}
  function action(icon,title,desc,fn){const b=document.createElement('button');b.type='button';b.className='ccp217-btn';b.innerHTML=`<span class="ccp217-icon">${icon}</span><strong>${esc(title)}</strong><span>${esc(desc)}</span>`;b.onclick=e=>{e.preventDefault();e.stopPropagation();fn();};return b;}

  function askAI(messages,temperature=.82){return new Promise(resolve=>{let done=false;const timer=setTimeout(()=>{if(!done){done=true;resolve({ok:false,error:'AI request timed out'})}},30000);chrome.runtime.sendMessage({type:'CCP_AI',temperature,messages},r=>{if(done)return;done=true;clearTimeout(timer);if(chrome.runtime.lastError)return resolve({ok:false,error:chrome.runtime.lastError.message});resolve(r?.ok?{ok:true,text:String(r.text||'').trim()}:{ok:false,error:r?.error||'AI request failed'});});});}

  const replySystem='Write one short natural human Crypto Twitter reply. Never echo, paraphrase or summarize the source Tweet. Exactly ONE fitting emoji. No hashtags. No quotes. Output only the reply.';
  async function smartReply(tweet,style){
    if(busy)return;busy=true;
    const source=tweetText(tweet);
    if(!source){setStatus('❌ Tweet text not found','err');busy=false;return;}
    loading('Generating natural reply…');
    let r=await askAI([{role:'system',content:replySystem},{role:'user',content:`Create ONE ${style} reaction to this Tweet. Fresh opinion, observation or question. Under 25 words. Exactly one natural emoji.\n\nSOURCE:\n${source}`}]);
    let reply=r.ok?cleanReply(r.text,source):'';
    if(!reply){r=await askAI([{role:'system',content:replySystem},{role:'user',content:`Create a completely different reaction with different vocabulary and sentence structure. Do not reuse wording from the Tweet. Under 25 words. Exactly one natural emoji.\n\nSOURCE:\n${source}`}],.95);reply=r.ok?cleanReply(r.text,source):'';}
    if(!reply){setStatus(`❌ ${r.error||'Generated reply rejected as duplicate'}`,'err');busy=false;return;}
    loading('Opening THIS Tweet reply box…');
    const editor=await openReplyComposer(tweet);
    if(!editor){setStatus('❌ Reply composer for this Tweet was not found','err');busy=false;return;}
    const result=await insertIntoComposer(editor,reply);
    if(!result.ok){setStatus(`❌ ${result.error}`,'err');busy=false;return;}
    setStatus('✓ Reply inserted and verified once','ok');await sleep(650);close();
  }

  async function translate(tweet){if(busy)return;busy=true;const source=tweetText(tweet);if(!source){setStatus('❌ Tweet text not found','err');busy=false;return;}loading('Translating…');const r=await askAI([{role:'system',content:'Translate this Crypto Twitter text into natural Persian. Preserve names, tickers and crypto terminology. Output only the translation.'},{role:'user',content:source}],.3);if(!r.ok){setStatus(`❌ ${r.error}`,'err');busy=false;return;}let box=tweet.querySelector('.ccp217-translation');if(!box){box=document.createElement('div');box.className='ccp217-translation';tweet.appendChild(box);}box.textContent=r.text;close();}

  async function rewrite(tweet){if(busy)return;busy=true;loading('Rewriting…');const r=await askAI([{role:'system',content:'Rewrite this crypto post to sound sharper, clearer and genuinely human. Preserve meaning. Exactly one tasteful emoji. Output only the rewritten post.'},{role:'user',content:tweetText(tweet)}],.78);if(!r.ok){setStatus(`❌ ${r.error}`,'err');busy=false;return;}close();const e=await openNewPost();if(!e){busy=false;return;}const out=await insertIntoComposer(e,r.text);if(!out.ok)console.warn('Crypto Copilot rewrite:',out.error);busy=false;}

  async function thread(tweet){if(busy)return;busy=true;loading('Building 3-post thread…');const r=await askAI([{role:'system',content:'Create exactly 3 connected Crypto Twitter posts. Number them 1/3, 2/3, 3/3. Human, concise and non-repetitive. One fitting emoji per post. Output only the three posts separated by blank lines.'},{role:'user',content:tweetText(tweet)}],.8);if(!r.ok){setStatus(`❌ ${r.error}`,'err');busy=false;return;}close();const e=await openNewPost();if(!e){busy=false;return;}const out=await insertIntoComposer(e,r.text);if(!out.ok)console.warn('Crypto Copilot thread:',out.error);busy=false;}

  async function quote(tweet){if(busy)return;busy=true;loading('Writing quote comment…');const r=await askAI([{role:'system',content:'Write one fresh quote-tweet comment reacting to the idea. Do not restate or paraphrase the source. Under 25 words. Exactly one fitting emoji. No hashtags. Output only the comment.'},{role:'user',content:tweetText(tweet)}],.85);if(!r.ok){setStatus(`❌ ${r.error}`,'err');busy=false;return;}const rb=retweetButton(tweet);if(!rb){setStatus('❌ Quote button not found','err');busy=false;return;}rb.click();const end=Date.now()+5000;let item=null;while(Date.now()<end&&!item){item=[...document.querySelectorAll('[role="menuitem"],[role="option"]')].find(x=>/quote/i.test((x.innerText||x.getAttribute('aria-label')||'').trim()));if(!item)await sleep(120);}if(!item){setStatus('❌ Quote option not found','err');busy=false;return;}item.click();const editor=await openDialogEditor();if(!editor){setStatus('❌ Quote composer not found','err');busy=false;return;}const out=await insertIntoComposer(editor,ensureOneEmoji(r.text,tweetText(tweet)));if(!out.ok){setStatus(`❌ ${out.error}`,'err');busy=false;return;}setStatus('✓ Quote inserted and verified once','ok');await sleep(500);close();}

  function visibleTrends(){const out=[],seen=new Set();for(const a of [...document.querySelectorAll('a[href*="/search?q="]')]){const t=normalizeText(a.innerText||a.textContent);if(!t||t.length<2||t.length>120||/show more|search|what's happening/i.test(t)||seen.has(t))continue;seen.add(t);out.push(t);if(out.length>=8)break;}return out;}
  async function trendRadar(){const trends=visibleTrends();if(!trends.length){setStatus('⚠️ Open X Explore → Trending first','err');return;}const body=panel.querySelector('.ccp217-body');body.innerHTML=`<div style="padding:4px;color:#727d90;font-size:9px;font-weight:800;letter-spacing:.13em">VISIBLE X TRENDS</div>`+trends.map((t,i)=>`<button type="button" class="ccp217-back" data-t="${i}" style="margin-top:7px">📈 ${esc(t)}</button>`).join('');body.querySelectorAll('[data-t]').forEach(b=>b.onclick=async()=>{if(busy)return;busy=true;loading('Writing trend post…');const r=await askAI([{role:'system',content:'Write one natural Crypto Twitter post about the visible trend. Do not invent facts. Exactly one fitting emoji. Output only the post.'},{role:'user',content:`Visible trend: ${trends[Number(b.dataset.t)]}`}],.82);if(!r.ok){setStatus(`❌ ${r.error}`,'err');busy=false;return;}close();const e=await openNewPost();if(e){const out=await insertIntoComposer(e,r.text);if(!out.ok)console.warn('Crypto Copilot trend:',out.error);}busy=false;});position();}

  function replyUI(tweet){panel.innerHTML=`<div class="ccp217-head"><div class="ccp217-brand"><div class="ccp217-logo">⚡</div><div><div class="ccp217-title">Smart Reply</div><div class="ccp217-sub">Generate → insert directly into THIS Tweet</div></div></div></div><div class="ccp217-body"><div class="ccp217-grid" id="styles"></div><button class="ccp217-generate" id="gen">✨ Generate Reply</button><button class="ccp217-back" id="back">← Back</button></div>`;const styles=panel.querySelector('#styles');let selected='smart';[['◉','Short','Casual & punchy','short'],['✦','Smart','Natural & insightful','smart'],['◆','Professional','Clean & credible','professional']].forEach(([i,t,d,k])=>{const b=action(i,t,d,()=>{selected=k;styles.querySelectorAll('button').forEach(x=>x.classList.remove('ccp217-selected'));b.classList.add('ccp217-selected')});if(k==='smart')b.classList.add('ccp217-selected');styles.appendChild(b)});panel.querySelector('#gen').onclick=()=>smartReply(tweet,selected);panel.querySelector('#back').onclick=()=>openPanel(tweet,currentFab);position();}

  function openPanel(tweet,fab){close();currentTweet=tweet;currentFab=fab;panel=document.createElement('div');panel.className='ccp217-panel';const preview=tweetText(tweet);panel.innerHTML=`<div class="ccp217-head"><div class="ccp217-brand"><div class="ccp217-logo">✦</div><div><div class="ccp217-title">Crypto Copilot</div><div class="ccp217-sub">Natural AI tools for X</div></div></div></div>${preview?`<div class="ccp217-context">${esc(preview.slice(0,180))}${preview.length>180?'…':''}</div>`:''}<div class="ccp217-status">Checking API…</div><div class="ccp217-body"><div style="padding:4px 3px 8px;color:#727d90;font-size:9px;font-weight:800;letter-spacing:.13em">AI TOOLS</div><div class="ccp217-grid" id="grid"></div><button type="button" class="ccp217-back" id="test">🧪 Test API connection</button></div>`;document.body.appendChild(panel);const g=panel.querySelector('#grid');g.appendChild(action('⚡','Smart Reply','Natural • direct reply',()=>replyUI(tweet)));g.appendChild(action('🔁','Smart Quote','Fresh quote comment',()=>quote(tweet)));g.appendChild(action('🌍','Translate','Natural Persian',()=>translate(tweet)));g.appendChild(action('✎','Rewrite','Sharper new post',()=>rewrite(tweet)));g.appendChild(action('🧵','Thread','Three connected posts',()=>thread(tweet)));g.appendChild(action('📈','Trend Radar','Use visible X trends',()=>trendRadar()));panel.querySelector('#test').onclick=async()=>{if(busy)return;busy=true;loading('Testing API…');const r=await askAI([{role:'system',content:'Return exactly CCP_OK.'},{role:'user',content:'CCP_TEST'}],0);setStatus(r.ok&&r.text==='CCP_OK'?'✓ API connected':`❌ ${r.error||'API failed'}`,r.ok?'ok':'err');busy=false;};chrome.storage.local.get('openrouter_api_key',d=>setStatus(d.openrouter_api_key?'✓ API connected':'⚠️ API not configured',d.openrouter_api_key?'ok':'err'));position();}

  function attach(tweet){if(tweet.querySelector('.ccp217-fab'))return;const host=tweet.querySelector('[role="group"]')||tweet.querySelector('[data-testid="reply"]')?.parentElement;if(!host)return;const b=document.createElement('button');b.className='ccp217-fab';b.type='button';b.textContent='✦';b.title='Crypto Copilot';b.setAttribute('aria-label','Crypto Copilot');b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openPanel(tweet,b)},{capture:true});host.appendChild(b);}
  function scan(){document.querySelectorAll('article').forEach(attach);}
  scan();new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});window.addEventListener('scroll',position,true);window.addEventListener('resize',position);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel)close();});document.addEventListener('click',e=>{if(panel&&!panel.contains(e.target)&&!e.target.closest('.ccp217-fab'))close();});
  console.log('🚀 Crypto Copilot V2.1.7 loaded');
})();