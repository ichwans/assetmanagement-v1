import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { forgotPasswordApi } from '@/lib/api/auth';

const forgotSchema = z.object({
  email: z.string().email('Email tidak valid'),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotForm) => {
    setErrorMessage(null);
    try {
      const { status } = await forgotPasswordApi(data.email);
      if (status === 'AP00404') {
        // not registered
        setErrorMessage('Email tidak terdaftar');
      } else {
        setSuccessMessage(
          'Email reset password/token sudah terkirim. Silakan periksa inbox Anda.'
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground">
            Lupa Password
          </h2>
          <p className="text-muted-foreground mt-2">
            Masukkan email Anda untuk menerima tautan reset password.
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Mengirim...' : 'Kirim Instruksi'}
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
