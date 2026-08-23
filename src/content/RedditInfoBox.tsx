import React, { useEffect, useState } from "react";
import { usePostVotes } from "./hooks/usePostVotes";
import { useOpData } from "./hooks/useOpData";
import { useCommentAICheck } from "./hooks/useCommentAiCheck";
import { usePicPostAICheck } from "./hooks/usePicPostAiCheck";
import { parse } from 'date-fns';

const RedditInfoBox: React.FC = () => {
  const { postInfo, error, isOldReddit, comments } = usePostVotes();
  const opData = useOpData(isOldReddit);
  const aiMentionCount = useCommentAICheck(comments);

  // Hook for AI image checking
  const { checkImage, loading: aiLoading, error: aiError, result: aiResult } = usePicPostAICheck();

  const [settings, setSettings] = useState({
    isEnabled: true,
    minMonths: 3,
    karmaRatio: 1.0,
    apiKey: "",
  });

  // Track if a successful API response has been returned
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const storage = typeof chrome !== "undefined" ? chrome.storage.local : (window as any).browser?.storage.local;

  useEffect(() => {
    if (!storage) return;

    // Fetch initial values on mount
    storage.get(["aiHighlightEnabled", "minMonths", "karmaRatio", "apiKey"], (result: any) => {
      setSettings({
        isEnabled: result.aiHighlightEnabled ?? true,
        minMonths: result.minMonths ?? 3,
        karmaRatio: parseFloat(result.karmaRatio ?? "1.0"),
        apiKey: result.apiKey ?? "",
      });
    });

    // Listen for real-time changes from the popup script
    const storageListener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {

      if (areaName !== "local") return;

      setSettings((prevSettings) => ({
        isEnabled: changes.aiHighlightEnabled ? changes.aiHighlightEnabled.newValue : prevSettings.isEnabled,
        minMonths: changes.minMonths ? changes.minMonths.newValue : prevSettings.minMonths,
        karmaRatio: changes.karmaRatio ? parseFloat(changes.karmaRatio.newValue) : prevSettings.karmaRatio,
        apiKey: changes.apiKey ? changes.apiKey.newValue : prevSettings.apiKey,
      }));
    };

    const onChangedApi = typeof chrome !== "undefined" ? chrome.storage.onChanged : (window as any).browser?.storage?.onChanged;
    
    onChangedApi?.addListener(storageListener);

    return () => {
      onChangedApi?.removeListener(storageListener);
    };
  }, []);

  useEffect(() => {
    if (aiResult) {
      setHasAnalyzed(true);
    }
  }, [aiResult]);

const getImageUrl = (): string | null => {
    if (isOldReddit) {
      // old Reddit single image (carousel does not exist on old reddit)
      const img = document.querySelector<HTMLImageElement>("img.preview");
      return img?.src || null;
    } else {
      // New Reddit carousel
      const carouselImg = document.querySelector<HTMLImageElement>(
        'gallery-carousel li[slot="page-1"] img.media-lightbox-img'
      );
      if (carouselImg?.src) return carouselImg.src;

      // Fallback for generic gallery-carousel first image
      const firstGalleryImg = document.querySelector<HTMLImageElement>(
        "gallery-carousel img.media-lightbox-img, gallery-carousel img"
      );
      if (firstGalleryImg?.src) return firstGalleryImg.src;

      // New Reddit single image standard fallback
      const img = document.querySelector<HTMLImageElement>("img#post-image");
      return img?.src || null;
    }
  };

  // Flag to verify if the post contains a picture
  const detectedImageUrl = getImageUrl();
  const isPicturePost = Boolean(detectedImageUrl);

  const handleAiCheckClick = () => {
    if (detectedImageUrl) {
      checkImage(detectedImageUrl, settings.apiKey);
    } else {
      alert("No image found on this post to analyze!");
    }
  };

  // Calculate Human Confidence Score and Category Label
  const humanScoreData = React.useMemo(() => {
    if (!aiResult) return null;

    const humanResult = aiResult.find(
      (item) => item.label.toLowerCase() === "human"
    );
    if (!humanResult) return null;

    const percentage = humanResult.score * 100;

    let category = "Highly Likely AI";
    if (percentage >= 90) {
      category = "Human";
    } else if (percentage >= 75) {
      category = "Possibly AI";
    } else if (percentage >= 50) {
      category = "Likely AI";
    }

    return {
      percentage: percentage.toFixed(2),
      category,
    };
  }, [aiResult]);

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

      {settings.isEnabled && aiMentionCount > 0 && (
        <p>
          🤖 &apos;AI/Bot&apos; mentioned in {aiMentionCount} comment{aiMentionCount > 1 ? "s" : ""}
        </p>
      )}
      
      {/* AI Image Post Checker Section - Only renders if this is a picture post */}
      {isPicturePost && (
        <div style={{ marginTop: "10px", borderTop: "1px dashed #ccc", paddingTop: "8px" }}>
          {/* Hide button if analysis has already completed successfully */}
          {!hasAnalyzed && (
            <button 
              onClick={handleAiCheckClick} 
              disabled={aiLoading} 
              style={{ ...buttonStyle, opacity: aiLoading ? 0.6 : 1 }}
            >
              {aiLoading ? "Analyzing Image..." : "Check Image for GenAI"}
            </button>
          )}

          {aiError && (
            <p style={{ color: "#ff4d4d", marginTop: "6px" }}>⚠️ {aiError}</p>
          )}

          {humanScoreData && (
            <p style={{ marginTop: "6px" }}>
              Human Confidence: ({humanScoreData.percentage}%); <strong>{humanScoreData.category}</strong> 
            </p>
          )}
        </div>
      )}

    </div>
  );
};

export default RedditInfoBox;