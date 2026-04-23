import { redirect } from "next/navigation";

export default function AiWorkflowPage({
  searchParams
}: {
  searchParams?: { projectId?: string };
}) {
  const nextTarget = searchParams?.projectId ? `/plan-validate?projectId=${searchParams.projectId}` : "/plan-validate";
  redirect(nextTarget);
}
