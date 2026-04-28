import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useApp } from "../../storage/AppProvider";
import { formatDate, formatTime } from "../../utils/dateUtils";

const INCIDENT_TYPE_GROUPS = [
  {
    options: [
      { value: "noise-complaint", aliases: ["Noise Complaint", "Public Disturbance"], icon: "volume-high-outline" },
      { value: "trash-garbage-issue", aliases: ["Trash / Garbage Issue", "Trash Complaint"], icon: "trash-outline" },
      { value: "flooding", aliases: ["Flooding"], icon: "water-outline" },
      { value: "road-damage", aliases: ["Road Damage"], icon: "construct-outline" },
      { value: "broken-streetlight", aliases: ["Broken Streetlight"], icon: "bulb-outline" },
      { value: "drainage-problem", aliases: ["Drainage Problem", "Drainage Concern"], icon: "git-network-outline" },
      { value: "illegal-parking", aliases: ["Illegal Parking"], icon: "car-outline" },
      { value: "vandalism", aliases: ["Vandalism"], icon: "color-wand-outline" },
      { value: "stray-animals", aliases: ["Stray Animals"], icon: "paw-outline" },
      { value: "other", aliases: ["Other", "Others", "Water Leak"], icon: "apps-outline" },
    ],
  },
];

function normalizeText(value = "") {
  return value.trim().toLowerCase();
}

function getNormalizedIncidentType(incidentType = "") {
  const normalized = normalizeText(incidentType);

  for (const group of INCIDENT_TYPE_GROUPS) {
    for (const option of group.options) {
      if (option.aliases.some((alias) => normalizeText(alias) === normalized)) {
        return option.value;
      }
    }
  }

  return normalized;
}

function getIncidentOption(incidentType = "") {
  for (const group of INCIDENT_TYPE_GROUPS) {
    const option = group.options.find((item) => item.value === getNormalizedIncidentType(incidentType));

    if (option) {
      return option;
    }
  }

  return null;
}

function getStatusTone(status, theme) {
  if (status === "Resolved") {
    return { text: theme.success, bg: "rgba(52, 211, 153, 0.16)", border: "rgba(52, 211, 153, 0.28)" };
  }

  if (status === "Rejected") {
    return { text: theme.danger, bg: theme.dangerSoft, border: "rgba(248, 113, 113, 0.26)" };
  }

  if (status === "For Confirmation") {
    return { text: "#b56eff", bg: "rgba(181, 110, 255, 0.14)", border: "rgba(181, 110, 255, 0.26)" };
  }

  if (status === "Ongoing") {
    return { text: theme.primary, bg: theme.primarySoft, border: "rgba(79, 131, 255, 0.28)" };
  }

  return { text: "#ffbf5a", bg: "rgba(255, 191, 90, 0.14)", border: "rgba(255, 191, 90, 0.24)" };
}

export default function AdminReportListCard({
  report,
  navigation,
  onPress,
  showResidentProfileLink = true,
  showResidentName = true,
  descriptionLines = 0,
  footerLabel = "View Report",
}) {
  const { theme } = useApp();
  const styles = createStyles(theme);
  const statusTone = getStatusTone(report.status, theme);
  const incidentOption = getIncidentOption(report.incidentType);
  const accentColor = statusTone.text;

  const handleOpenResidentProfile = () => {
    if (!report.residentId || !showResidentProfileLink) {
      return;
    }

    navigation.navigate("ResidentProfileView", {
      userId: report.residentId,
      isReadOnly: true,
    });
  };

  return (
    <View style={styles.reportCardShell}>
      <View style={[styles.reportAccent, { backgroundColor: accentColor }]} />
      <View style={styles.reportCard}>
        <View style={styles.reportTopRow}>
          <View style={styles.reportHeading}>
            <View style={[styles.incidentIconWrap, { backgroundColor: `${accentColor}20` }]}>
              <Ionicons name={incidentOption?.icon || "document-text-outline"} size={26} color={accentColor} />
            </View>
            <View style={styles.reportHeadingText}>
              <Text style={styles.reportTitle} numberOfLines={1} ellipsizeMode="tail">
                {report.incidentType}
              </Text>
              <View style={styles.identityRow}>
                {report.residentName && showResidentName ? (
                  <Pressable style={styles.namePill} onPress={handleOpenResidentProfile} disabled={!report.residentId || !showResidentProfileLink}>
                    <Text style={styles.namePillText} numberOfLines={1} ellipsizeMode="tail">
                      {report.residentName}
                    </Text>
                  </Pressable>
                ) : null}
                {report.purok ? (
                  <Text style={styles.purokText} numberOfLines={1}>
                    {report.purok}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          <View style={[styles.statusPill, { backgroundColor: statusTone.bg, borderColor: statusTone.border }]}>
            <Text style={[styles.statusPillText, { color: statusTone.text }]} numberOfLines={1}>
              {report.status}
            </Text>
          </View>
        </View>

        <View style={styles.metaChipRow}>
          <View style={styles.metaInlineItem}>
            <Ionicons name="calendar-outline" size={16} color={theme.textSoft} />
            <Text style={styles.metaInlineText}>{formatDate(report.createdAt)}</Text>
          </View>
          <View style={styles.metaInlineItem}>
            <Ionicons name="time-outline" size={16} color={theme.textSoft} />
            <Text style={styles.metaInlineText}>{formatTime(report.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.locationInlineRow}>
          <Ionicons name="location-outline" size={18} color={theme.primary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {report.location?.address || "Location unavailable"}
          </Text>
        </View>

        {descriptionLines > 0 ? (
          <Text style={styles.descriptionText} numberOfLines={descriptionLines}>
            {report.description}
          </Text>
        ) : null}

        <View style={styles.cardFooter}>
          <Pressable style={styles.viewReportButton} onPress={onPress || (() => navigation.navigate("AdminReportDetails", { reportId: report.id }))}>
            <Text style={styles.viewReportButtonText}>{footerLabel}</Text>
            <Ionicons name="arrow-forward" size={16} color={theme.primary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    reportCardShell: {
      flexDirection: "row",
      borderRadius: 28,
      overflow: "hidden",
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.22,
      shadowRadius: 20,
      elevation: 6,
    },
    reportAccent: {
      width: 3,
      opacity: 0.72,
    },
    reportCard: {
      flex: 1,
      padding: 18,
      gap: 10,
      backgroundColor: theme.surface,
    },
    reportTopRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
    },
    reportHeading: {
      flexDirection: "row",
      gap: 14,
      flex: 1,
      minWidth: 0,
    },
    incidentIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    reportHeadingText: {
      flex: 1,
      gap: 6,
      paddingTop: 2,
      minWidth: 0,
    },
    reportTitle: {
      color: theme.text,
      fontSize: 17,
      fontWeight: "900",
      lineHeight: 22,
      flexShrink: 1,
    },
    identityRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "nowrap",
      gap: 10,
      minWidth: 0,
    },
    namePill: {
      flexShrink: 1,
      minWidth: 0,
      maxWidth: "72%",
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 14,
      backgroundColor: theme.primarySoft,
      borderWidth: 1,
      borderColor: "rgba(79, 131, 255, 0.24)",
    },
    namePillText: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: "800",
      flexShrink: 1,
    },
    purokText: {
      color: theme.textMuted,
      fontSize: 13,
      fontWeight: "700",
      flexShrink: 0,
    },
    statusPill: {
      minHeight: 34,
      paddingHorizontal: 14,
      borderRadius: 16,
      justifyContent: "center",
      borderWidth: 1,
      alignSelf: "flex-start",
      flexShrink: 0,
      marginLeft: 4,
    },
    statusPillText: {
      fontSize: 12,
      fontWeight: "800",
    },
    metaChipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 16,
    },
    metaInlineItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    metaInlineText: {
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: "700",
      opacity: 0.8,
    },
    locationInlineRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingTop: 2,
    },
    locationText: {
      flex: 1,
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: "700",
      opacity: 0.8,
    },
    descriptionText: {
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 22,
      fontWeight: "600",
    },
    cardFooter: {
      paddingTop: 4,
    },
    viewReportButton: {
      minHeight: 44,
      width: "100%",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    viewReportButtonText: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: "800",
    },
  });
}
