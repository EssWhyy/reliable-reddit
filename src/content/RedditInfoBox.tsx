import React, { useEffect, useState } from "react";
import { usePostVotes } from "./hooks/usePostVotes";
import { useOpData } from "./hooks/useOpData";
import { useCommentAICheck } from "./hooks/useCommentAiCheck";
import { useTextPostAICheck } from "./hooks/useTextPostAiCheck";
import { parse } from 'date-fns';

/**
 * Inspects the live DOM to figure out whether the current post is
 * text-based or image/gallery-based. Returns `null` if it can't be
 * determined (e.g. video/link posts, or the post hasn't rendered yet).
 */
function detectPostType(isOldReddit: boolean): "text" | "image" | null {
  if (!isOldReddit) {
    // New Reddit renders a <shreddit-post post-type="..."> custom element.
    const shredditPost = document.querySelector("shreddit-post");
    const type = shredditPost?.getAttribute("post-type");

    if (type === "text") return "text";
    if (type === "image" || type === "gallery") return "image";
    return null;
  }

  // Old Reddit: the post container is `.thing.link`.
  const thing = document.querySelector(".thing.link");
  if (!thing) return null;

  if (thing.classList.contains("self")) return "text";

  // Old Reddit doesn't have a dedicated "image post" class, but image
  // posts get an expando thumbnail with an <img>, while link posts to
  // articles typically don't.
  const hasImageThumbnail = !!thing.querySelector(".thumbnail img");
  if (hasImageThumbnail) return "image";

  return null;
}

/**
 * Pulls the selftext body out of the DOM for text posts. Returns `null`
 * if no post body can be found (e.g. it's not a text post, or the page
 * hasn't finished rendering).
 */
function extractPostText(isOldReddit: boolean): string | null {
  if (!isOldReddit) {
    const shredditPost = document.querySelector("shreddit-post");
    const textBody = shredditPost?.querySelector('[slot="text-body"]');
    const text = textBody?.textContent?.trim();
    return text && text.length > 0 ? text : null;
  }

  const thing = document.querySelector(".thing.link.self");
  const body = thing?.querySelector(".usertext-body .md");
  const text = body?.textContent?.trim();
  return text && text.length > 0 ? text : null;
}

/**
 * Formats the raw Hugging Face response into a short human-readable line.
 * Falls back gracefully since the exact response shape can vary.
 */
function formatAiResult(result: any): string {
  try {
    const predictions = Array.isArray(result?.[0]) ? result[0] : result;
    if (Array.isArray(predictions)) {
      const aiPrediction = predictions.find((p: any) =>
        /^(label_1|ai|1)$/i.test(String(p?.label))
      );
      if (aiPrediction && typeof aiPrediction.score === "number") {
        return `${Math.round(aiPrediction.score * 100)}% likely AI-generated`;
      }
      const top = [...predictions].sort((a: any, b: any) => b.score - a.score)[0];
      if (top && typeof top.score === "number") {
        return `Top match: ${top.label} (${Math.round(top.score * 100)}%)`;
      }
    }
  } catch {
    // fall through to generic message below
  }
  return "Check complete.";
}

const RedditInfoBox: React.FC = () => {
  const { postInfo, error, isOldReddit, comments } = usePostVotes();
  const opData = useOpData(isOldReddit);
  const aiComment = useCommentAICheck(comments);

  const [settings, setSettings] = useState({
    isEnabled: true,
    minMonths: 3,
    karmaRatio: 1.0,
  });

  const [postType, setPostType] = useState<"text" | "image" | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const { checkText, loading: aiCheckLoading, error: aiCheckError, result: aiCheckResult } = useTextPostAICheck();

  useEffect(() => {
    // The post DOM may not be fully painted the instant this component
    // mounts, so try once immediately and once on the next tick.
    setPostType(detectPostType(isOldReddit));
    const timeout = setTimeout(() => {
      setPostType(detectPostType(isOldReddit));
    }, 500);
    return () => clearTimeout(timeout);
  }, [isOldReddit]);

  useEffect(() => {
    const storageApi = typeof chrome !== "undefined" ? chrome.storage : (window as any).browser?.storage;
    if (!storageApi?.local) return;

    storageApi.local.get(["apiKey"], (result: any) => {
      setHasApiKey(!!result?.apiKey);
    });

    // React live to the key being saved/cleared from the popup, instead of
    // only checking once on mount (which would require a page reload).
    const handleStorageChange = (changes: any, area: string) => {
      if (area === "local" && "apiKey" in changes) {
        setHasApiKey(!!changes.apiKey.newValue);
      }
    };
    storageApi.onChanged?.addListener(handleStorageChange);
    return () => storageApi.onChanged?.removeListener(handleStorageChange);
  }, []);

  const handleCheckForAI = () => {
    const postText = extractPostText(isOldReddit);
    if (!postText) return;
    checkText(postText);
  };

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

      {postType === "text" && hasApiKey && (
        <div style={{ marginTop: "8px" }}>
          <button
            onClick={handleCheckForAI}
            disabled={aiCheckLoading}
            style={{
              padding: "6px 12px",
              fontSize: "13px",
              fontWeight: "bold",
              fontFamily: "Verdana, Helvetica, sans-serif",
              color: "#fff",
              background: "#525252",
              border: "none",
              borderRadius: "16px",
              cursor: aiCheckLoading ? "default" : "pointer",
              opacity: aiCheckLoading ? 0.7 : 1,
            }}
          >
            {aiCheckLoading ? "Checking…" : "Check text for AI"}
          </button>

          {!aiCheckLoading && aiCheckResult && (
            <p style={{ marginTop: "6px", fontWeight: "normal" }}>{formatAiResult(aiCheckResult)}</p>
          )}

          {!aiCheckLoading && aiCheckError && (
            <p style={{ marginTop: "6px", fontWeight: "normal", color: "#d93025" }}>
              {aiCheckError}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default RedditInfoBox;