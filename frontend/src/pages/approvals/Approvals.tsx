import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listApprovals } from '@/lib/api/approvals';

const statusBadge = {
  PENDING: 'bg-warning/10 text-warning border-warning/20',
  APPROVED: 'bg-success/10 text-success border-success/20',
  REJECTED: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function Approvals() {
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ['approvals','PENDING'], queryFn: () => listApprovals('PENDING') });
  const list = (data?.data ?? []) as import('@/types').ApprovalItem[];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Approval Inbox</h1>
          <p className="text-muted-foreground">Permintaan yang menunggu persetujuan</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Alasan/Catatan</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground h-24">
                        Tidak ada approval menunggu.
                      </TableCell>
                    </TableRow>
                  ) : (
                    list.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">{item.id}</TableCell>
                        <TableCell>
                          <div className="font-medium">{item.assetName}</div>
                          <div className="text-xs text-muted-foreground">{item.assetId}</div>
                        </TableCell>
                        <TableCell className="capitalize">{item.type}</TableCell>
                        <TableCell>{item.requesterName}</TableCell>
                        <TableCell className="max-w-[240px] truncate">{item.reason || (item.notes && item.notes.length > 0 ? item.notes[0] : '-')}</TableCell>
                        <TableCell>{new Date(item.createdAt).toLocaleString('id-ID')}</TableCell>
                        <TableCell>
                          <Badge className={statusBadge[item.status as keyof typeof statusBadge]}>{item.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/approvals/${item.id}`)}>
                            Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
