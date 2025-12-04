// src/api/client.js
import { Platform } from 'react-native';
import API_BASE_URL from './apiConfig';

export const apiRequest = async (
  path,
  method = 'GET',
  body = null,
  token = null,
  retries = 5
) => {
  const url = `${API_BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const options = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };

  if (Platform.OS === 'android' && __DEV__) {
    options.headers['User-Agent'] = 'ReactNative';
  }

  for (let i = 1; i <= retries; i++) {
    try {
      console.log(`API Request: ${method} ${url} (Attempt ${i}/${retries})`); // For debugging
      const res = await fetch(url, options);
      const contentType = res.headers.get('content-type');

      // Render sleeping → returns HTML
      if (!contentType?.includes('application/json')) {
        if (i < retries) {
          console.log('Server sleeping, retrying in 30s...');
          await new Promise(r => setTimeout(r, 30000)); // Increased to 30s
          continue;
        }
        throw new Error('Server is taking too long to wake up. Try again later.');
      }

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) throw new Error('TOKEN_EXPIRED');
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (err) {
      console.error('API Error:', err.message);
      if (i === retries) throw err;
      if (err.message.includes('Network') || err.message.includes('fetch')) {
        console.log('Network issue, retrying in 10s...');
        await new Promise(r => setTimeout(r, 10000));
      }
    }
  }
};