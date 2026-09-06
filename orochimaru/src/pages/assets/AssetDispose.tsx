import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, AlertTriangle, Trash2, Blocks } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getAssetDetail } from "@/lib/api/assets";
import { getUsersApi } from "@/lib/api/users";
import { createDisposeApprovalApi } from "@/lib/api/approvals";
import { getErrorMessage } from "@/lib/api/http";
import { FileUploader } from "@/components/ui/file-uploader";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const disposeSchema = z.object({
  reason: z.string().min(1, "Alasan wajib dipilih"),
  notes: z.string().min(10, "Catatan minimal 10 karakter"),
  approvedBy: z.string().min(1, "Approver wajib dipilih"),
  confirmed: z.boolean().refine((val) => val === true, {
    message: "Anda harus mengkonfirmasi penghapusan",
  }),
});

type DisposeFormData = z.infer<typeof disposeSchema>;

const disposalReasons = [
  { value: "damaged_unrepairable", label: "Rusak Tidak Bisa Diperbaiki" },
  { value: "obsolete", label: "Sudah Usang/Obsolete" },
  { value: "sold", label: "Dijual" },
  { value: "donated", label: "Didonasikan" },
  { value: "lost", label: "Hilang" },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

export default function AssetDispose() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const { user } = useAuth();

  const { data: assetResp } = useQuery({ enabled: !!assetId, queryKey: ["asset", assetId], queryFn: () => getAssetDetail(assetId!) });
  const asset = (assetResp?.data ?? null) as typeof import("@/types").Asset | null;
  // For approver list, fetch users and filter admins if needed
  const { data: usersResp } = useQuery({ queryKey: ["users","list","forDispose"], queryFn: () => getUsersApi({ limit: 100 }) });
  // Approvers: admin, admin_asset, head_unit
  const adminUsers = (usersResp?.data?.results ?? []).filter(u => ['admin','admin_asset','head_unit'].includes(u.userType));
  const totalMaintenanceCost = 0;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<DisposeFormData>({
    resolver: zodResolver(disposeSchema),
    defaultValues: {
      confirmed: false,
    },
  });

  const onSubmit = async (data: DisposeFormData) => {
    setIsSubmitting(true);
    try {
      if (!asset) throw new Error('Asset tidak ditemukan');
      await createDisposeApprovalApi({
        assetId: asset.assetId,
        assetName: asset.name,
        requesterName: user?.name || user?.email || "",
        reason: data.reason,
        notes: data.notes,
      });
      setSubmitSuccess(true);
      toast.success("Permintaan penghapusan diajukan");
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
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warning/10 flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-warning" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Permintaan Penghapusan Diajukan</h2>
                <p className="text-muted-foreground mb-6">
                  Menunggu persetujuan. Riwayat akan tercatat setelah disetujui.
                </p>

                <Button onClick={() => navigate("/assets")}>
                  Kembali ke Daftar Asset
                </Button>
              </div>

              {/* Berita Acara upload (mock) */}
              <div className="space-y-2">
                <Label>Dokumen Berita Acara (opsional)</Label>
                <FileUploader accept=".pdf" onFilesSelected={() => { /* optional upload via documents API */ }} />
                <p className="text-xs text-muted-foreground">Unggah dokumen dapat dilakukan setelah persetujuan.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const assetAge = Math.floor(
    (new Date().getTime() - new Date(asset.acquisitionDate).getTime()) /
      (1000 * 60 * 60 * 24 * 30)
  );

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-destructive">Penghapusan Asset</h1>
            <p className="text-muted-foreground">Tandai asset sebagai tidak aktif</p>
          </div>
        </div>

        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Peringatan</AlertTitle>
          <AlertDescription>
            Penghapusan asset bersifat <strong>PERMANEN</strong> dan akan tercatat di
            blockchain. Asset tidak bisa diaktifkan kembali setelah dihapus.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Asset Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Asset</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Asset ID</p>
                  <p className="font-medium">{asset.assetId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nama</p>
                  <p className="font-medium">{asset.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kategori</p>
                  <p className="font-medium capitalize">{asset.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Harga Perolehan</p>
                  <p className="font-medium">{formatCurrency(asset.acquisitionPrice)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Umur Asset</p>
                  <p className="font-medium">{assetAge} bulan</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Maintenance</p>
                  <p className="font-medium">{formatCurrency(totalMaintenanceCost)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disposal Reason */}
          <Card>
            <CardHeader>
              <CardTitle>Alasan Penghapusan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Jenis Penghapusan *</Label>
                <Select onValueChange={(val) => setValue("reason", val)}>
                  <SelectTrigger className={errors.reason ? "border-destructive" : ""}>
                    <SelectValue placeholder="Pilih alasan" />
                  </SelectTrigger>
                  <SelectContent>
                    {disposalReasons.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.reason && (
                  <p className="text-sm text-destructive">{errors.reason.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Catatan Detail *</Label>
                <Textarea
                  placeholder="Jelaskan alasan penghapusan secara detail..."
                  {...register("notes")}
                  rows={4}
                />
                {errors.notes && (
                  <p className="text-sm text-destructive">{errors.notes.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Disetujui Oleh *</Label>
                <Select onValueChange={(val) => setValue("approvedBy", val)}>
                  <SelectTrigger className={errors.approvedBy ? "border-destructive" : ""}>
                    <SelectValue placeholder="Pilih approver" />
                  </SelectTrigger>
                  <SelectContent>
                    {adminUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.fullName} - {user.userType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.approvedBy && (
                  <p className="text-sm text-destructive">{errors.approvedBy.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Confirmation */}
          <Card className="border-destructive/50">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="confirmed"
                  onCheckedChange={(checked) => setValue("confirmed", !!checked)}
                />
                <Label htmlFor="confirmed" className="text-sm leading-relaxed">
                  Saya mengerti bahwa penghapusan ini bersifat permanen dan data akan
                  dicatat di blockchain sebagai audit trail. Asset tidak dapat
                  diaktifkan kembali.
                </Label>
              </div>
              {errors.confirmed && (
                <p className="text-sm text-destructive mt-2">{errors.confirmed.message}</p>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Batal
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus Asset
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
