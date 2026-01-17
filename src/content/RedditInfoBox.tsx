import React from "react";
import MultiProgress from "react-multi-progress";
import "./redditInfoBox.css";

import { usePostVotes } from "./hooks/usePostVotes";
import { useOpData } from "./hooks/useOpData";
import { useAICheck } from "./hooks/useAICheck";

// Actual Reddit Post Info Box React Component
const RedditInfoBox: React.FC = () => {
  const { postInfo, error, isOldReddit } = usePostVotes();
  const opData = useOpData(isOldReddit);
  const aiComment = useAICheck();

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

  if (error) {
    return <div style={boxStyle}>❌ {error}</div>;
  }

  if (!postInfo || !opData) {
    return null;
  }

  const isPossibleBotAccount =
    opData.postKarma >= 1000 &&
    opData.commentKarma / opData.postKarma < 0.01;

  const isNewAccount =
    Date.now() - new Date(opData.cakeDay).getTime() <= 3 * 2678400 * 1000;

  return (
    <div style={boxStyle}>
      {!isOldReddit && (
        <>
          {Number((postInfo.ratio * 100).toFixed(0))}% upvoted |{" "}
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
            value: Number(((1 - postInfo.ratio) * 100).toFixed(0)),
            color: "#6A5CFF",
            height: "16px",
            isBold: false,
          },
        ]}
        className="sendToBack"
      />

      {isNewAccount && (
        <p>🍼 OP is a new account, less than 3 months old</p>
      )}

      {isPossibleBotAccount && (
        <p>
          🤖 OP is possibly a bot: High post karma but low comment karma
        </p>
      )}

      {aiComment && (
        <p>
          🤖 &apos;AI&apos; mentioned in{" "}
          <a
            href={aiComment.permalink}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#FF4500" }}
          >
            this comment
          </a>
        </p>
      )}
    </div>
  );
};

export default RedditInfoBox;
