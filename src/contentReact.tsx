import React from "react";
import { createRoot } from "react-dom/client";
import loadPostInfo from "./content";

const ROOT_ID = "reddit-upvote-bar-root";

if (window.top === window.self && !document.getElementById(ROOT_ID)) {
  const rootEl = document.createElement("div");
  rootEl.id = ROOT_ID;
  document.body.appendChild(rootEl);

  const App = () => <div>Hello from React + Content Script!</div>;
  const root = createRoot(rootEl);
  root.render(<App />);

  // Only call the content script once
  loadPostInfo();
}
