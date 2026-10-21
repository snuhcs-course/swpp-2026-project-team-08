# AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim
"""워크플로 테스트용 가짜 채팅 모델. 네트워크를 쓰지 않고 미리 정한 응답을 순서대로 돌려준다."""

from typing import Any

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.outputs import ChatGeneration, ChatResult
from langchain_core.runnables import Runnable, RunnableLambda
from pydantic import Field

from app.features.suggestions.workflow.schemas import SuggestionsDraft


class ScriptedChatModel(BaseChatModel):
    """`agent`가 받을 응답(`replies`)과 `compose`가 받을 초안(`drafts`)을 순서대로 돌려준다.

    `compose_inputs`에는 compose가 모델에 보낸 메시지들이 호출 순서대로 쌓인다.
    """

    replies: list[AIMessage] = Field(default_factory=list)
    drafts: list[SuggestionsDraft] = Field(default_factory=list)
    compose_inputs: list[list[BaseMessage]] = Field(default_factory=list)

    @property
    def _llm_type(self) -> str:
        return "scripted"

    def _generate(self, messages: list[BaseMessage], stop=None, run_manager=None, **kwargs: Any):
        return ChatResult(generations=[ChatGeneration(message=self.replies.pop(0))])

    def bind_tools(self, tools: Any, **kwargs: Any) -> Runnable:
        return self

    def with_structured_output(self, schema: Any, **kwargs: Any) -> Runnable:
        def next_draft(messages: list[BaseMessage]) -> SuggestionsDraft:
            self.compose_inputs.append(messages)
            return self.drafts.pop(0)

        return RunnableLambda(next_draft)
