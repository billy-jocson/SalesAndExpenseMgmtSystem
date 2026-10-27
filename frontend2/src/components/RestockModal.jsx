import { ChevronsUp, Wallet } from "@gravity-ui/icons";
import {
  Button,
  InputGroup,
  Label,
  Modal,
  TextField,
  toast,
} from "@heroui/react";
import { useState, useContext } from "react";
import { requestRestock } from "../api/ordermanager.js";
import { userContext } from "../context/UserContext.js";

export default function RestockModal({ product, onSuccess }) {
  const { user } = useContext(userContext);
  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [referenceCode, setReferenceCode] = useState("");
  const unitCost = Number(product.unitCost) || 0;
  const total = (Number(quantity) || 0) * unitCost;

  const handleSubmit = async () => {
    if (
      !quantity ||
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) <= 0
    ) {
      toast.danger("Please enter valid quantity.");
      return;
    }

    if (
      paymentMethod === "GCash" &&
      !/^\d{1,13}$/.test(referenceCode.trim())
    ) {
      toast.danger("Enter a GCash reference number using up to 13 digits.");
      return;
    }

    // ADMIN FIX: No expiry date - supplier will set it!
    // Create pending order instead of direct restock
    const response = await requestRestock({
      storeProductId: product.id,
      supplierProductId: product.supplier_product_id || product.id,
      supplierId: product.supplier_id,
      quantity: Number(quantity),
      requestedBy: user?.user_id || user?.id || 1,
      paymentMethod,
      referenceCode: paymentMethod === "GCash" ? referenceCode.trim() : "",
    });

    if (response?.status?.toLowerCase() === "success") {
      toast.success("Restock request sent to supplier! Supplier will set expiry upon acceptance.");
      setIsOpen(false);
      setQuantity("");
      setPaymentMethod("Cash");
      setReferenceCode("");
      onSuccess?.();
      return;
    }

    toast.danger(response?.message ?? "Unable to request restock.");
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button variant="primary" onPress={() => setIsOpen(true)}>
        Restock
      </Button>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[360px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-blue-600 text-white">
                <ChevronsUp className="size-5" />
              </Modal.Icon>
              <Modal.Heading>Restock {product.name}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              <TextField>
                <Label>Quantity</Label>
                <InputGroup>
                  <InputGroup.Input
                    type="number"
                    min="1"
                    placeholder="0"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  />
                </InputGroup>
              </TextField>

              <div className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-sm">
                <span className="text-slate-600">
                  ₱{unitCost.toFixed(2)} × {Number(quantity) || 0}
                </span>
                <span className="font-semibold text-slate-900">
                  Total: ₱{total.toFixed(2)}
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={paymentMethod === "Cash" ? "primary" : "outline"}
                  className="w-full rounded-md"
                  onPress={() => {
                    setPaymentMethod("Cash");
                    setReferenceCode("");
                  }}
                >
                  Cash
                </Button>
                <Button
                  variant={paymentMethod === "GCash" ? "primary" : "outline"}
                  className="w-full rounded-md"
                  onPress={() => setPaymentMethod("GCash")}
                >
                  GCash
                </Button>
              </div>
              {paymentMethod === "GCash" && (
                <TextField>
                  <Label>Reference Number</Label>
                  <InputGroup>
                    <InputGroup.Prefix>
                      <Wallet className="size-4 text-muted" />
                    </InputGroup.Prefix>
                    <InputGroup.Input
                      type="text"
                      inputMode="numeric"
                      maxLength={13}
                      placeholder="Enter reference number"
                      value={referenceCode}
                      onChange={(event) =>
                        setReferenceCode(
                          event.target.value.replace(/\D/g, "").slice(0, 13),
                        )
                      }
                    />
                  </InputGroup>
                </TextField>
              )}

              {/* ADMIN FIX: Removed Expiry Date! Supplier sets it! */}
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="secondary">
                Cancel
              </Button>
              <Button variant="primary" onPress={handleSubmit}>
                Request Restock
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
