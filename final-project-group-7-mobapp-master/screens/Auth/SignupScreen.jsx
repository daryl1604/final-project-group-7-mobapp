import { useMemo, useRef, useState } from "react";
import { Image, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AuthBackground from "../../components/common/AuthBackground";
import ScreenContainer from "../../components/common/ScreenContainer";
import AuthTextField from "../../components/forms/AuthTextField";
import OptionSelector from "../../components/forms/OptionSelector";
import PasswordStrengthIndicator from "../../components/forms/PasswordStrengthIndicator";
import PrimaryButton from "../../components/common/PrimaryButton";
import { PUROK_OPTIONS } from "../../constants/appConstants";
import { useApp } from "../../storage/AppProvider";
import useKeyboardAwareFieldFocus from "../../utils/useKeyboardAwareFieldFocus";
import {
  calculateAgeFromDob,
  findPhoneConflict,
  GENDER_OPTIONS,
  getPasswordStrength,
  getSignupErrors,
  hasValidationErrors,
  normalizePhoneNumber,
} from "../../utils/authValidation";
import { signupScreenStyles } from "../../styles/auth/SignupScreen.styles";

const logoSource = require("../../assets/images/brgywatch-logo.png");
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const INITIAL_FORM = {
  fullName: "",
  email: "",
  contactNumber: "",
  purok: PUROK_OPTIONS[0],
  address: "",
  dateOfBirth: "",
  gender: "",
  age: "",
  password: "",
  confirmPassword: "",
};

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

export default function SignupScreen({ navigation }) {
  const { accounts, signupResident } = useApp();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [createdAccountId, setCreatedAccountId] = useState(null);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState("day");
  const [pickerMonth, setPickerMonth] = useState(() => {
    const initialDate = new Date();
    initialDate.setFullYear(initialDate.getFullYear() - 18);
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  });
  const ScreenWrapper = Platform.OS === "ios" ? KeyboardAvoidingView : View;
  const keyboardOffset = Math.max(insets.bottom, 18) + 76;
  const { handleFieldFocus, registerInputRef } = useKeyboardAwareFieldFocus({
    scrollRef,
    extraScrollHeight: keyboardOffset,
  });

  const normalizedEmail = form.email.trim().toLowerCase();
  const normalizedPhone = normalizePhoneNumber(form.contactNumber);
  const passwordStrength = getPasswordStrength(form.password);
  const duplicateEmail = accounts.some(
    (account) => account.id !== createdAccountId && account.email.trim().toLowerCase() === normalizedEmail
  );
  const duplicatePhone = Boolean(findPhoneConflict(accounts, normalizedPhone, createdAccountId));

  const errors = useMemo(() => {
    const baseErrors = getSignupErrors(form);
    const finalErrors = { ...baseErrors };

    if ((submitted || touched.email) && !baseErrors.email && duplicateEmail) {
      finalErrors.email = "Email is already registered.";
    }

    if ((submitted || touched.contactNumber) && !baseErrors.contactNumber && duplicatePhone) {
      finalErrors.contactNumber = "Phone number is already registered.";
    }

    return finalErrors;
  }, [duplicateEmail, duplicatePhone, form, submitted, touched.contactNumber, touched.email]);

  const canSubmit =
    !hasValidationErrors(errors) &&
    Boolean(
      form.fullName &&
        form.email &&
        form.contactNumber &&
        form.address &&
        form.dateOfBirth &&
        form.gender &&
        form.age &&
        form.password &&
        form.confirmPassword &&
        form.purok
    );

  const calendarDays = useMemo(() => buildCalendarDays(pickerMonth), [pickerMonth]);
  const dobDisplayValue = formatDateLabel(form.dateOfBirth);
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 121 }, (_, index) => currentYear - index);
  }, []);

  const updateField = (key, value) => {
    setForm((current) => (current[key] === value ? current : { ...current, [key]: value }));
    setSubmitError((current) => (current ? "" : current));
    setSuccessMessage((current) => (current ? "" : current));
    setCreatedAccountId((current) => (current ? null : current));
  };

  const updateDateOfBirth = (nextDate) => {
    const dateValue = formatDateValue(nextDate);
    const nextAge = calculateAgeFromDob(dateValue);

    setForm((current) =>
      current.dateOfBirth === dateValue && current.age === nextAge
        ? current
        : {
            ...current,
            dateOfBirth: dateValue,
            age: nextAge,
          }
    );
    setTouched((current) => ({
      ...current,
      dateOfBirth: true,
      age: true,
    }));
    setSubmitError((current) => (current ? "" : current));
    setSuccessMessage((current) => (current ? "" : current));
    setCreatedAccountId((current) => (current ? null : current));
  };

  const visibleError = (field) => (successMessage ? "" : submitted || touched[field] ? errors[field] : "");

  const handleBlur = (field) => {
    setTouched((current) => (current[field] ? current : { ...current, [field]: true }));
  };

  const openDobPicker = () => {
    const baseDate = form.dateOfBirth ? new Date(`${form.dateOfBirth}T00:00:00`) : new Date();
    setPickerMonth(new Date(baseDate.getFullYear(), baseDate.getMonth(), 1));
    setPickerMode("day");
    setShowDobPicker(true);
  };

  const closeDobPicker = () => {
    setShowDobPicker(false);
    setPickerMode("day");
    handleBlur("dateOfBirth");
  };

  const handleSelectDob = (selectedDate) => {
    updateDateOfBirth(selectedDate);
    setShowDobPicker(false);
    setPickerMode("day");
  };

  const handleSignup = async () => {
    setSubmitted(true);
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
      contactNumber: true,
      address: true,
      dateOfBirth: true,
      gender: true,
      age: true,
      purok: true,
    });
    setSubmitError("");
    setSuccessMessage("");

    if (!canSubmit) {
      return;
    }

    try {
      Keyboard.dismiss();
      setSubmitting(true);
      const nextResident = await signupResident({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        contactNumber: normalizedPhone,
        purok: form.purok,
        address: form.address.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        age: Number(form.age),
        password: form.password,
      });
      setCreatedAccountId(nextResident.id);
      setSubmitted(false);
      setTouched({});
      setSubmitError("");
      setForm(INITIAL_FORM);
      setShowPassword(false);
      setShowConfirmPassword(false);
      setShowDobPicker(false);
      setPickerMode("day");
      setSuccessMessage("Account created successfully. Please sign in.");
      setTimeout(() => {
        navigation.replace("Login");
      }, 1500);
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={signupScreenStyles.screen}>
      <AuthBackground />
      <ScreenWrapper
        style={signupScreenStyles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <ScreenContainer
          scrollRef={scrollRef}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          contentStyle={[signupScreenStyles.content, { paddingBottom: 60 + Math.max(insets.bottom, 18) }]}
          safeStyle={signupScreenStyles.safeArea}
        >
          <View style={signupScreenStyles.headerBlock}>
            <Image source={logoSource} style={signupScreenStyles.logo} resizeMode="contain" />
            <Text style={signupScreenStyles.title}>Create Your Account</Text>
            <Text style={signupScreenStyles.subtitle}>Set up your resident access in a few simple steps.</Text>
          </View>

          <View style={signupScreenStyles.card}>
            <AuthTextField
              label="Full Name"
              value={form.fullName}
              onChangeText={(value) => updateField("fullName", value)}
              placeholder="Juan Dela Cruz"
              autoCapitalize="words"
              autoComplete="name"
              inputRef={registerInputRef("fullName")}
              onBlur={() => handleBlur("fullName")}
              onFocus={handleFieldFocus("fullName")}
              error={visibleError("fullName")}
            />

            <AuthTextField
              label="Email"
              value={form.email}
              onChangeText={(value) => updateField("email", value)}
              placeholder="name@email.com"
              keyboardType="email-address"
              autoComplete="email"
              inputRef={registerInputRef("email")}
              onBlur={() => handleBlur("email")}
              onFocus={handleFieldFocus("email")}
              error={visibleError("email")}
            />

            <AuthTextField
              label="Phone Number"
              value={form.contactNumber}
              onChangeText={(value) => updateField("contactNumber", value)}
              placeholder="09xxxxxxxxx"
              keyboardType="number-pad"
              autoComplete="tel"
              maxLength={11}
              inputRef={registerInputRef("contactNumber")}
              onBlur={() => handleBlur("contactNumber")}
              onFocus={handleFieldFocus("contactNumber")}
              error={visibleError("contactNumber")}
            />

            <AuthTextField
              label="Address"
              value={form.address}
              onChangeText={(value) => updateField("address", value)}
              placeholder="e.g., 123 Main Street, Barangay"
              autoCapitalize="words"
              autoComplete="street-address"
              inputRef={registerInputRef("address")}
              onBlur={() => handleBlur("address")}
              onFocus={handleFieldFocus("address")}
              error={visibleError("address")}
            />

            <View style={signupScreenStyles.selectorBlock}>
              <Text style={signupScreenStyles.customFieldLabel}>Date of Birth</Text>
              <Pressable
                style={[
                  signupScreenStyles.customFieldShell,
                  visibleError("dateOfBirth") ? signupScreenStyles.customFieldShellError : null,
                ]}
                onPress={openDobPicker}
              >
                <Text
                  style={[
                    signupScreenStyles.customFieldValue,
                    !dobDisplayValue ? signupScreenStyles.customFieldPlaceholder : null,
                  ]}
                >
                  {dobDisplayValue || "Select your date of birth"}
                </Text>
              </Pressable>
              {visibleError("dateOfBirth") ? (
                <Text style={signupScreenStyles.fieldError}>{visibleError("dateOfBirth")}</Text>
              ) : null}
            </View>

            <View style={signupScreenStyles.selectorBlock}>
              <OptionSelector
                label="Gender"
                value={form.gender}
                onChange={(value) => {
                  updateField("gender", value);
                  handleBlur("gender");
                }}
                options={GENDER_OPTIONS}
                variant="auth"
              />
              {visibleError("gender") ? <Text style={signupScreenStyles.fieldError}>{visibleError("gender")}</Text> : null}
            </View>

            <View style={signupScreenStyles.selectorBlock}>
              <Text style={signupScreenStyles.customFieldLabel}>Age</Text>
              <View
                style={[
                  signupScreenStyles.customFieldShell,
                  signupScreenStyles.readOnlyFieldShell,
                  visibleError("age") ? signupScreenStyles.customFieldShellError : null,
                ]}
              >
                <Text
                  style={[
                    signupScreenStyles.customFieldValue,
                    !form.age ? signupScreenStyles.customFieldPlaceholder : null,
                  ]}
                >
                  {form.age || "Age will appear after selecting your birth date"}
                </Text>
              </View>
              {visibleError("age") ? <Text style={signupScreenStyles.fieldError}>{visibleError("age")}</Text> : null}
            </View>

            <View style={signupScreenStyles.selectorBlock}>
              <OptionSelector
                label="Purok"
                value={form.purok}
                onChange={(value) => {
                  updateField("purok", value);
                  setTouched((current) => (current.purok ? current : { ...current, purok: true }));
                }}
                options={PUROK_OPTIONS}
                variant="auth"
              />
              {visibleError("purok") ? <Text style={signupScreenStyles.fieldError}>{visibleError("purok")}</Text> : null}
            </View>

            <AuthTextField
              label="Password"
              value={form.password}
              onChangeText={(value) => updateField("password", value)}
              placeholder="Create a strong password"
              secureTextEntry
              showSecureToggle
              isPasswordVisible={showPassword}
              onToggleSecureEntry={() => setShowPassword((current) => !current)}
              autoComplete="new-password"
              inputRef={registerInputRef("password")}
              onBlur={() => handleBlur("password")}
              onFocus={handleFieldFocus("password")}
              error={visibleError("password")}
            />

            {form.password ? <PasswordStrengthIndicator strength={passwordStrength} /> : null}

            <AuthTextField
              label="Confirm Password"
              value={form.confirmPassword}
              onChangeText={(value) => updateField("confirmPassword", value)}
              placeholder="Confirm your password"
              secureTextEntry
              showSecureToggle
              isPasswordVisible={showConfirmPassword}
              onToggleSecureEntry={() => setShowConfirmPassword((current) => !current)}
              autoComplete="new-password"
              inputRef={registerInputRef("confirmPassword")}
              onBlur={() => handleBlur("confirmPassword")}
              onFocus={handleFieldFocus("confirmPassword")}
              error={visibleError("confirmPassword")}
            />

            {submitError ? <Text style={signupScreenStyles.submitError}>{submitError}</Text> : null}

            {successMessage ? (
              <Text style={[signupScreenStyles.submitError, { backgroundColor: "#ecfdf5", color: "#059669" }]}>
                {successMessage}
              </Text>
            ) : null}

            <PrimaryButton
              label="Create Account"
              onPress={handleSignup}
              disabled={submitting}
              loading={submitting}
              variant="primary"
            />

            <View style={signupScreenStyles.footerRow}>
              <Text style={signupScreenStyles.footerText}>Already have an account?</Text>
              <Pressable onPress={() => navigation.replace("Login")} android_ripple={{ color: "transparent" }}>
                <Text style={signupScreenStyles.footerLink}>Sign In</Text>
              </Pressable>
            </View>

            <Pressable
              style={signupScreenStyles.secondaryAction}
              onPress={() => navigation.replace("Welcome")}
              android_ripple={{ color: "transparent" }}
            >
              <Text style={signupScreenStyles.secondaryLink}>Go to Welcome Screen</Text>
            </Pressable>
          </View>
        </ScreenContainer>
      </ScreenWrapper>

      <Modal visible={showDobPicker} transparent animationType="fade" onRequestClose={closeDobPicker}>
        <View style={signupScreenStyles.datePickerOverlay}>
          <Pressable style={signupScreenStyles.datePickerBackdrop} onPress={closeDobPicker} />
          <View style={signupScreenStyles.datePickerCard}>
            <View style={signupScreenStyles.datePickerHeader}>
              <Text style={signupScreenStyles.datePickerTitle}>Select Date of Birth</Text>
              <Pressable style={signupScreenStyles.datePickerClose} onPress={closeDobPicker}>
                <Text style={signupScreenStyles.datePickerCloseText}>Close</Text>
              </Pressable>
            </View>

            <View style={signupScreenStyles.datePickerMonthRow}>
              <Pressable
                style={signupScreenStyles.datePickerArrow}
                onPress={() =>
                  setPickerMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
                }
                disabled={pickerMode !== "day"}
              >
                <Text style={signupScreenStyles.datePickerArrowText}>{"<"}</Text>
              </Pressable>

              <View style={signupScreenStyles.datePickerMonthControls}>
                <Pressable
                  style={[
                    signupScreenStyles.datePickerHeaderPill,
                    pickerMode === "month" ? signupScreenStyles.datePickerHeaderPillActive : null,
                  ]}
                  onPress={() => setPickerMode("month")}
                >
                  <Text
                    style={[
                      signupScreenStyles.datePickerHeaderPillText,
                      pickerMode === "month" ? signupScreenStyles.datePickerHeaderPillTextActive : null,
                    ]}
                  >
                    {pickerMonth.toLocaleDateString("en-US", { month: "long" })}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    signupScreenStyles.datePickerHeaderPill,
                    pickerMode === "year" ? signupScreenStyles.datePickerHeaderPillActive : null,
                  ]}
                  onPress={() => setPickerMode("year")}
                >
                  <Text
                    style={[
                      signupScreenStyles.datePickerHeaderPillText,
                      pickerMode === "year" ? signupScreenStyles.datePickerHeaderPillTextActive : null,
                    ]}
                  >
                    {pickerMonth.getFullYear()}
                  </Text>
                </Pressable>
              </View>

              <Pressable
                style={signupScreenStyles.datePickerArrow}
                onPress={() =>
                  setPickerMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
                }
                disabled={pickerMode !== "day"}
              >
                <Text style={signupScreenStyles.datePickerArrowText}>{">"}</Text>
              </Pressable>
            </View>

            {pickerMode === "day" ? (
              <>
                <View style={signupScreenStyles.datePickerWeekdays}>
                  {WEEKDAY_LABELS.map((label) => (
                    <View key={label} style={signupScreenStyles.datePickerCellSlot}>
                      <Text style={signupScreenStyles.datePickerWeekdayText}>{label}</Text>
                    </View>
                  ))}
                </View>

                <View style={signupScreenStyles.datePickerGrid}>
                  {calendarDays.map((date, index) => {
                    if (!date) {
                      return <View key={`empty-${index}`} style={signupScreenStyles.datePickerCellSlot} />;
                    }

                    const dateValue = formatDateValue(date);
                    const isSelected = dateValue === form.dateOfBirth;
                    const isFuture = date.getTime() > new Date().getTime();

                    return (
                      <View key={dateValue} style={signupScreenStyles.datePickerCellSlot}>
                        <Pressable
                          style={[
                            signupScreenStyles.datePickerDay,
                            isSelected ? signupScreenStyles.datePickerDayActive : null,
                            isFuture ? signupScreenStyles.datePickerDayDisabled : null,
                          ]}
                          onPress={() => handleSelectDob(date)}
                          disabled={isFuture}
                        >
                          <Text
                            style={[
                              signupScreenStyles.datePickerDayText,
                              isSelected ? signupScreenStyles.datePickerDayTextActive : null,
                              isFuture ? signupScreenStyles.datePickerDayTextDisabled : null,
                            ]}
                          >
                            {date.getDate()}
                          </Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </>
            ) : null}

            {pickerMode === "month" ? (
              <View style={signupScreenStyles.selectionGrid}>
                {MONTH_LABELS.map((monthLabel, monthIndex) => {
                  const isActive = pickerMonth.getMonth() === monthIndex;

                  return (
                    <View key={monthLabel} style={signupScreenStyles.selectionGridItem}>
                      <Pressable
                        style={[
                          signupScreenStyles.selectionPill,
                          isActive ? signupScreenStyles.selectionPillActive : null,
                        ]}
                        onPress={() => {
                          setPickerMonth((current) => new Date(current.getFullYear(), monthIndex, 1));
                          setPickerMode("day");
                        }}
                      >
                        <Text
                          style={[
                            signupScreenStyles.selectionPillText,
                            isActive ? signupScreenStyles.selectionPillTextActive : null,
                          ]}
                        >
                          {monthLabel}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {pickerMode === "year" ? (
              <ScrollView
                style={signupScreenStyles.yearScroll}
                contentContainerStyle={signupScreenStyles.selectionGrid}
                showsVerticalScrollIndicator={false}
              >
                {yearOptions.map((yearValue) => {
                  const isActive = pickerMonth.getFullYear() === yearValue;

                  return (
                    <View key={yearValue} style={signupScreenStyles.selectionGridItem}>
                      <Pressable
                        style={[
                          signupScreenStyles.selectionPill,
                          isActive ? signupScreenStyles.selectionPillActive : null,
                        ]}
                        onPress={() => {
                          setPickerMonth((current) => new Date(yearValue, current.getMonth(), 1));
                          setPickerMode("day");
                        }}
                      >
                        <Text
                          style={[
                            signupScreenStyles.selectionPillText,
                            isActive ? signupScreenStyles.selectionPillTextActive : null,
                          ]}
                        >
                          {yearValue}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}
