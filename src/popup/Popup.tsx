import React, { useEffect, useState } from "react";
import { Button, Typography, Box, Paper, FormControlLabel, Checkbox } from "@mui/material";
import { FaReddit, FaGithub } from "react-icons/fa";

const Popup: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);

  // Cross-browser storage helper (works for both Chrome and Firefox)
  const storage = typeof chrome !== "undefined" ? chrome.storage.local : (window as any).browser?.storage.local;

  useEffect(() => {
    if (!storage) return;

    // Load initial state
    storage.get(["aiHighlightEnabled"], (result: any) => {
      if (result.aiHighlightEnabled !== undefined) {
        setIsEnabled(result.aiHighlightEnabled);
      }
    });
  }, []);

  const toggleSwitch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked;
    setIsEnabled(newValue);

    if (storage) {
      storage.set({ aiHighlightEnabled: newValue });
    }
  };

  const handleRedirect = () => {
    window.open("https://github.com/your-repo", "_blank");
  };

  return (
    <Paper
      elevation={3}
      sx={{
        width: 300,
        padding: 3,
        borderRadius: 2,
        textAlign: "center",
        backgroundColor: "#fafafa",
      }}
    >
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        <FaReddit color="#FF4500" /> Reddit Upvote Bar
      </Typography>

      <Typography variant="body2" color="text.secondary" gutterBottom>
        Made by EssWhyy, 2026
      </Typography>

      <Box mt={2} sx={{ textAlign: "left", pl: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={isEnabled}
              onChange={toggleSwitch}
              color="primary"
            />
          }
          label="Highlight AI/Bot mentions"
        />
      </Box>

      <Box mt={3}>
        <Button
          fullWidth
          variant="outlined"
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

export default Popup;