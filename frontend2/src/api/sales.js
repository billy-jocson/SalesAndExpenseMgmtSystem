import { queryString, request } from "./client";

export const getSales = async (search = "", startDate = "", endDate = "") => {
  const data = await request(
    `/sales${queryString({ search, startDate, endDate })}`,
    {
      method: "GET",
    },
  );
  return Array.isArray(data) ? data : [];
};
