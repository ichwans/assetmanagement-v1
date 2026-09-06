import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, FileText } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getSignedFileUrl } from '@/lib/api/files';

type Props = {
  fileName: string;
  cid: string;
  hash: string;
  type?: string;
};

export function DocumentCard({ fileName, cid, hash, type }: Props) {
  const copy = async (val: string) => {
    try { await navigator.clipboard.writeText(val); } catch {}
  };
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<boolean>(false);
  const typeLabel = (() => {
    if (!type) return undefined;
    if (type === 'handover_borrow') return 'Foto Serah Terima (Pinjam)';
    if (type === 'handover_return') return 'Foto Pengembalian';
    if (type === 'invoice') return 'Invoice';
    if (type === 'image') return 'Foto';
    return type;
  })();
  const isImage =
    (type === 'handover_borrow' || type === 'handover_return' || type === 'image') ||
    /\.(png|jpe?g|webp)$/i.test(fileName);
  const isPdf = /\.(pdf)$/i.test(fileName);

  // Prefetch signed URL only
  useEffect(() => {
    setSignedUrl(null);
    if (!cid || !(isImage || isPdf)) return;
    setLoadError(false);
    getSignedFileUrl({ cid, filename: fileName, path: fileName, expires: 600 })
      .then((url) => setSignedUrl(url))
      .catch(() => { /* ignore */ });
    return () => {};
  }, [cid, fileName, isImage, isPdf]);

  const openBlobInNewTab = async () => {
    if (!cid) return;
    if (signedUrl) {
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    try {
      const url = await getSignedFileUrl({ cid, filename: fileName, path: fileName, expires: 600 });
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      // Do nothing; signed is required per policy
    }
  };

  // Download button removed per request

  if (isImage) {
    return (
      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="relative">
            <AspectRatio ratio={16 / 9}>
              {signedUrl && !loadError ? (
                <img
                  src={signedUrl}
                  alt={fileName}
                  className="w-full h-full object-cover rounded-md border"
                  onError={() => setLoadError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center rounded-md border text-xs text-muted-foreground">
                  {!signedUrl ? 'Memuat...' : 'Tidak dapat menampilkan preview gambar'}
                </div>
              )}
            </AspectRatio>
            {cid && (
              <div className="absolute top-2 right-2 flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="secondary" size="icon" aria-label="Buka" onClick={openBlobInNewTab}>
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Buka</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="secondary" size="icon" aria-label="Salin CID" onClick={() => copy(cid)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Salin CID</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{fileName}</p>
            {typeLabel && (
              <p className="text-[10px] text-muted-foreground">{typeLabel}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => copy(cid)}>
              <Copy className="w-4 h-4 mr-1" /> CID
            </Button>
            {/* Unduh button removed */}
            <Button variant="outline" size="sm" onClick={() => copy(hash)}>
              <Copy className="w-4 h-4 mr-1" /> Hash
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isPdf) {
    return (
      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="relative">
            <AspectRatio ratio={16 / 9}>
              {/* Inline PDF preview; some gateways may block embedding. */}
              {signedUrl && !loadError ? (
                <iframe
                  src={signedUrl}
                  title={fileName}
                  className="w-full h-full rounded-md border"
                  onError={() => setLoadError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center rounded-md border text-xs text-muted-foreground">
                  {!signedUrl ? 'Memuat...' : 'Tidak dapat menampilkan preview dokumen'}
                </div>
              )}
            </AspectRatio>
            {cid && (
              <div className="absolute top-2 right-2 flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="secondary" size="icon" aria-label="Buka" onClick={openBlobInNewTab}>
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Buka</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="secondary" size="icon" aria-label="Salin CID" onClick={() => copy(cid)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Salin CID</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{fileName}</p>
            {typeLabel && (
              <p className="text-[10px] text-muted-foreground">{typeLabel}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => copy(cid)}>
              <Copy className="w-4 h-4 mr-1" /> CID
            </Button>
            {/* Unduh button removed */}
            <Button variant="outline" size="sm" onClick={() => copy(hash)}>
              <Copy className="w-4 h-4 mr-1" /> Hash
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <p className="font-medium truncate">{fileName}</p>
            {typeLabel && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                {typeLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">CID: {cid}</p>
          <p className="text-xs text-muted-foreground truncate">SHA-256: {hash}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {cid && (
            <Button variant="outline" size="sm" onClick={openBlobInNewTab}>Buka</Button>
          )}
          {/* Unduh button removed */}
          <Button variant="outline" size="sm" onClick={() => copy(cid)}>
            <Copy className="w-4 h-4 mr-1" /> CID
          </Button>
          <Button variant="outline" size="sm" onClick={() => copy(hash)}>
            <Copy className="w-4 h-4 mr-1" /> Hash
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
