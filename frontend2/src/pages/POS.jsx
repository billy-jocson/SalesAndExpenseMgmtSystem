import Navbar from "../components/Navbar";
import TopBar from "../components/TopBar.jsx";
import posIcon from "../assets/images/pos.png";
import { useEffect, useState } from "react";
import POSProductCard from "../components/POSProductCard.jsx";
import POSBillItem from "../components/POSBillItem.jsx";
import { TextField, Button, Dropdown, Label, InputGroup } from "@heroui/react";
import { Magnifier } from "@gravity-ui/icons";

export default function POS() {
  const [searchItem, setSearchItem] = useState();
  const billItems = [
    { id: 1, name: "Potato Cheese", price: 15.0, quantity: 2 },
    { id: 2, name: "Potato Cheese", price: 15.0, quantity: 2 },
    { id: 3, name: "Potato Cheese", price: 15.0, quantity: 2 },
  ];

  const subtotal = billItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  useEffect(() => {
    document.title = "POS System";
  }, []);

  return (
    <div className="flex gap-3">
      <Navbar />

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

              <Dropdown>
                <Button
                  aria-label="Menu"
                  variant="tertiary"
                  className="rounded-lg lg:w-fit w-full"
                >
                  Select a category
                </Button>
                <Dropdown.Popover>
                  <Dropdown.Menu
                    onAction={(key) => console.log(`Selected: ${key}`)}
                  >
                    <Dropdown.Item id="new-file" textValue="New file">
                      <Label>Today</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="copy-link" textValue="Copy link">
                      <Label>This Week</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="edit-file" textValue="Edit file">
                      <Label>This Month</Label>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            </div>
            <POSProductCard
              image={null}
              name="C2 Apple"
              price="25.00"
              stock="2"
            />
            <POSProductCard
              image={null}
              name="C2 Apple"
              price="25.00"
              stock="2"
            />
            <POSProductCard
              image={null}
              name="C2 Apple"
              price="25.00"
              stock="2"
            />
          </div>
        </div>

        <aside className="w-[370px] shrink-0 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <div className="pb-3">
            <h3 className="text-[1.8rem] font-semibold text-slate-800">
              Bill Details
            </h3>
            <p className="text-xs text-slate-500">
              Customer's order breakdown.
            </p>
          </div>

          <div className="space-y-3">
            {billItems.map((item) => (
              <POSBillItem
                key={item.id}
                name={item.name}
                price={item.price}
                quantity={item.quantity}
                image="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTULlOeY6XTrnI_PT7ypqVrR-dHQghz7qnQxEV5IwZzrw&s"
                onDecrease={() => console.log("decrease", item.id)}
                onIncrease={() => console.log("increase", item.id)}
              />
            ))}
          </div>

          <div className="mt-5 rounded-xl bg-slate-200/60 p-3 text-sm text-slate-700">
            <div className="flex items-center justify-between py-1">
              <span>Items ({billItems.length})</span>
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

          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button className="rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300">
              Cash
            </Button>
            <Button className="rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300">
              GCash
            </Button>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Cash Tendered
            </label>
            <input
              type="text"
              placeholder="Enter cash amount"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-0 placeholder:text-slate-400"
            />
          </div>

          <Button
            variant="solid"
            className="mt-5 w-full rounded-xl bg-green-500 text-white hover:bg-green-600"
          >
            Process Transaction
          </Button>
        </aside>
      </div>
    </div>
  );
}
