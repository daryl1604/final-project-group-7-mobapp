import { useMemo, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../../components/common/AppHeader";
import PrimaryButton from "../../components/common/PrimaryButton";
import ScreenContainer from "../../components/common/ScreenContainer";
import FormField from "../../components/forms/FormField";
import { PUROK_OPTIONS } from "../../constants/appConstants";
import { useApp } from "../../storage/AppProvider";
import useKeyboardAwareFieldFocus from "../../utils/useKeyboardAwareFieldFocus";
import {
  validateAddress,
  validateConfirmPassword,
  validateDateOfBirth,
  validateEmail,
  validateFullName,
  validateMinimumAge,
  validatePassword,
  validatePhoneNumber,
} from "../../utils/authValidation";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const RESIDENT_TEXT_PATTERN = /^[a-zA-Z0-9\s.,-]+$/;

function formatDateValue(date) {
  return date.toISOString().split("T")[0];
}

function formatDateLabel(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(`${dateValue}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function buildCalendarDays(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let index = 0; index < firstDayIndex; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

export default function AddResidentAccountScreen() {
  const { currentUser, accounts, addResidentAccount, showAlert, theme } = useApp();
  const scrollRef = useRef(null);
  const { handleFieldFocus, registerInputRef } = useKeyboardAwareFieldFocus({ scrollRef });
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    contactNumber: "",
    address: "",
    dateOfBirth: "",
    purok: "",
    password: "",
    confirmPassword: "",
  });
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState("day");
  const [pickerMonth, setPickerMonth] = useState(() => {
    const initialDate = new Date();
    initialDate.setFullYear(initialDate.getFullYear() - 18);
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  });
  const styles = createStyles(theme);

  const errors = useMemo(() => {
    const duplicateEmail = accounts.some(
      (account) => account.email.trim().toLowerCase() === form.email.trim().toLowerCase()
    )
      ? "Email is already in use."
      : "";
    const duplicatePhone = accounts.some(
      (account) => String(account.contactNumber || "").trim() === String(form.contactNumber || "").trim()
    )
      ? "Phone number is already registered."
      : "";

    return {
      fullName:
        validateFullName(form.fullName) ||
        (form.fullName.trim() && !RESIDENT_TEXT_PATTERN.test(form.fullName.trim())
          ? "Use letters, numbers, spaces, commas, periods, or hyphens only."
          : ""),
      email: validateEmail(form.email) || duplicateEmail,
      contactNumber: validatePhoneNumber(form.contactNumber) || duplicatePhone,
      address:
        validateAddress(form.address) ||
        (form.address.trim() && !RESIDENT_TEXT_PATTERN.test(form.address.trim())
          ? "Use letters, numbers, spaces, commas, periods, or hyphens only."
          : ""),
      dateOfBirth: validateDateOfBirth(form.dateOfBirth) || validateMinimumAge(form.dateOfBirth),
      purok: form.purok ? "" : "Please select a Purok.",
      password: validatePassword(form.password),
      confirmPassword: validateConfirmPassword(form.password, form.confirmPassword),
    };
  }, [accounts, form]);

  const calendarDays = useMemo(() => buildCalendarDays(pickerMonth), [pickerMonth]);
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 121 }, (_, index) => currentYear - index);
  }, []);
  const dobDisplayValue = formatDateLabel(form.dateOfBirth);

  const showError = (field) => touched[field] ? errors[field] : "";
  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const openDobPicker = () => {
    const baseDate = form.dateOfBirth ? new Date(`${form.dateOfBirth}T00:00:00`) : new Date();
    setPickerMonth(new Date(baseDate.getFullYear(), baseDate.getMonth(), 1));
    setPickerMode("day");
    setShowDobPicker(true);
  };

  const closeDobPicker = () => {
    setShowDobPicker(false);
    setPickerMode("day");
    setTouched((current) => ({ ...current, dateOfBirth: true }));
  };

  const handleSelectDob = (selectedDate) => {
    updateField("dateOfBirth", formatDateValue(selectedDate));
    setTouched((current) => ({ ...current, dateOfBirth: true }));
    setShowDobPicker(false);
    setPickerMode("day");
  };

  const handleAddResident = async () => {
    setTouched({
      fullName: true,
      email: true,
      contactNumber: true,
      address: true,
      dateOfBirth: true,
      purok: true,
      password: true,
      confirmPassword: true,
    });

    if (Object.values(errors).some(Boolean)) {
      return;
    }

    try {
      setSubmitting(true);
      await addResidentAccount(form, currentUser.id);
      showAlert("Resident added", "The resident account was created successfully.", { variant: "success" });
      setForm({
        fullName: "",
        email: "",
        contactNumber: "",
        address: "",
        dateOfBirth: "",
        purok: "",
        password: "",
        confirmPassword: "",
      });
      setTouched({});
    } catch (error) {
      showAlert("Unable to add resident", error.message, { variant: "danger" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer scrollRef={scrollRef} keyboardShouldPersistTaps="handled">
      <AppHeader title="Add Resident" variant="toolbar" />

      <View style={styles.heroCard}>
        <View style={styles.heroIconWrap}>
          <Ionicons name="person-add-outline" size={38} color={theme.primary} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>Resident account setup</Text>
          <Text style={styles.heroTitle}>Create a resident profile with temporary sign-in details.</Text>
          <Text style={styles.heroText}>Complete the personal details, pick a date of birth, assign a purok, and set a temporary password.</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionBlock}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIcon, styles.sectionIconBlue]}>
              <Ionicons name="person-outline" size={18} color={theme.primary} />
            </View>
            <View style={styles.sectionTitleCopy}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              <Text style={styles.sectionText}>Use the same clean account structure while keeping your existing validation rules.</Text>
            </View>
          </View>
        </View>

        <View style={styles.twoColumnRow}>
          <View style={styles.columnField}>
            <FormField
              label="Full name"
              value={form.fullName}
              onChangeText={(value) => updateField("fullName", value)}
              onBlur={() => setTouched((current) => ({ ...current, fullName: true }))}
              onFocus={handleFieldFocus("fullName")}
              inputRef={registerInputRef("fullName")}
              error={showError("fullName")}
              placeholder="Resident full name"
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>
          <View style={styles.columnField}>
            <FormField
              label="Email"
              value={form.email}
              onChangeText={(value) => updateField("email", value)}
              onBlur={() => setTouched((current) => ({ ...current, email: true }))}
              onFocus={handleFieldFocus("email")}
              inputRef={registerInputRef("email")}
              error={showError("email")}
              placeholder="resident@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>
        </View>

        <View style={styles.twoColumnRow}>
          <View style={styles.columnField}>
            <FormField
              label="Contact number"
              value={form.contactNumber}
              onChangeText={(value) => updateField("contactNumber", value)}
              onBlur={() => setTouched((current) => ({ ...current, contactNumber: true }))}
              onFocus={handleFieldFocus("contactNumber")}
              inputRef={registerInputRef("contactNumber")}
              error={showError("contactNumber")}
              placeholder="09xxxxxxxxx"
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.columnField}>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Date of birth</Text>
              <Pressable style={[styles.datePickerTrigger, showError("dateOfBirth") ? styles.datePickerError : null]} onPress={openDobPicker}>
                <Ionicons name="calendar-outline" size={18} color={theme.primary} />
                <Text style={[styles.datePickerValue, !dobDisplayValue ? styles.datePickerPlaceholder : null]}>
                  {dobDisplayValue || "Select date of birth"}
                </Text>
              </Pressable>
              {showError("dateOfBirth") ? <Text style={styles.inlineError}>{showError("dateOfBirth")}</Text> : null}
            </View>
          </View>
        </View>

        <FormField
          label="Address"
          value={form.address}
          onChangeText={(value) => updateField("address", value)}
          onBlur={() => setTouched((current) => ({ ...current, address: true }))}
          onFocus={handleFieldFocus("address")}
          inputRef={registerInputRef("address")}
          error={showError("address")}
          placeholder="e.g., 123 Main Street, Barangay"
          autoCapitalize="words"
          returnKeyType="next"
        />

        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Purok</Text>
          <View style={styles.purokGrid}>
            {PUROK_OPTIONS.map((option) => {
              const active = option === form.purok;

              return (
                <Pressable
                  key={option}
                  style={[styles.purokOption, active ? styles.purokOptionActive : null]}
                  onPress={() => {
                    updateField("purok", option);
                    setTouched((current) => ({ ...current, purok: true }));
                  }}
                >
                  <Text style={[styles.purokOptionText, active ? styles.purokOptionTextActive : null]}>{option}</Text>
                  {active ? (
                    <View style={styles.purokCheck}>
                      <Ionicons name="checkmark" size={12} color={theme.primary} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
          {showError("purok") ? <Text style={styles.inlineError}>{showError("purok")}</Text> : null}
        </View>

        <View style={styles.sectionBlock}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIcon, styles.sectionIconGreen]}>
              <Ionicons name="lock-closed-outline" size={18} color="#2ea66f" />
            </View>
            <View style={styles.sectionTitleCopy}>
              <Text style={styles.sectionTitle}>Access Setup</Text>
              <Text style={styles.sectionText}>The resident can update this password later after signing in.</Text>
            </View>
          </View>
        </View>

        <View style={styles.passwordFields}>
          <FormField
            label="Temporary Password"
            value={form.password}
            onChangeText={(value) => updateField("password", value)}
            onBlur={() => setTouched((current) => ({ ...current, password: true }))}
            onFocus={handleFieldFocus("password")}
            inputRef={registerInputRef("password")}
            error={showError("password")}
            placeholder="Temporary password"
            secureTextEntry
            autoCapitalize="none"
            returnKeyType="next"
          />
          <FormField
            label="Confirm password"
            value={form.confirmPassword}
            onChangeText={(value) => updateField("confirmPassword", value)}
            onBlur={() => setTouched((current) => ({ ...current, confirmPassword: true }))}
            onFocus={handleFieldFocus("confirmPassword")}
            inputRef={registerInputRef("confirmPassword")}
            error={showError("confirmPassword")}
            placeholder="Re-enter password"
            secureTextEntry
            autoCapitalize="none"
            returnKeyType="next"
          />
        </View>
      </View>

      <View style={styles.buttonWrap}>
        <PrimaryButton label="Add resident" onPress={handleAddResident} loading={submitting} />
      </View>

      <Modal visible={showDobPicker} transparent animationType="fade" onRequestClose={closeDobPicker}>
        <Pressable style={styles.modalBackdrop} onPress={closeDobPicker}>
          <Pressable style={styles.modalSheet} onPress={() => null}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Date of Birth</Text>
              <Pressable onPress={closeDobPicker} hitSlop={8}>
                <Text style={styles.modalClose}>Close</Text>
              </Pressable>
            </View>

            <View style={styles.pickerToolbar}>
              <Pressable
                style={[styles.pickerModeButton, pickerMode === "day" ? styles.pickerModeButtonActive : null]}
                onPress={() => setPickerMode("day")}
              >
                <Text style={[styles.pickerModeText, pickerMode === "day" ? styles.pickerModeTextActive : null]}>Day</Text>
              </Pressable>
              <Pressable
                style={[styles.pickerModeButton, pickerMode === "month" ? styles.pickerModeButtonActive : null]}
                onPress={() => setPickerMode("month")}
              >
                <Text style={[styles.pickerModeText, pickerMode === "month" ? styles.pickerModeTextActive : null]}>Month</Text>
              </Pressable>
              <Pressable
                style={[styles.pickerModeButton, pickerMode === "year" ? styles.pickerModeButtonActive : null]}
                onPress={() => setPickerMode("year")}
              >
                <Text style={[styles.pickerModeText, pickerMode === "year" ? styles.pickerModeTextActive : null]}>Year</Text>
              </Pressable>
            </View>

            {pickerMode === "day" ? (
              <>
                <View style={styles.calendarHeader}>
                  <Pressable onPress={() => setPickerMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}>
                    <Ionicons name="chevron-back" size={20} color={theme.text} />
                  </Pressable>
                  <Pressable style={styles.calendarTitleButton} onPress={() => setPickerMode("month")}>
                    <Text style={styles.calendarTitle}>
                      {MONTH_LABELS[pickerMonth.getMonth()]} {pickerMonth.getFullYear()}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => setPickerMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>
                    <Ionicons name="chevron-forward" size={20} color={theme.text} />
                  </Pressable>
                </View>

                <View style={styles.weekRow}>
                  {WEEKDAY_LABELS.map((label) => (
                    <Text key={label} style={styles.weekdayLabel}>
                      {label}
                    </Text>
                  ))}
                </View>

                <View style={styles.calendarGrid}>
                  {calendarDays.map((date, index) => {
                    const isSelected = date && form.dateOfBirth === formatDateValue(date);

                    return (
                      <Pressable
                        key={`${date ? date.toISOString() : "empty"}-${index}`}
                        style={[styles.dayCell, isSelected ? styles.dayCellActive : null, !date ? styles.dayCellEmpty : null]}
                        disabled={!date}
                        onPress={() => handleSelectDob(date)}
                      >
                        {date ? (
                          <Text style={[styles.dayCellText, isSelected ? styles.dayCellTextActive : null]}>{date.getDate()}</Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}

            {pickerMode === "month" ? (
              <View style={styles.monthGrid}>
                {MONTH_LABELS.map((label, index) => (
                  <Pressable
                    key={label}
                    style={[styles.monthCell, pickerMonth.getMonth() === index ? styles.monthCellActive : null]}
                    onPress={() => {
                      setPickerMonth(new Date(pickerMonth.getFullYear(), index, 1));
                      setPickerMode("day");
                    }}
                  >
                    <Text style={[styles.monthCellText, pickerMonth.getMonth() === index ? styles.monthCellTextActive : null]}>{label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {pickerMode === "year" ? (
              <ScrollView style={styles.yearList} contentContainerStyle={styles.yearListContent} showsVerticalScrollIndicator={false}>
                {yearOptions.map((year) => (
                  <Pressable
                    key={year}
                    style={[styles.yearRow, pickerMonth.getFullYear() === year ? styles.yearRowActive : null]}
                    onPress={() => {
                      setPickerMonth(new Date(year, pickerMonth.getMonth(), 1));
                      setPickerMode("month");
                    }}
                  >
                    <Text style={[styles.yearRowText, pickerMonth.getFullYear() === year ? styles.yearRowTextActive : null]}>{year}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    heroCard: {
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      padding: 20,
      gap: 14,
      flexDirection: "row",
      alignItems: "center",
    },
    heroIconWrap: {
      width: 88,
      height: 88,
      borderRadius: 24,
      backgroundColor: theme.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(79, 131, 255, 0.22)",
      flexShrink: 0,
    },
    heroCopy: {
      flex: 1,
      gap: 8,
    },
    eyebrow: {
      color: theme.primary,
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    heroTitle: {
      color: theme.text,
      fontSize: 22,
      lineHeight: 30,
      fontWeight: "900",
    },
    heroText: {
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 21,
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20,
      gap: 16,
    },
    sectionBlock: {
      gap: 4,
    },
    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    sectionIcon: {
      width: 36,
      height: 36,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    sectionIconBlue: {
      backgroundColor: theme.primarySoft,
    },
    sectionIconGreen: {
      backgroundColor: "#e9fbf2",
    },
    sectionTitleCopy: {
      flex: 1,
      gap: 4,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "900",
    },
    sectionText: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 19,
    },
    fieldWrap: {
      gap: 8,
    },
    twoColumnRow: {
      flexDirection: "row",
      gap: 12,
      flexWrap: "wrap",
    },
    columnField: {
      flex: 1,
      minWidth: 148,
    },
    fieldLabel: {
      color: theme.textMuted,
      fontSize: 14,
      fontWeight: "700",
    },
    datePickerTrigger: {
      minHeight: 56,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    datePickerError: {
      borderColor: theme.danger,
    },
    datePickerValue: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "600",
    },
    datePickerPlaceholder: {
      color: theme.placeholder,
    },
    inlineError: {
      color: theme.danger,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: "600",
    },
    purokGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      alignItems: "center",
      gap: 10,
    },
    purokOption: {
      width: "31.4%",
      minHeight: 52,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      paddingHorizontal: 10,
    },
    purokOptionActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    purokOptionText: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "800",
    },
    purokOptionTextActive: {
      color: "#ffffff",
    },
    purokCheck: {
      position: "absolute",
      right: 8,
      top: 8,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: "#ffffff",
      alignItems: "center",
      justifyContent: "center",
    },
    passwordFields: {
      gap: 4,
    },
    buttonWrap: {
      paddingTop: 4,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.56)",
      justifyContent: "center",
      padding: 20,
    },
    modalSheet: {
      backgroundColor: theme.surface,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      gap: 14,
      maxHeight: "80%",
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    modalTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "800",
    },
    modalClose: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: "800",
    },
    pickerToolbar: {
      flexDirection: "row",
      gap: 8,
    },
    pickerModeButton: {
      flex: 1,
      minHeight: 40,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    pickerModeButtonActive: {
      backgroundColor: theme.primarySoft,
      borderColor: theme.primary,
    },
    pickerModeText: {
      color: theme.textMuted,
      fontSize: 13,
      fontWeight: "700",
    },
    pickerModeTextActive: {
      color: theme.primary,
    },
    calendarHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    calendarTitleButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    calendarTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "800",
    },
    weekRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    weekdayLabel: {
      width: "14.28%",
      textAlign: "center",
      color: theme.textSoft,
      fontSize: 12,
      fontWeight: "700",
    },
    calendarGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    dayCell: {
      width: "13.2%",
      aspectRatio: 1,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.inputBackground,
      borderWidth: 1,
      borderColor: theme.border,
    },
    dayCellEmpty: {
      backgroundColor: "transparent",
      borderColor: "transparent",
    },
    dayCellActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    dayCellText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "700",
    },
    dayCellTextActive: {
      color: "#ffffff",
    },
    monthGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    monthCell: {
      width: "31%",
      minHeight: 42,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    monthCellActive: {
      backgroundColor: theme.primarySoft,
      borderColor: theme.primary,
    },
    monthCellText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "700",
    },
    monthCellTextActive: {
      color: theme.primary,
    },
    yearList: {
      flexGrow: 0,
    },
    yearListContent: {
      gap: 8,
    },
    yearRow: {
      minHeight: 44,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    yearRowActive: {
      backgroundColor: theme.primarySoft,
      borderColor: theme.primary,
    },
    yearRowText: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "700",
    },
    yearRowTextActive: {
      color: theme.primary,
    },
  });
}
