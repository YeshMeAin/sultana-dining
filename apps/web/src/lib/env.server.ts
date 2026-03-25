function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const env = {
  DATABASE_URL: requireEnv("DATABASE_URL"),
  NEXTAUTH_SECRET: requireEnv("NEXTAUTH_SECRET"),
  ADMIN_EMAIL: requireEnv("ADMIN_EMAIL"),
  ADMIN_PASSWORD_HASH: requireEnv("ADMIN_PASSWORD_HASH"),
  NEXTAUTH_URL: process.env["NEXTAUTH_URL"] ?? "http://localhost:3000",
};
