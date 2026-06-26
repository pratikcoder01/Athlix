import math
from typing import List, Dict, Any

class KarateRuleEngine:
    def __init__(self):
        pass

    def analyze_movement(self, video_data: Dict[str, Any]) -> Dict[str, Any]:
        frames = video_data.get("frames", [])
        fps = video_data.get("fps", 30.0)
        
        # 1. Classify each frame
        raw_stances = []
        raw_techniques = []
        
        for f in frames:
            if not f["landmarks"]:
                raw_stances.append("Unknown")
                raw_techniques.append("None")
                continue
                
            metrics = f.get("metrics", {})
            wl = f["world_landmarks"]
            
            # Helper to get world landmark points
            def pt(idx):
                return [wl[idx]["x"], wl[idx]["y"], wl[idx]["z"]]
            
            # Check if left or right foot is forward
            # In world coordinates, negative y is UP.
            # z points forward relative to hip. Let's use z for depth.
            # If z is negative, it is closer to camera. If z is positive, it is further.
            # Usually we use x-z plane for stance detection.
            # Left hip (23), Right hip (24), Left ankle (27), Right ankle (28)
            l_ankle = pt(27)
            r_ankle = pt(28)
            l_shoulder = pt(11)
            r_shoulder = pt(12)
            l_hip = pt(23)
            r_hip = pt(24)
            
            # Stance dimensions
            feet_distance = math.sqrt((l_ankle[0] - r_ankle[0])**2 + (l_ankle[1] - r_ankle[1])**2 + (l_ankle[2] - r_ankle[2])**2)
            shoulder_width = math.sqrt((l_shoulder[0] - r_shoulder[0])**2 + (l_shoulder[1] - r_shoulder[1])**2 + (l_shoulder[2] - r_shoulder[2])**2)
            
            feet_to_shoulder_ratio = feet_distance / max(0.1, shoulder_width)
            
            # Knee angles
            l_knee = metrics["angles"]["left_knee"]
            r_knee = metrics["angles"]["right_knee"]
            
            # Stance Classification Rules
            stance = "Unknown"
            
            # Identify forward foot (in 2D or 3D, let's use normalized y coordinate or world z coordinate)
            # MediaPipe normalized landmarks coordinates: y points down, x points right.
            # Let's check which ankle is lower in normalized frame (which means closer/forward)
            # or check world z.
            nl = f["landmarks"]
            l_ankle_norm_y = nl[27]["y"]
            r_ankle_norm_y = nl[28]["y"]
            
            left_fwd = l_ankle_norm_y > r_ankle_norm_y + 0.05
            right_fwd = r_ankle_norm_y > l_ankle_norm_y + 0.05
            
            # Stance checks
            if feet_to_shoulder_ratio < 1.3:
                # Narrow stances
                if l_knee > 165 and r_knee > 165:
                    stance = "Natural Stance (Heiko Dachi)"
                elif (l_knee < 135 and r_knee > 155 and l_ankle_norm_y > r_ankle_norm_y) or \
                     (r_knee < 135 and l_knee > 155 and r_ankle_norm_y > l_ankle_norm_y):
                    stance = "Cat Stance (Neko Ashi Dachi)"
                else:
                    stance = "Natural Stance (Heiko Dachi)"
            elif feet_to_shoulder_ratio >= 1.3:
                # Wide stances
                # 1. Horse Stance (Kiba Dachi): feet parallel, knees bent, centered weight
                if l_knee < 135 and r_knee < 135 and abs(l_knee - r_knee) < 25:
                    # Check if toes point out (Shiko Dachi) or parallel (Kiba Dachi)
                    # For simplicity, we call it Horse Stance (Kiba Dachi)
                    stance = "Horse Stance (Kiba Dachi)"
                # 2. Front Stance (Zenkutsu Dachi): one straight, one bent
                elif l_knee < 130 and r_knee > 150:
                    stance = "Left Front Stance (Zenkutsu Dachi)"
                elif r_knee < 130 and l_knee > 150:
                    stance = "Right Front Stance (Zenkutsu Dachi)"
                # 3. Back Stance (Kokutsu Dachi): weight on back leg, back knee bent, front leg extended
                elif l_knee > 145 and r_knee < 135:
                    # Left leg forward, right leg bent (back leg)
                    stance = "Left Back Stance (Kokutsu Dachi)"
                elif r_knee > 145 and l_knee < 135:
                    # Right leg forward, left leg bent (back leg)
                    stance = "Right Back Stance (Kokutsu Dachi)"
                else:
                    # Fallback to general stance
                    stance = "Natural Stance (Heiko Dachi)"
            
            raw_stances.append(stance)
            
            # Technique Detection Rules
            tech = "None"
            
            l_wrist_vel = metrics["velocities"]["left_wrist"]
            r_wrist_vel = metrics["velocities"]["right_wrist"]
            l_ankle_vel = metrics["velocities"]["left_ankle"]
            r_ankle_vel = metrics["velocities"]["right_ankle"]
            
            l_elbow = metrics["angles"]["left_elbow"]
            r_elbow = metrics["angles"]["right_elbow"]
            
            # Hands tracking (Normalized y: negative is UP, positive is DOWN)
            l_wrist_y = pt(15)[1]
            r_wrist_y = pt(16)[1]
            l_shoulder_y = pt(11)[1]
            r_shoulder_y = pt(12)[1]
            l_hip_y = pt(23)[1]
            r_hip_y = pt(24)[1]
            head_y = pt(0)[1] # Nose
            
            # Kicks (look for high ankle speed)
            if l_ankle_vel > 3.0 and l_ankle[1] < l_hip[1]: # Foot lifts above hip
                # Front Kick (Mae Geri): foot extended forward
                # Roundhouse Kick (Mawashi Geri): lateral movement
                if abs(l_ankle[0] - r_ankle[0]) > 0.4:
                    tech = "Left Roundhouse Kick (Mawashi Geri)"
                else:
                    tech = "Left Front Kick (Mae Geri)"
            elif r_ankle_vel > 3.0 and r_ankle[1] < r_hip[1]:
                if abs(r_ankle[0] - l_ankle[0]) > 0.4:
                    tech = "Right Roundhouse Kick (Mawashi Geri)"
                else:
                    tech = "Right Front Kick (Mae Geri)"
            
            # Punches (look for high wrist speed and elbow extension)
            elif l_wrist_vel > 2.5 and l_elbow > 150:
                # Lunge vs Reverse punch based on forward stance
                if "Left Front Stance" in stance:
                    tech = "Left Punch (Oi Zuki)"
                else:
                    tech = "Left Punch (Gyaku Zuki)"
            elif r_wrist_vel > 2.5 and r_elbow > 150:
                if "Right Front Stance" in stance:
                    tech = "Right Punch (Oi Zuki)"
                else:
                    tech = "Right Punch (Gyaku Zuki)"
                    
            # Blocks
            # 1. Rising Block (Age Uke): hand above head
            elif l_wrist_y < head_y and l_wrist_vel > 1.8:
                tech = "Left Rising Block (Age Uke)"
            elif r_wrist_y < head_y and r_wrist_vel > 1.8:
                tech = "Right Rising Block (Age Uke)"
            # 2. Downward Block (Gedan Barai): sweeping down to hip level
            elif l_wrist_y > l_hip_y and l_wrist_vel > 1.8 and l_elbow > 140:
                tech = "Left Downward Block (Gedan Barai)"
            elif r_wrist_y > r_hip_y and r_wrist_vel > 1.8 and r_elbow > 140:
                tech = "Right Downward Block (Gedan Barai)"
                
            raw_techniques.append(tech)

        # 2. Smooth stances & techniques (running majority vote to eliminate frame-flickering)
        def smooth_sequence(seq: List[str], window_size: int = 7) -> List[str]:
            smoothed = []
            half = window_size // 2
            for i in range(len(seq)):
                start = max(0, i - half)
                end = min(len(seq), i + half + 1)
                window = seq[start:end]
                # Find mode
                mode = max(set(window), key=window.count)
                smoothed.append(mode)
            return smoothed

        smoothed_stances = smooth_sequence(raw_stances, window_size=9)
        smoothed_techniques = smooth_sequence(raw_techniques, window_size=7)

        # Update video frame classifications
        for i, f in enumerate(frames):
            f["stance"] = smoothed_stances[i]
            f["technique"] = smoothed_techniques[i]

        # 3. Create contiguous segments (start_time, end_time, name)
        def create_segments(seq: List[str], prefix: str = "") -> List[Dict[str, Any]]:
            segments = []
            if not seq:
                return segments
                
            current_name = seq[0]
            start_idx = 0
            
            for i in range(1, len(seq)):
                if seq[i] != current_name:
                    # Close current segment
                    if current_name != "Unknown" and current_name != "None":
                        start_time = round(start_idx / fps, 2)
                        end_time = round(i / fps, 2)
                        if end_time - start_time >= 0.25: # filter out very short glitches
                            segments.append({
                                "id": f"{prefix}_{start_idx}",
                                "name": current_name,
                                "start_time": start_time,
                                "end_time": end_time,
                                "duration": round(end_time - start_time, 2)
                            })
                    current_name = seq[i]
                    start_idx = i
                    
            # Close the last one
            if current_name != "Unknown" and current_name != "None":
                start_time = round(start_idx / fps, 2)
                end_time = round(len(seq) / fps, 2)
                if end_time - start_time >= 0.25:
                    segments.append({
                        "id": f"{prefix}_{start_idx}",
                        "name": current_name,
                        "start_time": start_time,
                        "end_time": end_time,
                        "duration": round(end_time - start_time, 2)
                    })
            return segments

        stance_segments = create_segments(smoothed_stances, "stance")
        technique_segments = create_segments(smoothed_techniques, "tech")

        # 4. Score movement metrics
        # - Stability: based on balance sway variance. Lower sway = higher stability
        sways = [f["metrics"]["balance_sway"] for f in frames if f["metrics"]]
        avg_sway = sum(sways) / len(sways) if sways else 0.5
        stability_score = max(0, min(100, int(100 - (avg_sway * 300))))
        
        # - Guard position: check how many times hands drop below hip when not performing techniques
        guard_drops = 0
        total_standing_frames = 0
        for f in frames:
            if not f["landmarks"]: continue
            wl = f["world_landmarks"]
            # Hand positions relative to hips
            # MediaPipe world coordinates: y points down. If wrist y > hip y, hand is below hip.
            l_wrist_y = wl[15]["y"]
            r_wrist_y = wl[16]["y"]
            l_hip_y = wl[23]["y"]
            r_hip_y = wl[24]["y"]
            
            if f["technique"] == "None":
                total_standing_frames += 1
                if l_wrist_y > l_hip_y or r_wrist_y > r_hip_y:
                    guard_drops += 1
                    
        guard_score = 100
        if total_standing_frames > 0:
            guard_score = max(0, min(100, int(100 - (guard_drops / total_standing_frames) * 100)))

        # - Power estimate: based on peak speeds of punches/kicks
        speeds = []
        for f in frames:
            if not f["metrics"]: continue
            vels = f["metrics"]["velocities"]
            speeds.append(max(vels["left_wrist"], vels["right_wrist"], vels["left_ankle"], vels["right_ankle"]))
        peak_speed = max(speeds) if speeds else 1.0
        power_score = max(30, min(98, int(30 + (peak_speed * 12))))
        
        # - Precision: check stance angles correctness
        precisions = []
        for f in frames:
            if not f["metrics"]: continue
            s = f["stance"]
            l_knee = f["metrics"]["angles"]["left_knee"]
            r_knee = f["metrics"]["angles"]["right_knee"]
            if "Front Stance" in s:
                # In front stance, front knee should be bent (90-120), back leg straight (>155)
                front_leg_bend = l_knee if "Left" in s else r_knee
                back_leg_straight = r_knee if "Left" in s else l_knee
                score = 100 - abs(front_leg_bend - 105) - max(0, 160 - back_leg_straight)
                precisions.append(max(0, min(100, score)))
            elif "Horse Stance" in s:
                # Both knees bent 90-120
                score = 100 - abs(l_knee - 105) - abs(r_knee - 105)
                precisions.append(max(0, min(100, score)))
                
        precision_score = int(sum(precisions) / len(precisions)) if precisions else 80

        # Stance / Technique Timelines count
        stances_seen = list(set([seg["name"] for seg in stance_segments]))
        techs_seen = list(set([seg["name"] for seg in technique_segments]))

        # 5. Kata Recognition
        # Recognizes common Kata sequences
        # e.g., Taikyoku Shodan or Heian Shodan usually starts with: Downward Block (Gedan Barai) -> Front Stance Punch (Oi Zuki) -> Downward Block -> etc.
        kata_name = "Custom / Free Sparring"
        kata_confidence = 0.0
        
        tech_sequence = [seg["name"] for seg in technique_segments]
        
        if len(tech_sequence) >= 3:
            # Match Heian Shodan/Taikyoku Shodan (Gedan Barai followed by Oi Zuki)
            has_gedan = any("Downward Block" in t for t in tech_sequence)
            has_oizuki = any("Oi Zuki" in t for t in tech_sequence)
            has_kicks = any("Kick" in t for t in tech_sequence)
            
            if has_gedan and has_oizuki:
                if has_kicks:
                    kata_name = "Heian Yondan"
                    kata_confidence = 0.65
                else:
                    kata_name = "Taikyoku Shodan"
                    kata_confidence = 0.88
            elif has_kicks:
                kata_name = "Heian Nidan"
                kata_confidence = 0.55
        
        if kata_confidence < 0.5:
            kata_name = "Unknown / Freestyle"
            kata_confidence = 0.30

        return {
            "stance_segments": stance_segments,
            "technique_segments": technique_segments,
            "detected_stances": stances_seen,
            "detected_techniques": techs_seen,
            "kata_recognition": {
                "name": kata_name,
                "confidence": round(kata_confidence, 2)
            },
            "scores": {
                "stability": stability_score,
                "guard": guard_score,
                "power": power_score,
                "precision": precision_score,
                "timing": 85,  # Estimated
                "overall": int((stability_score + guard_score + power_score + precision_score + 85) / 5)
            },
            "stats": {
                "peak_velocity": round(peak_speed, 2),
                "avg_sway": round(avg_sway, 3),
                "total_punches": sum(1 for t in technique_segments if "Punch" in t["name"]),
                "total_kicks": sum(1 for t in technique_segments if "Kick" in t["name"]),
                "total_blocks": sum(1 for t in technique_segments if "Block" in t["name"])
            }
        }
