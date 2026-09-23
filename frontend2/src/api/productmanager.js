import { queryString, request } from "./client";

export const buildProductImageUrl = (imagePath) => {
  if (!imagePath) {
    return "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTULlOeY6XTrnI_PT7ypqVrR-dHQghz7qnQxEV5IwZzrw&s";
  }

  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  return `http://localhost/SalesAndExpenseSystem/backend/public${imagePath}`;
};

const buildProductFormData = ({
  supplierId,
  categoryId,
  productName,
  description,
  wholesalePrice,
  imageFile,
  role = "",
  productId,
}) => {
  const formData = new FormData();

  if (productId !== undefined && productId !== null && productId !== "") {
    formData.append("product_id", String(productId));
  }

  if (supplierId !== undefined && supplierId !== null && supplierId !== "") {
    formData.append("supplier_id", String(supplierId));
  }

  if (categoryId !== undefined && categoryId !== null && categoryId !== "") {
    formData.append("category_id", String(categoryId));
  }

  if (productName !== undefined)
    formData.append("product_name", productName ?? "");
  if (description !== undefined)
    formData.append("description", description ?? "");
  if (wholesalePrice !== undefined)
    formData.append("wholesale_price", String(wholesalePrice));
  if (role !== undefined) formData.append("role", role);

  if (imageFile) {
    formData.append("image", imageFile);
  }

  return formData;
};

export const addProduct = async (productData) => {
  const response = await fetch("/backend/public/index.php/api/products", {
    method: "POST",
    body: buildProductFormData(productData),
  });

  try {
    return await response.json();
  } catch {
    return { status: "Error", message: "Unable to add product." };
  }
};

export const updateProduct = async ({ productId, ...productData }) => {
  const response = await fetch(
    `/backend/public/index.php/api/products/${productId}`,
    {
      method: "PATCH",
      body: buildProductFormData({ productId, ...productData }),
    },
  );

  try {
    return await response.json();
  } catch {
    return { status: "Error", message: "Unable to update product." };
  }
};

export const fetchCategories = async () => {
  return request("/products/categories", { method: "GET" });
};

export const updateSellingPrice = async (
  productId,
  sellingPrice,
  role = "",
) => {
  return request(`/products/${productId}/price`, {
    method: "PATCH",
    body: {
      selling_price: sellingPrice,
      role,
    },
  });
};

export const deleteProduct = async (productId, role = "") => {
  return request(`/products/${productId}`, {
    method: "DELETE",
    body: { role },
  });
};

export const restockProduct = async ({
  productId,
  quantity,
  expirationDate,
  paymentMethod = "Cash",
}) => {
  return request(`/products/${productId}/restock`, {
    method: "POST",
    body: {
      quantity,
      expiration_date: expirationDate,
      payment_method: paymentMethod,
    },
  });
};

export const ensureStoreProduct = async ({
  supplierProductId,
  sellingPrice,
}) => {
  return request("/products/store", {
    method: "POST",
    body: {
      supplier_product_id: supplierProductId,
      selling_price: sellingPrice,
    },
  });
};

export const fetchProducts = async (
  role = "",
  supplierId = null,
  search = "",
  categoryId = "",
  isAll = false,
) => {
  return request(
    `/products${queryString({
      role,
      supplier_id: supplierId,
      search,
      category_id: categoryId,
      isAll,
    })}`,
    { method: "GET" },
  );
};

export const handleOrdering = async (
  products,
  expirationDate,
  paymentMethod = "Cash",
) => {
  return Promise.all(
    products.map(async (product) => {
      try {
        const storeResponse = await ensureStoreProduct({
          supplierProductId: product.id,
          sellingPrice: product.price,
        });

        if (storeResponse?.status?.toLowerCase() !== "success") {
          return { ...storeResponse, productName: product.name };
        }

        const restockResponse = await restockProduct({
          productId: storeResponse.store_product_id,
          quantity: product.quantity,
          expirationDate,
          paymentMethod,
        });

        return { ...restockResponse, productName: product.name };
      } catch (error) {
        return {
          status: "Error",
          message: error.message || "Unable to order product.",
          productName: product.name,
        };
      }
    }),
  );
};
