import type { Property } from "./types";

/**
 * Three synthetic demonstration properties.
 *
 * Addresses are FICTIONAL (note the "XX" postcodes) and placed at the
 * approximate centre of a real neighbourhood so the map has context. Asking
 * prices and all characteristics are invented for demonstration only.
 */
const demo = <T,>(value: T) => ({
  value,
  source: "synthetic" as const,
  origin: "BrickIQ demo dataset",
});

export const DEMO_PROPERTIES: Property[] = [
  {
    id: "demo-canal-apartment",
    isDemo: true,
    nickname: "The Canal Apartment",
    tagline: "1902 canal-house upper floor with ongoing ground lease",
    address: demo({
      street: "Zilvergracht",
      houseNumber: "41-2",
      postcode: "1015 XX",
      city: "Amsterdam",
      municipality: "Amsterdam",
      province: "Noord-Holland",
      neighbourhood: "Jordaan (approx.)",
      display: "Zilvergracht 41-2, 1015 XX Amsterdam",
    }),
    coordinates: demo({ lat: 52.3762, lon: 4.8836 }),
    type: demo("apartment"),
    livingArea: demo(78),
    buildYear: demo(1902),
    energyLabel: demo("D"),
    rooms: demo(3),
    bedrooms: demo(2),
    condition: demo(3),
    outdoor: demo("balcony"),
    parking: demo(false),
    leasehold: demo("ongoing"),
    leaseholdAnnual: demo(2150),
    vveMonthly: demo(215),
    askingPrice: demo(629000),
    marketReference: {
      value: 7600,
      source: "model",
      origin: "BrickIQ regional prior (Amsterdam)",
    },
    notes: [
      "Fictional address — demonstration data only.",
      "Ongoing erfpacht canon is a material ownership cost.",
    ],
  },
  {
    id: "demo-family-home",
    isDemo: true,
    nickname: "The 1930s Family Home",
    tagline: "Renovated corner house with garden in a leafy district",
    address: demo({
      street: "Hoveniersweg",
      houseNumber: "18",
      postcode: "3581 XX",
      city: "Utrecht",
      municipality: "Utrecht",
      province: "Utrecht",
      neighbourhood: "Wittevrouwen (approx.)",
      display: "Hoveniersweg 18, 3581 XX Utrecht",
    }),
    coordinates: demo({ lat: 52.0957, lon: 5.1318 }),
    type: demo("corner"),
    livingArea: demo(132),
    plotArea: demo(214),
    buildYear: demo(1936),
    energyLabel: demo("B"),
    rooms: demo(5),
    bedrooms: demo(4),
    condition: demo(4),
    outdoor: demo("garden"),
    parking: demo(false),
    leasehold: demo("freehold"),
    askingPrice: demo(699000),
    marketReference: {
      value: 5600,
      source: "model",
      origin: "BrickIQ regional prior (Utrecht)",
    },
    notes: [
      "Fictional address — demonstration data only.",
      "Sustainability upgrades (insulation, heat pump) reflected in label B.",
    ],
  },
  {
    id: "demo-harbour-loft",
    isDemo: true,
    nickname: "The Harbour Loft",
    tagline: "2019 new-build with parking, priced above the area prior",
    address: demo({
      street: "Veerhavenkade",
      houseNumber: "120",
      postcode: "3072 XX",
      city: "Rotterdam",
      municipality: "Rotterdam",
      province: "Zuid-Holland",
      neighbourhood: "Kop van Zuid (approx.)",
      display: "Veerhavenkade 120, 3072 XX Rotterdam",
    }),
    coordinates: demo({ lat: 51.9055, lon: 4.4889 }),
    type: demo("apartment"),
    livingArea: demo(94),
    buildYear: demo(2019),
    energyLabel: demo("A+++"),
    rooms: demo(3),
    bedrooms: demo(2),
    condition: demo(5),
    outdoor: demo("balcony"),
    parking: demo(true),
    leasehold: demo("freehold"),
    vveMonthly: demo(295),
    askingPrice: demo(539000),
    marketReference: {
      value: 4400,
      source: "model",
      origin: "BrickIQ regional prior (Rotterdam)",
    },
    notes: [
      "Fictional address — demonstration data only.",
      "New-build premium and private parking spot included.",
    ],
  },
];

export function getDemoProperty(id: string): Property | undefined {
  return DEMO_PROPERTIES.find((p) => p.id === id);
}
