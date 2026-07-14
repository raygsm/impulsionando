import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { listFictionalBrands } from "@/data/fictional-brands/registry";

const BASE_URL = "https://impulsionando.com.br";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/solucoes", priority: "0.8" },
  { path: "/modulos", priority: "0.8" },
  { path: "/planos", priority: "0.9" },
  { path: "/orcamento", priority: "0.9" },
  { path: "/contratar", priority: "0.8" },
  { path: "/como-funciona", priority: "0.8", changefreq: "monthly" },
  { path: "/como-funciona/fitness", priority: "0.6" },
  { path: "/templates", priority: "0.7", changefreq: "monthly" },
  { path: "/showroom", priority: "0.7" },
  { path: "/nichos", priority: "0.7" },
  { path: "/ecossistema", priority: "0.6" },
  { path: "/marketing", priority: "0.6" },
  { path: "/onboarding-site", priority: "0.7" },
  { path: "/contato", priority: "0.7" },
  { path: "/sobre", priority: "0.6" },
  { path: "/trabalhe-conosco", priority: "0.5" },
  { path: "/central-de-ajuda", priority: "0.5" },
  { path: "/suporte", priority: "0.5" },
  { path: "/termos", priority: "0.3" },
  { path: "/privacidade", priority: "0.3" },
  { path: "/reembolso", priority: "0.3" },
  { path: "/legal", priority: "0.3" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [...staticEntries];

        for (const brand of listFictionalBrands()) {
          const base = `/templates/${brand.slug}`;
          entries.push(
            { path: base, priority: "0.6", changefreq: "monthly" },
            { path: `${base}/sobre`, priority: "0.4" },
            { path: `${base}/catalogo`, priority: "0.4" },
            { path: `${base}/contato`, priority: "0.4" },
          );
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
