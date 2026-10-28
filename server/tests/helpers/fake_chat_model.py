# AI-generated with Claude Sonnet 5.5, 2026-10-28, reviewed by Jaemin Kim
# Changed: add suggestion LLM workflow; fake raw responses with tool calls

"""워크플로 테스트용 가짜 채팅 모델. 네트워크를 쓰지 않고 미리 정한 응답을 순서대로 돌려준다."""

from typing import Any

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.runnables import Runnable, RunnableLambda
from pydantic import Field

from app.features.suggestions.workflow.schemas import SuggestionsDraft


class ScriptedChatModel(BaseChatModel):
    """`compose`가 받을 초안(`drafts`)을 순서대로 돌려준다.

    `compose_inputs`에는 compose가 모델에 보낸 메시지들이 호출 순서대로 쌓인다.
    `tool_calling`이 참이면 구조화 출력의 원본 응답을 도구 호출(`tool_calls`)로, 거짓이면
    JSON 텍스트로 만든다. 실제 모델이 두 방식 중 하나로 응답하는 것을 흉내 낸다.
    """

    drafts: list[SuggestionsDraft] = Field(default_factory=list)
    compose_inputs: list[list[BaseMessage]] = Field(default_factory=list)
    tool_calling: bool = True

    @property
    def _llm_type(self) -> str:
        return "scripted"

    def _generate(self, messages: list[BaseMessage], stop=None, run_manager=None, **kwargs: Any):
        raise NotImplementedError("이 가짜 모델은 구조화 출력(compose)만 지원한다")

    def _raw_message(self, draft: SuggestionsDraft) -> AIMessage:
        if self.tool_calling:
            call = {
                "name": "SuggestionsDraft",
                "args": draft.model_dump(),
                "id": f"call-{len(self.compose_inputs)}",
            }
            return AIMessage(content="", tool_calls=[call])
        return AIMessage(content=draft.model_dump_json())

    def with_structured_output(
        self, schema: Any, *, include_raw: bool = False, **kwargs: Any
    ) -> Runnable:
        def next_draft(messages: list[BaseMessage]) -> Any:
            self.compose_inputs.append(messages)
            draft = self.drafts.pop(0)
            if not include_raw:
                return draft
            return {"raw": self._raw_message(draft), "parsed": draft, "parsing_error": None}

        return RunnableLambda(next_draft)
