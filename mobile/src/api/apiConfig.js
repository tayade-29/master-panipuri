// config.js
const API_BASE_URL = 
  process.env.NODE_ENV === 'production' 
    ? 'https://panipuriapp.onrender.com' 
    : 'http://10.0.2.2:5000'; // Android emulator
    // For iOS simulator or physical device on same WiFi: 'http://192.168.x.x:5000'

export default API_BASE_URL;