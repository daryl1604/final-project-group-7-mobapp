import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import AppHeader from "../../components/common/AppHeader";
import ScreenContainer from "../../components/common/ScreenContainer";
import { useApp } from "../../storage/AppProvider";

const ADMIN_HELP_SECTIONS = [
  {
    icon: "shield-outline",
    title: "Admin Dashboard Guide",
    intro:
      "Your dashboard is the quickest place to monitor report activity, check resident engagement, and jump to management tools without opening multiple tabs.",
    points: [
      "Use the status cards to review the current volume of pending, ongoing, resolved, and rejected reports.",
      "Open quick actions when you need to manage residents, review reports, or send announcements faster.",
      "Check recent activity to see feedback, status changes, and other report actions that may need follow-up.",
    ],
  },
  {
    icon: "document-text-outline",
    title: "Reports And Case Handling",
    intro:
      "The reports area helps you inspect each incident in detail and keep the status flow consistent for residents.",
    points: [
      "Open All Reports or Manage Reports to inspect incident type, location, photos, and resident-submitted details.",
      "Update statuses carefully so residents receive accurate progress updates through their notifications and report history.",
      "Review feedback threads before resolving a case to make sure the response is complete and documented.",
    ],
  },
  {
    icon: "people-outline",
    title: "Resident Account Management",
    intro:
      "The Manage section in the drawer is where you maintain resident access and account records.",
    points: [
      "Add residents only after confirming their information, purok, and contact details are correct.",
      "Use the resident list to review account entries and keep records organized for barangay operations.",
      "Delete or remove accounts only when necessary and only after reading the confirmation prompt carefully.",
    ],
  },
  {
    icon: "bar-chart-outline",
    title: "Analytics And Monitoring",
    intro:
      "Analytics gives you a clearer picture of reporting trends and recurring community concerns.",
    points: [
      "Use weekly, monthly, and yearly views to identify which incident types appear most often.",
      "Compare trends across time to spot spikes in complaints that may require a faster barangay response.",
      "Review purok-related patterns to help prioritize field checks, announcements, or follow-up actions.",
    ],
  },
  {
    icon: "notifications-outline",
    title: "Notifications And Updates",
    intro:
      "Admin alerts are important because they highlight account activity and report changes that may require immediate action.",
    points: [
      "Check alerts for newly submitted reports, feedback replies, resident updates, and account-related events.",
      "Use notifications together with the dashboard activity cards to avoid missing urgent incidents.",
      "If something looks unfamiliar, open the related report details first before changing its status.",
    ],
  },
  {
    icon: "settings-outline",
    title: "Settings And Best Practices",
    intro:
      "A few simple habits can keep your admin experience smoother and more reliable.",
    points: [
      "Use Settings to switch between light and dark mode based on your viewing preference.",
      "Keep notifications enabled so report updates and account activity are easier to track.",
      "Review profile and app settings regularly so your workflow stays consistent across sessions.",
    ],
  },
];

const RESIDENT_HELP_SECTIONS = [
  {
    icon: "add-circle-outline",
    title: "How To Submit A Good Report",
    intro:
      "A complete report helps barangay staff understand the issue faster and respond more accurately.",
    points: [
      "Choose the incident type that best matches the issue before writing your description.",
      "Explain what happened clearly, include the exact area or purok, and mention details that responders should know.",
      "Add photos when possible and capture the report location so the issue can be verified more easily.",
    ],
  },
  {
    icon: "document-text-outline",
    title: "Track Your Report Status",
    intro:
      "My Reports is your main place for reviewing submitted incidents and checking updates from the barangay.",
    points: [
      "Use the search and filter tools to find older reports quickly.",
      "Tap a report card to open details, review replies, and monitor progress from pending to resolved.",
      "Use the dashboard status cards if you want to jump directly to reports under a specific status.",
    ],
  },
  {
    icon: "grid-outline",
    title: "Use The Dashboard",
    intro:
      "The resident dashboard gives you a quick overview of your reporting activity and shortcuts to important actions.",
    points: [
      "Check the large summary cards to see your total submitted reports and resolved issues.",
      "Tap the status cards to open My Reports with the matching filter already applied.",
      "Use quick actions when you want to create a new report or open your report history immediately.",
    ],
  },
  {
    icon: "chatbubble-ellipses-outline",
    title: "Read Feedback And Alerts",
    intro:
      "Notifications keep you informed when your report receives updates from barangay staff.",
    points: [
      "Open Alerts to read replies, feedback, and status changes connected to your reports.",
      "If a report was updated or resolved, open the report details to read the latest notes carefully.",
      "Use notifications together with My Reports so you can follow the full history of each issue.",
    ],
  },
  {
    icon: "person-outline",
    title: "Profile And Account",
    intro:
      "Your profile screen lets you keep your resident information updated on this device.",
    points: [
      "Update personal details when needed so your account information stays accurate.",
      "Review your profile before submitting important reports if your contact or purok details changed.",
      "Use account actions carefully, especially if you are managing your only signed-in resident account.",
    ],
  },
  {
    icon: "settings-outline",
    title: "Settings And App Use",
    intro:
      "These settings help make the app easier to use every day.",
    points: [
      "Switch between theme modes depending on your preferred viewing style.",
      "Keep notifications enabled so you can receive report activity and barangay updates on time.",
      "If a screen looks different after an update, re-open it from the dashboard or tabs to refresh the view.",
    ],
  },
];

function HelpSectionCard({ item, theme, styles }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionGlowTop} />
      <View style={styles.sectionGlowBottom} />
      <View style={styles.sectionAccentBar} />
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>
          <Ionicons name={item.icon} size={20} color={theme.primary} />
        </View>
        <View style={styles.sectionHeaderCopy}>
          <Text style={styles.sectionTitle}>{item.title}</Text>
          <Text style={styles.sectionIntro}>{item.intro}</Text>
        </View>
      </View>

      <View style={styles.pointList}>
        {item.points.map((point) => (
          <View key={point} style={styles.pointRow}>
            <View style={styles.pointDot} />
            <Text style={styles.pointText}>{point}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function HelpScreen() {
  const { currentUser, theme } = useApp();
  const styles = createStyles(theme);
  const isAdmin = currentUser?.role === "admin";
  const sections = isAdmin ? ADMIN_HELP_SECTIONS : RESIDENT_HELP_SECTIONS;

  return (
    <ScreenContainer contentStyle={styles.screenContent}>
      <AppHeader title="Help" variant="toolbar" />

      <View style={styles.heroCard}>
        <View style={styles.heroGlowPrimary} />
        <View style={styles.heroGlowSecondary} />
        <View style={styles.heroBadge}>
          <Ionicons name={isAdmin ? "shield-checkmark-outline" : "compass-outline"} size={16} color={theme.primary} />
          <Text style={styles.heroBadgeText}>{isAdmin ? "Admin Support Guide" : "Resident Support Guide"}</Text>
        </View>
        <Text style={styles.heroTitle}>{isAdmin ? "Manage the system with confidence" : "Use the app with confidence"}</Text>
        <Text style={styles.heroText}>
          {isAdmin
            ? "This guide explains the main admin tools, report handling flow, analytics, notifications, and account management features available in BrgyWatch."
            : "This guide explains how to submit reports well, track updates, use the dashboard, and manage your resident account and app settings."}
        </Text>
      </View>

      <View style={styles.tipCard}>
        <View style={styles.tipAccentLine} />
        <View style={styles.tipHeader}>
          <Ionicons name="bulb-outline" size={18} color={theme.primary} />
          <Text style={styles.tipTitle}>Quick Tip</Text>
        </View>
        <Text style={styles.tipText}>
          {isAdmin
            ? "If you are unsure what to do first, begin with the dashboard, check notifications, then open the related report before making changes."
            : "If you want the fastest path to an update, start from the dashboard or alerts, then open the related report details for the full context."}
        </Text>
      </View>

      {sections.map((item) => (
        <HelpSectionCard key={item.title} item={item} theme={theme} styles={styles} />
      ))}
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
      gap: 12,
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
      width: 140,
      height: 140,
      borderRadius: 999,
      top: -50,
      right: -35,
      backgroundColor: theme.primarySoft,
      opacity: theme.mode === "dark" ? 0.55 : 0.8,
    },
    heroGlowSecondary: {
      position: "absolute",
      width: 100,
      height: 100,
      borderRadius: 999,
      bottom: -28,
      left: -18,
      backgroundColor: theme.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.7)",
    },
    heroBadge: {
      alignSelf: "flex-start",
      minHeight: 32,
      borderRadius: 999,
      paddingHorizontal: 12,
      backgroundColor: theme.primarySoft,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    heroBadgeText: {
      color: theme.primary,
      fontSize: 12,
      fontWeight: "800",
    },
    heroTitle: {
      color: theme.text,
      fontSize: 24,
      fontWeight: "900",
      lineHeight: 30,
    },
    heroText: {
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 22,
    },
    tipCard: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      gap: 8,
      overflow: "hidden",
      position: "relative",
    },
    tipAccentLine: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 5,
      backgroundColor: theme.primary,
    },
    tipHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    tipTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "800",
    },
    tipText: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 20,
    },
    sectionCard: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      gap: 16,
      overflow: "hidden",
      position: "relative",
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 4,
    },
    sectionGlowTop: {
      position: "absolute",
      width: 112,
      height: 112,
      borderRadius: 999,
      top: -38,
      right: -30,
      backgroundColor: theme.primarySoft,
      opacity: theme.mode === "dark" ? 0.35 : 0.7,
    },
    sectionGlowBottom: {
      position: "absolute",
      width: 78,
      height: 78,
      borderRadius: 999,
      left: -18,
      bottom: -24,
      backgroundColor: theme.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(79, 131, 255, 0.08)",
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
    sectionHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    sectionIconWrap: {
      width: 46,
      height: 46,
      borderRadius: 16,
      backgroundColor: theme.surfaceSoft,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.border,
      flexShrink: 0,
    },
    sectionHeaderCopy: {
      flex: 1,
      gap: 6,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "800",
    },
    sectionIntro: {
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 21,
    },
    pointList: {
      gap: 12,
    },
    pointRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    pointDot: {
      width: 8,
      height: 8,
      borderRadius: 999,
      backgroundColor: theme.primary,
      marginTop: 7,
      flexShrink: 0,
    },
    pointText: {
      flex: 1,
      color: theme.text,
      fontSize: 14,
      lineHeight: 21,
    },
  });
}
