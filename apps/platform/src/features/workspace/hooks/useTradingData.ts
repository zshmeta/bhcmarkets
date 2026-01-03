import { useState, useEffect } from 'react';

const API_BASE = (window as unknown as { __API_BASE?: string }).__API_BASE || 'http://localhost:8080';

export const useTradingData = () => {
    const { user } = useAuth();
    const [positions, setPositions] = useState<unknown[]>([]);
    const [orders] = useState<unknown[]>([]);

    const fetchData = async () => {
        if (!user) return;

        try {
            const token = localStorage.getItem('accessToken');
            const headers = { 'Authorization': `Bearer ${token}` };

            const posRes = await fetch(`${API_BASE}/positions?userId=${user.id}`, { headers });
            if (posRes.ok) {
                setPositions((await posRes.json()) as unknown[]);
            }

            // Orders endpoint not yet implemented fully in backend to list, but let's try
            // const ordRes = await fetch(`${API_BASE}/orders?userId=${user.id}`, { headers });
            // if (ordRes.ok) setOrders(await ordRes.json());
        } catch (e) {
            console.error("Failed to fetch trading data", e);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [user]);

    return { positions, orders };
};
