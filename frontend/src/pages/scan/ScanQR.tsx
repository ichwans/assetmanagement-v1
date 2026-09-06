import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { QrCode, Camera, Search, Package, StopCircle, AlertCircle } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAssetDetail } from "@/lib/api/assets";
import { toast } from "sonner";

export default function ScanQR() {
  const navigate = useNavigate();
  const [manualInput, setManualInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [isFetchingCameras, setIsFetchingCameras] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-reader";
  const fileScannerContainerId = "qr-reader-file";
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  // Pre-check environment support for camera
  useEffect(() => {
    const isLocalhost = [
      "localhost",
      "127.0.0.1",
      "::1",
    ].includes(window.location.hostname);

    const hasMediaDevices = typeof navigator !== "undefined" && !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia;

    if (!hasMediaDevices) {
      setHasCamera(false);
      setErrorMessage("Browser tidak mendukung akses kamera. Gunakan input manual atau unggah gambar QR.");
      return;
    }

    if (!window.isSecureContext && !isLocalhost) {
      setHasCamera(false);
      setErrorMessage("Kamera memerlukan HTTPS. Buka lewat https atau gunakan input manual / unggah gambar QR.");
      return;
    }
  }, []);

  // Fetch camera list (after env check)
  useEffect(() => {
    const fetchCams = async () => {
      if (!hasCamera) return;
      try {
        setIsFetchingCameras(true);
        const devs = await Html5Qrcode.getCameras();
        const list = (devs || []).map(d => ({ id: d.id, label: d.label || "Camera" }));
        setCameras(list);
        // Prefer back camera by label, else first
        const preferred = list.find(d => /back|rear|environment/i.test(d.label)) || list[0] || null;
        if (preferred) setSelectedCameraId(preferred.id);
      } catch (e) {
        // ignore; handled elsewhere
      } finally {
        setIsFetchingCameras(false);
      }
    };
    fetchCams();
  }, [hasCamera]);

  const handleScanSuccess = async (decodedText: string) => {
    // Stop scanning first
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    setIsScanning(false);

    // Parse the QR code content
    // Expected formats:
    // - Direct asset ID: "AST-001"
    // - URL: "https://example.com/asset/AST-001/public"
    // - JSON: {"assetId": "AST-001"}
    let assetId = decodedText;

    // Try to extract asset ID from URL
    const urlMatch = decodedText.match(/\/asset\/([^/]+)/);
    if (urlMatch) {
      assetId = urlMatch[1];
    }

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(decodedText);
      if (parsed.assetId) {
        assetId = parsed.assetId;
      }
    } catch {
      // Not JSON, use as-is
    }

    toast.success(`QR Code terdeteksi: ${assetId}`);

    // Navigate to asset page
    try {
      const resp = await getAssetDetail(assetId);
      const asset = resp?.data as unknown as typeof import("@/types").Asset;
      if (asset?.assetId) {
        navigate(`/asset/${asset.assetId}/public`);
      } else {
        toast.error("Asset tidak ditemukan");
      }
    } catch {
      // Try navigating anyway - maybe it's a valid ID
      navigate(`/asset/${assetId}/public`);
    }
  };

  const handleStartScan = async () => {
    setErrorMessage(null);

    try {
      // Check if camera is available
      let devices = cameras;
      if (!devices || devices.length === 0) {
        devices = await Html5Qrcode.getCameras();
      }
      if (!devices || devices.length === 0) {
        setHasCamera(false);
        setErrorMessage("Tidak ada kamera yang terdeteksi. Gunakan input manual.");
        return;
      }

      setIsScanning(true);

      // Initialize scanner
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop().catch(() => {});
      }
      scannerRef.current = new Html5Qrcode(scannerContainerId);

      const configs = [
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        { fps: 10, qrbox: { width: 250, height: 250 } }, // without aspectRatio
      ];

      const selected = devices.find((d: any) => d.id === selectedCameraId);
      const constraints: any[] = [];
      if (selected) constraints.push({ deviceId: { exact: selected.id } });
      constraints.push({ facingMode: "environment" });
      if (devices[0]) constraints.push({ deviceId: { exact: devices[0].id } });

      let started = false;
      let lastErr: unknown = null;
      for (const c of constraints) {
        for (const cfg of configs) {
          try {
            await scannerRef.current.start(c, cfg as any, handleScanSuccess, () => {});
            started = true;
            break;
          } catch (e) {
            lastErr = e;
          }
        }
        if (started) break;
      }
      if (!started) {
        throw lastErr || new Error("Failed to start camera with all fallbacks");
      }
    } catch (err) {
      console.error("Scanner error:", err);
      setIsScanning(false);

      if (err instanceof Error) {
        if (err.message.includes("Permission")) {
          setErrorMessage("Akses kamera ditolak. Izinkan akses kamera di browser settings.");
        } else if (err.message.includes("NotFound") || err.message.includes("not found")) {
          setHasCamera(false);
          setErrorMessage("Kamera tidak ditemukan. Gunakan input manual.");
        } else if (err.name === "NotReadableError") {
          setErrorMessage("Kamera sedang digunakan aplikasi lain. Tutup aplikasi lain lalu coba lagi.");
        } else if (err.name === "OverconstrainedError") {
          setErrorMessage("Kamera yang dipilih tidak tersedia. Pilih kamera lain lalu coba lagi.");
        } else {
          setErrorMessage(`Error: ${err.message}`);
        }
      } else {
        try {
          const msg = typeof err === "string" ? err : JSON.stringify(err);
          setErrorMessage(`Gagal memulai kamera: ${msg}`);
        } catch {
          setErrorMessage("Gagal memulai kamera. Coba gunakan input manual.");
        }
      }
    }
  };

  const handleScanFromImage = async (file: File) => {
    setErrorMessage(null);
    try {
      // Create a temporary scanner bound to hidden container
      const tempScanner = new Html5Qrcode(fileScannerContainerId);
      // Show image preview is not necessary for UX here
      // @ts-expect-error scanFile exists on Html5Qrcode
      const result: string = await tempScanner.scanFile(file, false);
      await tempScanner.clear();
      await tempScanner.stop?.().catch(() => {});
      await handleScanSuccess(result);
    } catch (err) {
      console.error("Scan from image error:", err);
      if (err instanceof Error) {
        setErrorMessage(`Gagal membaca QR dari gambar: ${err.message}`);
      } else {
        setErrorMessage("Gagal membaca QR dari gambar.");
      }
    }
  };

  const handleStopScan = async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch {}
    }
    try {
      // Clear DOM inside container to avoid start errors next time
      await scannerRef.current?.clear?.();
    } catch {}
    setIsScanning(false);
  };

  const handleManualSearch = async () => {
    if (!manualInput.trim()) {
      toast.error("Masukkan Asset ID");
      return;
    }
    try {
      const resp = await getAssetDetail(manualInput.trim().toUpperCase());
      const asset = resp?.data as unknown as typeof import("@/types").Asset;
      if (asset?.assetId) {
        navigate(`/asset/${asset.assetId}/public`);
      } else {
        toast.error("Asset tidak ditemukan");
      }
    } catch {
      toast.error("Asset tidak ditemukan");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4 px-6">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Package className="w-6 h-6" />
          <div>
            <h1 className="font-bold">Asset Hub</h1>
            <p className="text-xs text-primary-foreground/70">QR Scanner</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Error Alert */}
        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Scanner Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Scan QR Code Asset
            </CardTitle>
            <CardDescription>
              Arahkan kamera ke QR Code untuk melihat informasi asset
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Camera Preview Area */}
              <div className="aspect-square max-w-[300px] mx-auto bg-muted rounded-lg overflow-hidden border-2 border-border relative">
                {/* Ensure the scanner element always exists before starting */}
                <div id={scannerContainerId} className={`w-full h-full ${isScanning ? "" : "hidden"}`} />
                {!isScanning && (
                  <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center">
                    <Camera className="w-16 h-16 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground text-center px-4">
                      {hasCamera ? "Klik tombol di bawah untuk memulai scan" : "Kamera tidak tersedia"}
                    </p>
                  </div>
                )}
              </div>

              {/* Hidden container for file-based scanning */}
              <div id={fileScannerContainerId} className="hidden" />

              {/* Camera selector and actions */}
              {!isScanning && hasCamera && (
                <div className="mt-3 grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground min-w-[96px]">Pilih Kamera</span>
                    <Select
                      value={selectedCameraId || undefined}
                      onValueChange={(v) => setSelectedCameraId(v)}
                      disabled={isFetchingCameras}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={isFetchingCameras ? "Memuat kamera..." : "Pilih kamera"} />
                      </SelectTrigger>
                      <SelectContent>
                        {cameras.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.label || "Kamera"}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {isScanning ? (
                <Button
                  className="w-full mt-4"
                  variant="destructive"
                  onClick={handleStopScan}
                >
                  <StopCircle className="w-4 h-4 mr-2" />
                  Stop Scan
                </Button>
              ) : (
                <div className="flex flex-col gap-2 mt-4">
                  <Button
                    onClick={handleStartScan}
                    disabled={!hasCamera}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Mulai Scan
                  </Button>
                  {errorMessage && (
                    <Button variant="outline" onClick={handleStartScan} disabled={!hasCamera}>
                      Coba Lagi
                    </Button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleScanFromImage(f);
                    }}
                  />
                  <Button
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Unggah Gambar QR
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">atau</span>
          </div>
        </div>

        {/* Manual Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Input Manual
            </CardTitle>
            <CardDescription>
              Masukkan Asset ID secara manual jika QR tidak terbaca
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Contoh: AST-001"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
              />
              <Button onClick={handleManualSearch}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              Scan QR Code yang tertempel pada asset fisik untuk melihat
              informasi lengkap yang terverifikasi dari blockchain
            </p>
          </CardContent>
        </Card>

        {/* Back to app link */}
        <div className="text-center">
          <Button variant="link" onClick={() => navigate("/")}>
            Kembali ke Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
}
