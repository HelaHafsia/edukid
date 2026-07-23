import bcrypt from "bcryptjs";

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export async function hashPin(pin: string) {
  if (!/^\d{4}$/.test(pin)) {
    throw new Error("Le PIN doit contenir exactement 4 chiffres.");
  }
  return bcrypt.hash(pin, 10);
}
