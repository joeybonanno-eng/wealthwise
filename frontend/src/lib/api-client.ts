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
        follow_ups?: string[];
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
      cancel_at_period_end?: boolean;
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

  // Timeline
  async getTimeline() {
    return this.request<{
      milestones: Array<{
        id: number;
        title: string;
        type: string;
        timeline: string;
        status: string;
        created_at: string | null;
      }>;
    }>("/api/timeline/");
  }

  // Onboarding
  async chatOnboarding(messages: Array<{ role: string; content: string }>) {
    return this.request<{
      message: string;
      is_complete: boolean;
      profile_data: Record<string, unknown> | null;
    }>("/api/onboarding/chat", {
      method: "POST",
      body: JSON.stringify({ messages }),
    });
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

  async getWeeklyBriefing() {
    return this.request<{
      briefing: string;
      stats: {
        conversations: number;
        insights_generated: number;
        insights_accepted: number;
        insights_dismissed: number;
        active_plans: number;
      };
      market: { sp500_price: number; sp500_change_pct: number } | null;
    }>("/api/briefing/weekly");
  }

  // Memory Management
  async getMemories() {
    return this.request<
      Array<{
        id: number;
        key: string;
        value: string;
        source: string;
        confidence: number;
        last_updated: string;
      }>
    >("/api/memory/");
  }

  async deleteMemory(key: string) {
    return this.request(`/api/memory/${encodeURIComponent(key)}`, { method: "DELETE" });
  }

  // Share
  async sharePlan(planId: number) {
    return this.request<{ share_token: string }>(`/api/plans/${planId}/share`, {
      method: "POST",
    });
  }

  async getSharedPlan(shareToken: string) {
    return this.request<{
      title: string;
      plan_type: string;
      ai_plan: string | null;
      created_at: string;
    }>(`/api/plans/shared/${shareToken}`);
  }
  // Portfolio
  async getPortfolio() {
    return this.request<{
      holdings: Array<{
        id: number;
        symbol: string;
        shares: number;
        avg_cost: number;
        notes: string | null;
        current_price: number | null;
        change_percent: number | null;
        market_value: number;
        cost_basis: number;
        gain_loss: number | null;
        gain_loss_pct: number | null;
      }>;
      summary: {
        total_value: number;
        total_cost: number;
        total_gain_loss: number;
        total_gain_loss_pct: number;
        positions: number;
      };
    }>("/api/portfolio/");
  }

  async addHolding(data: { symbol: string; shares: number; avg_cost: number; notes?: string }) {
    return this.request<{ id: number; symbol: string; shares: number; avg_cost: number }>("/api/portfolio/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateHolding(id: number, data: { shares?: number; avg_cost?: number; notes?: string }) {
    return this.request(`/api/portfolio/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteHolding(id: number) {
    return this.request(`/api/portfolio/${id}`, { method: "DELETE" });
  }

  // Plan Export
  async exportPlan(planId: number) {
    const headers: Record<string, string> = {};
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    const res = await fetch(`${API_URL}/api/plans/${planId}/export`, { headers });
    if (!res.ok) throw new Error("Export failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plan_${planId}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Goal Drift Detection
  async checkGoalDrift() {
    return this.request<{
      drifts: Array<{
        goal: string;
        expected: string;
        actual: string;
        severity: string;
        suggestion: string;
      }>;
      overall_status: string;
    }>("/api/goals/drift");
  }

  // Notification Preferences
  async getNotificationPreferences() {
    return this.request<{
      email_briefing: boolean;
      email_alerts: boolean;
      email_insights: boolean;
      push_enabled: boolean;
      briefing_frequency: string;
    }>("/api/notifications/preferences");
  }

  async updateNotificationPreferences(data: {
    email_briefing?: boolean;
    email_alerts?: boolean;
    email_insights?: boolean;
    push_enabled?: boolean;
    briefing_frequency?: string;
  }) {
    return this.request("/api/notifications/preferences", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Search
  async searchConversations(query: string) {
    return this.request<{
      results: Array<{
        conversation_id: number;
        conversation_title: string;
        message_id: number;
        content: string;
        role: string;
        created_at: string;
      }>;
    }>(`/api/chat/search?q=${encodeURIComponent(query)}`);
  }

  // Budget / Recurring Transactions
  async getBudgetTransactions() {
    return this.request<Array<{
      id: number;
      name: string;
      amount: number;
      category: string;
      frequency: string;
      type: string;
      is_active: boolean;
      next_due: string | null;
      created_at: string;
    }>>("/api/budget/");
  }

  async createBudgetTransaction(data: {
    name: string;
    amount: number;
    category?: string;
    frequency?: string;
    type?: string;
    next_due?: string;
  }) {
    return this.request("/api/budget/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteBudgetTransaction(id: number) {
    return this.request(`/api/budget/${id}`, { method: "DELETE" });
  }

  async getBudgetSummary() {
    return this.request<{
      monthly_income: number;
      monthly_expenses: number;
      net_savings: number;
      savings_rate: number;
      by_category: Record<string, number>;
      total_transactions: number;
    }>("/api/budget/summary");
  }

  // Expense Categories
  async getExpenseCategories() {
    return this.request<Array<{
      id: number;
      name: string;
      monthly_budget: number;
      color: string;
    }>>("/api/budget/categories");
  }

  async createExpenseCategory(data: { name: string; monthly_budget: number; color?: string }) {
    return this.request("/api/budget/categories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteExpenseCategory(id: number) {
    return this.request(`/api/budget/categories/${id}`, { method: "DELETE" });
  }

  // Budget Insights
  async getBudgetInsights() {
    return this.request<{ analysis: string }>("/api/budget/insights");
  }

  // Compare
  async compareStocks(symbols: string) {
    return this.request<{
      results: Array<{
        symbol: string;
        name: string;
        price?: number | null;
        change_percent?: number | null;
        market_cap?: number | null;
        pe_ratio?: number | null;
        forward_pe?: number | null;
        dividend_yield?: number | null;
        fifty_two_week_high?: number | null;
        fifty_two_week_low?: number | null;
        sector?: string;
        beta?: number | null;
        eps?: number | null;
        error?: string;
      }>;
    }>(`/api/compare?symbols=${encodeURIComponent(symbols)}`);
  }

  // Education
  async getLessons() {
    return this.request<Array<{
      slug: string;
      title: string;
      description: string;
      icon: string;
      difficulty: string;
      read_time: string;
    }>>("/api/education/lessons");
  }

  async getLesson(slug: string) {
    return this.request<{
      slug: string;
      title: string;
      description: string;
      difficulty: string;
      read_time: string;
      content: string;
    }>(`/api/education/lessons/${encodeURIComponent(slug)}`);
  }

  // Portfolio Analytics
  async getPortfolioAnalytics() {
    return this.request<{
      sectors: Record<string, number>;
      top_performers: Array<{
        symbol: string;
        market_value: number;
        cost_basis: number;
        gain_loss: number | null;
        gain_loss_pct: number | null;
        sector: string;
      }>;
      worst_performers: Array<{
        symbol: string;
        market_value: number;
        cost_basis: number;
        gain_loss: number | null;
        gain_loss_pct: number | null;
        sector: string;
      }>;
      summary: {
        total_value: number;
        total_cost: number;
        total_gain_loss: number;
        total_gain_loss_pct: number;
        positions: number;
        best_performer: string | null;
        worst_performer: string | null;
      };
    }>("/api/portfolio/analytics");
  }

  // Watchlist
  async getWatchlist() {
    return this.request<Array<{
      id: number;
      symbol: string;
      name: string | null;
      target_buy_price: number | null;
      notes: string | null;
      current_price: number | null;
      change_percent: number | null;
      distance_pct: number | null;
      buy_signal: boolean;
      added_at: string;
    }>>("/api/watchlist/");
  }

  async addToWatchlist(data: { symbol: string; target_buy_price?: number; notes?: string }) {
    return this.request("/api/watchlist/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async removeFromWatchlist(id: number) {
    return this.request(`/api/watchlist/${id}`, { method: "DELETE" });
  }

  // Net Worth
  async getNetWorthEntries() {
    return this.request<Array<{
      id: number;
      name: string;
      category: string;
      amount: number;
      entry_type: string;
      created_at: string;
    }>>("/api/net-worth/");
  }

  async createNetWorthEntry(data: { name: string; category: string; amount: number; entry_type: string }) {
    return this.request("/api/net-worth/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteNetWorthEntry(id: number) {
    return this.request(`/api/net-worth/${id}`, { method: "DELETE" });
  }

  async getNetWorthSummary() {
    return this.request<{
      total_assets: number;
      total_liabilities: number;
      net_worth: number;
      asset_breakdown: Record<string, number>;
      liability_breakdown: Record<string, number>;
    }>("/api/net-worth/summary");
  }

  // Dividends
  async getPortfolioDividends() {
    return this.request<{
      holdings: Array<{
        symbol: string;
        shares: number;
        dividend_yield: number;
        dividend_rate: number;
        annual_income: number;
        yield_on_cost: number;
        frequency: string;
        ex_dividend_date: number | null;
      }>;
      total_annual_income: number;
      total_yield_on_cost: number;
    }>("/api/portfolio/dividends");
  }

  // Retirement Calculator
  async calculateRetirement(data: {
    current_age: number;
    retirement_age: number;
    current_savings: number;
    monthly_contribution: number;
    expected_return: number;
    inflation_rate: number;
  }) {
    return this.request<{
      projected_balance: number;
      annual_withdrawal: number;
      monthly_withdrawal: number;
      success_rate: number;
      years_to_retirement: number;
      yearly_data: Array<{ year: number; age: number; balance: number }>;
      inputs: Record<string, number>;
    }>("/api/calculators/retirement", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // News
  async getNews(symbols?: string) {
    const query = symbols ? `?symbols=${encodeURIComponent(symbols)}` : "";
    return this.request<{
      articles: Array<{
        symbol: string;
        title: string;
        publisher: string;
        link: string;
        published: number;
        sentiment: string;
      }>;
    }>(`/api/news/${query}`);
  }

  // Achievements
  async getAchievements() {
    return this.request<{
      badges: Array<{
        key: string;
        name: string;
        description: string;
        icon: string;
        earned: boolean;
        unlocked_at: string | null;
      }>;
      earned_count: number;
      total_count: number;
      streak: { current: number; longest: number; last_active: string | null };
    }>("/api/achievements/");
  }

  async checkInAchievements() {
    return this.request<{
      streak: { current: number; longest: number };
      newly_earned: string[];
    }>("/api/achievements/check-in", { method: "POST" });
  }

  // Dashboard
  async getDashboard() {
    return this.request<{
      portfolio: {
        total_value: number;
        total_gain: number;
        total_gain_pct: number;
        positions: number;
      };
      net_worth: {
        total_assets: number;
        total_liabilities: number;
        net_worth: number;
      };
      budget: {
        monthly_income: number;
        monthly_expenses: number;
        savings_rate: number;
      };
      streak: { current: number; longest: number };
      badges_earned: number;
      watchlist_buy_signals: number;
      pending_insights: number;
      active_alerts: number;
    }>("/api/dashboard/");
  }
  // Tax Loss Harvesting
  async getTaxLossHarvesting() {
    return this.request<{
      opportunities: Array<{
        symbol: string;
        shares: number;
        avg_cost: number;
        current_price: number;
        cost_basis: number;
        market_value: number;
        unrealized_loss: number;
        loss_pct: number;
        estimated_tax_savings_22: number;
        estimated_tax_savings_32: number;
      }>;
      summary: {
        total_unrealized_losses: number;
        estimated_tax_savings_22: number;
        estimated_tax_savings_32: number;
        positions_with_losses: number;
      };
    }>("/api/portfolio/tax-loss");
  }

  // Allocation
  async getAllocationTargets() {
    return this.request<{
      targets: Array<{ id: number; category: string; target_pct: number }>;
      categories: string[];
    }>("/api/allocation/targets");
  }

  async setAllocationTargets(targets: Array<{ category: string; target_pct: number }>) {
    return this.request("/api/allocation/targets", {
      method: "POST",
      body: JSON.stringify({ targets }),
    });
  }

  async getAllocationAnalysis() {
    return this.request<{
      current: Record<string, number>;
      targets: Record<string, number>;
      diffs: Record<string, number>;
      suggestions: Array<{
        category: string;
        action: string;
        amount: number;
        current_pct: number;
        target_pct: number;
        diff_pct: number;
      }>;
      total_value: number;
    }>("/api/allocation/analysis");
  }

  // Debt Payoff Calculator
  async calculateDebtPayoff(data: {
    debts: Array<{ name: string; balance: number; interest_rate: number; minimum_payment: number }>;
    extra_monthly: number;
  }) {
    return this.request<{
      avalanche: {
        strategy: string;
        months_to_payoff: number;
        years_to_payoff: number;
        total_paid: number;
        total_interest: number;
        schedule: Array<{ month: number; balances: Record<string, number>; total_remaining: number }>;
      };
      snowball: {
        strategy: string;
        months_to_payoff: number;
        years_to_payoff: number;
        total_paid: number;
        total_interest: number;
        schedule: Array<{ month: number; balances: Record<string, number>; total_remaining: number }>;
      };
      summary: {
        total_debt: number;
        total_minimum_payments: number;
        extra_monthly: number;
        interest_saved_avalanche: number;
        recommended: string;
      };
    }>("/api/calculators/debt-payoff", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Subscription Tracker
  async getSubscriptions() {
    return this.request<{
      subscriptions: Array<{
        id: number;
        name: string;
        amount: number;
        frequency: string;
        category: string;
        monthly_cost: number;
        annual_cost: number;
        next_due: string | null;
        is_active: boolean;
      }>;
      summary: {
        count: number;
        total_monthly: number;
        total_annual: number;
        daily_cost: number;
        by_category: Record<string, number>;
      };
      categories: string[];
    }>("/api/subscriptions/");
  }

  // Monthly Report
  async getMonthlyReport() {
    return this.request<{
      generated_at: string;
      month: string;
      portfolio: {
        total_value: number;
        total_cost: number;
        total_gain: number;
        total_gain_pct: number;
        positions: number;
        top_holdings: Array<{ symbol: string; shares: number; market_value: number; gain_loss: number }>;
      };
      net_worth: { total_assets: number; total_liabilities: number; net_worth: number };
      budget: {
        monthly_income: number;
        monthly_expenses: number;
        net_savings: number;
        savings_rate: number;
        top_expenses: Record<string, number>;
      };
      activity: {
        conversations: number;
        plans: number;
        insights: number;
        alerts: number;
        watchlist_items: number;
        badges_earned: number;
        current_streak: number;
        longest_streak: number;
      };
    }>("/api/reports/monthly");
  }

  // Investment Screener
  async screenStocks(params: {
    min_pe?: number;
    max_pe?: number;
    min_yield?: number;
    max_yield?: number;
    min_cap?: number;
    max_cap?: number;
    sector?: string;
    sort_by?: string;
  }) {
    const query = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join("&");
    return this.request<{
      results: Array<{
        symbol: string;
        name: string;
        price: number | null;
        change_pct: number | null;
        pe_ratio: number | null;
        forward_pe: number | null;
        dividend_yield: number;
        market_cap_b: number | null;
        sector: string;
        beta: number;
        eps: number;
        fifty_two_week_high: number | null;
        fifty_two_week_low: number | null;
      }>;
      total: number;
      sectors: string[];
    }>(`/api/screener/${query ? "?" + query : ""}`);
  }
}

export const apiClient = new ApiClient();
export default apiClient;
