import { redirect } from "next/navigation";

// The listing pages were merged into the combined "Finds" feed at /finds.
// /found deep-links to the Found tab (detail pages remain at /found/[id]).
export default function FoundPage() {
  redirect("/finds?type=found");
}

