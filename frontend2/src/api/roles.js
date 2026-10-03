import { request } from "./client";

export const fetchRoles = async (userId) => {
  return request(`/roles?user_id=${userId}`, { method: "GET" });
};

export const addRole = async (roleData, userId) => {
  return request("/roles", {
    method: "POST",
    body: { ...roleData, user_id: userId },
  });
};

export const updateRole = async (roleData, userId) => {
  // Idinagdag ang /${roleData.role_id} para mag-tugma sa PATCH /roles/{id} ng backend
  return request(`/roles/${roleData.role_id}`, {
    method: "PATCH",
    body: { ...roleData, user_id: userId },
  });
};

export const deleteRole = async (roleId, userId) => {
  // Idinagdag ang /${roleId} para mag-tugma sa DELETE /roles/{id} ng backend
  // At ipinasa ang user_id sa URL para masiguradong mababasa ng PHP
  return request(`/roles/${roleId}?user_id=${userId}`, {
    method: "DELETE",
  });
};
