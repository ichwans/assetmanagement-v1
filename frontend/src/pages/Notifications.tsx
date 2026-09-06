import { useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listNotifications, markAllRead, markRead, type NotificationItem, type NotificationListResponse } from "@/lib/api/notifications";
import { getErrorMessage } from "@/lib/api/http";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bell, ArrowLeftRight, Wrench, Package, Check, ExternalLink } from "lucide-react";

const typeOptions = ["all", "transfer", "maintenance", "asset", "approval", "system"] as const;

const notificationIcons: Record<string, React.ElementType> = {
  transfer: ArrowLeftRight,
  maintenance: Wrench,
  asset: Package,
  approval: Check,
  system: Bell,
};

export default function Notifications() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [type, setType] = useState<(typeof typeOptions)[number]>("all");
  const [read, setRead] = useState<"all" | "true" | "false">("all");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const queryParams = useMemo(() => ({
    page,
    limit,
    type: type === "all" ? undefined : type,
    read: read === "all" ? undefined : read,
  }), [page, limit, type, read]);

  const { data, isFetching } = useQuery<NotificationListResponse>({
    queryKey: ["notifications", queryParams],
    queryFn: () => listNotifications(queryParams as any),
    keepPreviousData: true,
  });

  const items = data?.results ?? [];
  const pagination = data?.pagination ?? { page: 1, totalPages: 1, totalItems: 0, limit, hasNext: false, hasPrevious: false };

  const allSelectedOnPage = items.length > 0 && items.every((n) => !!selected[n.id]);
  const toggleSelectAll = (checked: boolean) => {
    const next = { ...selected };
    for (const n of items) next[n.id] = checked;
    setSelected(next);
  };

  const handleMarkSelectedRead = async () => {
    const ids = Object.keys(selected).filter((k) => selected[k]);
    if (ids.length === 0) return;
    try {
      await markRead(ids);
      toast.success("Notifikasi ditandai telah dibaca");
      setSelected({});
      await qc.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      toast.success("Semua notifikasi ditandai telah dibaca");
      setSelected({});
      await qc.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const timeAgo = (dateStr: string) => {
    const d = new Date(dateStr);
    const diffMs = Date.now() - d.getTime();
    const sec = Math.floor(diffMs / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);
    if (sec < 60) return `${sec} detik lalu`;
    if (min < 60) return `${min} menit lalu`;
    if (hr < 24) return `${hr} jam lalu`;
    if (day < 7) return `${day} hari lalu`;
    return d.toLocaleString('id-ID');
  };

  const handleRowClick = async (n: NotificationItem) => {
    try {
      if (!n.read) {
        await markRead([n.id]);
        await qc.invalidateQueries({ queryKey: ["notifications"] });
      }
    } catch {}
    if (n.link) {
      if (n.link.startsWith('http')) {
        window.open(n.link, '_blank');
      } else {
        window.location.href = n.link;
      }
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Notifikasi</h1>
            <p className="text-muted-foreground">Lihat dan kelola pemberitahuan sistem</p>
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => qc.invalidateQueries({ queryKey: ["notifications"] })} disabled={isFetching}>
              Muat Ulang
            </Button>
            <Button variant="outline" onClick={handleMarkSelectedRead} disabled={Object.keys(selected).every((k) => !selected[k])}>
              Tandai Terpilih Dibaca
            </Button>
            <Button onClick={handleMarkAllRead} variant="secondary">Tandai Semua Dibaca</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Notifikasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Tipe</span>
                <Select value={type} onValueChange={(v) => { setType(v as any); setPage(1); }}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((t) => (
                      <SelectItem key={t} value={t}>{t === 'all' ? 'Semua' : t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status</span>
                <Select value={read} onValueChange={(v) => { setRead(v as any); setPage(1); }}>
                  <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="false">Belum dibaca</SelectItem>
                    <SelectItem value="true">Sudah dibaca</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Per halaman</span>
                <Select value={String(limit)} onValueChange={(v) => { setLimit(parseInt(v, 10)); setPage(1); }}>
                  <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={allSelectedOnPage} onCheckedChange={(v) => toggleSelectAll(!!v)} />
                    </TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead>Pesan</TableHead>
                    <TableHead>Dibaca</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">Tidak ada notifikasi</TableCell>
                    </TableRow>
                  ) : (
                    items.map((n) => {
                      const Icon = notificationIcons[n.type] || Bell;
                      return (
                        <TableRow key={n.id} className={!n.read ? "bg-primary/5 cursor-pointer" : "cursor-pointer"} onClick={() => handleRowClick(n)}>
                          <TableCell>
                            <Checkbox checked={!!selected[n.id]} onCheckedChange={(v) => setSelected((s) => ({ ...s, [n.id]: !!v }))} />
                          </TableCell>
                          <TableCell>
                            <div className="inline-flex items-center gap-2">
                              <span className="p-2 rounded-md bg-muted"><Icon className="w-4 h-4" /></span>
                              <span className="capitalize">{n.type}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{n.title}</TableCell>
                          <TableCell className="text-muted-foreground">{n.message}</TableCell>
                          <TableCell>
                            <Badge variant={n.read ? 'secondary' : 'default'}>{n.read ? 'Sudah' : 'Belum'}</Badge>
                          </TableCell>
                          <TableCell>{timeAgo(n.createdAt)}</TableCell>
                          <TableCell className="text-right space-x-2">
                            {n.link && (
                              <Button asChild size="sm" variant="outline">
                                <a href={n.link} target="_blank" rel="noreferrer">
                                  <ExternalLink className="w-4 h-4 mr-1" /> Buka
                                </a>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Halaman {pagination.page} dari {pagination.totalPages} • Total {pagination.totalItems}
              </p>
              <div className="space-x-2">
                <Button variant="outline" size="sm" disabled={!pagination.hasPrevious} onClick={() => setPage((p) => Math.max(1, p - 1))}>Sebelumnya</Button>
                <Button variant="outline" size="sm" disabled={!pagination.hasNext} onClick={() => setPage((p) => p + 1)}>Berikutnya</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
