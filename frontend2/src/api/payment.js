import { request } from "./client";

export const fetchPaymentMethods = async () => {
  return request("/payment-methods", { method: "GET" });
};
