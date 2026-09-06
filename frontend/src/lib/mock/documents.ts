import { DocumentItem, DocumentType } from '@/types';

const docs: DocumentItem[] = [];

const rand = (len = 8) => Math.random().toString(16).slice(2, 2 + len);
const genId = () => `doc_${Date.now()}_${rand(6)}`;
const genCid = () => `bafy${rand(10)}${rand(10)}${rand(10)}`;
const genHash = () => Array.from(crypto.getRandomValues(new Uint8Array(16)))
  .map((b) => b.toString(16).padStart(2, '0'))
  .join('');

export function getDocumentsByAssetId(assetId: string): DocumentItem[] {
  return docs.filter((d) => d.assetId === assetId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function uploadDocument(params: {
  assetId: string;
  fileName: string;
  type: DocumentType;
  uploadedBy: string;
}): DocumentItem {
  const item: DocumentItem = {
    id: genId(),
    assetId: params.assetId,
    fileName: params.fileName,
    type: params.type,
    ipfsCid: genCid(),
    hashSha256: genHash(),
    uploadedBy: params.uploadedBy,
    createdAt: new Date().toISOString(),
  };
  docs.push(item);
  return item;
}

