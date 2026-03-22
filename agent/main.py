"""
FastAPI server that exposes the Fashion AI Agent via SSE streaming.

Endpoints:
  POST /chat  — send a message, receive streamed agent response
  GET  /health — liveness check
"""

import os
import json
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from agents import Runner, RawResponsesStreamEvent, RunItemStreamEvent

from fashion_agent import fashion_agent
from db import get_pool, close_pool


# ── Lifespan: startup / shutdown ──────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: warm up DB pool
    await get_pool()
    print("✅ Agent server started — DB pool ready")
    yield
    # Shutdown
    await close_pool()
    print("🛑 Agent server stopped")


app = FastAPI(title="Fashion AI Agent", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your Next.js domain
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── POST /chat ────────────────────────────────────────────────────
@app.post("/chat")
async def chat(request: Request):
    """
    Receive a user message and stream the agent's response as SSE.

    Request body:
      { "message": "tìm áo sơ mi trắng", "history": [...] }

    Response:
      text/event-stream with JSON lines:
        {"type": "text_delta", "content": "..."}
        {"type": "tool_call", "tool": "search_products", "args": {...}}
        {"type": "tool_result", "tool": "search_products", "result": {...}}
        {"type": "done"}
    """
    body = await request.json()
    user_message: str = body.get("message", "")

    # Build input — for the first version we pass a simple string.
    # The Agents SDK also supports passing a list of messages for multi-turn;
    # history management will be added in a follow-up phase.
    input_messages = user_message

    async def event_stream():
        result = Runner.run_streamed(fashion_agent, input=input_messages)

        async for event in result.stream_events():
            # --- Text tokens from the LLM ---
            if isinstance(event, RawResponsesStreamEvent):
                data = event.data
                # data.delta contains the incremental text
                if hasattr(data, "delta") and data.delta:
                    chunk = json.dumps(
                        {"type": "text_delta", "content": data.delta},
                        ensure_ascii=False,
                    )
                    yield f"data: {chunk}\n\n"

            # --- Tool calls / results ---
            elif isinstance(event, RunItemStreamEvent):
                item = event.item
                item_type = getattr(item, "type", "")

                if item_type == "tool_call_item":
                    chunk = json.dumps(
                        {
                            "type": "tool_call",
                            "tool": getattr(item, "raw_item", {}).get("name", ""),
                            "args": getattr(item, "raw_item", {}).get("arguments", ""),
                        },
                        ensure_ascii=False,
                    )
                    yield f"data: {chunk}\n\n"

                elif item_type == "tool_call_output_item":
                    chunk = json.dumps(
                        {
                            "type": "tool_result",
                            "tool": getattr(item, "raw_item", {}).get("name", ""),
                            "result": getattr(item, "output", ""),
                        },
                        ensure_ascii=False,
                    )
                    yield f"data: {chunk}\n\n"

        # Final done event
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# ── GET /health ───────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "agent": fashion_agent.name}
