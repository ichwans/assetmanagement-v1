import { useState } from "react";
import { Settings as SettingsIcon, Server, Shield, Trash2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DialogFooter } from "@/components/ui/dialog";
import { resetAssets, resetMeta } from "@/lib/api/admin";

export default function Settings() {
  const [resetOpen, setResetOpen] = useState<null | 'assets' | 'meta'>(null);
  const [confirmText, setConfirmText] = useState("");

  const doReset = async () => {
    try {
      if (confirmText !== 'asset-hub') { toast.error('Ketik "asset-hub" untuk konfirmasi'); return; }
      if (resetOpen === 'assets') await resetAssets(confirmText);
      if (resetOpen === 'meta') await resetMeta(confirmText);
      toast.success('Data berhasil direset');
      setResetOpen(null); setConfirmText("");
    } catch (e) {
      toast.error('Gagal reset data');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" />
            Pengaturan
          </h1>
          <p className="text-muted-foreground">
            Konfigurasi sistem dan preferensi aplikasi
          </p>
        </div>

        {/* Blockchain Network */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              Hyperledger Network
            </CardTitle>
            <CardDescription>
              Konfigurasi koneksi ke jaringan blockchain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Network Name</Label>
                <p className="text-sm mt-1">asset-network</p>
              </div>
              <div>
                <Label>Channel</Label>
                <p className="text-sm mt-1">assetchannel</p>
              </div>
              <div>
                <Label>Organization</Label>
                <p className="text-sm mt-1">Org1MSP</p>
              </div>
              <div>
                <Label>Chaincode</Label>
                <p className="text-sm mt-1">asset-contract</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Status Koneksi</p>
                <p className="text-sm text-muted-foreground">Peer nodes aktif</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-success font-medium">Connected</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold">2</p>
                <p className="text-xs text-muted-foreground">Peer Nodes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">1</p>
                <p className="text-xs text-muted-foreground">Orderer</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">1</p>
                <p className="text-xs text-muted-foreground">Organization</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database section removed (non-configurable) */}

        {/* Notifications: removed (non-configurable) */}

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Keamanan
            </CardTitle>
            <CardDescription>
              Pengaturan keamanan dan akses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Role & Permissions</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Admin</span>
                  <span>Full CRUD access</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Staff</span>
                  <span>View & My Assets only</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Session</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timeout</span>
                  <span>24 jam</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Storage</span>
                  <span>Local Storage</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Reset data Assets, Categories dan Locations. Aksi ini tidak dapat dibatalkan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Reset Assets</p>
                <p className="text-sm text-muted-foreground">Hapus semua data asset, riwayat, maintenance, dan dokumen</p>
              </div>
              <Button variant="destructive" onClick={() => { setResetOpen('assets'); setConfirmText(''); }}>Reset</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Reset Categories & Locations</p>
                <p className="text-sm text-muted-foreground">Hapus semua kategori dan lokasi</p>
              </div>
              <Button variant="destructive" onClick={() => { setResetOpen('meta'); setConfirmText(''); }}>Reset</Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button removed: no configurable items */}
      </div>

      <Dialog open={resetOpen !== null} onOpenChange={(o) => { if (!o) { setResetOpen(null); setConfirmText(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Reset {resetOpen === 'assets' ? 'Assets' : 'Categories & Locations'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Aksi ini akan menghapus permanen data {resetOpen === 'assets' ? 'asset beserta riwayat, maintenance, dan dokumen' : 'kategori dan lokasi'}. Untuk melanjutkan, ketik <span className="font-semibold">asset-hub</span> di bawah ini.
            </p>
            <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="asset-hub" />
          </div>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setResetOpen(null); setConfirmText(''); }}>Batal</Button>
            <Button variant="destructive" disabled={confirmText !== 'asset-hub'} onClick={doReset}>Saya Mengerti, Reset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
