import { StyleSheet } from "react-native";

export const adminDashboardStyles = StyleSheet.create({
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryCard: {
    flexBasis: "47%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#dbe7f8",
    gap: 6,
  },
  summaryLabel: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "600",
  },
  summaryValue: {
    color: "#0f172a",
    fontSize: 28,
    fontWeight: "800",
  },
  panel: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#dbe7f8",
    gap: 12,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  panelTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "800",
  },
  link: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "700",
  },
});
