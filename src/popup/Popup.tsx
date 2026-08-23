import React, { useEffect, useState, ChangeEvent } from "react";
import { 
  Button, Typography, Box, Paper, FormControlLabel, 
  Checkbox, MenuItem, Select, TextField, SelectChangeEvent 
} from "@mui/material";
import { FaReddit, FaGithub } from "react-icons/fa";

const Popup: React.FC = () => {

  // Default value hooks
  const [isEnabled, setIsEnabled] = useState(true);
  const [months, setMonths] = useState<number>(3);
  const [karmaPercent, setKarmaPercent] = useState<string>("1");
  const [apiKey, setApiKey] = useState<string>("");
  const [savedApiKey, setSavedApiKey] = useState<string>("");
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [isEditingApiKey, setIsEditingApiKey] = useState(false);

  // compatibility with firefox
  const storage = typeof chrome !== "undefined" ? chrome.storage.local : (window as any).browser?.storage.local;


  useEffect(() => {
    if (!storage) return;

    storage.get(["aiHighlightEnabled", "minMonths", "karmaRatio", "apiKey"], (result: any) => {
      if (result.aiHighlightEnabled !== undefined) setIsEnabled(result.aiHighlightEnabled);
      if (result.minMonths !== undefined) setMonths(result.minMonths);
      if (result.karmaRatio !== undefined) setKarmaPercent(result.karmaRatio);
      if (result.apiKey !== undefined) {
        setApiKey(result.apiKey);
        setSavedApiKey(result.apiKey);
      }
    });
  }, []);


  const handleToggle = (event: ChangeEvent<HTMLInputElement>) => {
    const val = event.target.checked;
    setIsEnabled(val);
    storage?.set({ aiHighlightEnabled: val });
  };

  const handleMonthChange = (event: SelectChangeEvent<number>) => {
    const val = Number(event.target.value);
    setMonths(val);
    storage?.set({ minMonths: val });
  };

  const handleKarmaChange = (event: ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value;
    // Allow only numbers and decimals (0-100)
    if (val === "" || (Number(val) >= 0 && Number(val) <= 100)) {
      setKarmaPercent(val);
      storage?.set({ karmaRatio: val });
    }
  };


  const handleApiKeyChange = (event: ChangeEvent<HTMLInputElement>) => {
    setApiKey(event.target.value);
    setApiKeySaved(false);
  };

  const handleApiKeySave = () => {
    storage?.set({ apiKey }, () => {
      setSavedApiKey(apiKey);
      setApiKeySaved(true);
      setIsEditingApiKey(false);
    });
  };

  const handleApiKeyEdit = () => {
    setIsEditingApiKey(true);
    setApiKeySaved(false);
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 6) return key;
    return `${key.slice(0, 6)}${"•".repeat(Math.max(key.length - 6, 8))}`;
  };

  const handleRedirect = () => {
    window.open("https://github.com/EssWhyy/reliable-reddit", "_blank");
  };

  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);


  return (
    <Paper elevation={3} sx={{ width: 320, padding: 3, borderRadius: 2, textAlign: "center", backgroundColor: "#fafafa" }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        <FaReddit color="#FF4500" /> Reddit Upvote Bar
      </Typography>

      <Typography variant="body2" color="text.secondary" gutterBottom>
        Made by EssWhyy, 2026
      </Typography>

      {/* Toggle Section */}
      <Box mt={2} sx={{ textAlign: "left" }}>
        <FormControlLabel
          control={<Checkbox checked={isEnabled} onChange={handleToggle} color="primary" />}
          label={<Typography variant="body2">Highlight AI mentions in comments</Typography>}
        />
      </Box>
      
      {/* Select Section (Integers 1-12) */}
      <Box mt={2} sx={{ textAlign: "left", display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2">Flag accounts younger than</Typography>
        <Select
          size="small"
          value={months}
          onChange={handleMonthChange}
          sx={{ minWidth: 70 }}
        >
          {monthOptions.map((m) => (
            <MenuItem key={m} value={m}>{m}</MenuItem>
          ))}
        </Select>
        <Typography variant="body2">months</Typography>
      </Box>
      
      {/* Input Section (Float/Percent) */}
      <Box mt={2} sx={{ textAlign: "left" }}>
        <Typography variant="body2" gutterBottom>Flag accounts with comment karma less than:</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            size="small"
            variant="outlined"
            value={karmaPercent}
            onChange={handleKarmaChange}
            type="number"
            inputProps={{ min: 0, max: 100, step: 0.1 }}
            sx={{ width: 80 }}
          />
          <Typography variant="body2">% of post karma</Typography>
        </Box>
      </Box>

      {/* API Key Section */}
      <Box mt={2} sx={{ textAlign: "left" }}>
        <Typography variant="body2" gutterBottom>HuggingFace API Key (for AI content detection)</Typography>
        {!isEditingApiKey && savedApiKey ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              size="small"
              variant="outlined"
              value={maskApiKey(savedApiKey)}
              inputProps={{ readOnly: true }}
              fullWidth
              sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace', letterSpacing: 1 } }}
            />
            <Button
              variant="outlined"
              onClick={handleApiKeyEdit}
              sx={{ textTransform: "none", whiteSpace: "nowrap" }}
            >
              Edit
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              size="small"
              variant="outlined"
              type="password"
              value={apiKey}
              onChange={handleApiKeyChange}
              placeholder="Enter API key"
              fullWidth
              autoFocus={isEditingApiKey}
            />
            <Button
              variant="contained"
              onClick={handleApiKeySave}
              sx={{ textTransform: "none", whiteSpace: "nowrap" }}
            >
              Save
            </Button>
          </Box>
        )}
        {apiKeySaved && (
          <Typography variant="caption" color="success.main">
            Saved!
          </Typography>
        )}
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