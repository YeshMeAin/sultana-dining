/**
 * One-time script to generate a bcrypt hash for the admin password.
 *
 * Usage:
 *   pnpm tsx scripts/gen-admin-hash.ts yourPasswordHere
 *
 * Copy the output into ADMIN_PASSWORD_HASH in your .env file.
 */
import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error("Usage: pnpm tsx scripts/gen-admin-hash.ts <password>");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
console.log("\nADMIN_PASSWORD_HASH=" + hash + "\n");
