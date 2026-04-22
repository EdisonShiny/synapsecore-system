import { AiWorkflowPageClient } from "@/components/app-pages/ai-workflow-page";

export default function AiWorkflowPage({
  searchParams
}: {
  searchParams?: { projectId?: string };
}) {
  return <AiWorkflowPageClient initialProjectId={searchParams?.projectId ?? ""} />;
}
