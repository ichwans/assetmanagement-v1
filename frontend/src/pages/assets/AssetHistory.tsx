import { useParams, useNavigate, Link } from "react-router-dom";
import React, { useState } from "react";
import {
  ArrowLeft,
  Package,
  MapPin,
  ArrowLeftRight,
  Wrench,
  Undo2,
  Trash2,
  Blocks,
  Download,
  Printer,
  CheckCircle2,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAssetDetail, getAssetHistoryApi } from "@/lib/api/assets";
import { HistoryEventType } from "@/types";

const eventIcons: Record<HistoryEventType, React.ElementType> = {
  create: Package,
  assign: MapPin,
  transfer: ArrowLeftRight,
  maintenance: Wrench,
  maintenance_complete: CheckCircle2,
  return: Undo2,
  dispose: Trash2,
};

const eventLabels: Record<HistoryEventType, string> = {
  create: "Registrasi",
  assign: "Penempatan",
  transfer: "Transfer",
  maintenance: "Maintenance",
  maintenance_complete: "Maintenance Selesai",
  return: "Pengembalian",
  dispose: "Penghapusan",
};

const eventColors: Record<HistoryEventType, string> = {
  create: "bg-success text-success-foreground",
  assign: "bg-info text-info-foreground",
  transfer: "bg-primary text-primary-foreground",
  maintenance: "bg-warning text-warning-foreground",
  maintenance_complete: "bg-success/20 text-success",
  return: "bg-accent text-accent-foreground",
  dispose: "bg-destructive text-destructive-foreground",
};

/** Resolve the best available date string: prefer top-level, fallback to details.date */
const resolveDate = (event: { date: string; details?: Record<string, unknown> }): string => {
  const d = new Date(event.date);
  if (!isNaN(d.getTime()) && event.date.length > 10) return event.date;
  // Fallback to details.date when top-level date is truncated/invalid
  const detailDate = event.details?.date;
  if (typeof detailDate === "string" && !isNaN(new Date(detailDate).getTime())) return detailDate;
  return event.date;
};

const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function AssetHistory() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();

  const { data: assetResp } = useQuery({ enabled: !!assetId, queryKey: ["asset", assetId], queryFn: () => getAssetDetail(assetId!) });
  const { data: histResp } = useQuery({ enabled: !!assetId, queryKey: ["asset", assetId, "history"], queryFn: () => getAssetHistoryApi(assetId!) });
  const asset = (assetResp?.data ?? null) as typeof import("@/types").Asset | null;
  const historyAll = (histResp?.data ?? []) as typeof import("@/types").AssetHistoryEvent[];
  const [activeFilters, setActiveFilters] = useState<HistoryEventType[]>([
    'create','assign','transfer','maintenance','maintenance_complete','return','dispose'
  ]);
  const toggleFilter = (t: HistoryEventType) => {
    setActiveFilters((prev) => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };
  const history = historyAll.filter(ev => activeFilters.includes(ev.eventType));

  if (!asset) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Asset tidak ditemukan</h2>
          <Button className="mt-4" onClick={() => navigate("/assets")}>
            Kembali
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Riwayat Asset</h1>
              <p className="text-muted-foreground">
                {asset.name} ({asset.assetId})
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Visual Timeline */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Blocks className="w-5 h-5" />
              Timeline Visual
            </CardTitle>
            <CardDescription>Perjalanan asset dari awal hingga sekarang</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Belum ada riwayat untuk asset ini
              </p>
            ) : (
              <div className="relative">
                {/* Horizontal Timeline for desktop */}
                <div className="hidden md:flex items-center justify-between overflow-x-auto pb-4">
                  {history.map((event, index) => {
                    const Icon = eventIcons[event.eventType];
                    return (
                      <div key={event.id} className="flex flex-col items-center min-w-[100px]">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${eventColors[event.eventType]}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="mt-2 text-center">
                          <p className="text-xs font-medium">
                            {eventLabels[event.eventType]}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(() => {
                              const d = new Date(resolveDate(event));
                              return isNaN(d.getTime()) ? event.date : d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
                            })()}
                          </p>
                        </div>
                        {index < history.length - 1 && (
                          <div className="absolute top-5 left-0 right-0 h-px bg-border -z-10" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-2">
          {Object.keys(eventLabels).map((k) => (
            <Button key={k} variant={activeFilters.includes(k as HistoryEventType) ? 'default' : 'outline'} size="sm" onClick={() => toggleFilter(k as HistoryEventType)}>
              {eventLabels[k as HistoryEventType]}
            </Button>
          ))}
        </div>

        {/* Detailed History */}
        <Card>
          <CardHeader>
            <CardTitle>Detail Riwayat</CardTitle>
            <CardDescription>
              Data audit trail dari Hyperledger Blockchain
            </CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Belum ada riwayat untuk asset ini
              </p>
            ) : (
              <div className="space-y-6">
                {[...history].reverse().map((event, index) => {
                  const Icon = eventIcons[event.eventType];
                  const isFirst = index === 0;

                  return (
                    <div key={event.id} className="relative pl-8">
                      {/* Timeline line */}
                      {index < history.length - 1 && (
                        <div className="absolute left-[15px] top-10 bottom-0 w-px bg-border" />
                      )}

                      {/* Event dot */}
                      <div
                        className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${eventColors[event.eventType]}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Event content */}
                      <div className="bg-muted/50 rounded-lg p-4 ml-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">
                                {eventLabels[event.eventType]}
                              </span>
                              {isFirst && (
                                <Badge variant="secondary" className="text-xs">
                                  Terbaru
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(resolveDate(event))}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm mb-3">{event.description}</p>

                        {/* Event Details */}
                        {event.details && Object.keys(event.details).length > 0 && (
                          <div className="text-xs space-y-1 mb-3 p-2 bg-background/50 rounded">
                            {Object.entries(event.details).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-muted-foreground capitalize">
                                  {key.replace(/([A-Z])/g, " $1").trim()}:
                                </span>
                                <span className="font-medium">
                                  {typeof value === "number"
                                    ? new Intl.NumberFormat("id-ID").format(value)
                                    : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Blockchain Info */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Blocks className="w-3 h-3" />
                            <span>Block #{event.blockNumber}</span>
                          </div>
                          <div>
                            <span>TX: </span>
                            <code className="font-mono">
                              {event.txId.slice(0, 8)}...{event.txId.slice(-6)}
                            </code>
                          </div>
                          <div>
                            <Link to={`/explorer?txId=${encodeURIComponent(event.txId)}`} className="underline">
                              View in Explorer
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Blockchain Verification */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-2 text-sm">
            <Blocks className="w-4 h-4 text-primary" />
            <span>
              Semua data di atas diverifikasi dari{" "}
              <strong>Hyperledger Fabric Blockchain</strong> dan tidak dapat dimanipulasi
              (immutable).
            </span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
