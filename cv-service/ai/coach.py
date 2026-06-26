import os
import json
import httpx
import logging
from dotenv import load_dotenv
from typing import Dict, Any

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cv-service.ai")

# Load environment variables from the server/.env file
# Root directory is two levels up from this file
base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
server_env = os.path.join(base_dir, "server", ".env")
load_dotenv(server_env)

def generate_coaching_report(summary: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sends Karate performance stats to Featherless/OpenRouter DeepSeek models
    and returns a structured coaching report.
    """
    featherless_key = os.getenv("FEATHERLESS_API_KEY")
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    
    if not featherless_key and not openrouter_key:
        logger.warning("No API keys found. Returning fallback coaching report.")
        return get_fallback_report(summary)
        
    system_prompt = (
        "You are DojoPro AI Coach, an elite sports scientist and world-class Karate master.\n"
        "Your goal is to provide a constructive, detail-oriented Karate coaching report based on numerical metrics.\n"
        "You must respond ONLY with a valid, parsable JSON object. Do NOT wrap it in markdown block quotes (no ```json). "
        "Do NOT output any preamble, extra text, or explanations outside the JSON structure. Return pure JSON.\n\n"
        "JSON SCHEMA:\n"
        "{\n"
        "  \"overall_score\": int,\n"
        "  \"technique_score\": int,\n"
        "  \"balance_score\": int,\n"
        "  \"power_score\": int,\n"
        "  \"speed_score\": int,\n"
        "  \"control_score\": int,\n"
        "  \"stability_score\": int,\n"
        "  \"timing_score\": int,\n"
        "  \"precision_score\": int,\n"
        "  \"confidence_score\": int,\n"
        "  \"strengths\": [\n"
        "     \"specific strength (e.g. 'Excellent arm extension during Oi Zuki at 2.5s')\"\n"
        "  ],\n"
        "  \"improvements\": [\n"
        "     \"specific error (e.g. 'Front stance too narrow during Zenkutsu Dachi at 4.2s')\"\n"
        "  ],\n"
        "  \"recommendations\": [\n"
        "     \"practical training drill or tip (e.g. 'Practice stance depth: perform 3 sets of 10 slow Zenkutsu Dachi transitions')\"\n"
        "  ],\n"
        "  \"overall_feedback\": \"Detailed paragraph of feedback summarizing the student's technique, performance quality, and encouragement.\"\n"
        "}"
    )
    
    user_prompt = (
        f"Here are the Karate movement metrics compiled for this video:\n"
        f"- Kata Recognized: {summary['kata_recognition']['name']} (Confidence: {summary['kata_recognition']['confidence']*100}%)\n"
        f"- Stances Detected: {', '.join(summary['detected_stances']) or 'None'}\n"
        f"- Techniques Detected: {', '.join(summary['detected_techniques']) or 'None'}\n"
        f"- Totals: {summary['stats']['total_punches']} punches, {summary['stats']['total_kicks']} kicks, {summary['stats']['total_blocks']} blocks\n"
        f"- Peak Velocity: {summary['stats']['peak_velocity']} m/s\n"
        f"- Balance Stability Sway (lower is better): {summary['stats']['avg_sway']} meters\n"
        f"- Initial Rule-Based Scores: Stability: {summary['scores']['stability']}, Power: {summary['scores']['power']}, "
        f"Precision: {summary['scores']['precision']}, Guard Position Retention: {summary['scores']['guard']}\n\n"
        f"Please analyze these statistics. Calibrate the final scores. Write detailed, helpful, and highly accurate "
        f"Karate coaching bullet points for strengths, improvements, and recommendations."
    )
    
    # Define API configurations to try
    providers = []
    
    if featherless_key:
        providers.append({
            "name": "Featherless",
            "url": "https://api.featherless.ai/v1/chat/completions",
            "key": featherless_key,
            "model": os.getenv("FEATHERLESS_MODEL", "deepseek-ai/DeepSeek-V3.2")
        })
        
    if openrouter_key:
        providers.append({
            "name": "OpenRouter",
            "url": "https://openrouter.ai/api/v1/chat/completions",
            "key": openrouter_key,
            "model": os.getenv("OPENROUTER_MODEL", "deepseek/deepseek-chat")
        })
        
    # Standard fallback if all call attempts fail
    last_error = None
    
    for provider in providers:
        try:
            logger.info(f"Attempting to generate coaching report using {provider['name']}...")
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {provider['key']}"
            }
            if provider["name"] == "OpenRouter":
                headers["HTTP-Referer"] = "https://athlix.com"
                headers["X-Title"] = "Athlix Premium"
                
            payload = {
                "model": provider["model"],
                "temperature": 0.2,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            }
            
            with httpx.Client(timeout=30.0) as client:
                response = client.post(provider["url"], headers=headers, json=payload)
                if response.status_code != 200:
                    raise Exception(f"HTTP Error {response.status_code}: {response.text}")
                    
                data = response.json()
                content = data["choices"][0]["message"]["content"].strip()
                
                # Clean up potential markdown wrapper fences if returned
                if content.startswith("```"):
                    lines = content.split("\n")
                    if lines[0].startswith("```json") or lines[0] == "```":
                        content = "\n".join(lines[1:-1]) if lines[-1] == "```" else "\n".join(lines[1:])
                    elif content.endswith("```"):
                        content = content[3:-3]
                content = content.strip()
                
                parsed_json = json.loads(content)
                logger.info(f"Coaching report generated successfully via {provider['name']}.")
                return parsed_json
                
        except Exception as e:
            logger.warning(f"Failed coaching call via {provider['name']}: {str(e)}")
            last_error = e
            
    logger.error(f"All AI providers failed. Error: {str(last_error)}. Returning fallback report.")
    return get_fallback_report(summary)

def get_fallback_report(summary: Dict[str, Any]) -> Dict[str, Any]:
    """Generates a structured local fallback coaching report if APIs are down or keys are missing."""
    scores = summary.get("scores", {})
    stats = summary.get("stats", {})
    
    overall = scores.get("overall", 80)
    stability = scores.get("stability", 80)
    precision = scores.get("precision", 80)
    power = scores.get("power", 75)
    guard = scores.get("guard", 85)
    
    # Construct fallback text lists based on metrics
    strengths = ["Good overall balance and alignment."]
    improvements = []
    recommendations = []
    
    if stability >= 80:
        strengths.append("Excellent stance stability and low trunk sway.")
    else:
        improvements.append("Excessive head sway observed. Keep center of gravity stable.")
        recommendations.append("Practice slow-motion stance drills to focus on core stability.")
        
    if power >= 75:
        strengths.append(f"Strong striking velocity (peak velocity reached {stats.get('peak_velocity', 3.0)} m/s).")
    else:
        improvements.append("Strikes lack dynamic acceleration.")
        recommendations.append("Incorporate hip snap rotation (koshi) to drive power into your punches.")
        
    if guard >= 80:
        strengths.append("Consistent guard posture maintained during stance transitions.")
    else:
        improvements.append("Hands frequently drop below hip level during transition movements.")
        recommendations.append("Focus on holding guard positions actively while changing stances.")

    if summary["kata_recognition"]["name"] != "Unknown / Freestyle":
        strengths.append(f"Correct sequence structure for {summary['kata_recognition']['name']}.")
    else:
        improvements.append("Stance sequences feel disconnected or unstructured.")
        recommendations.append("Practice traditional Kata structures (e.g. Taikyoku Shodan) to improve sequencing.")

    return {
        "overall_score": overall,
        "technique_score": int((precision + guard) / 2),
        "balance_score": stability,
        "power_score": power,
        "speed_score": int(min(99, stats.get('peak_velocity', 3.0) * 15)),
        "control_score": int((guard + stability) / 2),
        "stability_score": stability,
        "timing_score": 85,
        "precision_score": precision,
        "confidence_score": int(summary["kata_recognition"]["confidence"] * 100),
        "strengths": strengths,
        "improvements": improvements,
        "recommendations": recommendations,
        "overall_feedback": (
            f"You performed a series of movements demonstrating {summary['kata_recognition']['name']}. "
            f"Your peak action speed reached {stats.get('peak_velocity', 0)} m/s. "
            f"Overall stability was rated at {stability}%. Focus on refining your stance transistions "
            f"and maintaining your defensive guard to elevate your score to the next level."
        )
    }
