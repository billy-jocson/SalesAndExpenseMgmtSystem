import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import TopBar from "../components/TopBar.jsx";
import {
  Table,
  Chip,
  TextField,
  InputGroup,
  Typography,
  Button,
} from "@heroui/react";
import { Magnifier } from "@gravity-ui/icons";
import useAuth from "../hooks/useAuth";
import {
  fetchAdminOrdersStatus,
  fetchNotifications,
} from "../api/notificationmanager.js";
import NoItemFound from "../components/NoItemFound.jsx";
import { TableSkeleton } from "../components/PageSkeleton.jsx";
import { useDebounce } from "../hooks/useDebounce.js";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  const userId = user?.id || user?.user_id || user?.userId;
  const isAdmin =
    ["admin", "administrator"].includes(
      String(user?.role ?? "")
        .trim()
        .toLowerCase(),
    ) ||
    user?.role_id === 1 ||
    user?.role === 1;

  useEffect(() => {
    document.title = "Notifications - Orders Status";
    const loadData = async () => {
      setLoading(true);
      try {
        if (isAdmin) {
          const status = activeTab === "all" ? "all" : activeTab;
          const [ordersData, notificationsData] = await Promise.all([
            fetchAdminOrdersStatus(userId, status),
            fetchNotifications(userId, "all"),
          ]);
          setOrders(
            ordersData?.status === "Success" ? (ordersData.orders ?? []) : [],
          );
          setNotifications(
            notificationsData?.status === "Success"
              ? (notificationsData.notifications ?? [])
              : [],
          );
        } else {
          const data = await fetchNotifications(userId, "all");
          setNotifications(
            data?.status === "Success" ? (data.notifications ?? []) : [],
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadData();
    }
  }, [userId, activeTab, isAdmin]);

  const searchTerm = debouncedSearch.trim().toLowerCase();

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = !searchTerm
      ? true
      : [order.product_name, order.supplier_name, order.category_name]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(searchTerm));

    return matchesSearch;
  });

  const filteredNotifications = notifications.filter((notif) => {
    const matchesSearch = !searchTerm
      ? true
      : [
          notif.title,
          notif.message,
          notif.product_name,
          notif.supplier_name,
          notif.type,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(searchTerm));

    const isUnread = Number(notif.is_read) !== 1;
    const matchesStatus =
      activeTab === "all" ||
      (activeTab === "unread" && isUnread) ||
      (activeTab === "requests" &&
        ["ORDER_REQUEST", "RESTOCK_REQUEST"].includes(notif.type)) ||
      (activeTab === "ORDER_ACCEPTED" && notif.type === "ORDER_ACCEPTED") ||
      (activeTab === "ORDER_REJECTED" && notif.type === "ORDER_REJECTED") ||
      (activeTab === "ORDER_CANCELLED" && notif.type === "ORDER_CANCELLED") ||
      (activeTab === "CANCELLED" && notif.type === "ORDER_CANCELLED") ||
      (activeTab === "ORDER_REQUEST" && notif.type === "ORDER_REQUEST") ||
      (activeTab === "RESTOCK_REQUEST" && notif.type === "RESTOCK_REQUEST") ||
      (activeTab === "PENDING" &&
        ["ORDER_REQUEST", "RESTOCK_REQUEST"].includes(notif.type)) ||
      (activeTab === "ACCEPTED" && notif.type === "ORDER_ACCEPTED") ||
      (activeTab === "REJECTED" && notif.type === "ORDER_REJECTED");

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex gap-3">
      <Navbar />
      <div className="flex w-full gap-3">
        <div className="flex flex-col shadow-md rounded-[1.75rem] w-full p-7 gap-4 max-h-[calc(100dvh-2rem)] overflow-y-scroll scrollbar-thin">
          <TopBar
            title="Notifications & Orders Status"
            body={
              isAdmin
                ? "Track your orders - Pending vs Accepted by Suppliers"
                : "Your order requests from Admin - you set expiry date!"
            }
          />

          <div className="flex flex-col gap-3">
            <div className="flex gap-2 flex-wrap">
              {isAdmin ? (
                <>
                  <Button
                    variant={activeTab === "all" ? "primary" : "secondary"}
                    onPress={() => setActiveTab("all")}
                  >
                    All ({orders.length})
                  </Button>
                  <Button
                    variant={activeTab === "PENDING" ? "primary" : "secondary"}
                    onPress={() => setActiveTab("PENDING")}
                  >
                    Pending
                  </Button>
                  <Button
                    variant={activeTab === "ACCEPTED" ? "primary" : "secondary"}
                    onPress={() => setActiveTab("ACCEPTED")}
                  >
                    Accepted
                  </Button>
                  <Button
                    variant={activeTab === "REJECTED" ? "primary" : "secondary"}
                    onPress={() => setActiveTab("REJECTED")}
                  >
                    Rejected
                  </Button>
                  <Button
                    variant={
                      activeTab === "CANCELLED" ? "primary" : "secondary"
                    }
                    onPress={() => setActiveTab("CANCELLED")}
                  >
                    Cancelled
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant={activeTab === "all" ? "primary" : "secondary"}
                    onPress={() => setActiveTab("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={activeTab === "unread" ? "primary" : "secondary"}
                    onPress={() => setActiveTab("unread")}
                  >
                    Unread
                  </Button>
                  <Button
                    variant={activeTab === "requests" ? "primary" : "secondary"}
                    onPress={() => setActiveTab("requests")}
                  >
                    Requests
                  </Button>
                  <Button
                    variant={
                      activeTab === "ORDER_ACCEPTED" ? "primary" : "secondary"
                    }
                    onPress={() => setActiveTab("ORDER_ACCEPTED")}
                  >
                    Accepted
                  </Button>
                  <Button
                    variant={
                      activeTab === "ORDER_REJECTED" ? "primary" : "secondary"
                    }
                    onPress={() => setActiveTab("ORDER_REJECTED")}
                  >
                    Rejected
                  </Button>
                  <Button
                    variant={
                      activeTab === "ORDER_CANCELLED" ? "primary" : "secondary"
                    }
                    onPress={() => setActiveTab("ORDER_CANCELLED")}
                  >
                    Cancelled
                  </Button>
                </>
              )}
            </div>

            <TextField className="w-full" name="search">
              <InputGroup className="w-full">
                <InputGroup.Prefix>
                  <Magnifier className="size-4 text-muted" />
                </InputGroup.Prefix>
                <InputGroup.Input
                  className="w-full"
                  placeholder={
                    isAdmin
                      ? "Search order product or supplier..."
                      : "Search notification title, product, or supplier..."
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </TextField>

            <Typography type="body-sm" color="muted">
              {isAdmin
                ? `${filteredNotifications.length} notifications and ${filteredOrders.length} orders found - ${activeTab}`
                : `${filteredNotifications.length} notifications found - ${activeTab}`}
            </Typography>

            {loading ? (
              <TableSkeleton columns={6} />
            ) : isAdmin ? (
              <>
                <section className="flex flex-col gap-2">
                  <Typography type="body" weight="semibold">
                    Notifications
                  </Typography>
                  {filteredNotifications.length === 0 ? (
                    <NoItemFound
                      title="No notifications found"
                      body="There are no notifications matching this search or status."
                    />
                  ) : (
                    filteredNotifications.map((notif) => (
                      <div
                        key={notif.notification_id}
                        className={`p-4 border rounded-xl ${
                          Number(notif.is_read) !== 1
                            ? "bg-blue-50 border-blue-200"
                            : "bg-white"
                        }`}
                      >
                        <div className="flex justify-between">
                          <Chip
                            size="sm"
                            variant="soft"
                            color={
                              notif.type.includes("ACCEPTED")
                                ? "success"
                                : notif.type.includes("REJECTED")
                                  ? "danger"
                                  : "warning"
                            }
                          >
                            {notif.type}
                          </Chip>
                          <span className="text-xs text-muted">
                            {new Date(notif.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="font-medium mt-2">{notif.title}</div>
                        <div className="text-sm text-muted mt-1">
                          {notif.message}
                        </div>
                      </div>
                    ))
                  )}
                </section>

                <Typography type="body" weight="semibold">
                  Orders status
                </Typography>
                {filteredOrders.length === 0 ? (
                  <NoItemFound
                    title="No orders found"
                    body={
                      activeTab === "PENDING"
                        ? "No pending orders - all accepted or no orders yet!"
                        : activeTab === "ACCEPTED"
                          ? "No accepted orders yet - waiting for suppliers to set expiry!"
                          : activeTab === "REJECTED"
                            ? "No rejected orders."
                            : "No orders yet. Go to Products Manager to order!"
                    }
                  />
                ) : (
                  <Table>
                    <Table.ScrollContainer>
                      <Table.Content aria-label="Admin orders status">
                        <Table.Header>
                          <Table.Column>Order #</Table.Column>
                          <Table.Column>Product</Table.Column>
                          <Table.Column>Supplier</Table.Column>
                          <Table.Column>Type</Table.Column>
                          <Table.Column>Qty</Table.Column>
                          <Table.Column>Status</Table.Column>
                          <Table.Column>Expiry</Table.Column>
                        </Table.Header>
                        <Table.Body>
                          {filteredOrders.map((order) => (
                            <Table.Row key={order.order_id}>
                              <Table.Cell>#{order.order_id}</Table.Cell>
                              <Table.Cell>
                                <div>
                                  <div className="font-medium">
                                    {order.product_name}
                                  </div>
                                  <div className="text-xs text-muted">
                                    {order.category_name}
                                  </div>
                                </div>
                              </Table.Cell>
                              <Table.Cell>{order.supplier_name}</Table.Cell>
                              <Table.Cell>
                                <Chip
                                  size="sm"
                                  variant="soft"
                                  color={
                                    order.order_type === "NEW_ORDER"
                                      ? "accent"
                                      : "warning"
                                  }
                                >
                                  {order.order_type}
                                </Chip>
                              </Table.Cell>
                              <Table.Cell>
                                {order.requested_quantity}
                              </Table.Cell>
                              <Table.Cell>
                                <Chip
                                  variant="soft"
                                  color={
                                    order.status === "PENDING"
                                      ? "warning"
                                      : order.status === "ACCEPTED"
                                        ? "success"
                                        : "danger"
                                  }
                                >
                                  {order.status}
                                </Chip>
                              </Table.Cell>
                              <Table.Cell>
                                {order.status === "ACCEPTED" ? (
                                  <div>
                                    <div className="text-sm font-medium text-green-600">
                                      {order.expiry_date
                                        ? new Date(
                                            order.expiry_date,
                                          ).toLocaleDateString()
                                        : "N/A"}
                                    </div>
                                    <div className="text-xs text-muted">
                                      {order.batch_number}
                                    </div>
                                  </div>
                                ) : (
                                  <Typography type="body-xs" color="muted">
                                    Waiting for supplier to set expiry...
                                  </Typography>
                                )}
                              </Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table.Content>
                    </Table.ScrollContainer>
                  </Table>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredNotifications.length === 0 ? (
                  <NoItemFound
                    title="No notifications found"
                    body={
                      activeTab === "all"
                        ? "No notifications available right now."
                        : `No ${activeTab.toLowerCase().replace(/_/g, " ")} notifications found.`
                    }
                  />
                ) : (
                  filteredNotifications.map((notif) => (
                    <div
                      key={notif.notification_id}
                      className={`p-4 border rounded-xl ${!notif.is_read ? "bg-blue-50 border-blue-200" : "bg-white"}`}
                    >
                      <div className="flex justify-between">
                        <Chip
                          size="sm"
                          variant="soft"
                          color={
                            notif.type.includes("ACCEPTED")
                              ? "success"
                              : notif.type.includes("REJECTED")
                                ? "danger"
                                : "warning"
                          }
                        >
                          {notif.type}
                        </Chip>
                        <span className="text-xs text-muted">
                          {new Date(notif.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="font-medium mt-2">{notif.title}</div>
                      <div className="text-sm text-muted mt-1">
                        {notif.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}