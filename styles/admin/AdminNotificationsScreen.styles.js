import { StyleSheet } from "react-native";

export const adminNotificationsStyles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#dbe7f8",
  },
  title: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "800",
  },
  message: {
    color: "#334155",
    fontSize: 14,
    lineHeight: 21,
  },
  meta: {
    color: "#94a3b8",
    fontSize: 12,
  },
  unread: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: "700",
  },
});
