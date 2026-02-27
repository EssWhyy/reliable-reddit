import { useEffect, useState } from "react";

export interface OpData {
  karma: number;
  commentKarma: number;
  postKarma: number;
  cakeDay: string;
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
        let requestUrl = u.hostname.includes("old.reddit.com") 
          ? `https://old.reddit.com/user/${username}/about.json`
          : `https://www.reddit.com/user/${username}/about.json`;

        const resp = await fetch(
          requestUrl
        );
        if (!resp.ok) return;

        const data = (await resp.json()).data;

        const cakeDay = new Date(
          data.created_utc * 1000
        ).toLocaleDateString();

        setOpData({
          karma: data.total_karma,
          commentKarma: data.comment_karma,
          postKarma: data.link_karma,
          cakeDay,
        });

        const info = document.createElement("span");
        info.textContent = ` • Cake Day: ${cakeDay} • ${data.link_karma} post karma • ${data.comment_karma} comment karma`;
        info.style.fontStyle = "bold";

        tracker.appendChild(info);
      } catch (e) {
        console.error("Failed to fetch OP data", e);
      }
    };

    fetchOPData();
  }, [isOldReddit]);

  return opData;
}
