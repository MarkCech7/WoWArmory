import bigInt from "big-integer";
import type { BigInteger } from "big-integer";

export const calculateSRP6Verifier = async (
  username: string,
  password: string,
  salt: Uint8Array
): Promise<Uint8Array> => {
  const sha1 = async (data: string): Promise<Uint8Array> => {
    const msgBuffer = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest("SHA-1", msgBuffer);
    return new Uint8Array(hashBuffer);
  };

  const sha1Buffer = async (buffer: Uint8Array): Promise<Uint8Array> => {
    const hashBuffer = await crypto.subtle.digest("SHA-1", buffer);
    return new Uint8Array(hashBuffer);
  };

  const g: BigInteger = bigInt(7);
  const N: BigInteger = bigInt(
    "894B645E89E1535BBDAD5B8B290650530801B18EBFBF5E8FAB3C82872A3E9BB7",
    16
  );

  const upperUsername = username.toUpperCase();
  const upperPassword = password.toUpperCase();

  const h1 = await sha1(`${upperUsername}:${upperPassword}`);

  const combinedBuffer = new Uint8Array(salt.length + h1.length);
  combinedBuffer.set(salt);
  combinedBuffer.set(h1, salt.length);
  const h2 = await sha1Buffer(combinedBuffer);

  let h2Int: BigInteger = bigInt.zero;
  for (let i = 0; i < h2.length; i++) {
    h2Int = h2Int.add(bigInt(h2[i]).multiply(bigInt(256).pow(i)));
  }

  const verifierBigInt = g.modPow(h2Int, N);

  const verifier = new Uint8Array(32);
  let tempInt = verifierBigInt;

  for (let i = 0; i < 32; i++) {
    if (tempInt.equals(bigInt.zero)) break;
    verifier[i] = Number(tempInt.mod(256));
    tempInt = tempInt.divide(256);
  }

  return verifier;
};

export const testVerifier = async (
  username: string,
  password: string,
  salt: Uint8Array,
  expectedVerifier: Uint8Array
): Promise<boolean> => {
  const calculatedVerifier = await calculateSRP6Verifier(
    username,
    password,
    salt
  );

  if (calculatedVerifier.length !== expectedVerifier.length) return false;

  for (let i = 0; i < calculatedVerifier.length; i++) {
    if (calculatedVerifier[i] !== expectedVerifier[i]) return false;
  }

  return true;
};
