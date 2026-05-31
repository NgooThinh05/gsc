import { authenticateToken } from '../middleware/auth.js';
import { subscribeOrderEvents } from '../realtime/orderEvents.js';

export function streamOrderEvents(req, res) {
  authenticateToken(req, res, () => {
    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    res.write(': connected\n\n');

    const unsubscribe = subscribeOrderEvents((payload) => {
      res.write(`event: order-change\n`);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    });

    const heartbeat = setInterval(() => {
      res.write(': ping\n\n');
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
      res.end();
    });
  });
}
