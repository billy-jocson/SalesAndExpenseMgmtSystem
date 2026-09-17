import { useEffect, useMemo, useState } from "react";
import { Magnifier, Xmark } from "@gravity-ui/icons";

const createEmptyForm = () => ({
  imagePreview: "",
  productName: "",
  categoryId: "",
  supplierId: "",
  description: "",
  quantity: "",
  buyingPrice: "",
  sellingPrice: "",
});

export default function ProductFormDrawer({
  isOpen,
  onClose,
  initialData = null,
  onSubmit,
  categories = [],
  suppliers = [],
}) {
  const isEditMode = Boolean(initialData);
  const [form, setForm] = useState(createEmptyForm());
  const [showSupplierMenu, setShowSupplierMenu] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setForm({
        imagePreview: initialData.imageUrl || "",
        productName: initialData.name || "",
        categoryId: initialData.categoryId || initialData.category || "",
        supplierId: initialData.supplierId || initialData.supplier || "",
        description: initialData.description || "",
        quantity: initialData.quantity ?? "",
        buyingPrice: initialData.buyingPrice ?? "",
        sellingPrice: initialData.sellingPrice ?? "",
      });
      return;
    }

    setForm(createEmptyForm());
  }, [isOpen, initialData]);

  const filteredSuppliers = useMemo(() => {
    const keyword = supplierSearch.trim().toLowerCase();

    return suppliers.filter((supplier) => {
      const label = supplier.name || supplier.supplier_name || "";
      return !keyword || label.toLowerCase().includes(keyword);
    });
  }, [suppliers, supplierSearch]);

  const handleFieldChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setForm((current) => ({ ...current, imagePreview: previewUrl }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <aside className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl">
        <div className="flex h-full flex-col">
          <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 px-6 pb-4 pt-5 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[1.7rem] font-semibold text-zinc-900">
                  {isEditMode ? "Edit Product" : "Add Product"}
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {isEditMode
                    ? "Update the existing product details"
                    : "Add a new product to the records"}
                </p>
              </div>

              <button
                type="button"
                aria-label="Close product form"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 transition hover:bg-zinc-200"
              >
                <Xmark className="size-5" />
              </button>
            </div>
          </header>

          <form
            id="product-form-drawer"
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto px-6 py-5"
          >
            <div className="space-y-5 pb-20">
              <div className="rounded-2xl border border-zinc-200 bg-gray-100 p-4">
                <label className="flex h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white text-center transition hover:bg-zinc-50">
                  {form.imagePreview ? (
                    <img
                      src={form.imagePreview}
                      alt="Product preview"
                      className="h-full w-full rounded-2xl object-cover"
                    />
                  ) : (
                    <>
                      <div className="mb-3 rounded-full bg-gray-100 p-3">
                        <Magnifier className="size-5 text-zinc-600" />
                      </div>
                      <span className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm">
                        Upload a Photo
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Product Name
                </label>
                <input
                  type="text"
                  value={form.productName}
                  onChange={(event) =>
                    handleFieldChange("productName", event.target.value)
                  }
                  placeholder="Enter product name"
                  className="w-full rounded-xl border-none bg-gray-100 px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Select a Category
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={(event) =>
                      handleFieldChange("categoryId", event.target.value)
                    }
                    className="w-full rounded-xl border-none bg-gray-100 px-4 py-3 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option
                        key={category.id ?? category.category_id}
                        value={category.id ?? category.category_id}
                      >
                        {category.name || category.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Select supplier
                  </label>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowSupplierMenu((value) => !value)}
                      className="flex w-full items-center justify-between rounded-xl border-none bg-gray-100 px-4 py-3 text-left text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <span>
                        {suppliers.find(
                          (supplier) =>
                            String(supplier.id ?? supplier.supplier_id) ===
                            String(form.supplierId),
                        )?.name ||
                          suppliers.find(
                            (supplier) =>
                              String(supplier.id ?? supplier.supplier_id) ===
                              String(form.supplierId),
                          )?.supplier_name ||
                          "Select supplier"}
                      </span>
                      <span className="text-zinc-500">▾</span>
                    </button>

                    {showSupplierMenu && (
                      <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
                        <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-2">
                          <Magnifier className="size-4 text-zinc-500" />
                          <input
                            type="text"
                            value={supplierSearch}
                            onChange={(event) =>
                              setSupplierSearch(event.target.value)
                            }
                            placeholder="Search supplier"
                            className="w-full border-none bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
                          />
                        </div>

                        <div className="max-h-60 overflow-y-auto">
                          {filteredSuppliers.length > 0 ? (
                            filteredSuppliers.map((supplier) => {
                              const supplierId = supplier.id ?? supplier.supplier_id;
                              const supplierName =
                                supplier.name || supplier.supplier_name;

                              return (
                                <button
                                  key={supplierId}
                                  type="button"
                                  onClick={() => {
                                    handleFieldChange("supplierId", String(supplierId));
                                    setShowSupplierMenu(false);
                                    setSupplierSearch("");
                                  }}
                                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-100"
                                >
                                  <span>{supplierName}</span>
                                </button>
                              );
                            })
                          ) : (
                            <div className="px-3 py-4 text-sm text-zinc-500">
                              No suppliers found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    handleFieldChange("description", event.target.value)
                  }
                  rows={4}
                  placeholder="Enter product description"
                  className="w-full rounded-xl border-none bg-gray-100 px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.quantity}
                  onChange={(event) =>
                    handleFieldChange("quantity", event.target.value)
                  }
                  className="w-full rounded-xl border-none bg-gray-100 px-4 py-3 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Buying Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.buyingPrice}
                    onChange={(event) =>
                      handleFieldChange("buyingPrice", event.target.value)
                    }
                    className="w-full rounded-xl border-none bg-gray-100 px-4 py-3 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Selling Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.sellingPrice}
                    onChange={(event) =>
                      handleFieldChange("sellingPrice", event.target.value)
                    }
                    className="w-full rounded-xl border-none bg-gray-100 px-4 py-3 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </form>

          <div className="sticky bottom-0 border-t border-zinc-200 bg-white px-6 py-4">
            <button
              type="submit"
              form="product-form-drawer"
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              {isEditMode ? "Save Changes" : "Add Product"}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
