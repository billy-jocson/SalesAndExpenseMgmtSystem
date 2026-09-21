import Navbar from "../components/Navbar.jsx";
import TopBar from "../components/TopBar.jsx";
import { useContext, useEffect, useState } from "react";
import productsIcon from "../assets/images/prodmanager.png";
import { Magnifier } from "@gravity-ui/icons";
import ProductCard from "../components/ProductCard.jsx";
import { InputGroup, TextField, Button } from "@heroui/react";
import { userContext } from "../context/UserContext";
import { fetchProducts } from "../api/productmanager.js";
import ProductCategoryDropdown from "../components/ProductCategoryDropdown.jsx";
import { useDebounce } from "../hooks/useDebounce.js";
import NoItemFound from "../components/NoItemFound.jsx";

export default function ProductsManager() {
  const [searchItem, setSearchItem] = useState("");
  const [products, setProducts] = useState([]);
  const [categorySelected, setCategorySelected] = useState("");
  const [productsRefreshKey, setProductsRefreshKey] = useState(0);
  const debouncedSearchItem = useDebounce(searchItem);
  const { role, user } = useContext(userContext);
  const canManageProducts = ["supplier"].includes(role);

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
            <ProductCategoryDropdown
              selectedKey={categorySelected || undefined}
              onSelectionChange={(key) =>
                setCategorySelected(key === "all" ? "" : String(key))
              }
            />
            {canManageProducts && (
              <Button
                aria-label="Menu"
                variant="primary"
                className="rounded-lg lg:w-fit w-full"
                onClick={null}
              >
                + Add Product
              </Button>
            )}
          </div>
        </div>

        {/* ProductCards */}
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
                category={product.category}
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
