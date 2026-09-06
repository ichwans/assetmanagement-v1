import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, CheckCircle, Blocks } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { listCategories, listLocations } from "@/lib/api/meta";
import { getUsersApi } from "@/lib/api/users";
import { createAssetApi } from "@/lib/api/assets";
import { getErrorMessage } from "@/lib/api/http";
import { FileUploader } from "@/components/ui/file-uploader";
import { toast } from "sonner";

const createAssetSchema = z.object({
  name: z.string().min(3, "Nama asset minimal 3 karakter"),
  category: z.string().min(1, "Kategori wajib dipilih"),
  description: z.string().optional(),
  serialNumber: z.string().optional(),
  acquisitionDate: z.string().min(1, "Tanggal perolehan wajib diisi"),
  acquisitionPrice: z.coerce.number().min(1, "Harga perolehan wajib diisi"),
  vendor: z.string().optional(),
  invoiceNumber: z.string().optional(),
  location: z.string().min(1, "Lokasi wajib dipilih"),
  owner: z.string().min(1, "Pemegang awal wajib dipilih"),
});

type CreateAssetFormData = z.infer<typeof createAssetSchema>;

export default function AssetCreate() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [createdAssetId, setCreatedAssetId] = useState<string>("");
  const [createdTxId, setCreatedTxId] = useState<string>("");
  const [step, setStep] = useState<number>(0); // 0: Draft, 1: Dokumen, 2: Aktivasi
  const { data: catsResp } = useQuery({ queryKey: ["meta","categories"], queryFn: listCategories });
  const { data: locsResp } = useQuery({ queryKey: ["meta","locations"], queryFn: listLocations });
  const { data: usersResp } = useQuery({ queryKey: ["users","list","forCreate"], queryFn: () => getUsersApi({ limit: 100 }) });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateAssetFormData>({
    resolver: zodResolver(createAssetSchema),
    defaultValues: {
      acquisitionDate: new Date().toISOString().split("T")[0],
    },
  });

  const onSubmit = async (data: CreateAssetFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name,
        category: data.category as any,
        description: data.description,
        serialNumber: data.serialNumber,
        acquisitionDate: data.acquisitionDate,
        acquisitionPrice: Number(data.acquisitionPrice),
        vendor: data.vendor,
        invoiceNumber: data.invoiceNumber,
        location: data.location,
        owner: data.owner,
      };
      const resp = await createAssetApi(payload);
      const newAsset = resp?.data as unknown as typeof import("@/types").Asset;
      if (newAsset?.assetId) setCreatedAssetId(newAsset.assetId);
      if ((newAsset as any)?.txId) setCreatedTxId((newAsset as any)?.txId as string);
      setSubmitSuccess(true);
      toast.success("Asset berhasil dibuat");
      if (resp?.errors && resp.errors.length > 0) {
        const msg = resp.errors.map(e => e.message).join("; ");
        toast.warning(`Ledger warning: ${msg}`);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

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
                <h2 className="text-2xl font-bold mb-2">Asset Berhasil Dibuat</h2>
                {createdAssetId && (
                  <p className="text-muted-foreground mb-6">
                    Asset ID: <code className="font-mono">{createdAssetId}</code>
                  </p>
                )}
                {createdTxId && (
                  <div className="bg-muted/50 rounded-lg p-3 mb-4 text-left">
                    <div className="flex items-center gap-2">
                      <Blocks className="w-4 h-4 text-primary" />
                      <span className="text-sm">txId: </span>
                      <code className="font-mono text-xs">{createdTxId.slice(0, 12)}…{createdTxId.slice(-8)}</code>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-center">
                  <Button onClick={() => navigate("/assets")}>
                    Lihat Daftar Asset
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSubmitSuccess(false);
                      setCreatedAssetId("");
                    }}
                  >
                    Tambah Asset Lagi
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
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/assets")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Registrasi Asset Baru</h1>
            <p className="text-muted-foreground">
              Daftarkan asset baru ke sistem blockchain
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {["Draft", "Dokumen", "Aktivasi"].map((label, idx) => (
            <div key={label} className={`h-2 rounded-full ${step >= idx ? 'bg-primary' : 'bg-muted'}`} />
          ))}
          <div className="col-span-3 flex justify-between text-xs text-muted-foreground">
            <span>Draft</span>
            <span>Dokumen</span>
            <span>Aktivasi</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {step === 0 && (
            <>
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Dasar</CardTitle>
              <CardDescription>Data identitas asset</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Asset *</Label>
                  <Input
                    id="name"
                    placeholder="Contoh: Laptop Dell Latitude 5520"
                    {...register("name")}
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Kategori *</Label>
                  <Select onValueChange={(val) => setValue("category", val)}>
                    <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {(catsResp?.data ?? []).map((cat) => (
                        <SelectItem key={cat.slug} value={cat.slug}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-destructive">{errors.category.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  placeholder="Deskripsi detail asset..."
                  {...register("description")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input
                  id="serialNumber"
                  placeholder="Contoh: DELL-SN-123456"
                  {...register("serialNumber")}
                />
              </div>
          </CardContent>
          </Card>
            </>
          )}

          {step === 1 && (
            <>
        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Dokumen (Opsional)</CardTitle>
            <CardDescription>Upload foto/invoice untuk catatan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Foto Asset</Label>
              <FileUploader accept=".jpg,.jpeg,.png" multiple onFilesSelected={() => { /* optional upload after created */ }} />
              <p className="text-xs text-muted-foreground mt-1">Upload bisa dilakukan setelah asset dibuat.</p>
            </div>
            <div>
              <Label>Invoice</Label>
              <FileUploader accept=".pdf" onFilesSelected={() => { /* optional upload after created */ }} />
            </div>
          </CardContent>
        </Card>
            </>
          )}

          {step === 0 && (
            <>
          {/* Acquisition Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Perolehan</CardTitle>
              <CardDescription>Data pembelian asset</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="acquisitionDate">Tanggal Perolehan *</Label>
                  <Input
                    id="acquisitionDate"
                    type="date"
                    {...register("acquisitionDate")}
                    className={errors.acquisitionDate ? "border-destructive" : ""}
                  />
                  {errors.acquisitionDate && (
                    <p className="text-sm text-destructive">{errors.acquisitionDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="acquisitionPrice">Harga Perolehan (Rp) *</Label>
                  <Input
                    id="acquisitionPrice"
                    type="number"
                    placeholder="15000000"
                    {...register("acquisitionPrice")}
                    className={errors.acquisitionPrice ? "border-destructive" : ""}
                  />
                  {errors.acquisitionPrice && (
                    <p className="text-sm text-destructive">{errors.acquisitionPrice.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor/Supplier</Label>
                  <Input
                    id="vendor"
                    placeholder="Contoh: PT. Komputer Jaya"
                    {...register("vendor")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">No. Invoice</Label>
                  <Input
                    id="invoiceNumber"
                    placeholder="Contoh: INV-2024-001"
                    {...register("invoiceNumber")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Placement */}
          <Card>
            <CardHeader>
              <CardTitle>Penempatan Awal</CardTitle>
              <CardDescription>Lokasi dan pemegang asset</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Lokasi *</Label>
                  <Select onValueChange={(val) => setValue("location", val)}>
                    <SelectTrigger className={errors.location ? "border-destructive" : ""}>
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
                  {errors.location && (
                    <p className="text-sm text-destructive">{errors.location.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="owner">Pemegang/PIC *</Label>
                  <Select onValueChange={(val) => setValue("owner", val)}>
                    <SelectTrigger className={errors.owner ? "border-destructive" : ""}>
                      <SelectValue placeholder="Pilih pemegang" />
                    </SelectTrigger>
                    <SelectContent>
                      {(usersResp?.data?.results ?? []).map((user) => (
                        <SelectItem key={user.uuid} value={String(user.uuid)}>
                          {user.fullName} - {user.userType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.owner && (
                    <p className="text-sm text-destructive">{errors.owner.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 0 Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/assets")}
            >
              Batal
            </Button>
            <Button type="button" onClick={() => setStep(1)}>Lanjut</Button>
          </div>
            </>
          )}

          {step === 1 && (
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setStep(0)}>Kembali</Button>
              <Button type="button" onClick={() => setStep(2)}>Lanjut</Button>
            </div>
          )}

          {step === 2 && (
            <>
            <Alert>
              <Blocks className="w-4 h-4" />
              <AlertDescription>
                Data asset akan disimpan. Pastikan data sudah benar sebelum menyimpan.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>Kembali</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </Button>
            </div>
            </>
          )}
        </form>
      </div>
    </AppLayout>
  );
}
