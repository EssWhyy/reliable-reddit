import { createRoot, Root } from "react-dom/client";
import RedditInfoBox from "./RedditInfoBox";

/**
 * Main content script for Reddit Post page
 */

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
 * Supports Old Reddit, New Reddit, and the latest Shreddit interface.
 */
function findAnchorElement(): HTMLElement | Element | null {
  const shredditPost = document.querySelector('shreddit-post');
  if (shredditPost) {
    return shredditPost.querySelector('h1') || shredditPost;
  }

  const linkInfo = document.querySelector(".linkinfo");
  if (linkInfo) return linkInfo as HTMLElement;

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

  // If anchor isn't ready yet, wait for the next observer tick
  if (!anchor) return;

  // Always clean up any stale container or broken React root before a fresh injection
  cleanup();

  const container = document.createElement("div");
  container.id = "reddit-info-box-container";
  container.dataset.url = baseUrl;
  
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
    try { root?.unmount(); } catch (e) { /* ignore */ }
    existing.remove();
  }
  root = null;
}

/**
 * "Observer Loop" approach:
 * Instead of hooking into tricky History APIs, watch the DOM for changes
 * Reddit's SPA navigation always triggers DOM mutations
 */
function boot() {
  // Run immediately
  inject();

  // Handle browser bfcache navigation explicitly
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      lastInjectedUrl = null;
      inject();
    }
  });

  let debounceTimer: ReturnType<typeof setTimeout>;
  
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const currentUrl = location.href;
      const currentBase = getPostBaseUrl(currentUrl);
      const isPost = POST_URL_RE.test(currentUrl);
      const container = document.getElementById("reddit-info-box-container");

      // Condition 1: On post page, but either the tracking URL doesn't match 
      // OR the physical DOM container was destroyed/swapped out by Reddit's router.
      if (isPost) {
        if (currentBase !== lastInjectedUrl || !container) {
          inject();
        }
      } 
      // Condition 2: Navigated away from a post page to a listing page, clean it up.
      else if (!isPost && lastInjectedUrl) {
        cleanup();
        lastInjectedUrl = null; 
      }
    }, 100); 
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}