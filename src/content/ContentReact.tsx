// Logic to display Reddit Info Box on DOM
import { createRoot, Root } from "react-dom/client";
import RedditInfoBox from "./RedditInfoBox";

const POST_URL_RE = /reddit\.com\/r\/.+\/comments\/(?!.*\?entry_point=)/;

function getPostBaseUrl(url: string): string {
  // Strip off query string and hash
  const u = new URL(url);
  return u.origin + u.pathname.split("?")[0].split("#")[0];
}

function isOldRedditInterface(url: string): boolean {
  const urlObject = new URL(url);
  const hostname = urlObject.hostname;

  if (hostname.startsWith('old.reddit.com')) {
    return true;
  } 
  return false; 
}


function waitForElement(selector: string, timeout = 5000): Promise<Element> {
  return new Promise((resolve) => {
    // Helper function to check for the element and resolve if found
    const checkAndResolve = (observer?: MutationObserver) => {
      const existing = document.querySelector(selector);
      if (existing) {
        if (observer) observer.disconnect();
        resolve(existing);
        return true;
      }
      return false;
    };

    // 1. Check if the element already exists (best-case scenario)
    if (checkAndResolve()) return;

    // Function to set up the MutationObserver fallback
    const startObserver = () => {
      const observer = new MutationObserver(() => {
        // Pass the observer to disconnect it upon finding the element
        checkAndResolve(observer);
      });

      // OBSERVE THE BODY for dynamic changes
      observer.observe(document.body, { 
        childList: true, 
        subtree: true 
      });
    };

    // 2. Prioritize DOMContentLoaded if the document is still loading
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        // 2a. Check one last time after the static DOM is complete
        if (!checkAndResolve()) {
          // 2b. If the element is still not found, it must be loaded dynamically, 
          // so start the MutationObserver
          startObserver();
        }
      }, { once: true });
    } else {
      // 3. If the DOM is already ready, and it wasn't found in step 1, 
      // the element is definitely dynamic, so start the observer immediately.
      startObserver();
    }
  });
}

let root: Root | null = null;

// Track which posts have been injected to avoid repeated injection
const injectedPosts = new Set<string>();

async function inject() {
  if (!POST_URL_RE.test(location.href)) return;

  const baseUrl = getPostBaseUrl(location.href);
  if (injectedPosts.has(baseUrl)) return; // already injected

  let titleEl: HTMLElement;
  if (isOldRedditInterface(location.href)) {
    titleEl = (await waitForElement(".linkinfo")) as HTMLElement;
  } else {
    titleEl = (await waitForElement("h1")) as HTMLElement;
  }

  const existing = document.getElementById("reddit-info-box-container");
  if (existing) {
    try { root?.unmount(); } catch {}
    existing.remove();
  }

  const container = document.createElement("div");
  container.id = "reddit-info-box-container";
  container.dataset.url = location.href;
  titleEl.insertAdjacentElement("afterend", container);

  root = createRoot(container);
  root.render(<RedditInfoBox key={location.href} />);

  injectedPosts.add(baseUrl);
}

// Handles SPA navigation and ensures safe injection
function onUrlChange(callback: () => void) {
  let last = location.href;

  const fire = () => {
    const now = location.href;
    if (now !== last) {
      last = now;
      callback();
    }
  };

  // Wrap history API
  const wrapHistoryFn = (fn: typeof history.pushState | typeof history.replaceState) =>
    function (this: History, ...args: Parameters<typeof fn>) {
      const result = fn.apply(this, args);
      fire();
      return result;
    };

  history.pushState = wrapHistoryFn(history.pushState) as typeof history.pushState;
  history.replaceState = wrapHistoryFn(history.replaceState) as typeof history.replaceState;

  window.addEventListener("popstate", fire);
}

function boot() {
  // Initial inject if already on a post
  inject();

  // Observe DOM for dynamic re-renders
  let mutationDebounce = false;
  const mo = new MutationObserver(() => {
    if (mutationDebounce) return;
    mutationDebounce = true;
    setTimeout(async () => {
      await inject();
      mutationDebounce = false;
    }, 50); // small debounce to avoid rapid re-injection
  });
  mo.observe(document.body, { childList: true, subtree: true });

  // Handle SPA navigation
  onUrlChange(() => {
    // Clear old injections for safety
    injectedPosts.clear();
    setTimeout(() => inject(), 50); // slight delay for Reddit DOM to settle
  });
}

boot();