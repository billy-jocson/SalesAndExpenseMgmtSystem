export const getAnalytics = async ({ startDate, endDate }) => {
  const response = await fetch(
    "/backend/public/index.php/api/dashboardAnalytics",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ startDate, endDate }),
    },
  );
  let data;

  try {
    data = await response.json();
  } catch {
    return {
      status: "Error",
      message: `Request failed with status ${response.status}.`,
    };
  }

  if (!response.ok) {
    return { ...data, status: data.status ?? "Error" };
  }

  return data;
};

export const getChartData = async ({ startDate, endDate }) => {
  const response = await fetch("/backend/public/index.php/api/chartData", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ startDate, endDate }),
  });
  let data;

  try {
    const data = await response.json();
    if (!response.ok) {
      return { status: "error", message: data.message || "Request failed" };
    }
    return data; 
  } catch {
    return {
      status: "error",
      message: `Request failed with status ${response.status}.`,
    };
  }
};

export const getLineChartData = async ({ startDate, endDate }) => {
  const response = await fetch(
    "/backend/public/index.php/api/LineChartData",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ startDate, endDate }),
    }
  );

  try {
    const data = await response.json();
    if (!response.ok) {
      return { status: "error", message: data.message || "Request failed" };
    }
    return data; 
  } catch {
    return {
      status: "error",
      message: `Request failed with status ${response.status}.`,
    };
  }
};


export const getSupplierProductAnalytics = async ({ supplierId }) => {
  console.log("Request body:", JSON.stringify({ supplierId }));

  const response = await fetch(
    "/backend/public/index.php/api/supplierProductAnalytics",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ supplierId }),
    },
  );

  console.log(response);
  let data; // 1. Declare data outside the try block

  try {
    data = await response.json(); // 2. Assign response payload
  } catch (error) {
    return {
      status: "Error",
      message: `Failed to parse JSON response from server (Status: ${response.status}).`,
    };
  }

  if (!response.ok) {
    return { ...data, status: data?.status ?? "Error" };
  }

  return data; // 3. Successfully return parsed object
};
