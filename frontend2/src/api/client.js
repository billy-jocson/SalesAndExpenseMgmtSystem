import { dataFormatter } from "./dataFormatter";

// All API modules use this shared backend entry point.
const API_BASE = "/backend/public/index.php/api";

export const request = async (path, options = {}) => {
  const { body, ...requestOptions } = options;
  const response = await fetch(`${API_BASE}${path}`, {
    ...requestOptions,
    // Send JSON by default while still allowing callers to add or override headers.
    headers: {
      "Content-Type": "application/json",
      ...requestOptions.headers,
    },
    // Only attach a body when one was provided, which keeps GET requests empty.
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  // Normalize successful and failed responses in one place for every API call.
  return dataFormatter(response);
};

export const queryString = (params) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    // Ignore empty filters so URLs contain only meaningful parameters.
    if (value !== undefined && value !== null && value !== "")
      query.set(key, value);
  });
  const result = query.toString();
  // Return either a complete query suffix or an empty string when no filters exist.
  return result ? `?${result}` : "";
};
