# Virtual Try-On Web App

A full-stack AI-powered virtual try-on platform for clothing. Users can browse a mock online store, upload their own photos, and preview how selected garments would look on them using advanced computer vision and multimodal AI models.

## Overview
- **Frontend:** React-based, featuring a store interface, garment selection, image upload, and live preview.
- **Backend:** FastAPI (Python), handling image uploads, user segmentation (MediaPipe), multimodal LLM garment/user description (LLaVA), and virtual try-on (IDM via Gradio).
- **AI Integration:** Uses HuggingFace-hosted models for image description and feedback, and MediaPipe for user masking.

## Features
- **Online Store:** Browse, select, and preview garments with size and measurement options.
- **Image Upload:** Upload and preview your own photo before try-on.
- **Garment Upload:** Use store garments or upload your own.
- **Virtual Try-On:** See yourself wearing the selected garment using AI.
- **LLM Feedback:** Get realistic, neutral feedback about the fit and look from an AI model.

## Project Structure
```
backend/      # FastAPI backend (Python)
frontend/     # React frontend (JS/JSX)
uploads/      # Uploaded images (used by backend)
```

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js & npm
- HuggingFace API key (for production use)

### Backend Setup
1. Install dependencies:
   ```sh
   pip install -r backend/requirements.txt
   ```
2. Start the backend:
   ```sh
   uvicorn backend.main:app --reload
   ```
   _For production:_
   ```sh
   uvicorn backend.main:app --host 0.0.0.0 --port 8000
   ```

### Frontend Setup
1. Install dependencies:
   ```sh
   cd frontend
   npm install
   ```
2. Start the frontend:
   ```sh
   npm run dev
   ```
3. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage Guide
1. **Select a Garment:** Browse the store or upload a custom garment image.
2. **Upload Your Photo:** Provide a clear, front-facing image for best results.
3. **Preview & Try-On:** Click 'Try On' to see the AI-generated result.
4. **Get Feedback:** Optionally, request AI feedback on the fit and look.

## API Endpoints
- `POST /upload_user` — Upload user photo, height, and weight.
- `POST /upload_garment` — Upload garment image and measurements.
- `POST /virtual_tryon` — Run virtual try-on (calls LLM for description, then IDM model).
- `POST /llm_feedback` — Get feedback from an LLM about the try-on result.

## How It Works
- **User & Garment Images:** Uploaded images are stored in `uploads/` for backend processing.
- **Masking:** MediaPipe Selfie Segmentation isolates the user from the background.
- **LLM Description:** LLaVA (via HuggingFace) generates a detailed description of the user and garment, improving try-on realism.
- **Virtual Try-On:** IDM model (via Gradio) produces the try-on result using the images and LLM description.
- **Feedback:** LLM (Llama-3-8B-Instruct) provides neutral, realistic feedback on the try-on result.

## Customization & Extensibility
- Easily swap out AI models or endpoints in the backend for different try-on or feedback experiences.
- Add new garments to the store by placing images in `frontend/public/uploads/`.

## Troubleshooting
- Ensure your HuggingFace API key is set in the backend for production use.
- If you encounter CORS or file path errors, check your backend and frontend configuration.
- For merge or git workflow issues, see the project documentation or ask for help.

## License
This project is for educational and research purposes only.
