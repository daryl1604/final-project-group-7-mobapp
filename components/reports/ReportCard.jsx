import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { useApp } from "../../storage/AppProvider";
import { formatDate, formatTime } from "../../utils/dateUtils";
import StatusBadge from "../common/StatusBadge";
import { createReportCardStyles } from "../../styles/reports/ReportCard.styles";

export default function ReportCard({ report, onPress, footer }) {
  const { theme } = useApp();
  const styles = createReportCardStyles(theme);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={styles.title}>{report.incidentType}</Text>
          <View style={styles.metaRow}>
            {report.residentName ? <Text style={styles.metaPill}>{report.residentName}</Text> : null}
            <Text style={styles.meta}>{report.purok}</Text>
          </View>
        </View>
        <StatusBadge status={report.status} />
      </View>

      <Text style={styles.description}>{report.description}</Text>

      <View style={styles.metaInfoRow}>
        <View style={styles.metaInfoChip}>
          <Ionicons name="calendar-outline" size={14} color={theme.textSoft} />
          <Text style={styles.metaInfoText}>{formatDate(report.createdAt)}</Text>
        </View>
        <View style={styles.metaInfoChip}>
          <Ionicons name="time-outline" size={14} color={theme.textSoft} />
          <Text style={styles.metaInfoText}>{formatTime(report.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={16} color={theme.primary} />
        <Text style={styles.location}>{report.location?.address || "Location unavailable"}</Text>
      </View>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </Pressable>
  );
}
