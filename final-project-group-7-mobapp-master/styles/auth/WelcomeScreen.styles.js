import { StyleSheet } from "react-native";

export const welcomeScreenStyles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  atmosphereOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: 28,
    paddingBottom: 42,
    paddingHorizontal: 22,
  },
  hero: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 0,
    paddingBottom: 0,
  },
  logo: {
    width: 300,
    height: 300,
  },
  pressable: {
    width: "100%",
  },
  buttonStack: {
    gap: 16,
    paddingHorizontal: 10,
  },
  primaryButton: {
    minHeight: 60,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#1d4ed8",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 7,
  },
  primaryButtonGradient: {
    minHeight: 60,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    shadowColor: "#020617",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  secondaryButtonText: {
    color: "rgba(248, 250, 252, 0.96)",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.18,
  },
});
