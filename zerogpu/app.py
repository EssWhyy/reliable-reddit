import os
import sys
import spaces
import torch
import torch.nn as nn
from PIL import Image
from huggingface_hub import hf_hub_download, snapshot_download
from safetensors.torch import load_file
from transformers import AutoModel, AutoTokenizer
import gradio as gr

print("Initializing AI Detection Models...")

# 1. Text AI Detector (desklib/ai-text-detector-v1.01)
TEXT_MODEL_ID = "desklib/ai-text-detector-v1.01"
TEXT_MAX_LENGTH = 512


class DesklibAIDetectionModel(nn.Module):
    def __init__(self, model_id: str):
        super().__init__()
        self.model = AutoModel.from_pretrained(model_id)
        hidden_size = self.model.config.hidden_size
        self.classifier = nn.Linear(hidden_size, 1)

        # Load classifier head weights if present in checkpoint safetensors
        weights_path = hf_hub_download(repo_id=model_id, filename="model.safetensors")
        state_dict = load_file(weights_path)
        classifier_weights = {
            k.replace("classifier.", ""): v
            for k, v in state_dict.items()
            if k.startswith("classifier.")
        }
        if classifier_weights:
            self.classifier.load_state_dict(classifier_weights, strict=False)

    def forward(self, input_ids=None, attention_mask=None, token_type_ids=None, **kwargs):
        outputs = self.model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            token_type_ids=token_type_ids,
        )
        last_hidden_state = outputs.last_hidden_state
        if attention_mask is not None:
            input_mask_expanded = (
                attention_mask.unsqueeze(-1).expand(last_hidden_state.size()).to(last_hidden_state.dtype)
            )
            sum_embeddings = torch.sum(last_hidden_state * input_mask_expanded, dim=1)
            sum_mask = input_mask_expanded.sum(dim=1).clamp(min=1e-9)
            pooled_output = sum_embeddings / sum_mask
        else:
            pooled_output = last_hidden_state.mean(dim=1)

        logits = self.classifier(pooled_output)
        return {"logits": logits}


text_tokenizer = AutoTokenizer.from_pretrained(TEXT_MODEL_ID)
text_model = DesklibAIDetectionModel(TEXT_MODEL_ID)
text_model.eval()

# 2. Image AI Detector (Smaug-AI-Image-Detector)
IMAGE_MODEL_ID = "abacusai/Smaug-AI-Image-Detector"
smaug_repo_dir = snapshot_download(IMAGE_MODEL_ID)
if smaug_repo_dir not in sys.path:
    sys.path.insert(0, smaug_repo_dir)

from smaug_image_detect import SmaugImageDetect

image_model = SmaugImageDetect.from_pretrained(IMAGE_MODEL_ID)
if hasattr(image_model, "eval"):
    image_model.eval()

print("Models successfully loaded into memory.")


def score_long_text(
    text: str,
    device: str,
    max_tokens: int = TEXT_MAX_LENGTH,
    overlap: int = 64,
    max_chunks: int = 6,
) -> tuple[float, int]:
    token_ids = text_tokenizer.encode(text, add_special_tokens=False)
    if not token_ids:
        return 0.0, 0

    step = max(1, max_tokens - overlap)
    chunk_token_lists = [
        token_ids[i : i + max_tokens]
        for i in range(0, len(token_ids), step)
    ][:max_chunks]

    probs = []
    for chunk_ids in chunk_token_lists:
        chunk_text = text_tokenizer.decode(chunk_ids, skip_special_tokens=True)
        inputs = text_tokenizer(
            chunk_text,
            truncation=True,
            max_length=max_tokens,
            padding="max_length",
            return_tensors="pt",
        ).to(device)
        with torch.no_grad():
            logits = text_model(**inputs)["logits"]
            probs.append(float(torch.sigmoid(logits).squeeze(-1)[0].item()))

    peak_prob = max(probs)
    mean_prob = sum(probs) / len(probs)
    blended = 0.6 * peak_prob + 0.4 * mean_prob
    return blended, len(probs)


@spaces.GPU(duration=10)
def detect_ai(input_type: str, text_content: str, image_content: Image.Image, request: gr.Request = None):
    """
    ZeroGPU accelerated inference function. Automatically detects input type
    if text or image is provided.
    """
    device = "cuda" if torch.cuda.is_available() else "cpu"
    results = {"type": input_type, "ai_probability": 0.0, "confidence_score": "Low"}

    if image_content is not None and (not input_type or input_type.lower() == "image"):
        if hasattr(image_model, "to"):
            image_model.to(device)

        rgb_image = image_content.convert("RGB")
        with torch.no_grad():
            ai_prob = float(image_model(rgb_image))

        results["type"] = "image"
        results["ai_probability"] = round(ai_prob, 4)
        results["confidence_score"] = f"{ai_prob * 100:.2f}%"

    elif text_content and text_content.strip() and (not input_type or input_type.lower() == "text"):
        text_model.to(device)
        ai_prob, num_chunks = score_long_text(text_content, device=device)

        results["type"] = "text"
        results["ai_probability"] = round(ai_prob, 4)
        results["confidence_score"] = f"{ai_prob * 100:.2f}%"
        results["chunks_analyzed"] = num_chunks

    else:
        raise ValueError(
            f"Invalid parameters or empty content provided. "
            f"Received type='{input_type}', text length={len(text_content) if text_content else 0}, "
            f"image provided={image_content is not None}"
        )

    return results


with gr.Blocks() as demo:
    gr.Markdown("# State-of-the-Art Content AI Detector API")
    with gr.Row():
        in_type = gr.Textbox(label="Type (text/image - optional if content provided)", value="text")
        in_text = gr.Textbox(label="Text Content")
        in_img = gr.Image(label="Image Content", type="pil")

    out_json = gr.JSON(label="Prediction Output")
    btn = gr.Button("Run Detection")
    btn.click(fn=detect_ai, inputs=[in_type, in_text, in_img], outputs=[out_json])

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)