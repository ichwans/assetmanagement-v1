import { Package, Monitor, Wrench, Archive, DollarSign, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { AssetTable } from "@/components/dashboard/AssetTable";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { AttentionList } from "@/components/dashboard/AttentionList";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from '@tanstack/react-query';
import { listAssets } from '@/lib/api/assets';
import { getDashboardStats } from '@/lib/api/dashboard';
import { Button } from "@/components/ui/button";
import { AssetsByCategoryChart } from "@/components/dashboard/AssetsByCategoryChart";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { data: statsResp } = useQuery({ queryKey: ['dashboard','stats'], queryFn: getDashboardStats });
  const stats = statsResp?.data || { totalAssets: 0, activeAssets: 0, borrowedAssets: 0, maintenanceAssets: 0, disposedAssets: 0, totalValue: 0 };

  // For staff, show their own assets
  const { data: assetsResp } = useQuery({ queryKey: ['assets'], queryFn: listAssets });
  const allAssets = (assetsResp?.data?.results ?? []) as typeof import('@/types').Asset[];
  const myAssets = user ? allAssets.filter(a => a.owner === user.id) : [];
  const myBorrowedAssets = myAssets.filter((a) => a.status === "borrowed");

  const adminStats = [
    {
      title: "Total Asset",
      value: stats.totalAssets.toString(),
      change: `${stats.activeAssets} aktif`,
      changeType: "neutral" as const,
      icon: Package,
      iconColor: "primary" as const,
    },
    {
      title: "Asset Aktif",
      value: stats.activeAssets.toString(),
      change: `${((stats.activeAssets / stats.totalAssets) * 100).toFixed(1)}% dari total`,
      changeType: "positive" as const,
      icon: Monitor,
      iconColor: "success" as const,
    },
    {
      title: "Sedang Dipinjam",
      value: stats.borrowedAssets.toString(),
      change: "asset dipinjam",
      changeType: "neutral" as const,
      icon: Archive,
      iconColor: "info" as const,
    },
    {
      title: "Dalam Perbaikan",
      value: stats.maintenanceAssets.toString(),
      change: "perlu perhatian",
      changeType: "negative" as const,
      icon: Wrench,
      iconColor: "warning" as const,
    },
  ];

  const staffStats = [
    {
      title: "Asset Saya",
      value: myAssets.length.toString(),
      change: "total asset yang dipegang",
      changeType: "neutral" as const,
      icon: Package,
      iconColor: "primary" as const,
    },
    {
      title: "Sedang Dipinjam",
      value: myBorrowedAssets.length.toString(),
      change: "dari pihak lain",
      changeType: "neutral" as const,
      icon: Archive,
      iconColor: "info" as const,
    },
  ];

  const displayStats = isAdmin ? adminStats : staffStats;

  return (
    <AppLayout>
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Selamat Datang, {user?.name?.split(" ")[0]}!
        </h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? "Kelola dan pantau semua asset organisasi"
            : "Lihat dan kelola asset yang Anda pegang"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${isAdmin ? "lg:grid-cols-4" : "lg:grid-cols-2"} gap-6 mb-6`}>
        {displayStats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Admin: Additional Stats */
      }
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <StatCard
            title="Total Nilai Asset"
            value={formatCurrency(stats.totalValue)}
            change="nilai perolehan"
            changeType="neutral"
            icon={DollarSign}
            iconColor="accent"
          />
          <StatCard
            title="Asset Dihapus"
            value={stats.disposedAssets.toString()}
            change="sudah tidak aktif"
            changeType="neutral"
            icon={AlertTriangle}
            iconColor="warning"
          />
        </div>
      )}

      {/* Admin: Category Chart */}
      {isAdmin && (
        <div className="grid grid-cols-1 mb-6">
          <AssetsByCategoryChart />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Table - Takes 2 columns */}
        <div className="lg:col-span-2">
          <AssetTable />
        </div>

        {/* Right Sidebar - Takes 1 column */}
        <div className="space-y-6">
          {isAdmin && <QuickActions />}
          <AttentionList />
          <RecentActivity />
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
