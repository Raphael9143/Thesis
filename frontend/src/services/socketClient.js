import { io } from 'socket.io-client';

let socket = null;

export function initSocket(token) {
  if (socket) return socket;
  const url = import.meta.env.VITE_SOCKET_URL || window.location.origin;
  try {
    socket = io(url, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connect_error', err?.message || err);
    });

    socket.on('connect', () => {
      console.log('socket connected', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('socket disconnected', reason);
    });
  } catch (err) {
    console.error('initSocket error', err);
  }
  return socket;
}

export function disconnectSocket() {
  try {
    socket?.disconnect();
  } catch (err) {
    // ignore
  }
  socket = null;
}

// handler signature: (data, ackFn?) => void
export function onNotification(handler) {
  if (!socket) return () => {};
  const wrapped = (data, ack) => {
    try {
      handler(data, ack);
    } catch (err) {
      console.error('onNotification handler error', err);
      // still call ack if provided
      try {
        if (typeof ack === 'function') ack({ ok: false, reason: 'handler_error' });
      } catch {}
    }
  };
  socket.on('notification', wrapped);
  return () => socket.off('notification', wrapped);
}

export default {
  initSocket,
  disconnectSocket,
  onNotification,
};
