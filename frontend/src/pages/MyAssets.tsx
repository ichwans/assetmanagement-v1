import { useNavigate } from "react-router-dom";
import { Package, Eye, AlertTriangle } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { listAssets } from "@/lib/api/assets";

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Aktif", className: "bg-success/10 text-success border-success/20" },
  borrowed: { label: "Dipinjam", className: "bg-info/10 text-info border-info/20" },
  maintenance: { label: "Perbaikan", className: "bg-warning/10 text-warning border-warning/20" },
  disposed: { label: "Dihapus", className: "bg-destructive/10 text-destructive border-destructive/20" },
  transfer_pending: { label: "Menunggu Transfer", className: "bg-muted text-foreground border-border" },
};

const categoryIcons: Record<string, string> = {
  laptop: "💻",
  proyektor: "📽️",
  kendaraan: "🚗",
  furniture: "🪑",
  elektronik: "🔌",
  lainnya: "📦",
};

export default function MyAssets() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data } = useQuery({
    enabled: !!user,
    queryKey: ['my-assets', user?.id],
    queryFn: () => listAssets({ owner: user!.id, limit: 200, page: 1 }),
  });
  const myAssets = (data?.data?.results ?? []) as typeof import('@/types').Asset[];
  const activeAssets = myAssets.filter((a) => a.status !== "disposed");
  const borrowedAssets = myAssets.filter((a) => a.status === "borrowed");
  const permanentAssets = myAssets.filter((a) => a.status === "active");

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Asset Saya</h1>
          <p className="text-muted-foreground">
            Daftar asset yang sedang Anda pegang atau pinjam
          </p>
        </div>

      {/* Pending Returns Notice */}
      {borrowedAssets.length > 0 && (
        <Alert className="mb-6">
          <AlertTitle>Pemberitahuan Pengembalian</AlertTitle>
          <AlertDescription>
            Anda memiliki {borrowedAssets.length} asset berstatus dipinjam. Mohon pastikan
            pengembalian tepat waktu.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeAssets.length}</p>
                  <p className="text-sm text-muted-foreground">Total Asset</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{permanentAssets.length}</p>
                  <p className="text-sm text-muted-foreground">Asset Tetap</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-info/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{borrowedAssets.length}</p>
                  <p className="text-sm text-muted-foreground">Dipinjam</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Asset List */}
        {activeAssets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Tidak Ada Asset</h3>
              <p className="text-muted-foreground">
                Anda belum memiliki asset yang ditugaskan atau dipinjam
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {activeAssets.map((asset) => (
              <Card key={asset.assetId} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-2xl">
                        {categoryIcons[asset.category] || "📦"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{asset.name}</h3>
                          <Badge className={statusConfig[asset.status].className}>
                            {statusConfig[asset.status].label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {asset.assetId} • {asset.locationDetail || asset.location}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/assets/${asset.assetId}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Detail
                    </Button>
                  </div>

                  {asset.status === "borrowed" && (
                    <div className="mt-4 p-3 bg-info/5 border border-info/20 rounded-lg flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-info" />
                        <span className="text-sm text-info">Asset ini sedang dalam status pinjam</span>
                      </div>
                      <Button size="sm" onClick={() => navigate(`/assets/${asset.assetId}/return`)}>
                        Ajukan Pengembalian
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
