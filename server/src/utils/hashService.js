import bcrypt from "bcryptjs";
import { authConfig } from "../configs/auth.config.js";

export const hashPassword = async (password) => {
  return bcrypt.hash(password, authConfig.bcrypt.saltRounds);
};

export const comparePassword = async (plain, hashed) => {
  return bcrypt.compare(plain, hashed);
};
