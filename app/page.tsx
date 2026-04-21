import { AppShell, DetailDrawer } from "@/components";
import {
  AiPlanTemplate,
  ApprovalsTemplate,
  CreateProjectTemplate,
  DashboardTemplate,
  ProjectDetailTemplate,
  ProjectListTemplate,
  ReportsTemplate,
  SettingsTemplate,
  ValidationCenterTemplate
} from "@/features/page-templates";

export default function Home() {
  return (
    <AppShell
      pageTitle="Dashboard"
      role="HQ"
      activeItem="Dashboard"
      drawer={
        <DetailDrawer open title="project detail">
          <div className="grid gap-4 text-body text-synapse-muted">
            <p>Selected project details, validation notes, approval state, and latest execution_update can live here.</p>
          </div>
        </DetailDrawer>
      }
    >
      <DashboardTemplate />
      <ProjectListTemplate />
      <CreateProjectTemplate />
      <ProjectDetailTemplate />
      <AiPlanTemplate />
      <ValidationCenterTemplate />
      <ApprovalsTemplate />
      <ReportsTemplate />
      <SettingsTemplate />
    </AppShell>
  );
}
