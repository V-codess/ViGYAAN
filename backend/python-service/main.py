import os
import json
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
import redis.asyncio as redis
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://mongo:27017")

ai_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
redis_client = redis.from_url(REDIS_URL, decode_responses=True)
mongo_client = AsyncIOMotorClient(MONGO_URI)
db = mongo_client["vigyaan_academy"]
AI_NAME = "Gyaana Mitra"
SYSTEM_PROMPT = (
    "You are the AI Academic Advisor for ViGYAAN Academy ('A compass to success in this competitive world'). "
    "You help students and parents with questions about our Graduate Plus Civil Services Programme "
    "(preparing students for UPSC, SSC, and PSC exams alongside their academic degree). "
    "Topics covered: Indian History, Indian Economy, Current Affairs, Science & Technology, "
    "General Mental Ability, Indian Constitution, Environment & Ecology, and Basic Computer Knowledge. "
    "Founders & Advisors: Prasad Goud V (Director), Manoj Reddy M (Director), and K R Krishna (Course Adviser). "
    "Location: Cyber Residency, Plot No.647, Ground Floor, Sri Ramnagar Colony, Block - C, Serilingampally, Rangareddy, Telangana. "
    "Contact: +91-7799077701 or +91-7396747359. Keep responses clear, encouraging, and concise."
)

MODELS_TO_TRY = ["gemini-3.8-flash", "gemini-3.5-flash-lite"]


def _call_gemini_once(model_name: str, prompt: str, max_tokens: int) -> str:
    response = ai_client.models.generate_content(
        model=model_name,
        contents=prompt,
        config={
            "max_output_tokens": max_tokens,
            "temperature": 0.4,
        },
    )
    return (response.text or "").strip()


def generate_ai_text(prompt: str, max_tokens: int = 10) -> str:
    if not ai_client:
        return "AI Advisor (Demo Mode): Set GEMINI_API_KEY in .env to enable live Gemini responses."

    last_err: Exception | None = None
    for model_name in MODELS_TO_TRY:
        pool = ThreadPoolExecutor(max_workers=1)
        try:
            future = pool.submit(_call_gemini_once, model_name, prompt, max_tokens)
            text = future.result(timeout=8)
            if text:
                return text
        except Exception as exc:
            last_err = exc
        finally:
            pool.shutdown(wait=False, cancel_futures=True)

    raise last_err or RuntimeError("Gemini generation failed")

# Background Worker: Consumes student inquiry events pushed by Node.js to Redis Queue
async def consume_inquiry_queue():
    print("Python Background Worker listening to vigyaan:inquiry_queue...")
    while True:
        try:
            # Blocking pop from Redis list (waits efficiently for new messages)
            item = await redis_client.brpop("vigyaan:inquiry_queue", timeout=5)
            if item:
                _, raw_data = item
                data = json.loads(raw_data)
                prompt = (
                    f"{SYSTEM_PROMPT}\n\n"
                    f"Student {data.get('name')} is interested in '{data.get('programInterest')}'. "
                    f"Their message: '{data.get('message')}'. "
                    "Write a 2-sentence personalized learning roadmap recommendation."
                )
                recommendation = await asyncio.to_thread(generate_ai_text, prompt, max_tokens=10)
                
                # Update the inquiry document in MongoDB with the AI recommendation
                await db.inquiries.update_one(
                    {"_id": ObjectId(data["inquiryId"])},
                    {"$set": {"aiRecommendation": recommendation}}
                )
                print(f"Processed AI recommendation for inquiry {data['inquiryId']}")
        except Exception as e:
            print(f"Queue worker error: {e}")
            await asyncio.sleep(2)

@asynccontextmanager
async def lifespan(app: FastAPI):
    worker_task = asyncio.create_task(consume_inquiry_queue())
    yield
    worker_task.cancel()

app = FastAPI(title="Vigyaan Python AI Microservice", lifespan=lifespan)

# app.add_middleware(
#     allow_origins=["*"],
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

class ChatRequest(BaseModel):
    message: str

@app.get("/api/chat/health")
async def health():
    return {"status": "healthy", "service": "python-ai-service"}

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    now_iso = datetime.now(timezone.utc).isoformat()
    clean_message = req.message.strip()[:500]
    print(f"[{now_iso}] Received chat request: {clean_message}")

    if not clean_message:
        return {
            "reply": "Please enter a question about ViGYAAN Academy.",
            "source": "validation",
            "assistantName": AI_NAME,
            "timestamp": now_iso,
        }

    cache_key = f"vigyaan:chat:{clean_message.lower()}"

    # 1. Check Redis Cache (non-fatal if Redis is temporarily unavailable)
    try:
        cached_reply = await redis_client.get(cache_key)
        if cached_reply:
            return {
                "reply": cached_reply,
                "source": "redis-cache",
                "assistantName": AI_NAME,
                "timestamp": now_iso,
            }
    except Exception as redis_err:
        print(f"Redis read warning: {redis_err}")

    # 2. Generate AI Reply via Gemini
    try:
        prompt = f"{SYSTEM_PROMPT}\n\nStudent Question: {clean_message}"
        reply = await asyncio.to_thread(generate_ai_text, prompt, 10)
    except Exception as ai_err:
        print(f"Gemini error: {repr(ai_err)}")
        return {
            "reply": f"Sorry, {AI_NAME} hit a temporary issue reaching Gemini ({type(ai_err).__name__}). Please check GEMINI_API_KEY or contact +91-7799077701.",
            "source": "error-fallback",
            "assistantName": AI_NAME,
            "timestamp": now_iso,
        }

    # 3. Store in Redis Cache (1 hour)
    try:
        if reply:
            await redis_client.setex(cache_key, 3600, reply)
    except Exception as redis_err:
        print(f"Redis write warning: {redis_err}")

    return {
        "reply": reply,
        "source": "gemini-ai",
        "assistantName": AI_NAME,
        "timestamp": now_iso,
    }