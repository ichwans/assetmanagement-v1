import { useNavigate } from "react-router-dom";
import { Plus, QrCode, FileText, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const actions = [
  {
    icon: Plus,
    label: "Tambah Asset",
    description: "Registrasi asset baru",
    variant: "default" as const,
    path: "/assets/create",
  },
  {
    icon: ArrowLeftRight,
    label: "Transfer",
    description: "Serah terima asset",
    variant: "outline" as const,
    path: "/assets",
  },
  {
    icon: QrCode,
    label: "Scan QR",
    description: "Scan QR Code asset",
    variant: "outline" as const,
    path: "/scan",
  },
  {
    icon: FileText,
    label: "Laporan",
    description: "Generate laporan",
    variant: "outline" as const,
    path: "/reports",
  },
];

export const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-card rounded-xl border border-border shadow-card p-6 animate-fade-in">
      <h2 className="text-lg font-semibold text-foreground mb-4">Aksi Cepat</h2>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant={action.variant}
              className="h-auto flex-col items-start p-4 gap-2"
              onClick={() => navigate(action.path)}
            >
              <Icon className="w-5 h-5" />
              <div className="text-left">
                <p className="font-medium">{action.label}</p>
                <p className="text-xs opacity-70 font-normal">{action.description}</p>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
