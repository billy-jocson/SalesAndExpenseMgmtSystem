import { request, queryString } from "./client.js";

export const createPendingOrder = async ({
  orderType = "RESTOCK",
  supplierProductId,
  storeProductId = null,
  supplierId,
  quantity,
  requestedBy,
  paymentMethod = "Cash",
  referenceCode = "",
}) => {
  return request("/orders/pending", {
    method: "POST",
    body: {
      order_type: orderType,
      supplier_product_id: supplierProductId,
      store_product_id: storeProductId,
      supplier_id: supplierId,
      quantity: quantity,
      requested_by: requestedBy,
      payment_method: paymentMethod,
      reference_code: referenceCode,
    },
  });
};

export const fetchPendingOrders = async (supplierId, status = "PENDING", search = "") => {
  return request(
    `/orders/pending${queryString({ supplier_id: supplierId, status, search })}`,
    { method: "GET" }
  );
};

// UPDATED WITH NOTIF BOTH ENDS - now includes supplier_user_id to notify Admin!
export const acceptOrder = async (orderId, { expirationDate, batchNumber = "", supplier_user_id = null, expiration_date = null } = {}) => {
  // Support both naming
  const finalExpiry = expirationDate || expiration_date;
  return request(`/orders/${orderId}/accept`, {
    method: "POST",
    body: {
      expiration_date: finalExpiry,
      batch_number: batchNumber,
      supplier_user_id: supplier_user_id,
    },
  });
};

// Keep old name for backward compat
export const acceptPendingOrder = acceptOrder;

export const rejectOrder = async (orderId, { supplier_user_id = null, reason = "" } = {}) => {
  return request(`/orders/${orderId}/reject`, {
    method: "POST",
    body: {
      supplier_user_id,
      reason,
    },
  });
};

// Keep old name
export const rejectPendingOrder = rejectOrder;

// Updated restock to use pending flow - supplier sets expiry
export const requestRestock = async ({
  storeProductId,
  supplierProductId,
  supplierId,
  quantity,
  requestedBy,
}) => {
  return createPendingOrder({
    orderType: "RESTOCK",
    supplierProductId,
    storeProductId,
    supplierId,
    quantity,
    requestedBy,
  });
};

// Updated order to use pending flow
export const requestNewOrder = async ({
  supplierProductId,
  supplierId,
  quantity,
  requestedBy,
  paymentMethod,
  referenceCode,
}) => {
  return createPendingOrder({
    orderType: "NEW_ORDER",
    supplierProductId,
    storeProductId: null,
    supplierId,
    quantity,
    requestedBy,
    paymentMethod,
    referenceCode,
  });
};
