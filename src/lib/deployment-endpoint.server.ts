export type DnsEndpoint = {
  host: string;
  cname: string[];
  ipv4: string[];
  ipv6: string[];
  verification: string[];
  resolved: boolean;
};

const DNS_TYPES = { A: 1, CNAME: 5, TXT: 16, AAAA: 28 } as const;

async function queryDns(host: string, type: keyof typeof DNS_TYPES): Promise<string[]> {
  const response = await fetch(
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${DNS_TYPES[type]}`,
    {
      headers: { accept: "application/dns-json" },
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error(`dns_http_${response.status}`);
  const body = (await response.json()) as { Answer?: Array<{ data?: unknown }> };
  return (body.Answer ?? [])
    .map((answer) =>
      String(answer.data ?? "")
        .replace(/\.$/, "")
        .replace(/^"|"$/g, ""),
    )
    .filter(Boolean);
}

export async function discoverDeploymentEndpoint(host: string): Promise<DnsEndpoint> {
  const normalized = host.trim().toLowerCase().replace(/\.$/, "");
  const [cname, ipv4, ipv6, verification] = await Promise.all([
    queryDns(normalized, "CNAME"),
    queryDns(normalized, "A"),
    queryDns(normalized, "AAAA"),
    queryDns(`_lovable.${normalized}`, "TXT").catch(() => []),
  ]);
  return {
    host: normalized,
    cname,
    ipv4,
    ipv6,
    verification,
    resolved: cname.length + ipv4.length + ipv6.length > 0,
  };
}

export function describeDeploymentEndpoint(endpoint: DnsEndpoint): string {
  const routes = [
    ...endpoint.cname.map((value) => `CNAME:${value}`),
    ...endpoint.ipv4.map((value) => `A:${value}`),
    ...endpoint.ipv6.map((value) => `AAAA:${value}`),
  ];
  return routes.length ? routes.join(", ") : "sem endpoint DNS ativo";
}
