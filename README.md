# Reliable Reddit: Post & User Insights

Reliable Reddit is a lightweight browser extension designed to pull back the curtain on Reddit content, enhancing transparency and context for the Reddit community. By surfacing hidden metrics and highlighting automated activity, it helps users distinguish between genuine community engagement and potential manipulation.

INSTALL FOR:
[Chrome](https://chromewebstore.google.com/detail/reliable-reddit-post-user/hhhlpbofpofmikalckhplbinjlpflpmm) | [Firefox](https://addons.mozilla.org/en-US/firefox/addon/reliable-reddit-post-insights/)
________________________________________
## ✨ Key Features
-	📊 Visual Upvote Ratio: See post sentiment at a glance with a YouTube-style like/dislike bar on every post.
-	👤 Instant OP Insights: Directly view user's account age and total karma on pages to identify burner accounts instantly. Offers redirect button to Arctic Shift Search for users who hide their profile to check for bad-faith actors.
-	🤖 Bot/AI Detection: Automatically highlights comments mentioning "AI" or "bot"  or to help navigate suspicious posts
-	🎨 UI Versatility: Supports both New and Old Reddit designs
-	⚡ Lightweight & Modular: Toggle and adjust features in extension popup menu
________________________________________
## 📸 Preview
![0](https://github.com/user-attachments/assets/490f70c5-5f77-43fb-ba12-591a2c70a2ff)

________________________________________
## 🚀 Installation

### For Users
1.	Download the extension from the Chrome Web Store or Firefox Add-ons.
2.	Pin the extension to your toolbar.
3.	Refresh any Reddit tab to see the new data overlays.

### For Developers (Manual Install)
If you want to run this locally or contribute, clone the repo then:
0.  Follow instructions in the *To Build* section below
1.	Open your browser's extension management page (chrome://extensions or about:debugging).
2.	Enable Developer Mode.
3.	Click Load unpacked and select the dist or root folder of the cloned project, if on Firefox/Chrome respectively.

### To Build (VSCode)
1.	npm install
2.	npm run build:all

________________________________________
## 🛠️ Tech Stack
-	TypeScript: Core logic and DOM manipulation.
-	React: Custom UI components for the ratio bar and settings dashboard.
-	WebExtensions API: Cross-browser compatibility layer for Chrome and Firefox.
-	Vite: Build tool and Bundler for the project
________________________________________
## 📋 Potential Future Goals/Features
-	[ ] Custom filtering of specific words in comments through popup
-	[ ] Custom blacklisting of ill-intent profiles using local, or global blacklists
-	[ ] Use Natural Language Processing to do sentiment analysis of comments sections  or entire subreddits
________________________________________
## 📋 Architecture Diagram
<img width="1449" height="1072" alt="Screenshot 2026-03-26 224526" src="https://github.com/user-attachments/assets/b99dadde-213d-4c98-a4c5-fa705f93c4d8" />

________________________________________
## 🤝 Contributing
Contributions, improvement and feedback welcome. Feel free to fork and raise an issue/PR in the repo!
________________________________________
## 📄 License
MIT Licence. Feel free to modify, fork or improve wherever you want.
Made by Swen Tang, 2026
