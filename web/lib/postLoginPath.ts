import type { UserRole } from '@/types';

export function postLoginPath(role: UserRole, next?: string | null): string {
  if (next && next !== '/' && next.startsWith('/') && !next.startsWith('//')) return next;
  return role === 'admin' ? '/admin' : '/';
}
