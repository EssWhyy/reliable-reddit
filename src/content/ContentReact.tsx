import { createRoot, Root } from "react-dom/client";
import RedditInfoBox from "./RedditInfoBox";

const POST_URL_RE = /reddit\.com\/r\/.+\/comments\/(?!.*\?entry_point=)/;
let root: Root | null = null;
let lastInjectedUrl: string | null = null;

/**
 * Normalizes the URL to prevent double-injection on hash changes 
 * or query parameter updates.
 */
function getPostBaseUrl(url: string): string {
  const u = new URL(url);
  return u.origin + u.pathname;
}

/**
 * Finds the best anchor point for injection. 
 * Supports Old Reddit, New Reddit, and the latest "Shreddit" interface.
 */
function findAnchorElement(): HTMLElement | Element | null {
  // 1. Shreddit (Modern Reddit) - look for the main post component
  const shredditPost = document.querySelector('shreddit-post');
  if (shredditPost) {
    return shredditPost.querySelector('h1') || shredditPost;
  }

  // 2. Old Reddit
  const linkInfo = document.querySelector(".linkinfo");
  if (linkInfo) return linkInfo as HTMLElement;

  // 3. New Reddit (2018-2023 version)
  const h1 = document.querySelector("h1");
  if (h1) return h1;

  return null;
}

/**
 * Core injection logic. Safely mounts or updates the React root.
 */
async function inject() {
  const currentUrl = location.href;
  if (!POST_URL_RE.test(currentUrl)) {
    cleanup();
    return;
  }

  const baseUrl = getPostBaseUrl(currentUrl);
  const anchor = findAnchorElement();

  // If we can't find where to put it yet, or it's already there for this URL, bail.
  const existing = document.getElementById("reddit-info-box-container");
  if (!anchor || (existing && existing.dataset.url === baseUrl)) {
    return;
  }

  // Clean up previous instance if the URL changed but the element persisted
  if (existing) cleanup();

  const container = document.createElement("div");
  container.id = "reddit-info-box-container";
  container.dataset.url = baseUrl;
  
  // Apply a small margin for spacing depending on the UI
  container.style.marginTop = "15px";
  container.style.marginBottom = "15px";

  anchor.insertAdjacentElement("afterend", container);

  root = createRoot(container);
  root.render(<RedditInfoBox key={baseUrl} />);
  lastInjectedUrl = baseUrl;
}

function cleanup() {
  const existing = document.getElementById("reddit-info-box-container");
  if (existing) {
    try { root?.unmount(); } catch (e) { /* ignore unmount errors */ }
    existing.remove();
  }
  root = null;
  lastInjectedUrl = null;
}

/**
 * The "Observer Loop" approach:
 * Instead of hooking into tricky History APIs, we watch the DOM for changes.
 * Reddit's SPA navigation always triggers DOM mutations.
 */
function boot() {
  // Run immediately
  inject();

  let debounceTimer: ReturnType<typeof setTimeout>;
  
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      // Check if we need to inject (either URL changed or DOM was wiped)
      const currentBase = getPostBaseUrl(location.href);
      const isPost = POST_URL_RE.test(location.href);
      const missing = !document.getElementById("reddit-info-box-container");

      if (isPost && (currentBase !== lastInjectedUrl || missing)) {
        inject();
      } else if (!isPost && lastInjectedUrl) {
        cleanup();
      }
    }, 100); // 100ms debounce to stay performant
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Start the engine
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}