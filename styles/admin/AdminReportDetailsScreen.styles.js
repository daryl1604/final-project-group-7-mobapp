import { StyleSheet } from "react-native";

export const adminReportDetailsStyles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: "#dbe7f8",
  },
  label: {
    color: "#2563eb",
    fontSize: 13,
    fontWeight: "700",
  },
  value: {
    color: "#334155",
    fontSize: 15,
    lineHeight: 22,
  },
  feedbackButton: {
    backgroundColor: "#2563eb",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  feedbackButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  actions: {
    gap: 10,
  },
  statusButton: {
    backgroundColor: "#0f766e",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  rejectButton: {
    backgroundColor: "#dc2626",
  },
  statusButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  deleteButton: {
    backgroundColor: "#fee2e2",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#b91c1c",
    fontSize: 15,
    fontWeight: "700",
  },
});
