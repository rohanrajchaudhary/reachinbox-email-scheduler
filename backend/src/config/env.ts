import dotenv from "dotenv";

dotenv.config();

const env = {
  PORT: Number(process.env.PORT) || 5000,

  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",

  DATABASE_URL: process.env.DATABASE_URL || "",

  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,

  ELASTICSEARCH_URL:
    process.env.ELASTICSEARCH_URL || "http://localhost:9200",
};

export default env;