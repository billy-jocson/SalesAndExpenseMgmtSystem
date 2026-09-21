export const fetchPaymentMethods = async () => {
  const response = await fetch(
    "/backend/public/index.php/api/getPaymentMethods",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
