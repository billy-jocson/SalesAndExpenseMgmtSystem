import { queryString, request } from "./client";

export const fetchStaffs = (search = "") => {
  return request(`/staff${queryString({ search })}`, { method: "GET" });
};

export const getStaff = (staff_id) => {
  return request(`/staff/${staff_id}`, { method: "GET" });
};

export const getStaffRoles = () => {
  return request("/staff/roles", { method: "GET" });
};

export const addStaff = (staffData) => {
  return request("/staff", {
    method: "POST",
    body: staffData,
  });
};

export const deleteStaff = (staff_id) => {
  return request (`/staff/${staff_id}`, {
    method: "DELETE",
  });
};

export const updateStaff = (staffId, staffData) => {
  return request(`/staff/${staffId}`, {
    method: "PATCH",
    body: staffData,
  });
};
