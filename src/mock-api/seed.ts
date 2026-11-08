import { COMPANY_STATUSES, type Company } from "@/lib/api/schema";

const NAMES = [
  "Acme Logistics",
  "Brightwave Media",
  "Canal Analytics",
  "Delta Dairy",
  "Elmstreet Bakery",
  "Fjord Robotics",
  "Gouda Software",
  "Harbor Health",
  "Iris Interiors",
  "Juniper Legal",
  "Kite Energy",
  "Lumen Optics",
  "Maple Finance",
  "Nimbus Cloud",
  "Orchid Pharma",
  "Polder Water",
  "Quartz Security",
  "Rijn Freight",
  "Solace Hospitality",
  "Tulip Retail",
  "Umbra Studios",
  "Vela Marine",
  "Windmill Ventures",
  "Xenon Labs",
  "Yield Agritech",
  "Zephyr Travel",
  "Atlas Consulting",
  "Bolt Mobility",
  "Cobalt Mining",
  "Dune Apparel",
  "Ember Foods",
  "Flux Payments",
  "Granite Construction",
  "Helix Biotech",
  "Ivory Publishing",
  "Jade Hotels",
  "Kestrel Aviation",
  "Linden Education",
  "Mosaic Design",
  "North Sea Fisheries",
] as const;

// Fixed epoch keeps seed output deterministic across restarts and tests
const SEED_EPOCH = Date.UTC(2026, 0, 1);
const DAY_MS = 24 * 60 * 60 * 1000;

function toDomain(name: string): string {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.example`;
}

export function seedCompanies(): Company[] {
  return NAMES.map((name, index) => {
    const createdAt = new Date(SEED_EPOCH + index * 3 * DAY_MS).toISOString();
    return {
      id: `cmp_${String(index + 1).padStart(3, "0")}`,
      name,
      domain: index % 7 === 3 ? null : toDomain(name),
      status: COMPANY_STATUSES[index % COMPANY_STATUSES.length] ?? "new",
      version: 1,
      created_at: createdAt,
      updated_at: createdAt,
    };
  });
}
