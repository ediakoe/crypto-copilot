(() => {
  if (window.__cryptoCopilotCentralV406) return;
  window.__cryptoCopilotCentralV406 = true;
  console.log('🚀 Crypto Copilot Central AI 4.0.6 loaded');

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let panel = null;
  let currentTweet = null;
  let currentFab = null;
  let busy = false;

  const style = document.createElement('style');
  style.textContent = `
    .ccp406-fab{width:38px!important;height:38px!important;min-width:38px!important;margin:0 4px!important;padding:1px!important;border:1px solid rgba(130,220,255,.55)!important;border-radius:12px!important;background:linear-gradient(145deg,#09101f,#121936)!important;color:transparent!important;cursor:pointer!important;box-shadow:0 0 0 1px rgba(130,220,255,.12),0 7px 22px rgba(77,110,255,.34),0 0 18px rgba(110,92,255,.18)!important;display:grid!important;place-items:center!important;overflow:hidden!important;transition:transform .18s ease,box-shadow .18s ease,filter .18s ease!important}.ccp406-fab:hover{transform:translateY(-1px) scale(1.05)!important;box-shadow:0 0 0 1px rgba(160,230,255,.18),0 10px 28px rgba(77,110,255,.45),0 0 24px rgba(140,100,255,.28)!important;filter:saturate(1.08)!important}.ccp406-fab img{width:100%!important;height:100%!important;display:block!important;border-radius:10px!important}
    .ccp406-panel{position:fixed;z-index:2147483647;width:370px;max-width:calc(100vw - 20px);max-height:min(650px,calc(100vh - 20px));overflow:auto;background:#090d14;color:#f4f7fb;border:1px solid rgba(255,255,255,.12);border-radius:20px;box-shadow:0 30px 90px rgba(0,0,0,.7);font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overscroll-behavior:contain}
    .ccp406-head{padding:16px;background:linear-gradient(135deg,rgba(105,121,255,.2),rgba(154,105,255,.05));border-bottom:1px solid rgba(255,255,255,.08)}
    .ccp406-brand{display:flex;align-items:center;gap:10px}.ccp406-logo img{width:100%;height:100%;display:block}.ccp406-logo img{width:100%;height:100%;display:block}.ccp406-logo{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:linear-gradient(135deg,#6478ff,#9b69ff);font-size:17px}.ccp406-title{font-weight:850;font-size:15px}.ccp406-sub{font-size:10px;color:#8993a5;margin-top:3px}
    .ccp406-status{margin:11px 12px 4px;padding:9px 11px;border-radius:11px;background:rgba(255,255,255,.035);color:#aeb7c5;font-size:10px}.ccp406-status.ok{color:#75e2a5;background:rgba(50,210,125,.08)}.ccp406-status.err{color:#ff8796;background:rgba(255,70,95,.08)}
    .ccp406-context{margin:10px 12px;padding:11px;border:1px solid rgba(255,255,255,.07);border-radius:13px;color:#aeb7c5;font-size:11px;line-height:1.5;max-height:92px;overflow:auto}
    .ccp406-body{padding:10px}.ccp406-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ccp406-btn,.ccp406-back{border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(255,255,255,.035);color:#edf0f5;cursor:pointer}.ccp406-btn{min-height:70px;padding:10px;text-align:left}.ccp406-btn:hover,.ccp406-back:hover{background:rgba(105,121,255,.1);border-color:rgba(105,121,255,.3)}.ccp406-icon{display:block;font-size:17px;margin-bottom:6px}.ccp406-btn strong{display:block;font-size:11px}.ccp406-btn span{display:block;color:#748095;font-size:9px;margin-top:3px}.ccp406-selected{border-color:rgba(115,130,255,.72)!important;background:rgba(105,121,255,.14)!important}.ccp406-generate{width:100%;margin-top:9px;padding:12px;border:0;border-radius:12px;background:linear-gradient(135deg,#6579ff,#9a69ff);color:#fff;font-weight:850;cursor:pointer}.ccp406-back{width:100%;margin-top:8px;padding:10px}.ccp406-loading{text-align:center;padding:28px;color:#aeb7c5}.ccp406-dot{display:inline-block;width:5px;height:5px;border-radius:50%;background:#7888ff;margin:12px 3px 0;animation:ccp402p 1s infinite alternate}.ccp406-dot:nth-child(2){animation-delay:.15s}.ccp406-dot:nth-child(3){animation-delay:.3s}@keyframes ccp402p{to{opacity:.2;transform:translateY(-3px)}}
    .ccp406-ideas{display:grid;gap:8px}.ccp406-idea{width:100%;padding:12px;text-align:left;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(255,255,255,.035);color:#edf0f5;cursor:pointer}.ccp406-idea:hover{background:rgba(105,121,255,.1);border-color:rgba(105,121,255,.32);transform:translateY(-1px)}.ccp406-idea-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}.ccp406-idea-title{font-weight:850;font-size:11px}.ccp406-idea-copy{font-size:12px;line-height:1.45;color:#dfe5ee}.ccp406-idea-hint{font-size:9px;color:#6f7b8f;margin-top:7px}.ccp406-back{transition:transform .15s ease}
    .ccp406-translation-head{padding:4px 3px 8px;color:#727d90;font-size:9px;font-weight:800;letter-spacing:.13em}.ccp406-translation{margin:4px 0 10px!important;padding:14px!important;border-radius:14px!important;background:rgba(105,121,255,.09)!important;border:1px solid rgba(105,121,255,.18)!important;color:#f2f4f8!important;direction:rtl!important;text-align:right!important;line-height:2!important;white-space:pre-wrap!important;max-height:360px!important;overflow:auto!important}
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

  const editorCandidates = scope => [...scope.querySelectorAll('[role="textbox"][contenteditable="true"],[data-testid="tweetTextarea_0"][contenteditable="true"],div[contenteditable="true"]')]
    .filter(isVisible)
    .filter(e=>e.isContentEditable)
    .filter(e=>!e.closest('.ccp406-panel'))
    .filter(e=>!e.parentElement?.closest('[contenteditable="true"]'));

  function normalizeText(s){return String(s||'').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();}
  function editorText(editor){return normalizeText(editor?.innerText || editor?.textContent || '');}

  function tweetArticle(node){return node?.closest?.('article')||node||null;}

  function editorScore(editor,tweet){
    if(!isVisible(editor))return -1e9;
    const article=tweetArticle(tweet);if(!article)return -1e9;
    let score=0;
    if(article.contains(editor))score+=12000;
    const label=String(editor.getAttribute('aria-label')||editor.getAttribute('data-testid')||'').toLowerCase();
    if(/reply|post your reply/.test(label))score+=6000;
    if(/new post|compose/.test(label))score-=8000;
    const er=editor.getBoundingClientRect(),ar=article.getBoundingClientRect();
    score-=Math.min(6000,Math.hypot((er.left+er.width/2)-(ar.left+ar.width/2),(er.top+er.height/2)-(ar.top+ar.height/2)));
    return score;
  }

  function findReplyEditor(tweet,before=new Set()){
    const art=tweetArticle(tweet);
    const local=art?editorCandidates(art).filter(e=>!before.has(e)):[];
    if(local.length){
      local.sort((a,b)=>editorScore(b,tweet)-editorScore(a,tweet));
      return local[0];
    }
    const dialogs=[...document.querySelectorAll('[role="dialog"],[data-testid="modalDialog"]')].filter(isVisible).reverse();
    for(const d of dialogs){
      const list=editorCandidates(d).filter(e=>!before.has(e));
      if(list.length){
        list.sort((a,b)=>{
          const al=String(a.getAttribute('aria-label')||'').toLowerCase();
          const bl=String(b.getAttribute('aria-label')||'').toLowerCase();
          const as=/reply|post your reply/.test(al)?1000:0;
          const bs=/reply|post your reply/.test(bl)?1000:0;
          return bs-as;
        });
        return list[0];
      }
    }
    return null;
  }

  async function waitForReplyEditor(tweet,before){
    const end=Date.now()+10000;
    while(Date.now()<end){
      const e=findReplyEditor(tweet,before);
      if(e)return e;
      await sleep(120);
    }
    return null;
  }

  async function openReplyComposer(tweet){
    const article=tweetArticle(tweet);
    const local=article?editorCandidates(article).find(e=>!e.closest('.ccp406-panel')):null;
    if(local)return local;

    const before=new Set(editorCandidates(document));
    const button=replyButton(tweet);if(!button)return null;
    button.click();
    return waitForReplyEditor(tweet,before);
  }

  async function openDialogEditor(timeout=10000){
    const end=Date.now()+timeout;
    while(Date.now()<end){
      const dialogs=[...document.querySelectorAll('[role="dialog"]')].filter(isVisible).reverse();
      const d=dialogs[0];
      const e=d?editorCandidates(d).find(x=>!x.closest('.ccp406-panel')):null;
      if(e)return e;
      await sleep(120);
    }
    return null;
  }

  async function openNewPost(){
    const before=new Set(editorCandidates(document));
    const btn=document.querySelector('[data-testid="SideNav_NewTweet_Button"]');if(!btn)return null;
    btn.click();
    const end=Date.now()+10000;
    while(Date.now()<end){
      const dialog=document.querySelector('[role="dialog"]');
      if(dialog){
        const fresh=editorCandidates(dialog)
          .filter(e=>!e.closest('.ccp406-panel'))
          .find(e=>!before.has(e));
        if(fresh)return fresh;
      }
      await sleep(120);
    }
    return null;
  }

  function comparable(s){return normalizeText(s).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,' ').replace(/\s+/g,' ').trim();}
  function similarity(a,b){const x=comparable(a).split(' ').filter(w=>w.length>2),y=comparable(b).split(' ').filter(w=>w.length>2);if(!x.length||!y.length)return 0;const set=new Set(x);let n=0;for(const w of y)if(set.has(w))n++;return n/y.length;}
  function repeated(s){const parts=comparable(s).split(/[.!?]+/).map(x=>x.trim()).filter(Boolean);for(let i=0;i<parts.length;i++)for(let j=i+1;j<parts.length;j++)if(parts[i].length>16&&parts[i]===parts[j])return true;return false;}
  const emojiRe=/[\p{Extended_Pictographic}]/gu;
  function ensureOneEmoji(text,source=''){const s=String(text||'').trim(),found=s.match(emojiRe)||[];if(found.length===1)return s;if(found.length>1){let first=true;return s.replace(emojiRe,()=>first?(first=false,found[0]):'').replace(/\s{2,}/g,' ').trim();}const lower=String(source).toLowerCase();const em=/rocket|launch|base|token|airdrop|profit|bull|market|trade|price|pump|up|growth/.test(lower)?'🚀':/smart|learn|idea|think|analysis|why/.test(lower)?'🧠':'👀';return `${s} ${em}`.trim();}
  function cleanReply(text,source){let out=normalizeText(text).replace(/^reply\s*:\s*/i,'').replace(/^['"“”]+|['"“”]+$/g,'').trim();if(!out||comparable(out)===comparable(source)||similarity(source,out)>0.68||repeated(out))return '';return ensureOneEmoji(out,source);}

  function selectAllEditorContent(editor){editor.focus();const sel=window.getSelection();const range=document.createRange();range.selectNodeContents(editor);sel.removeAllRanges();sel.addRange(range);}
  function fireInput(editor,text){try{editor.dispatchEvent(new InputEvent('beforeinput',{bubbles:true,cancelable:true,inputType:'insertText',data:text}));}catch{} try{editor.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:text}));}catch{editor.dispatchEvent(new Event('input',{bubbles:true}))}}
  async function insertIntoComposer(editor,text){if(!editor||!isVisible(editor))return {ok:false,error:'Editor is not visible'};if(editorText(editor))return {ok:false,error:'Composer is not empty'};const expected=normalizeText(text);selectAllEditorContent(editor);try{if(document.execCommand('insertText',false,text))fireInput(editor,text)}catch{}await sleep(250);let actual=editorText(editor);if(actual===expected)return {ok:true,actualText:actual};try{selectAllEditorContent(editor);const sel=window.getSelection(),range=sel.getRangeAt(0);range.deleteContents();const node=document.createTextNode(text);range.insertNode(node);range.setStartAfter(node);range.collapse(true);sel.removeAllRanges();sel.addRange(range);fireInput(editor,text)}catch(e){return {ok:false,error:e?.message||'Composer insertion failed'}}await sleep(350);actual=editorText(editor);return actual===expected?{ok:true,actualText:actual}:{ok:false,error:`X did not accept the text. Composer contains: ${actual||'(empty)'}`};}

  async function insertReplyText(editor,text){
    if(!editor||!isVisible(editor)||!editor.isContentEditable)return {ok:false,error:'Reply editor is not editable'};
    if(editorText(editor))return {ok:false,error:'Reply composer is not empty'};
    editor.focus();
    // Exactly one active insertion path: never execute another insertion
    // method after X has accepted any text.
    try{
      const sel=window.getSelection();
      const range=document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      const dt=new DataTransfer();
      dt.setData('text/plain',text);
      editor.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:dt}));
    }catch{}
    await sleep(450);
    let actual=editorText(editor);
    if(actual){
      editor.focus();
      return {ok:true,actualText:actual};
    }
    // Paste inserted nothing, so one native fallback is safe.
    try{
      editor.focus();
      const sel=window.getSelection();
      const range=document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand('insertText',false,text);
    }catch{}
    await sleep(450);
    actual=editorText(editor);
    if(actual){
      editor.focus();
      return {ok:true,actualText:actual};
    }
    return {ok:false,error:'X did not accept the reply. Composer is still empty'};
  }
  function close(){panel?.remove();panel=null;currentTweet=null;currentFab=null;busy=false;}
  function position(){if(!panel||!currentFab)return;const r=currentFab.getBoundingClientRect(),w=Math.min(370,innerWidth-20),h=panel.offsetHeight||420;let top=r.bottom+8;if(top+h>innerHeight-10)top=r.top-h-8;panel.style.left=Math.max(10,Math.min(r.left,innerWidth-w-10))+'px';panel.style.top=Math.max(10,Math.min(top,innerHeight-h-10))+'px';}
  function setStatus(msg,type=''){const el=panel?.querySelector('.ccp406-status');if(el){el.textContent=msg;el.className='ccp406-status '+type;position();}}
  function loading(msg){const body=panel?.querySelector('.ccp406-body');if(body){body.innerHTML=`<div class="ccp406-loading">${esc(msg)}<br><span class="ccp406-dot"></span><span class="ccp406-dot"></span><span class="ccp406-dot"></span></div>`;position();}}
  function action(icon,title,desc,fn){const b=document.createElement('button');b.type='button';b.className='ccp406-btn';b.innerHTML=`<span class="ccp406-icon">${icon}</span><strong>${esc(title)}</strong><span>${esc(desc)}</span>`;b.onclick=e=>{e.preventDefault();e.stopPropagation();fn()};return b;}
  function askAI(messages,temperature=.82){return new Promise(resolve=>{let done=false;const timer=setTimeout(()=>{if(!done){done=true;resolve({ok:false,error:'AI request timed out'})}},30000);chrome.runtime.sendMessage({type:'CCP_AI',temperature,messages},r=>{if(done)return;done=true;clearTimeout(timer);if(chrome.runtime.lastError)return resolve({ok:false,error:chrome.runtime.lastError.message});resolve(r?.ok?{ok:true,text:String(r.text||'').trim()}:{ok:false,error:r?.error||'AI request failed'})})})}
  const replySystem='Write one short natural human Crypto Twitter reply. Never echo, paraphrase or summarize the source Tweet. Exactly ONE fitting emoji. No hashtags. No quotes. Output only the reply.';
  async function smartReply(tweet){if(busy)return;busy=true;const source=tweetText(tweet);if(!source){setStatus('❌ Tweet text not found','err');busy=false;return;}loading('Generating natural reply…');let r=await askAI([{role:'system',content:replySystem},{role:'user',content:`Create ONE smart reaction to this Tweet. Fresh opinion, observation or question. Under 25 words. Exactly one natural emoji.\n\nSOURCE:\n${source}`}]);let reply=r.ok?cleanReply(r.text,source):'';if(!reply){r=await askAI([{role:'system',content:replySystem},{role:'user',content:`Create a completely different reaction with different vocabulary and sentence structure. Do not reuse wording from the Tweet. Under 25 words. Exactly one natural emoji.\n\nSOURCE:\n${source}`}],.95);reply=r.ok?cleanReply(r.text,source):'';}if(!reply){setStatus(`❌ ${r.error||'Generated reply rejected'}`,'err');busy=false;return;}loading('Opening THIS Tweet reply box…');const editor=await openReplyComposer(tweet);if(!editor){setStatus('❌ Reply composer for this Tweet was not found','err');busy=false;return;}const result=await insertReplyText(editor,reply);if(!result.ok){setStatus(`❌ ${result.error}`,'err');busy=false;return;}setStatus('✓ Reply inserted','ok');await sleep(500);close();}
  async function opportunityRadar(tweet){
    if(busy)return;
    busy=true;
    const source=tweetText(tweet);
    if(!source){setStatus("❌ Tweet text not found","err");busy=false;return;}
    loading("Analyzing opportunity + creating replies…");
    const system="Analyze this crypto Tweet and return EXACTLY 5 lines, no markdown: line1 LEVEL=HIGH or MEDIUM or LOW; line2 STYLE=ANALYTICAL or MEME or CONTROVERSIAL; line3 REASON=under 12 words; line4 ANALYTICAL=one reply under 25 words with exactly one emoji; line5 MEME=one reply under 25 words with exactly one emoji; then line6 CONTROVERSIAL=one reply under 25 words with exactly one emoji. Replies must be natural, fresh, non-repetitive, and must not echo or paraphrase the Tweet. No hashtags.";
    const user="Tweet:\n"+source;
    const r=await askAI([{role:"system",content:system},{role:"user",content:user}],.55);
    if(!r.ok){setStatus("❌ "+r.error,"err");busy=false;return;}
    const lines=String(r.text||"").replace(/```/g,"").split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    const getVal=(prefix)=>{const line=lines.find(x=>x.toUpperCase().startsWith(prefix));return line?line.slice(prefix.length).replace(/^\s*[:=]\s*/,"").trim():"";};
    const levelMap={HIGH:"High Opportunity",MEDIUM:"Medium Opportunity",LOW:"Low Opportunity"};
    const styleMap={ANALYTICAL:"Analytical",MEME:"Meme",CONTROVERSIAL:"Controversial"};
    const level=levelMap[String(getVal("LEVEL")).toUpperCase()];
    const style=styleMap[String(getVal("STYLE")).toUpperCase()];
    const reason=getVal("REASON");
    const ideas={analytical:getVal("ANALYTICAL"),meme:getVal("MEME"),controversial:getVal("CONTROVERSIAL")};
    if(!level||!style||!reason||!ideas.analytical||!ideas.meme||!ideas.controversial){setStatus("❌ Opportunity response was incomplete","err");busy=false;return;}
    const body=panel?.querySelector(".ccp406-body");
    if(!body){busy=false;return;}
    const levelIcon=level==="High Opportunity"?"🔥":level==="Medium Opportunity"?"🟡":"⚪";
    const styleIcon=style==="Analytical"?"🧠":style==="Meme"?"😂":"🔥";
    const rows=[["🧠","Analytical",ideas.analytical],["😂","Meme",ideas.meme],["🔥","Controversial",ideas.controversial]];
    body.innerHTML='<div class="ccp406-opportunity" style="padding:4px 3px 10px"><div style="font-size:10px;font-weight:850;letter-spacing:.11em;color:#727d90">⚡ OPPORTUNITY</div><div style="font-size:21px;font-weight:900;margin-top:7px">'+esc(levelIcon+" "+level)+'</div><div style="margin-top:12px;color:#8d99ab;font-size:9px;font-weight:800;letter-spacing:.1em">BEST REPLY STYLE</div><div style="font-size:15px;font-weight:850;margin-top:4px">'+esc(styleIcon+" "+style)+'</div><div style="margin-top:10px;color:#b9c3d1;font-size:11px;line-height:1.55">'+esc(reason)+'</div></div><div style="padding:4px 3px 8px;color:#727d90;font-size:9px;font-weight:800;letter-spacing:.13em">CHOOSE YOUR REPLY</div><div class="ccp406-ideas"></div><button type="button" class="ccp406-back" id="opp-back">← Back</button>';
    const wrap=body.querySelector(".ccp406-ideas");
    rows.forEach(function(row){
      const icon=row[0],title=row[1],rawText=row[2],clean=cleanReply(rawText,source);
      const b=document.createElement("button");
      b.type="button";b.className="ccp406-idea";
      b.innerHTML='<div class="ccp406-idea-head"><span class="ccp406-idea-title">'+esc(icon+" "+title)+'</span><span class="ccp406-idea-hint">CLICK TO INSERT</span></div><div class="ccp406-idea-copy">'+esc(clean||rawText)+'</div>';
      b.onclick=async function(ev){
        ev.preventDefault();ev.stopPropagation();
        if(busy)return;
        const reply=cleanReply(rawText,source);
        if(!reply){setStatus("❌ This suggestion was rejected","err");return;}
        busy=true;
        loading("Opening THIS Tweet reply box…");
        const editor=await openReplyComposer(tweet);
        if(!editor){setStatus("❌ Reply composer for this Tweet was not found","err");busy=false;return;}
        const result=await insertIntoComposer(editor,reply);
        if(!result.ok){setStatus("❌ "+result.error,"err");busy=false;return;}
        setStatus("✓ Reply inserted","ok");
        await sleep(500);
        close();
      };
      wrap.appendChild(b);
    });
    body.querySelector("#opp-back").onclick=function(){busy=false;openPanel(tweet,currentFab);};
    setStatus("✓ Opportunity + 3 reply ideas ready","ok");
    busy=false;
    position();
  }
  async function replyIdeas(tweet){
    if(busy)return;
    busy=true;
    const source=tweetText(tweet);
    if(!source){setStatus("❌ Tweet text not found","err");busy=false;return;}
    loading("Creating 3 reply ideas…");
    const system="You are generating reply choices for a crypto Twitter user. Return ONLY valid JSON with keys analytical, meme, controversial. Each value must be ONE short natural reply under 25 words, no hashtags, no quotation marks, exactly one fitting emoji, and must NOT echo, paraphrase, or summarize the source Tweet.";
    const user="Create three clearly different replies to this Tweet.\n\n1) analytical: thoughtful/serious\n2) meme: funny/memey but natural\n3) controversial: opinionated/debatable without being abusive\n\nSOURCE:\n"+source;
    const r=await askAI([{role:"system",content:system},{role:"user",content:user}],.9);
    if(!r.ok){setStatus("❌ "+r.error,"err");busy=false;return;}
    let ideas=null;
    try{
      const raw=String(r.text||"").replace(/^```json\s*/i,"").replace(/\s*```$/,"").trim();
      ideas=JSON.parse(raw);
    }catch{}
    if(!ideas||typeof ideas!=="object"){setStatus("❌ Could not parse reply ideas","err");busy=false;return;}
    const rows=[["🧠","Analytical",ideas.analytical],["😂","Meme",ideas.meme],["🔥","Controversial",ideas.controversial]];
    const body=panel?.querySelector(".ccp406-body");
    if(!body){busy=false;return;}
    body.innerHTML='<div style="padding:4px 3px 8px;color:#727d90;font-size:9px;font-weight:800;letter-spacing:.13em">CHOOSE YOUR REPLY</div><div class="ccp406-ideas"></div><button type="button" class="ccp406-back" id="ideas-back">← Back</button>';
    const wrap=body.querySelector(".ccp406-ideas");
    rows.forEach(function(row){
      const icon=row[0],title=row[1],rawText=String(row[2]||"").trim(),clean=cleanReply(rawText,source);
      const b=document.createElement("button");
      b.type="button";b.className="ccp406-idea";
      b.innerHTML='<div class="ccp406-idea-head"><span class="ccp406-idea-title">'+esc(icon+" "+title)+'</span><span class="ccp406-idea-hint">CLICK TO INSERT</span></div><div class="ccp406-idea-copy">'+esc(clean||rawText||"No suggestion generated")+'</div>';
      b.onclick=async function(e){
        e.preventDefault();e.stopPropagation();
        if(busy)return;
        const reply=cleanReply(rawText,source);
        if(!reply){setStatus("❌ This suggestion was rejected","err");return;}
        busy=true;
        loading("Opening THIS Tweet reply box…");
        const editor=await openReplyComposer(tweet);
        if(!editor){setStatus("❌ Reply composer for this Tweet was not found","err");busy=false;return;}
        const result=await insertIntoComposer(editor,reply);
        if(!result.ok){
          setStatus("❌ "+result.error,"err");
          busy=false;
          return;
        }
        setStatus("✓ Reply inserted","ok");
        await sleep(500);
        close();
      };
      wrap.appendChild(b);
    });
    body.querySelector("#ideas-back").onclick=function(){busy=false;openPanel(tweet,currentFab);};
    setStatus("✓ 3 reply styles ready","ok");
    busy=false;
    position();
  }
  async function translate(tweet){if(busy)return;busy=true;const source=tweetText(tweet);if(!source){setStatus('❌ Tweet text not found','err');busy=false;return;}loading('Translating…');const r=await askAI([{role:'system',content:'Translate this Crypto Twitter text into natural fluent Persian. Preserve usernames, names, tickers and crypto terminology. Output only the translation.'},{role:'user',content:source}],.25);if(!r.ok){setStatus(`❌ ${r.error}`,'err');busy=false;return;}const body=panel?.querySelector('.ccp406-body');if(body){body.innerHTML='<div class="ccp406-translation-head">PERSIAN TRANSLATION</div><div class="ccp406-translation">'+esc(r.text)+'</div><button type="button" class="ccp406-back" id="translation-done">✓ Done</button>';body.querySelector('#translation-done').onclick=()=>close();position();}setStatus('✓ Translation ready','ok');busy=false;}
  async function rewrite(tweet){if(busy)return;busy=true;loading('Rewriting…');const r=await askAI([{role:'system',content:'Rewrite this crypto post to sound sharper, clearer and genuinely human. Preserve meaning. Exactly one tasteful emoji. Output only the rewritten post.'},{role:'user',content:tweetText(tweet)}],.78);if(!r.ok){setStatus(`❌ ${r.error}`,'err');busy=false;return;}close();const e=await openNewPost();if(!e){busy=false;return;}const out=await insertIntoComposer(e,r.text);if(!out.ok)console.warn('Crypto Copilot rewrite:',out.error);busy=false;}
  async function thread(tweet){if(busy)return;busy=true;loading('Building 3-post thread…');const r=await askAI([{role:'system',content:'Create exactly 3 connected Crypto Twitter posts. Number them 1/3, 2/3, 3/3. Human, concise and non-repetitive. One fitting emoji per post. Output only the three posts separated by blank lines.'},{role:'user',content:tweetText(tweet)}],.8);if(!r.ok){setStatus(`❌ ${r.error}`,'err');busy=false;return;}close();const e=await openNewPost();if(!e){busy=false;return;}const out=await insertIntoComposer(e,r.text);if(!out.ok)console.warn('Crypto Copilot thread:',out.error);busy=false;}
  async function quote(tweet){if(busy)return;busy=true;loading('Writing quote comment…');const r=await askAI([{role:'system',content:'Write one fresh quote-tweet comment reacting to the idea. Do not restate or paraphrase the source. Under 25 words. Exactly one fitting emoji. No hashtags. Output only the comment.'},{role:'user',content:tweetText(tweet)}],.85);if(!r.ok){setStatus(`❌ ${r.error}`,'err');busy=false;return;}const rb=retweetButton(tweet);if(!rb){setStatus('❌ Quote button not found','err');busy=false;return;}rb.click();const end=Date.now()+5000;let item=null;while(Date.now()<end&&!item){item=[...document.querySelectorAll('[role="menuitem"],[role="option"]')].find(x=>/quote/i.test((x.innerText||x.getAttribute('aria-label')||'').trim()));if(!item)await sleep(120);}if(!item){setStatus('❌ Quote option not found','err');busy=false;return;}item.click();const editor=await openDialogEditor(10000);if(!editor){setStatus('❌ Quote composer not found','err');busy=false;return;}const out=await insertIntoComposer(editor,ensureOneEmoji(r.text,tweetText(tweet)));if(!out.ok){setStatus(`❌ ${out.error}`,'err');busy=false;return;}setStatus('✓ Quote inserted and verified','ok');await sleep(500);close();}
  function visibleTrends(){const out=[],seen=new Set();for(const a of [...document.querySelectorAll('a[href*="/search?q="]')]){const t=normalizeText(a.innerText||a.textContent);if(!t||t.length<2||t.length>120||/show more|search|what's happening/i.test(t)||seen.has(t))continue;seen.add(t);out.push(t);if(out.length>=8)break;}return out;}
  async function trendRadar(){const trends=visibleTrends();if(!trends.length){setStatus('⚠️ Open X Explore → Trending first','err');return;}const body=panel.querySelector('.ccp406-body');body.innerHTML=`<div style="padding:4px;color:#727d90;font-size:9px;font-weight:800;letter-spacing:.13em">VISIBLE X TRENDS</div>`+trends.map((t,i)=>`<button type="button" class="ccp406-back" data-t="${i}" style="margin-top:7px">📈 ${esc(t)}</button>`).join('');body.querySelectorAll('[data-t]').forEach(b=>b.onclick=async()=>{if(busy)return;busy=true;loading('Writing trend post…');const r=await askAI([{role:'system',content:'Write one natural Crypto Twitter post about the visible trend. Do not invent facts. Exactly one fitting emoji. Output only the post.'},{role:'user',content:`Visible trend: ${trends[Number(b.dataset.t)]}`}],.82);if(!r.ok){setStatus(`❌ ${r.error}`,'err');busy=false;return;}close();const e=await openNewPost();if(e){const out=await insertIntoComposer(e,r.text);if(!out.ok)console.warn('Crypto Copilot trend:',out.error);}busy=false;});position();}

  function replyUI(tweet){ smartReply(tweet, "smart"); }
  function openPanel(tweet,fab){close();currentTweet=tweet;currentFab=fab;panel=document.createElement('div');panel.className='ccp406-panel';const preview=tweetText(tweet);panel.innerHTML=`<div class="ccp406-head"><div class="ccp406-brand"><div class="ccp406-logo"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMTI4IDEyOCI+PC9zdmc+" alt=""></div><div><div class="ccp406-title">Crypto Copilot</div><div class="ccp406-sub">Natural AI tools for X</div></div></div></div>${preview?`<div class="ccp406-context">${esc(preview.slice(0,180))}${preview.length>180?'…':''}</div>`:''}<div class="ccp406-status">Connecting to Central AI…</div><div class="ccp406-body"><div style="padding:4px 3px 8px;color:#727d90;font-size:9px;font-weight:800;letter-spacing:.13em">AI TOOLS</div><div class="ccp406-grid" id="grid"></div></div>`;document.body.appendChild(panel);const g=panel.querySelector('#grid');g.appendChild(action('⚡','Smart Reply','Generate & insert automatically',()=>replyUI(tweet)));g.appendChild(action('🎯','Reply Opportunity','Find opportunity + 3 reply styles',()=>opportunityRadar(tweet)));g.appendChild(action('🔁','Smart Quote','Fresh quote comment',()=>quote(tweet)));g.appendChild(action('🌍','Translate','Natural Persian',()=>translate(tweet)));g.appendChild(action('✎','Rewrite','Sharper new post',()=>rewrite(tweet)));g.appendChild(action('🧵','Thread','Three connected posts',()=>thread(tweet)));g.appendChild(action('📈','Trend Radar','Use visible X trends',()=>trendRadar()));setStatus('✓ Central AI ready','ok');position();}
  function attach(tweet){if(!tweet||tweet.querySelector('.ccp406-fab'))return;const reply=replyButton(tweet);if(!reply)return;let host=tweet.querySelector('[role="group"]')||reply.closest('[role="group"]');if(!host){let p=reply.parentElement;for(let i=0;i<5&&p;i++,p=p.parentElement){const buttons=p.querySelectorAll('button').length;if(buttons>=2){host=p;break;}}}if(!host)return;const b=document.createElement('button');b.className='ccp406-fab';b.type='button';b.title='Crypto Copilot';b.setAttribute('aria-label','Crypto Copilot');b.innerHTML='<img src="'+chrome.runtime.getURL('tweet-icon.png')+'" alt="" aria-hidden="true">';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openPanel(tweet,b)},{capture:true});host.appendChild(b);}
  function scan(){document.querySelectorAll('article[data-testid="tweet"],article').forEach(attach);}
  scan();new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});window.addEventListener('scroll',position,true);window.addEventListener('resize',position);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel)close()});document.addEventListener('click',e=>{if(panel&&!panel.contains(e.target)&&!e.target.closest('.ccp406-fab'))close()});
  console.log('🚀 Crypto Copilot Central AI 4.0.6 loaded');
})();
