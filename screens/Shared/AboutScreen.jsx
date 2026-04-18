import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, View } from "react-native";
import AppHeader from "../../components/common/AppHeader";
import ScreenContainer from "../../components/common/ScreenContainer";
import { useApp } from "../../storage/AppProvider";

const logoSource = require("../../assets/images/brgywatch-logo.png");

const FEATURE_ITEMS = [
  "Incident Reporting",
  "Real-time Monitoring",
  "Community Management",
  "Barangay Administration Tools",
];

export default function AboutScreen() {
  const { theme } = useApp();
  const styles = createStyles(theme);

  return (
    <ScreenContainer>
      <AppHeader title="About" variant="toolbar" />

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>About BrgyWatch</Text>
        <Text style={styles.heroSubtitle}>Barangay Incident Reporting System</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.brandRow}>
          <View style={styles.logoWrap}>
            <Image source={logoSource} style={styles.logo} resizeMode="contain" />
          </View>
          <View style={styles.brandText}>
            <Text style={styles.appName}>BrgyWatch</Text>
            <Text style={styles.appMeta}>Version: 1.0.0</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.bodyText}>
          BrgyWatch is a Barangay Incident Reporting System designed to help communities report, monitor, and manage local incidents efficiently. It provides barangay officials and residents with a streamlined way to improve communication, transparency, and public safety.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.featureList}>
          {FEATURE_ITEMS.map((item) => (
            <View key={item} style={styles.featureRow}>
              <View style={styles.featureIconWrap}>
                <Ionicons name="checkmark-circle-outline" size={18} color={theme.primary} />
              </View>
              <Text style={styles.featureText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>System Info</Text>
        <View style={styles.infoList}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Name</Text>
            <Text style={styles.infoValue}>BrgyWatch</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>System Type</Text>
            <Text style={styles.infoValue}>Mobile Application</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 BrgyWatch. All rights reserved.</Text>
      </View>
    </ScreenContainer>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    heroCard: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20,
      gap: 6,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 4,
    },
    heroTitle: {
      color: theme.text,
      fontSize: 24,
      fontWeight: "800",
    },
    heroSubtitle: {
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      gap: 14,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 4,
    },
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    logoWrap: {
      width: 72,
      height: 72,
      borderRadius: 20,
      backgroundColor: theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
      padding: 10,
    },
    logo: {
      width: "100%",
      height: "100%",
    },
    brandText: {
      flex: 1,
      gap: 4,
    },
    appName: {
      color: theme.text,
      fontSize: 22,
      fontWeight: "800",
    },
    appMeta: {
      color: theme.textMuted,
      fontSize: 14,
      fontWeight: "600",
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "800",
    },
    bodyText: {
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 22,
    },
    featureList: {
      gap: 12,
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    featureIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: theme.surfaceSoft,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    featureText: {
      flex: 1,
      color: theme.text,
      fontSize: 15,
      fontWeight: "600",
    },
    infoList: {
      gap: 12,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    infoLabel: {
      color: theme.textSoft,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    infoValue: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "700",
      textAlign: "right",
      flexShrink: 1,
    },
    footer: {
      paddingTop: 4,
      paddingBottom: 8,
      alignItems: "center",
    },
    footerText: {
      color: theme.textSoft,
      fontSize: 12,
      fontWeight: "600",
      textAlign: "center",
    },
  });
}
