import { useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUsersApi, type GetUsersQuery, type UserListItem, createUserApi, updateUserApi, changeUserStatusApi, type UserRoleServer } from "@/lib/api/users";
import { getErrorMessage, ApiError } from "@/lib/api/http";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const roleOptions: UserRoleServer[] = ['admin','admin_asset','auditor','head_unit','purchasing','user'];

export default function Users() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [state, setState] = useState<string | undefined>(undefined);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);

  const query: GetUsersQuery = useMemo(() => ({ page, limit, search, state }), [page, limit, search, state]);
  const { data, isFetching } = useQuery({ queryKey: ['users', query], queryFn: () => getUsersApi(query), keepPreviousData: true });

  const pageData = data?.data;
  const users = (pageData?.results ?? []) as UserListItem[];
  const pagination = pageData?.pagination ?? { page: 1, totalPages: 1, totalItems: 0, limit, hasNext: false, hasPrevious: false };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const fullName = String(form.get('fullName') || '').trim();
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '').trim();
    const userType = String(form.get('userType') || 'user') as UserRoleServer;
    if (!fullName || !email || !password) {
      toast.error('Lengkapi semua field');
      return;
    }
    try {
      await createUserApi({ fullName, email, password, userType });
      toast.success('Pengguna berhasil dibuat');
      setIsCreateOpen(false);
      await qc.invalidateQueries({ queryKey: ['users'] });
    } catch (error) {
      // Provide context-specific message for conflict (duplicate email)
      if (error instanceof ApiError && error.status === 'AP00409') {
        toast.error('Email sudah terdaftar, gunakan email lain');
      } else {
        toast.error(getErrorMessage(error));
      }
    }
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;
    const form = new FormData(e.currentTarget);
    const fullName = String(form.get('fullName') || '').trim();
    const userType = String(form.get('userType') || editingUser.userType) as UserRoleServer;
    try {
      await updateUserApi(String(editingUser.email), { fullName, userType });
      toast.success('Pengguna diperbarui');
      setIsEditOpen(false);
      setEditingUser(null);
      await qc.invalidateQueries({ queryKey: ['users'] });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleChangeStatus = async (user: UserListItem, newStatus: 'inactive' | 'banned' | 'active') => {
    try {
      await changeUserStatusApi(String(user.email), { status: newStatus });
      toast.success('Status diperbarui');
      await qc.invalidateQueries({ queryKey: ['users'] });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Manajemen Pengguna</h1>
            <p className="text-muted-foreground">Kelola akun dan peran pengguna</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>Tambah Pengguna</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Pengguna</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative">
                <Input
                  placeholder="Cari nama/email..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Status</Label>
                <Select value={state ?? 'all'} onValueChange={(v) => { setState(v === 'all' ? undefined : v); setPage(1); }}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Semua status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="banned">Banned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Baris</Label>
                <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                  <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {isFetching ? 'Memuat...' : 'Tidak ada data'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow key={u.uuid}>
                        <TableCell className="font-medium">{u.fullName}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell className="capitalize">{u.userType}</TableCell>
                        <TableCell>
                          <Badge variant={u.status === 'active' ? 'default' : u.status === 'banned' ? 'destructive' : 'secondary'}>
                            {u.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(u.createdAt).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell className="text-right gap-2 justify-center items-center flex">
                          <Select value={u.status} onValueChange={(v) => handleChangeStatus(u, v as 'inactive'|'banned'|'active')}>
                            <SelectTrigger className="w-[130px] h-9 px-3 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="banned">Banned</SelectItem>
                            </SelectContent>
                          </Select>
                           <Button variant="outline" size="sm" onClick={() => { setEditingUser(u); setIsEditOpen(true); }}>Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Halaman {pagination.page} dari {pagination.totalPages} • Total {pagination.totalItems}
              </p>
              <div className="space-x-2">
                <Button variant="outline" size="sm" disabled={!pagination.hasPrevious} onClick={() => setPage((p) => Math.max(1, p - 1))}>Sebelumnya</Button>
                <Button variant="outline" size="sm" disabled={!pagination.hasNext} onClick={() => setPage((p) => p + 1)}>Berikutnya</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Pengguna</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input name="fullName" placeholder="Nama Lengkap" required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input name="email" type="email" placeholder="email@contoh.com" required />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input name="password" type="password" placeholder="••••••••" required />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select name="userType" defaultValue="user" onValueChange={(v) => { /* no-op, read from form */ }}>
                  <SelectTrigger><SelectValue placeholder="Pilih role" /></SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Batal</Button>
                <Button type="submit">Simpan</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={(o) => { setIsEditOpen(o); if (!o) setEditingUser(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Pengguna</DialogTitle>
            </DialogHeader>
            {editingUser && (
              <form onSubmit={handleEdit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nama Lengkap</Label>
                  <Input name="fullName" defaultValue={editingUser.fullName} required />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select name="userType" defaultValue={editingUser.userType} onValueChange={() => { /* no-op */ }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
                  <Button type="submit">Simpan</Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
