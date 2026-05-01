import { Pressable, StyleSheet, Text, View } from "react-native";
import AppHeader from "../../components/common/AppHeader";
import ScreenContainer from "../../components/common/ScreenContainer";
import { useApp } from "../../storage/AppProvider";

export default function ManageAccountsScreen() {
  const { currentUser, accounts, reports, deleteResidentAccount, showAlert, showConfirmation, theme } = useApp();
  const residents = accounts.filter((account) => account.role === "resident");
  const styles = createStyles(theme);

  const confirmDelete = (resident) => {
    const syncedReports = reports.filter((report) => report.residentId === resident.id).length;

    showConfirmation({
      title: "Delete resident account?",
      message: `Delete this resident account and all synced reports?\n\nThis may remove ${syncedReports} local report${syncedReports === 1 ? "" : "s"} connected to ${resident.fullName}.`,
      confirmText: "Delete",
      onConfirm: async () => {
        await deleteResidentAccount(resident.id, currentUser.id);
        showAlert("Resident deleted", "The resident account and related local reports were removed.", {
          variant: "success",
        });
      },
    });
  };

  return (
    <ScreenContainer>
      <AppHeader title="Manage Accounts" variant="toolbar" />

      {residents.map((resident) => {
        const residentReportCount = reports.filter((report) => report.residentId === resident.id).length;

        return (
          <View key={resident.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {resident.fullName
                    .split(" ")
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{resident.fullName}</Text>
                <Text style={styles.meta}>{resident.email}</Text>
                <Text style={styles.meta}>
                  {resident.purok} • {resident.contactNumber || "No contact number"}
                </Text>
              </View>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statPill}>
                <Text style={styles.statText}>{residentReportCount} linked report{residentReportCount === 1 ? "" : "s"}</Text>
              </View>
            </View>

            <Pressable style={styles.deleteButton} onPress={() => confirmDelete(resident)}>
              <Text style={styles.deleteText}>Delete account</Text>
            </Pressable>
          </View>
        );
      })}
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
    },
    cardHeader: {
      flexDirection: "row",
      gap: 14,
      alignItems: "center",
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 18,
      backgroundColor: theme.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      color: theme.primary,
      fontSize: 18,
      fontWeight: "800",
    },
    info: {
      flex: 1,
      gap: 3,
    },
    name: {
      color: theme.text,
      fontSize: 17,
      fontWeight: "800",
    },
    meta: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },
    statRow: {
      flexDirection: "row",
    },
    statPill: {
      backgroundColor: theme.surfaceSoft,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    statText: {
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: "700",
    },
    deleteButton: {
      minHeight: 48,
      borderRadius: 16,
      backgroundColor: theme.dangerSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    deleteText: {
      color: theme.danger,
      fontSize: 14,
      fontWeight: "800",
    },
  });
}
