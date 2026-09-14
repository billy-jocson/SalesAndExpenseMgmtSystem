export const addExpense = async (
  amount,
  category_id,
  additional_description,
  payment_method_id,
  supplier_id,
  reference_code,
) => {
  const response = await fetch("/backend/public/index.php/api/addExpense", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      category_id,
      additional_description,
      payment_method_id,
      supplier_id,
      reference_code,
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

  return data;
};

export const fetchCategories = async () => {
  const response = await fetch(
    "/backend/public/index.php/api/getExpenseCategories",
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

  return data;
};

export const fetchAllExpenses = async (
  search,
  category,
  startDate = "",
  endDate = "",
) => {
  const response = await fetch(
    "/backend/public/index.php/api/fetchAllExpenses",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        search: search,
        category: category,
        startDate,
        endDate,
      }),
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

  return data;
};
