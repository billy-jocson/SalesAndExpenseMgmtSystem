export const loginUser = async (credentials) => {
  const response = await fetch('../../../backend/public/index.php/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  let data;

  try {
    data = await response.json();
  } catch {
    return {
      status: 'error',
      message: `Request failed with status ${response.status}.`,
    };
  }

  if (!response.ok) {
    return { ...data, status: data.status ?? 'error' };
  }

  return data;
};