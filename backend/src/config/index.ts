import { config } from "dotenv";
config();

export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  PORT: parseInt(process.env.PORT!, 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  DEFENDX_API_KEY: process.env.DEFENDX_API_KEY || "",
};
