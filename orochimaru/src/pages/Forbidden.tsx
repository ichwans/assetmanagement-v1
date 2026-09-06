import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Forbidden() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const allowed = location?.state?.allowed as string[] | undefined;

  return (
    <AppLayout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Akses Ditolak</h1>
          <p className="text-muted-foreground mb-6">
            Anda tidak memiliki izin untuk mengakses halaman ini.
            {allowed && allowed.length > 0 && (
              <>
                {' '}Halaman ini hanya untuk: <span className="font-medium">{allowed.join(' / ')}</span>.
              </>
            )}
          </p>
          <div className="flex items-center gap-3 justify-center">
            <Button onClick={() => navigate('/')}>Ke Dashboard</Button>
            <Button variant="outline" onClick={() => navigate(-1)}>Kembali</Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

