import { queryString, request } from "./client";

export const getSuppliers = async (search = "") => {
  return request(`/suppliers${queryString({ search })}`, { method: "GET" });
};

export const deleteSupplier = async (supplierId) => {
  return request(`/suppliers/${supplierId}`, {
    method: "DELETE",
  });
};

export const addSupplier = async (supplierData) => {
  return request("/suppliers", { method: "POST", body: supplierData });
};

export const updateSupplier = async (supplierData) => {
  return request(`/suppliers/${supplierData.supplier_id}`, {
    method: "PATCH",
    body: supplierData,
  });
};

export const fetchPostalCodes = async (search = "") => {
  return request(`/suppliers/postal-codes${queryString({ search })}`, {
    method: "GET",
  });
};

export const addPostalCode = async (postalData) => {
  return request("/suppliers/postal-codes", {
    method: "POST",
    body: postalData,
  });
};
