import json
from typing import Any, Dict, List, Optional

import anthropic
from sqlalchemy.orm import Session

from app.claude_tools.definitions import TOOLS
from app.claude_tools.executor import execute_tool
from app.config import settings
from app.models.conversation import Conversation, Message
from app.models.financial_profile import FinancialProfile
from app.models.user import User

MAX_TOOL_ITERATIONS = 5


def _build_system_prompt(user: User, profile: Optional[FinancialProfile]) -> str:
    system = """You are WealthWise, an expert AI financial advisor. You provide personalized financial guidance, market analysis, and investment insights.

Guidelines:
- Always use the available tools to look up real-time market data when discussing specific stocks or sectors
- Provide data-driven analysis with specific numbers
- Give balanced perspectives mentioning both risks and opportunities
- Tailor advice to the user's financial profile when available
- Include disclaimers that this is informational, not professional financial advice
- Be conversational and approachable while maintaining expertise
- When comparing investments, pull data for each one
- Format currency values and percentages clearly"""

    if profile:
        profile_context = "\n\nUser Financial Profile:"
        if profile.age:
            profile_context += f"\n- Age: {profile.age}"
        if profile.annual_income:
            profile_context += f"\n- Annual Income: ${profile.annual_income:,.0f}"
        if profile.monthly_expenses:
            profile_context += f"\n- Monthly Expenses: ${profile.monthly_expenses:,.0f}"
        if profile.total_savings:
            profile_context += f"\n- Total Savings: ${profile.total_savings:,.0f}"
        if profile.total_debt:
            profile_context += f"\n- Total Debt: ${profile.total_debt:,.0f}"
        if profile.risk_tolerance:
            profile_context += f"\n- Risk Tolerance: {profile.risk_tolerance}"
        if profile.investment_goals:
            profile_context += f"\n- Investment Goals: {profile.investment_goals}"
        if profile.portfolio_description:
            profile_context += f"\n- Current Portfolio: {profile.portfolio_description}"
        system += profile_context

    return system


def _convert_messages_for_api(messages: List[Message]) -> List[Dict[str, Any]]:
    api_messages = []
    for msg in messages:
        if msg.role == "user":
            api_messages.append({"role": "user", "content": msg.content})
        elif msg.role == "assistant" and msg.content:
            api_messages.append({"role": "assistant", "content": msg.content})
    return api_messages


def send_message(
    db: Session,
    user: User,
    conversation_id: Optional[int],
    user_message: str,
) -> Dict[str, Any]:
    # Get or create conversation
    if conversation_id:
        conversation = db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.user_id == user.id,
        ).first()
        if not conversation:
            raise ValueError("Conversation not found")
    else:
        conversation = Conversation(user_id=user.id, title=user_message[:100])
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # Save user message
    user_msg = Message(conversation_id=conversation.id, role="user", content=user_message)
    db.add(user_msg)
    db.commit()

    # Get user's financial profile
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == user.id).first()

    # Build messages for Claude
    history = db.query(Message).filter(
        Message.conversation_id == conversation.id,
    ).order_by(Message.created_at).all()

    api_messages = _convert_messages_for_api(history)
    system_prompt = _build_system_prompt(user, profile)

    # Claude tool loop
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    all_tool_calls = []
    all_tool_results = []
    final_text = ""

    for _ in range(MAX_TOOL_ITERATIONS):
        response = client.messages.create(
            model=settings.CLAUDE_MODEL,
            max_tokens=4096,
            system=system_prompt,
            tools=TOOLS,
            messages=api_messages,
        )

        # Collect text and tool use blocks
        text_parts = []
        tool_use_blocks = []
        for block in response.content:
            if block.type == "text":
                text_parts.append(block.text)
            elif block.type == "tool_use":
                tool_use_blocks.append(block)

        if text_parts:
            final_text = "\n".join(text_parts)

        # If no tool use, we're done
        if not tool_use_blocks:
            break

        # Execute tools and build response
        assistant_content = []
        tool_result_content = []

        for block in response.content:
            if block.type == "text":
                assistant_content.append({"type": "text", "text": block.text})
            elif block.type == "tool_use":
                assistant_content.append({
                    "type": "tool_use",
                    "id": block.id,
                    "name": block.name,
                    "input": block.input,
                })
                result = execute_tool(block.name, block.input)
                tool_result_content.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result,
                })
                all_tool_calls.append({"name": block.name, "input": block.input})
                all_tool_results.append({"tool": block.name, "result": json.loads(result)})

        # Add to messages for next iteration
        api_messages.append({"role": "assistant", "content": assistant_content})
        api_messages.append({"role": "user", "content": tool_result_content})

    # Save assistant message
    assistant_msg = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=final_text,
        tool_calls=json.dumps(all_tool_calls) if all_tool_calls else None,
        tool_results=json.dumps(all_tool_results) if all_tool_results else None,
    )
    db.add(assistant_msg)

    # Update conversation title from first message
    if len(history) <= 1:
        conversation.title = user_message[:100]

    db.commit()

    return {
        "conversation_id": conversation.id,
        "message": {
            "id": assistant_msg.id,
            "role": "assistant",
            "content": final_text,
            "tool_results": all_tool_results if all_tool_results else None,
        },
    }
