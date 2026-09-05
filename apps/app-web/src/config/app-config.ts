import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Impulsionando",
  version: packageJson.version,
  copyright: `© ${currentYear}, Impulsionando.`,
  meta: {
    title: "Impulsionando",
    description: "Operação de marketing para negócios físicos — no ritmo do balcão.",
  },
};
