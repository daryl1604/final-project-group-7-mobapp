import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, View } from "react-native";
import AppHeader from "../../components/common/AppHeader";
import ScreenContainer from "../../components/common/ScreenContainer";
import { useApp } from "../../storage/AppProvider";

const logoSource = require("../../assets/images/brgywatch-logo.png");

const FEATURE_ITEMS = [
  {
    icon: "document-text-outline",
    title: "Incident Reporting",
    text: "Residents can submit community issues with descriptions, photos, purok details, and captured location information.",
  },
  {
    icon: "notifications-outline",
    title: "Status And Feedback Updates",
    text: "Both residents and admins can follow activity through notifications, report timelines, and detailed report views.",
  },
  {
    icon: "people-outline",
    title: "Resident Account Management",
    text: "Admins can organize resident access, keep records updated, and manage account visibility inside the system.",
  },
  {
    icon: "bar-chart-outline",
    title: "Analytics And Monitoring",
    text: "Admins can review report patterns and activity trends to support faster barangay-level decision making.",
  },
];

const ROLE_USE_CASES = [
  {
    icon: "person-outline",
    title: "For Residents",
    text: "BrgyWatch gives residents a clearer way to report local issues, monitor progress, and stay informed about barangay action.",
  },
  {
    icon: "shield-checkmark-outline",
    title: "For Administrators",
    text: "BrgyWatch helps barangay staff review incidents, coordinate responses, manage residents, and maintain reporting transparency.",
  },
];

export default function AboutScreen() {
  const { theme, currentUser } = useApp();
  const styles = createStyles(theme);
  const isAdmin = currentUser?.role === "admin";

  return (
    <ScreenContainer contentStyle={styles.screenContent}>
      <AppHeader title="About" variant="toolbar" />

      <View style={styles.heroCard}>
        <View style={styles.heroGlowPrimary} />
        <View style={styles.heroGlowSecondary} />
        <View style={styles.heroTopRow}>
          <View style={styles.logoWrap}>
            <Image source={logoSource} style={styles.logo} resizeMode="contain" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>BrgyWatch</Text>
            <Text style={styles.heroSubtitle}>Barangay Incident Reporting System</Text>
            <View style={styles.metaBadge}>
              <Ionicons name="layers-outline" size={14} color={theme.primary} />
              <Text style={styles.metaBadgeText}>Version 1.0.0</Text>
            </View>
          </View>
        </View>
        <Text style={styles.heroText}>
          BrgyWatch is a mobile application built to improve communication between residents and barangay officials through
          organized incident reporting, clearer updates, and better visibility into local community concerns.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionAccentBar} />
        <Text style={styles.sectionTitle}>What The App Does</Text>
        <Text style={styles.bodyText}>
          The system supports the full reporting flow, from submission and review to follow-up, notifications, and status
          monitoring. It is designed to reduce confusion, help reports reach the right people faster, and give both
          residents and admins a more structured way to handle barangay issues.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionAccentBar} />
        <Text style={styles.sectionTitle}>Core Features</Text>
        <View style={styles.featureList}>
          {FEATURE_ITEMS.map((item) => (
            <View key={item.title} style={styles.featureRow}>
              <View style={styles.featureIconWrap}>
                <Ionicons name={item.icon} size={18} color={theme.primary} />
              </View>
              <View style={styles.featureCopy}>
                <Text style={styles.featureTitle}>{item.title}</Text>
                <Text style={styles.featureText}>{item.text}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionAccentBar} />
        <Text style={styles.sectionTitle}>Who It Helps</Text>
        <View style={styles.roleList}>
          {ROLE_USE_CASES.map((item) => (
            <View key={item.title} style={styles.roleCard}>
              <View style={styles.roleIconWrap}>
                <Ionicons name={item.icon} size={18} color={theme.primary} />
              </View>
              <Text style={styles.roleTitle}>{item.title}</Text>
              <Text style={styles.roleText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionAccentBar} />
        <Text style={styles.sectionTitle}>System Information</Text>
        <View style={styles.infoList}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Application</Text>
            <Text style={styles.infoValue}>BrgyWatch</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform</Text>
            <Text style={styles.infoValue}>Mobile Application</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Primary User View</Text>
            <Text style={styles.infoValue}>{isAdmin ? "Administrator" : "Resident"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footerCard}>
        <View style={styles.footerAccentRing} />
        <Text style={styles.footerTitle}>Purpose</Text>
        <Text style={styles.footerText}>
          BrgyWatch aims to support safer, more responsive, and more transparent barangay operations through digital
          reporting and easier community coordination.
        </Text>
      </View>
    </ScreenContainer>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    screenContent: {
      gap: 16,
      paddingBottom: 36,
    },
    heroCard: {
      backgroundColor: theme.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20,
      gap: 16,
      overflow: "hidden",
      position: "relative",
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 4,
    },
    heroGlowPrimary: {
      position: "absolute",
      width: 150,
      height: 150,
      borderRadius: 999,
      top: -52,
      right: -38,
      backgroundColor: theme.primarySoft,
      opacity: theme.mode === "dark" ? 0.5 : 0.85,
    },
    heroGlowSecondary: {
      position: "absolute",
      width: 96,
      height: 96,
      borderRadius: 999,
      bottom: -24,
      left: -18,
      backgroundColor: theme.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.65)",
    },
    heroTopRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    logoWrap: {
      width: 78,
      height: 78,
      borderRadius: 22,
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
    heroCopy: {
      flex: 1,
      gap: 6,
    },
    heroTitle: {
      color: theme.text,
      fontSize: 26,
      fontWeight: "900",
    },
    heroSubtitle: {
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    metaBadge: {
      alignSelf: "flex-start",
      minHeight: 30,
      borderRadius: 999,
      paddingHorizontal: 12,
      backgroundColor: theme.primarySoft,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    metaBadgeText: {
      color: theme.primary,
      fontSize: 12,
      fontWeight: "800",
    },
    heroText: {
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 22,
    },
    sectionCard: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      gap: 14,
      overflow: "hidden",
      position: "relative",
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 4,
    },
    sectionAccentBar: {
      position: "absolute",
      top: 0,
      left: 18,
      right: 18,
      height: 4,
      borderRadius: 999,
      backgroundColor: theme.primary,
      opacity: 0.9,
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
      gap: 14,
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    featureIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 14,
      backgroundColor: theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    featureCopy: {
      flex: 1,
      gap: 4,
    },
    featureTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "800",
    },
    featureText: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 20,
    },
    roleList: {
      gap: 12,
    },
    roleCard: {
      backgroundColor: theme.surfaceSoft,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      gap: 8,
      overflow: "hidden",
      position: "relative",
    },
    roleIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: theme.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    roleTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "800",
    },
    roleText: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 20,
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
      fontSize: 12,
      fontWeight: "800",
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
    footerCard: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      gap: 8,
      alignItems: "center",
      overflow: "hidden",
      position: "relative",
    },
    footerAccentRing: {
      position: "absolute",
      width: 150,
      height: 150,
      borderRadius: 999,
      borderWidth: 22,
      borderColor: theme.primarySoft,
      right: -72,
      top: -72,
      opacity: theme.mode === "dark" ? 0.28 : 0.65,
    },
    footerTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "800",
    },
    footerText: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 20,
      textAlign: "center",
    },
  });
}
