import type { FictionalBrand } from "./types";
import { institutoVitalis } from "./instituto-vitalis";
import { urbanBurger } from "./urban-burger";
import { novaCasa } from "./nova-casa";

export const FICTIONAL_BRANDS: FictionalBrand[] = [
  institutoVitalis,
  urbanBurger,
  novaCasa,
];

export function listFictionalBrands(): FictionalBrand[] {
  return FICTIONAL_BRANDS;
}

export function getFictionalBrand(slug: string): FictionalBrand | undefined {
  return FICTIONAL_BRANDS.find((b) => b.slug === slug);
}
