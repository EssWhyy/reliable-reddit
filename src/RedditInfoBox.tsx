import React, { useEffect, useState } from "react";
import MultiProgress from "react-multi-progress";

interface PostInfo {
  ratio: number;
  upvotes: number;
  downvotes: number;
}

const RedditInfoBox: React.FC = () => {
  const [postInfo, setPostInfo] = useState<PostInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!window.location.href.match(/reddit\.com\/r\/.+\/comments\//)) return;

    const fetchPostData = async () => {
      const jsonUrl = window.location.href.replace(/\/$/, "") + ".json";

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

    fetchPostData();
  }, []);

  if (error) return <div style={boxStyle}>❌ {error}</div>;
  if (!postInfo) return null;

  return (
    <div style={boxStyle}>
      📊 Upvote ratio: {(postInfo.ratio * 100).toFixed(1)}% | 👍 {postInfo.upvotes} | 👎 {postInfo.downvotes}
      <MultiProgress
			elements={[
				{
					value: 35,
					color: "blue",
				},
			]}
		/>
    </div>
  );
};

const boxStyle: React.CSSProperties = {
  padding: "10px",
  background: "#fff8e1",
  border: "1px solid #ccc",
  borderRadius: "8px",
  margin: "10px 0",
  fontSize: "14px",
  fontFamily: "sans-serif",
};

export default RedditInfoBox;
