import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

type Props = {
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  onFilesSelected?: (files: File[]) => void;
};

export function FileUploader({ accept, multiple, maxSizeMB = 5, onFilesSelected }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string>("");

  const open = () => inputRef.current?.click();
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const selected = Array.from(e.target.files || []);
    const allowedExts = (accept || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const valid: File[] = [];
    const invalid: string[] = [];
    selected.forEach(f => {
      const ext = '.' + (f.name.split('.').pop() || '').toLowerCase();
      const sizeOk = f.size <= maxSizeMB * 1024 * 1024;
      const typeOk = allowedExts.length === 0 || allowedExts.includes(ext);
      if (sizeOk && typeOk) {
        valid.push(f);
      } else {
        invalid.push(`${f.name}${!sizeOk ? ` (>${maxSizeMB}MB)` : ''}${!typeOk ? ' (format tidak didukung)' : ''}`);
      }
    });
    if (invalid.length > 0) {
      setError(`File tidak valid: ${invalid.join(', ')}`);
    }
    setFiles(valid);
    onFilesSelected?.(valid);
  };

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Input ref={inputRef} type="file" accept={accept} multiple={multiple} onChange={onChange} className="hidden" />
          <Button type="button" variant="outline" onClick={open}>Pilih File</Button>
          <div className="text-sm text-muted-foreground">
            {files.length === 0 ? 'Belum ada file dipilih' : `${files.length} file dipilih`}
          </div>
        </div>
        {files.length > 0 && (
          <ul className="mt-3 text-sm list-disc pl-5 space-y-1">
            {files.map((f) => (
              <li key={f.name} className="truncate">{f.name}</li>
            ))}
          </ul>
        )}
        {error && (
          <p className="text-xs text-destructive mt-2">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
