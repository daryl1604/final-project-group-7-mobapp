import { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AppHeader from "../../components/common/AppHeader";
import ScreenContainer from "../../components/common/ScreenContainer";
import { useApp } from "../../storage/AppProvider";

function getNotificationTone(type) {
  if (type === "status") {
    return { icon: "create-outline", iconColor: "#6f8eff", iconBg: "rgba(79, 131, 255, 0.18)" };
  }

  if (type === "feedback") {
    return { icon: "chatbox-ellipses-outline", iconColor: "#7ee787", iconBg: "rgba(70, 191, 111, 0.18)" };
  }

  if (type === "account") {
    return { icon: "person-add-outline", iconColor: "#d18bff", iconBg: "rgba(181, 110, 255, 0.18)" };
  }

  return { icon: "document-text-outline", iconColor: "#ff8f9f", iconBg: "rgba(255, 99, 132, 0.18)" };
}

function getRelativeGroupLabel(value) {
  const now = new Date();
  const current = new Date(value);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(current.getFullYear(), current.getMonth(), current.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfTarget.getTime()) / 86400000);

  if (diffDays <= 0) {
    return "Today";
  }

  if (diffDays === 1) {
    return "Yesterday";
  }

  return "Earlier";
}

function formatNotificationDate(value) {
  const date = new Date(value);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function ResidentNotificationsScreen({ navigation }) {
  const { currentNotifications, markNotificationRead, deleteNotification, theme } = useApp();
  const styles = createStyles(theme);

  const sections = useMemo(() => {
    return currentNotifications.reduce(
      (groups, item) => {
        const label = getRelativeGroupLabel(item.createdAt);
        groups[label].push(item);
        return groups;
      },
      { Today: [], Yesterday: [], Earlier: [] }
    );
  }, [currentNotifications]);

  const handleOpenNotification = async (item) => {
    if (!item.read) {
      await markNotificationRead(item.id);
    }

    if (item.reportId) {
      navigation.navigate("ResidentReports", {
        screen: "MyReportsScreen",
        params: {
          selectedReportId: item.reportId,
          selectionKey: `${item.id}_${Date.now()}`,
        },
      });
    }
  };

  const orderedSections = ["Today", "Yesterday", "Earlier"];

  return (
    <ScreenContainer>
      <AppHeader title="Notifications" variant="toolbar" />

      {currentNotifications.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No alerts yet</Text>
          <Text style={styles.emptyText}>Important resident updates will appear here when they happen.</Text>
        </View>
      ) : null}

      {orderedSections.map((section) => {
        const items = sections[section];

        if (!items.length) {
          return null;
        }

        return (
          <View key={section} style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>{section}</Text>

            {items.map((item) => {
              const tone = getNotificationTone(item.type);
              const unread = !item.read;

              return (
                <View key={item.id} style={styles.notificationRow}>
                  <View style={styles.dotColumn}>{unread ? <View style={styles.unreadDot} /> : null}</View>

                  <Pressable
                    style={[styles.card, unread ? styles.cardUnread : null]}
                    onPress={() => handleOpenNotification(item)}
                  >
                    <View style={[styles.leadingIconWrap, { backgroundColor: tone.iconBg }]}>
                      <Ionicons name={tone.icon} size={28} color={tone.iconColor} />
                    </View>

                    <View style={styles.cardBody}>
                      <View style={styles.titleRow}>
                        <Text style={styles.title} numberOfLines={1}>
                          {item.title}
                        </Text>
                        {unread ? (
                          <View style={styles.newBadge}>
                            <Text style={styles.newBadgeText}>New</Text>
                          </View>
                        ) : null}
                      </View>

                      <Text style={styles.message} numberOfLines={2}>
                        {item.message}
                      </Text>

                      <View style={styles.dateRow}>
                        <Ionicons name="calendar-outline" size={16} color={theme.textSoft} />
                        <Text style={styles.dateText}>{formatNotificationDate(item.createdAt)}</Text>
                      </View>
                    </View>

                    <View style={styles.trailingActions}>
                      <Pressable
                        style={styles.deleteButton}
                        onPress={(event) => {
                          event.stopPropagation?.();
                          deleteNotification(item.id);
                        }}
                        hitSlop={8}
                      >
                        <Ionicons name="close" size={20} color="#ff9aac" />
                      </Pressable>

                      <Ionicons name="chevron-forward" size={26} color={theme.textSoft} />
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        );
      })}
    </ScreenContainer>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    sectionBlock: {
      gap: 12,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "800",
      paddingHorizontal: 4,
    },
    notificationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    dotColumn: {
      width: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    unreadDot: {
      width: 11,
      height: 11,
      borderRadius: 999,
      backgroundColor: theme.primary,
    },
    card: {
      flex: 1,
      minHeight: 120,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      paddingHorizontal: 18,
      paddingVertical: 18,
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    cardUnread: {
      borderColor: theme.primary,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 18,
      elevation: 4,
    },
    leadingIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    cardBody: {
      flex: 1,
      gap: 8,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
    },
    title: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "900",
      flexShrink: 1,
    },
    newBadge: {
      borderRadius: 999,
      backgroundColor: "rgba(79, 131, 255, 0.2)",
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    newBadgeText: {
      color: theme.primary,
      fontSize: 12,
      fontWeight: "800",
    },
    message: {
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    dateRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    dateText: {
      color: theme.textSoft,
      fontSize: 13,
      fontWeight: "600",
    },
    trailingActions: {
      alignItems: "center",
      gap: 14,
    },
    deleteButton: {
      padding: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyCard: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      padding: 18,
      gap: 8,
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
    },
  });
}
