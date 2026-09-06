import { MoreHorizontal, Search, Filter, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from '@tanstack/react-query';
import { listAssets } from '@/lib/api/assets';
import type { Asset } from '@/types';
import { useEffect, useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AssetStatus = 'active' | 'maintenance' | 'borrowed' | 'disposed';

const statusStyles: Record<AssetStatus, string> = {
  active: "bg-success/10 text-success border-success/20",
  maintenance: "bg-warning/10 text-warning border-warning/20",
  borrowed: "bg-info/10 text-info border-info/20",
  disposed: "bg-muted text-muted-foreground border-border",
};

const StatusBadge = ({ status }: { status: AssetStatus }) => (
  <span
    className={cn(
      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border capitalize",
      statusStyles[status]
    )}
  >
    <span className={cn(
      "w-1.5 h-1.5 rounded-full mr-1.5",
      status === "active" && "bg-success",
      status === "maintenance" && "bg-warning",
      status === "disposed" && "bg-muted-foreground",
      status === "borrowed" && "bg-info"
    )} />
    {status}
  </span>
);

export const AssetTable = () => {
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [search, setSearch] = useState<string>('');
  const [debounced, setDebounced] = useState<string>('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data } = useQuery({
    queryKey: ['assets', { page, limit, search: debounced }],
    queryFn: () => listAssets({ page, limit, search: debounced || undefined }),
  });

  const rows = (data?.data?.results ?? []) as Asset[];
  const pg = data?.data?.pagination ?? { page: 1, limit, totalItems: rows.length, totalPages: 1, hasNext: false, hasPrevious: false };

  const start = (pg.page - 1) * pg.limit + 1;
  const end = Math.min(pg.page * pg.limit, pg.totalItems || 0);

  return (
    <div className="bg-card rounded-xl border border-border shadow-card animate-fade-in">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Assets Overview</h2>
            <p className="text-sm text-muted-foreground">Manage and track all company assets</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                className="pl-9 w-64 bg-muted/50 border-border focus:bg-card"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Button variant="outline" size="icon" className="shrink-0">
              <Filter className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="shrink-0">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-muted-foreground font-semibold">Asset ID</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Name</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Category</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Assigned To</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Location</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Status</TableHead>
              <TableHead className="text-muted-foreground font-semibold text-right">Value</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((asset) => (
              <TableRow
                key={asset.assetId}
                className="border-border hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <TableCell className="font-medium text-foreground">{asset.assetId}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{asset.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(asset.updatedAt).toLocaleString()}</p>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground capitalize">{asset.category}</TableCell>
                <TableCell className="text-muted-foreground">{asset.ownerName}</TableCell>
                <TableCell className="text-muted-foreground">{asset.locationDetail}</TableCell>
                <TableCell>
                  <StatusBadge status={asset.status as AssetStatus} />
                </TableCell>
                <TableCell className="text-right font-medium text-foreground">
                  Rp {asset.acquisitionPrice.toLocaleString('id-ID')}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{rows.length ? start : 0}-{rows.length ? end : 0}</span> of{" "}
          <span className="font-medium text-foreground">{pg.totalItems || 0}</span> assets
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={!pg.hasPrevious} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={!pg.hasNext} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
