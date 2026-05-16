from ultralytics import YOLO

def main():
    print("Loading YOLOv8 small model...")
    # Load a pretrained model (recommended for training)
    model = YOLO("yolov8s.pt")
    
    print("Starting training process...")
    # Train the model
    # Note: imgsz=1024 is critical for small object detection on large PCBs
    # Adjust batch size based on available GPU memory
    results = model.train(
        data="data.yaml",
        epochs=50,
        imgsz=1024,
        batch=4, # Lower batch size to manage memory for large 1024 images
        patience=15, # Early stopping
        name="pcb_defect_detection", # Output folder name in runs/detect/
        save=True,
        workers=4 # Adjust based on CPU cores
    )
    
    # Evaluate the model on the validation set
    print("Evaluating model...")
    metrics = model.val()
    
    print("Training complete. Best model saved in runs/detect/pcb_defect_detection/weights/best.pt")

if __name__ == '__main__':
    main()
