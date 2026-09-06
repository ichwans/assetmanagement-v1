import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Wrench, Archive } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { listAssets } from '@/lib/api/assets';

const statusConfig: Record<string, { label: string; className: string }> = {
  maintenance: { label: "Perbaikan", className: "bg-warning/10 text-warning border-warning/20" },
  borrowed: { label: "Dipinjam", className: "bg-info/10 text-info border-info/20" },
};

export function AttentionList() {
  const { data: maint } = useQuery({ queryKey: ['assets','status','maintenance', { limit: 5 }], queryFn: () => listAssets({ status: 'maintenance', page: 1, limit: 5 }) });
  const { data: borr } = useQuery({ queryKey: ['assets','status','borrowed', { limit: 5 }], queryFn: () => listAssets({ status: 'borrowed', page: 1, limit: 5 }) });

  const maintenance = (maint?.data?.results ?? []) as typeof import('@/types').Asset[];
  const borrowed = (borr?.data?.results ?? []) as typeof import('@/types').Asset[];
  const maintenanceCount = maint?.data?.pagination?.totalItems ?? maintenance.length;
  const borrowedCount = borr?.data?.pagination?.totalItems ?? borrowed.length;
  const critical = [...maintenance, ...borrowed].slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" /> Perlu Perhatian
        </CardTitle>
        <CardDescription>Asset dalam perbaikan atau dipinjam</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1">
            <Wrench className="w-4 h-4 text-warning" />
            <span>{maintenanceCount} perbaikan</span>
          </div>
          <div className="flex items-center gap-1">
            <Archive className="w-4 h-4 text-info" />
            <span>{borrowedCount} dipinjam</span>
          </div>
        </div>

        {critical.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada asset yang membutuhkan perhatian.</p>
        ) : (
          <ul className="space-y-3">
            {critical.map((a) => (
              <li key={a.assetId} className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-medium truncate">{a.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.assetId} • {a.locationDetail}</p>
                </div>
                <Badge className={statusConfig[a.status].className}>{statusConfig[a.status].label}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
