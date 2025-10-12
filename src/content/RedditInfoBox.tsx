import React, { useEffect, useState } from "react";
import MultiProgress from "react-multi-progress";
import "./redditInfoBox.css"
import { getAIMentions } from "./commentCheck";

interface PostInfo {
  ratio: number;
  upvotes: number;
  downvotes: number;
}

interface OpData {
  karma : number;
  commentKarma : number;
  postKarma : number;
  cakeDay: string;
}

let isOldReddit: boolean = false;

const RedditInfoBox: React.FC = () => {
  const [opData, setOpData] = useState<OpData | null>(null);
  const [postInfo, setPostInfo] = useState<PostInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAiMentioned, setAiMentioned] = useState(false);

  useEffect(() => {
    if (!window.location.href.match(/reddit\.com\/r\/.+\/comments\//)) return;

    const fetchVoteData = async () => {
      // upvote/downvote info
      const u = new URL(window.location.href.replace(/\/$/, ""));
      let jsonUrl = u.origin + u.pathname + ".json";

      if (jsonUrl.includes("old.")) {
        jsonUrl = jsonUrl.replace("old.", "www.");
        isOldReddit = true;
      }

      try {
        const response = await fetch(jsonUrl);
        const data: [any, unknown] = await response.json();

        const postData = data[0].data.children[0].data;
        const ratio: number = postData.upvote_ratio;
        const ups: number = postData.ups;

        const estimatedUpvotes = Math.round(ups / ratio);
        const estimatedDownvotes = estimatedUpvotes - ups;

        setPostInfo({
          ratio,
          upvotes: estimatedUpvotes,
          downvotes: estimatedDownvotes,
        });
      } catch (e) {
        console.error("Failed to fetch Reddit JSON", e);
        setError("Failed to load post info.");
      }
    };

    const fetchOPData = async () => {
      // Information on Poster
      let tracker;
      let username;
      if (isOldReddit) {
        tracker = document.querySelector('p.tagline a.author');
        if (!tracker) return;
        username = tracker.textContent;
      } else {
        tracker = document.querySelector('faceplate-tracker[noun="user_profile"]');
        if (!tracker) return;

        let usernameEl = tracker.querySelector("a.author-name");
        if (!usernameEl) return;

        username = usernameEl.textContent.trim();
      }

      try {
        const resp = await fetch(`https://www.reddit.com/user/${username}/about.json`);
        if (!resp.ok) return;
        
        const json = await resp.json();
        const data = json.data;

        const karma: number = data.total_karma;
        const commentKarma: number = data.comment_karma;
        const postKarma: number = data.link_karma
        const cakeDay: string = new Date(data.created_utc * 1000).toLocaleDateString();

        
        setOpData({
          karma,
          commentKarma,
          postKarma,
          cakeDay
        });

        // Create element
        const info = document.createElement("span");
        info.textContent = ` • Cake Day: ${cakeDay} • ${postKarma} post karma • ${commentKarma} comment karma`;
        info.style.fontStyle = "bold";


        tracker.appendChild(info);
      } catch (e) {
        console.error("Failed to fetch user info", e);
      }
    }

    const checkAI = getAIMentions(() => {
      setAiMentioned(true);
    });


    
    fetchVoteData();
    fetchOPData();
    checkAI();

  }, []);


  const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

  const boxStyle: React.CSSProperties = {
    width: isOldReddit ? "90%" : "50%",
    padding: "10px",
    background: isDarkMode ? "#282828ff" : "#fff8e1",
    border: "1px solid #ccc",
    borderRadius: "8px",
    color: isDarkMode ? "white" : "black",
    margin: "10px 0",
    fontSize: "14px",
    fontFamily: "Verdana, Helvetica, sans-serif",
    fontWeight: "bold",
    position: "relative", 
    zIndex: 0
  };

  if (error) return <div style={boxStyle}>❌ {error}</div>;

  if (!postInfo || !opData) return null;

  const isPossibleBotAccount: boolean = opData.postKarma >= 1000 && (opData.commentKarma / opData.postKarma) < 0.01; // Comment karma <1% of Post Karma
  const isNewAccount: boolean = new Date().getTime() - new Date(opData.cakeDay).getTime() <= (3 * 2678400); // Less than 3 months old

  return (
    <div style={boxStyle}>
        {!isOldReddit && (
      <>
        {Number((postInfo.ratio * 100).toFixed(0)) + "% upvoted"} |{" "}
      </>
    )}
    {postInfo.ratio <= 0.5 ? (
      <>Vote count unavailable (Post has below 0 Karma)</>
    ) : (
      <>
        ⬆️ {postInfo.upvotes} | ⬇️ {postInfo.downvotes}
      </>
    )}
      <MultiProgress
			elements={[
        {
					value: Number((postInfo.ratio * 100).toFixed(0)),
					color: "#FF4500",
          height: "16px",
					isBold: true,
				},
				{
					value: Number(((1-postInfo.ratio) * 100).toFixed(0)),
					color: "#6A5CFF",
          height: "16px",
					isBold: false,
				},
			]}
      className="sendToBack"
		/>


    {isNewAccount && <p>🍼 OP is a new account, less than 3 months old</p>}
    {isPossibleBotAccount && <p>🤖 OP is possibly a bot: High post karma but Low comment karma</p>}
    {isAiMentioned && <p>🤖 'AI' mentioned in post's comments</p> }
    </div>
  );
};

export default RedditInfoBox;
