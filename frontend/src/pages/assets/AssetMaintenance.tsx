import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, CheckCircle, Blocks, Wrench } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAssetDetail, getAssetMaintenanceApi, completeMaintenanceApi } from "@/lib/api/assets";
import { addMaintenanceApi } from "@/lib/api/assets";
import { getErrorMessage } from "@/lib/api/http";
import { FileUploader } from "@/components/ui/file-uploader";
import { toast } from "sonner";

const maintenanceSchema = z.object({
  type: z.string().min(1, "Jenis maintenance wajib dipilih"),
  date: z.string().min(1, "Tanggal wajib diisi"),
  notes: z.string().min(10, "Catatan minimal 10 karakter"),
  cost: z.coerce.number().min(0, "Biaya tidak boleh negatif"),
  technician: z.string().optional(),
  vendor: z.string().optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

const maintenanceTypes = [
  { value: "routine", label: "Service Rutin" },
  { value: "repair", label: "Perbaikan Kerusakan" },
  { value: "upgrade", label: "Upgrade/Penggantian Part" },
  { value: "calibration", label: "Kalibrasi" },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

export default function AssetMaintenance() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [mockTxId, setMockTxId] = useState("");

  const qc = useQueryClient();
  const { data: assetResp } = useQuery({ enabled: !!assetId, queryKey: ["asset", assetId], queryFn: () => getAssetDetail(assetId!) });
  const asset = (assetResp?.data ?? null) as typeof import("@/types").Asset | null;
  const { data: maintResp } = useQuery({ enabled: !!assetId, queryKey: ["asset", assetId, "maintenance"], queryFn: () => getAssetMaintenanceApi(assetId!) });
  const maintenanceHistory = (maintResp?.data ?? []) as typeof import("@/types").MaintenanceRecord[];
  const totalCost = maintenanceHistory.reduce((sum, m) => sum + (m.cost || 0), 0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      cost: 0,
    },
  });

  const generateTxId = () => {
    const chars = "0123456789abcdef";
    let txId = "";
    for (let i = 0; i < 64; i++) {
      txId += chars[Math.floor(Math.random() * chars.length)];
    }
    return txId;
  };

  const markMaintenanceDone = async () => {
    if (!asset) return;
    try {
      const resp = await completeMaintenanceApi(asset.assetId, { date: new Date().toISOString(), notes: 'Maintenance selesai' });
      await qc.invalidateQueries({ queryKey: ["asset", assetId] });
      const txid = (resp?.data as any)?.txId as string | undefined;
      toast.success(`Maintenance selesai${txid ? ` • txId ${txid.slice(0,8)}…${txid.slice(-6)}` : ''}`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const onSubmit = async (data: MaintenanceFormData) => {
    setIsSubmitting(true);
    try {
      if (!asset) throw new Error('Asset tidak ditemukan');
      const resp = await addMaintenanceApi(asset.assetId, {
        type: data.type as any,
        date: data.date,
        notes: data.notes,
        cost: Number(data.cost),
        technician: data.technician,
        vendor: data.vendor,
      });
      // surface ledger warnings
      if (resp?.errors && resp.errors.length > 0) {
        const msg = resp.errors.map(e => e.message).join('; ');
        toast.warning(`Ledger warning: ${msg}`);
      }
      const created = resp?.data as any;
      if (created?.txId) setMockTxId(created.txId);
      await qc.invalidateQueries({ queryKey: ["asset", assetId, "maintenance"] });
      setSubmitSuccess(true);
      toast.success("Log maintenance tersimpan");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!asset) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Asset tidak ditemukan</h2>
          <Button className="mt-4" onClick={() => navigate("/assets")}>
            Kembali
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (submitSuccess) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Maintenance Tercatat!</h2>
                <p className="text-muted-foreground mb-6">
                  Log maintenance telah disimpan di blockchain
                </p>

                <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <Blocks className="w-5 h-5 text-primary" />
                    <span className="font-medium">Informasi Transaksi</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transaction ID</span>
                      <code className="font-mono text-xs">
                        {mockTxId.slice(0, 16)}...{mockTxId.slice(-8)}
                      </code>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-center">
                  <Button onClick={() => navigate(`/assets/${assetId}`)}>
                    Lihat Asset
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSubmitSuccess(false);
                      setMockTxId("");
                    }}
                  >
                    Tambah Log Lagi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Log Maintenance</h1>
            <p className="text-muted-foreground">Catat perbaikan atau service asset</p>
          </div>
          {asset?.status === 'maintenance' && (
            <Button variant="outline" onClick={markMaintenanceDone}>Selesaikan Maintenance</Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Asset Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Asset</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="font-semibold">{asset.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {asset.assetId} • {asset.ownerName}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Maintenance Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="w-5 h-5" />
                    Form Maintenance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tanggal Maintenance *</Label>
                      <Input type="date" {...register("date")} />
                      {errors.date && (
                        <p className="text-sm text-destructive">{errors.date.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Jenis Maintenance *</Label>
                      <Select onValueChange={(val) => setValue("type", val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis" />
                        </SelectTrigger>
                        <SelectContent>
                          {maintenanceTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.type && (
                        <p className="text-sm text-destructive">{errors.type.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Catatan Maintenance *</Label>
                    <Textarea
                      placeholder="Jelaskan pekerjaan yang dilakukan..."
                      {...register("notes")}
                      rows={4}
                    />
                    {errors.notes && (
                      <p className="text-sm text-destructive">{errors.notes.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Biaya (Rp) *</Label>
                      <Input type="number" placeholder="500000" {...register("cost")} />
                      {errors.cost && (
                        <p className="text-sm text-destructive">{errors.cost.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Teknisi</Label>
                      <Input placeholder="Nama teknisi" {...register("technician")} />
                    </div>

                    <div className="space-y-2">
                      <Label>Vendor</Label>
                      <Input placeholder="Nama vendor" {...register("vendor")} />
                    </div>
                  </div>

                  {/* Receipt upload */}
                  <div className="space-y-2">
                    <Label>Bukti/Nota (opsional)</Label>
                    <FileUploader accept=".pdf,.jpg,.jpeg,.png" onFilesSelected={() => { /* optional upload via documents API */ }} />
                    <p className="text-xs text-muted-foreground">Upload bukti dapat dilakukan via halaman detail asset.</p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Log"
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* History Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Maintenance</CardTitle>
              </CardHeader>
              <CardContent>
                {maintenanceHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Belum ada riwayat maintenance
                  </p>
                ) : (
                  <div className="space-y-3">
                    {maintenanceHistory.map((record) => (
                      <div key={record.id} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium capitalize">{record.type}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(record.date).toLocaleDateString("id-ID")}
                            </p>
                          </div>
                          <span className="text-sm font-medium">
                            {formatCurrency(record.cost)}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total</span>
                        <span className="font-semibold">{formatCurrency(totalCost)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
