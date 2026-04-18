import { StyleSheet } from "react-native";

export const manageReportsStyles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  quickCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#dbe7f8",
  },
  analyticsLinkCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#dbe7f8",
  },
  quickTitle: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "800",
  },
  quickText: {
    color: "#64748b",
    fontSize: 14,
    lineHeight: 20,
  },
});
