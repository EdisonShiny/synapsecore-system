import { ProjectDetailPageClient } from "@/components/app-pages/project-detail-page";

export default function ProjectDetailPage({
  params
}: {
  params: { id: string };
}) {
  return <ProjectDetailPageClient projectId={params.id} />;
}
