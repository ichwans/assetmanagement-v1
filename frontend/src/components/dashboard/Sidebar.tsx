import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  Blocks,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  QrCode,
  User,
  CheckSquare,
  Upload,
  Bell,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { listNotifications } from "@/lib/api/notifications";

interface NavItem {
  icon: React.ElementType;
  label: string;
  to: string;
  badge?: number;
  adminOnly?: boolean;
}

const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/" },
  { icon: Package, label: "Daftar Asset", to: "/assets" },
  { icon: FolderOpen, label: "Asset Saya", to: "/my-assets" },
  // { icon: ShoppingCart, label: "Pengadaan", to: "/procurements" },
{ icon: CheckSquare, label: "Approval", to: "/approvals", adminOnly: true },
  { icon: Bell, label: "Notifikasi", to: "/notifications" },
  { icon: FileText, label: "Laporan", to: "/reports", adminOnly: true },
];

const operationsNavItems: NavItem[] = [
  { icon: Upload, label: "Import Data", to: "/import", adminOnly: true },
  { icon: Blocks, label: "Blockchain Explorer", to: "/explorer", adminOnly: true },
  { icon: User, label: "User Management", to: "/users", adminOnly: true },
]

const bottomNavItems: NavItem[] = [
  { icon: QrCode, label: "Scan QR", to: "/scan" },
  { icon: Settings, label: "Pengaturan", to: "/settings", adminOnly: true },
];

const NavItem = ({ icon: Icon, label, to, badge }: NavItem) => (
  <NavLink
    to={to}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
      "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
    )}
    activeClassName="bg-sidebar-accent text-sidebar-primary"
  >
    <Icon className="w-5 h-5" />
    <span className="flex-1 text-left">{label}</span>
    {badge && (
      <span className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
        {badge}
      </span>
    )}
  </NavLink>
);

export const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin, isHeadUnit, isStaff } = useAuth();
  const isAuditor = user?.role === 'auditor';
  const isPurchasing = user?.role === 'purchasing';

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Unread notifications count for badge
  const { data: notifData } = useQuery<number>({
    queryKey: ["notifications","unread-count"],
    queryFn: async () => {
      const res = await listNotifications({ read: 'false', limit: 1, page: 1 });
      return res?.pagination?.totalItems ?? 0;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const unreadCount = typeof notifData === 'number' ? notifData : 0;

  const filteredMainNav = mainNavItems.filter((item) => {
    if (!item.adminOnly) return true;
    // Approval accessible by Admin and Head Unit
    if (item.to === '/approvals') return isAdmin || isHeadUnit;
    // Explorer/Reports visible only to Admin-like roles
    return isAdmin;
  });

  // Additional role-specific visibility tweaks
  const roleFilteredNav = filteredMainNav.filter((item) => {
    // Auditors: only Dashboard and Explorer
    if (isAuditor) {
      return item.to === '/' || item.to === '/explorer';
    }
    // Purchasing: show Pengadaan, hide Approval/Explorer/Reports
    if (isPurchasing) {
      if (item.to === '/procurements') return true;
      return item.to !== '/approvals' && item.to !== '/explorer' && item.to !== '/reports';
    }
    // 'Asset Saya' visible for staff-like roles and basic users
    if (item.to === '/my-assets') return (isStaff || user?.role === 'user') && !isAuditor;
    return true;
  });

  const filteredBottomNav = bottomNavItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  // Operations menu: only for admin
  const filteredOperationsNav = isAdmin ? operationsNavItems : [];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="w-64 h-screen bg-sidebar fixed left-0 top-0 flex flex-col border-r border-sidebar-border">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <Package className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">Asset Hub</h1>
            <p className="text-xs text-sidebar-foreground/60">Blockchain System</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider mb-3 px-4">
          Menu Utama
        </p>
        {roleFilteredNav.map((item) => (
          <NavItem key={item.label} {...item} badge={item.to === '/notifications' ? unreadCount : item.badge} />
        ))}
      </nav>

      {/* Operations Navigation (Admin only) */}
      {filteredOperationsNav.length > 0 && (
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider mb-3 px-4">
            Menu Operasional
          </p>
          {filteredOperationsNav.map((item) => (
            <NavItem key={item.label} {...item} />
          ))}
        </nav>
      )}

      {/* Bottom Navigation */}
      <div className="p-4 border-t border-sidebar-border space-y-1">
        {filteredBottomNav.map((item) => (
          <NavItem key={item.label} {...item} />
        ))}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span>Keluar</span>
        </button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={() => navigate("/profile")}
          className="w-full flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-sidebar-primary/20 flex items-center justify-center">
            <span className="text-sm font-semibold text-sidebar-primary">
              {user ? getInitials(user.name) : "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.name || "Guest"}
            </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
              {user?.role === "admin" ? "Administrator" : "Staff"}
            </p>
          </div>
        </button>
      </div>
    </aside>
  );
};
