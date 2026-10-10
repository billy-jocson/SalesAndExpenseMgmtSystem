import { useContext, useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import TopBar from "../components/TopBar.jsx";
import {
  Table,
  Chip,
  TextField,
  InputGroup,
  Typography,
  Button,
  Tabs,
} from "@heroui/react";
import { Magnifier } from "@gravity-ui/icons";
import { userContext } from "../context/UserContext.js";
import { fetchAdminOrdersStatus, fetchNotifications } from "../api/notificationmanager.js";
import NoItemFound from "../components/NoItemFound.jsx";
import { TableSkeleton } from "../components/PageSkeleton.jsx";
import { useDebounce } from "../hooks/useDebounce.js";

export default function NotificationsPage() {
  const { user } = useContext(userContext);
  const [activeTab, setActiveTab] = useState("all"); // all, PENDING, ACCEPTED, REJECTED
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  const userId = user?.id || user?.user_id;
  const isAdmin = user?.role === "admin" || user?.role === 1 || user?.role_id === 1;

  useEffect(() => {
    document.title = "Notifications - Orders Status";
    const loadData = async () => {
      setLoading(true);
      try {
        if (isAdmin) {
          // Admin: show his orders status (PENDING vs ACCEPTED)
          const status = activeTab === "all" ? "all" : activeTab;
          const data = await fetchAdminOrdersStatus(userId, status);
          if (data?.status === "Success") {
            setOrders(data.orders ?? []);
          }
        } else {
          // Supplier: show notifications
          const data = await fetchNotifications(userId, "all");
          if (data?.status === "Success") {
            setNotifications(data.notifications ?? []);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (userId) loadData();
  }, [userId, activeTab, isAdmin]);

  const filteredOrders = orders.filter((o) =>
    debouncedSearch
      ? o.product_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        o.supplier_name?.toLowerCase().includes(debouncedSearch.toLowerCase())
      : true
  );

  return (
    <div className="flex gap-3">
      <Navbar />
      <div className="flex w-full gap-3">
        <div className="flex flex-col shadow-md rounded-[1.75rem] w-full p-7 gap-4 max-h-[calc(100dvh-2rem)] overflow-y-scroll">
          <TopBar
            title="Notifications & Orders Status"
            body={
              isAdmin
                ? "Track your orders - Pending vs Accepted by Suppliers (Both ends notified!)"
                : "Your order requests from Admin - you set expiry date!"
            }
          />

          <div className="flex flex-col gap-3">
            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <Typography type="body-sm" weight="semibold" className="text-blue-800">
                🔔 Both ends notification system
              </Typography>
              <Typography type="body-xs" color="muted">
                {isAdmin
                  ? "Admin: When you order, Supplier gets notif. When Supplier accepts (sets expiry), you get notif that stock is added!"
                  : "Supplier: When Admin orders, you get notif. When you accept, Admin gets notif with expiry you set!"}
              </Typography>
            </div>

            {/* Tabs - Pending vs Accepted for Admin */}
            <div className="flex gap-2 flex-wrap">
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
                Pending (Waiting for Supplier)
              </Button>
              <Button
                variant={activeTab === "ACCEPTED" ? "primary" : "secondary"}
                onPress={() => setActiveTab("ACCEPTED")}
              >
                Accepted (Expiry Set!)
              </Button>
              <Button
                variant={activeTab === "REJECTED" ? "primary" : "secondary"}
                onPress={() => setActiveTab("REJECTED")}
              >
                Rejected
              </Button>
            </div>

            <TextField className="w-full" name="search">
              <InputGroup className="w-full">
                <InputGroup.Prefix>
                  <Magnifier className="size-4 text-muted" />
                </InputGroup.Prefix>
                <InputGroup.Input
                  className="w-full"
                  placeholder="Search product or supplier..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </TextField>

            <Typography type="body-sm" color="muted">
              {isAdmin
                ? `${filteredOrders.length} orders found - ${activeTab}`
                : `${notifications.length} notifications`}
            </Typography>

            {loading ? (
              <TableSkeleton columns={6} />
            ) : isAdmin ? (
              filteredOrders.length === 0 ? (
                <NoItemFound
                  title="No orders found"
                  body={
                    activeTab === "PENDING"
                      ? "No pending orders - all accepted or no orders yet!"
                      : activeTab === "ACCEPTED"
                      ? "No accepted orders yet - waiting for suppliers to set expiry!"
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
                                <div className="font-medium">{order.product_name}</div>
                                <div className="text-xs text-muted">{order.category_name}</div>
                              </div>
                            </Table.Cell>
                            <Table.Cell>{order.supplier_name}</Table.Cell>
                            <Table.Cell>
                              <Chip size="sm" variant="soft" color={order.order_type === 'NEW_ORDER' ? 'accent' : 'warning'}>
                                {order.order_type}
                              </Chip>
                            </Table.Cell>
                            <Table.Cell>{order.requested_quantity}</Table.Cell>
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
                                    {order.expiry_date ? new Date(order.expiry_date).toLocaleDateString() : "N/A"}
                                  </div>
                                  <div className="text-xs text-muted">{order.batch_number}</div>
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
              )
            ) : (
              // Supplier view - notifications list
              <div className="flex flex-col gap-2">
                {notifications.map((notif) => (
                  <div key={notif.notification_id} className={`p-4 border rounded-xl ${!notif.is_read ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
                    <div className="flex justify-between">
                      <Chip size="sm" variant="soft" color={notif.type.includes('ACCEPTED') ? 'success' : notif.type.includes('REJECTED') ? 'danger' : 'warning'}>
                        {notif.type}
                      </Chip>
                      <span className="text-xs text-muted">{new Date(notif.created_at).toLocaleString()}</span>
                    </div>
                    <div className="font-medium mt-2">{notif.title}</div>
                    <div className="text-sm text-muted mt-1">{notif.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
