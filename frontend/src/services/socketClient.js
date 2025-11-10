import { io } from 'socket.io-client';

let socket = null;

export function initSocket(token) {
  if (socket) return socket;
  let url = import.meta.env.VITE_SOCKET_URL;
  if (!url) {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      if (apiUrl) {
        url = new URL(apiUrl).origin;
      }
    } catch (err) {
      console.error('initSocket URL parse error', err);
    }
  }
  if (!url) url = 'http://localhost:3000';
  try {
    console.debug('[socketClient] connecting to', url);
    socket = io(url, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connect_error (url=' + url + ')', err?.message || err);
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
    console.error('disconnectSocket error', err);
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
      } catch (err) {
        console.error('onNotification ack error', err);
      }
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
