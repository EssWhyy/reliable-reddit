import React, { useEffect, useState } from "react";
import { usePostVotes } from "./hooks/usePostVotes";
import { useOpData } from "./hooks/useOpData";
import { useCommentAICheck } from "./hooks/useCommentAiCheck";
import { usePicPostAICheck } from "./hooks/usePicPostAiCheck";
import { parse } from 'date-fns';

const RedditInfoBox: React.FC = () => {
  const { postInfo, error, isOldReddit, comments } = usePostVotes();
  const opData = useOpData(isOldReddit);
  const aiComment = useCommentAICheck(comments);

  // Hook for AI image checking
  const { checkImage, loading: aiLoading, error: aiError, result: aiResult } = usePicPostAICheck();

  const [settings, setSettings] = useState({
    isEnabled: true,
    minMonths: 3,
    karmaRatio: 1.0,
    apiKey: "",
  });

  // DEBUG: State to hold the picture URL for debugging
  const [currentPicUrl, setCurrentPicUrl] = useState<string | null>(null);

  const storage = typeof chrome !== "undefined" ? chrome.storage.local : (window as any).browser?.storage.local;

  useEffect(() => {
    if (!storage) return;
    storage.get(["aiHighlightEnabled", "minMonths", "karmaRatio"], (result: any) => {
      setSettings({
        isEnabled: result.aiHighlightEnabled ?? true,
        minMonths: result.minMonths ?? 3,
        karmaRatio: parseFloat(result.karmaRatio ?? "1.0"),
        apiKey: result.apiKey ?? "",
      });
    });
  }, []);

  const handleAiCheckClick = () => {
    let imageUrl: string | null = null;

    if (isOldReddit) {
      const anchor = document.querySelector<HTMLAnchorElement>("a.thumbnail, div.entry a.title");
      if (anchor && anchor.href.match(/\.(jpeg|jpg|gif|png|webp)/i)) {
        imageUrl = anchor.href;
      }
    } else {
      const img = document.querySelector<HTMLImageElement>("shredit-post img, div[data-test-id='post-content'] img");
      if (img) imageUrl = img.src;
    }

    if (imageUrl) {
      checkImage(imageUrl);
    } else {
      alert("No image found on this post to analyze!");
    }
  };

  const topResult = aiResult
    ? [...aiResult].sort((a, b) => b.score - a.score)[0]
    : null;

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

  const buttonStyle: React.CSSProperties = {
    marginTop: "10px",
    padding: "6px 12px",
    backgroundColor: "#FF4500",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
  };


  if (error) return <div style={boxStyle}>❌ {error}</div>;
  if (!postInfo || !opData) return null;


  const karmaPercentage = (opData.commentKarma / Math.max(opData.postKarma, 1)) * 100;
  const lowCommentKarma = 
      !opData.isDeletedUser && (
        opData.commentKarma < 0 || 
        (opData.postKarma >= 1000 && karmaPercentage < settings.karmaRatio)
      );

  const cakeDayDate = parse(opData.cakeDay, 'dd/MM/yyyy', new Date());
  const accountAgeMs = Date.now() - cakeDayDate.getTime();

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
        <p>🍼 User is new, account under {settings.minMonths} months old</p>
      )}

      {opData.isHistoryHidden && (
        <p>🔒 User hid their post & comment history</p>
      )}

      {lowCommentKarma && (
        <p>📉 User has low comment karma (under {settings.karmaRatio}% of post karma)</p>
      )}

      {settings.isEnabled && aiComment && (
        <p>
          🤖 &apos;AI/Bot&apos; mentioned in{" "}
          <a href={aiComment.permalink} target="_blank" rel="noopener noreferrer" style={{ color: "#FF4500" }}>
            this comment
          </a>
        </p>
      )}

      {/* AI Image Post Checker Section */}


      {/* ----------------- DEBUG SECTION ----------------- */}
      <div style={{
        backgroundColor: "rgba(255, 0, 0, 0.1)",
        border: "1px dashed red",
        padding: "6px",
        marginBottom: "10px",
        fontSize: "11px",
        wordBreak: "break-all"
      }}>
        <p style={{ margin: 0 }}>🐛 <strong>DEBUG INFO</strong></p>
        <p style={{ margin: "2px 0 0 0" }}>🔑 <strong>API Key:</strong> {settings.apiKey || "None"}</p>
        <p style={{ margin: "2px 0 0 0" }}>🖼️ <strong>Image URL:</strong> {currentPicUrl || "Not selected yet"}</p>
      </div>
      {/* ------------------------------------------------- */}
      
      <div style={{ marginTop: "10px", borderTop: "1px dashed #ccc", paddingTop: "8px" }}>
        <button 
          onClick={handleAiCheckClick} 
          disabled={aiLoading} 
          style={{ ...buttonStyle, opacity: aiLoading ? 0.6 : 1 }}
        >
          {aiLoading ? "🔍 Analyzing Image..." : "🖼️ Check Image with AI"}
        </button>

        {aiError && (
          <p style={{ color: "#ff4d4d", marginTop: "6px" }}>⚠️ {aiError}</p>
        )}

        {topResult && (
          <p style={{ marginTop: "6px" }}>
            🎨 AI Image Result: <strong>{topResult.label.toUpperCase()}</strong> ({ (topResult.score * 100).toFixed(2) }%)
          </p>
        )}
      </div>

    </div>
  );
};

export default RedditInfoBox;