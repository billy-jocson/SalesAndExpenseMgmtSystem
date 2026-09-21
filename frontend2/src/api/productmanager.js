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
