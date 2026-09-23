import Navbar from "../components/Navbar.jsx";
import TopBar from "../components/TopBar.jsx";
import { useContext, useEffect, useState } from "react";
import productsIcon from "../assets/images/prodmanager.png";
import { Box, Magnifier, Wallet } from "@gravity-ui/icons";
import ProductCard from "../components/ProductCard.jsx";
import {
  InputGroup,
  TextField,
  Button,
  Label,
  toast,
  Select,
  ListBox,
  Modal,
  Typography,
} from "@heroui/react";
import { userContext } from "../context/UserContext";
import {
  addProduct,
  buildProductImageUrl,
  fetchCategories,
  fetchProducts,
  handleOrdering,
} from "../api/productmanager.js";
import ProductCategoryDropdown from "../components/ProductCategoryDropdown.jsx";
import { useDebounce } from "../hooks/useDebounce.js";
import NoItemFound from "../components/NoItemFound.jsx";
import OrderProductModalCard from "../components/OrderProductModalCard.jsx";
import POSBillItem from "../components/POSBillItem.jsx";

export default function ProductsManager() {
  const [searchItem, setSearchItem] = useState("");
  const [products, setProducts] = useState([]);
  const [categorySelected, setCategorySelected] = useState("");
  const [productsRefreshKey, setProductsRefreshKey] = useState(0);

  // Drawer State
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [addForm, setAddForm] = useState({
    productName: "",
    description: "",
    categoryId: "",
    price: "",
    imageFile: null,
  });
  const [addCategoryOptions, setAddCategoryOptions] = useState([]);
  const debouncedSearchItem = useDebounce(searchItem);
  const { role, user } = useContext(userContext);
  const canManageProducts = ["supplier", "Administrator"].includes(role);
  const [spProducts, setSpProducts] = useState([]);
  const [itemOrderSearch, setSearchItemOrder] = useState("");
  const [orderCategorySelected, setOrderCategorySelected] = useState("");
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const debouncedItemOrderSearch = useDebounce(itemOrderSearch);
  const [cartItems, setCartItems] = useState([]);
  const [orderExpirationDate, setOrderExpirationDate] = useState("");

  useEffect(() => {
    document.title = "Products Manager";

    const loadProducts = async () => {
      const data = await fetchProducts(
        role,
        user?.supplier_id,
        debouncedSearchItem,
        categorySelected,
      );

      if (data?.status === "Success") {
        setProducts(data.products ?? []);
      } else {
        setProducts([]);
      }
    };

    loadProducts();
  }, [
    role,
    user?.supplier_id,
    debouncedSearchItem,
    categorySelected,
    productsRefreshKey,
  ]);

  useEffect(() => {
    const loadCategories = async () => {
      const data = await fetchCategories();
      if (data?.status === "Success") {
        setAddCategoryOptions(data.categories ?? []);
      }
    };

    loadCategories();
  }, []);

  const handleAddProduct = async () => {
    if (
      !addForm.productName.trim() ||
      !addForm.categoryId ||
      !addForm.price ||
      Number(addForm.price) < 0
    ) {
      toast.danger(
        "Please fill in the product name, category, and valid price.",
      );
      return;
    }

    const response = await addProduct({
      supplierId: user?.supplier_id,
      categoryId: addForm.categoryId,
      productName: addForm.productName.trim(),
      description: addForm.description.trim(),
      wholesalePrice: Number(addForm.price),
      imageFile: addForm.imageFile,
      role,
    });

    if (response?.status?.toLowerCase() === "success") {
      toast.success("Product added successfully!");
      setIsAddOpen(false);
      setAddForm({
        productName: "",
        description: "",
        categoryId: "",
        price: "",
        imageFile: null,
      });
      setProductsRefreshKey((value) => value + 1);
      return;
    }

    toast.danger(response?.message ?? "Unable to add product.");
  };

  const handleOrder = (data) => {
    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === data.id);

      if (existingItem) {
        return currentItems.map((item) =>
          item.id === data.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      return [
        ...currentItems,
        {
          id: data.id,
          name: data.prodname,
          price: Number(data.wholesaleprice) || 0,
          quantity: 1,
          image: buildProductImageUrl(data.image_path),
        },
      ];
    });
  };

  const handleCartQuantityChange = (id, quantity) => {
    setCartItems((currentItems) =>
      quantity === 0
        ? currentItems.filter((item) => item.id !== id)
        : currentItems.map((item) =>
            item.id === id ? { ...item, quantity } : item,
          ),
    );
  };

  const handleRemoveCartItem = (id) => {
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.id !== id),
    );
  };

  useEffect(() => {
    if (!isOrderOpen) {
      return;
    }

    const loadAvailableProductsFromSup = async () => {
      const data = await fetchProducts(
        role,
        user?.supplier_id,
        debouncedItemOrderSearch,
        orderCategorySelected,
        true,
      );

      if (data?.status === "Success") {
        setSpProducts(data.products ?? []);
      } else {
        setSpProducts([]);
      }
    };

    loadAvailableProductsFromSup();
  }, [
    isOrderOpen,
    role,
    user?.supplier_id,
    debouncedItemOrderSearch,
    orderCategorySelected,
  ]);

  function CartList() {
    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [paymentValue, setPaymentValue] = useState();
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const orderFunction = async () => {
      if (!orderExpirationDate) {
        toast.danger("Select an expiration date for the ordered products.");
        return;
      }

      if (!paymentValue?.trim()) {
        toast.danger(
          paymentMethod === "Cash"
            ? "Enter the cash amount paid."
            : "Enter the GCash reference number.",
        );
        return;
      }

      if (paymentMethod === "Cash" && Number(paymentValue) < subtotal) {
        toast.danger("Cash amount must cover the order total.");
        return;
      }

      const responses = await handleOrdering(
        cartItems,
        orderExpirationDate,
        paymentMethod,
      );
      const orderSucceeded = responses.every(
        (response) => response?.status?.toLowerCase() === "success",
      );

      if (orderSucceeded) {
        toast.success("Products ordered and inventory updated.");
        setCartItems([]);
        setOrderExpirationDate("");
      } else {
        const failedProducts = responses
          .filter((response) => response?.status?.toLowerCase() !== "success")
          .map(
            (response) =>
              `${response.productName}: ${response.message ?? "Unknown error."}`,
          )
          .join("; ");
        toast.danger(
          failedProducts || "Some products could not be added to inventory.",
        );
      }
    };

    return (
      <aside
        className={`shrink-0 transition-all duration-300 ease-in-out ${
          cartItems.length > 0
            ? "w-full translate-x-0 opacity-100 md:w-92.5"
            : "w-0 translate-x-full opacity-0"
        }`}
        aria-hidden={cartItems.length === 0}
      >
        <div className="flex h-full overflow-y-scroll min-h-96 flex-col gap-3 rounded-3xl bg-slate-50 p-4">
          <div className="pb-1">
            <Typography type="h3">Order Cart</Typography>
            <Typography type="body-sm" color="muted">
              Products selected from your suppliers.
            </Typography>
          </div>

          <div className="min-h-[300px] max-h-[350px] flex-1 space-y-3 overflow-y-auto">
            {cartItems.map((item) => (
              <POSBillItem
                key={item.id}
                name={item.name}
                price={item.price}
                quantity={item.quantity}
                image={item.image}
                onQuantityChange={(quantity) =>
                  handleCartQuantityChange(item.id, quantity)
                }
                onRemove={() => handleRemoveCartItem(item.id)}
              />
            ))}
          </div>

          <div className="rounded-xl bg-slate-200/60 p-3 text-sm text-slate-700">
            <div className="flex items-center justify-between py-1">
              <span>Items ({cartItems.length})</span>
              <span>₱{subtotal.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-slate-300 pt-2 text-base font-semibold text-slate-800">
              <span>Total</span>
              <span>₱{subtotal.toFixed(2)}</span>
            </div>
          </div>
          <TextField className="w-full" name="order-expiration-date">
            <Label>Expiration date</Label>
            <InputGroup>
              <InputGroup.Input
                className="w-full"
                type="date"
                value={orderExpirationDate}
                onChange={(event) => setOrderExpirationDate(event.target.value)}
              />
            </InputGroup>
          </TextField>
          <div className="flex gap-2">
            <Button
              variant={paymentMethod === "Cash" ? "primary" : "outline"}
              className="w-full rounded-md"
              onPress={() => {
                setPaymentMethod("Cash");
                setPaymentValue("");
              }}
            >
              Cash
            </Button>
            <Button
              variant={paymentMethod === "GCash" ? "primary" : "outline"}
              className="w-full rounded-md"
              onPress={() => {
                setPaymentMethod("GCash");
                setPaymentValue("");
              }}
            >
              GCash
            </Button>
          </div>
          <TextField className="w-full" name="paymentInput">
            <Label>
              {paymentMethod === "Cash" ? "Cash Tendered" : "Reference Number"}
            </Label>
            <InputGroup>
              <InputGroup.Prefix>
                <Wallet className="size-4 text-muted" />
              </InputGroup.Prefix>
              <InputGroup.Input
                type={paymentMethod === "Cash" ? "number" : "text"}
                className="w-full"
                placeholder={
                  paymentMethod === "Cash"
                    ? "Enter cash amount"
                    : "Enter reference number"
                }
                value={paymentValue}
                onChange={(event) => setPaymentValue(event.target.value)}
              />
            </InputGroup>
          </TextField>
          <Button className="w-full py-2" onPress={orderFunction}>
            Order Products
          </Button>
        </div>
      </aside>
    );
  }

  return (
    <div className="flex gap-3 relative overflow-hidden">
      <Navbar />

      <div className="flex flex-col shadow-md rounded-[1.75rem] w-full p-7 gap-3 max-h-[calc(100dvh-2rem)] overflow-y-scroll">
        <TopBar
          title="Products Manager"
          body="Manage your products here."
          emoji={productsIcon}
        />

        <div className="flex flex-col lg:flex-row gap-2 w-full">
          <TextField className="w-full" name="text">
            <InputGroup className="w-full">
              <InputGroup.Prefix>
                <Magnifier className="size-4 text-muted" />
              </InputGroup.Prefix>
              <InputGroup.Input
                className="w-full"
                placeholder="Search product"
                value={searchItem}
                onChange={(e) => setSearchItem(e.target.value)}
              />
            </InputGroup>
          </TextField>

          <div className="flex gap-2">
            <ProductCategoryDropdown
              selectedKey={categorySelected || undefined}
              onSelectionChange={(key) =>
                setCategorySelected(key === "all" ? "" : String(key))
              }
            />
            {canManageProducts ? (
              <>
                <Button
                  aria-label="Add product"
                  variant="primary"
                  className="rounded-lg lg:w-fit w-full"
                  onPress={() => setIsAddOpen(true)}
                >
                  + Add Product
                </Button>

                {/* Drawer Backdrop Overlay */}
                {isAddOpen && (
                  <div
                    className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsAddOpen(false)}
                  />
                )}

                {/* Right-side Slide-over Drawer */}
                <div
                  className={`fixed inset-y-0 right-0 z-70 w-full max-w-120 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
                    isAddOpen ? "translate-x-0" : "translate-x-full"
                  }`}
                >
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Add Product
                      </h2>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Add a new product to the records.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAddOpen(false)}
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

                  {/* Drawer Body (Scrollable) */}
                  <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                    {/* Image Upload Area */}
                    <div>
                      <div className="relative flex flex-col items-center justify-center w-full h-48 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 hover:bg-gray-100 transition-colors overflow-hidden group cursor-pointer">
                        {addForm.imageFile ? (
                          <img
                            src={URL.createObjectURL(addForm.imageFile)}
                            className="object-cover w-full h-full"
                            alt="Preview"
                          />
                        ) : (
                          <div className="px-4 py-2 bg-white text-[#006FEE] font-medium text-sm rounded-lg shadow-sm border border-gray-200">
                            Upload a Photo
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) =>
                            setAddForm((current) => ({
                              ...current,
                              imageFile: event.target.files?.[0] ?? null,
                            }))
                          }
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
                          value={addForm.productName}
                          onChange={(e) =>
                            setAddForm((current) => ({
                              ...current,
                              productName: e.target.value,
                            }))
                          }
                        />
                      </InputGroup>
                    </TextField>

                    <div className="flex flex-col">
                      <Label className="text-gray-700 font-medium mb-1.5 text-sm">
                        Category
                      </Label>
                      <Select
                        className="w-full"
                        selectedKey={addForm.categoryId || undefined}
                        onSelectionChange={(key) =>
                          setAddForm((current) => ({
                            ...current,
                            categoryId: String(key),
                          }))
                        }
                        placeholder="Select supplier category"
                      >
                        <Select.Trigger className="bg-gray-50 border-none shadow-none">
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {addCategoryOptions.map((categoryOption) => (
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
                          value={addForm.description}
                          onChange={(e) =>
                            setAddForm((current) => ({
                              ...current,
                              description: e.target.value,
                            }))
                          }
                        />
                      </InputGroup>
                    </TextField>

                    <TextField className="w-full" name="wholesale-price">
                      <Label className="text-gray-700 font-medium mb-1.5 text-sm">
                        Wholesale Price
                      </Label>
                      <InputGroup>
                        <InputGroup.Prefix className="text-gray-500 pl-3">
                          ₱
                        </InputGroup.Prefix>
                        <InputGroup.Input
                          className="w-full bg-gray-50 border-none shadow-none"
                          type="number"
                          placeholder="0.00"
                          value={addForm.price}
                          onChange={(e) =>
                            setAddForm((current) => ({
                              ...current,
                              price: e.target.value,
                            }))
                          }
                        />
                      </InputGroup>
                    </TextField>
                  </div>

                  {/* Drawer Footer */}
                  <div className="p-6 border-t border-gray-100 bg-white">
                    <Button
                      className="w-full bg-[#006FEE] text-white font-semibold rounded-xl py-6"
                      onPress={handleAddProduct}
                    >
                      Add Product
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Modal isOpen={isOrderOpen} onOpenChange={setIsOrderOpen}>
                  <Button onPress={() => setIsOrderOpen(true)}>
                    <Box className="size-4" />
                    Order Products
                  </Button>
                  <Modal.Backdrop>
                    <Modal.Container size="cover">
                      <Modal.Dialog>
                        <Modal.CloseTrigger />
                        <Modal.Header>
                          <Modal.Icon className="bg-accent text-white">
                            <Box className="size-5" />
                          </Modal.Icon>
                          <Modal.Heading>
                            <Typography>Order Products</Typography>
                            <Typography
                              type="body-sm"
                              color="muted"
                              weight="normal"
                            >
                              Find new products offered by your suppliers.
                            </Typography>
                            <div className="w-full flex flex-col md:flex-row gap-2 sticky top-0 z-1 my-3">
                              <TextField className="w-full" name="text">
                                <InputGroup className="w-full">
                                  <InputGroup.Prefix>
                                    <Magnifier className="size-4 text-muted" />
                                  </InputGroup.Prefix>
                                  <InputGroup.Input
                                    className="w-full"
                                    placeholder="Search new product to order"
                                    value={itemOrderSearch}
                                    onChange={(e) =>
                                      setSearchItemOrder(e.target.value)
                                    }
                                  />
                                </InputGroup>
                              </TextField>

                              <ProductCategoryDropdown
                                className="w-full md:w-[400px]"
                                selectedKey={orderCategorySelected || undefined}
                                onSelectionChange={(key) =>
                                  setOrderCategorySelected(
                                    key === "all" ? "" : String(key),
                                  )
                                }
                              />
                            </div>
                          </Modal.Heading>
                        </Modal.Header>
                        <Modal.Body className="max-h-full overflow-hidden">
                          <div className="flex h-full min-h-96 gap-3">
                            <div className="min-w-0 flex-1 overflow-y-auto">
                              <div
                                className={
                                  cartItems.length > 0
                                    ? "grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4"
                                    : "grid grid-cols-1 gap-3 md:grid-cols-4 lg:grid-cols-5"
                                }
                              >
                                {spProducts.map((data) => (
                                  <OrderProductModalCard
                                    key={data.id}
                                    id={data.id}
                                    name={data.prodname}
                                    description={data.description}
                                    image_path={data.image_path}
                                    category={data.category}
                                    supplier_name={data.supplier_name}
                                    wholesaleprice={data.wholesaleprice}
                                    onOrder={handleOrder}
                                  />
                                ))}
                              </div>
                            </div>
                            {CartList()}
                          </div>
                        </Modal.Body>
                        <Modal.Footer>
                          <Typography type="body-xs" color="muted">
                            Up-to-date products offered by all suppliers.
                          </Typography>
                        </Modal.Footer>
                      </Modal.Dialog>
                    </Modal.Container>
                  </Modal.Backdrop>
                </Modal>
              </>
            )}
          </div>
        </div>

        {products.length === 0 ? (
          <NoItemFound
            title="No products found"
            body="There is nothing to show here."
          />
        ) : (
          <div className="gap-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.prodname}
                description={product.description}
                category={product.category}
                categoryId={product.category_id}
                imagePath={product.image_path}
                sellprice={product.sellprice}
                role={role}
                onSuccess={() => setProductsRefreshKey((key) => key + 1)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
