"use client";

interface MarketDataCardProps {
  tool: string;
  result: Record<string, any>;
}

function formatNumber(num: number | null | undefined): string {
  if (num == null) return "N/A";
  if (Math.abs(num) >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (Math.abs(num) >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (Math.abs(num) >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return num.toLocaleString();
}

function formatPrice(num: number | null | undefined): string {
  if (num == null) return "N/A";
  return `$${num.toFixed(2)}`;
}

function formatPercent(num: number | null | undefined): string {
  if (num == null) return "N/A";
  const sign = num >= 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}%`;
}

function StockQuoteCard({ result }: { result: Record<string, any> }) {
  const isPositive = (result.change_percent || 0) >= 0;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 my-2">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-lg font-bold text-white">{result.symbol}</span>
          <span className="text-sm text-gray-400 ml-2">{result.name}</span>
        </div>
        <span
          className={`text-sm font-medium px-2 py-1 rounded ${
            isPositive
              ? "bg-emerald-900/50 text-emerald-400"
              : "bg-red-900/50 text-red-400"
          }`}
        >
          {formatPercent(result.change_percent)}
        </span>
      </div>
      <div className="text-2xl font-bold text-white">
        {formatPrice(result.price)}
      </div>
      <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
        <div>
          <span className="text-gray-500">Volume</span>
          <div className="text-gray-300">{formatNumber(result.volume)}</div>
        </div>
        <div>
          <span className="text-gray-500">Mkt Cap</span>
          <div className="text-gray-300">{formatNumber(result.market_cap)}</div>
        </div>
        <div>
          <span className="text-gray-500">Day Range</span>
          <div className="text-gray-300">
            {formatPrice(result.day_low)} - {formatPrice(result.day_high)}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompanyInfoCard({ result }: { result: Record<string, any> }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 my-2">
      <div className="font-bold text-white text-lg mb-1">
        {result.name} ({result.symbol})
      </div>
      <div className="text-sm text-emerald-400 mb-2">
        {result.sector} &middot; {result.industry}
      </div>
      {result.description && (
        <p className="text-sm text-gray-400 mb-3 line-clamp-3">
          {result.description}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-500">P/E Ratio</span>
          <div className="text-gray-300">
            {result.pe_ratio?.toFixed(2) || "N/A"}
          </div>
        </div>
        <div>
          <span className="text-gray-500">EPS</span>
          <div className="text-gray-300">
            {result.eps ? formatPrice(result.eps) : "N/A"}
          </div>
        </div>
        <div>
          <span className="text-gray-500">52W Range</span>
          <div className="text-gray-300">
            {formatPrice(result.fifty_two_week_low)} -{" "}
            {formatPrice(result.fifty_two_week_high)}
          </div>
        </div>
        <div>
          <span className="text-gray-500">Beta</span>
          <div className="text-gray-300">
            {result.beta?.toFixed(2) || "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectorPerformanceCard({ result }: { result: Record<string, any>[] }) {
  if (!Array.isArray(result)) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 my-2">
      <div className="font-bold text-white mb-3">Sector Performance</div>
      <div className="space-y-2">
        {result.map((sector: any) => {
          const isPositive = (sector.change_percent || 0) >= 0;
          return (
            <div
              key={sector.sector}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-gray-300">{sector.sector}</span>
              <div className="flex items-center gap-3">
                <span className="text-gray-400">
                  {formatPrice(sector.price)}
                </span>
                <span
                  className={`font-medium ${
                    isPositive ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {formatPercent(sector.change_percent)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PriceHistoryCard({ result }: { result: Record<string, any> }) {
  const data = result.data as any[];
  if (!data || data.length === 0) return null;

  const first = data[0];
  const last = data[data.length - 1];
  const change = last.close - first.close;
  const changePct = (change / first.close) * 100;
  const isPositive = change >= 0;
  const high = Math.max(...data.map((d: any) => d.high));
  const low = Math.min(...data.map((d: any) => d.low));

  // Simple ASCII-style sparkline using bar heights
  const closes = data.map((d: any) => d.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const barCount = Math.min(data.length, 40);
  const step = Math.max(1, Math.floor(data.length / barCount));
  const sampled = closes.filter((_: any, i: number) => i % step === 0);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 my-2">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-lg font-bold text-white">{result.symbol}</span>
          <span className="text-sm text-gray-400 ml-2">
            {result.period} price history
          </span>
        </div>
        <span
          className={`text-sm font-medium px-2 py-1 rounded ${
            isPositive
              ? "bg-emerald-900/50 text-emerald-400"
              : "bg-red-900/50 text-red-400"
          }`}
        >
          {isPositive ? "+" : ""}
          {changePct.toFixed(2)}%
        </span>
      </div>

      {/* Mini bar chart */}
      <div className="flex items-end gap-px h-16 my-3">
        {sampled.map((close: number, i: number) => {
          const height = ((close - min) / range) * 100;
          return (
            <div
              key={i}
              className={`flex-1 rounded-t-sm ${isPositive ? "bg-emerald-500/60" : "bg-red-500/60"}`}
              style={{ height: `${Math.max(height, 4)}%` }}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-4 gap-3 text-sm">
        <div>
          <span className="text-gray-500">Open</span>
          <div className="text-gray-300">{formatPrice(first.open)}</div>
        </div>
        <div>
          <span className="text-gray-500">Close</span>
          <div className="text-gray-300">{formatPrice(last.close)}</div>
        </div>
        <div>
          <span className="text-gray-500">High</span>
          <div className="text-gray-300">{formatPrice(high)}</div>
        </div>
        <div>
          <span className="text-gray-500">Low</span>
          <div className="text-gray-300">{formatPrice(low)}</div>
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-2">
        {first.date} to {last.date}
      </div>
    </div>
  );
}

export default function MarketDataCard({ tool, result }: MarketDataCardProps) {
  if (tool === "get_stock_quote") {
    return <StockQuoteCard result={result} />;
  }
  if (tool === "get_company_info") {
    return <CompanyInfoCard result={result} />;
  }
  if (tool === "get_sector_performance") {
    return <SectorPerformanceCard result={result as any} />;
  }
  if (tool === "get_price_history") {
    return <PriceHistoryCard result={result} />;
  }
  return null;
}
