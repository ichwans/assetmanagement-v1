import { useNavigate } from "react-router-dom";
import { Package, ArrowLeftRight, Wrench, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from '@tanstack/react-query';
import { getRecentActivity } from '@/lib/api/dashboard';
import type { AssetHistoryEvent } from "@/types";

const activityConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  create: { icon: Package, label: "Asset Baru", color: "bg-success/10 text-success" },
  transfer: { icon: ArrowLeftRight, label: "Transfer", color: "bg-info/10 text-info" },
  maintenance: { icon: Wrench, label: "Maintenance", color: "bg-warning/10 text-warning" },
  dispose: { icon: Trash2, label: "Dihapus", color: "bg-destructive/10 text-destructive" },
  assign: { icon: ArrowLeftRight, label: "Penugasan", color: "bg-info/10 text-info" },
  return: { icon: ArrowLeftRight, label: "Pengembalian", color: "bg-info/10 text-info" },
};

const formatTimeAgo = (dateString: string) => {
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

export const RecentActivity = () => {
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ['dashboard','recent-activity',5], queryFn: () => getRecentActivity(5) });
  const transactions = (data?.data ?? []) as AssetHistoryEvent[];

  return (
    <div className="bg-card rounded-xl border border-border shadow-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">Aktivitas Terbaru</h2>
        <button
          onClick={() => navigate("/explorer")}
          className="text-sm font-medium text-accent hover:text-accent/80 transition-colors"
        >
          Lihat semua
        </button>
      </div>

      <div className="space-y-4">
        {transactions.map((tx, index) => {
          const key = (tx.eventType || '').toLowerCase();
          const config = activityConfig[key] || activityConfig['transfer'];
          const Icon = config.icon;

          return (
            <div
              key={tx.txId}
              className={cn(
                "flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer",
                "animate-slide-in"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => navigate(`/assets/${tx.assetId}`)}
            >
              <div className={cn("p-2 rounded-lg shrink-0", config.color)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{config.label}</p>
                <p className="text-sm text-muted-foreground truncate">{tx.description || tx.assetId}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatTimeAgo(tx.date)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
