import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { usersAPI } from '../utils/api';
import PointToast from '../components/PointToast';
import RankUpCelebration from '../components/RankUpCelebration';

import { CONFIG } from '../utils/config';

const SocketContext = createContext();

const SOCKET_URL = CONFIG.SOCKET_URL;

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  // 🏆 Gamification States
  const [pointEvent, setPointEvent] = useState(null);
  const [rankUpEvent, setRankUpEvent] = useState(null);

  const socketRef = useRef(null);
  const userIdRef = useRef((() => {
    try {
      const info = JSON.parse(window.safeStorage.getItem('userInfo') || '{}');
      const id = info?._id || info?.id;
      return id ? String(id) : null;
    } catch (_) { return null; }
  })());

  useEffect(() => {
    const id = user?._id || user?.id;
    if (id) {
      userIdRef.current = String(id);
      // Request notification permission when user is logged in
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission().then(setNotificationPermission);
      }
    } else {
      try {
        const info = JSON.parse(window.safeStorage.getItem('userInfo') || '{}');
        const storedId = info?._id || info?.id;
        if (storedId) userIdRef.current = String(storedId);
      } catch (_) {}
    }
  }, [user]);

  const doJoinUser = useCallback(() => {
    if (socketRef.current && userIdRef.current) {
      socketRef.current.emit('join_user', userIdRef.current);
    }
  }, []);

  const fetchOnlineUsers = useCallback(async () => {
    try {
      const token = window.safeStorage.getItem('token') || window.safeStorage.getItem('userToken');
      if (!token) return;
      const ids = await usersAPI.getOnlineUsers();
      setOnlineUsers(new Set(ids.map(String)));
    } catch (err) {
      console.error('fetchOnlineUsers error:', err.message);
    }
  }, []);

  const showBrowserNotification = useCallback((title, options = {}) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
      try {
        new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options
        });
      } catch (err) {
        console.error('Notification error:', err);
      }
    }
  }, []);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      doJoinUser();
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('status_change', ({ userId, isOnline }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        if (isOnline) next.add(String(userId));
        else next.delete(String(userId));
        return next;
      });
    });

    newSocket.on('online_users_list', (userIds) => {
      setOnlineUsers(new Set(userIds.map(String)));
    });

    newSocket.on('points_earned', (data) => {
      setPointEvent(data);
    });

    newSocket.on('rank_up', (data) => {
      setRankUpEvent(data);
      showBrowserNotification("🏆 LEVEL UP!", {
        body: `ยินดีด้วย! คุณเลื่อนระดับเป็น ${data.newRank} แล้ว`,
      });
    });

    newSocket.on('new_notification', (data) => {
      // Logic from Navbar is mainly for UI, here we do OS notification
      showBrowserNotification("การแจ้งเตือนใหม่", {
        body: data.message || data.text || "คุณมีการแจ้งเตือนใหม่จาก Pattayapal",
      });
    });

    newSocket.on('receive_message', (data) => {
      // Only show if it's not from us
      const myId = userIdRef.current;
      const senderId = data.sender?._id || data.sender;
      if (myId && String(senderId) !== String(myId)) {
        showBrowserNotification(`ข้อความใหม่จาก ${data.senderName || 'ผู้ใช้'}`, {
          body: data.text || "คุณได้รับไฟล์แนบใหม่",
        });
      }
    });

    fetchOnlineUsers();

    return () => {
      newSocket.disconnect();
    };
  }, [doJoinUser, fetchOnlineUsers]);

  useEffect(() => {
    if (user) {
      setTimeout(() => doJoinUser(), 0);
    }
  }, [user, doJoinUser]);

  const isUserOnline = useCallback(
    (userId) => (userId ? onlineUsers.has(String(userId)) : false),
    [onlineUsers]
  );

  const emitTyping = useCallback((roomId) => {
    if (socketRef.current?.connected && userIdRef.current) {
      socketRef.current.emit('typing', {
        roomId,
        userId: userIdRef.current,
        userName: user?.name,
      });
    }
  }, [user]);

  const emitStopTyping = useCallback((roomId) => {
    if (socketRef.current?.connected && userIdRef.current) {
      socketRef.current.emit('stop_typing', { roomId, userId: userIdRef.current });
    }
  }, []);

  return (
    <SocketContext.Provider value={{
      socket,
      onlineUsers,
      isConnected,
      isUserOnline,
      emitTyping,
      emitStopTyping,
      refreshOnlineUsers: fetchOnlineUsers,
      requestNotificationPermission: () => {
        if (typeof Notification !== 'undefined') {
          return Notification.requestPermission().then(setNotificationPermission);
        }
        return Promise.resolve('denied');
      },
      notificationPermission
    }}>
      {children}
      
      {/* 🏆 Real-time Feedback UI */}
      {pointEvent && (
        <PointToast 
          points={pointEvent.pointsAdded} 
          label={pointEvent.label} 
          onComplete={() => setPointEvent(null)} 
        />
      )}

      {rankUpEvent && (
        <RankUpCelebration 
          newRank={rankUpEvent.newRank} 
          onComplete={() => setRankUpEvent(null)} 
        />
      )}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
