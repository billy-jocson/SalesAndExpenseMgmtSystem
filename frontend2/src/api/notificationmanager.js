import { queryString, request } from "./client";

export const fetchNotifications = async (userId, filter = 'all') => {
  return request(`/notifications${queryString({ user_id: userId, filter })}`, { method: "GET" });
};

export const fetchUnreadNotifications = async (userId) => {
  return request(`/notifications${queryString({ user_id: userId, filter: 'unread' })}`, { method: "GET" });
};

export const markAsRead = async (notificationId, userId) => {
  return request(`/notifications/mark-read`, {
    method: "POST",
    body: { notification_id: notificationId, user_id: userId },
  });
};

export const markAllAsRead = async (userId) => {
  return request(`/notifications/mark-all-read`, {
    method: "POST",
    body: { user_id: userId },
  });
};

// For Admin: List of his orders status (PENDING vs ACCEPTED)
export const fetchAdminOrdersStatus = async (adminUserId, status = 'all') => {
  return request(`/admin/orders-status${queryString({ admin_user_id: adminUserId, status })}`, {
    method: "GET",
  });
};
