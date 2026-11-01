import type { Analysis } from "./engine/analysis";
import type { BidInputs, BidOutcome } from "./engine/bidding";
import { CONDITION_LABEL, LEASEHOLD_LABEL, OUTDOOR_LABEL, PROPERTY_TYPE_LABEL, type Provenance } from "./types";

/**
 * Generates a branded PDF report fully client-side with jsPDF.
 * Every figure is printed with its provenance label.
 */
const COLORS = {
  ink: [23, 21, 15] as const,
  ink2: [72, 67, 58] as const,
  muted: [133, 126, 112] as const,
  line: [230, 223, 207] as const,
  ivory: [246, 242, 233] as const,
  emerald: [13, 86, 66] as const,
  emerald2: [19, 122, 91] as const,
  mint: [226, 239, 230] as const,
  gold: [165, 118, 42] as const,
  rose: [176, 71, 58] as const,
  violet: [111, 71, 156] as const,
  slate: [61, 90, 150] as const,
};

const PROV_LABEL: Record<Provenance, string> = {
  verified: "VERIFIED",
  user: "YOUR INPUT",
  model: "MODEL",
  synthetic: "DEMO DATA",
};
const PROV_COLOR: Record<Provenance, readonly [number, number, number]> = {
  verified: COLORS.emerald2,
  user: COLORS.slate,
  model: COLORS.gold,
  synthetic: COLORS.violet,
};

const e = (n: number) =>
  "EUR " +
  new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 0 }).format(Math.round(n)).replace(/[  ]/g, ".");
const pct = (x: number) => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(1)}%`;

export async function generateReportPdf(
  a: Analysis,
  bid: { inputs: BidInputs; outcome: BidOutcome },
  opts: { full: boolean },
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const M = 16;
  const CW = W - M * 2;
  let y = 0;
  const p = a.property;
  const v = a.valuation;

  const color = (c: readonly [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);
  const fill = (c: readonly [number, number, number]) => doc.setFillColor(c[0], c[1], c[2]);
  const stroke = (c: readonly [number, number, number]) => doc.setDrawColor(c[0], c[1], c[2]);
  const font = (style: "normal" | "bold", size: number) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
  };
  const ensure = (h: number) => {
    if (y + h > 280) {
      doc.addPage();
      y = 18;
    }
  };
  const tag = (src: Provenance, x: number, yy: number) => {
    font("bold", 5.5);
    const label = PROV_LABEL[src];
    const w = doc.getTextWidth(label) + 3;
    const c = PROV_COLOR[src];
    stroke(c);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, yy - 2.6, w, 3.6, 1.2, 1.2, "S");
    color(c);
    doc.text(label, x + 1.5, yy - 0.1);
    return w;
  };
  const h2 = (t: string) => {
    ensure(16);
    y += 4;
    font("bold", 12);
    color(COLORS.ink);
    doc.text(t, M, y);
    y += 2.5;
    stroke(COLORS.line);
    doc.setLineWidth(0.3);
    doc.line(M, y, W - M, y);
    y += 5;
  };
  const para = (t: string, size = 8.5, c: readonly [number, number, number] = COLORS.ink2) => {
    font("normal", size);
    color(c);
    const lines = doc.splitTextToSize(t, CW) as string[];
    ensure(lines.length * size * 0.45 + 2);
    doc.text(lines, M, y);
    y += lines.length * size * 0.42 + 2;
  };

  // ---------- Header ----------
  fill(COLORS.emerald);
  doc.rect(0, 0, W, 34, "F");
  font("bold", 18);
  doc.setTextColor(246, 242, 233);
  doc.text("BrickIQ", M, 15);
  font("normal", 8.5);
  doc.text("Know before you buy", M, 21);
  font("bold", 10);
  doc.text(opts.full ? "Full Property Intelligence Report" : "Property Intelligence Summary", W - M, 15, { align: "right" });
  font("normal", 8);
  doc.text(new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }), W - M, 21, { align: "right" });
  y = 46;

  if (p.isDemo) {
    fill([236, 228, 245]);
    doc.roundedRect(M, y - 6, CW, 9, 2, 2, "F");
    font("bold", 8);
    color(COLORS.violet);
    doc.text("DEMONSTRATION REPORT - fictional property, all figures are synthetic demo data.", M + 3, y - 0.4);
    y += 9;
  }

  font("bold", 17);
  color(COLORS.ink);
  doc.text(`${p.address.value.street} ${p.address.value.houseNumber}`, M, y);
  y += 6;
  font("normal", 9.5);
  color(COLORS.muted);
  doc.text(`${p.address.value.postcode} ${p.address.value.city}  ·  ${PROPERTY_TYPE_LABEL[p.type.value]}  ·  ${p.livingArea.value} m2  ·  built ${p.buildYear.value}`, M, y);
  tag(p.address.source, W - M - 20, y - 5.5);
  y += 9;

  // ---------- KPI tiles ----------
  const tiles: [string, string, string, Provenance][] = [
    ["Estimated value", e(v.fairValue), `${e(v.low)} - ${e(v.high)}`, "model"],
    ["Deal Score", `${a.score.total}/100`, a.score.band, "model"],
    ["Asking price", e(p.askingPrice.value), `${pct(a.askingVsFair)} vs estimate`, p.askingPrice.source],
    ["Price per m2", e(a.askingPricePerSqm), `estimate ${e(v.blendedPricePerSqm)}`, "model"],
  ];
  const tw = (CW - 3 * 3) / 4;
  tiles.forEach(([k, val, sub, src], i) => {
    const x = M + i * (tw + 3);
    fill(COLORS.ivory);
    doc.roundedRect(x, y, tw, 24, 2.5, 2.5, "F");
    font("normal", 7);
    color(COLORS.muted);
    doc.text(k.toUpperCase(), x + 3, y + 5.5);
    font("bold", 12.5);
    color(i === 1 ? (a.score.total >= 65 ? COLORS.emerald2 : a.score.total >= 50 ? COLORS.gold : COLORS.rose) : COLORS.ink);
    doc.text(val, x + 3, y + 13);
    font("normal", 7);
    color(COLORS.ink2);
    doc.text(sub, x + 3, y + 18.5);
    tag(src, x + 3, y + 22.8);
  });
  y += 31;

  // range bar
  {
    const min = Math.min(v.low, p.askingPrice.value) * 0.97;
    const max = Math.max(v.high, p.askingPrice.value) * 1.03;
    const pos = (n: number) => M + ((n - min) / (max - min)) * CW;
    fill(COLORS.line);
    doc.roundedRect(M, y, CW, 3, 1.5, 1.5, "F");
    fill(COLORS.emerald2);
    doc.roundedRect(pos(v.low), y, pos(v.high) - pos(v.low), 3, 1.5, 1.5, "F");
    fill(COLORS.ink);
    doc.rect(pos(v.fairValue) - 0.4, y - 1.5, 0.8, 6, "F");
    fill(COLORS.gold);
    doc.triangle(pos(p.askingPrice.value) - 1.6, y - 3.2, pos(p.askingPrice.value) + 1.6, y - 3.2, pos(p.askingPrice.value), y - 0.4, "F");
    font("normal", 7);
    color(COLORS.muted);
    doc.text(`Range ${e(v.low)}`, M, y + 8);
    doc.text(`${e(v.high)}`, W - M, y + 8, { align: "right" });
    color(COLORS.gold);
    doc.text("Asking", pos(p.askingPrice.value), y - 4.5, { align: "center" });
    y += 14;
  }

  // ---------- Property facts ----------
  h2("Property facts");
  const facts: [string, string, Provenance][] = [
    ["Type", PROPERTY_TYPE_LABEL[p.type.value], p.type.source],
    ["Living area", `${p.livingArea.value} m2`, p.livingArea.source],
    ["Build year", String(p.buildYear.value), p.buildYear.source],
    ["Energy label", p.energyLabel.value, p.energyLabel.source],
    ["Condition", `${p.condition.value}/5 - ${CONDITION_LABEL[p.condition.value]}`, p.condition.source],
    ["Outdoor space", OUTDOOR_LABEL[p.outdoor.value], p.outdoor.source],
    ["Tenure", LEASEHOLD_LABEL[p.leasehold.value], p.leasehold.source],
    ["Recurring costs", `${e(a.monthlyOwnershipCosts)}/month (VvE, ground lease)`, p.vveMonthly?.source ?? p.leasehold.source],
  ];
  facts.forEach(([k, val, src]) => {
    ensure(6);
    font("normal", 8);
    color(COLORS.muted);
    doc.text(k, M, y);
    font("bold", 8.3);
    color(COLORS.ink);
    doc.text(val, M + 38, y);
    tag(src, W - M - 18, y);
    y += 5.4;
  });
  y += 2;

  // ---------- Valuation factors ----------
  h2("How the estimate is built");
  para(
    `Starting from a regional prior of ${e(p.marketReference.value)}/m2 (${p.marketReference.source === "user" ? "your assumption" : "model assumption"}), BrickIQ applies transparent multipliers, giving ${e(v.modelPricePerSqm)}/m2. This is blended ${Math.round(v.modelWeight * 100)}/${Math.round(v.compsWeight * 100)} with the adjusted comparable median of ${e(v.compsMedianPricePerSqm)}/m2 to reach ${e(v.blendedPricePerSqm)}/m2 x ${p.livingArea.value} m2 = ${e(v.fairValue)}. Confidence: ${v.confidence}/100.`,
  );
  y += 1;
  v.factors.forEach((f) => {
    ensure(6);
    font("normal", 8);
    color(COLORS.ink);
    doc.text(f.label, M, y);
    color(COLORS.muted);
    doc.text(f.detail, M + 42, y);
    const d = f.factor - 1;
    color(d > 0.001 ? COLORS.emerald2 : d < -0.001 ? COLORS.rose : COLORS.muted);
    font("bold", 8);
    doc.text(pct(d), W - M, y, { align: "right" });
    y += 5;
  });

  // ---------- Deal score ----------
  h2(`Deal Score ${a.score.total}/100 - ${a.score.band}`);
  a.score.components.forEach((c) => {
    ensure(12);
    font("bold", 8.2);
    color(COLORS.ink);
    doc.text(`${c.label} (${Math.round(c.weight * 100)}%)`, M, y);
    doc.text(String(c.score), W - M, y, { align: "right" });
    fill(COLORS.line);
    doc.roundedRect(M, y + 1.6, CW, 1.6, 0.8, 0.8, "F");
    fill(c.score >= 70 ? COLORS.emerald2 : c.score >= 45 ? COLORS.gold : COLORS.rose);
    doc.roundedRect(M, y + 1.6, Math.max(1.5, (CW * c.score) / 100), 1.6, 0.8, 0.8, "F");
    font("normal", 7);
    color(COLORS.muted);
    const lines = doc.splitTextToSize(c.explanation, CW) as string[];
    doc.text(lines, M, y + 6.5);
    y += 8 + lines.length * 3;
  });

  // ---------- Strengths & risks ----------
  h2("Strengths & risks");
  a.insights.forEach((i) => {
    ensure(10);
    fill(i.kind === "strength" ? COLORS.emerald2 : i.severity === "high" ? COLORS.rose : COLORS.gold);
    doc.circle(M + 1.2, y - 1, 1.1, "F");
    font("bold", 8.3);
    color(COLORS.ink);
    doc.text(`${i.title}${i.severity ? ` (${i.severity})` : ""}`, M + 4.5, y);
    font("normal", 7.5);
    color(COLORS.ink2);
    const lines = doc.splitTextToSize(i.detail, CW - 5) as string[];
    doc.text(lines, M + 4.5, y + 3.8);
    y += 5 + lines.length * 3.3;
  });

  if (opts.full) {
    // ---------- Comparables ----------
    h2("Comparable sales (synthetic demonstration data)");
    para("These comparables are generated for demonstration only and are not real transactions.", 7.5, COLORS.violet);
    const cols = [
      ["Comparable", 0],
      ["Area", 40],
      ["Year", 56],
      ["Label", 70],
      ["Price", 86],
      ["EUR/m2", 116],
      ["Adj. EUR/m2", 142],
      ["Months ago", CW],
    ] as const;
    ensure(8);
    font("bold", 7);
    color(COLORS.muted);
    cols.forEach(([t, x], idx) => doc.text(t, M + x, y, idx === cols.length - 1 ? { align: "right" } : undefined));
    y += 2;
    stroke(COLORS.line);
    doc.line(M, y, W - M, y);
    y += 4.5;
    a.comparables.forEach((c) => {
      ensure(6);
      font("normal", 7.8);
      color(COLORS.ink);
      doc.text(c.label, M, y);
      doc.text(`${c.livingArea} m2`, M + 40, y);
      doc.text(String(c.buildYear), M + 56, y);
      doc.text(c.energyLabel, M + 70, y);
      doc.text(e(c.price), M + 86, y);
      doc.text(e(c.pricePerSqm), M + 116, y);
      font("bold", 7.8);
      color(COLORS.emerald2);
      doc.text(e(c.adjustedPricePerSqm), M + 142, y);
      font("normal", 7.8);
      color(COLORS.ink);
      doc.text(String(c.monthsAgo), W - M, y, { align: "right" });
      y += 5.2;
    });

    // ---------- Bidding scenario ----------
    const o = bid.outcome;
    const b = bid.inputs;
    h2("Your bidding scenario");
    const rows: [string, string][] = [
      ["Asking price (scenario)", e(b.askingPrice)],
      ["Intended offer", `${e(b.offer)}  (${pct(o.offerVsAsking)} vs asking, ${pct(o.offerVsFair)} vs estimate)`],
      ["Condition / market assumption", `${b.condition}/5  ·  ${pct(b.marketAdjustment)}`],
      ["Transfer tax", e(o.transferTax)],
      ["Other buyer costs (assumptions)", e(o.totalBuyerCosts - o.transferTax)],
      ["Valuation gap (offer above estimate)", e(o.valuationGap)],
      ["Total own funds needed", e(o.cashRequired)],
      ["Your stated own funds", `${e(b.ownFunds)}${o.fundingShortfall > 0 ? `  -  shortfall ${e(o.fundingShortfall)}` : ""}`],
      ["Modelled mortgage / gross monthly", `${e(o.mortgageAmount)}  /  ${e(o.monthlyGross)} at ${(b.interestRate * 100).toFixed(1)}%, 30 yrs`],
    ];
    rows.forEach(([k, val]) => {
      ensure(6);
      font("normal", 8);
      color(COLORS.muted);
      doc.text(k, M, y);
      font("bold", 8);
      color(COLORS.ink);
      doc.text(val, M + 64, y);
      y += 5.2;
    });
    y += 2;
    o.risks.forEach((r) => {
      ensure(9);
      font("bold", 8);
      color(r.level === "low" ? COLORS.emerald2 : r.level === "moderate" ? COLORS.gold : COLORS.rose);
      doc.text(`${r.level.toUpperCase()}`, M, y);
      color(COLORS.ink);
      doc.text(`${r.label}: ${r.value}`, M + 22, y);
      font("normal", 7.3);
      color(COLORS.ink2);
      const lines = doc.splitTextToSize(r.explanation, CW - 22) as string[];
      doc.text(lines, M + 22, y + 3.6);
      y += 5 + lines.length * 3.2;
    });
    para("BrickIQ does not estimate the probability that a seller accepts an offer.", 7.5, COLORS.muted);

    // ---------- Checklist ----------
    h2("Due-diligence checklist");
    const checklist = [
      "Commission a building survey (bouwkundige keuring), including foundations for pre-war homes.",
      "Verify the registered energy label on EP-Online.",
      "Check the land register extract and any easements via Kadaster.",
      p.leasehold.value === "ongoing" ? "Request erfpacht terms: canon, revision date and term end." : "Confirm the property is freehold in the deed.",
      p.type.value === "apartment" ? "Request VvE documents: maintenance plan (MJOP), reserve fund, minutes." : "Check municipal zoning plan (omgevingsplan) for nearby developments.",
      "Obtain a certified valuation (taxatierapport) before finalising financing.",
      "Discuss financing and bid strategy with an independent mortgage adviser and aankoopmakelaar.",
    ];
    checklist.forEach((c) => {
      ensure(7);
      stroke(COLORS.muted);
      doc.setLineWidth(0.3);
      doc.rect(M, y - 2.8, 3, 3);
      font("normal", 8);
      color(COLORS.ink2);
      const lines = doc.splitTextToSize(c, CW - 6) as string[];
      doc.text(lines, M + 5, y);
      y += lines.length * 3.6 + 1.6;
    });
  } else {
    h2("Unlock the full report");
    para("The full report adds the comparables appendix, your bidding scenario and stress test, risk indicators and a due-diligence checklist.");
  }

  // ---------- Sources ----------
  h2("Data sources & provenance");
  para(
    [
      p.bag ? `BAG record: ${p.bag.retrievedFrom}${p.bag.verblijfsobjectId ? ` (verblijfsobject ${p.bag.verblijfsobjectId})` : ""}.` : "",
      !p.isDemo && p.address.source === "verified" ? "Address & location: PDOK Locatieserver (Kadaster, CC0)." : "",
      `Comparables: ${a.comparablesProvider} - not real transactions.`,
      "Estimate, range and Deal Score: BrickIQ model (indicative).",
      p.referenceUrl ? `Reference link provided by user (not accessed): ${p.referenceUrl}` : "",
    ]
      .filter(Boolean)
      .join(" "),
    7.5,
  );
  para(
    "Disclaimer: BrickIQ provides indicative, model-based estimates for information only. They are not certified valuations (taxatierapport), not financial, legal or tax advice, and not predictions of whether an offer will be accepted.",
    7,
    COLORS.muted,
  );

  // ---------- Footers ----------
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    font("normal", 6.5);
    color(COLORS.muted);
    doc.text(`BrickIQ · ${p.address.value.display}`, M, 290);
    doc.text(`Page ${i} of ${pages}`, W - M, 290, { align: "right" });
  }

  const slug = p.address.value.display.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  doc.save(`brickiq-${opts.full ? "full-report" : "summary"}-${slug}.pdf`);
}
