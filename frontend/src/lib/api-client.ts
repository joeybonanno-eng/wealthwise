import type {
  Advisor,
  AuthResponse,
  Client,
  ClientInsights,
  ClientPortfolio,
  LifeEvent,
  CommunicationLog,
  Meeting,
  MeetingAction,
  Alert,
  MessageDraft,
  MorningBriefing,
  DashboardEvent,
  Task,
  MarketMover,
  TranscriptSegment,
  MeetingType,
  ActionStatus,
  MessageTone,
  MessageChannel,
  ClientIdea,
  ClientScore,
  ClientCallCycle,
  TickerQuote,
  TickerHolder,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiClient {
  private token: string | null = null;

  // ─── Token Management ──────────────────────────────────

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("aiva_token", token);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("aiva_token");
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("aiva_token");
    }
  }

  // ─── Base Request ──────────────────────────────────────

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    const currentToken = this.getToken();
    if (currentToken) {
      headers["Authorization"] = `Bearer ${currentToken}`;
    }

    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      const isAuthRoute = path.startsWith("/api/auth/login") || path.startsWith("/api/auth/register");
      if (!isAuthRoute) {
        this.clearToken();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        throw new Error("Session expired");
      }
    }

    if (!res.ok) {
      const error = await res
        .json()
        .catch(() => ({ detail: "Request failed" }));
      throw new Error(error.detail || `HTTP ${res.status}`);
    }

    if (res.status === 204) {
      return undefined as T;
    }

    return res.json();
  }

  // ─── Auth ──────────────────────────────────────────────

  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async register(
    email: string,
    password: string,
    fullName: string
  ): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async getMe(): Promise<Advisor> {
    return this.request<Advisor>("/api/auth/me");
  }

  // ─── Morning Briefing ─────────────────────────────────

  async getMorningBriefing(): Promise<MorningBriefing> {
    return this.request<MorningBriefing>("/api/briefing/morning");
  }

  // ─── Dashboard ─────────────────────────────────────────

  async getEvents(): Promise<DashboardEvent[]> {
    return this.request<DashboardEvent[]>("/api/dashboard/events");
  }

  async getRecommendedContacts(): Promise<
    Array<{
      client_id: number;
      client_name: string;
      reason: string;
      last_contact: string;
      priority: string;
    }>
  > {
    return this.request("/api/dashboard/recommended-contacts");
  }

  async getTasks(): Promise<Task[]> {
    return this.request<Task[]>("/api/dashboard/tasks");
  }

  async getMarketMovers(): Promise<MarketMover[]> {
    return this.request<MarketMover[]>("/api/dashboard/market-movers");
  }

  // ─── Meetings ──────────────────────────────────────────

  async createMeeting(data: {
    client_id: number;
    title: string;
    meeting_type: MeetingType;
    started_at: string;
  }): Promise<Meeting> {
    return this.request<Meeting>("/api/meetings", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listMeetings(params?: {
    status?: string;
    client_id?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ items: Meeting[]; total: number }> {
    const query = params
      ? "?" +
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
          .join("&")
      : "";
    return this.request(`/api/meetings${query}`);
  }

  async getMeeting(id: number): Promise<Meeting> {
    return this.request<Meeting>(`/api/meetings/${id}`);
  }

  async startRecording(meetingId: number): Promise<Meeting> {
    return this.request<Meeting>(`/api/meetings/${meetingId}/start-recording`, {
      method: "POST",
    });
  }

  async stopRecording(meetingId: number): Promise<Meeting> {
    return this.request<Meeting>(`/api/meetings/${meetingId}/stop-recording`, {
      method: "POST",
    });
  }

  async appendTranscript(
    meetingId: number,
    segments: Array<{ speaker: string; text: string; timestamp: string }>
  ): Promise<TranscriptSegment[]> {
    return this.request<TranscriptSegment[]>(
      `/api/meetings/${meetingId}/transcript`,
      {
        method: "POST",
        body: JSON.stringify({ segments }),
      }
    );
  }

  async processMeeting(meetingId: number): Promise<Meeting> {
    return this.request<Meeting>(`/api/meetings/${meetingId}/process`, {
      method: "POST",
    });
  }

  async updateAction(
    meetingId: number,
    actionId: number,
    data: { status?: ActionStatus; description?: string; due_date?: string }
  ): Promise<MeetingAction> {
    return this.request<MeetingAction>(
      `/api/meetings/${meetingId}/actions/${actionId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );
  }

  // ─── Clients ───────────────────────────────────────────

  async listClients(params?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: Client[]; total: number }> {
    const query = params
      ? "?" +
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== "")
          .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
          .join("&")
      : "";
    return this.request(`/api/clients${query}`);
  }

  async getClient(id: number): Promise<Client> {
    return this.request<Client>(`/api/clients/${id}`);
  }

  async getClientInsights(clientId: number): Promise<ClientInsights> {
    return this.request<ClientInsights>(`/api/clients/${clientId}/insights`);
  }

  async getClientPortfolio(clientId: number): Promise<ClientPortfolio[]> {
    return this.request<ClientPortfolio[]>(
      `/api/clients/${clientId}/portfolio`
    );
  }

  async getClientLifeEvents(clientId: number): Promise<LifeEvent[]> {
    return this.request<LifeEvent[]>(
      `/api/clients/${clientId}/life-events`
    );
  }

  async getClientCommunications(
    clientId: number
  ): Promise<CommunicationLog[]> {
    return this.request<CommunicationLog[]>(
      `/api/clients/${clientId}/communications`
    );
  }

  // ─── Alerts ────────────────────────────────────────────

  async listAlerts(params?: {
    type?: string;
    severity?: string;
    is_read?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ items: Alert[]; total: number }> {
    const query = params
      ? "?" +
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
          .join("&")
      : "";
    return this.request(`/api/alerts${query}`);
  }

  async actOnAlert(
    alertId: number,
    action: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/alerts/${alertId}/act`, {
      method: "POST",
      body: JSON.stringify({ action }),
    });
  }

  // ─── Messages ──────────────────────────────────────────

  async createDraft(data: {
    client_id: number;
    subject: string;
    body?: string;
    tone: MessageTone;
    channel: MessageChannel;
  }): Promise<MessageDraft> {
    return this.request<MessageDraft>("/api/messages/drafts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listDrafts(params?: {
    client_id?: number;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: MessageDraft[]; total: number }> {
    const query = params
      ? "?" +
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
          .join("&")
      : "";
    return this.request(`/api/messages/drafts${query}`);
  }

  // ─── Ideas ───────────────────────────────────────────────

  async listIdeas(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: ClientIdea[]; total: number }> {
    const query = params
      ? "?" +
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
          .join("&")
      : "";
    return this.request(`/api/ideas${query}`);
  }

  async getIdea(id: number): Promise<ClientIdea> {
    return this.request<ClientIdea>(`/api/ideas/${id}`);
  }

  async sendIdea(id: number): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/ideas/${id}/send`, { method: "POST" });
  }

  async dismissIdea(id: number): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/ideas/${id}/dismiss`, { method: "POST" });
  }

  async customizeIdea(
    id: number,
    data: { subject?: string; rendered_content?: string; channel?: string }
  ): Promise<ClientIdea> {
    return this.request<ClientIdea>(`/api/ideas/${id}/customize`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async generateIdeas(): Promise<{ items: ClientIdea[]; total: number }> {
    return this.request(`/api/ideas/generate`, { method: "POST" });
  }

  // ─── Scoring ─────────────────────────────────────────────

  async getClientScore(clientId: number): Promise<ClientScore> {
    return this.request<ClientScore>(`/api/clients/${clientId}/score`);
  }

  async getScoreLeaderboard(limit?: number): Promise<{ items: Array<{ client_id: number; client_name: string; composite_score: number; aum: number; status: string }> }> {
    const query = limit ? `?limit=${limit}` : "";
    return this.request(`/api/scoring/leaderboard${query}`);
  }

  async refreshScores(): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/scoring/refresh`, { method: "POST" });
  }

  // ─── Call Cycles ─────────────────────────────────────────

  async getClientCallCycle(clientId: number): Promise<ClientCallCycle> {
    return this.request<ClientCallCycle>(`/api/clients/${clientId}/call-cycle`);
  }

  async setClientCallCycle(
    clientId: number,
    days: number
  ): Promise<ClientCallCycle> {
    return this.request<ClientCallCycle>(`/api/clients/${clientId}/call-cycle`, {
      method: "PUT",
      body: JSON.stringify({ call_cycle_days: days }),
    });
  }

  // ─── Ticker Quotes ──────────────────────────────────────

  async getTickerQuote(symbol: string): Promise<TickerQuote> {
    return this.request<TickerQuote>(`/api/ticker/${encodeURIComponent(symbol)}`);
  }

  async getTickerHolders(symbol: string): Promise<{ symbol: string; holders: TickerHolder[] }> {
    return this.request<{ symbol: string; holders: TickerHolder[] }>(
      `/api/ticker/${encodeURIComponent(symbol)}/holders`
    );
  }

  async listCallCycles(params?: {
    status?: string;
  }): Promise<{ items: ClientCallCycle[]; total: number }> {
    const query = params?.status ? `?status=${params.status}` : "";
    return this.request(`/api/call-cycles${query}`);
  }
}

export const apiClient = new ApiClient();
export default apiClient;
