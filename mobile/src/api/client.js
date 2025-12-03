import API_BASE_URL from './apiConfig';
 
// For Android emulator; for web / iOS simulator you can change to http://localhost:5000



export const apiRequest = async (path, method = 'GET', body, token) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.message || 'Something went wrong';
    throw new Error(msg);
  }

  return data;
};
