export const getSales = async (search = "", startDate = "", endDate = "") => {
  const response = await fetch("/backend/public/index.php/api/fetchAllSales", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ search, startDate, endDate }),
  });

  try {
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};
