import React from 'react';

// Robust version that works with shadow DOM and async loading
export const getAIMentions = (onFound?: (text: string) => void) => {
  const regex = /\bai\b/i;
  const commentSelector = 'shreddit-comment';

  /** Recursively search all shadow roots for elements matching the selector */
  function deepQuerySelectorAll(root: Node, selector: string): Element[] {
    const found: Element[] = [];

    if (root instanceof Element) {
      if (root.matches(selector)) found.push(root);
      if (root.shadowRoot) {
        found.push(...deepQuerySelectorAll(root.shadowRoot, selector));
      }
    }

    root.childNodes.forEach((node) => {
      found.push(...deepQuerySelectorAll(node, selector));
    });

    return found;
  }

  /** Process a single comment element */
  function processComment(el: Element) {
    if (el.getAttribute('data-ai-checked')) return;
    el.setAttribute('data-ai-checked', 'true');

    const text =
      (el.querySelector('[id$="-post-rtjson-content"]') as HTMLElement | null)
        ?.innerText.trim() || '';

    if (regex.test(text)) {
      console.log("✅ Found standalone 'AI' mentioned in comment:", text);
      onFound?.(text);
    }
  }

  /** Process all existing comments in the DOM (including shadow roots) */
  function processAllComments(root: Node = document) {
    const comments = deepQuerySelectorAll(root, commentSelector);
    console.log(comments)
    comments.forEach(processComment);
  }

  // Run once immediately (after short delay to ensure Reddit content is mounted)
  const initialDelay = setTimeout(() => {
    console.log('flan')
    processAllComments();
  }, 1500); // adjust delay if needed

  // Watch for dynamically added comments or shadow roots
  const observer = new MutationObserver((mutations) => {
    console.log('flan1')
    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        console.log('flan2')
        if (!(node instanceof HTMLElement)) continue;
        processAllComments(node);
      }
    }
  });

  observer.observe(document, { childList: true, subtree: true });

  // Return cleanup
  return () => {
    clearTimeout(initialDelay);
    observer.disconnect();
  };
};
