import { redirect } from "next/navigation";

export default async function AiWorkflowPage({
  searchParams
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const nextTarget = resolvedSearchParams.projectId
    ? `/plan-validate?projectId=${resolvedSearchParams.projectId}`
    : "/plan-validate";

  redirect(nextTarget);
}
