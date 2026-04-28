import { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

function getNotificationTone(type, theme) {
  if (type === "welcome") {
    return { icon: "hand-left-outline", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.16)" };
  }

  if (type === "account") {
    return { icon: "person-add-outline", color: theme.primary, bg: theme.primarySoft };
  }

  if (type === "deleted_account") {
    return { icon: "person-remove-outline", color: theme.danger, bg: theme.dangerSoft };
  }

  if (type === "reply" || type === "feedback") {
    return { icon: "chatbubble-ellipses-outline", color: "#a855f7", bg: "rgba(168, 85, 247, 0.14)" };
  }

  if (type === "announcement") {
    return { icon: "megaphone-outline", color: "#f97316", bg: "rgba(249, 115, 22, 0.14)" };
  }

  if (type === "deleted_report") {
    return { icon: "trash-outline", color: theme.danger, bg: theme.dangerSoft };
  }

  if (type === "status") {
    return { icon: "document-text-outline", color: theme.success, bg: "rgba(5, 150, 105, 0.14)" };
  }

  return { icon: "document-outline", color: "#f7b234", bg: "rgba(247, 178, 52, 0.14)" };
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

function getRelativeTimeLabel(value) {
  const date = new Date(value);
  const diff = Math.max(Date.now() - date.getTime(), 0);
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationSectionList({
  notifications,
  theme,
  emptyTitle,
  emptyText,
  onOpenNotification,
  onDeleteNotification,
}) {
  const styles = createStyles(theme);
  const orderedSections = ["Today", "Yesterday", "Earlier"];

  const sections = useMemo(() => {
    return notifications.reduce(
      (groups, item) => {
        const label = getRelativeGroupLabel(item.createdAt);
        groups[label].push(item);
        return groups;
      },
      { Today: [], Yesterday: [], Earlier: [] }
    );
  }, [notifications]);

  if (!notifications.length) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>{emptyTitle}</Text>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  return orderedSections.map((section) => {
    const items = sections[section];

    if (!items.length) {
      return null;
    }

    return (
      <View key={section} style={styles.section}>
        <Text style={styles.sectionTitle}>{section}</Text>
        <View style={styles.sectionCard}>
          {items.map((item, index) => {
            const tone = getNotificationTone(item.title === "Welcome" ? "welcome" : item.type, theme);
            const unread = !item.read;

            return (
              <Pressable
                key={item.id}
                style={[styles.row, index === items.length - 1 ? styles.rowLast : null]}
                onPress={() => onOpenNotification(item)}
              >
                <View style={[styles.iconWrap, { backgroundColor: tone.bg }]}>
                  <Ionicons name={tone.icon} size={24} color={tone.color} />
                  {unread ? <View style={styles.unreadDot} /> : null}
                </View>

                <View style={styles.copy}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.message} numberOfLines={1}>
                    {item.message}
                  </Text>
                </View>

                <View style={styles.meta}>
                  <Text style={[styles.time, unread ? styles.timeUnread : null]}>{getRelativeTimeLabel(item.createdAt)}</Text>
                  <Pressable
                    style={styles.deleteButton}
                    onPress={(event) => {
                      event.stopPropagation?.();
                      onDeleteNotification(item.id);
                    }}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={18} color={theme.textSoft} />
                  </Pressable>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  });
}

function createStyles(theme) {
  return StyleSheet.create({
    section: {
      marginTop: 16,
      gap: 10,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "700",
      paddingHorizontal: 4,
    },
    sectionCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 16,
    },
    row: {
      minHeight: 82,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      flexShrink: 0,
    },
    unreadDot: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 8,
      height: 8,
      borderRadius: 999,
      backgroundColor: theme.primary,
      borderWidth: 1,
      borderColor: theme.surface,
    },
    copy: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "600",
    },
    message: {
      fontSize: 13,
      color: theme.textMuted,
      marginTop: 4,
      lineHeight: 19,
    },
    meta: {
      minWidth: 62,
      alignItems: "flex-end",
      justifyContent: "center",
      gap: 10,
      flexShrink: 0,
    },
    time: {
      color: theme.textSoft,
      fontSize: 12,
      fontWeight: "700",
    },
    timeUnread: {
      color: theme.primary,
    },
    deleteButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.surfaceSoft,
    },
    emptyCard: {
      marginTop: 16,
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      gap: 6,
    },
    emptyTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "700",
    },
    emptyText: {
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
  });
}
