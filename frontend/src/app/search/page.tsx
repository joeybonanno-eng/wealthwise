"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface SearchResult {
  conversation_id: number;
  conversation_title: string;
  message_id: number;
  content: string;
  role: string;
  created_at: string;
}

export default function SearchPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (session?.accessToken) {
      apiClient.setToken(session.accessToken);
    }
  }, [status, session, router]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await apiClient.searchConversations(query.trim());
      setResults(data.results);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const highlight = (text: string, q: string) => {
    if (!q) return text;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-emerald-500/30 text-emerald-300 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Search Conversations</h1>
            <p className="text-gray-400 text-sm mt-1">Find messages across all your chats</p>
          </div>
          <button
            onClick={() => router.push("/chat")}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
          >
            Back to Chat
          </button>
        </div>

        {/* Search Input */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search your conversations..."
            className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl text-sm font-medium transition-colors"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Results */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto" />
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No results found for &quot;{query}&quot;</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-3">
            <p className="text-gray-400 text-sm">{results.length} result{results.length !== 1 ? "s" : ""} found</p>
            {results.map((r) => (
              <button
                key={`${r.conversation_id}-${r.message_id}`}
                onClick={() => router.push("/chat")}
                className="w-full text-left bg-gray-800/60 border border-gray-700/50 hover:border-emerald-500/30 rounded-xl p-4 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    r.role === "assistant"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-blue-500/20 text-blue-400"
                  }`}>
                    {r.role === "assistant" ? "AI" : "You"}
                  </span>
                  <span className="text-sm text-gray-300 font-medium truncate">{r.conversation_title}</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-400 line-clamp-3">
                  {highlight(r.content, query)}
                </p>
              </button>
            ))}
          </div>
        )}

        {!searched && !loading && (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-gray-500">Enter a search query to find messages</p>
          </div>
        )}
      </div>
    </div>
  );
}
