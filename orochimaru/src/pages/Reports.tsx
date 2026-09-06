import { useMemo, useState } from "react";
import {
  FileText,
  ArrowLeftRight,
  Wrench,
  Trash2,
  DollarSign,
  Users,
  Download,
  Printer,
  Calendar,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listAssets } from "@/lib/api/assets";
import { getDashboardStats } from "@/lib/api/dashboard";
import { listCategories } from "@/lib/api/meta";
import { toast } from "sonner";

const reportTypes = [
  {
    id: "asset-list",
    title: "Daftar Asset",
    description: "Laporan semua asset keseluruhan",
    icon: FileText,
  },
  {
    id: "transfer-history",
    title: "Riwayat Transfer",
    description: "Laporan serah terima asset",
    icon: ArrowLeftRight,
  },
  {
    id: "maintenance-log",
    title: "Log Maintenance",
    description: "Laporan perbaikan dan service",
    icon: Wrench,
  },
  {
    id: "disposed-assets",
    title: "Asset Dihapus",
    description: "Laporan asset yang sudah tidak aktif",
    icon: Trash2,
  },
  {
    id: "asset-value",
    title: "Nilai Asset",
    description: "Laporan nilai perolehan asset",
    icon: DollarSign,
  },
  {
    id: "asset-per-staff",
    title: "Asset per Staff",
    description: "Laporan distribusi asset",
    icon: Users,
  },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: statsResp } = useQuery({ queryKey: ["dashboard","stats"], queryFn: getDashboardStats });
  const stats = statsResp?.data ?? { totalAssets: 0, activeAssets: 0, borrowedAssets: 0, maintenanceAssets: 0, disposedAssets: 0, totalValue: 0 };
  const { data: catsResp } = useQuery({ queryKey: ["meta","categories"], queryFn: listCategories });
  const { data: assetsResp } = useQuery({
    queryKey: ["assets","reports", { category: categoryFilter, status: statusFilter }],
    queryFn: () => listAssets({ limit: 5, page: 1, category: categoryFilter === 'all' ? undefined : categoryFilter, status: statusFilter === 'all' ? undefined : statusFilter }),
  });

  const handleGenerateReport = () => {
    if (!selectedReport) {
      toast.error("Pilih jenis laporan terlebih dahulu");
      return;
    }
    toast.success("Laporan berhasil di-generate (demo)");
  };

  const handleExportPDF = () => {
    toast.success("Export PDF berhasil (demo)");
  };

  const handleExportCSV = () => {
    const rows = previewData;
    if (!rows || rows.length === 0) { toast.error('Tidak ada data untuk diexport'); return; }
    const headers = ['assetId','name','category','ownerName','location','status','acquisitionDate','acquisitionPrice'];
    const csv = [headers.join(',')].concat(
      rows.map(r => [r.assetId, r.name, r.category, (r.ownerName||'').replaceAll(',',' '), r.location, r.status, r.acquisitionDate, r.acquisitionPrice].join(','))
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${selectedReport || 'assets'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Sample data for preview
  const previewData = useMemo(() => (assetsResp?.data?.results ?? []) as typeof import("@/types").Asset[], [assetsResp]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Laporan Asset</h1>
          <p className="text-muted-foreground">
            Generate dan unduh laporan asset dalam berbagai format
          </p>
        </div>

        {/* Report Type Selection */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Pilih Jenis Laporan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              const isSelected = selectedReport === report.id;

              return (
                <Card
                  key={report.id}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/20"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedReport(report.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">{report.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {report.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Filter Laporan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Dari Tanggal</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Sampai Tanggal</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {(catsResp?.data ?? []).map((cat) => (
                      <SelectItem key={cat.slug} value={cat.slug}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="borrowed">Dipinjam</SelectItem>
                    <SelectItem value="maintenance">Perbaikan</SelectItem>
                    <SelectItem value="disposed">Dihapus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Button onClick={handleGenerateReport}>Generate Laporan</Button>
              <Button variant="outline" onClick={handleExportCSV}><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {selectedReport && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Preview Laporan</CardTitle>
                  <CardDescription>
                    Menampilkan 5 data pertama sebagai preview
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportPDF}>
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportExcel}>
                    <Download className="w-4 h-4 mr-2" />
                    Excel
                  </Button>
                  <Button variant="outline" size="sm">
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset ID</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Pemegang</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Nilai</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((asset) => (
                      <TableRow key={asset.assetId}>
                        <TableCell className="font-mono">{asset.assetId}</TableCell>
                        <TableCell>{asset.name}</TableCell>
                        <TableCell className="capitalize">{asset.category}</TableCell>
                        <TableCell>{asset.ownerName}</TableCell>
                        <TableCell className="capitalize">{asset.status}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(asset.acquisitionPrice)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-3">Ringkasan</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Asset</p>
                    <p className="text-xl font-bold">{stats.totalAssets}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Asset Aktif</p>
                    <p className="text-xl font-bold">{stats.activeAssets}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Dipinjam</p>
                    <p className="text-xl font-bold">{stats.borrowedAssets}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Nilai</p>
                    <p className="text-xl font-bold">{formatCurrency(stats.totalValue)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
