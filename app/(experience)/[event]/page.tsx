import { events } from "@/data/memories";

export const dynamicParams = false;

export function generateStaticParams() {
  return events.map(event => ({ event: event.id }));
}

export default function EventPage() {
  return null;
}
