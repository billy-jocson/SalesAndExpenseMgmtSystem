import { ChevronsUp } from "@gravity-ui/icons";
import {
  Button,
  Calendar,
  DateField,
  DatePicker,
  InputGroup,
  Label,
  Modal,
  TextField,
  toast,
} from "@heroui/react";
import { useState } from "react";
import { parseDate } from "@internationalized/date";
import { restockProduct } from "../api/productmanager.js";

export default function RestockModal({ product, onSuccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [expirationDate, setExpirationDate] = useState("");

  const handleSubmit = async () => {
    const response = await restockProduct({
      productId: product.id,
      quantity: Number(quantity),
      expirationDate,
    });

    if (response?.status?.toLowerCase() === "success") {
      toast.success("Product restocked!");
      setIsOpen(false);
      setQuantity("");
      setExpirationDate("");
      onSuccess?.();
      return;
    }

    toast.danger(response?.message ?? "Unable to restock product.");
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

              <DatePicker
                className="w-full"
                name="date"
                value={expirationDate ? parseDate(expirationDate) : null}
                onChange={(date) => setExpirationDate(date?.toString() ?? "")}
              >
                <Label>Expiry Date</Label>
                <DateField.Group fullWidth>
                  <DateField.Input>
                    {(segment) => <DateField.Segment segment={segment} />}
                  </DateField.Input>
                  <DateField.Suffix>
                    <DatePicker.Trigger>
                      <DatePicker.TriggerIndicator />
                    </DatePicker.Trigger>
                  </DateField.Suffix>
                </DateField.Group>
                <DatePicker.Popover>
                  <Calendar aria-label="Expiration date">
                    <Calendar.Header>
                      <Calendar.YearPickerTrigger>
                        <Calendar.YearPickerTriggerHeading />
                        <Calendar.YearPickerTriggerIndicator />
                      </Calendar.YearPickerTrigger>
                      <Calendar.NavButton slot="previous" />
                      <Calendar.NavButton slot="next" />
                    </Calendar.Header>
                    <Calendar.Grid>
                      <Calendar.GridHeader>
                        {(day) => (
                          <Calendar.HeaderCell>{day}</Calendar.HeaderCell>
                        )}
                      </Calendar.GridHeader>
                      <Calendar.GridBody>
                        {(date) => <Calendar.Cell date={date} />}
                      </Calendar.GridBody>
                    </Calendar.Grid>
                    <Calendar.YearPickerGrid>
                      <Calendar.YearPickerGridBody>
                        {({ year }) => <Calendar.YearPickerCell year={year} />}
                      </Calendar.YearPickerGridBody>
                    </Calendar.YearPickerGrid>
                  </Calendar>
                </DatePicker.Popover>
              </DatePicker>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="secondary">
                Cancel
              </Button>
              <Button variant="primary" onPress={handleSubmit}>
                Restock
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
