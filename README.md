# Virtual Try-On Web App

This project is a full-stack virtual try-on application for clothing, featuring:
- A React frontend with a mock online clothing store, image upload, and virtual try-on interface.
- A FastAPI backend that processes user and garment images, generates segmentation masks, and calls an AI model for virtual try-on.
- Integration with a multimodal LLM (e.g., LLaVA) to generate smart descriptions of the user and garment images for improved try-on results.

## Features
- **Online Store:** Browse and select garments with size options and measurements.
- **Image Upload:** Upload your own photo and preview before upload.
- **Garment Upload:** Upload a custom garment image or select from the store.
- **Virtual Try-On:** See yourself wearing the selected garment using AI.
- **LLM Feedback:** Get AI-generated feedback on the try-on result.

## Project Structure
```
backend/      # FastAPI backend (Python)
frontend/     # React frontend (JS/JSX)
uploads/      # Uploaded images (used by backend)
```

## How to Run

### Backend
1. Install Python 3.9+ and pip.
2. Install dependencies:
   ```sh
   pip install -r backend/requirements.txt
   ```
3. Start the backend:
   ```sh
   uvicorn backend.main:app --reload
   ```
   # or, for production:
   # uvicorn backend.main:app --host 0.0.0.0 --port 8000

### Frontend
1. Install Node.js and npm.
2. Install dependencies:
   ```sh
   cd frontend
   npm install
   ```
3. Start the frontend (from inside the `frontend` folder):
   ```sh
   npm run dev
   ```
4. Open your browser at [http://localhost:5173](http://localhost:5173) (or the port shown in the terminal).

## API Endpoints
- `POST /upload_user` — Upload user photo, height, and weight.
- `POST /upload_garment` — Upload garment image and measurements.
- `POST /virtual_tryon` — Run virtual try-on (calls LLM for description, then IDM model).
- `POST /llm_feedback` — Get feedback from an LLM about the try-on result.

## How It Works
- **User and Garment Images:** The user uploads a photo and selects or uploads a garment image.
- **Masking Model:** The backend uses MediaPipe Selfie Segmentation to generate a mask of the user's body, isolating the person from the background for more accurate try-on results.
- **LLM Description (LLaVA):** Before running the virtual try-on, the backend sends both the user and garment images to a multimodal LLM (LLaVA) via the HuggingFace API. The LLM generates a detailed description of the user and garment, which is then used as the input prompt (description) for the IDM model.
- **IDM Model:** The backend calls the IDM model (via Gradio client) using the user image, garment image, and the LLaVA-generated description to produce a realistic try-on result.
- **Feedback:** Optionally, the try-on result can be sent to an LLM for feedback about the fit and look.

## Notes
- All images are stored in the `uploads/` directory for backend processing.
- The backend uses MediaPipe for user segmentation and calls HuggingFace APIs for LLM and IDM.
- You may need to set your own HuggingFace API key in the backend code for production use.

## License
This project is for educational and research purposes only.
