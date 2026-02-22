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
        # Communication level instructions
        comm_level = getattr(profile, "communication_level", None) or "college"
        comm_instructions = {
            "elementary": "\n\nCommunication Style: Explain everything using very simple words and everyday analogies. Avoid all financial jargon. Use comparisons to things like piggy banks, lemonade stands, and allowances. Keep sentences short and friendly.",
            "high_school": "\n\nCommunication Style: Use plain, straightforward language. When you must use a financial term, always explain it briefly in parentheses. Keep explanations clear and relatable to everyday life.",
            "college": "\n\nCommunication Style: Use standard financial terminology. Provide thorough analysis with proper context. You can assume familiarity with common investment concepts like diversification, market cap, and P/E ratios.",
            "phd": "\n\nCommunication Style: Use advanced financial terminology and quantitative analysis freely. Reference academic concepts like CAPM, Sharpe ratio, efficient frontier, Monte Carlo simulations, and modern portfolio theory. Include statistical measures and mathematical frameworks where relevant.",
        }
        system += comm_instructions.get(comm_level, comm_instructions["college"])

        # Advisor tone instructions
        tone = getattr(profile, "advisor_tone", None) or "professional"
        tone_instructions = {
            "friendly": "\n\nAdvisor Tone: Be warm, encouraging, and casual. Use positive reinforcement. Celebrate good financial decisions. Be supportive and optimistic while still being honest about risks.",
            "professional": "\n\nAdvisor Tone: Be formal, data-driven, and precise. Focus on facts and figures. Maintain a polished, authoritative voice. Present analysis in a structured, methodical way.",
            "mentor": "\n\nAdvisor Tone: Be educational and use a Socratic approach. Ask thought-provoking questions. Explain the 'why' behind concepts. Help the user build their own financial literacy and decision-making skills.",
            "casual": "\n\nAdvisor Tone: Be relaxed, conversational, and occasionally humorous. Use everyday language and pop culture references. Make finance feel approachable and fun, not intimidating.",
        }
        system += tone_instructions.get(tone, tone_instructions["professional"])

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
        if getattr(profile, "experience_level", None):
            profile_context += f"\n- Experience Level: {profile.experience_level}"
        if getattr(profile, "investment_timeline", None):
            profile_context += f"\n- Investment Timeline: {profile.investment_timeline}"
        if getattr(profile, "interested_topics", None):
            profile_context += f"\n- Interested Topics: {profile.interested_topics}"
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


def generate_financial_plan(db: Session, user: User, plan_data: Dict[str, Any]) -> str:
    """Generate a comprehensive financial plan using Claude based on wizard answers."""
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == user.id).first()

    system_prompt = """You are a certified financial planner. Based on the following user data, create a comprehensive, actionable financial plan in markdown format.

Structure your plan with these sections:
1. **Executive Summary** — A brief overview of the plan
2. **Current Financial Snapshot** — Summary of where the user stands
3. **Goals & Timeline** — Clear articulation of the target
4. **Recommended Strategy** — Step-by-step action items
5. **Monthly Budget Allocation** — Suggested breakdown of income
6. **Investment Recommendations** — Specific allocation suggestions based on risk tolerance
7. **Milestones & Checkpoints** — Quarterly or yearly targets to track progress
8. **Risks & Considerations** — What could go wrong and how to mitigate
9. **Next Steps** — Immediate actions to take this week

Be specific with dollar amounts and percentages where possible. Include disclaimers that this is informational guidance, not professional financial advice."""

    # Build user context from wizard data and profile
    user_context = f"**Plan Type:** {plan_data.get('plan_type', 'General')}\n"
    user_context += f"**Timeline:** {plan_data.get('timeline', 'Not specified')}\n"

    if plan_data.get("custom_goal"):
        user_context += f"**Custom Goal:** {plan_data['custom_goal']}\n"

    # Financial details from wizard
    finances = plan_data.get("finances", {})
    if finances:
        user_context += f"\n**Financial Details:**\n"
        if finances.get("income"):
            user_context += f"- Annual Income: ${finances['income']:,.0f}\n"
        if finances.get("expenses"):
            user_context += f"- Monthly Expenses: ${finances['expenses']:,.0f}\n"
        if finances.get("savings"):
            user_context += f"- Total Savings: ${finances['savings']:,.0f}\n"
        if finances.get("debt"):
            user_context += f"- Total Debt: ${finances['debt']:,.0f}\n"

    # Risk & priorities from wizard
    if plan_data.get("risk_tolerance"):
        user_context += f"\n**Risk Tolerance:** {plan_data['risk_tolerance']}\n"
    if plan_data.get("priority"):
        user_context += f"**Priority:** {plan_data['priority']}\n"

    # Supplement with profile data if available
    if profile:
        user_context += f"\n**Profile Data:**\n"
        if profile.age:
            user_context += f"- Age: {profile.age}\n"
        if profile.investment_goals:
            user_context += f"- Investment Goals: {profile.investment_goals}\n"
        if profile.portfolio_description:
            user_context += f"- Current Portfolio: {profile.portfolio_description}\n"
        if getattr(profile, "experience_level", None):
            user_context += f"- Experience Level: {profile.experience_level}\n"

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    response = client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=4096,
        system=system_prompt,
        messages=[{"role": "user", "content": f"Please create a financial plan based on this information:\n\n{user_context}"}],
    )

    return response.content[0].text


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
