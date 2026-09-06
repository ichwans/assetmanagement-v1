import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Procurements() {
  const navigate = useNavigate();
  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Pengadaan</h1>
            <p className="text-muted-foreground">Daftar permintaan pengadaan (placeholder)</p>
          </div>
          <Button onClick={() => navigate('/procurements/new')}>Buat Pengadaan</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Permintaan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Belum ada data. Integrasi API diperlukan.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

