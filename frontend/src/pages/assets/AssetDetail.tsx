import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowLeftRight,
  Wrench,
  Trash2,
  QrCode,
  History,
  MapPin,
  User,
  Calendar,
  DollarSign,
  Hash,
  Blocks,
  FileText,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAssetDetail, getAssetHistoryApi, getAssetMaintenanceApi, getAssetDocumentsApi, uploadAssetDocumentFile } from '@/lib/api/assets';
import { AssetStatus } from "@/types";
import { FileUploader } from "@/components/ui/file-uploader";
import { DocumentCard } from "@/components/shared/DocumentCard";
import { AssetQRCode } from "@/components/shared/AssetQRCode";
import { Alert, AlertDescription } from "@/components/ui/alert";

const statusConfig: Record<AssetStatus, { label: string; className: string }> = {
  active: { label: "Aktif", className: "bg-success/10 text-success border-success/20" },
  borrowed: { label: "Dipinjam", className: "bg-info/10 text-info border-info/20" },
  maintenance: { label: "Perbaikan", className: "bg-warning/10 text-warning border-warning/20" },
  disposed: { label: "Dihapus", className: "bg-destructive/10 text-destructive border-destructive/20" },
  transfer_pending: { label: "Menunggu Transfer", className: "bg-muted text-foreground border-border" },
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default function AssetDetail() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const qc = useQueryClient();
  const { data: assetResp } = useQuery({ enabled: !!assetId, queryKey: ['asset', assetId], queryFn: () => getAssetDetail(assetId!) });
  const { data: histResp } = useQuery({ enabled: !!assetId, queryKey: ['asset', assetId, 'history'], queryFn: () => getAssetHistoryApi(assetId!) });
  const { data: maintResp } = useQuery({ enabled: !!assetId, queryKey: ['asset', assetId, 'maintenance'], queryFn: () => getAssetMaintenanceApi(assetId!) });
  const { data: docsResp } = useQuery({ enabled: !!assetId, queryKey: ['asset', assetId, 'documents'], queryFn: () => getAssetDocumentsApi(assetId!) });

  const asset = assetResp?.data ?? null;
  const history = histResp?.data ?? [];
  const maintenanceRecords = maintResp?.data ?? [];
  const totalMaintenanceCost = maintenanceRecords.reduce((sum, m) => sum + (m.cost || 0), 0);
  const documents = docsResp?.data ?? [];

  if (!asset) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold mb-2">Asset Tidak Ditemukan</h2>
          <p className="text-muted-foreground mb-4">Asset dengan ID {assetId} tidak ditemukan</p>
          <Button onClick={() => navigate("/assets")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Daftar Asset
          </Button>
        </div>
      </AppLayout>
    );
  }

  const recentHistory = history.slice(-3).reverse();
  const updatedDiffMs = asset ? Date.now() - new Date(asset.updatedAt).getTime() : 0;
  const recentlyUpdated = asset ? updatedDiffMs < 2 * 60 * 1000 : false;
  const updatedAgo = (() => {
    if (!asset) return '';
    const mins = Math.floor(updatedDiffMs / 60000);
    if (mins < 1) return 'baru saja';
    if (mins < 60) return `${mins} menit yang lalu`;
    const hours = Math.floor(mins / 60);
    return `${hours} jam yang lalu`;
  })();

  return (
    <AppLayout>
      <div className="space-y-6">
        {(asset.status === 'borrowed' || recentlyUpdated) && (
          <Alert>
            <AlertDescription>
              {asset.status === 'borrowed'
                ? 'Asset ini sedang dalam status dipinjam. Beberapa aksi administrasi dibatasi hingga pengembalian.'
                : `Data asset diperbarui ${updatedAgo}.`}
            </AlertDescription>
          </Alert>
        )}
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/assets")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{asset.name}</h1>
                <Badge className={statusConfig[asset.status].className}>
                  {statusConfig[asset.status].label}
                </Badge>
              </div>
              <p className="text-muted-foreground">{asset.assetId}</p>
            </div>
          </div>
          {isAdmin && asset.status !== "disposed" && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate(`/assets/${assetId}/transfer`)}>
                <ArrowLeftRight className="w-4 h-4 mr-2" />
                Transfer
              </Button>
              <Button variant="outline" onClick={() => navigate(`/assets/${assetId}/maintenance`)}>
                <Wrench className="w-4 h-4 mr-2" />
                Maintenance
              </Button>
              <Button variant="destructive" onClick={() => navigate(`/assets/${assetId}/dispose`)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Asset</CardTitle>
                <CardDescription>Data dasar asset yang terdaftar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Hash className="w-4 h-4" />
                      <span>Asset ID</span>
                    </div>
                    <p className="font-medium">{asset.assetId}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <FileText className="w-4 h-4" />
                      <span>Kategori</span>
                    </div>
                    <p className="font-medium capitalize">{asset.category}</p>
                  </div>

                  <div className={`space-y-1 ${recentlyUpdated ? 'ring-2 ring-success/40 rounded-lg p-2 animate-fade-in' : ''}`}>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <User className="w-4 h-4" />
                      <span>Pemegang Saat Ini</span>
                    </div>
                    <p className="font-medium">{asset.ownerName}</p>
                  </div>

                  <div className={`space-y-1 ${recentlyUpdated ? 'ring-2 ring-success/40 rounded-lg p-2 animate-fade-in' : ''}`}>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>Lokasi</span>
                    </div>
                    <p className="font-medium">{asset.locationDetail}</p>
                  </div>
                </div>

                {asset.description && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Deskripsi</p>
                      <p>{asset.description}</p>
                    </div>
                  </>
                )}

                {asset.serialNumber && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Serial Number</p>
                    <p className="font-mono">{asset.serialNumber}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Acquisition Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Perolehan</CardTitle>
                <CardDescription>Data pembelian dan nilai asset</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>Tanggal Perolehan</span>
                    </div>
                    <p className="font-medium">{formatDate(asset.acquisitionDate)}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <DollarSign className="w-4 h-4" />
                      <span>Harga Perolehan</span>
                    </div>
                    <p className="font-medium text-lg">{formatCurrency(asset.acquisitionPrice)}</p>
                  </div>

                  {asset.vendor && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Vendor/Supplier</p>
                      <p className="font-medium">{asset.vendor}</p>
                    </div>
                  )}

                  {asset.invoiceNumber && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">No. Invoice</p>
                      <p className="font-mono">{asset.invoiceNumber}</p>
                    </div>
                  )}
                </div>

                {totalMaintenanceCost > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Total Biaya Maintenance</span>
                      <span className="font-semibold">{formatCurrency(totalMaintenanceCost)}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Blockchain Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Blocks className="w-5 h-5" />
                  Informasi Blockchain
                </CardTitle>
                <CardDescription>Data transaksi di Hyperledger Fabric</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Transaction ID</span>
                    <code className="text-xs font-mono">
                      {asset.txId?.slice(0, 16)}...{asset.txId?.slice(-8)}
                    </code>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Block Number</span>
                    <span className="font-mono">#{asset.blockNumber}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Dibuat</span>
                    <span>{formatDate(asset.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Terakhir Diperbarui</span>
                    <span>{formatDate(asset.updatedAt)}</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => navigate(`/assets/${assetId}/history`)}
                >
                  <History className="w-4 h-4 mr-2" />
                  Lihat Riwayat Lengkap di Blockchain
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Dokumen</CardTitle>
                <CardDescription>Invoice, BA, dan dokumen pendukung</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isAdmin && asset && (
                  <div className="space-y-2">
                    <FileUploader accept=".pdf,.jpg,.jpeg,.png,.webp" multiple maxSizeMB={5} onFilesSelected={(files) => {
                      files.forEach(async (f) => {
                        const type = f.type?.includes('image') ? 'image' : 'invoice';
                        await uploadAssetDocumentFile(asset.assetId, f, type);
                        qc.invalidateQueries({ queryKey: ['asset', asset.assetId, 'documents'] });
                      });
                    }} />
                    <p className="text-xs text-muted-foreground">Dokumen diunggah ke server; server akan menyimpan ke IPFS dan mengembalikan CID.</p>
                    <Separator />
                  </div>
                )}
                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada dokumen.</p>
                ) : (
                  <Tabs defaultValue="all" className="w-full">
                    <div className="w-full overflow-x-auto">
                      <TabsList className="w-max">
                        <TabsTrigger className="shrink-0" value="all">Semua</TabsTrigger>
                        <TabsTrigger className="shrink-0" value="handover_borrow">Foto Serah Terima</TabsTrigger>
                        <TabsTrigger className="shrink-0" value="handover_return">Foto Pengembalian</TabsTrigger>
                        <TabsTrigger className="shrink-0" value="others">Lainnya</TabsTrigger>
                      </TabsList>
                    </div>
                    <TabsContent value="all">
                      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                        {documents.map((d) => (
                          <DocumentCard key={d.id} fileName={d.fileName} cid={d.ipfsCid} hash={d.hashSha256} type={d.type as any} />
                        ))}
                      </div>
                    </TabsContent>
                    <TabsContent value="handover_borrow">
                      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                        {documents.filter((d) => d.type === 'handover_borrow').map((d) => (
                          <DocumentCard key={d.id} fileName={d.fileName} cid={d.ipfsCid} hash={d.hashSha256} type={d.type as any} />
                        ))}
                        {documents.filter((d) => d.type === 'handover_borrow').length === 0 && (
                          <p className="text-sm text-muted-foreground">Tidak ada foto serah terima.</p>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="handover_return">
                      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                        {documents.filter((d) => d.type === 'handover_return').map((d) => (
                          <DocumentCard key={d.id} fileName={d.fileName} cid={d.ipfsCid} hash={d.hashSha256} type={d.type as any} />
                        ))}
                        {documents.filter((d) => d.type === 'handover_return').length === 0 && (
                          <p className="text-sm text-muted-foreground">Tidak ada foto pengembalian.</p>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="others">
                      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                        {documents.filter((d) => d.type !== 'handover_borrow' && d.type !== 'handover_return').map((d) => (
                          <DocumentCard key={d.id} fileName={d.fileName} cid={d.ipfsCid} hash={d.hashSha256} type={d.type as any} />
                        ))}
                        {documents.filter((d) => d.type !== 'handover_borrow' && d.type !== 'handover_return').length === 0 && (
                          <p className="text-sm text-muted-foreground">Tidak ada dokumen lainnya.</p>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
            {/* QR Code */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  QR Code
                </CardTitle>
                <CardDescription>
                  Scan untuk akses cepat ke informasi asset
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AssetQRCode
                  assetId={asset.assetId}
                  assetName={asset.name}
                  size={160}
                />
              </CardContent>
            </Card>

            {/* Recent Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline Terbaru</CardTitle>
                <CardDescription>3 aktivitas terakhir</CardDescription>
              </CardHeader>
              <CardContent>
                {recentHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Belum ada riwayat
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recentHistory.map((event, index) => (
                      <div key={event.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          {index < recentHistory.length - 1 && (
                            <div className="w-px h-full bg-border" />
                          )}
                        </div>
                        <div className="pb-4">
                          <p className="text-sm font-medium capitalize">
                            {event.eventType.replace("_", " ")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(event.date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  variant="link"
                  className="w-full p-0 h-auto"
                  onClick={() => navigate(`/assets/${assetId}/history`)}
                >
                  Lihat semua riwayat
                </Button>
              </CardContent>
            </Card>

            {/* Maintenance Summary */}
            {maintenanceRecords.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Riwayat Maintenance</CardTitle>
                  <CardDescription>{maintenanceRecords.length} catatan</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {maintenanceRecords.slice(0, 3).map((record) => (
                      <div
                        key={record.id}
                        className="p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium capitalize">{record.type}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(record.date)}
                            </p>
                          </div>
                          <span className="text-sm font-medium">
                            {formatCurrency(record.cost)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
