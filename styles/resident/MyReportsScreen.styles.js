import { StyleSheet } from "react-native";

export const myReportsStyles = StyleSheet.create({
  filterCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#dbe7f8",
    gap: 14,
  },
  emptyState: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#dbe7f8",
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14,
  },
  resetButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  resetButtonText: {
    color: "#2563eb",
    fontWeight: "700",
    fontSize: 14,
  },
});
