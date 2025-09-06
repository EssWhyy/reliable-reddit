// contentReact.tsx
import React from "react";
import { createRoot, Root } from "react-dom/client";
import RedditInfoBox from "./RedditInfoBox.tsx";

const POST_URL_RE = /reddit\.com\/r\/.+\/comments\//;

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

  // Back/forward
  window.addEventListener("popstate", fire);
}

let root: Root | null = null;

async function inject() {
  // Only on post pages
  if (!POST_URL_RE.test(location.href)) return;

  const titleEl = (await waitForElement("h1")) as HTMLElement;

  // If already injected for this URL, do nothing
  const existing = document.getElementById("reddit-info-box-container");
  if (existing && existing.dataset.url === location.href) return;

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
  // Key by URL to force re-mount so useEffect([]) runs for new posts
  root.render(<RedditInfoBox key={location.href} />);
}

function boot() {
  // Initial try + keep trying while DOM builds
  inject();

  // Keep an observer running so late-arriving DOM still triggers injection
  const mo = new MutationObserver(() => inject());
  mo.observe(document, { childList: true, subtree: true });

  // Re-run on SPA navigations
  onUrlChange(() => setTimeout(inject, 0));
}

boot();
