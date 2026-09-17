export const buildProductImageUrl = (imagePath) => {
  if (!imagePath) {
    return "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTULlOeY6XTrnI_PT7ypqVrR-dHQghz7qnQxEV5IwZzrw&s";
  }

  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  return `http://localhost/SalesAndExpenseMgmtSystem/backend/public${imagePath}`;
};

export const addProduct = async ({
  supplierId,
  categoryId,
  productName,
  description,
  wholesalePrice,
  imageFile,
  role = "",
}) => {
  const formData = new FormData();
  formData.append("supplier_id", String(supplierId ?? ""));
  formData.append("category_id", String(categoryId ?? ""));
  formData.append("product_name", productName ?? "");
  formData.append("description", description ?? "");
  formData.append("wholesale_price", String(wholesalePrice ?? ""));
  formData.append("role", role);

  if (imageFile) {
    formData.append("image", imageFile);
  }

  const response = await fetch("/backend/public/index.php/api/addProduct", {
    method: "POST",
    body: formData,
  });

  try {
    return await response.json();
  } catch {
    return { status: "Error", message: "Unable to add product." };
  }
};

export const updateProduct = async ({
  productId,
  categoryId,
  productName,
  description,
  wholesalePrice,
  imageFile,
  role = "",
}) => {
  const formData = new FormData();
  formData.append("product_id", String(productId ?? ""));
  formData.append("category_id", String(categoryId ?? ""));
  formData.append("product_name", productName ?? "");
  formData.append("description", description ?? "");
  formData.append("wholesale_price", String(wholesalePrice ?? ""));
  formData.append("role", role);

  if (imageFile) {
    formData.append("image", imageFile);
  }

  const response = await fetch("/backend/public/index.php/api/updateProduct", {
    method: "POST",
    body: formData,
  });

  try {
    return await response.json();
  } catch {
    return { status: "Error", message: "Unable to update product." };
  }
};

export const fetchCategories = async () => {
  const response = await fetch(
    "/backend/public/index.php/api/fetchCategories",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  let data;
  try {
    data = await response.json();
  } catch {
    return {
      status: "Error",
      message: `Request failed with status ${response.status}.`,
    };
  }

  if (!response.ok) {
    return { ...data, status: data.status ?? "Error" };
  }

  return data;
};

export const updateSellingPrice = async (
  productId,
  sellingPrice,
  role = "",
) => {
  const response = await fetch(
    "/backend/public/index.php/api/updateSellingPrice",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: productId,
        selling_price: sellingPrice,
        role,
      }),
    },
  );

  try {
    return await response.json();
  } catch {
    return { status: "Error", message: "Unable to update selling price." };
  }
};

export const deleteProduct = async (productId, role = "") => {
  const response = await fetch("/backend/public/index.php/api/deleteProduct", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: productId, role }),
  });

  try {
    return await response.json();
  } catch {
    return { status: "Error", message: "Unable to delete product." };
  }
};

export const restockProduct = async ({
  productId,
  quantity,
  expirationDate,
}) => {
  const response = await fetch("/backend/public/index.php/api/restockProduct", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product_id: productId,
      quantity,
      expiration_date: expirationDate,
    }),
  });

  try {
    return await response.json();
  } catch {
    return { status: "Error", message: "Unable to restock product." };
  }
};

export const fetchProducts = async (
  role = "",
  supplierId = null,
  search = "",
  categoryId = "",
) => {
  const response = await fetch("/backend/public/index.php/api/fetchProducts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      role,
      supplier_id: supplierId,
      search,
      category_id: categoryId,
    }),
  });

  let data;
  try {
    data = await response.json();
  } catch {
    return {
      status: "Error",
      message: `Request failed with status ${response.status}.`,
    };
  }

  if (!response.ok) {
    return { ...data, status: data.status ?? "Error" };
  }

  return data;
};
