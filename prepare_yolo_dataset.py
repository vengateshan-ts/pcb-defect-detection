import os
import glob
import shutil
import random
import xml.etree.ElementTree as ET

# Configuration
input_images_dir = "images"
input_annotations_dir = "Annotations"
output_dir = "dataset"
splits = {"train": 0.7, "val": 0.2, "test": 0.1}
classes = ["Missing_hole", "Mouse_bite", "Open_circuit", "Short", "Spur", "Spurious_copper"]

def setup_dirs(base_dir):
    for split in splits.keys():
        os.makedirs(os.path.join(base_dir, "images", split), exist_ok=True)
        os.makedirs(os.path.join(base_dir, "labels", split), exist_ok=True)

def parse_xml_and_convert(xml_path, img_width, img_height):
    tree = ET.parse(xml_path)
    root = tree.getroot()
    yolo_labels = []
    
    # Sometimes width/height in XML might be wrong, use passed dimensions if missing
    size_node = root.find("size")
    if size_node is not None:
        try:
            w_xml = float(size_node.find("width").text)
            h_xml = float(size_node.find("height").text)
            if w_xml > 0 and h_xml > 0:
                img_width, img_height = w_xml, h_xml
        except:
            pass

    for obj in root.findall("object"):
        name = obj.find("name").text
        # Map class name flexibly
        cls_id = -1
        for i, c in enumerate(classes):
            if c.lower() == name.lower():
                cls_id = i
                break
        
        if cls_id == -1: continue

        bndbox = obj.find("bndbox")
        xmin = float(bndbox.find("xmin").text)
        ymin = float(bndbox.find("ymin").text)
        xmax = float(bndbox.find("xmax").text)
        ymax = float(bndbox.find("ymax").text)

        # Normalize
        x_center = ((xmin + xmax) / 2) / img_width
        y_center = ((ymin + ymax) / 2) / img_height
        w = (xmax - xmin) / img_width
        h = (ymax - ymin) / img_height
        
        yolo_labels.append(f"{cls_id} {x_center:.6f} {y_center:.6f} {w:.6f} {h:.6f}")
        
    return yolo_labels

def main():
    print("Setting up directories...")
    setup_dirs(output_dir)
    
    # Gather all images
    dataset = []
    for cls in classes:
        cls_img_dir = os.path.join(input_images_dir, cls)
        cls_ann_dir = os.path.join(input_annotations_dir, cls)
        
        if not os.path.exists(cls_img_dir) or not os.path.exists(cls_ann_dir):
            print(f"Warning: directory missing for class {cls}")
            continue
            
        images = glob.glob(os.path.join(cls_img_dir, "*.jpg"))
        for img_path in images:
            img_filename = os.path.basename(img_path)
            xml_filename = img_filename.replace(".jpg", ".xml")
            xml_path = os.path.join(cls_ann_dir, xml_filename)
            
            if os.path.exists(xml_path):
                dataset.append((img_path, xml_path))
    
    print(f"Total labeled images found: {len(dataset)}")
    random.shuffle(dataset)
    
    # Calculate split sizes
    total = len(dataset)
    train_end = int(total * splits["train"])
    val_end = train_end + int(total * splits["val"])
    
    # Process each split
    import cv2
    
    for i, (img_path, xml_path) in enumerate(dataset):
        split = "test"
        if i < train_end:
            split = "train"
        elif i < val_end:
            split = "val"
            
        # Read image to get reliable dimensions
        img = cv2.imread(img_path)
        if img is None:
             print(f"Failed to read {img_path}")
             continue
        h, w = img.shape[:2]
        
        yolo_labels = parse_xml_and_convert(xml_path, w, h)
        
        # Copy image
        out_img_path = os.path.join(output_dir, "images", split, os.path.basename(img_path))
        shutil.copy(img_path, out_img_path)
        
        # Write label
        out_label_path = os.path.join(output_dir, "labels", split, os.path.basename(img_path).replace(".jpg", ".txt"))
        with open(out_label_path, "w") as f:
            f.write("\n".join(yolo_labels))
            
        if (i+1) % 100 == 0:
            print(f"Processed {i+1}/{total} images...")
            
    print("Generating data.yaml...")
    yaml_content = f"""path: {os.path.abspath(output_dir)}
train: images/train
val: images/val
test: images/test

names:
"""
    for i, c in enumerate(classes):
        yaml_content += f"  {i}: {c}\n"
        
    with open("data.yaml", "w") as f:
        f.write(yaml_content)
        
    print("Dataset conversion complete!")

if __name__ == "__main__":
    main()
