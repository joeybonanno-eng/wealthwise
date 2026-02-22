import json
from typing import Any, Dict

from app.services import market_data_service


def execute_tool(tool_name: str, tool_input: Dict[str, Any]) -> str:
    try:
        if tool_name == "get_stock_quote":
            result = market_data_service.get_stock_quote(tool_input["symbol"])
        elif tool_name == "get_price_history":
            result = market_data_service.get_price_history(
                tool_input["symbol"],
                tool_input.get("period", "1mo"),
                tool_input.get("interval", "1d"),
            )
        elif tool_name == "get_company_info":
            result = market_data_service.get_company_info(tool_input["symbol"])
        elif tool_name == "get_sector_performance":
            result = market_data_service.get_sector_performance()
        else:
            return json.dumps({"error": f"Unknown tool: {tool_name}"})
        return json.dumps(result, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})
