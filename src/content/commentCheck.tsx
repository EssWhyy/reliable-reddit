import React from 'react';

export const getAIMentions = (onFound?: (text: string) => void) => {
  const regex = /\bai\b/i;
  const commentSelector = 'div[data-testid="comment"]';

  function processComment(el: Element) {
    if (el.getAttribute('data-ai-checked')) return;
    el.setAttribute('data-ai-checked', 'true');

    const text = el.textContent || '';
    if (regex.test(text)) {
      console.log("Found standalone 'AI' mentioned in comment:", text);
      onFound?.(text); // Notify parent when "ai" is found
    }
  }

  // Run initially
  document.querySelectorAll(commentSelector).forEach(processComment);

  // Observe dynamically added comments
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      Array.from(mutation.addedNodes).forEach(node => {
        if (!(node instanceof HTMLElement)) return;
        if (node.matches?.(commentSelector)) {
          processComment(node);
        } else {
          node.querySelectorAll?.(commentSelector).forEach(processComment);
        }
      });
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Return a cleanup function for safety
  return () => observer.disconnect();
};
