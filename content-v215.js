(() => {
  if (window.__cryptoCopilotV215) return;
  window.__cryptoCopilotV215 = true;

  const originalSendMessage = chrome.runtime.sendMessage.bind(chrome.runtime);

  chrome.runtime.sendMessage = (message, ...rest) => {
    try {
      if (message?.type === 'CCP_AI' && Array.isArray(message.messages)) {
        const patched = {
          ...message,
          messages: message.messages.map(m => ({ ...m }))
        };

        const replyRequest = patched.messages.some(m =>
          typeof m?.content === 'string' &&
          /fresh human reply|SOURCE TWEET|Smart Reply|reply to this exact Tweet/i.test(m.content)
        );

        if (replyRequest) {
          patched.messages = patched.messages.map(m => {
            if (m.role !== 'system' && m.role !== 'user') return m;
            return {
              ...m,
              content: `${m.content}\n\nREPLY STYLE RULE: Make the reply feel natural and human. Include exactly ONE fitting emoji when it genuinely fits the tone. Do not reuse the Tweet wording. Do not repeat the emoji or sentence. Output only one short reply.`
            };
          });
        }

        return originalSendMessage(patched, ...rest);
      }
    } catch (error) {
      console.warn('Crypto Copilot V2.1.5 message patch failed', error);
    }

    return originalSendMessage(message, ...rest);
  };

  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('content-v214.js');
  script.async = false;
  script.onload = () => console.log('🚀 Crypto Copilot V2.1.5 loaded (emoji reply patch)');
  script.onerror = () => console.error('❌ Crypto Copilot V2.1.5 could not load core');
  (document.head || document.documentElement).appendChild(script);
})();
