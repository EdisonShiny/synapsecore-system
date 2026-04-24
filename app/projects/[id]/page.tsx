import { ProjectDetailPage as ProjectDetailPageView } from "@/components/system/project-detail-page";

export default function ProjectDetailPage({
  params
}: {
  params: { id: string };
}) {
  return <ProjectDetailPageView projectId={params.id} />;
}
