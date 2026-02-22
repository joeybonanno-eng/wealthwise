"""Internal tools that give Claude access to the user's WealthWise data.

These tools let the AI read/write goals, manage memories, check alerts,
and analyze portfolio allocation — all within the conversation flow.
"""

INTERNAL_TOOLS = [
    {
        "name": "get_financial_plans",
        "description": "Get the user's active financial plans including goals, timelines, and AI-generated strategies. Use this when the user asks about their goals, plans, or financial progress.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "get_user_memory",
        "description": "Retrieve what you remember about this user from past conversations — their interests, concerns, watched tickers, life events, and preferences. Use this to provide personalized, contextual advice.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "save_user_memory",
        "description": "Save an important fact about the user for future reference. Use this when the user explicitly shares something worth remembering (e.g., 'I just got a raise', 'I'm planning to buy a house next year').",
        "input_schema": {
            "type": "object",
            "properties": {
                "key": {
                    "type": "string",
                    "description": "A short snake_case identifier (e.g., 'life_events', 'income_changes', 'investment_interests')",
                },
                "value": {
                    "type": "string",
                    "description": "The information to remember",
                },
            },
            "required": ["key", "value"],
        },
    },
    {
        "name": "get_active_alerts",
        "description": "Get the user's active price alerts. Use this when the user asks about their alerts or wants to check what they're monitoring.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "get_usage_summary",
        "description": "Get the user's current usage vs limits for messages, plans, alerts, and insights. Use when the user asks about their remaining usage or subscription status.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "get_pending_insights",
        "description": "Get the user's pending AI insights — opportunities, warnings, and suggestions. Use when the user asks what their advisor recommends or what actions to take.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
]
