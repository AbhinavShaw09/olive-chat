"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Clock,
  BarChart3,
  Database,
  RefreshCw,
} from "lucide-react";

interface LogEntry {
  id: string;
  model: string;
  provider: string | null;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  prompt: string;
  completion: string;
  temperature: number | null;
  maxTokens: number | null;
  createdAt: string;
  conversationId: string;
}

interface LogsResponse {
  logs: LogEntry[];
  total: number;
  limit: number;
  offset: number;
}

interface LogStats {
  totalLogs: number;
  totalTokens: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  avgLatencyMs: number;
  avgTokensPerCall: number;
  modelBreakdown: {
    model: string;
    calls: number;
    totalTokens: number;
    avgLatencyMs: number;
  }[];
}

function LogsContent() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("conversationId");
  const [logsData, setLogsData] = useState<LogsResponse | null>(null);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    const query = conversationId
      ? `?conversationId=${conversationId}&limit=100`
      : "?limit=100";
    const [logsRes, statsRes] = await Promise.all([
      fetch(`/api/logs${query}`),
      fetch("/api/logs/stats"),
    ]);
    if (logsRes.ok) setLogsData(await logsRes.json());
    if (statsRes.ok) setStats(await statsRes.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [conversationId]);

  return (
    <div className="max-w-5xl mx-auto w-full p-4 md:p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="size-8 rounded-lg border border-input flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="size-4" />
          </a>
          <h1 className="text-xl font-semibold">
            {conversationId ? "Conversation Logs" : "Inference Logs"}
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw
            className={`size-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </header>

      {!conversationId && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-xs text-muted-foreground font-normal">
                <Database className="size-3" /> Total Calls
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold tabular-nums">
              {stats.totalLogs}
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-xs text-muted-foreground font-normal">
                <BarChart3 className="size-3" /> Total Tokens
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold tabular-nums">
              {stats.totalTokens.toLocaleString()}
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-xs text-muted-foreground font-normal">
                <Clock className="size-3" /> Avg Latency
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold tabular-nums">
              {stats.avgLatencyMs}ms
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-xs text-muted-foreground font-normal">
                <BarChart3 className="size-3" /> Avg Tokens/Call
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold tabular-nums">
              {stats.avgTokensPerCall}
            </CardContent>
          </Card>
        </div>
      )}

      {!conversationId && stats && stats.modelBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Model Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.modelBreakdown.map((m) => (
              <div
                key={m.model}
                className="flex items-center justify-between text-sm py-1.5 border-b last:border-0"
              >
                <span className="font-mono text-xs">{m.model}</span>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{m.calls} calls</span>
                  <span>{m.totalTokens.toLocaleString()} tokens</span>
                  <span>{m.avgLatencyMs}ms avg</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {conversationId ? "Logs for this conversation" : "Recent Logs"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading && !logsData ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Loading...
            </div>
          ) : logsData && logsData.logs.length > 0 ? (
            <ScrollArea className="max-h-[600px]">
              {logsData.logs.map((log) => (
                <div
                  key={log.id}
                  className="border-b last:border-0 px-4 py-3 space-y-1.5 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-mono">{log.model}</span>
                    <span>
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>&uarr;{log.promptTokens}</span>
                    <span>&darr;{log.completionTokens}</span>
                    <span>&Sigma;{log.totalTokens}</span>
                    <span>{log.latencyMs}ms</span>
                  </div>
                  <div className="text-sm line-clamp-2 text-foreground/80">
                    {log.completion}
                  </div>
                </div>
              ))}
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              {conversationId
                ? "No logs for this conversation yet."
                : "No inference logs yet. Start a conversation first."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function LogsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-dvh">
          <RefreshCw className="size-5 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <LogsContent />
    </Suspense>
  );
}
