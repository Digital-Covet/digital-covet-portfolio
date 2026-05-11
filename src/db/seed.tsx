import { prisma } from ".";

const businessModelsData = [
  "B2B",
  "B2C",
  "D2C",
  "C2C",
  "C2B",
  "B2G",
  "B2B2C",
  "B2E",
  "G2C",
  "G2B",
  "C2G",
  "O2O",
];

const sectorsData = [
  {
    name: "Primary (Extraction)",
    industries: [
      { name: "Agriculture", keyBusinesses: ["Farming"] },
      { name: "Forestry", keyBusinesses: ["Logging"] },
      { name: "Fishing", keyBusinesses: ["Commercial Fishing"] },
      {
        name: "Mining & Quarrying",
        keyBusinesses: ["Coal mining", "Metals mining", "Mineral mining"],
      },
      {
        name: "Oil & Gas Extraction",
        keyBusinesses: ["Crude oil production", "Natural gas production"],
      },
      {
        name: "Water Management & Utilities",
        keyBusinesses: ["Freshwater extraction", "Irrigation", "Desalination"],
      },
      {
        name: "Aquaculture & Mariculture",
        keyBusinesses: [
          "Fish farming",
          "Seaweed cultivation",
          "Shellfish breeding",
        ],
      },
      {
        name: "Livestock & Animal Husbandry",
        keyBusinesses: [
          "Cattle production",
          "Poultry production",
          "Dairy production",
          "Wool production",
        ],
      },
      {
        name: "Forestry & Timber",
        keyBusinesses: ["Plantation management", "Pulpwood", "Lumber"],
      },
    ],
  },
  {
    name: "Secondary (Manufacturing)",
    industries: [
      {
        name: "Automotive & Aerospace",
        keyBusinesses: ["Vehicle manufacturing", "Aircraft manufacturing"],
      },
      {
        name: "Chemicals & Pharmaceuticals",
        keyBusinesses: ["Medicine production", "Industrial chemicals"],
      },
      {
        name: "Electronics & Semiconductors",
        keyBusinesses: ["Hardware", "Chips", "Consumer electronics"],
      },
      {
        name: "Construction & Infrastructure",
        keyBusinesses: ["Building homes", "Building roads", "Building bridges"],
      },
      {
        name: "Food & Beverage Processing",
        keyBusinesses: ["Packaged foods", "Beverages", "Dairy products"],
      },
      {
        name: "Textile & Apparel",
        keyBusinesses: [
          "Clothing",
          "Fabric mills",
          "Fast fashion supply chains",
        ],
      },
      {
        name: "Steel & Metal Fabrication",
        keyBusinesses: ["Structural steel", "Aluminum smelting", "Castings"],
      },
      {
        name: "Rubber & Plastics",
        keyBusinesses: ["Synthetic rubber", "Packaging", "Industrial plastics"],
      },
      {
        name: "Paper & Pulp",
        keyBusinesses: ["Newsprint", "Cardboard", "Industrial paper products"],
      },
      {
        name: "Defense & Arms Manufacturing",
        keyBusinesses: ["Military equipment", "Weapons", "Defense systems"],
      },
      {
        name: "Furniture & Wood Products",
        keyBusinesses: ["Cabinetry", "Flooring", "Modular furniture"],
      },
      {
        name: "Glass & Ceramics",
        keyBusinesses: ["Flat glass", "Pottery", "Industrial ceramics"],
      },
      {
        name: "Shipbuilding & Marine Equipment",
        keyBusinesses: ["Commercial vessels", "Naval ships", "Offshore rigs"],
      },
    ],
  },
  {
    name: "Tertiary (Services)",
    industries: [
      {
        name: "Finance, Banking & Insurance",
        keyBusinesses: ["Banking", "Investments", "Risk coverage"],
      },
      {
        name: "Healthcare & Medical Services",
        keyBusinesses: ["Hospitals", "Clinics", "Health tech"],
      },
      {
        name: "Retail & E-commerce",
        keyBusinesses: ["Consumer goods", "Online marketplaces"],
      },
      {
        name: "Transportation & Logistics",
        keyBusinesses: ["Shipping", "Air freight", "Trucking"],
      },
      {
        name: "Travel, Tourism & Hospitality",
        keyBusinesses: ["Hotels", "Airlines", "Leisure"],
      },
      {
        name: "Telecommunications",
        keyBusinesses: ["Internet networks", "Mobile networks"],
      },
      {
        name: "Media & Entertainment",
        keyBusinesses: ["Film", "Gaming", "Digital content"],
      },
      {
        name: "Real Estate & Property Management",
        keyBusinesses: [
          "Residential property",
          "Commercial property",
          "Industrial property",
        ],
      },
      {
        name: "Legal Services",
        keyBusinesses: ["Corporate law", "Litigation", "Compliance consulting"],
      },
      {
        name: "Accounting & Audit",
        keyBusinesses: [
          "Tax advisory",
          "Financial reporting",
          "Forensic accounting",
        ],
      },
      {
        name: "Advertising & Marketing",
        keyBusinesses: ["Brand campaigns", "Digital media", "PR"],
      },
      {
        name: "Public Administration & Government",
        keyBusinesses: ["Policy", "Regulation", "Civil services"],
      },
      {
        name: "Social Services & NGOs",
        keyBusinesses: ["Community welfare", "Humanitarian aid", "Nonprofits"],
      },
      {
        name: "Waste Management & Recycling",
        keyBusinesses: [
          "Landfill operations",
          "Composting",
          "E-waste recycling",
        ],
      },
      {
        name: "Security & Facility Services",
        keyBusinesses: ["Private security", "Cleaning", "Building maintenance"],
      },
      {
        name: "Postal & Courier Services",
        keyBusinesses: [
          "Mail delivery",
          "Last-mile logistics",
          "Express parcels",
        ],
      },
      {
        name: "Religious & Cultural Organizations",
        keyBusinesses: [
          "Places of worship",
          "Cultural trusts",
          "Heritage bodies",
        ],
      },
    ],
  },
  {
    name: "Quaternary (Knowledge)",
    industries: [
      {
        name: "IT & Software",
        keyBusinesses: ["AI", "Cloud computing", "Software development"],
      },
      {
        name: "SaaS (Software as a Service)",
        keyBusinesses: [
          "Subscription-based cloud software",
          "Platforms",
          "B2B/B2C apps",
        ],
      },
      {
        name: "Research & Development (R&D)",
        keyBusinesses: ["Scientific innovation", "Prototyping"],
      },
      {
        name: "Education & Training",
        keyBusinesses: ["Schools", "Universities", "Corporate training"],
      },
      {
        name: "Consulting & Advisory",
        keyBusinesses: [
          "Management consulting",
          "Strategy",
          "Business advisory",
        ],
      },
      {
        name: "Data Analytics & Business Intelligence",
        keyBusinesses: ["Data processing", "Visualization", "Market insights"],
      },
      {
        name: "Financial Technology (Fintech)",
        keyBusinesses: ["Digital payments", "Neobanks", "Blockchain solutions"],
      },
      {
        name: "Biotechnology & Life Sciences",
        keyBusinesses: ["Gene editing", "Diagnostics", "Biopharma R&D"],
      },
      {
        name: "Space & Satellite Technology",
        keyBusinesses: [
          "Satellite launches",
          "Space tourism",
          "Orbital services",
        ],
      },
      {
        name: "Cybersecurity",
        keyBusinesses: [
          "Threat intelligence",
          "Network security",
          "Compliance tech",
        ],
      },
      {
        name: "Architecture & Urban Planning",
        keyBusinesses: ["City design", "Zoning", "Smart city development"],
      },
    ],
  },
  {
    name: "Quinary (Decision-Making)",
    industries: [
      {
        name: "Government & Policy Making",
        keyBusinesses: [
          "Legislative bodies",
          "Ministries",
          "International diplomacy",
        ],
      },
      {
        name: "Academic & Scientific Research",
        keyBusinesses: [
          "Think tanks",
          "Universities",
          "Independent research labs",
        ],
      },
      {
        name: "Healthcare Leadership & Public Health",
        keyBusinesses: [
          "WHO-level policy",
          "National health boards",
          "Epidemiology",
        ],
      },
      {
        name: "Environmental & Climate Policy",
        keyBusinesses: [
          "Carbon markets",
          "Climate treaties",
          "Sustainability governance",
        ],
      },
      {
        name: "International Trade & Diplomacy",
        keyBusinesses: [
          "WTO",
          "Bilateral trade bodies",
          "Export promotion councils",
        ],
      },
    ],
  },
];

// --- SEED LOGIC ---

async function main() {
  console.log("Seeding database...");

  // 1. Seed Business Models
  console.log("Processing Business Models...");
  for (const name of businessModelsData) {
    const existing = await prisma.businessModel.findFirst({ where: { name } });
    if (!existing) {
      await prisma.businessModel.create({ data: { name } });
      console.log(`  + Created Business Model: ${name}`);
    }
  }

  // 2. Seed Sectors, Industries, and Key Businesses
  console.log("Processing Sectors, Industries, and Key Businesses...");
  for (const sectorData of sectorsData) {
    // Check if Sector exists
    let sector = await prisma.sector.findFirst({
      where: { name: sectorData.name },
    });

    if (!sector) {
      sector = await prisma.sector.create({ data: { name: sectorData.name } });
      console.log(`  + Created Sector: ${sector.name}`);
    }

    for (const industryData of sectorData.industries) {
      // Check if Industry exists under this sector
      let industry = await prisma.industry.findFirst({
        where: { name: industryData.name, sectorId: sector.id },
      });

      if (!industry) {
        industry = await prisma.industry.create({
          data: { name: industryData.name, sectorId: sector.id },
        });
        console.log(`    + Created Industry: ${industry.name}`);
      }

      for (const kbName of industryData.keyBusinesses) {
        // Check if Key Business exists under this industry
        const existingKb = await prisma.keyBusiness.findFirst({
          where: { name: kbName, industryId: industry.id },
        });

        if (!existingKb) {
          await prisma.keyBusiness.create({
            data: { name: kbName, industryId: industry.id },
          });
          console.log(`      + Created Key Business: ${kbName}`);
        }
      }
    }
  }

  console.log("Seeding completed successfully. No duplicates created.");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
