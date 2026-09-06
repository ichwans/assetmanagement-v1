import { useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle, Blocks } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { listLocations } from "@/lib/api/meta";
import { getUsersApi } from "@/lib/api/users";
import { getAssetDetail, uploadAssetDocumentFile } from "@/lib/api/assets";
import { createTransferApprovalApi } from "@/lib/api/approvals";
import { getErrorMessage } from "@/lib/api/http";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { FileUploader } from "@/components/ui/file-uploader";

function makeTransferSchema(isReturn: boolean) {
  return z.object({
    toOwner: isReturn ? z.string().optional() : z.string().min(1, "Penerima wajib dipilih"),
    toLocation: isReturn ? z.string().optional() : z.string().min(1, "Lokasi baru wajib dipilih"),
    transferType: z.enum(["borrow", "permanent"]),
    borrowDuration: z.coerce.number().optional(),
    notes: z.string().optional(),
    acknowledged: z.boolean().refine((val) => val === true, {
      message: "Anda harus menyetujui serah terima",
    }),
  });
}

type TransferFormData = {
  toOwner?: string;
  toLocation?: string;
  transferType: "borrow" | "permanent";
  borrowDuration?: number;
  notes?: string;
  acknowledged: boolean;
};

export default function AssetTransfer() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const modeReturn = new URLSearchParams(location.search).get('mode') === 'return' || location.pathname.endsWith('/return');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [mockTxId, setMockTxId] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);

  const { data: assetResp } = useQuery({ enabled: !!assetId, queryKey: ["asset", assetId], queryFn: () => getAssetDetail(assetId!) });
  const asset = (assetResp?.data ?? null) as typeof import("@/types").Asset | null;
  const { data: locsResp } = useQuery({ queryKey: ["meta","locations"], queryFn: listLocations });
  const { data: usersResp } = useQuery({ queryKey: ["users","list","forTransfer"], queryFn: () => getUsersApi({ limit: 100, page: 1 }) });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TransferFormData>({
    resolver: zodResolver(useMemo(() => makeTransferSchema(modeReturn), [modeReturn])),
    defaultValues: {
      transferType: modeReturn ? "borrow" : "permanent",
      acknowledged: false,
    },
  });

  const transferType = watch("transferType");

  // Lock transfer type to 'borrow' in return mode
  if (modeReturn && transferType !== 'borrow') {
    setValue('transferType', 'borrow');
  }

  const generateTxId = () => {
    const chars = "0123456789abcdef";
    let txId = "";
    for (let i = 0; i < 64; i++) {
      txId += chars[Math.floor(Math.random() * chars.length)];
    }
    return txId;
  };

  const onSubmit = async (data: TransferFormData) => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      if (!asset) throw new Error('Asset tidak ditemukan');
      if (modeReturn && photos.length === 0) {
        toast.error('Lampirkan minimal 1 foto kondisi asset saat pengembalian');
        setIsSubmitting(false);
        return;
      }
      await createTransferApprovalApi({
        assetId: asset.assetId,
        assetName: asset.name,
        requesterName: user?.name || (user?.email?.split('@')[0] ?? 'User'),
        transferType: data.transferType,
        toOwnerId: data.toOwner,
        toLocationId: data.toLocation,
        borrowDuration: data.borrowDuration,
        notes: data.notes,
      });

      // Upload handover photos (real multipart to local storage)
      if (photos.length > 0) {
        const docType = modeReturn ? 'handover_return' : 'handover_borrow';
        for (const f of photos) {
          try { await uploadAssetDocumentFile(asset.assetId, f, docType); } catch {}
        }
      }
      setSubmitSuccess(true);
      toast.success("Transfer diajukan. Menunggu persetujuan.");
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
                <h2 className="text-2xl font-bold mb-2">Transfer Diajukan</h2>
                <p className="text-muted-foreground mb-6">
                  Permintaan transfer menunggu persetujuan.
                </p>

                <div className="flex gap-3 justify-center">
                  <Button onClick={() => navigate(`/assets/${assetId}`)}>
                    Lihat Asset
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/assets")}>
                    Daftar Asset
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
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{modeReturn ? 'Pengembalian Asset' : 'Serah Terima Asset'}</h1>
            <p className="text-muted-foreground">{modeReturn ? 'Kembalikan asset yang dipinjam' : 'Transfer kepemilikan atau peminjaman'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Asset Info */}
          <Card>
            <CardHeader>
              <CardTitle>Asset yang Ditransfer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold">{asset.name}</p>
                  <p className="text-sm text-muted-foreground">{asset.assetId}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* From */}
          <Card>
            <CardHeader>
              <CardTitle>Dari (Pemegang Saat Ini)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-medium">{asset.ownerName || '-'}</p>
                <p className="text-sm text-muted-foreground">{asset.locationDetail || asset.location || '-'}</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-primary" />
            </div>
          </div>

          {/* To */}
          {!modeReturn && (
            <Card>
              <CardHeader>
                <CardTitle>Kepada (Penerima Baru)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Pilih Penerima *</Label>
                  <Select onValueChange={(val) => setValue("toOwner", val)}>
                    <SelectTrigger className={errors.toOwner ? "border-destructive" : ""}>
                      <SelectValue placeholder="Pilih staff penerima" />
                    </SelectTrigger>
                    <SelectContent>
                      {(usersResp?.data?.results ?? []).map((user) => (
                        <SelectItem key={String(user.id)} value={String(user.id)}>
                          {user.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.toOwner && (
                    <p className="text-sm text-destructive">{errors.toOwner.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Lokasi Baru *</Label>
                  <Select onValueChange={(val) => setValue("toLocation", val)}>
                    <SelectTrigger className={errors.toLocation ? "border-destructive" : ""}>
                      <SelectValue placeholder="Pilih lokasi" />
                    </SelectTrigger>
                    <SelectContent>
                      {(locsResp?.data ?? []).map((loc) => (
                        <SelectItem key={loc.id} value={String(loc.id)}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.toLocation && (
                    <p className="text-sm text-destructive">{errors.toLocation.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transfer Type */}
          <Card>
            <CardHeader>
              <CardTitle>Jenis Transfer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {modeReturn ? (
                <div className="text-sm text-muted-foreground">
                  Jenis: <span className="font-medium text-foreground">Peminjaman (Pengembalian)</span>
                </div>
              ) : (
                <RadioGroup
                  defaultValue={"permanent"}
                  onValueChange={(val) => setValue("transferType", val as "borrow" | "permanent")}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="permanent" id="permanent" />
                    <Label htmlFor="permanent">Penyerahan Tetap</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="borrow" id="borrow" />
                    <Label htmlFor="borrow">Peminjaman</Label>
                  </div>
                </RadioGroup>
              )}

              {transferType === "borrow" && !modeReturn && (
                <div className="space-y-2">
                  <Label>Durasi Pinjam (hari)</Label>
                  <Input
                    type="number"
                    placeholder="7"
                    {...register("borrowDuration")}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Catatan</Label>
                <Textarea
                  placeholder="Catatan serah terima..."
                  {...register("notes")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Handover Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Foto Kondisi Asset</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUploader accept=".jpg,.jpeg,.png" multiple maxSizeMB={5} onFilesSelected={(files) => setPhotos(files)} />
              {modeReturn && photos.length === 0 && (
                <p className="text-xs text-destructive mt-2">Wajib melampirkan minimal 1 foto saat pengembalian</p>
              )}
            </CardContent>
          </Card>

          {/* Acknowledgment */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="acknowledged"
                  onCheckedChange={(checked) => setValue("acknowledged", !!checked)}
                />
                <Label htmlFor="acknowledged" className="text-sm leading-relaxed">
                  Saya menyatakan telah menyerahkan asset dalam kondisi baik dan
                  menyetujui pencatatan transaksi ini di blockchain
                </Label>
              </div>
              {errors.acknowledged && (
                <p className="text-sm text-destructive mt-2">{errors.acknowledged.message}</p>
              )}
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
                  Memproses...
                </>
              ) : (
                "Proses Transfer"
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
