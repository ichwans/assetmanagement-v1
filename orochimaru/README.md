# Asset Hub

Asset Hub is a prototype Asset Management System with a modern React UI and planned Hyperledger Fabric integration. It currently uses mock data and focuses on end-to-end flows for assets, transfers, maintenance, disposal, reports, and a blockchain explorer UI.

## Tech Stack
- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- React Router, React Query
- Recharts (charts)

## Getting Started
Prerequisites: Node.js 18+ and npm.

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

Dev proxy: calls to `/api/*` are forwarded to `http://localhost:8080` (backend). Set `VITE_PROXY_TARGET` if your API differs.

Copy `.env.example` to `.env` and adjust values as needed. Leave `VITE_API_BASE` empty to use the proxy in development.

## Scripts
- `npm run dev` – start dev server
- `npm run build` – production build
- `npm run preview` – preview production build
- `npm run lint` – lint codebase

## Project Status
See `TODO.md` for the feature roadmap and progress across phases, including the planned Hyperledger integration.

## Notes
- Configure API base: leave `VITE_API_BASE` empty to use relative `/api` with Vite proxy (recommended for dev). For direct calls, set `VITE_API_BASE` to your backend URL.
- Admin-only pages are guarded via auth context and role checks.

## Document Upload + IPFS
- Frontend upload (correct): use `FormData` and append a real `File` object. Do not JSON-encode files.

  Example (used by `uploadAssetDocumentFile`):

  - Create `FormData`
  - `form.append('file', fileObj, fileObj.name)`
  - `form.append('type', 'image' | 'invoice' | 'handover_*')`
  - POST to `/api/v1/assets/:id/documents/upload` with the `FormData`. Do not manually set `Content-Type`; the browser sets the multipart boundary.

- Axios config: the global client must NOT force `Content-Type: application/json`. The instance in `src/lib/api/http.ts` omits default headers so FormData is sent as `multipart/form-data`.

- Backend expectations:
  - Parse multipart: read file with `FormFile("file")` (Echo/Go) and do not bind JSON.
  - Upload file bytes to IPFS and return the CID from IPFS (not from the client input). Persist that CID alongside metadata (filename, type, SHA-256).

- Verifying uploads:
  - Network tab: request headers should show `multipart/form-data; boundary=...` and a `file` part with `filename` and size.
  - cURL parity test: `curl -F "file=@/path/image.png" -F "type=image" http://<api>/api/v1/assets/:id/documents/upload` should return a valid `ipfsCid`.
  - Gateway check: open `<VITE_IPFS_GATEWAY>/ipfs/<cid>`; the content type should be image/PDF (not `text/plain`).

- Troubleshooting CID equals "true":
  - The server likely received `file=true` as a string/bool (bad form data) or read `FormValue("file")` instead of the uploaded file part.
  - Fix client to send `FormData` with a real `File` and ensure the axios instance doesn't override headers.
  - Fix server to read multipart file part and to reject invalid CIDs.
