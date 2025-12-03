// client.js (or apiRequest.js)
import { Platform } from 'react-native';
import API_BASE_URL from './apiConfig';

export const apiRequest = async (path, method = 'GET', body, token) => {
  const url = `${API_BASE_URL}${path}`;

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,

      // THIS IS THE MAGIC FIX FOR ANDROID + EXPO GO + RENDER
      // Works in Expo Go AND in standalone APK
      ...(Platform.OS === 'android' && !__DEV__
        ? {}
        : { 
            // In development (Expo Go) we need longer timeout + cache busting
            cache: 'no-store',
            // Some Android versions need this header to accept Render's cert
            'User-Agent': 'ReactNative',
          }),
    });

    // Render free tier sometimes returns HTML error page instead of JSON when sleeping
    const contentType = response.headers.get('content-type');
    let data = {};

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // If not JSON (e.g. Render's "sleeping" page), treat as error
      throw new Error('Backend is waking up... Please wait 20–40 seconds and try again');
    }

    if (!response.ok) {
      const msg = data?.message || data?.error || 'Network request failed';
      throw new Error(msg);
    }

    return data;
  } catch (error) {
    // Better error message for the most common case
    if (error.message.includes('Network request failed')) {
      if (__DEV__) {
        throw new Error(
          'Cannot reach backend. Either:\n' +
          '• Your local server is OFF (run it), OR\n' +
          '• Render is sleeping (wait 30–60 sec and retry)\n' +
          '• You are on Android + Expo Go (known issue – build APK instead)'
        );
      } else {
        throw new Error('No internet or server is down. Please try again.');
      }
    }
    throw error;
  }
};