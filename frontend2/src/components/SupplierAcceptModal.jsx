import { ChevronsUp } from "@gravity-ui/icons";
import {
  Button,
  Checkbox,
  InputGroup,
  Label,
  Modal,
  TextField,
  Typography,
  toast,
} from "@heroui/react";
import { useContext, useState } from "react";
import { acceptOrder } from "../api/ordermanager.js";
import { userContext } from "../context/UserContext.js";

export default function SupplierAcceptModal({ order, onSuccess }) {
  const { user } = useContext(userContext);
  const [isOpen, setIsOpen] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");
  const [noExpiry, setNoExpiry] = useState(false);
  const [batchNumber, setBatchNumber] = useState(
    () => `BATCH-${order?.order_id}-${Date.now().toString().slice(-6)}`,
  );
  const [isAccepting, setIsAccepting] = useState(false);

  const handleNoExpiryToggle = (checked) => {
    setNoExpiry(checked);
    if (checked) {
      setExpiryDate("");
    }
  };

  const handleAccept = async () => {
    if (!noExpiry && !expiryDate) {
      toast.danger("Enter an expiry date or select No expiry date.");
      return;
    }

    if (
      !noExpiry &&
      new Date(expiryDate) < new Date(new Date().setHours(0, 0, 0, 0))
    ) {
      toast.danger("Expiry date cannot be in the past.");
      return;
    }

    setIsAccepting(true);
    try {
      const response = await acceptOrder(order.order_id, {
        expiration_date: noExpiry ? null : expiryDate,
        no_expiry: noExpiry,
        batch_number: batchNumber,
        supplier_user_id: user?.id || user?.user_id,
      });

      if (response?.status?.toLowerCase() === "success") {
        toast.success(`Order #${order.order_id} accepted.`);
        setIsOpen(false);
        onSuccess?.();
      } else {
        toast.danger(response?.message ?? "Unable to accept the order.");
      }
    } catch (error) {
      toast.danger(error.message ?? "Unable to accept the order.");
    } finally {
      setIsAccepting(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button variant="primary" onPress={() => setIsOpen(true)}>
        Accept
      </Button>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-md">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading className="flex items-center gap-2">
                <div className="bg-success-soft text-success-soft-foreground p-3 rounded-full">
                  <ChevronsUp className="size-5" />
                </div>
                <div className="flex flex-col">
                  <Typography type="body" weight="semibold">
                    Accept Order #{order?.order_id}
                  </Typography>
                  <Typography type="body-xs" color="muted">
                    This will accept the order and notify the requester
                  </Typography>
                </div>
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="font-semibold text-blue-900">
                  {order?.product_name}
                </p>
                <p className="mt-1 text-sm text-blue-800">
                  Requested quantity: {order?.requested_quantity}
                </p>
              </div>

              <TextField className="w-full" name="expiry-date">
                <Label>Expiry Date</Label>
                <InputGroup>
                  <InputGroup.Input
                    type="date"
                    min={today}
                    disabled={noExpiry}
                    value={noExpiry ? "" : expiryDate}
                    onChange={(event) => setExpiryDate(event.target.value)}
                  />
                </InputGroup>
              </TextField>

              <Checkbox
                isSelected={noExpiry}
                onChange={handleNoExpiryToggle}
                variant="secondary"
              >
                <Checkbox.Content>
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  No Expiry Date
                </Checkbox.Content>
              </Checkbox>

              <TextField className="w-full" name="batch-number">
                <Label>Batch Number</Label>
                <InputGroup>
                  <InputGroup.Input
                    type="text"
                    placeholder="Batch number"
                    value={batchNumber}
                    onChange={(event) => setBatchNumber(event.target.value)}
                  />
                </InputGroup>
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="secondary" isDisabled={isAccepting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                isDisabled={isAccepting}
                onPress={handleAccept}
              >
                {isAccepting ? "Accepting..." : "Accept Order"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
