import React from "react";
import { Button, Typography, Box, Paper } from "@mui/material";
import { FaReddit, FaGithub } from "react-icons/fa";
import { SiBuymeacoffee } from "react-icons/si";

const Popup: React.FC = () => {
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