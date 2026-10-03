import {
  SquareDashedLetterA,
  TagDollar,
  Wallet,
  CirclePlusFill,
} from "@gravity-ui/icons";
import {
  Button,
  InputGroup,
  Label,
  ListBox,
  Modal,
  Select,
  TextArea,
  TextField,
  toast,
  Typography,
} from "@heroui/react";
import { useEffect, useState } from "react";
import { addExpense, fetchCategories } from "../api/expenses";
import { fetchPaymentMethods } from "../api/payment";

export default function AddExpenseModal({ onSuccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [categorySelected, setCategorySelected] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethodSelected, setPaymentMethodSelected] = useState("");
  const [paymentInput, setPaymentInput] = useState("");
  const [additionalDescription, setAdditionalDescription] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await addExpense(
      amount,
      categorySelected,
      additionalDescription,
      paymentMethodSelected,
      null,
      paymentInput,
    );

    if (response?.status?.toLowerCase() === "success") {
      toast.success("Expense added!");
      setIsOpen(false);
      onSuccess?.();
      return;
    }

    toast.danger(response?.message ?? "Unable to add expense");
  };

  useEffect(() => {
    const loadCategories = async () => {
      const data = await fetchCategories();

      if (Array.isArray(data)) {
        setCategories(
          data.filter(
            (item) => item.category_name?.toLowerCase() !== "inventory",
          ),
        );
        return;
      }

      if (Array.isArray(data?.categories)) {
        setCategories(
          data.categories.filter(
            (item) => item.category_name?.toLowerCase() !== "inventory",
          ),
        );
      }
    };

    const loadPayments = async () => {
      const data = await fetchPaymentMethods();

      if (Array.isArray(data)) {
        setPaymentMethods(data);
        return;
      }

      if (Array.isArray(data?.paymentMethods)) {
        setPaymentMethods(data.paymentMethods);
        return;
      }

      setPaymentMethods([]);
    };

    loadPayments();
    loadCategories();
  }, []);

  const selectedPaymentMethod = paymentMethods.find(
    (item) => String(item.payment_method_id) === String(paymentMethodSelected),
  );
  const isGcashSelected =
    selectedPaymentMethod?.method_name?.toLowerCase() === "gcash";

  return (
    <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button
        variant="primary"
        className="w-full rounded-lg bg-purple-600 text-white"
      >
        <CirclePlusFill className="size-4" />
        Add Expense
      </Button>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-90">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-default text-foreground">
                <Wallet className="size-5" />
              </Modal.Icon>
              <Modal.Heading>
                Add Expense
                <Typography type="body-sm" weight="normal" color="muted">
                  Enter all necessary details about your new expense.
                </Typography>
              </Modal.Heading>
            </Modal.Header>
            <form onSubmit={handleSubmit}>
              <Modal.Body className="flex flex-col gap-3">
                <div className="flex flex-col gap-3">
                  <TextField className="w-full">
                    <Label>Amount</Label>
                    <InputGroup className="w-full">
                      <InputGroup.Prefix>
                        <TagDollar className="size-4 text-muted" />
                      </InputGroup.Prefix>
                      <InputGroup.Input
                        type="number"
                        className="w-full"
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </InputGroup>
                  </TextField>

                  <div className="flex flex-col gap-1">
                    <Label>Expense Category</Label>
                    <Select
                      className="w-full"
                      placeholder="Select expense category"
                      selectedKey={categorySelected || undefined}
                      onSelectionChange={(key) =>
                        setCategorySelected(String(key))
                      }
                    >
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {categories.length === 0 ? (
                            <ListBox.Item
                              isDisabled
                              id="empty"
                              key="empty"
                              textValue="No categories yet"
                            >
                              No categories yet
                            </ListBox.Item>
                          ) : (
                            categories.map((item) => (
                              <ListBox.Item
                                id={String(item.category_id)}
                                key={item.category_id}
                                textValue={String(item.category_name)}
                              >
                                {item.category_name}
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            ))
                          )}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <Label>Payment Method</Label>
                    <Select
                      className="w-full"
                      placeholder="Select payment method"
                      selectedKey={paymentMethodSelected || undefined}
                      onSelectionChange={(key) => {
                        setPaymentMethodSelected(String(key));
                        setPaymentInput("");
                      }}
                    >
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {paymentMethods.length === 0 ? (
                            <ListBox.Item
                              isDisabled
                              id="empty"
                              key="empty"
                              textValue="No payment methods yet"
                            >
                              No payment methods yet
                            </ListBox.Item>
                          ) : (
                            paymentMethods.map((item) => (
                              <ListBox.Item
                                id={String(item.payment_method_id)}
                                key={item.payment_method_id}
                                textValue={String(item.method_name)}
                              >
                                {item.method_name}
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            ))
                          )}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>

                  {isGcashSelected ? (
                    <TextField className="w-full">
                      <Label>GCash Reference Code</Label>
                      <InputGroup className="w-full">
                        <InputGroup.Prefix>
                          <SquareDashedLetterA className="size-4 text-muted" />
                        </InputGroup.Prefix>
                        <InputGroup.Input
                          type="text"
                          className="w-full"
                          value={paymentInput}
                          placeholder="Enter GCash reference code"
                          onChange={(e) => setPaymentInput(e.target.value)}
                        />
                      </InputGroup>
                    </TextField>
                  ) : null}
                </div>

                <TextField>
                  <Label>Additional Description</Label>
                  <TextArea
                    aria-label="Quick project update"
                    className="h-20 w-full"
                    placeholder="Type an additional description"
                    value={additionalDescription}
                    onChange={(e) => setAdditionalDescription(e.target.value)}
                  />
                </TextField>
              </Modal.Body>
              <Modal.Footer>
                <Button className="w-fit" variant="secondary" slot="close">
                  Cancel
                </Button>
                <Button className="w-fit" type="submit">
                  Add Expense
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
