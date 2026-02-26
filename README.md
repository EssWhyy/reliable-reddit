# reddit-upvote-bar

Reddit Upvote bar is a lightweight browser extension designed to pull back the curtain on Reddit content, enhancing transparency and context for the Reddit community.
By surfacing hidden metrics and highlighting automated activity, it helps users distinguish between genuine community engagement and potential manipulation.

Install for Chrome | Install for Firefox
________________________________________
## ✨ Key Features
-	📊 Visual Upvote Ratio: See the sentiment at a glance with a YouTube-style like/dislike bar on every post.
-	👤 Instant OP Insights: Hover or view account age (Cake Day) and total karma directly next to the username to identify burner accounts instantly.
-	🤖 Bot/AI Detection: Automatically highlights comments mentioning "bot," "AI," or "dead internet" to help you navigate suspicious discourse.
-	🎨 UI Versatility: Full support for both New Reddit and Old Reddit designs.
-	⚡ Lightweight & Modular: Built with performance in mind. Don't like a feature? Toggle it off in the settings menu with one click.
________________________________________
## 📸 Preview
(Coming Soon)
________________________________________
## 🚀 Installation

### For Users
1.	Download the extension from the Chrome Web Store or Firefox Add-ons.
2.	Pin the extension to your toolbar.
3.	Refresh any Reddit tab to see the new data overlays.

### For Developers (Manual Install)
If you want to run this locally or contribute, clone the repo then:
1.	Open your browser's extension management page (chrome://extensions or about:debugging).
2.	Enable Developer Mode.
3.	Click Load unpacked and select the dist or root folder of the cloned project.

### To Build (VSCode)
1.	npm install
2.	npx vite build (For Popup Script)
3.	npx vite build --config vite.content.config.ts (For Content Script)
4.	Follow steps in manual install section

________________________________________
## 🛠️ Tech Stack
-	TypeScript (ES6+): Core logic and DOM manipulation.
-	React: Custom UI components for the ratio bar and settings dashboard.
-	WebExtensions API (Express): Cross-browser compatibility layer for Chrome and Firefox.
-	Vite: Build tool and Bundler for the project
________________________________________
## 📋 Potential Future Goals/Features
-	[ ] Allow users to customize thresholds for new user and low comment karma checks via popup
-	[ ] Custom blacklisting of ill-intent profiles using local, or even global blacklists
-	[ ] Use Natural Language Processing to do sentiment analysis of comments sections
________________________________________
## 📋 Architecture Diagram
(Coming Soon)
________________________________________
## 🤝 Contributing
Contributions, improvement and feedback welcome. Feel free to fork and raise an issue/PR in the repo!
________________________________________
## 📄 License
MIT Licence. Feel free to modify, fork or improve wherever you want.
Made by Swen Tang, 2026
