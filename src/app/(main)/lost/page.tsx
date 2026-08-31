import { redirect } from "next/navigation";

// The listing pages were merged into the combined "Finds" feed at /finds.
// /lost deep-links to the Lost tab (detail pages remain at /lost/[id]).
export default function LostPage() {
  redirect("/explore?type=lost");
}

