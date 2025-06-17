# FastAPI backend for virtual try-on
import ssl

try:
    import urllib3
    urllib3.util.ssl_.DEFAULT_CIPHERS += 'HIGH:!DH:!aNULL'
except Exception:
    pass

ssl._create_default_https_context = ssl._create_unverified_context

from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import requests
import shutil
import os
from typing import Optional
import mediapipe as mp
from PIL import Image
import numpy as np
from gradio_client import Client
from gradio_client import handle_file


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload_user")
async def upload_user(
    file: UploadFile = File(...),
    height: float = Form(...),
    weight: float = Form(...)
):
    user_path = os.path.join(UPLOAD_DIR, f"user_{file.filename}")
    with open(user_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    # Run MediaPipe body segmentation
    mp_selfie_segmentation = mp.solutions.selfie_segmentation
    with mp_selfie_segmentation.SelfieSegmentation(model_selection=1) as selfie_segmentation:
        image = Image.open(user_path).convert("RGB")
        image_np = np.array(image)
        results = selfie_segmentation.process(image_np)
        mask = (results.segmentation_mask > 0.5).astype(np.uint8) * 255
        mask_img = Image.fromarray(mask)
        mask_path = os.path.join(UPLOAD_DIR, f"user_mask_{file.filename}")
        mask_img.save(mask_path)
    return {"user_image_path": user_path, "user_mask_path": mask_path, "height": height, "weight": weight}

@app.post("/upload_garment")
async def upload_garment(
    file: UploadFile = File(...),
    measurements: str = Form(...)
):
    garment_path = os.path.join(UPLOAD_DIR, f"garment_{file.filename}")
    with open(garment_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"garment_image_path": garment_path, "measurements": measurements}

@app.post("/virtual_tryon")
async def virtual_tryon(
    user_image_path: str = Form(...),
    garment_image_path: str = Form(...),
    measurements: str = Form(...),
    height: float = Form(...),
    weight: float = Form(...)
):
    # Use Gradio client to call IDM-VTON
    client = Client("yisol/IDM-VTON")
    # Combine measurements with height/weight for garment_des
    garment_des_param = f"{measurements}; User height: {height}cm; User weight: {weight}kg"
    real_user_path = os.path.abspath(user_image_path.lstrip("/"))
    real_garment_path = os.path.abspath(garment_image_path.lstrip("/"))

    #debugging(roy)
    #print("=== virtual_tryon DEBUG ===")
    #print("user_image_path (raw):", user_image_path)
    #print("garment_image_path (raw):", garment_image_path)
    #print("Resolved user path:", real_user_path)
    #print("Resolved garment path:", real_garment_path)
    #print("Exists?", os.path.exists(real_user_path), os.path.exists(real_garment_path))
    #end

    dict_param = {
    "background": handle_file(real_user_path),
    "layers": [],
    "composite": None
    }
    garm_img_param = handle_file(real_garment_path) 
    is_checked = True
    is_checked_crop = False
    denoise_steps = 30
    seed = 42
    try:
        result = client.predict(
            dict=dict_param,
            garm_img=garm_img_param,
            garment_des=garment_des_param,
            is_checked=is_checked,
            is_checked_crop=is_checked_crop,
            denoise_steps=denoise_steps,
            seed=seed,
            api_name="/tryon"
        )
        output_image_path = result[0]
        masked_image_path = result[1]
        import base64
        with open(output_image_path, "rb") as f:
            base64_img = base64.b64encode(f.read()).decode("utf-8")
        tryon_result = f"data:image/png;base64,{base64_img}"
        return {"tryon_result": tryon_result, "user_image": user_image_path, "garment_image": garment_image_path}
    except Exception as e:
        return {"tryon_result": None, "user_image": user_image_path, "garment_image": garment_image_path, "error": str(e)}

@app.post("/llm_feedback")
async def llm_feedback(
    tryon_result: str = Form(...),
    user_info: str = Form(...),
    garment_info: str = Form(...)
):
    prompt = f"A user with info {user_info} tried on a garment with info {garment_info}. The try-on result is at: {tryon_result}. Give a realistic, neutral feedback about the fit and look."
    api_url = "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1"
    headers = {
        "Accept": "application/json",
        "Authorization": "Bearer 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"
    }
    payload = {"inputs": prompt}
    try:
        response = requests.post(api_url, headers=headers, json=payload, timeout=60)
        if response.status_code == 200:
            data = response.json()
            # Try both possible response formats
            if isinstance(data, list) and len(data) > 0 and "generated_text" in data[0]:
                feedback = data[0]["generated_text"]
            elif isinstance(data, dict) and "generated_text" in data:
                feedback = data["generated_text"]
            elif isinstance(data, dict) and "error" in data:
                feedback = f"LLM API error: {data['error']}"
            else:
                feedback = str(data)
        else:
            try:
                error_data = response.json()
                feedback = f"LLM API error: {error_data.get('error', response.text)}"
            except Exception:
                feedback = f"Could not get feedback. Status code: {response.status_code}"
    except Exception as e:
        feedback = f"Exception: {str(e)}"
    return {"feedback": feedback}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)