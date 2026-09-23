import { queryString, request } from "./client";

export const getReportSummary = async ({ startDate, endDate }) => {
  return request(`/reports/summary${queryString({ startDate, endDate })}`, {
    method: "GET",
  });
};
