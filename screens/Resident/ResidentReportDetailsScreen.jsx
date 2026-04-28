import { useEffect, useMemo, useRef, useState } from "react";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as IntentLauncher from "expo-intent-launcher";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Animated, Image, Linking, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import AppHeader from "../../components/common/AppHeader";
import PrimaryButton from "../../components/common/PrimaryButton";
import ScreenContainer from "../../components/common/ScreenContainer";
import FormField from "../../components/forms/FormField";
import PhotoPreview from "../../components/reports/PhotoPreview";
import { useApp } from "../../storage/AppProvider";
import { formatDate, formatTime } from "../../utils/dateUtils";

const FEEDBACK_LIMIT = 500;
const CONFIRMATION_CYCLE_WAITING = "waiting_confirmation";
const CONFIRMATION_CYCLE_REJECTED_PENDING_FEEDBACK = "rejected_pending_feedback";

function createLocalId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getItemTimestamp(value) {
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function isImageUri(value = "") {
  return /(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.bmp|\.heic)(\?.*)?$/i.test(value);
}

function normalizeAttachmentType(type, uri) {
  const normalizedUri = String(uri || "").toLowerCase();

  if (normalizedUri.endsWith(".pdf") || normalizedUri.includes(".pdf?")) {
    return "file";
  }

  if (type === "image") {
    return "image";
  }

  return isImageUri(uri) ? "image" : "file";
}

function isPdfAttachment(attachment) {
  const name = String(attachment?.name || "").toLowerCase();
  const uri = String(attachment?.uri || "").toLowerCase();
  const mimeType = String(attachment?.mimeType || "").toLowerCase();
  return mimeType.includes("pdf") || name.endsWith(".pdf") || uri.includes(".pdf");
}

function getAttachmentMimeType(attachment) {
  const mimeType = String(attachment?.mimeType || "").trim();

  if (mimeType) {
    return mimeType;
  }

  if (isPdfAttachment(attachment)) {
    return "application/pdf";
  }

  if (normalizeAttachmentType(attachment?.type, attachment?.uri) === "image") {
    return "image/*";
  }

  return "*/*";
}

function getAttachmentName(attachment) {
  if (attachment?.name?.trim()) {
    return attachment.name.trim();
  }

  const value = attachment?.uri || "";
  const parts = value.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] || "Attachment";
}

function getAttachmentIconName(attachment) {
  return normalizeAttachmentType(attachment?.type, attachment?.uri) === "image"
    ? "image-outline"
    : "document-attach-outline";
}

function isSupportedImageAsset(asset) {
  if (!asset?.uri) {
    return false;
  }

  if (asset.type && asset.type !== "image") {
    return false;
  }

  if (asset.mimeType && !asset.mimeType.startsWith("image/")) {
    return false;
  }

  return true;
}

function getReplyDescriptor(item) {
  return item?.source === "resident" ? "Resident Reply" : "Admin Feedback";
}

function hasMeaningfulFeedbackText(value) {
  const compact = String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "");

  return compact.length >= 3;
}

function CollapsibleText({ text, textStyle, collapsedLines = 3, buttonStyle, buttonTextStyle, containerStyle }) {
  const [expanded, setExpanded] = useState(false);
  const value = String(text || "").trim();

  if (!value) {
    return null;
  }

  return (
    <View style={containerStyle}>
      <Text style={textStyle} numberOfLines={expanded ? undefined : collapsedLines}>
        {value}
      </Text>
      {value.length > 120 ? (
        <Pressable style={buttonStyle} onPress={() => setExpanded((current) => !current)}>
          <Text style={buttonTextStyle}>{expanded ? "See less" : "See more"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function getStatusTone(status, theme) {
  if (status === "Resolved") {
    return { text: theme.success, bg: "rgba(52, 211, 153, 0.16)", border: "rgba(52, 211, 153, 0.28)" };
  }

  if (status === "Rejected") {
    return { text: theme.danger, bg: theme.dangerSoft, border: "rgba(248, 113, 113, 0.28)" };
  }

  if (status === "For Confirmation") {
    return { text: "#b56eff", bg: "rgba(181, 110, 255, 0.14)", border: "rgba(181, 110, 255, 0.28)" };
  }

  if (status === "Ongoing") {
    return { text: theme.primary, bg: theme.primarySoft, border: "rgba(79, 131, 255, 0.28)" };
  }

  return { text: "#ffbf5a", bg: "rgba(255, 191, 90, 0.14)", border: "rgba(255, 191, 90, 0.28)" };
}

function getSummaryIcon(incidentType, theme) {
  const value = String(incidentType || "").toLowerCase();

  if (value.includes("streetlight")) {
    return { name: "bulb-outline", color: "#b56eff", bg: "rgba(181, 110, 255, 0.18)" };
  }

  if (value.includes("noise")) {
    return { name: "volume-high-outline", color: theme.primary, bg: theme.primarySoft };
  }

  if (value.includes("trash") || value.includes("garbage")) {
    return { name: "trash-outline", color: "#55d88c", bg: "rgba(85, 216, 140, 0.18)" };
  }

  return { name: "document-text-outline", color: theme.primary, bg: theme.primarySoft };
}

export default function ResidentReportDetailsScreen({ route, navigation }) {
  const { reportId } = route.params;
  const scrollTarget = route?.params?.scrollTo;
  const {
    currentUser,
    reports,
    addResidentReply,
    requestReportConfirmationFollowUp,
    updateResidentReport,
    updateReportStatus,
    showAlert,
    showConfirmation,
    theme,
  } = useApp();
  const [feedbackText, setFeedbackText] = useState("");
  const [editingFeedbackId, setEditingFeedbackId] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [replyTargetId, setReplyTargetId] = useState(null);
  const [composerAttachments, setComposerAttachments] = useState([]);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [feedbackError, setFeedbackError] = useState("");
  const [resolutionReplyRequired, setResolutionReplyRequired] = useState(false);
  const [confirmationActionPending, setConfirmationActionPending] = useState(false);
  const scrollRef = useRef(null);
  const feedbackInputRef = useRef(null);
  const confirmButtonScale = useRef(new Animated.Value(1)).current;
  const confirmIconScale = useRef(new Animated.Value(1)).current;
  const disputeButtonScale = useRef(new Animated.Value(1)).current;
  const [feedbackSectionY, setFeedbackSectionY] = useState(null);
  const [composerSectionY, setComposerSectionY] = useState(null);
  const report = useMemo(() => reports.find((item) => item.id === reportId), [reportId, reports]);
  const styles = createStyles(theme);
  const summaryIcon = getSummaryIcon(report?.incidentType, theme);
  const statusTone = getStatusTone(report?.status, theme);
  const visibleFeedback = report?.adminFeedback || [];
  const visibleReplies = report?.residentReplies || [];
  const threadItems = useMemo(
    () =>
      [
        ...visibleFeedback.map((item) => ({ ...item, source: "admin" })),
        ...visibleReplies.map((item) => ({ ...item, source: "resident" })),
      ].sort((left, right) => getItemTimestamp(left.createdAt) - getItemTimestamp(right.createdAt)),
    [visibleFeedback, visibleReplies]
  );
  const threadLookup = useMemo(
    () =>
      threadItems.reduce((accumulator, item) => {
        accumulator[item.id] = item;
        return accumulator;
      }, {}),
    [threadItems]
  );
  const replyTarget = replyTargetId ? threadLookup[replyTargetId] || null : null;
  const hasThreadItems = threadItems.length > 0;
  const feedbackCount = feedbackText.length;
  const sectionAccentColor = statusTone.text;
  const canEditReport = report?.status === "Pending" || report?.status === "Rejected";
  const confirmationCycleState =
    report?.status === "For Confirmation"
      ? report?.confirmationCycleState || CONFIRMATION_CYCLE_WAITING
      : null;
  const notYetResolvedDisabled =
    report?.status === "For Confirmation" &&
    confirmationCycleState === CONFIRMATION_CYCLE_REJECTED_PENDING_FEEDBACK &&
    !report?.confirmationFeedbackSubmittedAt;
  const feedbackSubmissionRequired = resolutionReplyRequired;
  const feedbackTextRequired = resolutionReplyRequired;
  const confirmationHelperText = notYetResolvedDisabled
    ? "Please explain why the issue is not yet resolved."
    : "";

  const scrollToFeedbackSection = () => {
    if (feedbackSectionY !== null) {
      scrollRef.current?.scrollTo?.({
        y: Math.max(feedbackSectionY - 12, 0),
        animated: true,
      });
    }
  };

  const scrollToFeedbackEditor = () => {
    requestAnimationFrame(() => {
      if (composerSectionY !== null) {
        scrollRef.current?.scrollTo?.({
          y: Math.max(composerSectionY - 96, 0),
          animated: true,
        });
      } else {
        scrollRef.current?.scrollToEnd?.({ animated: true });
      }

      setTimeout(() => {
        feedbackInputRef.current?.focus?.();
      }, 220);
    });
  };

  function resetFeedbackEditor() {
    setFeedbackText("");
    setEditingFeedbackId(null);
    setReplyTargetId(null);
    setComposerAttachments([]);
    setFeedbackError("");
    setResolutionReplyRequired(false);
  }

  useEffect(() => {
    if (!report) {
      navigation.goBack();
    }
  }, [navigation, report]);

  useEffect(() => {
    if (scrollTarget !== "feedback") {
      return;
    }

    if (feedbackSectionY === null) {
      return;
    }

    const timeoutId = setTimeout(() => {
      scrollToFeedbackSection();
      navigation.setParams({ scrollTo: undefined });
    }, 260);

    return () => clearTimeout(timeoutId);
  }, [feedbackSectionY, navigation, scrollTarget]);

  if (!report) {
    return null;
  }

  const focusFeedback = () => {
    requestAnimationFrame(() => {
      if (composerSectionY !== null) {
        scrollRef.current?.scrollTo?.({
          y: Math.max(composerSectionY - 96, 0),
          animated: true,
        });
      }
    });
  };

  const saveResidentFeedback = async ({ text, attachments, replyToId = null, feedbackId = null }) => {
    const normalizedAttachments = attachments
      .filter((item) => normalizeAttachmentType(item.type, item.uri) === "image")
      .map((item) => ({
      id: item.id || createLocalId("attachment"),
      name: getAttachmentName(item),
      uri: item.uri.trim(),
      type: normalizeAttachmentType(item.type, item.uri),
      ...(item.mimeType ? { mimeType: item.mimeType } : {}),
      }));

    if (!feedbackId) {
      await addResidentReply(
        report.id,
        currentUser.id,
        {
          text: text.trim(),
          replyToId: replyToId || null,
          attachments: normalizedAttachments,
        },
        feedbackTextRequired
          ? {
              adminTitle: "Resident responded: Report still not resolved",
              adminMessage: `${currentUser.fullName} responded that the report still needs further action.`,
            }
          : {}
      );
      return;
    }

    const nextReplies = visibleReplies.map((item) =>
      item.id === feedbackId
        ? {
            ...item,
            text: text.trim(),
            editedAt: new Date().toISOString(),
            replyToId: replyToId || null,
            attachments: normalizedAttachments,
          }
        : item
    );

    await updateResidentReport(report.id, { residentReplies: nextReplies });
  };

  const handleFeedback = async () => {
    const trimmed = feedbackText.trim();

    if (feedbackTextRequired && !trimmed) {
      setFeedbackError("Please provide feedback before submitting.");
      scrollToFeedbackEditor();
      return;
    }

    if (feedbackTextRequired && !hasMeaningfulFeedbackText(trimmed)) {
      setFeedbackError("Please enter a clear explanation using words, not symbols only.");
      scrollToFeedbackEditor();
      return;
    }

    if (!trimmed && composerAttachments.length === 0) {
      setFeedbackError("Please enter feedback or attach a file before saving.");
      scrollToFeedbackEditor();
      return;
    }

    await saveResidentFeedback({
      text: trimmed,
      attachments: composerAttachments,
      replyToId: replyTargetId,
      feedbackId: editingFeedbackId,
    });

    if (editingFeedbackId) {
      showAlert("Reply updated", "Your message was updated successfully.", { variant: "success" });
    } else if (feedbackTextRequired) {
      showAlert("Response sent", "Your feedback was sent to the admin for further action.", { variant: "success" });
    } else {
      showAlert("Reply added", "Your message was added successfully.", { variant: "success" });
    }

    resetFeedbackEditor();
  };

  const startEditingFeedback = (feedback) => {
    if (feedback.source !== "resident" || feedback.authorId !== currentUser.id) {
      return;
    }

    setSelectedFeedback(null);
    setEditingFeedbackId(feedback.id);
    setFeedbackText(feedback.text || "");
    setReplyTargetId(feedback.replyToId || null);
    setComposerAttachments((feedback.attachments || []).filter((item) => normalizeAttachmentType(item.type, item.uri) === "image"));
    setFeedbackError("");
    setResolutionReplyRequired(false);
    focusFeedback();
  };

  const startReply = (item) => {
    setSelectedFeedback(null);
    setEditingFeedbackId(null);
    setReplyTargetId(item.id);
    setFeedbackError("");
    focusFeedback();
  };

  const confirmDeleteFeedback = (feedback) => {
    if (feedback.source !== "resident" || feedback.authorId !== currentUser.id) {
      return;
    }

    setSelectedFeedback(null);
    showConfirmation({
      title: "Delete message?",
      message: "Are you sure you want to delete this message?",
      confirmText: "Delete",
      onConfirm: async () => {
        const nextReplies = visibleReplies.filter((item) => item.id !== feedback.id);
        await updateResidentReport(report.id, { residentReplies: nextReplies });

        if (editingFeedbackId === feedback.id) {
          resetFeedbackEditor();
        }

        showAlert("Message deleted", "Your message was removed successfully.", { variant: "success" });
      },
    });
  };

  const handlePickImageAttachment = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showAlert("Permission required", "Allow photo library access to attach an image.", { variant: "info" });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets?.[0];

    if (!isSupportedImageAsset(asset)) {
      showAlert("Unsupported image", "Please select a valid image file.", { variant: "info" });
      return;
    }

    setComposerAttachments((current) => [
      ...current,
      {
        id: createLocalId("attachment"),
        type: "image",
        name: getAttachmentName({ name: asset.fileName, uri: asset.uri }),
        uri: asset.uri,
        mimeType: asset.mimeType || "image/*",
      },
    ]);
    setFeedbackError("");
  };

  const removeAttachment = (attachmentId) => {
    setComposerAttachments((current) => current.filter((item) => item.id !== attachmentId));
  };

  const openFileAttachment = async (attachment) => {
    if (!attachment?.uri) {
      showAlert("Attachment unavailable", "This attachment does not have a valid link yet.", { variant: "info" });
      return;
    }
    try {
      const fileUri = attachment.uri.trim();

      if (Platform.OS === "android" && (fileUri.startsWith("file:") || fileUri.startsWith("content:"))) {
        const contentUri = fileUri.startsWith("file:") ? await FileSystem.getContentUriAsync(fileUri) : fileUri;
        await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.VIEW, {
          data: contentUri,
          flags: IntentLauncher.IntentFlags.FLAG_GRANT_READ_URI_PERMISSION,
          type: getAttachmentMimeType(attachment),
        });
        return;
      }

      const supported = await Linking.canOpenURL(fileUri);

      if (!supported) {
        throw new Error("unsupported");
      }

      await Linking.openURL(fileUri);
    } catch {
      showAlert(
        isPdfAttachment(attachment) ? "Unable to open PDF" : "Unable to open file",
        isPdfAttachment(attachment)
          ? "No supported PDF viewer was available, or the file could not be handed off to another app."
          : "This device could not open the selected attachment.",
        { variant: "info" }
      );
    }
  };

  const downloadPdfAttachment = async (attachment) => {
    if (!attachment?.uri) {
      showAlert("Attachment unavailable", "This PDF does not have a valid link yet.", { variant: "info" });
      return;
    }

    try {
      const fileUri = attachment.uri.trim();

      if (Platform.OS === "android") {
        const shareUri = fileUri.startsWith("file:") ? await FileSystem.getContentUriAsync(fileUri) : fileUri;
        await IntentLauncher.startActivityAsync("android.intent.action.SEND", {
          type: "application/pdf",
          flags: IntentLauncher.IntentFlags.FLAG_GRANT_READ_URI_PERMISSION,
          extra: {
            "android.intent.extra.STREAM": shareUri,
          },
        });
        return;
      }

      await Share.share({
        url: fileUri,
        title: getAttachmentName(attachment),
      });
    } catch {
      showAlert(
        "Unable to download PDF",
        "This device could not open a share or download option for the selected PDF.",
        { variant: "info" }
      );
    }
  };

  const openAttachment = async (attachment) => {
    if (!attachment?.uri) {
      showAlert("Attachment unavailable", "This attachment does not have a valid link yet.", { variant: "info" });
      return;
    }

    if (normalizeAttachmentType(attachment.type, attachment.uri) === "image") {
      setPreviewAttachment(attachment);
      return;
    }

    if (isPdfAttachment(attachment)) {
      showConfirmation({
        title: "Download PDF?",
        message: "Are you sure you want to download/open this PDF file?",
        variant: "info",
        confirmText: "Download",
        cancelText: "Cancel",
        confirmVariant: "primary",
        onConfirm: async () => {
          await downloadPdfAttachment(attachment);
        },
      });
      return;
    }

    await openFileAttachment(attachment);
  };

  const openReplySource = (replyToId) => {
    const target = threadLookup[replyToId];

    if (!target) {
      return;
    }

    setPreviewAttachment(null);
    setSelectedFeedback(target.source === "resident" && target.authorId === currentUser.id ? target : null);
    showAlert("Reply reference", `${getReplyDescriptor(target)} by ${target.authorName}`, { variant: "info" });
  };

  const openLocationMap = async () => {
    const latitude = report.location?.latitude;
    const longitude = report.location?.longitude;
    const address = report.location?.address;

    const destination = latitude && longitude
      ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      : address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
        : "";

    if (!destination) {
      showAlert("No location", "There is no saved map location for this report yet.", { variant: "info" });
      return;
    }

    const supported = await Linking.canOpenURL(destination);

    if (!supported) {
      showAlert("Unable to open map", "This device could not open the saved location.", { variant: "info" });
      return;
    }

    await Linking.openURL(destination);
  };

  const promptFeedbackAfterResolution = () => {
    showConfirmation({
      title: "Leave feedback?",
      message: "Do you want to leave feedback?",
      variant: "info",
      confirmText: "Yes",
      cancelText: "No",
      confirmVariant: "primary",
      onConfirm: () => {
        resetFeedbackEditor();
        scrollToFeedbackEditor();
      },
    });
  };

  const handleConfirmResolved = () => {
    if (confirmationActionPending) {
      return;
    }

    showConfirmation({
      title: "Mark this report as resolved?",
      message: "",
      variant: "info",
      confirmText: "Confirm",
      cancelText: "Cancel",
      confirmVariant: "primary",
      onConfirm: async () => {
        setConfirmationActionPending(true);
        try {
          Animated.sequence([
            Animated.spring(confirmIconScale, {
              toValue: 1.14,
              useNativeDriver: true,
              speed: 18,
              bounciness: 10,
            }),
            Animated.spring(confirmIconScale, {
              toValue: 1,
              useNativeDriver: true,
              speed: 18,
              bounciness: 8,
            }),
          ]).start();

          await updateReportStatus(report.id, "Resolved", currentUser.id, {
            adminTitle: "Resident confirmed resolution",
            adminMessage: `${currentUser.fullName} confirmed that the report has been resolved.`,
          });
          promptFeedbackAfterResolution();
        } finally {
          setConfirmationActionPending(false);
        }
      },
    });
  };

  const handleNotYetResolved = () => {
    if (notYetResolvedDisabled || confirmationActionPending) {
      return;
    }

    showConfirmation({
      title: "Report not resolved?",
      message: "Are you sure the issue is not yet resolved?\n\nThis will return the report to ongoing status.",
      variant: "info",
      confirmText: "Continue",
      cancelText: "Cancel",
      confirmVariant: "primary",
      onConfirm: async () => {
        setConfirmationActionPending(true);
        try {
          await requestReportConfirmationFollowUp(report.id, currentUser.id);
          setEditingFeedbackId(null);
          setReplyTargetId(null);
          setComposerAttachments([]);
          setResolutionReplyRequired(true);
          setFeedbackError("");
          showAlert("Feedback required", "Please explain why the issue is not yet resolved.", { variant: "info" });
          scrollToFeedbackEditor();
        } finally {
          setConfirmationActionPending(false);
        }
      },
    });
  };

  return (
    <ScreenContainer keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" scrollRef={scrollRef}>
      <AppHeader title="Report Details" variant="toolbar" preferBackButton />

      <View style={styles.summaryCardShell}>
        <View style={[styles.sectionAccent, { backgroundColor: sectionAccentColor }]} />
        <View style={styles.summaryCardContent}>
          <View style={styles.summaryTopRow}>
            <View style={[styles.summaryIconWrap, { backgroundColor: summaryIcon.bg }]}>
              <Ionicons name={summaryIcon.name} size={20} color={summaryIcon.color} />
            </View>

            <View style={styles.summaryMainContent}>
              <View style={styles.summaryTitleRow}>
                <Text style={styles.summaryTitle}>{report.incidentType}</Text>
                <View style={[styles.statusPill, { backgroundColor: statusTone.bg, borderColor: statusTone.border }]}>
                  <Text style={[styles.statusPillText, { color: statusTone.text }]}>{report.status}</Text>
                </View>
              </View>

              <View style={styles.summaryMetaRow}>
                <View style={styles.summaryDateRow}>
                  <Ionicons name="calendar-outline" size={14} color={theme.textSoft} />
                  <Text style={styles.summaryDateText}>{formatDate(report.createdAt)}</Text>
                </View>
                <View style={styles.summaryDateRow}>
                  <Ionicons name="time-outline" size={14} color={theme.textSoft} />
                  <Text style={styles.summaryDateText}>{formatTime(report.createdAt)}</Text>
                </View>
                <Text style={styles.summaryMetaText}>{report.purok}</Text>
              </View>
            </View>
          </View>

          {report.status === "For Confirmation" ? (
            <View style={styles.confirmationBanner}>
              <Ionicons name="information-circle-outline" size={18} color={theme.primary} />
              <Text style={styles.confirmationBannerText}>
                {notYetResolvedDisabled ? confirmationHelperText : "Please confirm if the issue was fully resolved."}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {report.status === "For Confirmation" ? (
        <View style={styles.confirmationActionsSection}>
          <View style={styles.confirmationRow}>
            <Pressable
              style={styles.confirmationActionPressable}
              onPress={handleConfirmResolved}
              onPressIn={() => {
                Animated.spring(confirmButtonScale, { toValue: 0.985, useNativeDriver: true, speed: 20, bounciness: 4 }).start();
              }}
              onPressOut={() => {
                Animated.spring(confirmButtonScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
              }}
              disabled={confirmationActionPending}
            >
              <Animated.View
                style={[
                  styles.actionButtonAnimatedWrap,
                  { transform: [{ scale: confirmButtonScale }] },
                ]}
              >
                <LinearGradient
                  colors={["#16c784", "#0e9f6e"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.confirmButton}
                >
                  <Animated.View style={[styles.actionButtonIconWrap, { transform: [{ scale: confirmIconScale }] }]}>
                    <Ionicons name="checkmark-done-outline" size={22} color="#ffffff" />
                  </Animated.View>
                  <View style={styles.actionButtonCopy}>
                    <Text style={styles.actionButtonText}>Confirm Resolved</Text>
                    <Text style={styles.actionButtonSubtext} numberOfLines={3}>
                      Let the barangay know the issue has already been fixed.
                    </Text>
                  </View>
                </LinearGradient>
              </Animated.View>
            </Pressable>
            <Pressable
              style={styles.confirmationActionPressable}
              onPress={handleNotYetResolved}
              onPressIn={() => {
                Animated.spring(disputeButtonScale, { toValue: 0.98, useNativeDriver: true, speed: 20, bounciness: 4 }).start();
              }}
              onPressOut={() => {
                Animated.spring(disputeButtonScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
              }}
              disabled={notYetResolvedDisabled || confirmationActionPending}
              android_ripple={notYetResolvedDisabled ? null : { color: "rgba(255,255,255,0.12)" }}
            >
              <Animated.View
                style={[
                  styles.actionButtonAnimatedWrap,
                  { transform: [{ scale: disputeButtonScale }] },
                  notYetResolvedDisabled ? styles.actionButtonDisabledWrap : null,
                ]}
              >
                <LinearGradient
                  colors={notYetResolvedDisabled ? ["#9ca3af", "#9ca3af"] : ["#f47b7b", "#e35d74"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.disputeButton, notYetResolvedDisabled ? styles.actionButtonDisabled : null]}
                >
                  <View style={styles.actionButtonIconWrap}>
                    <Ionicons name="alert-circle-outline" size={22} color="#ffffff" />
                  </View>
                  <View style={styles.actionButtonCopy}>
                    <Text style={styles.actionButtonText}>Not Yet Resolved</Text>
                    <Text style={styles.actionButtonSubtext} numberOfLines={3}>
                      Send feedback so the admin can continue the follow-up.
                    </Text>
                  </View>
                </LinearGradient>
              </Animated.View>
            </Pressable>
          </View>
          {confirmationHelperText ? <Text style={styles.confirmationHelperText}>{confirmationHelperText}</Text> : null}
        </View>
      ) : null}

      <View style={styles.accentCardShell}>
        <View style={[styles.sectionAccent, { backgroundColor: sectionAccentColor }]} />
        <View style={styles.accentCardContent}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <View style={styles.photoWrap}>
            <PhotoPreview uri={report.photoUri} uris={report.photoUris} />
          </View>
        </View>
      </View>

      <View style={styles.infoStack}>
        <View style={styles.accentCardShell}>
          <View style={[styles.sectionAccent, { backgroundColor: sectionAccentColor }]} />
          <View style={styles.infoCardContent}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIconWrap, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name="document-text-outline" size={24} color={theme.primary} />
              </View>
              <View style={styles.infoCopy}>
                <Text style={styles.infoLabel}>Description</Text>
                <CollapsibleText
                  text={report.description}
                  textStyle={styles.infoValue}
                  containerStyle={styles.collapsibleWrap}
                  buttonStyle={styles.seeMoreButton}
                  buttonTextStyle={styles.seeMoreText}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.accentCardShell}>
          <View style={[styles.sectionAccent, { backgroundColor: sectionAccentColor }]} />
          <View style={styles.infoCardContent}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIconWrap, { backgroundColor: "rgba(181, 110, 255, 0.14)" }]}>
                <Ionicons name="location-outline" size={24} color="#b56eff" />
              </View>
              <View style={styles.infoCopy}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{report.location?.address || "No saved address"}</Text>
              </View>
              <Pressable style={styles.infoSideIcon} onPress={openLocationMap}>
                <Ionicons name="map-outline" size={22} color={theme.primary} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.accentCardShell} onLayout={(event) => setFeedbackSectionY(event.nativeEvent.layout.y)}>
        <View style={[styles.sectionAccent, { backgroundColor: sectionAccentColor }]} />
        <View style={styles.accentCardContent}>
          <Text style={styles.sectionTitle}>Feedback Thread</Text>

          {!hasThreadItems ? (
            <View style={styles.threadEmptyState}>
              <View style={styles.threadEmptyContent}>
                <Ionicons name="chatbubbles-outline" size={34} color={theme.textSoft} />
                <Text style={styles.threadEmptyText}>No feedback or replies yet. Be the first to add an update.</Text>
              </View>
            </View>
          ) : (
            <View style={styles.threadList}>
              {threadItems.map((item) => {
                const isOwner = item.source === "resident" && item.authorId === currentUser.id;
                const replyToItem = item.replyToId ? threadLookup[item.replyToId] : null;
                const cardStyle = item.source === "resident" ? styles.replyCard : styles.threadCard;

                return (
                  <View key={item.id} style={cardStyle}>
                    <View style={styles.threadCardHeader}>
                      <View style={styles.threadCardCopy}>
                        <Text style={styles.threadCardTitle}>{getReplyDescriptor(item)}</Text>
                        <Text style={styles.threadCardMeta}>
                          {item.authorName} - {formatDate(item.createdAt)} - {formatTime(item.createdAt)}
                        </Text>
                      </View>

                      {isOwner ? (
                        <Pressable style={styles.kebabButton} onPress={() => setSelectedFeedback(item)}>
                          <Ionicons name="ellipsis-vertical" size={16} color={theme.textMuted} />
                        </Pressable>
                      ) : null}
                    </View>
                    {replyToItem ? (
                      <Pressable style={styles.replyReference} onPress={() => openReplySource(replyToItem.id)}>
                        <Ionicons name="return-up-forward-outline" size={14} color={theme.primary} />
                        <Text style={styles.replyReferenceText}>
                          Replying to {getReplyDescriptor(replyToItem)} by {replyToItem.authorName}
                        </Text>
                      </Pressable>
                    ) : null}
                    <CollapsibleText
                      text={item.text}
                      textStyle={styles.threadCardText}
                      containerStyle={styles.collapsibleWrap}
                      buttonStyle={styles.seeMoreButton}
                      buttonTextStyle={styles.seeMoreText}
                    />
                    {item.attachments?.length ? (
                      <View style={styles.attachmentList}>
                        {item.attachments.map((attachment) => (
                          <Pressable
                            key={attachment.id || attachment.uri}
                            style={styles.attachmentCard}
                            onPress={() => openAttachment(attachment)}
                          >
                            <View style={styles.attachmentCopy}>
                              <Ionicons name={getAttachmentIconName(attachment)} size={18} color={theme.primary} />
                              <Text style={styles.attachmentText}>{getAttachmentName(attachment)}</Text>
                            </View>
                            <Ionicons
                              name={normalizeAttachmentType(attachment.type, attachment.uri) === "image" ? "expand-outline" : "open-outline"}
                              size={16}
                              color={theme.textSoft}
                            />
                          </Pressable>
                        ))}
                      </View>
                    ) : null}
                    <Pressable style={styles.inlineReplyAction} onPress={() => startReply(item)}>
                      <Ionicons name="arrow-undo-outline" size={15} color={theme.primary} />
                      <Text style={styles.inlineReplyText}>Reply</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>

      <View style={styles.accentCardShell} onLayout={(event) => setComposerSectionY(event.nativeEvent.layout.y)}>
        <View style={[styles.sectionAccent, { backgroundColor: sectionAccentColor }]} />
        <View style={styles.accentCardContent}>
          <Text style={styles.inputSectionTitle}>{editingFeedbackId ? "Edit feedback" : replyTarget ? "Reply to message" : "Add Feedback"}</Text>
          {replyTarget ? (
            <View style={styles.replyBanner}>
              <View style={styles.replyBannerCopy}>
                <Text style={styles.replyBannerTitle}>Replying to {getReplyDescriptor(replyTarget)}</Text>
                <Text style={styles.replyBannerText} numberOfLines={2}>
                  {replyTarget.authorName}: {replyTarget.text || "Attachment only"}
                </Text>
              </View>
              <Pressable style={styles.replyBannerClose} onPress={() => setReplyTargetId(null)}>
                <Ionicons name="close" size={16} color={theme.textSoft} />
              </Pressable>
            </View>
          ) : null}
          {feedbackSubmissionRequired ? (
            <View style={styles.reasonBanner}>
              <Ionicons name="alert-circle-outline" size={18} color={theme.danger} />
              <Text style={styles.reasonBannerText}>Tell the admin why the report is not yet resolved.</Text>
            </View>
          ) : null}
          <FormField
            label="Feedback"
            value={feedbackText}
            onChangeText={(value) => {
              setFeedbackText(value.slice(0, FEEDBACK_LIMIT));
              if (feedbackError && value.trim()) {
                setFeedbackError("");
              }
            }}
            placeholder="Write a clear update for the barangay..."
            multiline
            onFocus={focusFeedback}
            inputRef={feedbackInputRef}
            error={feedbackError}
          />
          <Text style={styles.characterCount}>{feedbackCount}/{FEEDBACK_LIMIT}</Text>
          <View style={styles.attachmentActionRow}>
            <Pressable style={styles.inlineAction} onPress={handlePickImageAttachment}>
              <Ionicons name="image-outline" size={18} color={theme.primary} />
              <Text style={styles.inlineActionText}>Attach Image</Text>
            </Pressable>
          </View>
          {composerAttachments.length ? (
            <View style={styles.attachmentList}>
              {composerAttachments.map((attachment) => (
                <View key={attachment.id} style={styles.attachmentCard}>
                  <Pressable style={styles.attachmentCopy} onPress={() => openAttachment(attachment)}>
                    <Ionicons name={getAttachmentIconName(attachment)} size={18} color={theme.primary} />
                    <Text style={styles.attachmentText}>{getAttachmentName(attachment)}</Text>
                  </Pressable>
                  <Pressable style={styles.attachmentRemoveButton} onPress={() => removeAttachment(attachment.id)}>
                    <Ionicons name="close" size={16} color={theme.textSoft} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
          <PrimaryButton label={editingFeedbackId ? "Update feedback" : feedbackSubmissionRequired ? "Submit Reason" : "Add feedback"} onPress={handleFeedback} />
          {editingFeedbackId || replyTarget ? (
            <Pressable style={styles.cancelEditButton} onPress={resetFeedbackEditor}>
              <Text style={styles.cancelEditText}>
                {editingFeedbackId ? "Cancel edit" : replyTarget ? "Cancel reply" : "Cancel"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {canEditReport ? (
        <Pressable style={styles.inlineEditButton} onPress={() => navigation.navigate("EditReport", { reportId: report.id })}>
          <Ionicons name="create-outline" size={18} color={theme.primary} />
          <Text style={styles.inlineEditButtonText}>Edit Report</Text>
        </Pressable>
      ) : null}

      <Modal visible={!!selectedFeedback} transparent animationType="fade" onRequestClose={() => setSelectedFeedback(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedFeedback(null)}>
          <Pressable style={styles.actionSheet} onPress={() => null}>
            <Text style={styles.actionSheetTitle}>Message options</Text>
            <Pressable style={styles.actionSheetButton} onPress={() => startReply(selectedFeedback)}>
              <Ionicons name="arrow-undo-outline" size={18} color={theme.primary} />
              <Text style={styles.actionSheetButtonText}>Reply</Text>
            </Pressable>
            <Pressable style={styles.actionSheetButton} onPress={() => startEditingFeedback(selectedFeedback)}>
              <Ionicons name="create-outline" size={18} color={theme.primary} />
              <Text style={styles.actionSheetButtonText}>Edit message</Text>
            </Pressable>
            <Pressable style={styles.actionSheetButton} onPress={() => confirmDeleteFeedback(selectedFeedback)}>
              <Ionicons name="trash-outline" size={18} color={theme.danger} />
              <Text style={[styles.actionSheetButtonText, styles.actionSheetDangerText]}>Delete message</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={!!previewAttachment}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setPreviewAttachment(null);
        }}
      >
        <View style={styles.previewBackdrop}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>{previewAttachment ? getAttachmentName(previewAttachment) : "Image preview"}</Text>
            <Pressable
              style={styles.previewCloseButton}
              onPress={() => {
                setPreviewAttachment(null);
              }}
            >
              <Ionicons name="close" size={22} color="#ffffff" />
            </Pressable>
          </View>
          <ScrollView
            style={styles.previewScroll}
            contentContainerStyle={styles.previewScrollContent}
            minimumZoomScale={1}
            maximumZoomScale={4}
            centerContent
          >
            {previewAttachment?.uri ? (
              <Image source={{ uri: previewAttachment.uri }} style={styles.previewImage} resizeMode="contain" />
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    screenContent: {
      gap: 14,
    },
    summaryCardShell: {
      flexDirection: "row",
      overflow: "hidden",
      borderRadius: 28,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.24,
      shadowRadius: 20,
      elevation: 6,
    },
    summaryCardContent: {
      flex: 1,
      backgroundColor: theme.surface,
      padding: 18,
      gap: 10,
    },
    summaryTopRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    summaryIconWrap: {
      width: 50,
      height: 50,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    summaryMainContent: {
      flex: 1,
      gap: 6,
      minWidth: 0,
    },
    summaryTitleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 10,
    },
    statusPill: {
      minHeight: 30,
      maxWidth: 144,
      paddingHorizontal: 10,
      borderRadius: 15,
      justifyContent: "center",
      borderWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      opacity: 0.94,
    },
    statusPillText: {
      flexShrink: 1,
      fontSize: 11,
      fontWeight: "800",
    },
    summaryTitle: {
      color: theme.text,
      flex: 1,
      fontSize: 17,
      fontWeight: "900",
      lineHeight: 22,
    },
    summaryMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 6,
    },
    summaryMetaText: {
      color: theme.textMuted,
      fontSize: 13,
      fontWeight: "700",
      opacity: 0.82,
    },
    summaryDateInline: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 14,
      paddingTop: 2,
    },
    summaryDateRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },
    summaryDateText: {
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: "700",
      opacity: 0.78,
    },
    confirmationBanner: {
      minHeight: 44,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: theme.primarySoft,
      borderWidth: 1,
      borderColor: "rgba(79, 131, 255, 0.22)",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    confirmationBannerText: {
      flex: 1,
      color: theme.primary,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 19,
    },
    accentCardShell: {
      flexDirection: "row",
      overflow: "hidden",
      borderRadius: 28,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 18,
      elevation: 4,
    },
    sectionAccent: {
      width: 4,
      opacity: 0.78,
    },
    accentCardContent: {
      flex: 1,
      padding: 18,
      backgroundColor: theme.surface,
      gap: 16,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "900",
    },
    inputSectionTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "900",
    },
    photoWrap: {
      overflow: "hidden",
      borderRadius: 22,
    },
    infoStack: {
      gap: 12,
    },
    infoCardContent: {
      flex: 1,
      backgroundColor: theme.surface,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      padding: 18,
    },
    infoIconWrap: {
      width: 58,
      height: 58,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    infoCopy: {
      flex: 1,
      gap: 4,
    },
    infoLabel: {
      color: theme.textSoft,
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    infoValue: {
      color: theme.textMuted,
      fontSize: 15,
      lineHeight: 23,
      fontWeight: "600",
    },
    collapsibleWrap: {
      gap: 6,
    },
    seeMoreButton: {
      alignSelf: "flex-start",
    },
    seeMoreText: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: "800",
    },
    infoSideIcon: {
      width: 54,
      height: 54,
      borderRadius: 18,
      backgroundColor: theme.inputBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    inlineAction: {
      flex: 1,
      minHeight: 48,
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor: theme.inputBackground,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    inlineActionText: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: "800",
    },
    attachmentActionRow: {
      flexDirection: "row",
      gap: 10,
      flexWrap: "nowrap",
      alignItems: "center",
    },
    threadEmptyState: {
      minHeight: 164,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      overflow: "hidden",
      flexDirection: "row",
    },
    threadEmptyContent: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingHorizontal: 24,
    },
    threadEmptyText: {
      color: theme.textMuted,
      fontSize: 15,
      lineHeight: 24,
      textAlign: "center",
      maxWidth: 240,
    },
    threadList: {
      gap: 12,
    },
    threadCard: {
      borderRadius: 20,
      backgroundColor: theme.inputBackground,
      padding: 16,
      gap: 10,
    },
    replyCard: {
      borderRadius: 20,
      backgroundColor: theme.surfaceSoft,
      padding: 16,
      gap: 8,
    },
    threadCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
      alignItems: "flex-start",
    },
    threadCardCopy: {
      flex: 1,
      gap: 3,
    },
    threadCardTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "800",
    },
    threadCardMeta: {
      color: theme.textSoft,
      fontSize: 12,
      lineHeight: 18,
    },
    threadCardText: {
      color: theme.textMuted,
      fontSize: 15,
      lineHeight: 23,
      fontWeight: "600",
    },
    inlineReplyAction: {
      minHeight: 34,
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    inlineReplyText: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: "800",
    },
    replyReference: {
      minHeight: 34,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      paddingHorizontal: 10,
      paddingVertical: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    replyReferenceText: {
      flex: 1,
      color: theme.primary,
      fontSize: 12,
      fontWeight: "700",
    },
    replyBanner: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    replyBannerCopy: {
      flex: 1,
      gap: 4,
    },
    replyBannerTitle: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "800",
    },
    replyBannerText: {
      color: theme.textSoft,
      fontSize: 12,
      lineHeight: 18,
    },
    replyBannerClose: {
      width: 28,
      height: 28,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    attachmentList: {
      gap: 8,
    },
    attachmentCard: {
      minHeight: 48,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    attachmentCopy: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    attachmentText: {
      flex: 1,
      color: theme.primary,
      fontSize: 13,
      fontWeight: "700",
      textDecorationLine: "underline",
    },
    attachmentRemoveButton: {
      width: 28,
      height: 28,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    kebabButton: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    characterCount: {
      color: theme.textSoft,
      fontSize: 12,
      fontWeight: "700",
      textAlign: "right",
      marginTop: -6,
    },
    cancelEditButton: {
      minHeight: 46,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelEditText: {
      color: theme.textMuted,
      fontSize: 14,
      fontWeight: "800",
    },
    inlineEditButton: {
      minHeight: 52,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    inlineEditButtonText: {
      color: theme.primary,
      fontSize: 15,
      fontWeight: "800",
    },
    confirmationActionsSection: {
      gap: 10,
    },
    confirmationRow: {
      flexDirection: "row",
      gap: 10,
      alignItems: "stretch",
    },
    confirmationActionPressable: {
      flex: 1,
    },
    actionButtonAnimatedWrap: {
      borderRadius: 16,
      flex: 1,
    },
    actionButtonDisabledWrap: {
      opacity: 0.56,
    },
    confirmButton: {
      minHeight: 96,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.16)",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      shadowColor: theme.success,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.22,
      shadowRadius: 18,
      elevation: 4,
    },
    disputeButton: {
      minHeight: 96,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.14)",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      shadowColor: theme.danger,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 18,
      elevation: 4,
    },
    actionButtonDisabled: {
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    actionButtonIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: "rgba(255, 255, 255, 0.18)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.18)",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    actionButtonCopy: {
      alignItems: "center",
      gap: 3,
    },
    actionButtonText: {
      color: "#ffffff",
      fontWeight: "800",
      fontSize: 13,
      lineHeight: 16,
      textAlign: "center",
    },
    actionButtonSubtext: {
      color: "rgba(255, 255, 255, 0.9)",
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "600",
      textAlign: "center",
    },
    confirmationHelperText: {
      color: theme.textSoft,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: "700",
      paddingHorizontal: 4,
    },
    reasonBanner: {
      minHeight: 44,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: theme.dangerSoft,
      borderWidth: 1,
      borderColor: "rgba(248, 113, 113, 0.22)",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    reasonBannerText: {
      flex: 1,
      color: theme.danger,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 19,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.52)",
      justifyContent: "flex-end",
      padding: 18,
    },
    actionSheet: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      gap: 10,
    },
    actionSheetTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "900",
      marginBottom: 2,
    },
    actionSheetButton: {
      minHeight: 50,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 14,
    },
    actionSheetButtonText: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "800",
    },
    actionSheetDangerText: {
      color: theme.danger,
    },
    previewBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.96)",
      paddingTop: 48,
      paddingBottom: 24,
    },
    previewHeader: {
      paddingHorizontal: 18,
      paddingBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    previewTitle: {
      flex: 1,
      color: "#ffffff",
      fontSize: 15,
      fontWeight: "800",
    },
    previewCloseButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255, 255, 255, 0.12)",
    },
    previewScroll: {
      flex: 1,
    },
    previewScrollContent: {
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 16,
      paddingBottom: 20,
    },
    previewImage: {
      width: "100%",
      height: 420,
    },
  });
}
