import { WorkflowDetailPage } from "@/components/system/workflow-detail-page";

export default async function WorkflowDetailRoute({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <WorkflowDetailPage workflowId={id} />;
}
