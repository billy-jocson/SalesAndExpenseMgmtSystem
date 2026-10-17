import { TagDollar, TrashBin } from "@gravity-ui/icons";
import {
  Button,
  Chip,
  Drawer,
  InputGroup,
  Label,
  Modal,
  TextField,
  toast,
  Typography,
} from "@heroui/react";
import { useEffect, useState } from "react";
import CategoryCheckboxDropdown from "./CategoryCheckboxDropdown.jsx";
import {
  buildProductImageUrl,
  deleteProduct,
  fetchCategories,
  updateProduct,
  updateSellingPrice,
} from "../api/productmanager.js";

export default function ProductCard({
  id,
  name,
  category,
  categoryId,
  categoryIds,
  description,
  imagePath,
  sellprice,
  role,
  onSuccess,
}) {
  const isSupplierRole = (role ?? "").trim().toLowerCase() === "supplier";
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [newSellPrice, setNewSellPrice] = useState(sellprice ?? "");
  const [productName, setProductName] = useState(name ?? "");
  const [productDescription, setProductDescription] = useState(
    description ?? "",
  );
  const [productCategories, setProductCategories] = useState(
    String(categoryIds ?? categoryId ?? "")
      .split(",")
      .filter(Boolean),
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
    setProductCategories(
      String(categoryIds ?? categoryId ?? "")
        .split(",")
        .filter(Boolean),
    );
    setImagePreview(buildProductImageUrl(imagePath));
    setImageFile(null);
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
      !id ||
      !productName.trim() ||
      productCategories.length === 0 ||
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      toast.danger("Enter a valid product name, category, and price.");
      return;
    }

    const response = await updateProduct({
      productId: id,
      categoryIds: productCategories,
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
      setIsOpen(false);
      onSuccess?.();
      return;
    }

    toast.danger(response?.message ?? "Unable to delete product.");
  };

  return (
    <>
      <article
        role="button"
        tabIndex={0}
        aria-label={`Edit ${name}`}
        onClick={(event) => {
          if (event.currentTarget.contains(event.target)) openEditor();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openEditor();
          }
        }}
        className="flex h-fit w-full cursor-pointer flex-col overflow-hidden rounded-2xl bg-white p-3.5 shadow-md transition-shadow hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        <div className="flex h-48 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50 p-2">
          <img
            src={imagePreview}
            alt={name}
            className="h-full w-full rounded-lg object-cover"
            onError={(event) => {
              event.currentTarget.src =
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTULlOeY6XTrnI_PT7ypqVrR-dHQghz7qnQxEV5IwZzrw&s";
            }}
          />
        </div>

        <div className="mt-3 flex min-h-8 flex-col justify-between gap-2 lg:flex-row lg:items-center">
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
      </article>

      <Drawer.Backdrop
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      >
        <Drawer.Content placement="right">
          <Drawer.Dialog className="flex h-full w-full max-w-xl flex-col bg-white text-left shadow-2xl">
            <Drawer.CloseTrigger />
            <Drawer.Header className="border-b border-gray-100 p-3">
              <Drawer.Heading>
                <Typography type="h3" weight="semibold">
                    {isSupplierRole ? "Edit Product" : "Edit Selling Price"}
                </Typography>
                <Typography type="body" color="muted">
                    Update {name}
                </Typography>
              </Drawer.Heading>
            </Drawer.Header>

            <Drawer.Body className="flex-1 space-y-6 overflow-y-auto scrollbar-thin px-6 py-6">
              {isSupplierRole && (
                <>
                  <div>
                    <div className="group relative flex h-48 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 transition-colors hover:bg-gray-100">
                      <img
                        src={imagePreview}
                        className="h-full w-full object-cover transition-opacity group-hover:opacity-50"
                        alt="Product preview"
                        onError={(event) => {
                          event.currentTarget.src =
                            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTULlOeY6XTrnI_PT7ypqVrR-dHQghz7qnQxEV5IwZzrw&s";
                        }}
                      />
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
                          Replace Photo
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        aria-label="Replace product photo"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          setImageFile(file);
                          if (file) {
                            setImagePreview(URL.createObjectURL(file));
                          }
                        }}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      />
                    </div>
                  </div>

                  <TextField className="w-full" name="product-name">
                    <Label className="mb-1.5 text-sm font-medium text-gray-700">
                      Product Name
                    </Label>
                    <InputGroup>
                      <InputGroup.Input
                        className="w-full bg-gray-50 shadow-none"
                        placeholder="Enter product name"
                        value={productName}
                        onChange={(event) => setProductName(event.target.value)}
                      />
                    </InputGroup>
                  </TextField>

                  <div className="flex flex-col">
                    <Label className="mb-1.5 text-sm font-medium text-gray-700">
                      Category
                    </Label>
                    <CategoryCheckboxDropdown
                      categories={categories}
                      selectedIds={productCategories}
                      onSelectionChange={setProductCategories}
                      placeholder="Select categories"
                    />
                  </div>

                  <TextField className="w-full" name="description">
                    <Label className="mb-1.5 text-sm font-medium text-gray-700">
                      Description
                    </Label>
                    <InputGroup>
                      <InputGroup.Input
                        className="w-full bg-gray-50 shadow-none"
                        placeholder="Enter product description"
                        value={productDescription}
                        onChange={(event) =>
                          setProductDescription(event.target.value)
                        }
                      />
                    </InputGroup>
                  </TextField>
                </>
              )}

              <TextField className="w-full" name="selling-price">
                <Label className="mb-1.5 text-sm font-medium text-gray-700">
                  Selling Price
                </Label>
                <InputGroup>
                  <InputGroup.Prefix className="pl-3 text-gray-500">
                    <TagDollar className="size-4" />
                  </InputGroup.Prefix>
                  <InputGroup.Input
                    className="w-full bg-gray-50 shadow-none"
                    placeholder="0.00"
                    value={newSellPrice}
                    onChange={(event) => setNewSellPrice(event.target.value)}
                    type="number"
                  />
                </InputGroup>
              </TextField>
            </Drawer.Body>

            <Drawer.Footer className="flex gap-2">
              <Button className="rounded-md" fullWidth onPress={handleEdit}>
                Update
              </Button>
              <Button
                fullWidth
                variant="danger"
                className="rounded-md"
                onPress={() => setIsDeleteOpen(true)}
              >
                Delete
              </Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>

      <Modal isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-90">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Icon className="bg-red-500 text-white">
                  <TrashBin className="size-5" />
                </Modal.Icon>
                <Modal.Heading>Delete Product</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm text-zinc-600">
                  Are you sure you want to delete <strong>{name}</strong>? This
                  action is permanent and cannot be undone.
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
                  Yes, I&apos;m sure.
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}