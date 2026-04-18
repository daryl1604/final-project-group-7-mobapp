import { Text, View } from "react-native";
import { STATUS_COLORS } from "../../constants/appConstants";
import { useApp } from "../../storage/AppProvider";
import { createStatusBadgeStyles } from "../../styles/common/StatusBadge.styles";

export default function StatusBadge({ status }) {
  const { theme } = useApp();
  const styles = createStatusBadgeStyles(theme);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${STATUS_COLORS[status] || "#64748b"}20`,
        },
      ]}
    >
      <Text style={[styles.text, { color: STATUS_COLORS[status] || "#64748b" }]}>{status}</Text>
    </View>
  );
}
