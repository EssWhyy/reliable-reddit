import React from 'react';
import { createRoot } from 'react-dom/client';
import SearchButton from './RedditHistorySearchButton';

const INJECTION_ID = 'reddit-history-search-btn';

function injectSearchUI() {
  if (!window.location.pathname.startsWith('/user/') || document.getElementById(INJECTION_ID)) {
    return;
  }

  const bodyText = document.body.innerText;
  const username = window.location.pathname.split('/')[2];

  const isNewRedditHidden = /likes to keep their (posts|comments) hidden/i.test(bodyText);
  const isOldRedditHidden = /there doesn't seem to be anything here/i.test(bodyText);

  let targetContainer = null;

  if (isNewRedditHidden) {
    targetContainer = document.querySelector('shreddit-feed') || document.querySelector('main');
  } else if (isOldRedditHidden) {
    targetContainer = document.querySelector('#noresults') || document.querySelector('.content[role="main"]');
  }


  if (targetContainer) {
    const container = document.createElement('div');
    container.id = INJECTION_ID;
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.padding = '20px';

    targetContainer.append(container);

    const root = createRoot(container);
    root.render(<SearchButton username={username} />);
  }
}

const observer = new MutationObserver(() => {
  injectSearchUI();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

injectSearchUI();