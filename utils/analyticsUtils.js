import { PUROK_OPTIONS, REPORT_STATUSES } from "../constants/appConstants";
import { isWithinCurrentMonth, isWithinCurrentWeek, isWithinCurrentYear } from "./dateUtils";

export function buildAnalytics(reports = []) {
  const weekly = reports.filter((report) => isWithinCurrentWeek(report.createdAt));
  const monthly = reports.filter((report) => isWithinCurrentMonth(report.createdAt));
  const yearly = reports.filter((report) => isWithinCurrentYear(report.createdAt));

  const statusCounts = REPORT_STATUSES.map((status) => ({
    label: status,
    value: reports.filter((report) => report.status === status).length,
  }));

  const purokCounts = PUROK_OPTIONS.map((purok) => ({
    label: purok,
    value: reports.filter((report) => report.purok === purok).length,
  }));

  return {
    weeklyTotal: weekly.length,
    monthlyTotal: monthly.length,
    yearlyTotal: yearly.length,
    statusCounts,
    purokCounts,
  };
}
