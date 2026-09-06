import { useParams, useNavigate } from "react-router-dom";
import {
  Package,
  CheckCircle,
  MapPin,
  User,
  Calendar,
  Blocks,
  LogIn,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAssetDetail, getAssetHistoryApi } from "@/lib/api/assets";
import { AssetStatus, HistoryEventType } from "@/types";

const statusConfig: Record<AssetStatus, { label: string; className: string }> = {
  active: { label: "Aktif", className: "bg-success/10 text-success" },
  borrowed: { label: "Dipinjam", className: "bg-info/10 text-info" },
  maintenance: { label: "Perbaikan", className: "bg-warning/10 text-warning" },
  disposed: { label: "Tidak Aktif", className: "bg-destructive/10 text-destructive" },
};

const eventIcons: Record<HistoryEventType, string> = {
  create: "📦",
  assign: "📍",
  transfer: "🔄",
  maintenance: "🔧",
  return: "↩️",
  dispose: "🗑️",
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function PublicAssetView() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();

  const { data: assetResp } = useQuery({ enabled: !!assetId, queryKey: ["asset","public", assetId], queryFn: () => getAssetDetail(assetId!) });
  const { data: histResp } = useQuery({ enabled: !!assetId, queryKey: ["asset","public", assetId, "history"], queryFn: () => getAssetHistoryApi(assetId!) });
  const asset = (assetResp?.data ?? null) as typeof import("@/types").Asset | null;
  const history = (histResp?.data ?? []) as typeof import("@/types").AssetHistoryEvent[];

  if (!asset) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Asset Tidak Ditemukan</h2>
            <p className="text-muted-foreground mb-6">
              Asset dengan ID "{assetId}" tidak terdaftar dalam sistem
            </p>
            <Button onClick={() => navigate("/scan")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Scan Ulang
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4 px-6">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Package className="w-6 h-6" />
          <div>
            <h1 className="font-bold">Asset Hub</h1>
            <p className="text-xs text-primary-foreground/70">Blockchain Verified</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Verification Badge */}
        <div className="flex items-center justify-center gap-2 p-3 bg-success/10 rounded-lg border border-success/20">
          <CheckCircle className="w-5 h-5 text-success" />
          <span className="text-sm font-medium text-success">
            Data Terverifikasi dari Blockchain
          </span>
        </div>

        {/* Asset Info */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{asset.name}</CardTitle>
                <p className="text-muted-foreground mt-1">{asset.assetId}</p>
              </div>
              <Badge className={statusConfig[asset.status].className}>
                {statusConfig[asset.status].label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Package className="w-4 h-4" />
                  <span>Kategori</span>
                </div>
                <p className="font-medium capitalize">{asset.category}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <User className="w-4 h-4" />
                  <span>Pemegang</span>
                </div>
                <p className="font-medium">{asset.ownerName}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>Lokasi</span>
                </div>
                <p className="font-medium">{asset.locationDetail}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>Terdaftar</span>
                </div>
                <p className="font-medium">{formatDate(asset.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Blockchain Verification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Blocks className="w-5 h-5" />
              Verifikasi Blockchain
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <span className="text-muted-foreground">Transaction ID</span>
                <code className="text-xs font-mono">
                  {asset.txId?.slice(0, 8)}...{asset.txId?.slice(-6)}
                </code>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <span className="text-muted-foreground">Block Number</span>
                <span className="font-mono">#{asset.blockNumber}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <span className="text-muted-foreground">Terakhir Update</span>
                <span>{formatDate(asset.updatedAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mini Timeline */}
        {history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline Singkat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between overflow-x-auto pb-2 gap-4">
                {history.slice(0, 5).map((event, index) => (
                  <div key={event.id} className="flex flex-col items-center min-w-[60px]">
                    <div className="text-2xl">{eventIcons[event.eventType]}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(event.date)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Login Prompt */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Login untuk melihat detail lengkap, riwayat transfer,
                dan informasi maintenance
              </p>
              <Button onClick={() => navigate("/login")}>
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Back to Scan */}
        <div className="text-center">
          <Button variant="link" onClick={() => navigate("/scan")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Scan Asset Lain
          </Button>
        </div>

        {/* Footer Info */}
        <div className="text-center text-xs text-muted-foreground">
          <p>
            Data di atas diverifikasi dari Hyperledger Fabric Blockchain
            dan tidak dapat dimanipulasi (immutable)
          </p>
        </div>
      </main>
    </div>
  );
}
