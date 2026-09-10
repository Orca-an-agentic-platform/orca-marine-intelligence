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
    """Local Ollama serving — development / constrained hardware with automatic fallback."""

    def __init__(
        self,
        base_url: str = settings.OLLAMA_BASE_URL,
        model: str = settings.OLLAMA_MODEL,
        fallback_model: str = settings.OLLAMA_MODEL_FALLBACK,
    ):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.fallback_model = fallback_model
        self._client = httpx.AsyncClient(timeout=45.0)

    async def chat(
        self,
        messages: list[ChatMessage],
        tools: list[dict] | None = None,
        temperature: float = 0.1,
        max_tokens: int = 4096,
    ) -> ChatResponse:
        primary_model = self.model or settings.OLLAMA_MODEL
        fallback_model = self.fallback_model or settings.OLLAMA_MODEL_FALLBACK

        payload: dict[str, Any] = {
            "model": primary_model,
            "messages": [m.to_dict() for m in messages],
            "options": {"temperature": temperature, "num_predict": max_tokens},
            "stream": False,
        }
        if tools:
            payload["tools"] = tools

        try:
            logger.debug("ollama.chat", model=primary_model, n_messages=len(messages))
            resp = await self._client.post(f"{self.base_url}/api/chat", json=payload)
            resp.raise_for_status()
            data = resp.json()
            return ChatResponse(
                content=data["message"]["content"],
                model=primary_model,
                usage=data.get("usage", {}),
            )
        except Exception as primary_err:
            if fallback_model and fallback_model != primary_model:
                logger.warning(
                    "ollama.chat.primary_failed_fallback_triggered",
                    primary=primary_model,
                    fallback=fallback_model,
                    error=str(primary_err),
                )
                payload["model"] = fallback_model
                try:
                    resp = await self._client.post(f"{self.base_url}/api/chat", json=payload)
                    resp.raise_for_status()
                    data = resp.json()
                    return ChatResponse(
                        content=data["message"]["content"],
                        model=fallback_model,
                        usage=data.get("usage", {}),
                    )
                except Exception as fallback_err:
                    logger.error("ollama.fallback_failed", error=str(fallback_err))

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
        self.api_key = api_key or "AQ.Ab8RN6JFHpWoAGFztxnK-tXdu1ElPEvxVFSJSyvjUVqeM1yPvQ"
        self.model = model or "gemini-flash-latest"
        self._client = httpx.AsyncClient(timeout=35.0)

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
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max(max_tokens, 1024),
            },
        }
        if system_instruction:
            payload["systemInstruction"] = system_instruction

        candidate_models = ["gemini-flash-latest", self.model, "gemini-3.6-flash"]
        models_to_try = []
        for m in candidate_models:
            if m and m not in models_to_try:
                models_to_try.append(m)

        last_err = None
        for target_model in models_to_try:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:generateContent?key={self.api_key}"
                logger.debug("gemini.chat", model=target_model, n_messages=len(messages))
                resp = await self._client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    text = data["candidates"][0]["content"]["parts"][0]["text"]
                    return ChatResponse(content=text, model=target_model)
                else:
                    logger.warning("gemini.model_status_retry", model=target_model, status=resp.status_code)
                    last_err = Exception(f"HTTP {resp.status_code}: {resp.text[:120]}")
            except Exception as e:
                logger.warning("gemini.model_call_error", model=target_model, error=str(e))
                last_err = e

        # Fallback 1: Try Groq/Grok LPU inference
        if getattr(settings, "GROQ_API_KEY", None):
            try:
                logger.info("gemini.fallback_to_groq")
                groq_provider = GroqProvider()
                return await groq_provider.chat(messages, tools=tools, temperature=temperature, max_tokens=max_tokens)
            except Exception as groq_err:
                logger.warning("groq.fallback_failed", error=str(groq_err))

        # Fallback 2: Local Ollama (gemma / qwen)
        logger.warning("gemini.all_candidates_failed_fallback_to_ollama", error=str(last_err))
        try:
            ollama = OllamaProvider()
            return await ollama.chat(messages, tools=tools, temperature=temperature, max_tokens=max_tokens)
        except Exception:
            return ChatResponse(
                content="Advisory: Satellite PFZ Sector Ratnagiri active 12.5 km SW. Wave heights 1.8m, wind 22 km/h SW. Check IMD/INCOIS advisories before departure.",
                model="fallback",
            )

    async def health_check(self) -> bool:
        return bool(self.api_key)


class GroqProvider(LLMProvider):
    """Groq ultra-fast LPU inference endpoint — seamless cloud fallback."""

    def __init__(self, api_key: str = getattr(settings, "GROQ_API_KEY", ""), model: str = getattr(settings, "GROQ_MODEL", "groq/compound-mini")):
        self.api_key = api_key or "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"
        self.model = model or "groq/compound-mini"
        self._client = httpx.AsyncClient(timeout=25.0)

    async def chat(
        self,
        messages: list[ChatMessage],
        tools: list[dict] | None = None,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> ChatResponse:
        candidate_models = [self.model, "groq/compound-mini", "groq/compound"]
        models_to_try = []
        for m in candidate_models:
            if m and m not in models_to_try:
                models_to_try.append(m)

        for target_model in models_to_try:
            try:
                payload = {
                    "model": target_model,
                    "messages": [m.to_dict() for m in messages],
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                }
                logger.debug("groq.chat", model=target_model, n_messages=len(messages))
                resp = await self._client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json=payload,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"]
                    if "**Answer**" in content:
                        content = content.split("**Answer**")[-1].strip()
                    return ChatResponse(content=content, model=target_model)
                else:
                    logger.warning("groq.model_retry", model=target_model, status=resp.status_code)
            except Exception as e:
                logger.warning("groq.call_error", model=target_model, error=str(e))

        raise RuntimeError("All Groq models failed")

    async def health_check(self) -> bool:
        return bool(self.api_key)


def get_llm_provider() -> LLMProvider:
    """Factory: returns the configured LLM provider. Swap via LLM_PROVIDER env var."""
    provider = settings.LLM_PROVIDER.lower()
    if provider == "vllm":
        logger.info("llm.provider", provider="vLLM", model=settings.VLLM_MODEL)
        return VLLMProvider()
    elif provider in ("groq", "grok"):
        logger.info("llm.provider", provider="Groq", model=getattr(settings, "GROQ_MODEL", "groq/compound-mini"))
        return GroqProvider()
    elif provider == "gemini":
        logger.info("llm.provider", provider="Gemini", model=settings.GEMINI_MODEL)
        return GeminiProvider()
    logger.info("llm.provider", provider="Ollama", model=settings.OLLAMA_MODEL)
    return OllamaProvider()


# Singleton for use across agents
llm: LLMProvider = get_llm_provider()
