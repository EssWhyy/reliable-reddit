import { useEffect, useState } from "react";

export interface OpData {
  karma: number;
  commentKarma: number;
  postKarma: number;
  cakeDay: string;
  isHistoryHidden: boolean;
}

export function useOpData(isOldReddit: boolean) {
  const [opData, setOpData] = useState<OpData | null>(null);

  useEffect(() => {
    const fetchOPData = async () => {
      let tracker: Element | null;
      let username: string | null = null;

      if (isOldReddit) {
        tracker = document.querySelector("p.tagline a.author");
        username = tracker?.textContent ?? null;
      } else {
        tracker = document.querySelector('faceplate-tracker[noun="user_profile"]');
        username = tracker
          ?.querySelector("a.author-name")
          ?.textContent?.trim() ?? null;
      }

      if (!tracker || !username) return;

      try {
        const u = new URL(window.location.href.replace(/\/$/, ""));
        const baseUrl = u.hostname.includes("old.reddit.com") 
          ? "https://old.reddit.com" 
          : "https://www.reddit.com";

        // 1. Fetch primary profile data
        const resp = await fetch(`${baseUrl}/user/${username}/about.json`);
        if (!resp.ok) return;

        const data = (await resp.json()).data;
        const cakeDay = new Date(data.created_utc * 1000).toLocaleDateString();
        
        const hasKarma = data.link_karma > 0 || data.comment_karma > 0;

        const initialOpData: OpData = {
          karma: data.total_karma,
          commentKarma: data.comment_karma,
          postKarma: data.link_karma,
          cakeDay: cakeDay,
          isHistoryHidden: false
        };
        
        setOpData(initialOpData);

        // Append initial text decoration to DOM
        const info = document.createElement("span");
        info.id = "op-metadata-tracker"; // Added ID to easily reference or update later
        info.textContent = ` • Cake Day: ${cakeDay} • ${data.link_karma} post karma • ${data.comment_karma} comment karma`;
        info.style.fontWeight = "bold";

        tracker.appendChild(info);

        // 2. Conditional check for hidden profile history
        if (hasKarma) {
          try {
            const historyResp = await fetch(`${baseUrl}/user/${username}/submitted.json?limit=1`);
            if (historyResp.ok) {
              const historyData = await historyResp.json();
              const isHidden = historyData.data.children.length === 0;

              if (isHidden) {
                setOpData(prev => prev ? { ...prev, isHistoryHidden: true } : null);
              }
            }
          } catch (historyErr) {
            console.error("Failed to verify profile history visibility status", historyErr);
          }
        }

      } catch (e) {
        console.error("Failed to fetch OP data", e);
      }
    };

    fetchOPData();
  }, [isOldReddit]);

  return opData;
}