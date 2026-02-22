"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface Article {
  symbol: string;
  title: string;
  publisher: string;
  link: string;
  published: number;
  sentiment: string;
}

export default function NewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [symbolInput, setSymbolInput] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  const loadNews = useCallback(async (symbols?: string) => {
    setLoading(true);
    try {
      const data = await apiClient.getNews(symbols);
      setArticles(data.articles);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (session?.accessToken) {
      apiClient.setToken(session.accessToken);
      loadNews();
    }
  }, [status, session, router, loadNews]);

  const handleSearch = () => {
    const syms = symbolInput.trim().toUpperCase();
    setActiveFilter(syms);
    loadNews(syms || undefined);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
      </div>
    );
  }

  const sentimentColor = (s: string) => {
    if (s === "bullish") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (s === "bearish") return "bg-red-500/20 text-red-400 border-red-500/30";
    return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const formatDate = (ts: number) => {
    if (!ts) return "";
    const d = new Date(ts * 1000);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">News & Sentiment</h1>
            <p className="text-gray-400 text-sm mt-1">
              {activeFilter ? `Showing news for ${activeFilter}` : "Latest news for your portfolio"}
            </p>
          </div>
          <button
            onClick={() => router.push("/chat")}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
          >
            Chat
          </button>
        </div>

        {/* Symbol Filter */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Filter by symbols (e.g. AAPL,MSFT)"
            value={symbolInput}
            onChange={(e) => setSymbolInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm transition-colors"
          >
            Search
          </button>
          {activeFilter && (
            <button
              onClick={() => { setSymbolInput(""); setActiveFilter(""); loadNews(); }}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* News Articles */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4 opacity-50">&#x1F4F0;</div>
            <p className="text-gray-400 text-lg">No news found</p>
            <p className="text-gray-500 text-sm mt-2">Try different symbols or add holdings to your portfolio</p>
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map((article, idx) => (
              <a
                key={idx}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:bg-gray-800/80 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-sm leading-snug">{article.title}</h3>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <span className="font-medium text-gray-400">{article.symbol}</span>
                      <span>&#183;</span>
                      <span>{article.publisher}</span>
                      <span>&#183;</span>
                      <span>{formatDate(article.published)}</span>
                    </div>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border ${sentimentColor(article.sentiment)}`}>
                    {article.sentiment}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
