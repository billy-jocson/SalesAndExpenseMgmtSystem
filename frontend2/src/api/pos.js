import { request } from "./client.js";

export const processTransaction = async (payload) => {
  return request("/checkout", {
    method: "POST",
    body: payload,
  });
};
