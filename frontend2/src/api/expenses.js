import { queryString, request } from "./client";

export const addExpense = async (
  amount,
  category_id,
  additional_description,
  payment_method_id,
  supplier_id,
  reference_code,
) => {
  return request("/expenses", {
    method: "POST",
    body: {
      amount,
      category_id,
      additional_description,
      payment_method_id,
      supplier_id,
      reference_code,
    },
  });
};

export const fetchCategories = async () => {
  return request("/expenses/categories", { method: "GET" });
};

export const fetchAllExpenses = async (
  search,
  category,
  startDate = "",
  endDate = "",
) => {
  return request(
    `/expenses${queryString({ search, category, startDate, endDate })}`,
    {
      method: "GET",
    },
  );
};
