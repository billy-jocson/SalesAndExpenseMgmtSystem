export const getSuppliers = async (search = "") => {
  const response = await fetch("/backend/public/index.php/api/fetchSuppliers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ search }),
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

export const deleteSupplier = async (supplierId) => {
  const response = await fetch("/backend/public/index.php/api/deleteSupplier", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ supplier_id: supplierId }),
  });

  try {
    return await response.json();
  } catch {
    return { status: "Error", message: "Unable to delete supplier." };
  }
};
