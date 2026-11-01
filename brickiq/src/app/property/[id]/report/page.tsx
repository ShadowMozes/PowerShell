import type { Metadata } from "next";
import { resolveProperty } from "@/lib/property-codec";
import { Checkout } from "@/components/Checkout";
import { PropertyNotFound } from "@/components/PropertyNotFound";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ d?: string }> };

export const metadata: Metadata = { title: "Full report" };

export default async function ReportCheckoutPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { d } = await searchParams;
  const property = resolveProperty(id, d);
  if (!property) return <PropertyNotFound />;
  return <Checkout property={property} />;
}
