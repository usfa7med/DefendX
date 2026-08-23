

import {
  LOCALHOST_IPS,
  EMPTY_IP_VALUES,
  PRIVATE_CIDRS,
} from "../config/protection.js";


function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const octets = parts.map(Number);
  if (octets.some((o) => isNaN(o) || o < 0 || o > 255)) return null;
  return ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
}


function parseCidr(cidr: string): { base: number; mask: number } | null {
  const [ip, bits] = cidr.split("/");
  const n = parseInt(bits, 10);
  if (!ip || isNaN(n) || n < 0 || n > 32) return null;
  const base = ipv4ToInt(ip);
  if (base === null) return null;
  const mask = ~((1 << (32 - n)) - 1) >>> 0;
  return { base: base & mask, mask };
}




export function isValidIp(ip: string): boolean {
  if (!ip || typeof ip !== "string") return false;


  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
    return ipv4ToInt(ip) !== null;
  }



  if (ip.includes(":")) {
    return /^([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}$/.test(ip) ||
           /^::1$/.test(ip) ||
           /^([0-9a-fA-F]{0,4}:){1,7}:([0-9a-fA-F]{0,4})?$/.test(ip);
  }

  return false;
}


export function isEmptyIp(ip: string): boolean {
  return EMPTY_IP_VALUES.has(ip.toLowerCase().trim());
}


export function isLocalhost(ip: string): boolean {
  const lower = ip.toLowerCase().trim();
  if (LOCALHOST_IPS.has(lower)) return true;

  if (ip.startsWith("127.") && isValidIp(ip)) return true;
  return false;
}


export function isPrivateNetwork(ip: string): boolean {
  const int = ipv4ToInt(ip);
  if (int === null) return false;
  return PRIVATE_CIDRS.some((cidr) => {
    const p = parseCidr(cidr);
    return p !== null && (int & p.mask) === p.base;
  });
}


export function ipMatchesCidr(ip: string, cidr: string): boolean {
  const p = parseCidr(cidr);
  if (p === null) return false;
  const int = ipv4ToInt(ip);
  if (int === null) return false;
  return (int & p.mask) === p.base;
}


export function normalizeIp(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (isEmptyIp(trimmed)) return null;
  return trimmed;
}
