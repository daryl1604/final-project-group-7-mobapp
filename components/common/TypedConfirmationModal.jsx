import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useApp } from "../../storage/AppProvider";

export default function TypedConfirmationModal({
  visible,
  title,
  instruction,
  confirmPhrase,
  reasonPrompt,
  reasonPlaceholder,
  confirmLabel,
  onClose,
  onConfirm,
}) {
  const { theme } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [step, setStep] = useState("confirm");
  const [typedValue, setTypedValue] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const hasReasonStep = Boolean(reasonPrompt);

  useEffect(() => {
    if (!visible) {
      setStep("confirm");
      setTypedValue("");
      setReason("");
      setError("");
      setSubmitting(false);
    }
  }, [visible]);

  const handleContinue = () => {
    if (typedValue !== confirmPhrase) {
      setError(`Text does not match. Please type ${confirmPhrase}`);
      return;
    }

    setError("");
    if (hasReasonStep) {
      setStep("reasonPrompt");
      return;
    }

    handleFinalConfirm("");
  };

  const handleFinalConfirm = async (message = reason.trim()) => {
    try {
      setSubmitting(true);
      await onConfirm?.({ message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal animationType="fade" transparent visible onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <Pressable style={styles.closeButton} onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={20} color={theme.textMuted} />
          </Pressable>

          <View style={styles.iconWrap}>
            <View style={styles.iconDot} />
          </View>

          <View style={styles.copyBlock}>
            <Text style={styles.title}>{title}</Text>
            {step === "confirm" ? <Text style={styles.message}>{instruction}</Text> : null}
            {step === "reasonPrompt" ? <Text style={styles.message}>{reasonPrompt}</Text> : null}
            {step === "reasonInput" ? <Text style={styles.message}>{reasonPrompt}</Text> : null}
          </View>

          {step === "confirm" ? (
            <View style={styles.inputBlock}>
              <TextInput
                value={typedValue}
                onChangeText={(value) => {
                  setTypedValue(value);
                  if (error) {
                    setError("");
                  }
                }}
                placeholder={confirmPhrase}
                placeholderTextColor={theme.placeholder}
                autoCapitalize="characters"
                autoCorrect={false}
                style={[styles.input, error ? styles.inputError : null]}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <View style={styles.actionRow}>
                <Pressable style={[styles.actionButton, styles.primaryButton]} onPress={handleContinue}>
                  <Text style={[styles.actionText, styles.primaryText]}>Continue</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {step === "reasonPrompt" ? (
            <View style={styles.dualActionRow}>
              <Pressable style={[styles.actionButton, styles.primaryButton, styles.choiceButton]} onPress={() => setStep("reasonInput")}>
                <Text style={[styles.actionText, styles.primaryText]}>Yes</Text>
              </Pressable>
              <Pressable style={[styles.actionButton, styles.secondaryButton, styles.choiceButton]} onPress={() => handleFinalConfirm("")}>
                <Text style={[styles.actionText, styles.secondaryText]}>Skip</Text>
              </Pressable>
            </View>
          ) : null}

          {step === "reasonInput" ? (
            <View style={styles.inputBlock}>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder={reasonPlaceholder}
                placeholderTextColor={theme.placeholder}
                multiline
                textAlignVertical="top"
                style={[styles.input, styles.reasonInput]}
              />
              <View style={styles.actionRow}>
                <Pressable
                  style={[styles.actionButton, styles.primaryButton, submitting ? styles.buttonDisabled : null]}
                  onPress={() => handleFinalConfirm()}
                  disabled={submitting}
                >
                  <Text style={[styles.actionText, styles.primaryText]}>{submitting ? "Please wait..." : confirmLabel}</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    card: {
      position: "relative",
      width: "100%",
      maxWidth: 390,
      backgroundColor: theme.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 22,
      gap: 18,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.16,
      shadowRadius: 28,
      elevation: 10,
    },
    closeButton: {
      position: "absolute",
      top: 16,
      right: 16,
      zIndex: 2,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    iconDot: {
      width: 12,
      height: 12,
      borderRadius: 999,
      backgroundColor: theme.primary,
    },
    copyBlock: {
      gap: 10,
    },
    title: {
      color: theme.text,
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    message: {
      color: theme.textMuted,
      fontSize: 15,
      lineHeight: 23,
    },
    inputBlock: {
      gap: 12,
    },
    input: {
      minHeight: 54,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      color: theme.text,
      fontSize: 15,
      fontWeight: "600",
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    reasonInput: {
      minHeight: 118,
    },
    inputError: {
      borderColor: theme.danger,
    },
    errorText: {
      color: theme.danger,
      fontSize: 12,
      fontWeight: "700",
    },
    actionRow: {
      flexDirection: "row",
      gap: 12,
    },
    dualActionRow: {
      flexDirection: "row",
      gap: 12,
    },
    actionButton: {
      flex: 1,
      minHeight: 50,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 14,
      borderWidth: 1,
    },
    primaryButton: {
      backgroundColor: theme.primary,
      borderColor: theme.primaryPressed,
    },
    secondaryButton: {
      backgroundColor: theme.surfaceSoft,
      borderColor: theme.border,
    },
    choiceButton: {
      minWidth: 0,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    actionText: {
      fontSize: 14,
      fontWeight: "800",
      textAlign: "center",
    },
    primaryText: {
      color: "#ffffff",
    },
    secondaryText: {
      color: theme.text,
    },
  });
}
