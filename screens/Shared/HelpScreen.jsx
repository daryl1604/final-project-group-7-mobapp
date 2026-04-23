import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import AppHeader from "../../components/common/AppHeader";
import ScreenContainer from "../../components/common/ScreenContainer";
import { useApp } from "../../storage/AppProvider";

const ADMIN_HELP_BLOCKS = [
  {
    icon: "document-text-outline",
    title: "Review all reports",
    text: "Open All Reports from the admin tabs or dashboard activity shortcuts to inspect submitted incidents, open report details, and monitor status updates across the barangay.",
  },
  {
    icon: "people-outline",
    title: "Manage residents",
    text: "Use the drawer Manage section to add resident accounts, open the resident registry, and remove accounts only after the built-in confirmation prompt appears.",
  },
  {
    icon: "notifications-outline",
    title: "Stay updated",
    text: "Admin notifications highlight new registrations, submitted reports, report activity, and resident replies so you can respond quickly to important local actions.",
  },
  {
    icon: "bar-chart-outline",
    title: "Use analytics",
    text: "Open Analytics to view weekly, monthly, and yearly report summaries, then use those trends to spot active puroks and incident patterns.",
  },
  {
    icon: "shield-checkmark-outline",
    title: "Use dashboard shortcuts",
    text: "The admin dashboard includes quick actions for adding residents, opening reports, checking unread notifications, and reviewing the latest activity at a glance.",
  },
  {
    icon: "settings-outline",
    title: "Profile and settings",
    text: "Open the drawer to reach profile, switch themes, manage notification permission, and keep the app experience consistent.",
  },
];

const RESIDENT_HELP_BLOCKS = [
  {
    icon: "add-circle-outline",
    title: "Submit a report",
    text: "Use the Submit tab to create an incident report with the incident type, description, purok, photo, and captured location before sending it to the barangay.",
  },
  {
    icon: "document-text-outline",
    title: "Track your reports",
    text: "Open My Reports to review your submitted incidents, search your history, filter by status, and open report details whenever you need updates.",
  },
  {
    icon: "notifications-outline",
    title: "Check alerts and updates",
    text: "Resident alerts show important updates such as report activity, feedback, and account-related changes so you can keep track of barangay responses.",
  },
  {
    icon: "grid-outline",
    title: "Use the dashboard",
    text: "The resident dashboard shows your recent reports, current report counts, and a quick shortcut for submitting a new incident report.",
  },
  {
    icon: "create-outline",
    title: "Edit profile details",
    text: "Open your profile from the drawer to update your resident information, change your password, and keep your account details accurate.",
  },
  {
    icon: "settings-outline",
    title: "Manage app settings",
    text: "Use Settings to switch theme mode, manage notification preferences, and access account actions available for resident users on this device.",
  },
];

export default function HelpScreen() {
  const { currentUser, theme } = useApp();
  const styles = createStyles(theme);
  const helpBlocks = currentUser?.role === "admin" ? ADMIN_HELP_BLOCKS : RESIDENT_HELP_BLOCKS;

  return (
    <ScreenContainer>
      <AppHeader title="Help" variant="toolbar" />

      {helpBlocks.map((item) => (
        <View key={item.title} style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name={item.icon} size={22} color={theme.primary} />
          </View>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.text}>{item.text}</Text>
        </View>
      ))}
    </ScreenContainer>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      gap: 12,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 4,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 16,
      backgroundColor: theme.surfaceSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "800",
    },
    text: {
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 21,
    },
  });
}
