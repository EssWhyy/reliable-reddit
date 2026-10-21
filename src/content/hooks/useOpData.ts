import { useEffect, useState } from "react";

export interface OpData {
  karma: number;
  commentKarma: number;
  postKarma: number;
  cakeDay: string;
  isHistoryHidden: boolean;
  isDeletedUser: boolean;
}

export function useOpData(isOldReddit: boolean) {
  const [opData, setOpData] = useState<OpData | null>(null);

  useEffect(() => {
    const fetchOPData = async () => {
      let tracker: Element | null = null;
      let username: string | null = null;

      if (isOldReddit) {
        tracker = document.querySelector("p.tagline a.author");
        username = tracker?.textContent ?? null;
      } else {
        tracker = document.querySelector('faceplate-tracker[noun="user_profile"]');
        username = tracker?.querySelector("a.author-name")?.textContent?.trim() ?? null;

        if (!username) {
          const deletedElement = 
            document.querySelector('shreddit-post[author="[deleted]"]') ||
            document.querySelector('span[data-testid="post-author"]') ||
            Array.from(document.querySelectorAll("span")).find(el => el.textContent?.trim() === "[deleted]");

          if (deletedElement) {
            username = "[deleted]";
            tracker = deletedElement;
          }
        }
      }

      if (!tracker || !username) return;

      // Safe guard for deleted author profiles
      if (username === "[deleted]") {
        setOpData({
          karma: 0,
          commentKarma: 0,
          postKarma: 0,
          cakeDay: "N/A",
          isHistoryHidden: false,
          isDeletedUser: true
        });

        return;
      }

      // New Reddit: Extract information directly from DOM elements
      if (!isOldReddit) {
        const extractFromDOM = () => {
          const karmaElements = document.querySelectorAll('[data-testid="karma-number"]');
          const cakeDayEl = document.querySelector('[data-testid="cake-day"]');

          if (karmaElements.length >= 2 && cakeDayEl) {
            const postKarma = parseInt(karmaElements[0].textContent?.replace(/,/g, "").trim() || "0", 10);
            const commentKarma = parseInt(karmaElements[1].textContent?.replace(/,/g, "").trim() || "0", 10);
            const totalKarma = postKarma + commentKarma;

            let cakeDay = cakeDayEl.textContent?.trim() || "N/A";
            const datetimeAttr = cakeDayEl.getAttribute("datetime");
            if (datetimeAttr) {
              const parsedDate = new Date(datetimeAttr);
              if (!isNaN(parsedDate.getTime())) {
                cakeDay = parsedDate.toLocaleDateString();
              }
            }

            return {
              karma: totalKarma,
              commentKarma,
              postKarma,
              cakeDay,
              isHistoryHidden: false,
              isDeletedUser: false
            };
          }
          return null;
        };

        let opDataResult = extractFromDOM();
        if (!opDataResult) {
          await new Promise<void>((resolve) => {
            const observer = new MutationObserver(() => {
              opDataResult = extractFromDOM();
              if (opDataResult) {
                observer.disconnect();
                resolve();
              }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => {
              observer.disconnect();
              resolve();
            }, 3000);
          });
          opDataResult = extractFromDOM();
        }

        if (opDataResult) {
          setOpData(opDataResult);

          if (!document.getElementById("op-metadata-tracker")) {
            const info = document.createElement("span");
            info.id = "op-metadata-tracker";
            info.textContent = ` • Cake Day: ${opDataResult.cakeDay} • ${opDataResult.postKarma} post karma • ${opDataResult.commentKarma} comment karma`;
            info.style.fontWeight = "bold";
            tracker.appendChild(info);
          }
        }
        return;
      }

      // Old Reddit: about.json
      try {
        const baseUrl = "https://old.reddit.com";
        const resp = await fetch(`${baseUrl}/user/${username}/about.json`, {
          credentials: "include",
          headers: {
            "Accept": "application/json"
          }
        });

        if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);

        const jsonBody = await resp.json();
        const data = jsonBody.data;
        const cakeDay = new Date(data.created_utc * 1000).toLocaleDateString();
        const hasKarma = data.link_karma > 0 || data.comment_karma > 0;

        setOpData({
          karma: data.total_karma ?? (data.link_karma + data.comment_karma),
          commentKarma: data.comment_karma,
          postKarma: data.link_karma,
          cakeDay: cakeDay,
          isHistoryHidden: false,
          isDeletedUser: false
        });

        if (!document.getElementById("op-metadata-tracker")) {
          const info = document.createElement("span");
          info.id = "op-metadata-tracker";
          info.textContent = ` • Cake Day: ${cakeDay} • ${data.link_karma} post karma • ${data.comment_karma} comment karma`;
          info.style.fontWeight = "bold";
          tracker.appendChild(info);
        }

        if (hasKarma) {
          try {
            const historyResp = await fetch(`${baseUrl}/user/${username}/submitted.json?limit=1`, {
              credentials: "include"
            });
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
        console.error("Failed to fetch OP data via old.reddit", e);
      }
    };

    fetchOPData();
  }, [isOldReddit]);

  return opData;
}