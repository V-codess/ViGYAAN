import os
import json
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
import redis.asyncio as redis
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://mongo:27017")

# --- QUOTA & RATE LIMIT SETTINGS ---
USER_MAX_REQUESTS_PER_HOUR = 8       # Max uncached AI calls per IP per hour
DAILY_GLOBAL_AI_CALL_LIMIT = 150     # Hard cap on total uncached Gemini calls/day across all users
MAX_OUTPUT_TOKENS = 180              # Enough for a complete 3-4 sentence answer, stops essays

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
    "Contact: +91-7799077701 or +91-7396747359. "
    "Strictly answer ONLY questions related to ViGYAAN Academy, admissions, courses, or UPSC/SSC/PSC prep. "
    "Politely refuse off-topic requests (coding, essays, general chat) in 1 sentence. Keep responses under 4 sentences."
)

MODELS_TO_TRY = ["gemini-3.8-flash", "gemini-3.5-flash-lite"]
executor = ThreadPoolExecutor(max_workers=4)


def _call_gemini_once(model_name: str, prompt: str, max_tokens: int) -> str:
    response = ai_client.models.generate_content(
        model=model_name,
        contents=prompt,
        config={
            "system_instruction": SYSTEM_PROMPT,
            "max_output_tokens": max_tokens,
            "temperature": 0.3,
        },
    )
    return (response.text or "").strip()


def generate_ai_text(prompt: str, max_tokens: int = MAX_OUTPUT_TOKENS) -> str:
    if not ai_client:
        return "AI Advisor (Demo Mode): Set GEMINI_API_KEY in .env to enable live Gemini responses."

    last_err: Exception | None = None
    for model_name in MODELS_TO_TRY:
        try:
            future = executor.submit(_call_gemini_once, model_name, prompt, max_tokens)
            text = future.result(timeout=8)
            if text:
                return text
        except Exception as exc:
            last_err = exc

    raise last_err or RuntimeError("Gemini generation failed")


async def check_rate_limits(client_ip: str) -> str | None:
    """Returns a friendly fallback message if rate-limited, or None if allowed."""
    try:
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        ip_key = f"vigyaan:rl:ip:{client_ip}"
        global_key = f"vigyaan:rl:global:{today_str}"

        # 1. Per-IP hourly limit
        ip_count = await redis_client.incr(ip_key)
        if ip_count == 1:
            await redis_client.expire(ip_key, 3600)
        if ip_count > USER_MAX_REQUESTS_PER_HOUR:
            return (
                "You've reached the hourly chat limit. For detailed counseling, "
                "please call or WhatsApp our advisors at +91-7799077701."
            )

        # 2. Global daily hard cap
        global_count = await redis_client.incr(global_key)
        if global_count == 1:
            await redis_client.expire(global_key, 86400)
        if global_count > DAILY_GLOBAL_AI_CALL_LIMIT:
            return (
                "Our AI Advisor is currently busy for the day! Please reach out directly "
                "to our admissions team at +91-7799077701 or +91-7396747359."
            )
    except Exception as e:
        print(f"Rate limit check warning: {e}")

    return None


async def consume_inquiry_queue():
    print("Python Background Worker listening to vigyaan:inquiry_queue...")
    while True:
        try:
            item = await redis_client.brpop("vigyaan:inquiry_queue", timeout=5)
            if item:
                _, raw_data = item
                data = json.loads(raw_data)
                prompt = (
                    f"Student {data.get('name', '')[:60]} is interested in '{data.get('programInterest', '')[:80]}'. "
                    f"Their message: '{data.get('message', '')[:300]}'. "
                    "Write a 2-sentence personalized learning roadmap recommendation."
                )
                recommendation = await asyncio.to_thread(generate_ai_text, prompt, 100)

                await db.inquiries.update_one(
                    {"_id": ObjectId(data["inquiryId"])},
                    {"$set": {"aiRecommendation": recommendation}}
                )
        except Exception as e:
            print(f"Queue worker error: {e}")
            await asyncio.sleep(2)


@asynccontextmanager
async def lifespan(app: FastAPI):
    worker_task = asyncio.create_task(consume_inquiry_queue())
    yield
    worker_task.cancel()
    executor.shutdown(wait=False)


app = FastAPI(title="Vigyaan Python AI Microservice", lifespan=lifespan)

# Restrict CORS strictly to your Vercel frontend domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://vi-gyaan.vercel.app"],
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)


class ChatRequest(BaseModel):
    message: str


@app.get("/api/chat/health")
async def health():
    return {"status": "healthy", "service": "python-ai-service"}


@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest, request: Request):
    now_iso = datetime.now(timezone.utc).isoformat()
    clean_message = req.message.strip()[:300]  # Tightened from 500 to 300 chars

    if not clean_message:
        return {
            "reply": "Please enter a question about ViGYAAN Academy.",
            "source": "validation",
            "assistantName": AI_NAME,
            "timestamp": now_iso,
        }

    # Normalize cache key (strip punctuation/extra spaces so "fees?" and "fees" share cache)
    normalized_key = "".join(ch for ch in clean_message.lower() if ch.isalnum() or ch.isspace()).strip()
    cache_key = f"vigyaan:chat:{normalized_key}"

    # 1. Check Redis Cache FIRST (cached answers don't burn rate-limit quota!)
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

    # 2. Enforce Per-IP & Global Daily Limits BEFORE calling Gemini
    forwarded_for = request.headers.get("x-forwarded-for")
    client_ip = forwarded_for.split(",")[0].strip() if forwarded_for else (request.client.host or "unknown")

    limit_msg = await check_rate_limits(client_ip)
    if limit_msg:
        return {
            "reply": limit_msg,
            "source": "rate-limited",
            "assistantName": AI_NAME,
            "timestamp": now_iso,
        }

    # 3. Generate AI Reply via Gemini
    try:
        reply = await asyncio.to_thread(generate_ai_text, f"Student Question: {clean_message}", MAX_OUTPUT_TOKENS)
    except Exception as ai_err:
        print(f"Gemini error: {repr(ai_err)}")
        return {
            "reply": f"Sorry, {AI_NAME} is temporarily unavailable. Please contact +91-7799077701.",
            "source": "error-fallback",
            "assistantName": AI_NAME,
            "timestamp": now_iso,
        }

    # 4. Cache for 24 hours (86400s) instead of 1 hour so common FAQ questions rarely hit Gemini
    try:
        if reply:
            await redis_client.setex(cache_key, 86400, reply)
    except Exception as redis_err:
        print(f"Redis write warning: {redis_err}")

    return {
        "reply": reply,
        "source": "gemini-ai",
        "assistantName": AI_NAME,
        "timestamp": now_iso,
    }