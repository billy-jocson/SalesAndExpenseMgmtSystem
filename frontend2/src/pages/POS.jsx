import Navbar from "../components/Navbar";
import TopBar from "../components/TopBar.jsx";
import posIcon from "../assets/images/pos.png";
import { useContext, useEffect, useState } from "react";
import POSProductCard from "../components/POSProductCard.jsx";
import POSBillItem from "../components/POSBillItem.jsx";
import {
  TextField,
  Button,
  InputGroup,
  Typography,
  Modal,
  Label,
  toast,
} from "@heroui/react";
import {
  Magnifier,
  ShoppingBasket,
  Wallet,
  Xmark,
  CircleCheckFill,
} from "@gravity-ui/icons";
import { fetchProducts } from "../api/productmanager.js";
import { processTransaction } from "../api/pos.js";
import ProductCategoryDropdown from "../components/ProductCategoryDropdown.jsx";
import { useDebounce } from "../hooks/useDebounce.js";
import NoItemFound from "../components/NoItemFound.jsx";
import { CardGridSkeleton } from "../components/PageSkeleton.jsx";
import { userContext } from "../context/UserContext";

export default function POS() {
  const { user } = useContext(userContext);
  const [searchItem, setSearchItem] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categorySelected, setCategorySelected] = useState("");
  const debouncedSearchItem = useDebounce(searchItem);
  const [cartItems, setCartItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentValue, setPaymentValue] = useState("");

  const addToCart = (product, quantity) => {
    setCartItems((prev) => {
      const updatedCart = [];
      let alreadyInCart = false;

      for (let i = 0; i < prev.length; i++) {
        const item = prev[i];

        if (item.id === product.id) {
          alreadyInCart = true;

          let newQuantity = item.quantity + quantity;
          if (newQuantity > product.stock) {
            newQuantity = product.stock;
          }

          const updatedItem = {
            id: item.id,
            name: item.name,
            price: item.price,
            stock: item.stock,
            quantity: newQuantity,
          };

          updatedCart.push(updatedItem);
        } else {
          updatedCart.push(item);
        }
      }

      if (alreadyInCart === false) {
        const newItem = {
          id: product.id,
          name: product.name,
          price: product.price,
          stock: product.stock,
          quantity: quantity,
        };

        updatedCart.push(newItem);
      }

      return updatedCart;
    });
  };

  const handleQuantityChange = (id, newQuantity) => {
    setCartItems((prev) =>
      newQuantity === 0
        ? prev.filter((item) => item.id !== id)
        : prev.map((item) =>
            item.id === id ? { ...item, quantity: newQuantity } : item,
          ),
    );
  };

  const handleRemoveItem = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const handleProcessTransaction = async () => {
    if (cartItems.length === 0) {
      return toast.danger("Customer cart is empty.");
    }

    if (!paymentValue.trim()) {
      return toast.danger(
        `Please enter ${paymentMethod === "Cash" ? "cash amount" : "reference number"}.`,
      );
    }

    let numericPayment = Number(paymentValue);
    if (
      paymentMethod === "Cash" &&
      (Number.isNaN(numericPayment) || numericPayment < total)
    ) {
      return toast.danger("Insufficient cash tendered.");
    }

    if (paymentMethod === "GCash") {
      numericPayment = total;
    }

    const response = await processTransaction({
      items: cartItems,
      payment_method_id: paymentMethod === "Cash" ? 1 : 2,
      reference_number: paymentMethod === "GCash" ? paymentValue : null,
      tax_amount: tax,
      amount: numericPayment,
      user_id: user?.id,
    });

    if (response?.status?.toLowerCase() === "success") {
      setTransactionDetails({
        transaction_number: response.transaction.transaction_number,
      });
      setIsSuccessModalOpen(true);
    } else {
      toast.danger(response?.message || "Transaction failed.");
    }
  };

  const customerCart = (
    <>
      <div className="pb-3">
        <Typography type="h3">Customer Cart</Typography>
        <Typography type="body-sm" color="muted">
          Customer's order breakdown.
        </Typography>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-scroll">
        {cartItems.map((item) => (
          <POSBillItem
            key={item.id}
            name={item.name}
            price={item.price}
            quantity={item.quantity}
            image="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTULlOeY6XTrnI_PT7ypqVrR-dHQghz7qnQxEV5IwZzrw&s"
            onQuantityChange={(newQuantity) =>
              handleQuantityChange(item.id, newQuantity)
            }
            onRemove={() => handleRemoveItem(item.id)}
          />
        ))}
      </div>

      <div className="mt-auto rounded-xl bg-slate-200/60 p-3 text-sm text-slate-700">
        <div className="flex items-center justify-between py-1">
          <span>Items Total ({cartItems.length})</span>
          <span>
            {subtotal.toLocaleString("en-US", {
              style: "currency",
              currency: "PHP",
            })}
          </span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span>Tax (10%)</span>
          <span>
            {tax.toLocaleString("en-US", {
              style: "currency",
              currency: "PHP",
            })}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-slate-300 pt-2 text-base font-semibold text-slate-800">
          <span>Total</span>
          <span>
            {total.toLocaleString("en-US", {
              style: "currency",
              currency: "PHP",
            })}
          </span>
        </div>
        {paymentMethod === "Cash" && (
          <div className="mt-2 flex items-center justify-between border-t border-slate-300 pt-2 text-base font-semibold text-slate-800">
            <span>Change</span>
            <span>
              {paymentValue > total
                ? `${(paymentValue - total.toFixed(2)).toLocaleString("en-US", { style: "currency", currency: "PHP" })}`
                : `${(0.0).toLocaleString("en-US", { style: "currency", currency: "PHP" })}`}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
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

      <Button
        variant="primary"
        className="w-full bg-green-600 text-white"
        onPress={handleProcessTransaction}
      >
        Process Transaction
      </Button>
    </>
  );

  useEffect(() => {
    document.title = "POS System";

    const loadProducts = async () => {
      setLoading(true);
      try {
        const data = await fetchProducts(
          user?.role,
          debouncedSearchItem,
          categorySelected,
        );
        setProducts(data?.status === "Success" ? (data.products ?? []) : []);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [debouncedSearchItem, categorySelected, user?.role]);

  return (
    <div className="flex gap-3">
      <Navbar />

      <Button
        aria-label={`Open customer cart with ${cartItems.length} items`}
        className="fixed right-4 top-4 z-40 min-w-12 rounded-full bg-[#3f5fb2] p-3 text-white shadow-lg md:hidden"
        onClick={() => setIsCartOpen(true)}
      >
        <ShoppingBasket className="size-5" />
        <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
          {cartItems.length}
        </span>
      </Button>

      <Modal isOpen={isCartOpen} onOpenChange={setIsCartOpen}>
        <Modal.Backdrop className="bg-black/40 backdrop-blur-sm">
          <Modal.Container>
            <Modal.Dialog className="max-h-[calc(100dvh-2rem)] w-[min(28rem,calc(100vw-2rem))] overflow-y-auto rounded-3xl bg-slate-50 p-4 shadow-xl">
              <Modal.CloseTrigger
                aria-label="Close customer cart"
                className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
              >
                <Xmark className="size-5" />
              </Modal.CloseTrigger>
              <div className="flex min-h-[calc(100dvh-4rem)] flex-col gap-3 pt-2">
                {customerCart}
              </div>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal isOpen={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <Modal.Backdrop className="bg-black/40 backdrop-blur-sm">
          <Modal.Container>
            <Modal.Dialog className="rounded-3xl bg-white shadow-xl sm:max-w-[400px]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Icon className="bg-default text-foreground">
                  <CircleCheckFill className="size-8" />
                </Modal.Icon>
                <Modal.Heading>Transaction Complete!</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm text-slate-500">
                  Your transaction{" "}
                  <strong>#{transactionDetails?.transaction_number}</strong> was
                  completed successfully.
                </p>
              </Modal.Body>
              <Modal.Footer className="flex w-full pb-6">
                <Button
                  variant="primary"
                  className="w-full rounded-full bg-green-500 font-semibold text-white"
                  onPress={() => {
                    setIsSuccessModalOpen(false);
                    setCartItems([]);
                    setPaymentValue("");
                    setPaymentMethod("Cash");
                    setIsCartOpen(false);
                  }}
                >
                  Done
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <div className="flex w-full gap-3">
        <div className="flex flex-col shadow-md rounded-[1.75rem] w-full p-7 gap-3 max-h-[calc(100dvh-2rem)] overflow-y-scroll">
          <TopBar
            title="Point of Sale"
            body="Create a transaction here."
            emoji={posIcon}
          />

          <div className="flex flex-wrap gap-3">
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

              <ProductCategoryDropdown
                className="w-full lg:w-[256px]"
                placeholder="Select a category"
                selectedKey={categorySelected || undefined}
                onSelectionChange={(key) =>
                  setCategorySelected(key === "all" ? "" : String(key))
                }
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 w-full">
              {loading ? (
                <CardGridSkeleton count={6} />
              ) : products.length === 0 ? (
                <NoItemFound
                  title="No Products found"
                  body="There is nothing to show here."
                />
              ) : (
                products.map((product) => (
                  <POSProductCard
                    key={product.id}
                    id={product.id}
                    image={product.image_path}
                    name={product.prodname}
                    price={parseFloat(product.sellprice)}
                    stock={product.stock}
                    onAddToCart={addToCart}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <aside className="hidden w-92.5 shrink-0 flex-col gap-3 rounded-3xl bg-slate-50 p-4 shadow-md md:flex">
          {customerCart}
        </aside>
      </div>
    </div>
  );
}
