import { queryString, request } from "./client";

export const getAnalytics = async ({ startDate, endDate }) => {
  return request(`/dashboard/analytics${queryString({ startDate, endDate })}`, {
    method: "GET",
  });
};

export const getChartData = async (period) => {
  return request(`/dashboard/chart${queryString(period)}`, { method: "GET" });
};

export const getLineChartData = async ({ startDate, endDate }) => {
  return request(
    `/dashboard/line-chart${queryString({ startDate, endDate })}`,
    {
      method: "GET",
    },
  );
};

export const getSupplierProductAnalytics = async ({ supplierId }) => {
  return request(`/dashboard/total-products${queryString({ supplierId })}`, {
    method: "GET",
  });
};
