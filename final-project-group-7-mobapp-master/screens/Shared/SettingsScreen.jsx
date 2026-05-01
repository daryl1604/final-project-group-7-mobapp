import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import AppHeader from "../../components/common/AppHeader";
import ScreenContainer from "../../components/common/ScreenContainer";
import { THEME_OPTIONS } from "../../constants/appConstants";
import { useApp } from "../../storage/AppProvider";

export default function SettingsScreen() {
  const {
    currentUser,
    preferences,
    setThemeMode,
    setNotificationsEnabled,
    deleteCurrentAccount,
    showAlert,
    showConfirmation,
    theme,
  } = useApp();
  const styles = createStyles(theme);
  const isResident = currentUser?.role === "resident";

  const handleDeleteAccount = () => {
    showConfirmation({
      title: "Delete account?",
      message: "This will permanently remove your resident account, reports, and in-app notifications from this device.",
      confirmText: "Delete Account",
      onConfirm: () =>
        showConfirmation({
          title: "Final confirmation",
          message: "Are you absolutely sure you want to delete this resident account?",
          confirmText: "Yes, Delete",
          onConfirm: async () => {
            try {
              await deleteCurrentAccount();
            } catch (error) {
              showAlert("Unable to delete account", error.message, { variant: "danger" });
            }
          },
        }),
    });
  };

  return (
    <ScreenContainer>
      <AppHeader title="Settings" variant="toolbar" />

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Theme Mode</Text>
        </View>
        <View style={styles.row}>
          {THEME_OPTIONS.map((option) => {
            const active = preferences.themeMode === option.value;

            return (
              <Pressable
                key={option.value}
                style={[styles.themeChip, active ? styles.themeChipActive : null]}
                onPress={() => setThemeMode(option.value)}
              >
                <Text style={[styles.themeChipText, active ? styles.themeChipTextActive : null]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Notifications</Text>
        </View>
        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text style={styles.switchLabel}>Allow Notifications</Text>
            <Text style={styles.switchMeta}>
              {preferences.notificationsEnabled ? "On" : "Off"}
            </Text>
          </View>
          <Switch
            value={preferences.notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            thumbColor="#ffffff"
            trackColor={{ false: theme.border, true: theme.primary }}
          />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>App Version</Text>
        </View>
        <Text style={styles.metaText}>Barangay mobile app v1.0.0</Text>
      </View>

      {isResident ? (
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Account</Text>
          </View>
          <Text style={styles.metaText}>Delete your resident account from this device.</Text>
          <Pressable style={styles.deleteButton} onPress={handleDeleteAccount}>
            <View style={styles.deleteIconWrap}>
              <Ionicons name="trash-outline" size={16} color={theme.danger} />
            </View>
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </Pressable>
        </View>
      ) : null}
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
      gap: 14,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 4,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 24,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 17,
      fontWeight: "800",
    },
    row: {
      flexDirection: "row",
      gap: 10,
    },
    themeChip: {
      flex: 1,
      minHeight: 50,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    themeChipActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primaryPressed,
    },
    themeChipText: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "700",
    },
    themeChipTextActive: {
      color: "#ffffff",
    },
    switchRow: {
      flexDirection: "row",
      gap: 14,
      alignItems: "center",
    },
    switchText: {
      flex: 1,
      gap: 6,
    },
    switchLabel: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "700",
    },
    switchMeta: {
      color: theme.textSoft,
      fontSize: 13,
      fontWeight: "600",
    },
    metaText: {
      color: theme.textSoft,
      fontSize: 13,
      lineHeight: 19,
    },
    deleteButton: {
      minHeight: 52,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.mode === "dark" ? "rgba(248, 113, 113, 0.22)" : "rgba(220, 38, 38, 0.18)",
      backgroundColor: theme.mode === "dark" ? "rgba(248, 113, 113, 0.08)" : "rgba(220, 38, 38, 0.06)",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingHorizontal: 16,
    },
    deleteIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.mode === "dark" ? "rgba(248, 113, 113, 0.12)" : "rgba(220, 38, 38, 0.1)",
      alignItems: "center",
      justifyContent: "center",
    },
    deleteButtonText: {
      color: theme.danger,
      fontSize: 14,
      fontWeight: "800",
    },
  });
}
