


export async function lookupGeo(ip: string): Promise<{ country: string | null; city: string | null }> {

  if (isPrivateIP(ip)) {
    return { country: null, city: null };
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,city`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { country: null, city: null };

    const data = await res.json() as { status: string; country?: string; city?: string };
    if (data.status !== "success") return { country: null, city: null };

    return {
      country: data.country || null,
      city: data.city || null,
    };
  } catch {
    return { country: null, city: null };
  }
}


function isPrivateIP(ip: string): boolean {
  if (ip === "localhost" || ip === "127.0.0.1" || ip === "::1" || ip === "0.0.0.0") return true;


  const numIp = parseIPv4(ip);
  if (numIp === null) return false;


  if ((numIp & 0xff000000) === 0x0a000000) return true;

  if ((numIp & 0xfff00000) === 0xac100000) return true;

  if ((numIp & 0xffff0000) === 0xc0a80000) return true;

  return false;
}

function parseIPv4(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map(Number);
  if (nums.some(isNaN)) return null;
  return ((nums[0] << 24) | (nums[1] << 16) | (nums[2] << 8) | nums[3]) >>> 0;
}
