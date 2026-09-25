import Navbar from "../components/Navbar.jsx";
import TopBar from "../components/TopBar.jsx";
import { useContext, useEffect, useState } from "react";
import restockIcon from "../assets/images/restockprod.png";
import {
  Table,
  Chip,
  TextField,
  InputGroup,
  Pagination,
  Typography,
} from "@heroui/react";
import { Magnifier } from "@gravity-ui/icons";
import ProductCategoryDropdown from "../components/ProductCategoryDropdown.jsx";
import { fetchProducts } from "../api/productmanager.js";
import { useDebounce } from "../hooks/useDebounce.js";
import RestockModal from "../components/RestockModal.jsx";
import NoItemFound from "../components/NoItemFound.jsx";
import { TableSkeleton } from "../components/PageSkeleton.jsx";
import { userContext } from "../context/UserContext.js";

export default function RestockProducts() {
  const user = useContext(userContext);
  const [searchItem, setSearchItem] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categorySelected, setCategorySelected] = useState("");
  const [productsRefreshKey, setProductsRefreshKey] = useState(0);
  const debouncedSearchItem = useDebounce(searchItem);
  useEffect(() => {
    document.title = "Restock Products";
    const loadProducts = async () => {
      setLoading(true);
      try {
        const data = await fetchProducts(
          user?.role,
          null,
          debouncedSearchItem,
          categorySelected,
        );
        setProducts(data?.status === "Success" ? (data.products ?? []) : []);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [debouncedSearchItem, categorySelected, productsRefreshKey, user?.role]);

  return (
    <div className="flex gap-3">
      <Navbar />

      <div className="flex w-full gap-3">
        <div className="flex flex-col shadow-md rounded-[1.75rem] w-full p-7 gap-3 max-h-[calc(100dvh-2rem)] overflow-y-scroll">
          <TopBar
            title="Restock Products"
            body="Replenish your stocks before they run out."
            emoji={restockIcon}
          />

          <div className="flex w-full flex-col gap-2 xl:flex-row xl:items-end">
            <TextField className="w-full min-w-0 flex-1" name="text">
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

            <div className="flex w-full flex-none flex-col gap-2 sm:flex-row xl:w-auto">
              <ProductCategoryDropdown
                className="w-fit max-w-full"
                placeholder="Category"
                selectedKey={categorySelected || undefined}
                onSelectionChange={(key) =>
                  setCategorySelected(key === "all" ? "" : String(key))
                }
              />
            </div>
          </div>
          <Typography type="body-sm" color="muted">
            {products.length} {products.length > 1 ? "products" : "product"}{" "}
            found.
          </Typography>

          {loading ? (
            <TableSkeleton columns={7} />
          ) : products.length === 0 ? (
            <NoItemFound
              title="No products found"
              body="There is nothing to show here."
            />
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Example table">
                  <Table.Header>
                    <Table.Column>Image</Table.Column>
                    <Table.Column>Name</Table.Column>
                    <Table.Column>Category</Table.Column>
                    <Table.Column>Supplier</Table.Column>
                    <Table.Column>Stock</Table.Column>
                    <Table.Column>Status</Table.Column>
                    <Table.Column>Action</Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {products.map((product) => {
                      const stock = Number(product.stock ?? 0);
                      const status =
                        stock === 0
                          ? "Out of Stock"
                          : stock <= 10
                            ? "Low Stock"
                            : "In Stock";
                      const color =
                        stock === 0
                          ? "danger"
                          : stock <= 10
                            ? "warning"
                            : "success";
                      const imagePath = `/backend/public${product.image_path}`;

                      return (
                        <Table.Row key={product.id}>
                          <Table.Cell>
                            <img
                              src={imagePath}
                              className="w-16 h-16 object-cover rounded-lg"
                            ></img>
                          </Table.Cell>
                          <Table.Cell>{product.prodname}</Table.Cell>
                          <Table.Cell>{product.category}</Table.Cell>
                          <Table.Cell>{product.supplier_name}</Table.Cell>
                          <Table.Cell>{stock}</Table.Cell>
                          <Table.Cell>
                            <Chip
                              variant="primary"
                              className="whitespace-nowrap"
                              color={color}
                            >
                              {status}
                            </Chip>
                          </Table.Cell>
                          <Table.Cell>
                            <RestockModal
                              product={{
                                id: product.id,
                                name: product.prodname,
                              }}
                              onSuccess={() =>
                                setProductsRefreshKey((key) => key + 1)
                              }
                            />
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                  <Table.Footer>
                    <Pagination></Pagination>
                  </Table.Footer>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
