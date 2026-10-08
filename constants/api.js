// Set EXPO_PUBLIC_API_URL=http://<your-pc-ip>:8001/api in mobile/.env to use a local backend
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://pennycore.onrender.com/api";
