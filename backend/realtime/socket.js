let _io;

function init(io) {
  _io = io;
}

function emitToUser(userId, event, payload) {
  if (!_io) return;
  _io.to(`user:${userId}`).emit(event, payload);
}

function broadcast(event, payload) {
  if (!_io) return;
  _io.emit(event, payload);
}

/**
 * Emit to all sockets of a user but wait for at least one acknowledgement.
 * Uses per-socket emit with callback; resolves with ack results or times out.
 */
async function emitToUserWithAck(userId, event, payload, timeoutMs = 5000) {
  if (!_io) return { ok: false, reason: "io_not_initialized" };
  const room = `user:${userId}`;
  const sockets = await _io.in(room).fetchSockets();
  if (!sockets || sockets.length === 0) {
    return { ok: false, reason: "no_active_sockets" };
  }

  // Attach a notification id so client can ack the correct message
  const notificationId =
    payload?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const data = { ...payload, id: notificationId };

  return await new Promise((resolve) => {
    let resolved = false;
    const results = [];
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve({
          ok: false,
          reason: "timeout",
          acks: results,
          id: notificationId,
        });
      }
    }, timeoutMs);

    sockets.forEach((sock) => {
      try {
        sock.emit(event, data, (ack) => {
          results.push({ socketId: sock.id, ack });
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            resolve({ ok: true, acks: results, id: notificationId });
          }
        });
      } catch (err) {
        results.push({
          socketId: sock.id,
          error: err?.message || "emit_failed",
        });
      }
    });
  });
}

module.exports = { init, emitToUser, broadcast, emitToUserWithAck };
