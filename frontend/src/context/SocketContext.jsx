import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

// Получаем URL сокета из переменной окружения
const getSocketURL = () => {
    // VITE_API_URL имеет вид https://spendwise-backend-20ce.onrender.com/api
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
        // Убираем /api и заменяем https:// на wss://
        let baseUrl = apiUrl.replace(/\/api$/, '').replace(/^https/, 'wss');
        return baseUrl;
    }
    // fallback для разработки
    const hostname = window.location.hostname;
    return `ws://${hostname}:3001`;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            if (socket) {
                if (socket.connected) socket.disconnect();
                setSocket(null);
            }
            return;
        }

        const token = localStorage.getItem('token');
        const socketUrl = getSocketURL();
        console.log('Connecting to socket:', socketUrl);

        const newSocket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            // Добавляем опцию secure для wss
            secure: socketUrl.startsWith('wss')
        });

        newSocket.on('connect', () => console.log('✅ Socket connected'));
        newSocket.on('connect_error', (err) => {
            console.error('❌ Socket connection error:', err.message);
        });
        newSocket.on('disconnect', (reason) => console.log('🔌 Socket disconnected:', reason));

        setSocket(newSocket);

        return () => {
            if (newSocket && newSocket.connected) newSocket.disconnect();
        };
    }, [user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};