import { redirect } from "next/navigation";

export default function ProjectDetailPage({
  params
}: {
  params: { id: string };
}) {
  redirect(`/application?projectId=${params.id}`);
}
