import Navbar from "../components/Navbar.jsx";
import TopBar from "../components/TopBar.jsx";
import { useContext, useEffect, useState } from "react";
import restockIcon from "../assets/images/restockprod.png";
import {
  Table,
  Chip,
  TextField,
  InputGroup,
  Label,
  TextArea,
  Typography,
  Button,
  Drawer,
  Separator,
  toast,
} from "@heroui/react";
import { Magnifier } from "@gravity-ui/icons";
import { fetchPendingOrders, rejectOrder } from "../api/ordermanager.js";
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
  const [rejectingOrder, setRejectingOrder] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const debouncedSearch = useDebounce(searchItem);

  const openRejectDrawer = (order) => {
    setRejectingOrder(order);
    setRejectionReason("");
  };

  const handleRejectOrder = async () => {
    const reason = rejectionReason.trim();
    if (!rejectingOrder || !reason) {
      toast.danger("Enter a reason before rejecting this order.");
      return;
    }

    setIsRejecting(true);
    try {
      const response = await rejectOrder(rejectingOrder.order_id, {
        supplier_user_id: user?.id || user?.user_id,
        reason,
      });

      if (response?.status?.toLowerCase() === "success") {
        toast.success(`Order #${rejectingOrder.order_id} rejected.`);
        setRejectingOrder(null);
        setRejectionReason("");
        setRefreshKey((key) => key + 1);
        return;
      }

      toast.danger(response?.message ?? "Unable to reject the order.");
    } catch (error) {
      toast.danger(error.message ?? "Unable to reject the order.");
    } finally {
      setIsRejecting(false);
    }
  };

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
        <div className="flex flex-col shadow-md rounded-[1.75rem] w-full p-7 gap-4 max-h-[calc(100dvh-2rem)] overflow-y-scroll scrollbar-thin">
          <TopBar
            title="Awaiting Orders"
            body="Store orders waiting for your acceptance - you set the expiry date!"
            emoji={restockIcon}
          />

          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "PENDING" ? "primary" : "secondary"}
                onPress={() => setStatusFilter("Pending")}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === "ACCEPTED" ? "primary" : "secondary"}
                onPress={() => setStatusFilter("Accepted")}
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
              <NoItemFound
                title="No orders found"
                body={`No pending orders for supplier #${user?.supplier_id}. Try ordering as Admin for this supplier!`}
              />
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
                      <Table.Column>Actions</Table.Column>
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
                            <Chip
                              size="sm"
                              variant="soft"
                              color={order.order_type === "NEW_ORDER" ? "accent" : "warning"}
                            >
                              {order.order_type === "NEW_ORDER" ? "New Order" : "Restocked"}
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
                                    : order.status === "CANCELLED"
                                      ? "default"
                                      : "danger"
                              }
                            >
                              {order.status === "PENDING"
                                ? "Pending"
                                : order.status === "ACCEPTED"
                                  ? "Accepted"
                                  : order.status === "CANCELLED"
                                    ? "Cancelled"
                                    : "Rejected"}
                            </Chip>
                          </Table.Cell>
                          <Table.Cell>
                            {order.status === "PENDING" ? (
                              <div className="flex flex-wrap gap-2">
                                <SupplierAcceptModal
                                  order={order}
                                  onSuccess={() => setRefreshKey((k) => k + 1)}
                                />
                                <Button
                                  variant="danger"
                                  onPress={() => openRejectDrawer(order)}
                                >
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <span className="text-[11px] font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md w-fit">
                                  Batch: {order.batch_number ? order.batch_number : "N/A"}
                                </span>
                                <Typography type="body-xs" color="muted">
                                  Expiry: {order.expiry_date ? order.expiry_date : "No expiry date"}
                                </Typography>
                              </div>
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

      <Drawer.Backdrop
        isOpen={Boolean(rejectingOrder)}
        onOpenChange={(isOpen) => {
          if (!isOpen && !isRejecting) {
            setRejectingOrder(null);
            setRejectionReason("");
          }
        }}
      >
        <Drawer.Content placement="right">
          <Drawer.Dialog className="flex h-full w-full max-w-lg flex-col bg-white p-10">
            <Drawer.CloseTrigger />
            <Drawer.Header>
              <Drawer.Heading>
                <Typography type="h3">
                  Reject order #{rejectingOrder?.order_id}?
                </Typography>
              </Drawer.Heading>
              <Typography type="body-sm" color="muted">
                Confirm that you want to reject this order and provide a reason
                for the requester.
              </Typography>
            </Drawer.Header>
            <Separator className="my-5" />
            <Drawer.Body className="flex-1 space-y-4 overflow-y-auto scrollbar-thin">
              <div>
                <Typography color="default" type="body-sm" weight="bold">
                  {rejectingOrder?.product_name}
                </Typography>
                <Typography color="muted" type="body-sm">
                  Quantity: {rejectingOrder?.requested_quantity}x
                </Typography>
              </div>

              <TextField className="w-full space-y-2" name="rejection-reason" isRequired>
                <Label isRequired className="text-sm font-medium">Reason for rejection</Label>
                <TextArea
                  aria-label="Reason for rejection"
                  className="min-h-32 w-full"
                  placeholder="Explain why this order is rejected"
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                />
              </TextField>
            </Drawer.Body>
            <Drawer.Footer className="flex justify-end gap-2 p-0">
              <Button
                variant="outline"
                isDisabled={isRejecting}
                onPress={() => setRejectingOrder(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                isDisabled={isRejecting || !rejectionReason.trim()}
                onPress={handleRejectOrder}
              >
                {isRejecting ? "Rejecting..." : "Confirm Reject"}
              </Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </div>
  );
}