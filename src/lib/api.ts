// src/admin/lib/api.ts
import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787';

const api = axios.create({ baseURL: API_BASE });

// Always send the ngrok-skip header
api.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';

// ⬇️ Pick the right token based on endpoint
api.interceptors.request.use((config:any) => {
  const url = config.url || '';
  const isAdmin = url.startsWith('/api/admin');
  const adminTok = localStorage.getItem('admin_token');
  const userTok  = localStorage.getItem('token');

  const tok = isAdmin ? adminTok : userTok;
  if (tok) {
    (config.headers ||= {}).Authorization = `Bearer ${tok}`;
  } else {
    if (config.headers && 'Authorization' in config.headers) {
      delete (config.headers as any).Authorization;
    }
  }
  return config;
});

export function setAdminToken(token?: string) {
  if (token) localStorage.setItem('admin_token', token);
  else localStorage.removeItem('admin_token');
}

export async function adminLogin(username: string, password: string) {
  const { data } = await api.post('/api/admin/login', { username, password });
  return data; // { token, admin? }
}

export async function listOrgs() {
  const { data } = await api.get('/api/admin/orgs');
  return data;
}

export async function toggleOrg(id: string, disabled: boolean) {
  const { data } = await api.post(`/api/admin/orgs/${id}/disable`, { disabled });
  return data;
}

export async function listOrdersForOrg(orgId: string, limit = 200) {
  const { data } = await api.get(`/api/admin/orgs/${orgId}/orders`, { params: { limit } });
  return data;
}

export async function listCorrections(orgId?: string) {
  const { data } = await api.get('/api/admin/ai-corrections', { params: { org_id: orgId } });
  return data;
}

export async function aiSpend(range: 'daily'|'weekly'|'monthly' = 'daily') {
  const { data } = await api.get('/api/admin/ai-spend/summary', { params: { range } });
  return data;
}

export async function retrain(orgId?: string, note?: string) {
  const { data } = await api.post('/api/admin/retrain', { org_id: orgId, note });
  return data;
}

export async function me() {
    const {data} = await axios.get(`${API_BASE}/api/org/me`);
    return data;
  }


  export async function aiFixOrder(id: string, human_fixed: { items: any[]; reason?: string }) {
    const {data} = await api.post(`${API_BASE}/api/orders/${id}/ai-fix`, { human_fixed });
    return data;
  }

  export async function updateStatus(id: string, status: 'pending'|'shipped'|'paid') {
    const {data} = await api.post(`${API_BASE}/api/orders/${id}/status`, { status });
    return data;
  }
export default api;