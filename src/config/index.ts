import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || 3001;
export const DATABASE_URL = process.env.DATABASE_URL;
export const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
