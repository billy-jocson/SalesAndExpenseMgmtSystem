import { TagDollar, TrashBin } from "@gravity-ui/icons";
import {
  Chip,
  Button,
  Modal,
  Label,
  TextField,
  InputGroup,
  toast,
  Select,
  ListBox,
} from "@heroui/react";
import {
  buildProductImageUrl,
  deleteProduct,
  fetchCategories,
  updateProduct,
  updateSellingPrice,
} from "../api/productmanager.js";
import { useEffect, useState } from "react";

export default function ProductCard({
  id,
  name,
  category,
  categoryId,
  description,
  imagePath,
  sellprice,
  role,
  onSuccess,
}) {
  const normalizedRole = (role ?? "").trim().toLowerCase();
  const isSupplierRole = normalizedRole === "supplier";

  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [newSellPrice, setNewSellPrice] = useState(sellprice);
  const [productName, setProductName] = useState(name);
  const [productDescription, setProductDescription] = useState(
    description ?? "",
  );
  const [productCategory, setProductCategory] = useState(
    String(categoryId ?? ""),
  );
  const [categories, setCategories] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(
    buildProductImageUrl(imagePath),
  );

  useEffect(() => {
    const loadCategories = async () => {
      const data = await fetchCategories();
      if (data?.status === "Success") {
        setCategories(data.categories ?? []);
      }
    };

    loadCategories();
  }, []);

  const openEditor = () => {
    setNewSellPrice(sellprice ?? "");
    setProductName(name ?? "");
    setProductDescription(description ?? "");
    setProductCategory(String(categoryId ?? ""));
    setImagePreview(buildProductImageUrl(imagePath));
    setImageFile(null);
    setIsOpen(true);
  };

  const openPriceModal = () => {
    setNewSellPrice(sellprice ?? "");
    setIsOpen(true);
  };

  const handleEdit = async () => {
    const numericPrice = Number(newSellPrice);

    if (!isSupplierRole) {
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
      return;
    }

    if (
      (!id ||
        !productName.trim() ||
        !productCategory ||
        !Number.isFinite(numericPrice) ||
        numericPrice < 0) &&
      isSupplierRole
    ) {
      toast.danger("Enter a valid product name, category, and price.");
      return;
    }

    const response = await updateProduct({
      productId: id,
      categoryId: productCategory,
      productName: productName.trim(),
      description: productDescription.trim(),
      wholesalePrice: numericPrice,
      imageFile,
      role,
    });

    if (response?.status?.toLowerCase() === "success") {
      toast.success("Product updated!");
      setIsOpen(false);
      setImageFile(null);
      onSuccess?.();
      return;
    }

    toast.danger(response?.message ?? "Unable to update product.");
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
    <article className="flex h-full w-full min-h-90 flex-col overflow-hidden rounded-2xl bg-white p-3.5 shadow-md relative">
      <div className="flex h-48 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50 p-2">
        <img
          src={imagePreview}
          alt={name}
          className="h-full w-full object-cover rounded-lg"
          onError={(event) => {
            event.currentTarget.src =
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTULlOeY6XTrnI_PT7ypqVrR-dHQghz7qnQxEV5IwZzrw&s";
          }}
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
        {isSupplierRole ? (
          <Button
            variant="primary"
            className="bg-amber-500 w-full rounded-xl"
            onPress={openEditor}
          >
            Edit
          </Button>
        ) : (
          <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
            <Button
              variant="primary"
              className="bg-amber-500 w-full rounded-xl"
              onPress={openPriceModal}
            >
              Edit
            </Button>
            <Modal.Backdrop>
              <Modal.Container>
                <Modal.Dialog className="sm:max-w-90">
                  <Modal.CloseTrigger />
                  <Modal.Header>
                    <Modal.Icon className="bg-default text-foreground">
                      <TagDollar className="size-5" />
                    </Modal.Icon>
                    <Modal.Heading>Edit Selling Price</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body>
                    <TextField className="w-full" name="selling-price">
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
        )}

        {isSupplierRole && isOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />
        )}

        {isSupplierRole && (
          <div
            className={`fixed inset-y-0 right-0 z-70 w-full max-w-120 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col text-left ${
              isOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Edit Product
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">Update {name}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded-full transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              <div>
                <div className="relative flex flex-col items-center justify-center w-full h-48 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 hover:bg-gray-100 transition-colors overflow-hidden group cursor-pointer">
                  <img
                    src={imagePreview}
                    className="object-cover w-full h-full group-hover:opacity-50 transition-opacity"
                    alt="Preview"
                    onError={(event) => {
                      event.currentTarget.src =
                        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTULlOeY6XTrnI_PT7ypqVrR-dHQghz7qnQxEV5IwZzrw&s";
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="px-4 py-2 bg-white text-gray-700 font-medium text-sm rounded-lg shadow-sm border border-gray-200">
                      Replace Photo
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setImageFile(file);
                      if (file) {
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <TextField className="w-full" name="product-name">
                <Label className="text-gray-700 font-medium mb-1.5 text-sm">
                  Product Name
                </Label>
                <InputGroup>
                  <InputGroup.Input
                    className="w-full bg-gray-50 border-none shadow-none"
                    placeholder="Enter product name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </InputGroup>
              </TextField>

              <div className="flex flex-col">
                <Label className="text-gray-700 font-medium mb-1.5 text-sm">
                  Category
                </Label>
                <Select
                  className="w-full"
                  selectedKey={productCategory || undefined}
                  onSelectionChange={(key) => setProductCategory(String(key))}
                  placeholder="Select category"
                >
                  <Select.Trigger className="bg-gray-50 border-none shadow-none">
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {categories.map((categoryOption) => (
                        <ListBox.Item
                          key={String(categoryOption.category_id)}
                          id={String(categoryOption.category_id)}
                          textValue={categoryOption.category_name}
                        >
                          {categoryOption.category_name}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>

              <TextField className="w-full" name="description">
                <Label className="text-gray-700 font-medium mb-1.5 text-sm">
                  Description
                </Label>
                <InputGroup>
                  <InputGroup.Input
                    className="w-full bg-gray-50 border-none shadow-none"
                    placeholder="Enter product description"
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                  />
                </InputGroup>
              </TextField>

              <TextField className="w-full" name="selling-price">
                <Label className="text-gray-700 font-medium mb-1.5 text-sm">
                  Selling Price
                </Label>
                <InputGroup>
                  <InputGroup.Prefix className="text-gray-500 pl-3">
                    <TagDollar className="size-4" />
                  </InputGroup.Prefix>
                  <InputGroup.Input
                    className="w-full bg-gray-50 border-none shadow-none"
                    placeholder="0.00"
                    value={newSellPrice}
                    onChange={(e) => setNewSellPrice(e.target.value)}
                    type="number"
                  />
                </InputGroup>
              </TextField>
            </div>

            <div className="p-6 border-t border-gray-100 bg-white">
              <Button
                className="w-full bg-amber-500 text-white font-semibold rounded-xl py-6"
                onPress={handleEdit}
              >
                Update Product
              </Button>
            </div>
          </div>
        )}

        <Button
          variant="danger"
          className="w-full rounded-xl"
          onPress={() => setIsDeleteOpen(true)}
        >
          Delete
        </Button>

        <Modal isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <Modal.Backdrop>
            <Modal.Container>
              <Modal.Dialog className="sm:max-w-90">
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
                  <Button
                    variant="tertiary"
                    onPress={() => setIsDeleteOpen(false)}
                  >
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
