import React, { useEffect, useState } from "react";
import { usePostVotes } from "./hooks/usePostVotes";
import { useOpData } from "./hooks/useOpData";
import { useAICheck } from "./hooks/useAICheck";

const RedditInfoBox: React.FC = () => {
  const { postInfo, error, isOldReddit } = usePostVotes();
  const opData = useOpData(isOldReddit);
  const aiComment = useAICheck();

  const [settings, setSettings] = useState({
    isEnabled: true,
    minMonths: 3,
    karmaRatio: 1.0,
  });

  const storage = typeof chrome !== "undefined" ? chrome.storage.local : (window as any).browser?.storage.local;

  useEffect(() => {
    if (!storage) return;
    storage.get(["aiHighlightEnabled", "minMonths", "karmaRatio"], (result: any) => {
      setSettings({
        isEnabled: result.aiHighlightEnabled ?? true,
        minMonths: result.minMonths ?? 3,
        karmaRatio: parseFloat(result.karmaRatio ?? "1.0"),
      });
    });
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
    zIndex: 0,
  };

  if (error) return <div style={boxStyle}>❌ {error}</div>;
  if (!postInfo || !opData) return null;


  const karmaPercentage = (opData.commentKarma / Math.max(opData.postKarma, 1)) * 100;
  const lowCommentKarma = 
    opData.commentKarma < 0 || 
    (opData.postKarma >= 1000 && karmaPercentage < settings.karmaRatio);

  const accountAgeMs = Date.now() - new Date(opData.cakeDay).getTime();
  const limitMs = settings.minMonths * 30.44 * 24 * 60 * 60 * 1000; 
  const isNewAccount = accountAgeMs <= limitMs;

  return (
    <div style={boxStyle}>
      {!isOldReddit && (
        <>{Number((postInfo.ratio * 100).toFixed(0))}% upvoted | </>
      )}

      {postInfo.ratio <= 0.5 ? (
        <>Vote count unavailable (Post has negative Karma)</>
      ) : (
        <>⬆️ {postInfo.upvotes} | ⬇️ {postInfo.downvotes}</>
      )}

      <div style={{
        display: "flex", width: "100%", height: "16px", borderRadius: "8px",
        overflow: "hidden", marginTop: "8px", marginBottom: "8px", border: "1px solid #ccc",
      }}>
        <div style={{ width: `${(postInfo.ratio * 100)}%`, background: "#FF4500" }} />
        <div style={{ width: `${((1 - postInfo.ratio) * 100)}%`, background: "#6A5CFF" }} />
      </div>

      {isNewAccount && (
        <p>🍼 User is a new account, less than {settings.minMonths} months old</p>
      )}

      {lowCommentKarma && (
        <p>
          📉 Low comment karma (Under {settings.karmaRatio}% of post karma)
        </p>
      )}

      {settings.isEnabled && aiComment && (
        <p>
          🤖 &apos;AI/Bot&apos; mentioned in{" "}
          <a href={aiComment.permalink} target="_blank" rel="noopener noreferrer" style={{ color: "#FF4500" }}>
            this comment
          </a>
        </p>
      )}
    </div>
  );
};

export default RedditInfoBox;