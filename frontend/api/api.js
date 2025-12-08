import axios from "axios";
import { toast } from "react-toastify";

const api = axios.create();

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.error;

    if (msg === "Profanity detected.") {
      toast.error("🚫 Profanity detected.");
      return Promise.reject(err);
    }

    if (msg) toast.error(msg);

    return Promise.reject(err);
  }
);

export default api;