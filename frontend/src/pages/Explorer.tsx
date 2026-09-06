import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Search,
  Blocks,
  ArrowLeftRight,
  Wrench,
  Package,
  Trash2,
  MapPin,
  Undo2,
  ExternalLink,
  Server,
  Database,
  Activity,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getExplorerSummary, getExplorerTx, getExplorerBlockByTx } from "@/lib/api/dashboard";
import { getGatewayHealth } from "@/lib/api/gateway";
import type { AssetHistoryEvent, HistoryEventType } from "@/types";

const typeConfig: Record<HistoryEventType, { icon: React.ElementType; label: string; color: string }> = {
  create: { icon: Package, label: "Create", color: "bg-success/10 text-success" },
  transfer: { icon: ArrowLeftRight, label: "Transfer", color: "bg-info/10 text-info" },
  maintenance: { icon: Wrench, label: "Maintenance", color: "bg-warning/10 text-warning" },
  dispose: { icon: Trash2, label: "Dispose", color: "bg-destructive/10 text-destructive" },
  assign: { icon: MapPin, label: "Assign", color: "bg-muted text-foreground" },
  return: { icon: Undo2, label: "Return", color: "bg-muted text-foreground" },
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 7) return `${days} hari lalu`;
  return date.toLocaleDateString("id-ID");
};

export default function Explorer() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const [selectedTx, setSelectedTx] = useState<AssetHistoryEvent | null>(null);
  const location = useLocation();
  const { data: summaryResp } = useQuery({ queryKey: ["explorer","summary"], queryFn: () => getExplorerSummary(50, 5) });
  const { data: health } = useQuery({ queryKey: ["gateway","health"], queryFn: getGatewayHealth, refetchInterval: 30000 });
  const summary = summaryResp?.data as any;
  const networkStats = {
    peers: summary?.network?.peers ?? 0,
    orderers: summary?.network?.orderers ?? 0,
    channels: 1,
    chaincodes: 1,
    totalBlocks: summary?.network?.height ? Number(summary.network.height) : 0,
    totalTransactions: (summary?.recentEvents ?? []).length,
  };
  const transactions = (summary?.recentEvents ?? []).map((ev: any) => ({
    id: ev.txId,
    txId: ev.txId,
    eventType: (ev.kind === 'asset_state' ? 'create' : ev.kind) as HistoryEventType,
    assetId: ev.assetId,
    blockNumber: ev.blockNumber || '-',
    date: ev.date,
    description: '',
    details: {},
  })) as AssetHistoryEvent[];
  const filteredTransactions = transactions.filter((tx) =>
    tx.txId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.assetId?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const { data: txDetailResp } = useQuery({
    enabled: !!selectedTx?.txId,
    queryKey: ["explorer","tx", selectedTx?.txId],
    queryFn: async () => {
      const [tx, blk] = await Promise.all([
        getExplorerTx(selectedTx!.txId),
        getExplorerBlockByTx(selectedTx!.txId),
      ]);
      return { tx: tx.data, block: blk.data };
    },
  });
  // Deep link support: ?txId=...
  const txParam = new URLSearchParams(location.search).get('txId');
  const { data: deepTx } = useQuery({
    enabled: !!txParam,
    queryKey: ["explorer","tx","deeplink", txParam],
    queryFn: async () => {
      if (!txParam) return null;
      const [tx, blk] = await Promise.all([
        getExplorerTx(txParam),
        getExplorerBlockByTx(txParam),
      ]);
      return { tx: tx.data, block: blk.data };
    },
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Blocks className="w-6 h-6" />
            Blockchain Explorer
          </h1>
          <p className="text-muted-foreground">
            Jelajahi transaksi dan data di Hyperledger Fabric
          </p>
        </div>

        {/* Network Info */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{networkStats.peers}</p>
                  <p className="text-xs text-muted-foreground">Peers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{networkStats.orderers}</p>
                  <p className="text-xs text-muted-foreground">Orderer</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Blocks className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{networkStats.totalBlocks}</p>
                  <p className="text-xs text-muted-foreground">Blocks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{networkStats.totalTransactions}</p>
                  <p className="text-xs text-muted-foreground">Transactions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <div>
                  <p className="text-sm font-medium">Gateway</p>
                  <p className={`text-xs ${health?.status === 'ok' ? 'text-success' : 'text-destructive'}`}>
                    {health?.status === 'ok' ? 'Healthy' : 'Down'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div>
                <p className="text-sm font-medium">Organization</p>
                <p className="text-xs text-muted-foreground">Org1MSP</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Latest Blocks Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Block Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {(summary?.latestBlocks ?? []).map((b: any) => (
                <div key={b.number} className="min-w-[150px] p-4 bg-muted/50 rounded-lg border">
                  <p className="font-mono font-bold">#{b.number}</p>
                  <p className="text-xs text-muted-foreground">{b.txCount} txns</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari Transaction ID, Asset ID, atau nama asset..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-9"
          />
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Transaksi</CardTitle>
            <CardDescription>
              Semua transaksi yang tercatat di blockchain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Block</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <p className="text-muted-foreground">Tidak ada transaksi ditemukan</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTransactions.map((tx) => {
                      const config = typeConfig[tx.eventType];
                      const Icon = config.icon;

                      return (
                        <TableRow key={tx.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell>
                            <code className="text-xs font-mono">
                              {tx.txId.slice(3, 11)}...{tx.txId.slice(-6)}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge className={config.color}>
                              <Icon className="w-3 h-3 mr-1" />
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{tx.assetId}</p>
                              {tx.description && (
                                <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                  {tx.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono">#{tx.blockNumber}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{formatDate(tx.date)}</span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedTx(tx)}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                            {import.meta.env.VITE_EXPLORER_URL && (
                              <a href={import.meta.env.VITE_EXPLORER_URL as string} target="_blank" rel="noreferrer" className="ml-2 text-xs underline">Explorer</a>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Pagination */}
            <div className="pt-4 border-t border-border flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Menampilkan <span className="font-medium">{paginatedTransactions.length}</span> dari <span className="font-medium">{filteredTransactions.length}</span> transaksi
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Sebelumnya
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Detail Dialog */}
        <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Blocks className="w-5 h-5" />
                Detail Transaksi
              </DialogTitle>
              <DialogDescription>
                Informasi lengkap transaksi blockchain
              </DialogDescription>
            </DialogHeader>
            {selectedTx && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Transaction ID</p>
                    <code className="text-xs font-mono break-all">{selectedTx.txId}</code>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Block Number</p>
                    <p className="font-mono">#{selectedTx.blockNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Event</p>
                    <Badge className={typeConfig[selectedTx.eventType].color}>
                      {selectedTx.eventType}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Timestamp</p>
                    <p>{new Date(selectedTx.date).toLocaleString("id-ID")}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">QSCC Detail</p>
                    <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-[200px]">
                      {JSON.stringify(txDetailResp?.tx ?? {}, null, 2)}
                    </pre>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Block Lookup</p>
                    <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-[200px]">
                      {JSON.stringify(txDetailResp?.block ?? {}, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/assets/${selectedTx.assetId}`)}
                  >
                    Lihat Asset
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
      {/* Deep Link Dialog */}
      <Dialog open={!!txParam} onOpenChange={() => { /* no-op for now */ }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Blocks className="w-5 h-5" />
              Detail Transaksi (Deep Link)
            </DialogTitle>
            <DialogDescription>QSCC detail dan block lookup</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">QSCC Detail</p>
              <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-[200px]">
                {JSON.stringify(deepTx?.tx ?? {}, null, 2)}
              </pre>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Block Lookup</p>
              <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-[200px]">
                {JSON.stringify(deepTx?.block ?? {}, null, 2)}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
