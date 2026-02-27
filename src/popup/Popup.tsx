import React, { useEffect, useState } from "react";
import { Button, Typography, Box, Paper, FormControlLabel, Checkbox } from "@mui/material";
import { FaReddit, FaGithub } from "react-icons/fa";

const Popup: React.FC = () => {
  const [showRedditInfo, setShowRedditInfo] = useState(true);

  // Utility to get storage API in a cross-browser way
  const storage = (window as any).browser?.storage || (window as any).chrome?.storage;

  useEffect(() => {
    if (!storage) return;

    // Chrome-style callback
    if (storage.sync.get.length === 2) {
      storage.sync.get(["showRedditInfo"], (result: any) => {
        if (result.showRedditInfo !== undefined) {
          setShowRedditInfo(result.showRedditInfo);
        }
      });
    } else {
      // Firefox-style promise
      storage.sync.get(["showRedditInfo"]).then((result: any) => {
        if (result.showRedditInfo !== undefined) {
          setShowRedditInfo(result.showRedditInfo);
        }
      });
    }
  }, []);


  const handleRedirect = () => {
    window.open("https://github.com/your-repo", "_blank");
  };

  return (
    <Paper
      elevation={3}
      sx={{
        width: 300,
        padding: 2,
        borderRadius: 2,
        textAlign: "center",
        backgroundColor: "#fafafa",
      }}
    >
      <Typography variant="h3" gutterBottom>
        <FaReddit/> Reddit Upvote Bar
      </Typography>

      <Typography variant="body2" color="text.secondary" gutterBottom>
        Made by EssWhyy, 2025
      </Typography>

      <Box mt={2}>
        <FormControlLabel
          control={
            <Checkbox
            />
          }
          label="Highlight AI/Bot mentions in comments"
        />
      </Box>

      <Box mt={2}>
        <Button
          variant="contained"
          startIcon={<FaGithub />}
          onClick={handleRedirect}
          sx={{ textTransform: "none" }}
        >
          View on GitHub
        </Button>
      </Box>
    </Paper>
  );
};


export default Popup