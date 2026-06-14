import React, { useEffect, useState } from "react";
import { usePostVotes } from "./hooks/usePostVotes";
import { useOpData } from "./hooks/useOpData";
import { useAICheck } from "./hooks/useAICheck";
import { useSentiment } from "./hooks/useSentiment";
import { extractTargetComments, TargetCommentData } from "./commentCheck";
import { parse } from 'date-fns';

const RedditInfoBox: React.FC = () => {
  const { postInfo, error, isOldReddit } = usePostVotes();
  const opData = useOpData(isOldReddit);
  const aiComment = useAICheck();
  const [settings, setSettings] = useState({
    isAICheckEnabled: true,
    minMonths: 3,
    karmaRatio: 1.0,
  });
  
  // State to hold our calculated weighted sentiment matrix
  const [threadSentiment, setThreadSentiment] = useState<{
    score: number;
    label: string;
  } | null>(null);
  const { analyzeText, result, loading, error: sentimentError } = useSentiment();


  const storage = typeof chrome !== "undefined" ? chrome.storage.local : (window as any).browser?.storage.local;

  useEffect(() => {
    if (!storage) return;
    storage.get(["aiHighlightEnabled", "minMonths", "karmaRatio"], (result: any) => {
      setSettings({
        isAICheckEnabled: result.aiHighlightEnabled ?? true,
        minMonths: result.minMonths ?? 3,
        karmaRatio: parseFloat(result.karmaRatio ?? "1.0"),
      });
    });
  }, []);

  // Fetch the first 10 comments and pass them to the sentiment pipeline
  useEffect(() => {
    console.log('flan1')
    async function processComments() {
      // Extract the top 10 comments with upvotes
      const targetComments = await extractTargetComments(10);
      if (targetComments.length === 0) return;

      let totalWeightedScore = 0;
      let totalUpvotes = 0;

      // Map through your comments to execute analysis via your background worker 
      for (const comment of targetComments) {
        try {
          // Send text down to the background script using your hook's core logic
          const analysis: any = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
              { action: 'ANALYZE_SENTIMENT', text: comment.text },
              (response) => {
                if (response && response.success) resolve(response.data);
                else reject(response?.error);
              }
            );
          });

          // Normalize the model score (+1 for Positive, -1 for Negative)
          const normalizedScore = analysis.label === 'POSITIVE' ? analysis.score : -analysis.score;
          
          // Accumulate the weight based on comment upvote count
          totalWeightedScore += normalizedScore * comment.upvotes;
          totalUpvotes += comment.upvotes;
        } catch (err) {
          console.warn("Failed to process single comment sentiment:", err);
        }
      }

      // Calculate final weighted score bounds
      if (totalUpvotes > 0) {
        const finalScore = totalWeightedScore / totalUpvotes;
        let label = "NEUTRAL";
        if (finalScore > 0.1) label = "POSITIVE 🟢";
        if (finalScore < -0.1) label = "NEGATIVE 🔴";

        setThreadSentiment({ score: finalScore, label });
      }
    }

    // Only run analysis once postInfo is loaded successfully
    if (postInfo) {
      processComments();
    }
  }, [postInfo]);

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

      {/* ADDED VISUAL UI CONTAINER FOR THREAD SENTIMENT */}
      <hr style={{ margin: "10px 0", border: "0", borderTop: "1px solid #ccc" }} />
      <div style={{ marginBottom: "10px", fontSize: "13px" }}>
        <span>💬 Top 10 Comments Sentiment: </span>
        {threadSentiment ? (
          <span style={{ color: threadSentiment.score > 0 ? "#00dd6b" : threadSentiment.score < 0 ? "#ff4545" : "inherit" }}>
            {threadSentiment.label} ({threadSentiment.score > 0 ? "+" : ""}{threadSentiment.score.toFixed(2)})
          </span>
        ) : (
          <span style={{ fontWeight: "normal", fontStyle: "italic" }}>
            {sentimentError ? "⚠️ Error analyzing text" : "Running AI Inference Model..."}
          </span>
        )}
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

      {settings.isAICheckEnabled && aiComment && (
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