chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "PASTE_TEXT") {
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      func: (text) => {

        const editor =
          document.querySelector('[role="dialog"] [contenteditable="true"]') ||
          document.querySelector('[data-testid="tweetTextarea_0"][contenteditable="true"]') ||
          document.querySelector('[data-testid="tweetTextarea_0"] [contenteditable="true"]');

        if (!editor) return "NO_EDITOR";

        editor.click();
        editor.focus();

        // پیدا کردن React fiber
        const fiberKey = Object.keys(editor).find(k => k.startsWith("__reactFiber"));
        const propsKey = Object.keys(editor).find(k => k.startsWith("__reactProps"));

        if (propsKey) {
          const props = editor[propsKey];

          // DraftJS onChange رو مستقیم صدا بزن
          if (props.onChange) {
            // ابتدا select all و delete
            document.execCommand("selectAll", false, null);
            document.execCommand("delete", false, null);
            // insert
            document.execCommand("insertText", false, text);

            // یه synthetic event بساز
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLElement.prototype, "innerText"
            );

            // trigger onChange با value جدید
            const event = new Event("input", { bubbles: true });
            Object.defineProperty(event, "target", { value: editor });
            editor.dispatchEvent(event);

            // space trick برای فعال کردن reply button
            document.execCommand("insertText", false, " ");
            document.execCommand("delete", false, null);

            return editor.innerText || "DONE";
          }
        }

        // fallback بدون fiber
        document.execCommand("selectAll", false, null);
        document.execCommand("delete", false, null);
        document.execCommand("insertText", false, text);
        document.execCommand("insertText", false, " ");
        document.execCommand("delete", false, null);

        return editor.innerText || "FALLBACK_DONE";
      },
      args: [msg.text]
    }, (results) => {
      sendResponse({ result: results?.[0]?.result });
    });
    return true;
  }
});
