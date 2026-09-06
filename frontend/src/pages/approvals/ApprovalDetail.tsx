import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getApprovalByIdApi, decideApprovalApi } from '@/lib/api/approvals';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';

const statusBadge = {
  PENDING: 'bg-warning/10 text-warning border-warning/20',
  APPROVED: 'bg-success/10 text-success border-success/20',
  REJECTED: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function ApprovalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState('');
  const { data } = useQuery({ enabled: !!id, queryKey: ['approval', id], queryFn: () => getApprovalByIdApi(id!) });
  const item = data?.data;

  if (!item) {
    return (
      <AppLayout>
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Approval tidak ditemukan.</p>
          <Button className="mt-4" onClick={() => navigate('/approvals')}>Kembali</Button>
        </div>
      </AppLayout>
    );
  }

  const onDecision = async (decision: 'APPROVE' | 'REJECT') => {
    if (!item) return;
    const resp = await decideApprovalApi(item.id, decision, note || undefined);
    toast.success(decision === 'APPROVE' ? 'Approval disetujui' : 'Approval ditolak');
    if (resp?.errors && resp.errors.length > 0) {
      const msg = resp.errors.map(e => e.message).join('; ');
      toast.warning(`Ledger warning: ${msg}`);
    }
    navigate('/approvals');
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Detail Approval</h1>
          <p className="text-muted-foreground">ID: <span className="font-mono">{item.id}</span></p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ringkasan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge className={statusBadge[item.status as keyof typeof statusBadge]}>{item.status}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tipe</span>
              <span className="capitalize">{item.type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Asset</span>
              <span className="font-medium">{item.assetName} <span className="font-mono text-xs text-muted-foreground">({item.assetId})</span></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Requester</span>
              <span>{item.requesterName}</span>
            </div>
            {item.toUnit && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tujuan</span>
                <span>{item.toUnit}</span>
              </div>
            )}
            {item.reason && (
              <div>
                <p className="text-sm text-muted-foreground">Alasan</p>
                <p className="text-sm">{item.reason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quorum Progress (if available) */}
        {(typeof item.requiredApprovals === 'number') && (
          <Card>
            <CardHeader>
              <CardTitle>Progress Persetujuan</CardTitle>
              <CardDescription>
                {Math.min(item.approvedCount ?? 0, item.requiredApprovals)} / {item.requiredApprovals} disetujui
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-2 w-full bg-muted rounded">
                <div
                  className="h-2 bg-primary rounded"
                  style={{ width: `${Math.min(100, Math.round(((item.approvedCount ?? 0) / Math.max(1, item.requiredApprovals)) * 100))}%` }}
                />
              </div>
              {Array.isArray(item.votes) && item.votes.length > 0 && (
                <div className="mt-4 space-y-2">
                  {item.votes.map((v, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                      <div>
                        <span className="font-medium mr-2">{v.user}</span>
                        <Badge variant={v.decision === 'APPROVE' ? 'secondary' : 'destructive'}>
                          {v.decision === 'APPROVE' ? 'Approved' : 'Rejected'}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground">
                        {new Date(v.at).toLocaleString('id-ID')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Catatan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Isi catatan persetujuan/penolakan (opsional)" />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => navigate('/approvals')}>Batal</Button>
              <Button variant="destructive" onClick={() => onDecision('REJECT')}>Reject</Button>
              <Button onClick={() => onDecision('APPROVE')}>Approve</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
