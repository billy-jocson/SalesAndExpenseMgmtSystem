import { useContext, useEffect, useMemo, useState } from "react";
import { Magnifier, Xmark } from "@gravity-ui/icons";
import {
  Button,
  Chip,
  InputGroup,
  Modal,
  Table,
  TextField,
  Typography,
  toast,
} from "@heroui/react";
import Navbar from "../components/Navbar.jsx";
import TopBar from "../components/TopBar.jsx";
import NoItemFound from "../components/NoItemFound.jsx";
import { TableSkeleton } from "../components/PageSkeleton.jsx";
import { userContext } from "../context/UserContext.js";
import { cancelOrder, fetchMyOrders } from "../api/ordermanager.js";
import { useDebounce } from "../hooks/useDebounce.js";

const statusOptions = ["all", "PENDING", "ACCEPTED", "REJECTED", "CANCELLED"];

const statusColor = (status) => {
  switch (status) {
    case "PENDING":
      return "warning";
    case "ACCEPTED":
      return "success";
    case "REJECTED":
    case "CANCELLED":
      return "danger";
    default:
      return "default";
  }
};

export default function OrdersPage() {
  const { user } = useContext(userContext);
  const userId = user?.id || user?.user_id || user?.userId;
  const [status, setStatus] = useState("all");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const debouncedSearch = useDebounce(search);
  const searchTerm = debouncedSearch.trim().toLowerCase();

  useEffect(() => {
    document.title = "My Orders";
    let isCurrent = true;

    const loadOrders = async () => {
      setLoading(true);
      try {
        const response = await fetchMyOrders(userId, status);
        if (isCurrent) {
          if (response?.status === "Success") {
            setOrders(response.orders ?? []);
          } else {
            setOrders([]);
            toast.danger(response?.message ?? "Unable to load your orders.");
          }
        }
      } catch (error) {
        if (isCurrent) {
          setOrders([]);
          toast.danger(error.message ?? "Unable to load your orders.");
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    if (userId) {
      loadOrders();
    }

    return () => {
      isCurrent = false;
    };
  }, [userId, status, refreshKey]);

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) =>
        [
          order.order_id,
          order.product_name,
          order.order_type,
          order.supplier_name,
          order.order_type,
          order.status,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(searchTerm)),
      ),
    [orders, searchTerm],
  );

  const handleCancelOrder = async () => {
    if (!orderToCancel || !userId) return;

    setIsCancelling(true);
    try {
      const response = await cancelOrder(orderToCancel.order_id, userId);
      if (response?.status === "Success") {
        toast.success(`Order #${orderToCancel.order_id} cancelled.`);
        setOrderToCancel(null);
        setRefreshKey((key) => key + 1);
      } else {
        toast.danger(response?.message ?? "Unable to cancel this order.");
      }
    } catch (error) {
      toast.danger(error.message ?? "Unable to cancel this order.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="flex gap-3">
      <Navbar />
      <div className="flex w-full gap-3">
        <main className="flex max-h-[calc(100dvh-2rem)] w-full flex-col gap-4 overflow-y-scroll rounded-[1.75rem] p-7 shadow-md scrollbar-thin">
          <TopBar
            title="My Orders"
            body="Review orders you have requested and cancel any that are still pending."
          />

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <Button
                  key={option}
                  variant={status === option ? "primary" : "secondary"}
                  onPress={() => setStatus(option)}
                >
                  {option === "all"
                    ? "All"
                    : option.charAt(0) + option.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>

            <TextField className="w-full" name="search-orders">
              <InputGroup className="w-full">
                <InputGroup.Prefix>
                  <Magnifier className="size-4 text-muted" />
                </InputGroup.Prefix>
                <InputGroup.Input
                  className="w-full"
                  placeholder="Search by order, product, or supplier..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </InputGroup>
            </TextField>

            <Typography type="body-sm" color="muted">
              {filteredOrders.length}{" "}
              {filteredOrders.length === 1 ? "order" : "orders"} found
            </Typography>

            {loading ? (
              <TableSkeleton columns={6} />
            ) : filteredOrders.length === 0 ? (
              <NoItemFound
                title="No orders found"
                body={
                  searchTerm
                    ? "Try changing your search."
                    : status === "PENDING"
                      ? "You have no pending orders."
                      : "You have not placed any orders with this status."
                }
              />
            ) : (
              <Table>
                <Table.ScrollContainer>
                  <Table.Content aria-label="My orders">
                    <Table.Header>
                      <Table.Column isRowHeader>Order #</Table.Column>
                      <Table.Column>Product</Table.Column>
                      <Table.Column>Supplier</Table.Column>
                      <Table.Column>Type</Table.Column>
                      <Table.Column>Quantity</Table.Column>
                      <Table.Column>Status</Table.Column>
                      <Table.Column>Requested</Table.Column>
                      <Table.Column>Actions</Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {filteredOrders.map((order) => (
                        <Table.Row key={order.order_id}>
                          <Table.Cell>#{order.order_id}</Table.Cell>
                          <Table.Cell>
                            <div className="font-medium">
                              {order.product_name}
                            </div>
                            <div className="text-xs text-muted">
                              {order.category_name}
                            </div>
                          </Table.Cell>
                          <Table.Cell>{order.supplier_name}</Table.Cell>
                          <Table.Cell>
                            {order.order_type === "NEW_ORDER"
                              ? "New order"
                              : "Restock"}
                          </Table.Cell>
                          <Table.Cell>{order.requested_quantity}</Table.Cell>
                          <Table.Cell>
                            <Chip
                              variant="soft"
                              color={statusColor(order.status)}
                            >
                              {order.status}
                            </Chip>
                          </Table.Cell>
                          <Table.Cell>
                            {order.created_at
                              ? new Date(order.created_at).toLocaleDateString()
                              : "—"}
                          </Table.Cell>
                          <Table.Cell>
                            {order.status === "PENDING" ? (
                              <Button
                                variant="danger"
                                size="sm"
                                onPress={() => setOrderToCancel(order)}
                              >
                                <Xmark className="size-4" />
                                Cancel
                              </Button>
                            ) : (
                              <Typography type="body-xs" color="muted">
                                Not available
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
        </main>
      </div>

      <Modal
        isOpen={Boolean(orderToCancel)}
        onOpenChange={(isOpen) => {
          if (!isOpen && !isCancelling) setOrderToCancel(null);
        }}
      >
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>
                  Cancel order #{orderToCancel?.order_id}?
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <Typography type="body-sm">
                  This will cancel your pending request for{" "}
                  <strong>{orderToCancel?.product_name}</strong>. The supplier
                  will be notified.
                </Typography>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="secondary"
                  isDisabled={isCancelling}
                  onPress={() => setOrderToCancel(null)}
                >
                  Keep order
                </Button>
                <Button
                  variant="danger"
                  isDisabled={isCancelling}
                  onPress={handleCancelOrder}
                >
                  {isCancelling ? "Cancelling..." : "Confirm cancellation"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
