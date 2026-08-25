import { api } from './api';

export async function swrFetcher<T>(path: string): Promise<T> {
  const res = await api<T>(path);
  return res.data;
}
