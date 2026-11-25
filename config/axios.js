import axios from "axios";

import { cookies } from "next/headers";

const axiosInstance = axios.create({
  baseURL: process.env.BASE_URL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use(async (config) => {
  const cookiesStore = await cookies();
  const token = cookiesStore.get("token")?.value;

  if (token) {
    config.headers["Cookie"] = `token=${token}`;
  }

  return config;
});

export default axiosInstance;
