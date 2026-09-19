// src/api/pos.js

/**
 * Sends the checkout payload to the backend to process a transaction.
 */
export const processTransaction = async (payload) => {
  const response = await fetch("/backend/public/index.php/api/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  try {
    return await response.json();
  } catch {
    return {
      status: "Error",
      message: `Request failed with status ${response.status}.`,
    };
  }
};