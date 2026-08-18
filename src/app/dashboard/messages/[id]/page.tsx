import { redirect } from "next/navigation";

export default function DashboardMessageThreadPage({ params }: { params: { id: string } }) {
  redirect(`/messages/${params.id}`);
}