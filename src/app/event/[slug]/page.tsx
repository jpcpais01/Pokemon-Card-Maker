import { notFound } from "next/navigation";
import EventHub from "@/components/EventHub";
import { EVENTS, getEvent } from "@/lib/events";

export function generateStaticParams() {
  return EVENTS.map((e) => ({ slug: e.slug }));
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();
  return <EventHub slug={event.slug} />;
}
