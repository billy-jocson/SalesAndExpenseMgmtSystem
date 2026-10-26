import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Check, Xmark } from "@gravity-ui/icons";
import { Button, Chip, Typography } from "@heroui/react";
import useAuth from "../hooks/useAuth";
import { NavRoutes } from "../NavRoutes.jsx";
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
} from "../api/notificationmanager.js";
import { formatDateTime } from "../utils/dateTime.js";

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const userId = user?.id || user?.user_id || user?.userId;

  // BULLETPROOF CHECKER: Kapag may supplier_id, Supplier siya. Kapag wala, check if Admin/Administrator
  const isSupplier = Boolean(user?.supplier_id);
  const isAdmin =
    !isSupplier &&
    (user?.role?.toLowerCase() === "admin" ||
      user?.role?.toLowerCase() === "administrator");
  const canShowBell = isAdmin || isSupplier;

  useEffect(() => {
    if (!canShowBell || !userId) return;

    let isCurrent = true;
    const loadNotifications = async () => {
      try {
        const [data, allData] = await Promise.all([
          fetchNotifications(userId, filter),
          fetchNotifications(userId, "all"),
        ]);
        if (!isCurrent) return;

        if (data?.status === "Success") {
          setNotifications(data.notifications ?? []);
        }
        if (allData?.status === "Success") {
          const unread = (allData.notifications ?? []).filter(
            (notification) => Number(notification.is_read) !== 1,
          ).length;
          setTotalUnread(unread);
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    };

    void loadNotifications();
    const interval = setInterval(loadNotifications, 5000);
    return () => {
      isCurrent = false;
      clearInterval(interval);
    };
  }, [canShowBell, userId, filter, refreshKey]);

  const handleMarkRead = async (notifId) => {
    try {
      const response = await markAsRead(notifId, userId);
      if (response?.status === "Success") {
        setRefreshKey((key) => key + 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const response = await markAllAsRead(userId);
      if (response?.status === "Success") {
        setRefreshKey((key) => key + 1);
      }
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
      case "ORDER_CANCELLED":
        return "danger";
      default:
        return "default";
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "ORDER_REQUEST":
        return "New Order";
      case "RESTOCK_REQUEST":
        return "Restock";
      case "ORDER_ACCEPTED":
        return "Accepted";
      case "ORDER_REJECTED":
        return "Rejected";
      case "ORDER_CANCELLED":
        return "Cancelled";
      default:
        return type;
    }
  };

  if (!canShowBell) {
    return null;
  }

  return (
    <div className="ms-auto relative">
      <Button
        variant="ghost"
        size="icon"
        onPress={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="size-5" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full size-5 flex items-center justify-center font-bold">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-[400px] max-h-fit bg-white shadow-2xl rounded-2xl border z-[100] flex flex-col">
          <div className="p-4 border-b flex items-center justify-between gap-2">
            <div>
              <Typography type="body" weight="semibold">
                Notifications
              </Typography>
              <Typography type="body-xs" color="muted">
                {totalUnread} unread
              </Typography>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <Link to={NavRoutes.NOTIFICATIONS} onClick={() => setIsOpen(false)}>
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </Link>
              {totalUnread > 0 && (
                <Button variant="ghost" size="sm" onPress={handleMarkAllRead}>
                  <Check className="size-4 mr-1" /> Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setIsOpen(false)}
              >
                <Xmark className="size-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 border-b flex gap-2 overflow-x-auto h-fit">
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
                  variant={
                    filter === "ORDER_ACCEPTED" ? "primary" : "secondary"
                  }
                  onPress={() => setFilter("ORDER_ACCEPTED")}
                >
                  Accepted
                </Button>
                <Button
                  size="sm"
                  variant={
                    filter === "ORDER_REJECTED" ? "primary" : "secondary"
                  }
                  onPress={() => setFilter("ORDER_REJECTED")}
                >
                  Rejected
                </Button>
              </>
            )}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin max-h-[400px]">
            {notifications.length === 0 ? (
              <div className="p-8 flex flex-col items-center text-center">
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
                      !notif.is_read
                        ? "bg-blue-50/50 border-l-4 border-l-blue-500"
                        : ""
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
                            {formatDateTime(notif.created_at)}
                          </span>
                        </div>
                        <Typography
                          type="body-sm"
                          weight={notif.is_read ? "normal" : "semibold"}
                          className="mb-1"
                        >
                          {notif.title}
                        </Typography>
                        <Typography
                          type="body-xs"
                          color="muted"
                          className="line-clamp-2"
                        >
                          {notif.message}
                        </Typography>
                        {notif.product_name && (
                          <div className="mt-2 text-xs bg-gray-100 rounded-lg p-2 border">
                            <span className="font-medium">
                              {notif.product_name}
                            </span>
                            {notif.supplier_name && ` • ${notif.supplier_name}`}
                            {notif.requested_quantity &&
                              ` • Qty: ${notif.requested_quantity}`}
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