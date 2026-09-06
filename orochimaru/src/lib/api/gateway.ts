import { http } from './http';

export type GatewayHealth = {
  status: 'ok' | 'error';
  network?: { height?: number; peers?: number; orderers?: number };
  version?: string;
  timestamp?: string;
};

export async function getGatewayHealth(): Promise<GatewayHealth> {
  try {
    // Expect backend or gateway to expose /api/health proxied in dev
    const { data } = await http.get<any>('/api/v1/health');
    // Normalize a few common shapes
    if (data?.status || data?.data?.status) {
      const d = data.data || data;
      return {
        status: (d.status === 'ok' || d.status === 'healthy') ? 'ok' : 'error',
        network: d.network,
        version: d.version,
        timestamp: d.timestamp || new Date().toISOString(),
      };
    }
    return { status: 'ok', timestamp: new Date().toISOString() };
  } catch {
    return { status: 'error', timestamp: new Date().toISOString() };
  }
}

