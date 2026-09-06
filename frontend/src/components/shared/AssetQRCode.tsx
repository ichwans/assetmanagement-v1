import { useRef, useState } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { Download, Printer, Copy, Check, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface AssetQRCodeProps {
  assetId: string;
  assetName?: string;
  size?: number;
  showActions?: boolean;
}

export function AssetQRCode({
  assetId,
  assetName,
  size = 128,
  showActions = true,
}: AssetQRCodeProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Generate the QR code value - URL to the public asset page
  const baseUrl = window.location.origin;
  const qrValue = `${baseUrl}/asset/${assetId}/public`;

  const handleDownload = (format: "png" | "svg") => {
    if (format === "png") {
      // Get canvas element and download as PNG
      const canvas = canvasRef.current?.querySelector("canvas");
      if (canvas) {
        const url = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `QR-${assetId}.png`;
        link.href = url;
        link.click();
        toast.success("QR Code berhasil didownload");
      }
    } else {
      // Download as SVG
      const svg = canvasRef.current?.querySelector("svg");
      if (svg) {
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svg);
        const blob = new Blob([svgString], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `QR-${assetId}.svg`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("QR Code berhasil didownload");
      }
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const canvas = canvasRef.current?.querySelector("canvas");
      const dataUrl = canvas?.toDataURL("image/png");

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>QR Code - ${assetId}</title>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                font-family: system-ui, -apple-system, sans-serif;
              }
              .qr-container {
                text-align: center;
                padding: 20px;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
              }
              .qr-code {
                margin-bottom: 16px;
              }
              .asset-id {
                font-size: 18px;
                font-weight: 600;
                color: #111827;
                margin-bottom: 4px;
              }
              .asset-name {
                font-size: 14px;
                color: #6b7280;
              }
              @media print {
                body { margin: 0; }
                .qr-container { border: 1px solid #000; }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="qr-code">
                <img src="${dataUrl}" alt="QR Code" width="200" height="200" />
              </div>
              <div class="asset-id">${assetId}</div>
              ${assetName ? `<div class="asset-name">${assetName}</div>` : ""}
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(qrValue);
      setCopied(true);
      toast.success("Link berhasil disalin");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin link");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* QR Code Display */}
      <div
        ref={canvasRef}
        className="bg-white p-4 rounded-lg border border-border shadow-sm"
      >
        {/* Hidden canvas for download */}
        <div className="hidden">
          <QRCodeCanvas
            value={qrValue}
            size={256}
            level="H"
            includeMargin
          />
        </div>
        {/* Visible SVG */}
        <QRCodeSVG
          value={qrValue}
          size={size}
          level="H"
          includeMargin
        />
      </div>

      {/* Asset ID Label */}
      <div className="text-center">
        <p className="font-mono text-sm font-medium">{assetId}</p>
        {assetName && (
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
            {assetName}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex flex-wrap gap-2 justify-center">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Download QR Code</DialogTitle>
                <DialogDescription>
                  Pilih format file untuk download
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3 mt-4">
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => handleDownload("png")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download sebagai PNG
                  <span className="ml-auto text-xs text-muted-foreground">
                    (Gambar)
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => handleDownload("svg")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download sebagai SVG
                  <span className="ml-auto text-xs text-muted-foreground">
                    (Vector)
                  </span>
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1" />
            Print
          </Button>

          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            {copied ? (
              <Check className="w-4 h-4 mr-1" />
            ) : (
              <Copy className="w-4 h-4 mr-1" />
            )}
            {copied ? "Tersalin!" : "Copy Link"}
          </Button>
        </div>
      )}
    </div>
  );
}

// Compact version for inline display
export function AssetQRCodeCompact({
  assetId,
  size = 64,
}: {
  assetId: string;
  size?: number;
}) {
  const baseUrl = window.location.origin;
  const qrValue = `${baseUrl}/asset/${assetId}/public`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="bg-white p-2 rounded border border-border hover:border-primary transition-colors cursor-pointer">
          <QRCodeSVG value={qrValue} size={size} level="M" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR Code Asset
          </DialogTitle>
        </DialogHeader>
        <AssetQRCode assetId={assetId} size={180} />
      </DialogContent>
    </Dialog>
  );
}
