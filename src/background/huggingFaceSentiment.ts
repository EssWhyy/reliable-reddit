/// <reference types="chrome" />
import { pipeline, env } from '@huggingface/transformers';

// Since Chrome Extensions don't have standard file system access, 
// we configure Transformers.js to use browser-compatible caching.
env.allowLocalModels = false; 

let classifier: any = null;

// Initialize the sentiment analysis pipeline
async function getClassifier() {
  if (!classifier) {
    // Using a tiny, highly-optimized model (~40MB) perfect for extensions
    classifier = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english', {
      device: 'webgpu', // Fallback to 'wasm' happens automatically if WebGPU isn't available
    });
  }
  return classifier;
}

// Listen for messages from your content scripts or UI hooks
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'ANALYZE_SENTIMENT') {
    (async () => {
      try {
        const model = await getClassifier();
        // Truncate text to fit model constraints (usually 512 tokens)
        const truncatedText = message.text.slice(0, 512); 
        const result = await model(truncatedText);
        
        // [{ label: 'POSITIVE', score: 0.9998 }]
        sendResponse({ success: true, data: result[0] });
      } catch (error: any) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    
    return true; // Keeps the message channel open for asynchronous sendResponse
  }
});