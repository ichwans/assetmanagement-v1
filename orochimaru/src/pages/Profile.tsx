import { useEffect, useState } from "react";
import { User, Mail, Building, Calendar, Shield } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useQuery } from '@tanstack/react-query';
import { getUserDetailApi, changeMyPasswordApi } from '@/lib/api/users';

export default function Profile() {
  const { user } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const { data: detail } = useQuery({
    enabled: !!user?.id,
    queryKey: ['user','detail', user?.id],
    queryFn: () => getUserDetailApi(String(user!.id)),
  });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const current = (form.elements.namedItem('currentPassword') as HTMLInputElement)?.value;
    const next = (form.elements.namedItem('newPassword') as HTMLInputElement)?.value;
    const confirm = (form.elements.namedItem('confirmPassword') as HTMLInputElement)?.value;
    if (!current || !next || !confirm) return;
    if (next !== confirm) { toast.error('Konfirmasi password tidak sama'); return; }
    const res = await changeMyPasswordApi({ currentPassword: current, newPassword: next });
    if (res.status === 'AP00000') {
      toast.success('Password berhasil diubah');
      setIsChangingPassword(false);
      form.reset();
    } else if (res.status === 'AP10002') {
      toast.error('Password saat ini salah');
    } else {
      toast.error(res.message || 'Gagal mengubah password');
    }
  };

  if (!user) return null;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">Profil Saya</h1>

        <div className="grid gap-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Akun</CardTitle>
              <CardDescription>
                Data profil Anda yang terdaftar di sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-3xl font-bold text-primary">
                    {getInitials(user.name)}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <User className="w-4 h-4" />
                        <span>Nama Lengkap</span>
                      </div>
                      <p className="font-medium">{detail?.data?.fullName || user.name}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Mail className="w-4 h-4" />
                        <span>Email</span>
                      </div>
                      <p className="font-medium">{user.email}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Building className="w-4 h-4" />
                        <span>Department</span>
                      </div>
                      <p className="font-medium">{user.department}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Shield className="w-4 h-4" />
                        <span>Role</span>
                      </div>
                      <p className="font-medium capitalize">
                        {user.role}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>Bergabung Sejak</span>
                      </div>
                      <p className="font-medium">
                        {new Date(user.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Password Card */}
          <Card>
            <CardHeader>
              <CardTitle>Ubah Password</CardTitle>
              <CardDescription>
                Pastikan Anda menggunakan password yang kuat
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isChangingPassword ? (
                <Button onClick={() => setIsChangingPassword(true)}>
                  Ubah Password
                </Button>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Password Saat Ini</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="Masukkan password saat ini"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Password Baru</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Masukkan password baru"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Ulangi password baru"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Simpan Password</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsChangingPassword(false)}
                    >
                      Batal
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Data profil disimpan secara aman di database off-chain (PostgreSQL).
                Untuk mengubah data selain password, silakan hubungi Administrator.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
