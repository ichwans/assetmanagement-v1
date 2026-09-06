import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resetPasswordApi } from '@/lib/api/auth';

const resetSchema = z
  .object({
    password: z.string().min(8, 'Password minimal 8 karakter'),
    confirm: z.string().min(1),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Password tidak cocok',
    path: ['confirm'],
  });

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirm: '' },
  });

  const onSubmit = async (data: ResetForm) => {
    setErrorMessage(null);
    try {
      await resetPasswordApi(token, data.password);
      setSuccessMessage('Password berhasil diubah, silakan login ulang.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan');
    }
  };

  useEffect(() => {
    if (!token) {
      setErrorMessage('Token reset tidak ditemukan');
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground">
            Ubah Password
          </h2>
          <p className="text-muted-foreground mt-2">
            Masukkan password baru Anda.
          </p>
        </div>

        {successMessage ? (
          <div className="p-4 bg-green-100 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">{successMessage}</p>
            <div className="mt-4 text-center">
              <Button onClick={() => navigate('/login')}>
                Kembali ke Login
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {errorMessage && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{errorMessage}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password Baru</Label>
              <Input
                id="password"
                type="password"
                placeholder="Masukkan password baru"
                {...register('password')}
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Konfirmasi Password</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Ketik ulang password"
                {...register('confirm')}
                className={errors.confirm ? 'border-destructive' : ''}
              />
              {errors.confirm && (
                <p className="text-sm text-destructive">{errors.confirm.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || !!errorMessage}>
              {isSubmitting ? 'Memproses...' : 'Ubah Password'}
            </Button>

            <p className="mt-4 text-center text-sm">
              <Link to="/login" className="text-primary hover:underline">
                Kembali ke Login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
