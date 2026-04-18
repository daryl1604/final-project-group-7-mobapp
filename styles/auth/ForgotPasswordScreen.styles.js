import { StyleSheet } from "react-native";

export const forgotPasswordScreenStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020617",
  },
  keyboardView: {
    flex: 1,
  },
  safeArea: {
    backgroundColor: "transparent",
  },
  content: {
    flexGrow: 1,
    justifyContent: "flex-start",
    minHeight: "100%",
    paddingTop: 36,
    paddingBottom: 52,
    paddingHorizontal: 18,
    gap: 18,
  },
  hero: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  logo: {
    width: 112,
    height: 112,
  },
  title: {
    fontSize: 29,
    fontWeight: "800",
    color: "#f8fafc",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(226, 232, 240, 0.96)",
    textAlign: "center",
    maxWidth: 280,
  },
  card: {
    backgroundColor: "rgba(15, 23, 42, 0.68)",
    borderRadius: 32,
    padding: 24,
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#020617",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.32,
    shadowRadius: 32,
    elevation: 12,
  },
  message: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    lineHeight: 19,
    borderWidth: 1,
    fontWeight: "600",
  },
  messageSuccess: {
    color: "#d1fae5",
    backgroundColor: "rgba(6, 78, 59, 0.24)",
    borderColor: "rgba(52, 211, 153, 0.28)",
  },
  messageError: {
    color: "#fee2e2",
    backgroundColor: "rgba(127, 29, 29, 0.24)",
    borderColor: "rgba(248, 113, 113, 0.32)",
  },
  link: {
    color: "#bfdbfe",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  secondaryAction: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    marginTop: 0,
  },
  secondaryLink: {
    color: "rgba(226, 232, 240, 0.76)",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.12,
  },
});
