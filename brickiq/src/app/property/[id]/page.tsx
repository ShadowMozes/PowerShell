import type { Metadata } from "next";
import { resolveProperty } from "@/lib/property-codec";
import { DEMO_PROPERTIES } from "@/lib/demo";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { PropertyNotFound } from "@/components/PropertyNotFound";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ d?: string }> };

export function generateStaticParams() {
  return DEMO_PROPERTIES.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { id } = await params;
  const { d } = await searchParams;
  const p = resolveProperty(id, d);
  return { title: p ? p.address.value.display : "Report not found" };
}

export default async function PropertyPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { d } = await searchParams;
  const property = resolveProperty(id, d);
  if (!property) return <PropertyNotFound />;
  return <Dashboard property={property} />;
}
