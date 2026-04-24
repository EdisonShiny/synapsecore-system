import { WorkflowDetailPage } from "@/components/system/workflow-detail-page";

export default function WorkflowDetailRoute({
  params
}: {
  params: { id: string };
}) {
  return <WorkflowDetailPage workflowId={params.id} />;
}
