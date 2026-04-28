import { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import AppHeader from "../../components/common/AppHeader";
import ScreenContainer from "../../components/common/ScreenContainer";
import TypedConfirmationModal from "../../components/common/TypedConfirmationModal";
import { useApp } from "../../storage/AppProvider";

export default function ManageAccountsScreen({ navigation }) {
  const { currentUser, accounts, deleteResidentAccount, showAlert, theme } = useApp();
  const [search, setSearch] = useState("");
  const [pendingDeleteResident, setPendingDeleteResident] = useState(null);
  const styles = createStyles(theme);
  const residents = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    return accounts
      .filter((account) => account.role === "resident")
      .filter((account) => {
        if (!searchValue) {
          return true;
        }

        const combined = [account.fullName, account.email].filter(Boolean).join(" ").toLowerCase();
        return combined.includes(searchValue);
      });
  }, [accounts, search]);

  const confirmDelete = (resident) => {
    setPendingDeleteResident(resident);
  };

  return (
    <ScreenContainer>
      <AppHeader title="Manage Accounts" variant="toolbar" />

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={20} color={theme.textSoft} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or email"
          placeholderTextColor={theme.placeholder}
          style={styles.searchInput}
        />
      </View>

      <Text style={styles.countText}>{residents.length} Account{residents.length === 1 ? "" : "s"}</Text>

      {residents.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{search.trim() ? "No matching residents" : "No resident accounts yet"}</Text>
          <Text style={styles.emptyText}>
            {search.trim()
              ? "Try a different name or email keyword."
              : "Resident accounts added by the admin will appear here."}
          </Text>
        </View>
      ) : null}

      {residents.map((resident) => (
        <View key={resident.id} style={styles.card}>
          <View style={styles.cardHeader}>
            {resident.photoUri ? (
              <Image source={{ uri: resident.photoUri }} style={styles.avatarImage} />
            ) : (
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
            )}
            <View style={styles.info}>
              <Text style={styles.name}>{resident.fullName}</Text>
              <Text style={styles.email}>{resident.email}</Text>
              <View style={styles.badgeRow}>
                <View style={styles.roleBadge}>
                  <Ionicons name="person-outline" size={14} color={styles.roleBadgeText.color} />
                  <Text style={styles.roleBadgeText}>Resident</Text>
                </View>
                <View style={styles.purokBadge}>
                  <Ionicons name="location-outline" size={14} color={theme.primary} />
                  <Text style={styles.purokBadgeText}>{resident.purok || "No purok"}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.actionRow}>
            <Pressable
              style={styles.viewButton}
              onPress={() =>
                navigation.navigate("ResidentProfileView", {
                  userId: resident.id,
                  isReadOnly: true,
                })
              }
            >
              <Ionicons name="eye-outline" size={18} color={theme.primary} />
              <Text style={styles.viewText}>View Details</Text>
            </Pressable>

            <Pressable style={styles.deleteButton} onPress={() => confirmDelete(resident)}>
              <Ionicons name="trash-outline" size={18} color={theme.danger} />
              <Text style={styles.deleteText}>Delete Account</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <TypedConfirmationModal
        visible={!!pendingDeleteResident}
        title="Delete Account"
        instruction={'Type "DELETE ACCOUNT" to confirm'}
        confirmPhrase="DELETE ACCOUNT"
        confirmLabel="Delete Account"
        onClose={() => setPendingDeleteResident(null)}
        onConfirm={async ({ message }) => {
          if (!pendingDeleteResident) {
            return;
          }

          const resident = pendingDeleteResident;
          setPendingDeleteResident(null);
          await deleteResidentAccount(resident.id, currentUser.id, { message });
          showAlert("Resident deleted", "The resident account and related local reports were removed.", {
            variant: "success",
          });
        }}
      />
    </ScreenContainer>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    searchWrap: {
      minHeight: 58,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "rgba(79, 131, 255, 0.26)",
      backgroundColor: theme.surface,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    searchInput: {
      flex: 1,
      color: theme.text,
      fontSize: 15,
      fontWeight: "600",
      paddingVertical: 0,
    },
    countText: {
      color: theme.textMuted,
      fontSize: 14,
      fontWeight: "700",
      paddingHorizontal: 4,
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      gap: 16,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarImage: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme.surfaceSoft,
    },
    avatarText: {
      color: theme.primary,
      fontSize: 28,
      fontWeight: "900",
    },
    info: {
      flex: 1,
      gap: 6,
      minWidth: 0,
    },
    name: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "900",
    },
    email: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },
    badgeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8,
    },
    roleBadge: {
      minHeight: 28,
      borderRadius: 999,
      backgroundColor: theme.mode === "dark" ? "rgba(52, 211, 153, 0.12)" : "#e9fbf2",
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: theme.mode === "dark" ? "rgba(52, 211, 153, 0.2)" : "rgba(46, 166, 111, 0.14)",
    },
    roleBadgeText: {
      color: theme.mode === "dark" ? "#7ee5b4" : "#2ea66f",
      fontSize: 13,
      fontWeight: "800",
    },
    purokBadge: {
      minHeight: 28,
      maxWidth: "100%",
      borderRadius: 999,
      backgroundColor: theme.primarySoft,
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: "rgba(79, 131, 255, 0.24)",
    },
    purokBadgeText: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: "800",
      flexShrink: 1,
    },
    actionRow: {
      flexDirection: "row",
      gap: 10,
    },
    viewButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 16,
      backgroundColor: theme.primarySoft,
      borderWidth: 1,
      borderColor: "rgba(79, 131, 255, 0.24)",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    viewText: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: "800",
    },
    deleteButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 16,
      backgroundColor: theme.dangerSoft,
      borderWidth: 1,
      borderColor: "rgba(248, 113, 113, 0.22)",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    deleteText: {
      color: theme.danger,
      fontSize: 14,
      fontWeight: "800",
    },
    emptyState: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20,
      alignItems: "center",
      gap: 6,
    },
    emptyTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "800",
    },
    emptyText: {
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: "center",
    },
  });
}
