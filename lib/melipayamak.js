import MelipayamakApi from "melipayamak";

const username = process.env.MELI_PAYAMAK_USERNAME;
const password = process.env.MELI_PAYAMAK_PASSWORD;

if (!username || !password) {
  console.warn("[melipayamak] MELI_PAYAMAK_USERNAME or MELI_PAYAMAK_PASSWORD not set in environment variables");
}

console.log("[melipayamak] Initializing with username:", username);

const meliPayamak = new MelipayamakApi(username, password);

export default meliPayamak;
