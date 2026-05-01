import { StyleSheet } from "react-native";

export const manageAccountsStyles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#dbe7f8",
  },
  name: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "800",
  },
  meta: {
    color: "#64748b",
    fontSize: 14,
  },
  deleteButton: {
    marginTop: 8,
    backgroundColor: "#fee2e2",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  deleteText: {
    color: "#b91c1c",
    fontSize: 14,
    fontWeight: "700",
  },
});
