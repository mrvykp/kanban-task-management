import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3002/",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

export const api2 = axios.create({
  baseURL: "http://localhost:3001/",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});
