import { StyleSheet } from "react-native";

export const submitReportStyles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#dbe7f8",
    gap: 14,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#e8f0ff",
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#2563eb",
    fontWeight: "700",
    fontSize: 14,
  },
  locationText: {
    color: "#334155",
    fontSize: 14,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: "#0f766e",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
