import { ProjectDetailPage as ProjectDetailPageView } from "@/components/system/project-detail-page";

export default async function ProjectDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ProjectDetailPageView projectId={id} />;
}
