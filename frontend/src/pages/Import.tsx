import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Package,
  MapPin,
  FolderTree,
  Loader2
} from "lucide-react";
import { http, getErrorMessage } from "@/lib/api/http";

interface ImportResult {
  success: boolean;
  message: string;
  count?: number;
}

const Import = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ImportResult>>({});

  const handleFileUpload = async (type: string, file: File) => {
    setLoading(type);
    setResults((prev) => ({ ...prev, [type]: undefined as any }));

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        throw new Error("File harus berisi array JSON");
      }

      let endpoint = "";
      switch (type) {
        case "categories":
          endpoint = "/api/v1/seed/categories";
          break;
        case "locations":
          endpoint = "/api/v1/seed/locations";
          break;
        case "assets":
          endpoint = "/api/v1/seed/assets";
          break;
        case "history":
          endpoint = "/api/v1/seed/assets/history";
          break;
        case "maintenance":
          endpoint = "/api/v1/seed/assets/maintenance";
          break;
        case "documents":
          endpoint = "/api/v1/seed/assets/documents";
          break;
        case "approvals":
          endpoint = "/api/v1/seed/approvals";
          break;
        default:
          throw new Error("Tipe import tidak dikenali");
      }

      await http.post(endpoint, data);

      setResults((prev) => ({
        ...prev,
        [type]: {
          success: true,
          message: `Berhasil import ${data.length} data`,
          count: data.length,
        },
      }));
      toast({
        title: "Import Berhasil",
        description: `${data.length} data ${type} berhasil diimport`,
      });
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      setResults((prev) => ({
        ...prev,
        [type]: {
          success: false,
          message,
        },
      }));
      toast({
        title: "Import Gagal",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const downloadTemplate = (type: string) => {
    let template: any[] = [];
    let filename = "";

    switch (type) {
      case "categories":
        template = [
          {
            id: "cat-001",
            name: "Elektronik",
            slug: "elektronik",
            description: "Perangkat elektronik kantor",
            icon: "Monitor",
          },
        ];
        filename = "template_categories.json";
        break;
      case "locations":
        template = [
          {
            id: "loc-001",
            name: "Gedung A Lt.1",
            building: "Gedung A",
            floor: "1",
            room: "Ruang Server",
          },
        ];
        filename = "template_locations.json";
        break;
      case "assets":
        template = [
          {
            assetId: "AST-001",
            name: "Laptop Dell XPS 15",
            category: "elektronik",
            description: "Laptop untuk development",
            serialNumber: "SN123456",
            owner: "user-001",
            ownerName: "John Doe",
            location: "loc-001",
            locationDetail: "Meja 1",
            status: "active",
            acquisitionDate: "2024-01-15",
            acquisitionPrice: 25000000,
            vendor: "Dell Indonesia",
            invoiceNumber: "INV-2024-001",
            createdAt: "2024-01-15T00:00:00Z",
            updatedAt: "2024-01-15T00:00:00Z",
          },
        ];
        filename = "template_assets.json";
        break;
      case "history":
        template = [
          {
            id: "hist-001",
            assetId: "AST-001",
            eventType: "acquisition",
            date: "2024-01-15",
            description: "Asset diterima dari vendor",
            details: "Pembelian awal",
          },
        ];
        filename = "template_history.json";
        break;
      case "maintenance":
        template = [
          {
            id: "mnt-001",
            assetId: "AST-001",
            type: "routine",
            date: "2024-06-15",
            notes: "Pembersihan dan pengecekan rutin",
            cost: 500000,
            technician: "Teknisi A",
            vendor: "Service Center",
          },
        ];
        filename = "template_maintenance.json";
        break;
      default:
        return;
    }

    const blob = new Blob([JSON.stringify(template, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ImportCard = ({
    type,
    title,
    description,
    icon: Icon,
  }: {
    type: string;
    title: string;
    description: string;
    icon: React.ElementType;
  }) => {
    const result = results[type];
    const isLoading = loading === type;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadTemplate(type)}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`file-${type}`}>Upload File JSON</Label>
            <Input
              id={`file-${type}`}
              type="file"
              accept=".json"
              disabled={isLoading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(type, file);
                }
              }}
            />
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Mengimport data...</span>
            </div>
          )}

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Import Data</h1>
          <p className="text-muted-foreground">
            Import data master dan transaksi dari file JSON
          </p>
        </div>

        {/* Info Alert */}
        <Alert>
          <FileSpreadsheet className="w-4 h-4" />
          <AlertDescription>
            Upload file JSON untuk mengimport data. Download template terlebih dahulu untuk melihat format yang benar.
            Data yang sudah ada dengan ID yang sama akan di-skip.
          </AlertDescription>
        </Alert>

        {/* Import Tabs */}
        <Tabs defaultValue="master" className="space-y-4">
          <TabsList>
            <TabsTrigger value="master">Data Master</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="transactions">Transaksi</TabsTrigger>
          </TabsList>

          <TabsContent value="master" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <ImportCard
                type="categories"
                title="Kategori"
                description="Import daftar kategori asset"
                icon={FolderTree}
              />
              <ImportCard
                type="locations"
                title="Lokasi"
                description="Import daftar lokasi/gedung"
                icon={MapPin}
              />
            </div>
          </TabsContent>

          <TabsContent value="assets" className="space-y-4">
            <ImportCard
              type="assets"
              title="Daftar Asset"
              description="Import data asset lengkap"
              icon={Package}
            />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <ImportCard
                type="history"
                title="Riwayat Asset"
                description="Import history/event asset"
                icon={FileSpreadsheet}
              />
              <ImportCard
                type="maintenance"
                title="Data Maintenance"
                description="Import catatan maintenance"
                icon={FileSpreadsheet}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Import;
