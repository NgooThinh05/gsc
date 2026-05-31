import { EventEmitter } from 'node:events';

const orderEvents = new EventEmitter();
orderEvents.setMaxListeners(0);

export function emitOrderEvent(detail = {}) {
  orderEvents.emit('order-change', {
    type: detail.type || 'update',
    orderId: detail.orderId ?? null,
    status: detail.status ?? null,
    at: new Date().toISOString()
  });
}

export function subscribeOrderEvents(listener) {
  orderEvents.on('order-change', listener);
  return () => orderEvents.off('order-change', listener);
}
