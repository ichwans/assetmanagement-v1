import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  ArrowLeftRight,
  Wrench,
  Trash2,
  History,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from '@tanstack/react-query';
import { listAssets, type ListAssetsQuery } from '@/lib/api/assets';
import { listCategories, listLocations } from '@/lib/api/meta';
import { AssetStatus } from "@/types";

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
    maximumFractionDigits: 0,
  }).format(value);
};

export default function Assets() {
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const isAuditor = user?.role === 'auditor';
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  // Default filter for auditor: show ACTIVE assets initially
  useEffect(() => {
    if (isAuditor && statusFilter === 'all') {
      setStatusFilter('active');
    }
  }, [isAuditor]);

  const assetQueryParams = useMemo(() => {
    const params: ListAssetsQuery = {
      page: currentPage,
      limit: itemsPerPage,
    };
    const search = searchQuery.trim();
    if (search) params.search = search;
    if (statusFilter !== 'all') params.status = statusFilter;
    if (categoryFilter !== 'all') params.category = categoryFilter;
    if (locationFilter !== 'all') params.location = locationFilter;
    return params;
  }, [currentPage, itemsPerPage, searchQuery, statusFilter, categoryFilter, locationFilter]);

  const { data: assetsResp, isFetching } = useQuery({
    queryKey: ['assets', assetQueryParams],
    queryFn: () => listAssets(assetQueryParams),
    keepPreviousData: true,
  });
  const { data: categoriesResp } = useQuery({ queryKey: ['categories'], queryFn: listCategories });
  const { data: locationsResp } = useQuery({ queryKey: ['locations'], queryFn: listLocations });

  const assets = (assetsResp?.data?.results ?? []) as typeof import('@/types').Asset[];
  const pagination = assetsResp?.data?.pagination ?? { page: currentPage, totalPages: 1, totalItems: assets.length, limit: itemsPerPage, hasNext: false, hasPrevious: false };
  const categories = (categoriesResp?.data ?? []) as typeof import('@/types').Category[];
  const locations = (locationsResp?.data ?? []) as typeof import('@/types').Location[];

  const paginatedAssets = assets;
  const totalPages = pagination.totalPages || 1;

  const isSelectedOnPage = (id: string) => selectedIds.has(id);
  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const allOnPageSelected = paginatedAssets.length > 0 && paginatedAssets.every((a) => selectedIds.has(a.assetId));
  const someOnPageSelected = paginatedAssets.some((a) => selectedIds.has(a.assetId));
  const toggleAllOnPage = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      paginatedAssets.forEach((a) => {
        if (checked) next.add(a.assetId);
        else next.delete(a.assetId);
      });
      return next;
    });
  };
  const clearSelection = () => setSelectedIds(new Set());
  const selectedAssets = assets.filter((a) => selectedIds.has(a.assetId));

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Daftar Asset</h1>
            <p className="text-muted-foreground">
              Kelola dan pantau semua asset organisasi
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => navigate("/assets/create")}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Asset
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari asset, ID, atau pemilik..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(val) => {
                setCategoryFilter(val);
                setCurrentPage(1);
              }}
              >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={locationFilter}
              onValueChange={(val) => {
                setLocationFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Lokasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Lokasi</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="borrowed">Dipinjam</SelectItem>
                <SelectItem value="maintenance">Perbaikan</SelectItem>
                <SelectItem value="disposed">Dihapus</SelectItem>
                <SelectItem value="transfer_pending">Menunggu Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Selection Toolbar (Admin only) */}
        {isAdmin && selectedIds.size > 0 && (
          <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
            <p className="text-sm">
              <span className="font-medium">{selectedIds.size}</span> asset dipilih
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setQrDialogOpen(true)}>
                Generate QR Batch
              </Button>
              <Button variant="ghost" onClick={clearSelection}>Clear</Button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {isAdmin && (
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allOnPageSelected}
                        onCheckedChange={(v) => toggleAllOnPage(Boolean(v))}
                        aria-label="Select all on page"
                        indeterminate={!allOnPageSelected && someOnPageSelected}
                      />
                    </TableHead>
                  )}
                  <TableHead className="font-semibold">Asset ID</TableHead>
                  <TableHead className="font-semibold">Nama Asset</TableHead>
                  <TableHead className="font-semibold">Kategori</TableHead>
                  <TableHead className="font-semibold">Pemegang</TableHead>
                  <TableHead className="font-semibold">Lokasi</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Nilai</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAssets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 9 : 8} className="h-24 text-center">
                      <p className="text-muted-foreground">Tidak ada asset ditemukan</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedAssets.map((asset) => (
                    <TableRow
                      key={asset.assetId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/assets/${asset.assetId}`)}
                    >
                      {isAdmin && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelectedOnPage(asset.assetId)}
                            onCheckedChange={() => toggleRow(asset.assetId)}
                            aria-label={`Select ${asset.assetId}`}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">{asset.assetId}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{asset.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(asset.updatedAt).toLocaleDateString("id-ID")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{asset.category}</TableCell>
                      <TableCell>{asset.ownerName}</TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {asset.locationDetail}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig[asset.status].className}>
                          {statusConfig[asset.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(asset.acquisitionPrice)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/assets/${asset.assetId}`)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/assets/${asset.assetId}/history`)}>
                              <History className="w-4 h-4 mr-2" />
                              Lihat History
                            </DropdownMenuItem>
                            {isAdmin && asset.status !== "disposed" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate(`/assets/${asset.assetId}/transfer`)}>
                                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                                  Transfer
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/assets/${asset.assetId}/maintenance`)}>
                                  <Wrench className="w-4 h-4 mr-2" />
                                  Maintenance
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => navigate(`/assets/${asset.assetId}/dispose`)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Hapus Asset
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Menampilkan <span className="font-medium">{paginatedAssets.length}</span> dari <span className="font-medium">{pagination.totalItems}</span> asset
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPrevious}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Sebelumnya
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                {pagination.page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNext}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        </div>

        {/* QR Batch Dialog */}
        <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate QR Code Batch</DialogTitle>
              <DialogDescription>
                Placeholder untuk batch QR. Fitur download akan diintegrasikan saat backend/QR siap.
              </DialogDescription>
            </DialogHeader>
            {selectedAssets.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada asset yang dipilih.</p>
            ) : (
              <div className="max-h-60 overflow-auto border rounded-md p-3">
                <ul className="text-sm space-y-2">
                  {selectedAssets.map((a) => (
                    <li key={a.assetId} className="flex items-center justify-between">
                      <span className="font-medium">{a.assetId}</span>
                      <span className="truncate ml-2 text-muted-foreground">{a.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setQrDialogOpen(false)}>
                Tutup
              </Button>
              <Button disabled={selectedAssets.length === 0} onClick={() => setQrDialogOpen(false)}>
                Download Batch (Mock)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
