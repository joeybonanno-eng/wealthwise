"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import apiClient from "@/lib/api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ImportExportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [importType, setImportType] = useState<"portfolio" | "budget">("portfolio");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (session?.accessToken) {
      apiClient.setToken(session.accessToken);
    }
  }, [status, session, router]);

  const handleExport = async (type: string) => {
    if (!session?.accessToken) return;
    const res = await fetch(`${API_URL}/api/csv/export/${type}`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !session?.accessToken) return;

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/api/csv/import/${importType}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setImportResult(data);
      } else {
        setImportResult({ imported: 0, errors: ["Upload failed"] });
      }
    } catch {
      setImportResult({ imported: 0, errors: ["Upload failed"] });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Import & Export</h1>
          <p className="text-gray-400 text-sm mt-1">Import or export your financial data as CSV</p>
        </div>

        {/* Export Section */}
        <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Export Data</h2>
          <p className="text-gray-400 text-sm mb-4">Download your data as CSV files for backup or external analysis.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => handleExport("portfolio")}
              className="flex flex-col items-center gap-2 p-4 bg-gray-900 border border-gray-600 hover:border-emerald-500/50 rounded-lg transition-colors"
            >
              <span className="text-2xl">&#x1F4BC;</span>
              <span className="text-sm font-medium">Portfolio Holdings</span>
              <span className="text-xs text-gray-500">Symbol, Shares, Cost</span>
            </button>
            <button
              onClick={() => handleExport("budget")}
              className="flex flex-col items-center gap-2 p-4 bg-gray-900 border border-gray-600 hover:border-emerald-500/50 rounded-lg transition-colors"
            >
              <span className="text-2xl">&#x1F4B0;</span>
              <span className="text-sm font-medium">Budget Transactions</span>
              <span className="text-xs text-gray-500">Name, Amount, Category</span>
            </button>
            <button
              onClick={() => handleExport("net-worth")}
              className="flex flex-col items-center gap-2 p-4 bg-gray-900 border border-gray-600 hover:border-emerald-500/50 rounded-lg transition-colors"
            >
              <span className="text-2xl">&#x1F3E6;</span>
              <span className="text-sm font-medium">Net Worth Entries</span>
              <span className="text-xs text-gray-500">Name, Category, Amount, Type</span>
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Import Data</h2>
          <p className="text-gray-400 text-sm mb-4">Upload a CSV file to import data. The file must have the correct column headers.</p>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Import Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setImportType("portfolio")}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    importType === "portfolio" ? "bg-emerald-600 text-white" : "bg-gray-900 text-gray-400 hover:text-white"
                  }`}
                >
                  Portfolio
                </button>
                <button
                  onClick={() => setImportType("budget")}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    importType === "budget" ? "bg-emerald-600 text-white" : "bg-gray-900 text-gray-400 hover:text-white"
                  }`}
                >
                  Budget
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                Expected columns: {importType === "portfolio" ? "Symbol, Shares, Avg Cost, Notes" : "Name, Amount, Category, Frequency, Type"}
              </label>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 file:cursor-pointer"
              />
            </div>

            <button
              onClick={handleImport}
              disabled={importing}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
            >
              {importing ? "Importing..." : "Import CSV"}
            </button>

            {importResult && (
              <div className={`p-4 rounded-lg border ${importResult.errors.length > 0 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-emerald-500/10 border-emerald-500/30"}`}>
                <p className="text-sm font-medium text-white">
                  Imported {importResult.imported} record{importResult.imported !== 1 ? "s" : ""} successfully
                </p>
                {importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-yellow-400 font-medium">Warnings:</p>
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-yellow-400/70">{err}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
