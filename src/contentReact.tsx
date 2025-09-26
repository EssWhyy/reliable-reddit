// contentReact.tsx
import React from "react";
import { createRoot, Root } from "react-dom/client";
import RedditInfoBox from "./RedditInfoBox";

const POST_URL_RE = /reddit\.com\/r\/.+\/comments\//;

function getPostBaseUrl(url: string): string {
  // Strip off query string and hash
  // Example: https://www.reddit.com/r/foo/comments/abc123/post_title/
  const u = new URL(url);
  return u.origin + u.pathname.split("?")[0].split("#")[0];
}

function waitForElement(selector: string): Promise<Element> {
  return new Promise((resolve) => {
    const existing = document.querySelector(selector);
    if (existing) return resolve(existing);

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document, { childList: true, subtree: true });
  });
}

function onUrlChange(callback: () => void) {
  let last = location.href;
  const fire = () => {
    const now = location.href;
    if (now !== last) {
      last = now;
      callback();
    }
  };

  // History API hooks
  const _push = history.pushState;
  history.pushState = function (...args) {
    const r = _push.apply(this, args as any);
    fire();
    return r;
  } as typeof history.pushState;

  const _replace = history.replaceState;
  history.replaceState = function (...args) {
    const r = _replace.apply(this, args as any);
    fire();
    return r;
  } as typeof history.replaceState;

  window.addEventListener("popstate", fire);
}

let root: Root | null = null;

async function inject() {
  if (!POST_URL_RE.test(location.href)) return;

  const titleEl = (await waitForElement("h1")) as HTMLElement;
  const baseUrl = getPostBaseUrl(location.href);


  const existing = document.getElementById("reddit-info-box-container");
  if (existing && existing.dataset.url === baseUrl) return;

  // Clean up any old instance (from previous post)
  if (existing) {
    try { root?.unmount(); } catch {}
    existing.remove();
  }

  // Inject fresh container
  const container = document.createElement("div");
  container.id = "reddit-info-box-container";
  container.dataset.url = location.href;
  titleEl.insertAdjacentElement("afterend", container);

  root = createRoot(container);
  root.render(<RedditInfoBox key={location.href} />);
}

function boot() {
  inject();

  // Keep an observer running so late-arriving DOM still triggers injection
  const mo = new MutationObserver(() => inject());
  mo.observe(document, { childList: true, subtree: true });

  // Re-run on SPA navigations
  onUrlChange(() => setTimeout(inject, 0));
}

boot();
