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
      experience_level?: string;
      investment_timeline?: string;
      interested_topics?: string;
      communication_level?: string;
      advisor_tone?: string;
      onboarding_completed?: boolean;
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

  // Financial Plans
  async createPlan(data: {
    title: string;
    plan_type: string;
    data: Record<string, unknown>;
    ai_plan?: string;
  }) {
    return this.request<{
      id: number;
      user_id: number;
      title: string;
      plan_type: string;
      data: string;
      ai_plan: string | null;
      status: string;
      created_at: string;
      updated_at: string;
    }>("/api/plans/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getPlans() {
    return this.request<
      Array<{
        id: number;
        title: string;
        plan_type: string;
        data: string;
        ai_plan: string | null;
        status: string;
        created_at: string;
        updated_at: string;
      }>
    >("/api/plans/");
  }

  async getPlan(id: number) {
    return this.request<{
      id: number;
      title: string;
      plan_type: string;
      data: string;
      ai_plan: string | null;
      status: string;
      created_at: string;
      updated_at: string;
    }>(`/api/plans/${id}`);
  }

  async deletePlan(id: number) {
    return this.request(`/api/plans/${id}`, { method: "DELETE" });
  }

  // Price Alerts
  async createAlert(data: {
    symbol: string;
    condition: string;
    target_price: number;
    message?: string;
  }) {
    return this.request<{
      id: number;
      user_id: number;
      symbol: string;
      condition: string;
      target_price: number;
      message: string | null;
      is_active: boolean;
      triggered: boolean;
      triggered_at: string | null;
      created_at: string;
    }>("/api/alerts/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getAlerts() {
    return this.request<
      Array<{
        id: number;
        symbol: string;
        condition: string;
        target_price: number;
        message: string | null;
        is_active: boolean;
        triggered: boolean;
        triggered_at: string | null;
        created_at: string;
      }>
    >("/api/alerts/");
  }

  async checkAlerts() {
    return this.request<{
      results: Array<{
        alert: {
          id: number;
          user_id: number;
          symbol: string;
          condition: string;
          target_price: number;
          message: string | null;
          is_active: boolean;
          triggered: boolean;
          triggered_at: string | null;
          created_at: string;
        };
        current_price: number | null;
        just_triggered: boolean;
      }>;
    }>("/api/alerts/check");
  }

  async updateAlert(
    id: number,
    data: {
      is_active?: boolean;
      target_price?: number;
      condition?: string;
      message?: string;
    }
  ) {
    return this.request<{
      id: number;
      symbol: string;
      condition: string;
      target_price: number;
      message: string | null;
      is_active: boolean;
      triggered: boolean;
      triggered_at: string | null;
      created_at: string;
    }>(`/api/alerts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteAlert(id: number) {
    return this.request(`/api/alerts/${id}`, { method: "DELETE" });
  }

  // Insights
  async getInsights() {
    return this.request<{
      insights: Array<{
        id: string;
        user_id: number;
        type: string;
        title: string;
        body: string;
        reasoning: string;
        confidence: number;
        urgency: string;
        impact: string;
        actions: string | null;
        source_goals: string | null;
        trigger: string;
        status: string;
        created_at: string;
        delivered_at: string | null;
        resolved_at: string | null;
      }>;
      total: number;
    }>("/api/insights/");
  }

  async generateInsights() {
    return this.request<{
      insights: Array<{
        id: string;
        user_id: number;
        type: string;
        title: string;
        body: string;
        reasoning: string;
        confidence: number;
        urgency: string;
        impact: string;
        actions: string | null;
        source_goals: string | null;
        trigger: string;
        status: string;
        created_at: string;
        delivered_at: string | null;
        resolved_at: string | null;
      }>;
      total: number;
    }>("/api/insights/generate", { method: "POST" });
  }

  async acceptInsight(id: string) {
    return this.request(`/api/insights/${id}/accept`, { method: "POST" });
  }

  async dismissInsight(id: string) {
    return this.request(`/api/insights/${id}/dismiss`, { method: "POST" });
  }

  // Usage
  async getUsage() {
    return this.request<{
      messages: { usage: number; limit: number; remaining: number };
      plans: { usage: number; limit: number; remaining: number };
      alerts: { usage: number; limit: number; remaining: number };
      insights: { usage: number; limit: number; remaining: number };
      is_pro: boolean;
    }>("/api/usage/");
  }

  // Briefing
  async getDailyBriefing() {
    return this.request<{
      briefing: string;
      market: { sp500_price: number; sp500_change_pct: number } | null;
      active_plans: number;
      pending_insights: number;
    }>("/api/briefing/daily");
  }
}

export const apiClient = new ApiClient();
export default apiClient;
