import { io, Socket } from 'socket.io-client';
import { getApiUrl } from './api';

let socket: Socket | null = null;

export function connectSocket(token?: string | null): Socket {
  if (socket?.connected) {
    return socket;
  }
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  socket = io(getApiUrl(), {
    transports: ['websocket'],
    withCredentials: true,
    auth: token ? { token } : {},
  });
  socket.on('connect', () => {
    socket?.emit('user_online');
  });
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}
