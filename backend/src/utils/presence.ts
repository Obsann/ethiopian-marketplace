const socketsByUser = new Map<string, Set<string>>();

export function markUserOnline(userId: string, socketId: string): boolean {
  let sockets = socketsByUser.get(userId);
  if (!sockets) {
    sockets = new Set();
    socketsByUser.set(userId, sockets);
  }
  const wasOffline = sockets.size === 0;
  sockets.add(socketId);
  return wasOffline;
}

/** Returns true when the user has no remaining sockets. */
export function markUserOffline(userId: string, socketId: string): boolean {
  const sockets = socketsByUser.get(userId);
  if (!sockets) return true;
  sockets.delete(socketId);
  if (sockets.size > 0) return false;
  socketsByUser.delete(userId);
  return true;
}

export function isUserOnline(userId: string): boolean {
  return (socketsByUser.get(userId)?.size ?? 0) > 0;
}

export function onlineUserIds(): string[] {
  return Array.from(socketsByUser.keys());
}
