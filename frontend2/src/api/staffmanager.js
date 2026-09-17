const API_BASE = "http://localhost/SalesAndExpenseMgmtSystem/backend/public/index.php";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const fetchStaffs = (search = "") => {
  return request("/api/fetchStaffs", {
    method: "POST",
    body: JSON.stringify({ search }),
  });
};

export const getStaff = (staff_id) => {
  return request("/api/getStaff", {
    method: "POST",
    body: JSON.stringify({ staff_id }),
  });
};

export const getStaffRoles = () => {
  return request("/api/getStaffRoles", { method: "GET" });
};

export const addStaff = (staffData) => {
  return request("/api/addStaff", {
    method: "POST",
    body: JSON.stringify(staffData),
  });
};
