import { useEffect, useRef } from 'react';
import { API_URL } from '../api/client';

export function useOrderUpdates(onUpdate) {
  const handlerRef = useRef(onUpdate);

  useEffect(() => {
    handlerRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    const token = sessionStorage.getItem('gsc_token');
    if (!token) return undefined;

    const source = new EventSource(`${API_URL}/events/orders?token=${encodeURIComponent(token)}`);
    const handleOrderChange = () => {
      handlerRef.current?.();
    };

    source.addEventListener('order-change', handleOrderChange);

    return () => {
      source.removeEventListener('order-change', handleOrderChange);
      source.close();
    };
  }, []);
}
