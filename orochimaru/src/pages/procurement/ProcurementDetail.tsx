import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams } from 'react-router-dom';

export default function ProcurementDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Detail Pengadaan</h1>
            <p className="text-muted-foreground">ID: {id}</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/procurements')}>Kembali</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ringkasan</CardTitle>
            <CardDescription>Placeholder untuk detail permintaan</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Implementasikan integrasi API pengadaan di sini.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

