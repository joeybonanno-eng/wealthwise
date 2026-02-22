const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(error.detail || `HTTP ${res.status}`);
    }

    return res.json();
  }

  // Auth
  async register(email: string, password: string, fullName: string) {
    return this.request<{ access_token: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ access_token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe() {
    return this.request<{
      id: number;
      email: string;
      full_name: string;
      has_subscription: boolean;
    }>("/api/auth/me");
  }

  // Chat
  async sendMessage(message: string, conversationId?: number) {
    return this.request<{
      conversation_id: number;
      message: {
        id: number;
        role: string;
        content: string;
        tool_results?: Array<{ tool: string; result: Record<string, unknown> }>;
      };
    }>("/api/chat/send", {
      method: "POST",
      body: JSON.stringify({ message, conversation_id: conversationId }),
    });
  }

  async getConversations() {
    return this.request<
      Array<{
        id: number;
        title: string;
        created_at: string;
        updated_at: string;
      }>
    >("/api/chat/conversations");
  }

  async getConversation(id: number) {
    return this.request<{
      id: number;
      title: string;
      messages: Array<{
        id: number;
        role: string;
        content: string;
        tool_results?: Array<{ tool: string; result: Record<string, unknown> }>;
      }>;
    }>(`/api/chat/conversations/${id}`);
  }

  async deleteConversation(id: number) {
    return this.request(`/api/chat/conversations/${id}`, { method: "DELETE" });
  }

  // Profile
  async getProfile() {
    return this.request<{
      id: number;
      age?: number;
      annual_income?: number;
      monthly_expenses?: number;
      total_savings?: number;
      total_debt?: number;
      risk_tolerance?: string;
      investment_goals?: string;
      portfolio_description?: string;
    }>("/api/profile");
  }

  async updateProfile(data: Record<string, unknown>) {
    return this.request("/api/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Subscription
  async getSubscriptionStatus() {
    return this.request<{
      status: string;
      has_subscription: boolean;
      current_period_end?: string;
    }>("/api/subscription/status");
  }
}

export const apiClient = new ApiClient();
export default apiClient;
