import { use } from "react";
import { redirect } from "next/navigation";

export default function DashboardMessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  redirect(`/messages/${id}`);
}