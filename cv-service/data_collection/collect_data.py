import cv2
import os
from datetime import datetime

def collect_video(label: str, output_dir: str = "raw_videos"):
    os.makedirs(output_dir, exist_ok=True)
    
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("❌ Error opening webcam!")
        return
    
    print(f"🎬 Data Collection Mode: {label}")
    print("Press 's' to start recording, 'q' to quit")
    
    recording = False
    out = None
    frame_count = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        # Display info on frame
        frame_copy = frame.copy()
        cv2.putText(frame_copy, f"Label: {label}", (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
        if recording:
            cv2.putText(frame_copy, "🔴 RECORDING", (10, 70), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            cv2.putText(frame_copy, f"Frames: {frame_count}", (10, 110), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
            out.write(frame)
            frame_count += 1
        
        cv2.imshow("Athlix Data Collector", frame_copy)
        
        key = cv2.waitKey(1) & 0xFF
        if key == ord('s'):
            if not recording:
                # Start recording
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = os.path.join(output_dir, f"{label}_{timestamp}.mp4")
                fourcc = cv2.VideoWriter_fourcc(*'mp4v')
                fps = 30.0
                frame_size = (int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), 
                             int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)))
                
                out = cv2.VideoWriter(filename, fourcc, fps, frame_size)
                recording = True
                frame_count = 0
                print(f"✅ Started recording: {filename}")
            else:
                # Stop recording
                recording = False
                out.release()
                out = None
                print(f"✅ Stopped recording, total frames: {frame_count}")
        
        elif key == ord('q'):
            break
    
    cap.release()
    if out:
        out.release()
    cv2.destroyAllWindows()
    print("👋 Data collection complete!")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("❌ Usage: python collect_data.py <label>")
        print("\n📋 Example labels:")
        print("  - taikyoku_shodan")
        print("  - heian_nidan")
        print("  - kiba_dachi")
        print("  - zenkutsu_dachi")
        print("  - punch (oi_zuki)")
        print("  - kick (mae_geri)")
        print("  - block (age_uke)")
        sys.exit(1)
    
    label = sys.argv[1].strip().lower().replace(" ", "_")
    collect_video(label)
