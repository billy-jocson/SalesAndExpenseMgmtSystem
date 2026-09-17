
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

  
  if (Array.isArray(data)) {
    return data;
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
    const result = await response.json();
    
    if (!response.ok) {
      return { ...result, status: result.status ?? "Error" };
    }
    return result;
  } catch {
    return { status: "Error", message: "Unable to delete supplier." };
  }
};


export const addSupplier = async (supplierData) => {
  const response = await fetch("/backend/public/index.php/api/addSupplier", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(supplierData),
  });
  
  try {
    const result = await response.json();
    if (!response.ok) {
      return { ...result, status: result.status ?? "Error" };
    }
    return result;
  } catch {
    return { status: "Error", message: "Unable to add supplier." };
  }
};


export const updateSupplier = async (supplierData) => {
  const response = await fetch("/backend/public/index.php/api/updateSupplier", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(supplierData),
  });
  
  try {
    const result = await response.json();
    if (!response.ok) {
      return { ...result, status: result.status ?? "Error" };
    }
    return result;
  } catch {
    return { status: "Error", message: "Unable to update supplier." };
  }
};
