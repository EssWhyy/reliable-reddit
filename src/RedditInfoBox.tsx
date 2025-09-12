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
      const u = new URL(window.location.href.replace(/\/$/, ""));
      const jsonUrl = u.origin + u.pathname + ".json";

      try {
        const response = await fetch(jsonUrl);
        const data: [any, unknown] = await response.json();
        
        const postData = data[0].data.children[0].data;
        const ratio: number = postData.upvote_ratio;
        const ups: number = postData.ups;

        console.log(postData)
        console.log()

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
      {(postInfo.ratio * 100) + "% upvoted"} | ⬆️ {postInfo.upvotes} | ⬇️ {postInfo.downvotes}
      <MultiProgress
			elements={[
        {
					value: Number((postInfo.ratio * 100).toFixed(0)),
					color: "#FF4500",
          height: "16px",
					isBold: true,
				},
				{
					value: Number(((1-postInfo.ratio) * 100).toFixed(0)),
					color: "#6A5CFF",
          height: "16px",
					isBold: false,
				},
			]}
		/>
    </div>
  );
};

const boxStyle: React.CSSProperties = {
  width: "40%",
  padding: "10px",
  background: "#fff8e1",
  border: "1px solid #ccc",
  borderRadius: "8px",
  color: "black",
  margin: "10px 0",
  fontSize: "14px",
  fontFamily: "sans-serif",
  fontWeight: "bold",
};

export default RedditInfoBox;
