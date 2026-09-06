"""
LLM Abstraction Layer — Gemma 4 12B (primary) / Qwen3-8B (fallback)
Swap via LLM_PROVIDER env var. Agent logic never talks to provider directly.
"""
from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Any

import httpx
import structlog

from app.core.config import settings

logger = structlog.get_logger()


class ChatMessage:
    def __init__(self, role: str, content: str):
        self.role = role
        self.content = content

    def to_dict(self) -> dict:
        return {"role": self.role, "content": self.content}


class ChatResponse:
    def __init__(self, content: str, model: str, usage: dict | None = None):
        self.content = content
        self.model = model
        self.usage = usage or {}


class LLMProvider(ABC):
    """Base LLM provider interface. All agents use this — never provider-specific code."""

    @abstractmethod
    async def chat(
        self,
        messages: list[ChatMessage],
        tools: list[dict] | None = None,
        temperature: float = 0.1,
        max_tokens: int = 4096,
    ) -> ChatResponse:
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        ...


class OllamaProvider(LLMProvider):
    """Local Ollama serving — development / constrained hardware."""

    def __init__(self, base_url: str = settings.OLLAMA_BASE_URL, model: str = settings.OLLAMA_MODEL):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self._client = httpx.AsyncClient(timeout=120.0)

    async def chat(
        self,
        messages: list[ChatMessage],
        tools: list[dict] | None = None,
        temperature: float = 0.1,
        max_tokens: int = 4096,
    ) -> ChatResponse:
        current_model = self.model or settings.OLLAMA_MODEL
        payload: dict[str, Any] = {
            "model": settings.OLLAMA_MODEL,
            "messages": [m.to_dict() for m in messages],
            "options": {"temperature": temperature, "num_predict": max_tokens},
            "stream": False,
        }
        if tools:
            payload["tools"] = tools

        logger.debug("ollama.chat", model=self.model, n_messages=len(messages))
        try:
            resp = await self._client.post(f"{self.base_url}/api/chat", json=payload)
            resp.raise_for_status()
            data = resp.json()
            return ChatResponse(
                content=data["message"]["content"],
                model=self.model,
                usage=data.get("usage", {}),
            )
        except Exception as err:
            logger.warning("ollama.primary_failed", error=str(err), model=self.model, fallback="qwen2.5:1.5b")
            payload["model"] = "qwen2.5:1.5b"
            try:
                resp = await self._client.post(f"{self.base_url}/api/chat", json=payload)
                resp.raise_for_status()
                data = resp.json()
                return ChatResponse(
                    content=data["message"]["content"],
                    model="qwen2.5:1.5b",
                    usage=data.get("usage", {}),
                )
            except Exception as final_err:
                logger.error("ollama.fallback_failed", error=str(final_err))
                if settings.GEMINI_API_KEY:
                    try:
                        logger.info("ollama.gemini_fallback_trigger")
                        gemini = GeminiProvider()
                        return await gemini.chat(messages, tools=tools, temperature=temperature, max_tokens=max_tokens)
                    except Exception as gem_err:
                        logger.error("gemini.fallback_failed", error=str(gem_err))
                return ChatResponse(
                    content="Marine intelligence advisory is available based on current data feeds. Please verify local conditions with IMD/INCOIS before departure.",
                    model="fallback",
                )

    async def health_check(self) -> bool:
        try:
            r = await self._client.get(f"{self.base_url}/api/tags", timeout=5.0)
            return r.status_code == 200
        except Exception:
            return False


class VLLMProvider(LLMProvider):
    """vLLM OpenAI-compatible endpoint — production GPU serving."""

    def __init__(self, base_url: str = settings.VLLM_BASE_URL, model: str = settings.VLLM_MODEL):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self._client = httpx.AsyncClient(timeout=120.0)

    async def chat(
        self,
        messages: list[ChatMessage],
        tools: list[dict] | None = None,
        temperature: float = 0.1,
        max_tokens: int = 4096,
    ) -> ChatResponse:
        payload: dict[str, Any] = {
            "model": self.model,
            "messages": [m.to_dict() for m in messages],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if tools:
            payload["tools"] = tools

        logger.debug("vllm.chat", model=self.model, n_messages=len(messages))
        resp = await self._client.post(f"{self.base_url}/v1/chat/completions", json=payload)
        resp.raise_for_status()
        data = resp.json()
        return ChatResponse(
            content=data["choices"][0]["message"]["content"],
            model=self.model,
            usage=data.get("usage", {}),
        )

    async def health_check(self) -> bool:
        try:
            r = await self._client.get(f"{self.base_url}/health", timeout=5.0)
            return r.status_code == 200
        except Exception:
            return False


class GeminiProvider(LLMProvider):
    """Google Gemini REST API — ultra-fast cloud serving."""

    def __init__(self, api_key: str = settings.GEMINI_API_KEY, model: str = settings.GEMINI_MODEL):
        self.api_key = api_key
        self.model = model or "gemini-1.5-flash"
        self._client = httpx.AsyncClient(timeout=30.0)

    async def chat(
        self,
        messages: list[ChatMessage],
        tools: list[dict] | None = None,
        temperature: float = 0.1,
        max_tokens: int = 4096,
    ) -> ChatResponse:
        system_instruction = None
        contents = []
        for m in messages:
            if m.role == "system":
                system_instruction = {"parts": [{"text": m.content}]}
            else:
                role = "user" if m.role == "user" else "model"
                contents.append({"role": role, "parts": [{"text": m.content}]})

        payload: dict[str, Any] = {
            "contents": contents,
            "generationConfig": {"temperature": temperature, "maxOutputTokens": max_tokens},
        }
        if system_instruction:
            payload["systemInstruction"] = system_instruction

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        logger.debug("gemini.chat", model=self.model, n_messages=len(messages))
        resp = await self._client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return ChatResponse(content=text, model=self.model)

    async def health_check(self) -> bool:
        return bool(self.api_key)


def get_llm_provider() -> LLMProvider:
    """Factory: returns the configured LLM provider. Swap via LLM_PROVIDER env var."""
    provider = settings.LLM_PROVIDER.lower()
    if provider == "vllm":
        logger.info("llm.provider", provider="vLLM", model=settings.VLLM_MODEL)
        return VLLMProvider()
    elif provider == "gemini":
        logger.info("llm.provider", provider="Gemini", model=settings.GEMINI_MODEL)
        return GeminiProvider()
    logger.info("llm.provider", provider="Ollama", model=settings.OLLAMA_MODEL)
    return OllamaProvider()


# Singleton for use across agents
llm: LLMProvider = get_llm_provider()
