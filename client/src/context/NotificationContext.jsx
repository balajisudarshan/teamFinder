import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { initSocket, disconnectSocket } from '../services/socket';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [redDotActive, setRedDotActive] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch consolidated notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setPendingInvitations([]);
      setPendingRequests([]);
      setUnreadCount(0);
      setRedDotActive(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get('/requests/notifications');
      if (res.data?.success) {
        const invites = res.data.pendingInvitations || [];
        const requests = res.data.pendingRequests || [];
        setPendingInvitations(invites);
        setPendingRequests(requests);
        const count = invites.length + requests.length;
        setUnreadCount(count);
        if (count > 0) {
          setRedDotActive(true);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Connect to WebSocket and register listeners
  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      disconnectSocket();
      return;
    }

    // Initial fetch
    fetchNotifications();

    // Initialize Socket.IO
    const socket = initSocket(user._id);

    // Listener for new team invitation sent to this student
    const handleNewInvitation = (data) => {
      setPendingInvitations((prev) => {
        // Prevent duplicate addition
        const exists = prev.some((i) => i._id === data.invitation?._id);
        if (exists) return prev;
        return [data.invitation, ...prev];
      });
      setUnreadCount((c) => c + 1);
      setRedDotActive(true);

      // Dispatch global alert/toast event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('team-notification', {
            detail: {
              type: 'invitation',
              title: data.title || 'New Team Invitation! 📬',
              message: data.message,
              team: data.team,
            },
          })
        );
      }
    };

    // Listener for leader when student responds to invitation
    const handleInvitationResponse = (data) => {
      fetchNotifications();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('team-notification', {
            detail: {
              type: 'invitation_response',
              title: data.title || 'Invitation Update',
              message: data.message,
            },
          })
        );
      }
    };

    // Listener for leader when new join request arrives
    const handleNewJoinRequest = (data) => {
      setPendingRequests((prev) => {
        const exists = prev.some((r) => r._id === data.request?._id);
        if (exists) return prev;
        return [data.request, ...prev];
      });
      setUnreadCount((c) => c + 1);
      setRedDotActive(true);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('team-notification', {
            detail: {
              type: 'join_request',
              title: data.title || 'New Application! 📄',
              message: data.message,
            },
          })
        );
      }
    };

    // Listener for student when their join request was accepted/declined
    const handleRequestResponse = (data) => {
      fetchNotifications();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('team-notification', {
            detail: {
              type: 'request_response',
              title: data.title || 'Application Status Update',
              message: data.message,
            },
          })
        );
      }
    };

    socket.on('new_invitation', handleNewInvitation);
    socket.on('invitation_response', handleInvitationResponse);
    socket.on('new_join_request', handleNewJoinRequest);
    socket.on('request_response', handleRequestResponse);

    // Periodic safety poll every 35 seconds to keep notifications synced
    const pollInterval = setInterval(() => {
      fetchNotifications();
    }, 35000);

    return () => {
      socket.off('new_invitation', handleNewInvitation);
      socket.off('invitation_response', handleInvitationResponse);
      socket.off('new_join_request', handleNewJoinRequest);
      socket.off('request_response', handleRequestResponse);
      clearInterval(pollInterval);
    };
  }, [isAuthenticated, user?._id, fetchNotifications]);

  // Mark notifications as seen (stops red dot ping animation)
  const markAsSeen = () => {
    setRedDotActive(false);
  };

  // Toggle dropdown open/close
  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => {
      const nextState = !prev;
      if (nextState) {
        setRedDotActive(false); // Clear pulsing red dot when opening panel
      }
      return nextState;
    });
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  // Respond to invitation directly from notifications
  const respondInvitation = async (inviteId, action) => {
    try {
      const res = await api.put(`/requests/invitations/${inviteId}/respond`, { action });
      if (res.data?.success) {
        setPendingInvitations((prev) => prev.filter((i) => i._id !== inviteId));
        setUnreadCount((c) => Math.max(0, c - 1));
        return { success: true, message: res.data.message };
      }
    } catch (err) {
      throw err;
    }
  };

  // Respond to join request directly from notifications
  const respondRequest = async (requestId, action) => {
    try {
      const res = await api.put(`/requests/${requestId}`, { action });
      if (res.data?.success) {
        setPendingRequests((prev) => prev.filter((r) => r._id !== requestId));
        setUnreadCount((c) => Math.max(0, c - 1));
        return { success: true, message: res.data.message };
      }
    } catch (err) {
      throw err;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        pendingInvitations,
        pendingRequests,
        unreadCount,
        hasUnread: unreadCount > 0,
        redDotActive,
        isDropdownOpen,
        loading,
        toggleDropdown,
        closeDropdown,
        markAsSeen,
        fetchNotifications,
        respondInvitation,
        respondRequest,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
