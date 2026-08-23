(() => {
  if (window.__cryptoCopilotV203) return;
  window.__cryptoCopilotV203 = true;

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let menu = null;
  let menuAnchor = null;

  const style = document.createElement('style');
  style.textContent = `
    .ccp-fab{width:34px!important;height:34px!important;min-width:34px!important;border:1px solid rgba(130,145,255,.65)!important;border-radius:11px!important;background:linear-gradient(135deg,#6478ff,#9a68ff)!important;color:#fff!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;font-size:16px!important;font-weight:900!important;cursor:pointer!important;padding:0!important;margin:0 5px!important;box-shadow:0 5px 20px rgba(105,120,255,.38)!important;z-index:5!important}
    .ccp-menu{position:fixed;z-index:2147483647;width:330px;background:#0b0e15;color:#f5f7fb;border:1px solid rgba(255,255,255,.12);border-radius:20px;box-shadow:0 25px 80px rgba(0,0,0,.62);overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    .ccp-head{padding:15px 16px;background:linear-gradient(135deg,rgba(105,121,255,.22),rgba(154,104,255,.08));border-bottom:1px solid rgba(255,255,255,.08)}.ccp-brand{display:flex;align-items:center;gap:10px;font-size:15px;font-weight:800}.ccp-logo{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(135deg,#6478ff,#9a68ff)}.ccp-sub{margin:4px 0 0 42px;color:#8993a5;font-size:10px}
    .ccp-context{margin:10px;padding:10px;border-radius:12px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);color:#aeb7c6;font-size:11px;line-height:1.45;max-height:58px;overflow:hidden}.ccp-body{padding:8px 10px 11px}.ccp-item{width:100%;border:0;background:transparent;color:#edf0f5;display:flex;align-items:center;gap:11px;text-align:left;border-radius:12px;padding:10px;cursor:pointer}.ccp-item:hover{background:rgba(255,255,255,.065)}.ccp-icon{width:31px;height:31px;border-radius:9px;background:rgba(255,255,255,.06);display:grid;place-items:center;flex:none}.ccp-label{font-size:12px;font-weight:700}.ccp-desc{margin-top:2px;color:#7f899b;font-size:10px}.ccp-arrow{margin-left:auto;color:#697386}.ccp-status{margin:10px;padding:10px;border-radius:11px;font-size:11px;line-height:1.45;background:rgba(255,255,255,.04);color:#9ba5b6}.ccp-status.ok{color:#72dfa2;background:rgba(62,210,126,.08)}.ccp-status.err{color:#ff8b98;background:rgba(255,70,95,.08)}.ccp-loading{padding:22px;text-align:center;color:#a6afbd;font-size:11px}.ccp-result{margin:10px;padding:12px;border-radius:13px;background:rgba(105,121,255,.08);border:1px solid rgba(105,121,255,.16);font-size:12px;line-height:1.55;white-space:pre-wrap;max-height:280px;overflow:auto}.ccp-actions{display:flex;gap:7px;margin-top:10px}.ccp-mini{flex:1;padding:8px;border:1px solid rgba(255,255,255,.09);border-radius:9px;background:rgba(255,255,255,.05);color:#e7eaf0;cursor:pointer}.ccp-trends{padding:10px}.ccp-trend{padding:10px;margin-bottom:7px;border:1px solid rgba(255,255,255,.07);border-radius:11px;background:rgba(255,255,255,.035);cursor:pointer}.ccp-trend:hover{background:rgba(105,121,255,.09)}
  `;
  document.documentElement.appendChild(style);

  const escapeHtml = s => String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const getText = tweet => tweet?.querySelector('[data-testid="tweetText"]')?.innerText?.trim() || '';
  const replyButton = tweet => tweet?.querySelector('[data-testid="reply"]');
  const retweetButton = tweet => tweet?.querySelector('[data-testid="retweet"]');
  const newTweetButton = () => document.querySelector('[data-testid="SideNav_NewTweet_Button"]') || document.querySelector('[data-testid="tweetButtonInline"]');
  const editor = () => document.querySelector('[role="dialog"] [contenteditable="true"]') || document.querySelector('[data-testid="tweetTextarea_0"] [contenteditable="true"]') || document.querySelector('[data-testid="tweetTextarea_0"][contenteditable="true"]');

  function closeMenu(){ if(menu){menu.remove();menu=null;} menuAnchor=null; }
  function place(){ if(!menu||!menuAnchor)return; const r=menuAnchor.getBoundingClientRect(),w=330,h=menu.offsetHeight||430; menu.style.left=Math.max(8,Math.min(r.left,innerWidth-w-8))+'px'; menu.style.top=Math.max(8,Math.min(r.bottom+8,innerHeight-h-8))+'px'; }

  function showStatus(text,type=''){ if(!menu)return; let s=menu.querySelector('.ccp-status'); if(!s){s=document.createElement('div');s.className='ccp-status';menu.appendChild(s);} s.className='ccp-status '+type;s.textContent=text;place(); }
  function loading(text){ if(menu)menu.innerHTML=`<div class="ccp-loading">${escapeHtml(text)}<br><br>● ● ●</div>`; }

  function askAI(system,user,temperature=.8){
    return new Promise(resolve=>{
      chrome.runtime.sendMessage({type:'CCP_AI',temperature,messages:[{role:'system',content:system},{role:'user',content:user}]},res=>{
        if(chrome.runtime.lastError){ resolve({ok:false,error:chrome.runtime.lastError.message}); return; }
        if(!res?.ok){ resolve({ok:false,error:res?.error||'Unknown AI error'}); return; }
        resolve({ok:true,text:res.text||''});
      });
    });
  }

  async function waitForEditor(timeout=7000){ const end=Date.now()+timeout; while(Date.now()<end){const e=editor();if(e)return e;await sleep(120);}return null; }
  async function insertText(text){
    const e=await waitForEditor();
    if(!e)return {ok:false,error:'Reply box not found after opening X composer.'};
    e.focus();
    try{document.execCommand('insertText',false,text);}catch{}
    if(!e.innerText.trim()){
      try{const range=document.createRange();range.selectNodeContents(e);range.collapse(false);const sel=getSelection();sel.removeAllRanges();sel.addRange(range);sel.getRangeAt(0).insertNode(document.createTextNode(text));e.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:text}));}catch{}
    }
    e.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:text}));
    return {ok:true};
  }

  async function runReply(tweet,styleName){
    const text=getText(tweet); if(!text){showStatus('⚠️ Could not read the tweet text.','err');return;}
    loading('Generating Smart Reply…');
    const spec={short:'under 12 words, punchy and human',smart:'under 25 words, insightful with one original opinion',professional:'under 25 words, credible and natural'}[styleName];
    const ai=await askAI(`Write ONE ${spec} crypto Twitter reply. Output only the reply. No hashtags. Maximum 2 emojis.`,text,.82);
    if(!ai.ok){menu.innerHTML='<div class="ccp-head"><div class="ccp-brand"><span class="ccp-logo">⚠️</span><span>Smart Reply</span></div></div>';showStatus('❌ '+ai.error,'err');return;}
    const b=replyButton(tweet);if(!b){showStatus('⚠️ X reply button was not found.','err');return;} b.click(); await sleep(700);
    const inserted=await insertText(ai.text); if(!inserted.ok){showStatus('⚠️ '+inserted.error,'err');return;} closeMenu();
  }

  async function translate(tweet){loading('Translating…');const ai=await askAI('Translate into natural Persian. Preserve crypto terminology, names and tone. Output only the translation.',getText(tweet),.2);if(!ai.ok){showStatus('❌ '+ai.error,'err');return;}let box=tweet.querySelector('.ccp-translate');if(!box){box=document.createElement('div');box.className='ccp-translate';box.style.cssText='margin:10px 12px;padding:12px;border-radius:13px;background:rgba(105,121,255,.09);border:1px solid rgba(105,121,255,.16);color:#eee;direction:rtl;line-height:1.8';tweet.appendChild(box);}box.textContent=ai.text;closeMenu();}

  async function resultView(title,text,tweet){if(!menu)return;menu.innerHTML=`<div class="ccp-head"><div class="ccp-brand"><span class="ccp-logo">✦</span><span>${escapeHtml(title)}</span></div><div class="ccp-sub">Generated by Crypto Copilot</div></div><div class="ccp-result">${escapeHtml(text)}<div class="ccp-actions"><button class="ccp-mini" id="ccCopy">Copy</button><button class="ccp-mini" id="ccInsert">Insert</button></div></div>`;menu.querySelector('#ccCopy').onclick=()=>navigator.clipboard?.writeText(text);menu.querySelector('#ccInsert').onclick=async()=>{const b=replyButton(tweet);if(b)b.click();else newTweetButton()?.click();await sleep(700);const r=await insertText(text);if(!r.ok)showStatus('⚠️ '+r.error,'err');else closeMenu();};place();}

  async function quote(tweet){const text=getText(tweet);loading('Creating Smart Quote…');const ai=await askAI('Write ONE short natural quote-tweet comment about this post. Add an original opinion. Under 25 words. No hashtags. Output only the comment.',text,.82);if(!ai.ok){showStatus('❌ '+ai.error,'err');return;}const rt=retweetButton(tweet);if(!rt){showStatus('⚠️ Retweet button not found.','err');return;}rt.click();await sleep(500);const candidates=[...document.querySelectorAll('[role="menuitem"],[role="menuitemradio"]')];const q=candidates.find(x=>/quote/i.test((x.innerText||x.textContent||'').trim()));if(!q){showStatus('⚠️ X Quote Tweet option was not found.','err');return;}q.click();await sleep(800);const r=await insertText(ai.text);if(!r.ok)showStatus('⚠️ '+r.error,'err');else closeMenu();}

  function trends(){const links=[...document.querySelectorAll('a[href*="/search?q="]')];const values=[];const seen=new Set();for(const a of links){const t=(a.innerText||a.textContent||'').trim().replace(/\s+/g,' ');if(t&&t.length>2&&!seen.has(t)&&!/^(search|advanced search)$/i.test(t)){seen.add(t);values.push(t);}}if(!menu)return;if(!values.length){menu.innerHTML='<div class="ccp-head"><div class="ccp-brand"><span class="ccp-logo">📈</span><span>Trend Radar</span></div><div class="ccp-sub">Open X → Explore → Trending first.</div></div>';return;}menu.innerHTML='<div class="ccp-head"><div class="ccp-brand"><span class="ccp-logo">📈</span><span>Trend Radar</span></div><div class="ccp-sub">Trends currently visible on X</div></div><div class="ccp-trends"></div>';const box=menu.querySelector('.ccp-trends');values.slice(0,8).forEach(t=>{const d=document.createElement('div');d.className='ccp-trend';d.innerHTML=`<b>${escapeHtml(t)}</b><br><small>Generate a post</small>`;d.onclick=async()=>{d.innerHTML='<small>Generating…</small>';const ai=await askAI(`Write one concise natural crypto Twitter post around this trend: ${t}. Do not invent facts. Output only the post.`);if(!ai.ok){d.innerHTML='<small>❌ '+escapeHtml(ai.error)+'</small>';return;}newTweetButton()?.click();await sleep(700);const r=await insertText(ai.text);if(!r.ok)d.innerHTML='<small>⚠️ '+escapeHtml(r.error)+'</small>';else closeMenu();};box.appendChild(d);});place();}

  function item(icon,label,desc,handler){const b=document.createElement('button');b.className='ccp-item';b.innerHTML=`<span class="ccp-icon">${icon}</span><span><div class="ccp-label">${escapeHtml(label)}</div><div class="ccp-desc">${escapeHtml(desc)}</div></span><span class="ccp-arrow">›</span>`;b.onclick=handler;return b;}

  function openMenu(tweet,anchor){closeMenu();menuAnchor=anchor;menu=document.createElement('div');menu.className='ccp-menu';const text=getText(tweet);menu.innerHTML=`<div class="ccp-head"><div class="ccp-brand"><span class="ccp-logo">✦</span><span>Crypto Copilot</span></div><div class="ccp-sub">AI tools for Crypto Twitter</div></div>${text?`<div class="ccp-context">${escapeHtml(text.slice(0,140))}${text.length>140?'…':''}</div>`:''}<div class="ccp-body"></div>`;const body=menu.querySelector('.ccp-body');body.appendChild(item('⚡','Smart Reply','Choose reply style',()=>{menu.innerHTML='<div class="ccp-head"><div class="ccp-brand"><span class="ccp-logo">⚡</span><span>Smart Reply</span></div><div class="ccp-sub">Select a style</div></div><div class="ccp-body"></div>';const b=menu.querySelector('.ccp-body');b.appendChild(item('◉','Short','Fast and punchy',()=>runReply(tweet,'short')));b.appendChild(item('✦','Smart','Fresh opinion',()=>runReply(tweet,'smart')));b.appendChild(item('◆','Professional','Credible reply',()=>runReply(tweet,'professional')));place();}));body.appendChild(item('🔁','Smart Quote','AI comment + Quote Tweet',()=>quote(tweet)));body.appendChild(item('📈','Trend Radar','Use trends visible on X',trends));body.appendChild(item('🌍','Translate','Natural Persian',()=>translate(tweet)));body.appendChild(item('✎','Rewrite','Sharper and clearer',async()=>{loading('Rewriting…');const ai=await askAI('Rewrite this post for Crypto Twitter. Make it sharper, clearer and more engaging while preserving meaning. Output only the rewritten text.',text,.75);if(ai.ok)resultView('Rewrite',ai.text,tweet);else showStatus('❌ '+ai.error,'err');}));body.appendChild(item('🧵','Thread','Turn into 3 posts',async()=>{loading('Building thread…');const ai=await askAI('Turn this idea into exactly 3 concise crypto Twitter posts. Number them 1/3, 2/3 and 3/3. Output only the thread.',text,.75);if(ai.ok)resultView('Thread',ai.text,tweet);else showStatus('❌ '+ai.error,'err');}));document.body.appendChild(menu);place();}

  function attach(tweet){if(tweet.querySelector('.ccp-fab'))return;const group=tweet.querySelector('[role="group"]');if(!group)return;const b=document.createElement('button');b.className='ccp-fab';b.type='button';b.textContent='✦';b.title='Crypto Copilot';b.setAttribute('aria-label','Crypto Copilot');b.onclick=e=>{e.preventDefault();e.stopPropagation();openMenu(tweet,b);};group.appendChild(b);}
  function scan(){document.querySelectorAll('article').forEach(attach);}
  scan();new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});document.addEventListener('click',e=>{if(menu&&!menu.contains(e.target)&&!e.target.closest('.ccp-fab'))closeMenu();});window.addEventListener('resize',place);window.addEventListener('scroll',closeMenu,true);
  console.log('🚀 Crypto Copilot V2.0.5 loaded');
})();