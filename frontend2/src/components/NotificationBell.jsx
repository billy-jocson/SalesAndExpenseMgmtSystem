import { useContext, useEffect, useState } from "react";
import { Bell, Check, Xmark } from "@gravity-ui/icons";
import { Button, Chip, Typography } from "@heroui/react";
import { userContext } from "../context/UserContext.js";
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
} from "../api/notificationmanager.js";

export default function NotificationBell() {
  const { user } = useContext(userContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalUnread, setTotalUnread] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  const userId = user?.id || user?.user_id || user?.userId;
  
  // BULLETPROOF CHECKER: Kapag may supplier_id, Supplier siya. Kapag wala, Admin/Staff siya.
  const isSupplier = Boolean(user?.supplier_id);
  const isAdmin = !isSupplier;

  const loadNotifications = async () => {
    if (!userId) return;
    try {
      const data = await fetchNotifications(userId, filter);
      if (data?.status === "Success") {
        setNotifications(data.notifications ?? []);
      }
      const allData = await fetchNotifications(userId, "all");
      if (allData?.status === "Success") {
        const unread = (allData.notifications ?? []).filter(n => !n.is_read && n.is_read != 1).length;
        setTotalUnread(unread);
        if (filter === "all") {
          setUnreadCount(allData.unread_count ?? unread);
        } else {
          setUnreadCount(data?.unread_count ?? 0);
        }
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, [userId, filter]);

  const handleMarkRead = async (notifId) => {
    try {
      await markAsRead(notifId, userId);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead(userId);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "ORDER_REQUEST":
      case "RESTOCK_REQUEST":
        return "warning";
      case "ORDER_ACCEPTED":
      case "RESTOCK_ACCEPTED":
        return "success";
      case "ORDER_REJECTED":
        return "danger";
      default:
        return "default";
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "ORDER_REQUEST":
        return "NEW ORDER";
      case "RESTOCK_REQUEST":
        return "RESTOCK";
      case "ORDER_ACCEPTED":
        return "ACCEPTED";
      case "ORDER_REJECTED":
        return "REJECTED";
      default:
        return type;
    }
  };

  const badgeCount = filter === "all" ? unreadCount : totalUnread;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onPress={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="size-5" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full size-5 flex items-center justify-center font-bold animate-pulse">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-[400px] max-h-[600px] bg-white shadow-2xl rounded-2xl border z-[100] flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <Typography type="body" weight="semibold">
                Notifications
              </Typography>
              <Typography type="body-xs" color="muted">
                {totalUnread} unread • Both ends (Admin ↔ Supplier)
              </Typography>
            </div>
            <div className="flex gap-2">
              {totalUnread > 0 && (
                <Button variant="ghost" size="sm" onPress={handleMarkAllRead}>
                  <Check className="size-4 mr-1" /> Mark all read
                </Button>
              )}
              <Button variant="ghost" size="sm" onPress={() => setIsOpen(false)}>
                <Xmark className="size-4" />
              </Button>
            </div>
          </div>

          <div className="p-3 border-b flex gap-2 overflow-x-auto">
            <Button
              size="sm"
              variant={filter === "all" ? "primary" : "secondary"}
              onPress={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={filter === "unread" ? "primary" : "secondary"}
              onPress={() => setFilter("unread")}
            >
              Unread ({totalUnread})
            </Button>
            
            {/* Supplier lang ang makakakita ng Requests */}
            {isSupplier && (
              <Button
                size="sm"
                variant={filter === "requests" ? "primary" : "secondary"}
                onPress={() => setFilter("requests")}
              >
                Requests
              </Button>
            )}

            {/* Admin lang ang makakakita ng Accepted at Rejected */}
            {isAdmin && (
              <>
                <Button
                  size="sm"
                  variant={filter === "ORDER_ACCEPTED" ? "primary" : "secondary"}
                  onPress={() => setFilter("ORDER_ACCEPTED")}
                >
                  Accepted
                </Button>
                <Button
                  size="sm"
                  variant={filter === "ORDER_REJECTED" ? "primary" : "secondary"}
                  onPress={() => setFilter("ORDER_REJECTED")}
                >
                  Rejected
                </Button>
              </>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="size-8 mx-auto text-muted mb-2" />
                <Typography type="body-sm" color="muted">
                  No notifications
                </Typography>
                <Typography type="body-xs" color="muted">
                  {filter === "all"
                    ? "You're all caught up!"
                    : `No ${filter} notifications`}
                </Typography>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notif) => (
                  <div
                    key={notif.notification_id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notif.is_read ? "bg-blue-50/50 border-l-4 border-l-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Chip
                            size="sm"
                            variant="soft"
                            color={getTypeColor(notif.type)}
                          >
                            {getTypeLabel(notif.type)}
                          </Chip>
                          {!notif.is_read && (
                            <span className="size-2 bg-blue-500 rounded-full animate-pulse"></span>
                          )}
                          <span className="text-xs text-muted">
                            {new Date(notif.created_at).toLocaleString()}
                          </span>
                        </div>
                        <Typography
                          type="body-sm"
                          weight={notif.is_read ? "normal" : "semibold"}
                          className="mb-1"
                        >
                          {notif.title}
                        </Typography>
                        <Typography type="body-xs" color="muted" className="line-clamp-2">
                          {notif.message}
                        </Typography>
                        {notif.product_name && (
                          <div className="mt-2 text-xs bg-gray-100 rounded-lg p-2 border">
                            <span className="font-medium">{notif.product_name}</span>
                            {notif.supplier_name && ` • ${notif.supplier_name}`}
                            {notif.requested_quantity && ` • Qty: ${notif.requested_quantity}`}
                          </div>
                        )}
                      </div>
                      {!notif.is_read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onPress={() => handleMarkRead(notif.notification_id)}
                          title="Mark as read"
                        >
                          <Check className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}