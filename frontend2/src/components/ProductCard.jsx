import { Pencil, TagDollar, TrashBin } from "@gravity-ui/icons";
import {
  Chip,
  Button,
  Modal,
  Label,
  TextField,
  InputGroup,
  toast,
} from "@heroui/react";
import { deleteProduct, updateSellingPrice } from "../api/productmanager.js";
import { useState } from "react";

export default function ProductCard({
  //   image,
  id,
  name,
  category,
  sellprice,
  role,
  onSuccess,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [newSellPrice, setNewSellPrice] = useState(sellprice);

  const handleEdit = async () => {
    const numericPrice = Number(newSellPrice);

    if (!id || !Number.isFinite(numericPrice) || numericPrice < 0) {
      toast.danger("Enter a valid selling price.");
      return;
    }

    const response = await updateSellingPrice(id, numericPrice, role);

    if (response?.status?.toLowerCase() === "success") {
      toast.success("Selling price updated!");
      setIsOpen(false);
      onSuccess?.();
      return;
    }

    toast.danger(response?.message ?? "Unable to update selling price.");
  };

  const handleDelete = async () => {
    const response = await deleteProduct(id, role);

    if (response?.status?.toLowerCase() === "success") {
      toast.success("Product deleted!");
      setIsDeleteOpen(false);
      onSuccess?.();
      return;
    }

    toast.danger(response?.message ?? "Unable to delete product.");
  };

  return (
    <article className="flex grow w-auto flex-col max-w-auto overflow-hidden rounded-2xl bg-white p-3.5 shadow-md">
      <div className="flex shadow-inner items-center justify-center overflow-hidden rounded-xl bg-white p-2">
        <img
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTULlOeY6XTrnI_PT7ypqVrR-dHQghz7qnQxEV5IwZzrw&s"
          alt={name}
          className="aspect-square max-w-full h-full object-contain"
        />
      </div>

      <div className="mt-3 flex flex-col lg:flex-row min-h-8 lg:items-center justify-between gap-2">
        <h2 className="min-w-0 truncate text-base font-semibold text-gray-900">
          {name}
        </h2>
        <Chip size="sm" variant="secondary">
          {category}
        </Chip>
      </div>

      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
          Selling price
        </p>
        <p className="text-sm font-semibold text-blue-600">₱{newSellPrice}</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
          <Button variant="primary" className="bg-amber-500 w-full rounded-xl">
            Edit
          </Button>
          <Modal.Backdrop>
            <Modal.Container>
              <Modal.Dialog className="sm:max-w-[360px]">
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Icon className="bg-default text-foreground">
                    <Pencil className="size-5" />
                  </Modal.Icon>
                  <Modal.Heading>Edit {name}</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <TextField className="w-full" name="email">
                    <Label>Selling Price</Label>
                    <InputGroup>
                      <InputGroup.Prefix>
                        <TagDollar className="size-4 text-muted" />
                      </InputGroup.Prefix>
                      <InputGroup.Input
                        className="w-full"
                        placeholder="Enter selling price"
                        value={newSellPrice}
                        onChange={(e) => setNewSellPrice(e.target.value)}
                        type="number"
                      />
                    </InputGroup>
                  </TextField>
                </Modal.Body>
                <Modal.Footer>
                  <Button className="w-full" onPress={handleEdit}>
                    Save
                  </Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>

        <Modal isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <Button
            variant="danger"
            className="w-full rounded-xl"
            onPress={() => setIsDeleteOpen(true)}
          >
            Delete
          </Button>
          <Modal.Backdrop>
            <Modal.Container>
              <Modal.Dialog className="sm:max-w-[360px]">
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Icon className="bg-red-500 text-white">
                    <TrashBin className="size-5" />
                  </Modal.Icon>
                  <Modal.Heading>Delete</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <p className="text-sm text-zinc-600">
                    Are you sure you want to delete <strong>{name}</strong>?
                    This action is permanent and cannot be undone.
                  </p>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="tertiary" slot="close">
                    Cancel
                  </Button>
                  <Button variant="danger" onPress={handleDelete}>
                    Yes, I'm sure.
                  </Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      </div>
    </article>
  );
}
