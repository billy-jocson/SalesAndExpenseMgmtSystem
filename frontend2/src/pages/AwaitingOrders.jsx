import Navbar from "../components/Navbar.jsx";
import TopBar from "../components/TopBar.jsx";
import { useContext, useEffect, useState } from "react";
import restockIcon from "../assets/images/restockprod.png";
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
import { fetchPendingOrders } from "../api/ordermanager.js";
import SupplierAcceptModal from "../components/SupplierAcceptModal.jsx";
import NoItemFound from "../components/NoItemFound.jsx";
import { TableSkeleton } from "../components/PageSkeleton.jsx";
import { userContext } from "../context/UserContext.js";
import { useDebounce } from "../hooks/useDebounce.js";

export default function AwaitingOrders() {
  const { user } = useContext(userContext);
  const [searchItem, setSearchItem] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [refreshKey, setRefreshKey] = useState(0);
  const debouncedSearch = useDebounce(searchItem);

  useEffect(() => {
    document.title = "Awaiting Orders - Supplier";
    const loadOrders = async () => {
      if (!user?.supplier_id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await fetchPendingOrders(user?.supplier_id, statusFilter, debouncedSearch);
        console.log("Awaiting Orders response:", data);
        setOrders(data?.status === "Success" ? (data.orders ?? []) : []);
      } catch (err) {
        console.error("Failed to load orders:", err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, [debouncedSearch, statusFilter, refreshKey, user?.supplier_id]);

  return (
    <div className="flex gap-3">
      <Navbar />
      <div className="flex w-full gap-3">
        <div className="flex flex-col shadow-md rounded-[1.75rem] w-full p-7 gap-4 max-h-[calc(100dvh-2rem)] overflow-y-scroll">
          <TopBar
            title="Awaiting Orders"
            body="Store orders waiting for your acceptance - you set the expiry date!"
            emoji={restockIcon}
          />

          <div className="flex flex-col gap-3">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <Typography type="body-sm" weight="semibold" className="text-blue-800">
                Real-world flow: Supplier sets expiry date
              </Typography>
              <Typography type="body-xs" color="muted">
                Si Supplier (ikaw) lang nakakaalam ng actual expiry ng batch. Pag nag-accept ka, ikaw magse-set ng expiry date. Past dates grayed out na!
              </Typography>
              <Typography type="body-xs" color="muted" className="mt-2 text-blue-600 font-mono">
                Debug: user_id={user?.user_id || user?.id} | supplier_id={user?.supplier_id} | username={user?.username}
              </Typography>
            </div>

            <div className="flex gap-2">
              <Button
                variant={statusFilter === "PENDING" ? "primary" : "secondary"}
                onPress={() => setStatusFilter("PENDING")}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === "ACCEPTED" ? "primary" : "secondary"}
                onPress={() => setStatusFilter("ACCEPTED")}
              >
                Accepted
              </Button>
              <Button
                variant={statusFilter === "" ? "primary" : "secondary"}
                onPress={() => setStatusFilter("")}
              >
                All
              </Button>
            </div>

            <TextField className="w-full" name="search">
              <InputGroup className="w-full">
                <InputGroup.Prefix>
                  <Magnifier className="size-4 text-muted" />
                </InputGroup.Prefix>
                <InputGroup.Input
                  className="w-full"
                  placeholder="Search orders..."
                  value={searchItem}
                  onChange={(e) => setSearchItem(e.target.value)}
                />
              </InputGroup>
            </TextField>

            <Typography type="body-sm" color="muted">
              {orders.length} {orders.length === 1 ? "order" : "orders"} found for supplier #{user?.supplier_id}
            </Typography>

            {loading ? (
              <TableSkeleton columns={6} />
            ) : orders.length === 0 ? (
              <NoItemFound title="No orders found" body={`No pending orders for supplier #${user?.supplier_id}. Try ordering as Admin for this supplier!`} />
            ) : (
              <Table>
                <Table.ScrollContainer>
                  <Table.Content aria-label="Awaiting orders">
                    <Table.Header>
                      <Table.Column isRowHeader>Order #</Table.Column>
                      <Table.Column>Product</Table.Column>
                      <Table.Column>Type</Table.Column>
                      <Table.Column>Qty</Table.Column>
                      <Table.Column>Status</Table.Column>
                      <Table.Column>Action</Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {orders.map((order) => (
                        <Table.Row key={order.order_id}>
                          <Table.Cell>#{order.order_id}</Table.Cell>
                          <Table.Cell>
                            <div>
                              <div className="font-medium">{order.product_name}</div>
                              <div className="text-xs text-muted">{order.category_name}</div>
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <Chip size="sm" variant="soft" color={order.order_type === 'NEW_ORDER' ? 'accent' : 'warning'}>
                              {order.order_type}
                            </Chip>
                          </Table.Cell>
                          <Table.Cell>{order.requested_quantity}</Table.Cell>
                          <Table.Cell>
                            <Chip
                              variant="soft"
                              color={order.status === "PENDING" ? "warning" : order.status === "ACCEPTED" ? "success" : "danger"}
                            >
                              {order.status}
                            </Chip>
                          </Table.Cell>
                          <Table.Cell>
                            {order.status === "PENDING" ? (
                              <SupplierAcceptModal
                                order={order}
                                onSuccess={() => setRefreshKey(k => k + 1)}
                              />
                            ) : (
                              <Typography type="body-xs" color="muted">
                                Expiry: {order.expiry_date ?? order.expiration_date ?? "N/A"}
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
          </div>
        </div>
      </div>
    </div>
  );
}