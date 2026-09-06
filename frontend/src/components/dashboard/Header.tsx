import React, { useState, useEffect } from "react";
import {
  Bell,
  Search,
  Menu,
  User,
  Settings,
  LogOut,
  Calendar,
  Clock,
  Command,
  Package,
  ArrowLeftRight,
  Wrench,
  Check,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { listNotifications, type NotificationItem, type NotificationListResponse } from "@/lib/api/notifications";
import { toast } from "sonner";

// Fallback mock notifications (used when API unavailable)
const fallbackNotifications: Array<NotificationItem & { time?: string }> = [
  { id: "1", type: "transfer", title: "Transfer Request", message: "Laptop Dell XPS 15 butuh approval", time: "5 menit lalu", read: false, createdAt: new Date().toISOString() },
  { id: "2", type: "maintenance", title: "Jadwal Maintenance", message: "Proyektor BenQ perlu perawatan", time: "1 jam lalu", read: false, createdAt: new Date().toISOString() },
  { id: "3", type: "asset", title: "Asset Baru", message: "3 asset baru terdaftar", time: "2 jam lalu", read: true, createdAt: new Date().toISOString() },
];

const notificationIcons: Record<string, React.ElementType> = {
  transfer: ArrowLeftRight,
  maintenance: Wrench,
  asset: Package,
};

function useBreadcrumbs() {
  const location = useLocation();
  const pathname = location.pathname;

  const segments = pathname.split("/").filter(Boolean);

  const labelMap: Record<string, string> = {
    "": "Dashboard",
    assets: "Daftar Asset",
    create: "Tambah Asset",
    history: "Riwayat Asset",
    transfer: "Serah Terima",
    maintenance: "Maintenance",
    dispose: "Penghapusan",
    "my-assets": "Asset Saya",
    explorer: "Explorer",
    reports: "Laporan",
    settings: "Pengaturan",
    profile: "Profil",
    scan: "Scan QR",
    asset: "Asset Publik",
    public: "Publik",
    approvals: "Approval",
    users: "User Management",
  };

  const items = [] as Array<{ href: string; label: string; isLast: boolean }>;
  let hrefAcc = "";
  if (segments.length === 0) {
    items.push({ href: "/", label: labelMap[""] || "Dashboard", isLast: true });
  } else {
    items.push({ href: "/", label: labelMap[""] || "Dashboard", isLast: false });
    segments.forEach((seg, idx) => {
      hrefAcc += `/${seg}`;
      const isLast = idx === segments.length - 1;
      const label = labelMap[seg] || seg.toUpperCase();
      items.push({ href: hrefAcc, label, isLast });
    });
  }
  return items;
}

function useCurrentTime() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return time;
}

function getPageTitle(pathname: string): string {
  const titleMap: Record<string, string> = {
    "/": "Dashboard",
    "/assets": "Daftar Asset",
    "/assets/create": "Tambah Asset Baru",
    "/my-assets": "Asset Saya",
    "/explorer": "Blockchain Explorer",
    "/reports": "Laporan",
    "/settings": "Pengaturan",
    "/profile": "Profil Saya",
    "/scan": "Scan QR Code",
    "/approvals": "Approval",
    "/users": "User Management",
  };

  // Check for dynamic routes
  if (pathname.startsWith("/assets/") && pathname.includes("/history")) {
    return "Riwayat Asset";
  }
  if (pathname.startsWith("/assets/") && pathname.includes("/transfer")) {
    return "Serah Terima Asset";
  }
  if (pathname.startsWith("/assets/") && pathname.includes("/maintenance")) {
    return "Maintenance Asset";
  }
  if (pathname.startsWith("/assets/") && pathname.includes("/dispose")) {
    return "Penghapusan Asset";
  }
  if (pathname.startsWith("/assets/") && !pathname.includes("/create")) {
    return "Detail Asset";
  }

  return titleMap[pathname] || "Asset Hub";
}

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const breadcrumbs = useBreadcrumbs();
  const currentTime = useCurrentTime();
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const loadNotifications = async () => {
    try {
      const data = await listNotifications({ limit: 10, page: 1 });
      setNotifications(data?.results || []);
    } catch {
      setNotifications(fallbackNotifications);
    }
  };
  useEffect(() => { loadNotifications(); }, []);
  useEffect(() => {
    const id = setInterval(() => { loadNotifications(); }, 60_000);
    return () => clearInterval(id);
  }, []);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotifClick = async (n: NotificationItem) => {
    try {
      if (!n.read) {
        await (await import('@/lib/api/notifications')).markRead([n.id]);
        setNotifications((arr) => arr.map((x) => x.id === n.id ? { ...x, read: true } : x));
      }
    } catch {
      toast.error("Gagal menandai notifikasi sebagai dibaca");
    }
    if (n.link) {
      if (n.link.startsWith('http')) {
        window.open(n.link, '_blank');
      } else {
        navigate(n.link);
      }
    }
  };

  const pageTitle = getPageTitle(location.pathname);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      admin: "Administrator",
      staff: "Staff",
      head_unit: "Kepala Unit",
      auditor: "Auditor",
      purchasing: "Purchasing",
    };
    return roleLabels[role] || role;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
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

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 md:px-6">
      {/* Left Section - Mobile Menu + Page Info */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            {/* Mobile sidebar content would go here */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">Asset Hub</h1>
                  <p className="text-xs text-muted-foreground">Blockchain System</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Use sidebar navigation on larger screens
              </p>
            </div>
          </SheetContent>
        </Sheet>

        {/* Page Title + Breadcrumbs */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground hidden sm:block">
              {pageTitle}
            </h1>
          </div>
          <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
              {breadcrumbs.map((item, idx) => (
                <React.Fragment key={`${item.href}-${idx}`}>
                  <BreadcrumbItem>
                    {item.isLast ? (
                      <BreadcrumbPage className="text-xs">{item.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={item.href} className="text-xs hover:text-primary transition-colors">
                          {item.label}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {idx < breadcrumbs.length - 1 && <BreadcrumbSeparator className="[&>svg]:w-3 [&>svg]:h-3" />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Date & Time - Desktop only */}
        <div className="hidden lg:flex items-center gap-3 text-sm text-muted-foreground mr-2">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span className="text-xs">{formatDate(currentTime)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">{formatTime(currentTime)}</span>
          </div>
        </div>

        {/* Search */}
        <div className={cn(
          "relative transition-all duration-200",
          searchFocused ? "w-80" : "w-48",
          "hidden md:block"
        )}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari asset..."
            className="pl-9 pr-12 h-9 bg-muted/50 border-transparent focus:border-border focus:bg-background text-sm"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <Command className="w-3 h-3" />K
          </kbd>
        </div>

        {/* Mobile Search Button */}
        <Button variant="ghost" size="icon" className="md:hidden">
          <Search className="w-5 h-5 text-muted-foreground" />
        </Button>

        {/* Notifications */}
        <DropdownMenu open={notifOpen} onOpenChange={(o) => { setNotifOpen(o); if (o) loadNotifications(); }}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                  <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {unreadCount}
                  </span>
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifikasi</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} baru
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((notif) => {
                const Icon = notificationIcons[notif.type] || Bell;
                return (
                  <DropdownMenuItem
                    key={notif.id}
                    className={cn(
                      "flex items-start gap-3 p-3 cursor-pointer",
                      !notif.read && "bg-primary/5"
                    )}
                    onClick={() => handleNotifClick(notif)}
                  >
                    <div className={cn(
                      "p-2 rounded-lg shrink-0",
                      notif.type === "transfer" && "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
                      notif.type === "maintenance" && "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
                      notif.type === "asset" && "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notif.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {notif.message}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                  </DropdownMenuItem>
                );
              })}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center justify-center text-sm text-primary cursor-pointer">
              Lihat Semua Notifikasi
              <ChevronRight className="w-4 h-4 ml-1" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 px-2 gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {user ? getInitials(user.name) : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium leading-none">
                  {user?.name.split(" ")[0]}
                </span>
                <span className="text-xs text-muted-foreground leading-none mt-0.5">
                  {user ? getRoleLabel(user.role) : "Guest"}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
              <User className="w-4 h-4 mr-2" />
              Profil Saya
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
              <Settings className="w-4 h-4 mr-2" />
              Pengaturan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
