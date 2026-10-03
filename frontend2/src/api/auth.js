import { request } from "./client";

export const loginUser = async (credentials) => {
  return request("/login", { method: "POST", body: credentials });
};
