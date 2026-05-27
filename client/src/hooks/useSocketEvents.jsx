import { useEffect, useRef } from 'react';
import { getSocket, SOCKET_EVENTS, joinContributorFeed, joinAdminRoom } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useFeedStore } from '@/store/feedStore';
import toast from 'react-hot-toast';

/**
 * Global socket event listener hook.
 * Mount once at app level (in AppLayout) to wire up all realtime events.
 */
export const useSocketEvents = () => {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { addQuery, updateQuery, removeQuery } = useFeedStore();
  const registered = useRef(false);

  useEffect(() => {
    if (!user || registered.current) return;

    const socket = getSocket();
    if (!socket) return;

    registered.current = true;

    // Join appropriate rooms
    joinContributorFeed();
    if (user.role === 'admin') {
      joinAdminRoom();
    }

    // ─── Live query feed ──────────────────────────────────────────
    socket.on(SOCKET_EVENTS.NEW_QUERY, (data) => {
      addQuery(data);
      toast.custom((t) => (
        <div className={`glass rounded-lg p-3 max-w-sm flex items-start gap-3 ${t.visible ? 'animate-fade-in' : 'opacity-0'}`}>
          <span className="text-blue-400 text-lg">📋</span>
          <div>
            <p className="text-sm font-medium text-white">New Query Available</p>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{data.question}</p>
          </div>
        </div>
      ), { duration: 4000, position: 'bottom-right' });
    });

    socket.on(SOCKET_EVENTS.QUERY_EXPIRED, (data) => {
      updateQuery(data.queryId, { status: 'expired' });
    });

    socket.on(SOCKET_EVENTS.QUERY_COMPLETED, (data) => {
      updateQuery(data.queryId, { status: 'completed' });
    });

    // ─── FAQ events ───────────────────────────────────────────────
    socket.on(SOCKET_EVENTS.FAQ_PUBLISHED, (data) => {
      toast.success(`📖 New FAQ published: "${data.title?.slice(0, 50)}..."`, { duration: 5000 });
    });

    socket.on(SOCKET_EVENTS.FAQ_PENDING_REVIEW, (data) => {
      if (user.role === 'admin') {
        addNotification({
          type: 'faq_draft',
          message: `New FAQ draft ready: "${data.title?.slice(0, 60)}"`,
          metadata: { faqId: data.faqId },
          read: false,
          createdAt: new Date().toISOString(),
        });
        toast.custom((t) => (
          <div className={`glass rounded-lg p-3 max-w-sm ${t.visible ? 'animate-fade-in' : 'opacity-0'}`}>
            <p className="text-sm font-medium text-white">🎯 FAQ Ready for Review</p>
            <p className="text-xs text-slate-400 mt-0.5">{data.title?.slice(0, 60)}</p>
          </div>
        ), { duration: 6000, position: 'top-right' });
      }
    });

    // ─── Admin notifications ──────────────────────────────────────
    socket.on(SOCKET_EVENTS.ADMIN_NOTIFICATION, (data) => {
      if (user.role === 'admin') {
        addNotification({ ...data, read: false, createdAt: new Date().toISOString() });
      }
    });

    // ─── User notifications ───────────────────────────────────────
    socket.on(SOCKET_EVENTS.USER_NOTIFICATION, (data) => {
      addNotification({ ...data, read: false, createdAt: new Date().toISOString() });
      toast.success(data.message, { duration: 5000 });
    });

    return () => {
      socket.off(SOCKET_EVENTS.NEW_QUERY);
      socket.off(SOCKET_EVENTS.QUERY_EXPIRED);
      socket.off(SOCKET_EVENTS.QUERY_COMPLETED);
      socket.off(SOCKET_EVENTS.FAQ_PUBLISHED);
      socket.off(SOCKET_EVENTS.FAQ_PENDING_REVIEW);
      socket.off(SOCKET_EVENTS.ADMIN_NOTIFICATION);
      socket.off(SOCKET_EVENTS.USER_NOTIFICATION);
      registered.current = false;
    };
  }, [user]);
};
