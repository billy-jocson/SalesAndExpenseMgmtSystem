// src/pages/POS.jsx
import Navbar from "../components/Navbar";
import TopBar from "../components/TopBar.jsx";
import posIcon from "../assets/images/pos.png";
import { useEffect, useState, useContext } from "react";
import POSProductCard from "../components/POSProductCard.jsx";
import POSBillItem from "../components/POSBillItem.jsx";
import {
  TextField,
  Button,
  InputGroup,
  Typography,
  Modal,
  Label,
  toast
} from "@heroui/react";
import { Magnifier, ShoppingBasket, Wallet, CircleCheckFill } from "@gravity-ui/icons";
import { fetchProducts } from "../api/productmanager.js";
import { processTransaction } from "../api/pos.js";
import ProductCategoryDropdown from "../components/ProductCategoryDropdown.jsx";
import { useDebounce } from "../hooks/useDebounce.js";
import NoItemFound from "../components/NoItemFound.jsx";
import { userContext } from "../context/UserContext";

export default function POS() {
  // Access global user context to get the current logged-in user's details
  const { user } = useContext(userContext);

  // --- STATE MANAGEMENT ---

  // Search and Filtering States
  const [searchItem, setSearchItem] = useState("");
  const debouncedSearchItem = useDebounce(searchItem); // Delays search query to prevent excessive API calls
  const [categorySelected, setCategorySelected] = useState("");
  const [products, setProducts] = useState([]); // Holds the fetched list of products
  
  // Cart States
  const [cartItems, setCartItems] = useState([]); // Array of items currently added to the cart
  const [isCartOpen, setIsCartOpen] = useState(false); // Controls the mobile cart modal visibility
  
  // Payment States
  const [paymentMethod, setPaymentMethod] = useState("Cash"); // Toggles between "Cash" and "GCash"
  const [paymentValue, setPaymentValue] = useState(""); // Holds either cash tendered amount or GCash reference number
  
  // Success Modal States
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null); // Stores details of the successful transaction

  // --- CART LOGIC ---

  /**
   * Adds a product to the cart or increases its quantity if it already exists.
   * Ensures the quantity does not exceed the available physical stock.
   */
  const addToCart = (product, quantity) => {
    setCartItems((prev) => {
      const updatedCart = [];
      let alreadyInCart = false;

      // Loop through existing cart items to check for duplicates
      for (let i = 0; i < prev.length; i++) {
        const item = prev[i];

        if (item.id === product.id) {
          alreadyInCart = true;
          let newQuantity = item.quantity + quantity;
          
          // Cap the quantity to the maximum available stock
          if (newQuantity > product.stock) {
            newQuantity = product.stock;
          }
          updatedCart.push({ ...item, quantity: newQuantity });
        } else {
          updatedCart.push(item); // Keep other items unchanged
        }
      }

      // If the product wasn't in the cart, add it as a new entry
      if (!alreadyInCart) {
        updatedCart.push({ ...product, quantity });
      }

      return updatedCart;
    });
  };

  /**
   * Adjusts the quantity of a specific item in the cart.
   * If the quantity reaches 0, the item is removed automatically.
   */
  const handleQuantityChange = (id, newQty) => {
    setCartItems(prev => {
        if (newQty === 0) return prev.filter(item => item.id !== id);
        return prev.map(item => item.id === id ? { ...item, quantity: newQty } : item);
    });
  };

  /**
   * Explicitly removes an item from the cart regardless of its current quantity.
   */
  const handleRemoveItem = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  // --- FINANCIAL CALCULATIONS ---
  // Re-calculates every time cartItems changes
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1; // 10% tax rate assumption
  const total = subtotal + tax;

  // --- TRANSACTION PROCESSING ---
  
  /**
   * Validates the cart and payment inputs, then sends the payload to the backend.
   */
  const handleProcessTransaction = async () => {
    // 1. Validation Checks
    if (cartItems.length === 0) {
      return toast.danger("Customer cart is empty.");
    }

    if (!paymentValue || paymentValue.trim() === "") {
      return toast.danger(`Please enter ${paymentMethod === "Cash" ? "cash amount" : "reference number"}.`);
    }

    const numericPayment = Number(paymentValue);
    if (paymentMethod === "Cash" && (isNaN(numericPayment) || numericPayment < total)) {
      return toast.danger("Insufficient cash tendered.");
    }

    // 2. Prepare Payload for API
    // Maps "Cash" to 1 and "GCash" to 2 based on database schema setup
    const payload = {
      items: cartItems,
      payment_method_id: paymentMethod === "Cash" ? 1 : 2,
      reference_number: paymentMethod === "GCash" ? paymentValue : null,
      tax_amount: tax,
      user_id: user?.id,
    };

    // 3. API Call
    const response = await processTransaction(payload);
    
    // 4. Handle Response
    if (response?.status?.toLowerCase() === "success") {
      // Save details to show in the success modal
      setTransactionDetails({
        transaction_number: response.transaction.transaction_number,
      });
      setIsSuccessModalOpen(true);
    } else {
      toast.danger(response?.message || "Transaction failed.");
    }
  };

  // --- UI COMPONENTS (Stored in variables for clean rendering) ---

  /**
   * The Customer Cart layout.
   * Extracted into a variable so it can be reused in both the Desktop Sidebar and the Mobile Modal.
   */
  const customerCart = (
    <>
      {/* Cart Header */}
      <div className="pb-3">
        <Typography type="h3">Customer Cart</Typography>
        <Typography type="body-sm" color="muted">
          Customer's order breakdown.
        </Typography>
      </div>

      {/* Cart Items List */}
      <div className="space-y-3 overflow-y-auto pr-2">
        {cartItems.map((item) => (
          <POSBillItem
            key={item.id}
            name={item.name}
            price={item.price}
            quantity={item.quantity}
            image="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTULlOeY6XTrnI_PT7ypqVrR-dHQghz7qnQxEV5IwZzrw&s"
            onQuantityChange={(newQty) => handleQuantityChange(item.id, newQty)}
            onRemove={() => handleRemoveItem(item.id)}
          />
        ))}
        {/* Empty State */}
        {cartItems.length === 0 && (
          <div className="text-center py-5 text-sm text-slate-400 border border-dashed border-slate-300 rounded-xl">
             Cart is currently empty.
          </div>
        )}
      </div>

      {/* Financial Summary */}
      <div className="mt-auto rounded-xl bg-slate-200/60 p-3 text-sm text-slate-700">
        <div className="flex items-center justify-between py-1">
          <span>Items ({cartItems.length})</span>
          <span>₱{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span>Tax (10%)</span>
          <span>₱{tax.toFixed(2)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-slate-300 pt-2 text-base font-semibold text-slate-800">
          <span>Total</span>
          <span>₱{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Toggles (Cash vs GCash) */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        <Button 
            variant={paymentMethod === "Cash" ? "primary" : "outline"} 
            className="w-full rounded-md"
            onPress={() => { setPaymentMethod("Cash"); setPaymentValue(""); }} // Resets input on switch
        >
          Cash
        </Button>
        <Button 
            variant={paymentMethod === "GCash" ? "primary" : "outline"} 
            className="w-full rounded-md"
            onPress={() => { setPaymentMethod("GCash"); setPaymentValue(""); }} // Resets input on switch
        >
          GCash
        </Button>
      </div>

      {/* Dynamic Payment Input */}
      <TextField className="w-full" name="paymentInput">
        <Label>{paymentMethod === "Cash" ? "Cash Tendered" : "Reference Number"}</Label>
        <InputGroup>
          <InputGroup.Prefix>
            <Wallet className="size-4 text-muted" />
          </InputGroup.Prefix>
          <InputGroup.Input
            type={paymentMethod === "Cash" ? "number" : "text"}
            className="w-full"
            placeholder={paymentMethod === "Cash" ? "Enter cash amount" : "Enter reference number"}
            value={paymentValue}
            onChange={(e) => setPaymentValue(e.target.value)}
          />
        </InputGroup>
      </TextField>

      {/* Checkout Button */}
      <Button 
        variant="primary" 
        className="w-full bg-green-600 text-white" 
        onPress={handleProcessTransaction}
      >
        Process Transaction
      </Button>
    </>
  );

  // --- LIFECYCLE HOOKS ---

  // Fetch products from the database whenever the search term or category changes
  useEffect(() => {
    document.title = "POS System";
    const loadProducts = async () => {
      const data = await fetchProducts(
        "",
        null,
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
  }, [debouncedSearchItem, categorySelected]);

  // --- RENDER ---
  return (
    <div className="flex gap-3 relative">
      <Navbar />

      {/* 
        Mobile Cart Floating Button 
        Only visible on small screens (hidden on md+ via 'md:hidden' class).
        Shows a badge with the current number of items in the cart.
      */}
      <Button
        aria-label={`Open customer cart with ${cartItems.length} items`}
        className="fixed right-4 top-4 z-40 min-w-12 rounded-full bg-[#3f5fb2] p-3 text-white shadow-lg md:hidden"
        onPress={() => setIsCartOpen(true)}
      >
        <ShoppingBasket className="size-5" />
        <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
          {cartItems.length}
        </span>
      </Button>

      {/* Mobile Cart Modal (Triggers via floating button) */}
      <Modal isOpen={isCartOpen} onOpenChange={setIsCartOpen}>
        <Modal.Backdrop className="bg-black/40 backdrop-blur-sm">
          <Modal.Container>
            <Modal.Dialog className="max-h-[calc(100dvh-2rem)] w-[min(28rem,calc(100vw-2rem))] overflow-y-auto rounded-3xl bg-slate-50 p-4 shadow-xl">
              <Modal.CloseTrigger
                aria-label="Close customer cart"
                className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
              />
              <div className="flex min-h-[calc(100dvh-4rem)] flex-col gap-3 pt-2">
                {customerCart}
              </div>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
      
      {/* 
        Transaction Success Modal
        Appears only after a successful checkout API response.
      */}
      <Modal isOpen={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <Modal.Backdrop className="bg-black/40 backdrop-blur-sm">
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[400px] bg-white rounded-3xl shadow-xl">
              <Modal.CloseTrigger />
              
              <Modal.Body className="flex flex-col items-center gap-2 pt-8 pb-4 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-green-500 text-white mb-2 shadow-md">
                  <CircleCheckFill className="size-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Transaction Complete!</h2>
                <p className="text-sm text-slate-500">
                  Your transaction <strong>#{transactionDetails?.transaction_number}</strong> was completed successfully.
                </p>
              </Modal.Body>
              
              <Modal.Footer className="flex gap-3 w-full justify-center pb-6">
                <Button
                  variant="outline"
                  className="w-full rounded-full border-slate-300 text-slate-700 font-semibold"
                  onPress={() => console.log('Download receipt logic pending')} // Kept per instructions
                >
                  Download Receipt
                </Button>
                
                {/* 
                  Done Button 
                  Closes modal, resets cart state, clears inputs, and resets payment method to default
                */}
                <Button
                  variant="primary"
                  className="w-full rounded-full bg-green-500 text-white font-semibold"
                  onPress={() => {
                    setIsSuccessModalOpen(false);
                    setCartItems([]);
                    setPaymentValue(""); 
                    setPaymentMethod("Cash");
                    setIsCartOpen(false); // Make sure mobile cart is closed too
                  }}
                >
                  Done
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* Main Container */}
      <div className="flex w-full gap-3">
        {/* Left Side: Product Selection UI */}
        <div className="flex flex-col shadow-md rounded-[1.75rem] w-full p-7 gap-3 max-h-[calc(100dvh-2rem)] overflow-y-scroll">
          <TopBar
            title="Point of Sale"
            body="Create a transaction here."
            emoji={posIcon}
          />

          <div className="flex flex-wrap gap-3">
            {/* Search and Category Filters */}
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
            
            {/* Product Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 w-full">
              {products.length === 0 ? (
                <NoItemFound
                  title="No Products found"
                  body="There is nothing to show here."
                />
              ) : (
                products.map((product) => (
                  <POSProductCard
                    key={product.id}
                    id={product.id}
                    image={null}
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

        {/* Right Side: Desktop Cart Sidebar (Hidden on mobile) */}
        <aside className="hidden w-92.5 shrink-0 flex-col gap-3 rounded-3xl bg-slate-50 p-4 shadow-md md:flex h-[calc(100dvh-2rem)]">
          {customerCart}
        </aside>
      </div>
    </div>
  );
}