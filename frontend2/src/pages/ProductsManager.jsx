import Navbar from "../components/Navbar.jsx";
import TopBar from "../components/TopBar.jsx";
import { useEffect, useState } from "react";
import productsIcon from "../assets/images/prodmanager.png";
import { Magnifier } from "@gravity-ui/icons";
import ProductCard from "../components/ProductCard.jsx";
import { InputGroup, TextField, Dropdown, Label, Button } from "@heroui/react";

export default function ProductsManager() {
  const [searchItem, setSearchItem] = useState();

  useEffect(() => {
    document.title = "Products Manager";
  }, []);

  return (
    <div className="flex gap-3">
      <Navbar />

      <div className="flex flex-col shadow-md rounded-[1.75rem] w-full p-7 gap-3 max-h-[calc(100dvh-2rem)] overflow-y-scroll">
        <TopBar
          title="Products Manager"
          body="Manage your products here."
          emoji={productsIcon}
        />

        {/* Search Bar & Buttons */}
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
            <Button
              aria-label="Menu"
              variant="primary"
              className="rounded-lg lg:w-fit w-full"
              onClick={null}
            >
              + Add Product
            </Button>
          </div>
        </div>

        {/* ProductCards */}
        <div className="flex flex-wrap gap-3">
          <ProductCard
            name="C2 Apple"
            category="Drinks & Beverages"
            buyprice="20.00"
            sellprice="25.00"
          />
          <ProductCard
            name="C2 Apple"
            category="Drinks & Beverages"
            buyprice="20.00"
            sellprice="25.00"
          />
          <ProductCard
            name="C2 Apple"
            category="Drinks & Beverages"
            buyprice="20.00"
            sellprice="25.00"
          />
          <ProductCard
            name="C2 Apple"
            category="Drinks & Beverages"
            buyprice="20.00"
            sellprice="25.00"
          />
          <ProductCard
            name="C2 Apple"
            category="Drinks & Beverages"
            buyprice="20.00"
            sellprice="25.00"
          />
        </div>
      </div>
    </div>
  );
}
