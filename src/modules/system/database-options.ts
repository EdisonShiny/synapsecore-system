import type { CompanyDatabase, DatabaseAttachmentOption } from "@/types/system";

export const databaseAttachmentOptions: DatabaseAttachmentOption[] = [
  {
    path: "company.generalInfo",
    label: "Company General Info",
    description: "Working field and company overview."
  },
  {
    path: "company.inventoryRecords.monthly",
    label: "Inventory Monthly",
    description: "Monthly inventory records."
  },
  {
    path: "company.inventoryRecords.yearly",
    label: "Inventory Yearly",
    description: "Yearly inventory records."
  },
  {
    path: "company.salesReports.monthly",
    label: "Sales Monthly",
    description: "Monthly sales and profit records."
  },
  {
    path: "company.salesReports.yearly",
    label: "Sales Yearly",
    description: "Yearly sales and profit records."
  },
  {
    path: "company.procurementRecords.monthly",
    label: "Procurement Monthly",
    description: "Monthly procurement records."
  },
  {
    path: "company.procurementRecords.yearly",
    label: "Procurement Yearly",
    description: "Yearly procurement records."
  }
];

export function getDatabaseSelectionSummary(company: CompanyDatabase, path: string) {
  switch (path) {
    case "company.generalInfo":
      return `${company.generalInfo.companyName}: ${company.generalInfo.workingField} ${company.generalInfo.overview}`.trim();
    case "company.inventoryRecords.monthly":
      return company.inventoryRecords.monthly
        .map((record) => `${record.period}: ${record.value} (${record.note})`)
        .join(" | ");
    case "company.inventoryRecords.yearly":
      return company.inventoryRecords.yearly
        .map((record) => `${record.period}: ${record.value} (${record.note})`)
        .join(" | ");
    case "company.salesReports.monthly":
      return company.salesReports.monthly
        .map((record) => `${record.period}: sales ${record.sales}, profit ${record.profit} (${record.note})`)
        .join(" | ");
    case "company.salesReports.yearly":
      return company.salesReports.yearly
        .map((record) => `${record.period}: sales ${record.sales}, profit ${record.profit} (${record.note})`)
        .join(" | ");
    case "company.procurementRecords.monthly":
      return company.procurementRecords.monthly
        .map((record) => `${record.period}: ${record.value} (${record.note})`)
        .join(" | ");
    case "company.procurementRecords.yearly":
      return company.procurementRecords.yearly
        .map((record) => `${record.period}: ${record.value} (${record.note})`)
        .join(" | ");
    default:
      return "";
  }
}
