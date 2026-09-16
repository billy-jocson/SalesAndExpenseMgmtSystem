import Navbar from "../components/Navbar";
import TopBar from "../components/TopBar.jsx";
import posIcon from "../assets/images/pos.png";
import { useEffect, useState } from "react";
import POSProductCard from "../components/POSProductCard.jsx";
import POSBillItem from "../components/POSBillItem.jsx";
import {
  TextField,
  Button,
  InputGroup,
  Typography,
  Modal,
  Label,
} from "@heroui/react";
import { Magnifier, ShoppingBasket, Wallet, Xmark } from "@gravity-ui/icons";
import { fetchProducts } from "../api/productmanager.js";
import ProductCategoryDropdown from "../components/ProductCategoryDropdown.jsx";
import { useDebounce } from "../hooks/useDebounce.js";
import NoItemFound from "../components/NoItemFound.jsx";

export default function POS() {
  const [searchItem, setSearchItem] = useState();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [categorySelected, setCategorySelected] = useState("");
  const debouncedSearchItem = useDebounce(searchItem ?? "");
  const [cartItems, setCartItems] = useState([]);

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

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const customerCart = (
    <>
      <div className="pb-3">
        <Typography type="h3">Customer Cart</Typography>
        <Typography type="body-sm" color="muted">
          Customer's order breakdown.
        </Typography>
      </div>

      <div className="space-y-3">
        {cartItems.map((item) => (
          <POSBillItem
            key={item.id}
            name={item.name}
            price={item.price}
            quantity={item.quantity}
            image="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTULlOeY6XTrnI_PT7ypqVrR-dHQghz7qnQxEV5IwZzrw&s"
          />
        ))}
      </div>

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

      <div className="grid grid-cols-2 gap-2">
        <Button variant="primary" className="w-full rounded-md">
          Cash
        </Button>
        <Button variant="outline" className="w-full rounded-md">
          GCash
        </Button>
      </div>

      <TextField className="w-full" name="email">
        <Label>Cash Tendered</Label>
        <InputGroup>
          <InputGroup.Prefix>
            <Wallet className="size-4 text-muted" />
          </InputGroup.Prefix>
          <InputGroup.Input
            type="number"
            className="w-full"
            placeholder="Cash amount"
          />
        </InputGroup>
      </TextField>

      <Button variant="primary" className="w-full bg-green-600 text-white">
        Process Transaction
      </Button>
    </>
  );

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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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

        <aside className="hidden w-92.5 shrink-0 flex-col gap-3 rounded-3xl bg-slate-50 p-4 shadow-md md:flex">
          {customerCart}
        </aside>
      </div>
    </div>
  );
}