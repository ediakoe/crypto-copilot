(() => {
  if (window.__cryptoCopilotCentralV400) return;
  window.__cryptoCopilotCentralV400 = true;
  console.log('🚀 Crypto Copilot Central AI 4.0.1 loaded');

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let panel = null;
  let currentTweet = null;
  let currentFab = null;
  let busy = false;

  const style = document.createElement('style');
  style.textContent = `
    .ccp223-fab{width:36px!important;height:36px!important;min-width:36px!important;margin:0 4px!important;padding:3px!important;border:1px solid rgba(120,215,255,.42)!important;border-radius:11px!important;background:#09101f!important;color:transparent!important;cursor:pointer!important;box-shadow:0 7px 22px rgba(90,105,255,.42)!important;display:grid!important;place-items:center!important;overflow:hidden!important;transition:transform .15s ease,filter .15s ease!important}
    .ccp223-panel{position:fixed;z-index:2147483647;width:370px;max-width:calc(100vw - 20px);max-height:min(650px,calc(100vh - 20px));overflow:auto;background:#090d14;color:#f4f7fb;border:1px solid rgba(255,255,255,.12);border-radius:20px;box-shadow:0 30px 90px rgba(0,0,0,.7);font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overscroll-behavior:contain}
    .ccp223-head{padding:16px;background:linear-gradient(135deg,rgba(105,121,255,.2),rgba(154,105,255,.05));border-bottom:1px solid rgba(255,255,255,.08)}
    .ccp223-brand{display:flex;align-items:center;gap:10px}.ccp223-logo img{width:100%;height:100%;display:block}.ccp223-logo{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:linear-gradient(135deg,#6478ff,#9b69ff);font-size:17px}.ccp223-title{font-weight:850;font-size:15px}.ccp223-sub{font-size:10px;color:#8993a5;margin-top:3px}
    .ccp223-status{margin:11px 12px 4px;padding:9px 11px;border-radius:11px;background:rgba(255,255,255,.035);color:#aeb7c5;font-size:10px}.ccp223-status.ok{color:#75e2a5;background:rgba(50,210,125,.08)}.ccp223-status.err{color:#ff8796;background:rgba(255,70,95,.08)}
    .ccp223-context{margin:10px 12px;padding:11px;border:1px solid rgba(255,255,255,.07);border-radius:13px;color:#aeb7c5;font-size:11px;line-height:1.5;max-height:92px;overflow:auto}
    .ccp223-body{padding:10px}.ccp223-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ccp223-btn,.ccp223-back{border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(255,255,255,.035);color:#edf0f5;cursor:pointer}.ccp223-btn{min-height:70px;padding:10px;text-align:left}.ccp223-btn:hover,.ccp223-back:hover{background:rgba(105,121,255,.1);border-color:rgba(105,121,255,.3)}.ccp223-icon{display:block;font-size:17px;margin-bottom:6px}.ccp223-btn strong{display:block;font-size:11px}.ccp223-btn span{display:block;color:#748095;font-size:9px;margin-top:3px}.ccp223-selected{border-color:rgba(115,130,255,.72)!important;background:rgba(105,121,255,.14)!important}.ccp223-generate{width:100%;margin-top:9px;padding:12px;border:0;border-radius:12px;background:linear-gradient(135deg,#6579ff,#9a69ff);color:#fff;font-weight:850;cursor:pointer}.ccp223-back{width:100%;margin-top:8px;padding:10px}.ccp223-loading{text-align:center;padding:28px;color:#aeb7c5}.ccp223-dot{display:inline-block;width:5px;height:5px;border-radius:50%;background:#7888ff;margin:12px 3px 0;animation:ccp223p 1s infinite alternate}.ccp223-dot:nth-child(2){animation-delay:.15s}.ccp223-dot:nth-child(3){animation-delay:.3s}@keyframes ccp223p{to{opacity:.2;transform:translateY(-3px)}}
    .ccp223-translation-head{padding:4px 3px 8px;color:#727d90;font-size:9px;font-weight:800;letter-spacing:.13em}.ccp223-translation{margin:4px 0 10px!important;padding:14px!important;border-radius:14px!important;background:rgba(105,121,255,.09)!important;border:1px solid rgba(105,121,255,.18)!important;color:#f2f4f8!important;direction:rtl!important;text-align:right!important;line-height:2!important;white-space:pre-wrap!important;max-height:360px!important;overflow:auto!important}
  `;
  document.documentElement.appendChild(style);

  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const tweetText = t => t?.querySelector('[data-testid="tweetText"]')?.innerText?.trim() || '';
  const replyButton = t => t?.querySelector('[data-testid="reply"]');
  const retweetButton = t => t?.querySelector('[data-testid="retweet"],[data-testid="unretweet"]');

  const isVisible = el => {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden';
  };

  const editorCandidates = scope => [...scope.querySelectorAll('[data-testid="tweetTextarea_0"][contenteditable="true"],[data-testid="tweetTextarea_0"] [contenteditable="true"],[role="textbox"][contenteditable="true"],[contenteditable="true"]')].filter(isVisible);

  function normalizeText(s){return String(s||'').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();}
  function editorText(editor){return normalizeText(editor?.innerText || editor?.textContent || '');}

  function activeReplyDialog(){
    const dialogs=[...document.querySelectorAll('[role="dialog"]')].filter(isVisible);
    return dialogs[dialogs.length-1] || null;
  }

  function findReplyEditor(){
    const dialog=activeReplyDialog();
    const list=dialog ? editorCandidates(dialog) : [];
    if(list.length) return list[0];
    const replyDialogs=[...document.querySelectorAll('[data-testid="modalDialog"],div[role="dialog"]')].filter(isVisible);
    for(const d of replyDialogs){
      const e=editorCandidates(d)[0];
      if(e) return e;
    }
    return editorCandidates(document).find(e=>{
      const a=e.closest('[role="dialog"]');
      return !!a || e.getAttribute('aria-label')?.toLowerCase().includes('reply');
    }) || null;
  }

  function setEditorText(editor,text){
    if(!editor) return false;
    editor.focus();
    try{document.execCommand('selectAll',false,null);}catch{}
    try{document.execCommand('insertText',false,text);}catch{}
    if(editorText(editor)!==normalizeText(text)){
      editor.innerHTML='';
      const line=document.createElement('div');
      line.textContent=text;
      editor.appendChild(line);
      editor.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:text}));
    }
    editor.dispatchEvent(new Event('change',{bubbles:true}));
    return editorText(editor)===normalizeText(text);
  }

  function clickReplyForTweet(tweet){
    const b=replyButton(tweet);
    if(!b) return false;
    b.click();
    return true;
  }

  async function ensureReplyEditor(tweet){
    let editor=findReplyEditor();
    if(editor) return editor;
    if(!clickReplyForTweet(tweet)) return null;
    for(let i=0;i<40;i++){
      await sleep(150);
      editor=findReplyEditor();
      if(editor) return editor;
    }
    return null;
  }

  function closePanel(){
    panel?.remove();
    panel=null;
  }

  function button(icon,title,sub,action){
    const b=document.createElement('button');
    b.className='ccp223-btn';
    b.innerHTML=`<span class="ccp223-icon">${icon}</span><strong>${esc(title)}</strong><span>${esc(sub)}</span>`;
    b.addEventListener('click',action);
    return b;
  }

  function openPanel(tweet,fab){
    closePanel();
    currentTweet=tweet;
    currentFab=fab;
    panel=document.createElement('div');
    panel.className='ccp223-panel';
    panel.innerHTML=`
      <div class="ccp223-head"><div class="ccp223-brand"><div class="ccp223-logo">✦</div><div><div class="ccp223-title">Crypto Copilot</div><div class="ccp223-sub">Central AI • Cloudflare</div></div></div></div>
      <div class="ccp223-status">Ready</div>
      <div class="ccp223-context">${esc(tweetText(tweet).slice(0,900) || 'Tweet text unavailable')}</div>
      <div class="ccp223-body"><div class="ccp223-grid" id="ccp-grid"></div><div id="ccp-output"></div></div>
    `;
    document.body.appendChild(panel);
    const r=fab.getBoundingClientRect();
    const x=Math.min(window.innerWidth-380,Math.max(10,r.right-370));
    const y=Math.min(window.innerHeight-670,Math.max(10,r.bottom+8));
    panel.style.left=`${x}px`;panel.style.top=`${y}px`;
    const grid=panel.querySelector('#ccp-grid');
    grid.append(
      button('↩','Smart Reply','Natural one-tap reply',()=>smartReply()),
      button('文','Translate','Translate tweet',()=>translate()),
      button('✎','Rewrite','Rewrite in a new post',()=>rewrite()),
      button('🧵','Thread','Turn into a thread',()=>thread())
    );
  }

  async function askAI(messages,model='openrouter/auto',temperature=.8){
    return new Promise((resolve,reject)=>{
      chrome.runtime.sendMessage({type:'CCP_AI',messages,model,temperature},response=>{
        if(chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
        if(!response?.ok) return reject(new Error(response?.error || 'Central AI request failed'));
        resolve(String(response.text||'').trim());
      });
    });
  }

  async function smartReply(){
    if(busy||!currentTweet) return;
    busy=true;
    const status=panel?.querySelector('.ccp223-status');
    if(status){status.className='ccp223-status';status.textContent='Generating reply…';}
    try{
      const text=tweetText(currentTweet);
      const reply=await askAI([
        {role:'system',content:'Write one short, natural human-sounding reply to the X post. Do not quote or repeat the post. Be specific, casual, and useful. One tasteful emoji maximum. Return only the reply text.'},
        {role:'user',content:text}
      ],'openrouter/auto',.8);
      if(!reply) throw new Error('Empty AI response');
      closePanel();
      const editor=await ensureReplyEditor(currentTweet);
      if(!editor) throw new Error('Reply editor not found');
      if(!setEditorText(editor,reply)) throw new Error('Could not insert reply');
    }catch(e){
      if(status){status.className='ccp223-status err';status.textContent=e.message||'Failed';}
    }finally{busy=false;}
  }

  async function translate(){
    if(busy||!currentTweet) return;
    busy=true;
    const output=panel?.querySelector('#ccp-output');
    const status=panel?.querySelector('.ccp223-status');
    if(status) status.textContent='Translating…';
    try{
      const text=tweetText(currentTweet);
      const translated=await askAI([
        {role:'system',content:'Translate the following text into natural Persian. Preserve meaning, names, tickers and numbers. Return only the translation.'},
        {role:'user',content:text}
      ],'openrouter/auto',.3);
      if(output) output.innerHTML=`<div class="ccp223-translation-head">PERSIAN TRANSLATION</div><div class="ccp223-translation">${esc(translated)}</div>`;
      if(status){status.className='ccp223-status ok';status.textContent='Done';}
    }catch(e){if(status){status.className='ccp223-status err';status.textContent=e.message||'Failed';}}finally{busy=false;}
  }

  async function openNewPost(){
    const b=document.querySelector('[data-testid="SideNav_NewTweet_Button"]');
    if(b){b.click();return true;}
    return false;
  }

  async function rewrite(){
    if(busy||!currentTweet)return;
    busy=true;
    const status=panel?.querySelector('.ccp223-status');
    if(status) status.textContent='Rewriting…';
    try{
      const text=tweetText(currentTweet);
      const rewritten=await askAI([
        {role:'system',content:'Rewrite this crypto/social post to be cleaner, sharper and natural. Keep the meaning. Return only the rewritten post.'},
        {role:'user',content:text}
      ],'openrouter/auto',.7);
      closePanel();
      await openNewPost();
      for(let i=0;i<40;i++){
        await sleep(150);
        const e=editorCandidates(document).find(x=>!x.closest('.ccp223-panel'));
        if(e){setEditorText(e,rewritten);break;}
      }
    }catch(e){if(status){status.className='ccp223-status err';status.textContent=e.message||'Failed';}}finally{busy=false;}
  }

  async function thread(){
    if(busy||!currentTweet)return;
    busy=true;
    const status=panel?.querySelector('.ccp223-status');
    if(status) status.textContent='Building thread…';
    try{
      const text=tweetText(currentTweet);
      const threadText=await askAI([
        {role:'system',content:'Turn this post into a concise 4-post crypto thread. Number each post 1/4 through 4/4. Keep each post punchy and natural.'},
        {role:'user',content:text}
      ],'openrouter/auto',.75);
      closePanel();
      await openNewPost();
      for(let i=0;i<40;i++){
        await sleep(150);
        const e=editorCandidates(document).find(x=>!x.closest('.ccp223-panel'));
        if(e){setEditorText(e,threadText);break;}
      }
    }catch(e){if(status){status.className='ccp223-status err';status.textContent=e.message||'Failed';}}finally{busy=false;}
  }

  function addFab(tweet){
    if(!tweet || tweet.querySelector('.ccp223-fab')) return;
    const actions=tweet.querySelector('[role="group"]');
    if(!actions)return;
    const b=document.createElement('button');
    b.className='ccp223-fab';
    b.type='button';
    b.setAttribute('aria-label','Crypto Copilot');
    b.innerHTML='<span style="font-size:16px;color:#fff">✦</span>';
    b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openPanel(tweet,b);});
    actions.appendChild(b);
  }

  function scan(){
    document.querySelectorAll('article[data-testid="tweet"],article').forEach(addFab);
  }

  const observer=new MutationObserver(()=>scan());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  scan();
})();