import os
import io
import base64
from fastapi import FastAPI, File, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, RedirectResponse
import cv2
import numpy as np
from ultralytics import YOLO

app = FastAPI(title="PCB Defect Detection System")

@app.get("/")
def root():
    return RedirectResponse(url="/ui/")

# Ensure static folder exists
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/ui", StaticFiles(directory="static", html=True), name="ui")

# Load compiled model (will load best.pt from standard runs path after training)
MODEL_PATH = "runs/detect/pcb_defect_detection4/weights/best.pt"
model = None

@app.on_event("startup")
def load_model():
    global model
    if os.path.exists(MODEL_PATH):
        print(f"Loading YOLO model from {MODEL_PATH}...")
        model = YOLO(MODEL_PATH)
    else:
        print(f"Warning: Model not found at {MODEL_PATH}. Prediction will fail until training is complete.")

@app.post("/predict")
async def predict_defect(file: UploadFile = File(...)):
    if model is None:
        return JSONResponse({"error": "Model holds no weights. Has training finished?"}, status_code=503)

    # Read image
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return JSONResponse({"error": "Invalid image file uploaded."}, status_code=400)

    # Inference (tuning for small objects assumes imgsz=1024 or higher used during training and testing)
    results = model.predict(img, imgsz=1024, conf=0.25)

    # Process results
    res = results[0]
    
    # Extract defect counts and details
    boxes = res.boxes
    defect_summary = {}
    detected_details = []
    
    for box in boxes:
        cls_id = int(box.cls[0].item())
        conf = float(box.conf[0].item())
        cls_name = model.names[cls_id]
        
        # update summary
        if cls_name in defect_summary:
            defect_summary[cls_name] += 1
        else:
            defect_summary[cls_name] = 1
            
        detected_details.append({
            "class": cls_name,
            "confidence": conf
        })

    # Render annotated image with custom thick red boxes for better visual emphasis
    annotated_img = img.copy()
    if len(boxes) > 0:
        for box in boxes:
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            
            # Draw glowing red bounding box (BGR format)
            cv2.rectangle(annotated_img, (int(x1), int(y1)), (int(x2), int(y2)), (0, 0, 255), 4)
            
            # Draw an outer stroke for a subtle glow effect
            cv2.rectangle(annotated_img, (int(x1)-2, int(y1)-2), (int(x2)+2, int(y2)+2), (0, 0, 150), 2)
            
            # Draw label
            cls_id = int(box.cls[0].item())
            cls_name = model.names[cls_id]
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 1.0
            thickness = 2
            text_size, _ = cv2.getTextSize(cls_name, font, font_scale, thickness)
            
            # Label background
            cv2.rectangle(annotated_img, (int(x1), int(y1) - text_size[1] - 10), (int(x1) + text_size[0], int(y1)), (0, 0, 255), -1)
            # Label text
            cv2.putText(annotated_img, cls_name, (int(x1), int(y1) - 5), font, font_scale, (255, 255, 255), thickness)
    # Encode for frontend
    _, buffer = cv2.imencode('.jpg', annotated_img)
    base64_image = base64.b64encode(buffer).decode('utf-8')

    response_data = {
        "status": "Defective" if len(boxes) > 0 else "Normal",
        "total_defects": len(boxes),
        "defect_summary": defect_summary,
        "details": detected_details,
        "annotated_image": f"data:image/jpeg;base64,{base64_image}"
    }

    return JSONResponse(response_data)
