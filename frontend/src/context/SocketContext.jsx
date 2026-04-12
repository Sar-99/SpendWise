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

// Динамическое определение URL сокета (тот же хост, что и фронтенд)
const getSocketURL = () => {
    const hostname = window.location.hostname;
    // Порт бэкенда – 3001 (можно вынести в .env)
    return `http://${hostname}:3001`;
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
        });

        newSocket.on('connect', () => console.log('✅ Socket connected'));
        newSocket.on('connect_error', (err) => {
            console.error('❌ Socket connection error:', err.message);
            // При ошибке websocket переключаемся на polling
            if (newSocket.io.opts.transports[0] === 'websocket') {
                newSocket.io.opts.transports = ['polling'];
            }
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