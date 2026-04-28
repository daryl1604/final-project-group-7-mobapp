import { useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
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
const FIELD_ORDER = [
  "fullName",
  "email",
  "contactNumber",
  "address",
  "dateOfBirth",
  "gender",
  "age",
  "purok",
  "password",
  "confirmPassword",
  "agreement",
];
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
const POLICY_COPY = {
  privacy: {
    title: "Privacy Policy",
    sections: [
      {
        heading: "Data Collected",
        body:
          "We collect your account details such as your name, contact information, report history, and submitted location details when you use the app.",
      },
      {
        heading: "Purpose",
        body:
          "Your information is used to provide barangay services, manage your resident account, and track community reports and follow-up actions.",
      },
      {
        heading: "Data Protection",
        body:
          "We take reasonable steps to protect your information and limit access to authorized barangay personnel who need it for service delivery.",
      },
      {
        heading: "User Rights",
        body:
          "You may view, update, or request deletion of your account information, subject to barangay record-keeping requirements and applicable policies.",
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    sections: [
      {
        heading: "User Responsibilities",
        body:
          "Residents must provide accurate account details and submit truthful, relevant, and respectful reports through the system.",
      },
      {
        heading: "Prohibited Actions",
        body:
          "False reporting, spam submissions, harassment, abusive language, and misuse of the reporting tools are not allowed.",
      },
      {
        heading: "Admin Rights",
        body:
          "Barangay administrators may review, verify, reject, or follow up on submitted reports to keep the platform safe and useful.",
      },
      {
        heading: "Agreement",
        body:
          "By creating an account, you acknowledge these rules and agree to use the app responsibly and in good faith.",
      },
    ],
  },
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
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [agreementTouched, setAgreementTouched] = useState(false);
  const [activePolicy, setActivePolicy] = useState(null);
  const fieldLayoutsRef = useRef({});
  const [pickerMonth, setPickerMonth] = useState(() => {
    const initialDate = new Date();
    initialDate.setFullYear(initialDate.getFullYear() - 18);
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  });
  const ScreenWrapper = Platform.OS === "ios" ? KeyboardAvoidingView : View;
  const keyboardOffset = Math.max(insets.bottom, 18) + 76;
  const { handleFieldFocus, registerInputRef, focusField } = useKeyboardAwareFieldFocus({
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

    if ((submitted || agreementTouched) && !agreementChecked) {
      finalErrors.agreement = "You must agree to the Privacy Policy and Terms of Service";
    }

    return finalErrors;
  }, [agreementChecked, agreementTouched, duplicateEmail, duplicatePhone, form, submitted, touched.contactNumber, touched.email]);

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
        form.purok &&
        agreementChecked
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
  const visibleAgreementError = successMessage ? "" : submitted || agreementTouched ? errors.agreement : "";

  const getSubmitErrors = () => {
    const nextErrors = {
      ...getSignupErrors(form),
    };

    if (!nextErrors.email && duplicateEmail) {
      nextErrors.email = "Email is already registered.";
    }

    if (!nextErrors.contactNumber && duplicatePhone) {
      nextErrors.contactNumber = "Phone number is already registered.";
    }

    if (!agreementChecked) {
      nextErrors.agreement = "You must agree to the Privacy Policy and Terms of Service";
    }

    return nextErrors;
  };

  const handleBlur = (field) => {
    setTouched((current) => (current[field] ? current : { ...current, [field]: true }));
  };

  const registerFieldLayout = (field) => (event) => {
    fieldLayoutsRef.current[field] = event.nativeEvent.layout.y;
  };

  const scrollToMeasuredField = (field) => {
    const y = fieldLayoutsRef.current[field];

    if (typeof y !== "number") {
      return false;
    }

    Keyboard.dismiss();
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo?.({
        y: Math.max(y - 28, 0),
        animated: true,
      });
    });
    return true;
  };

  const focusFirstInvalidField = (nextErrors) => {
    const firstInvalidField = FIELD_ORDER.find((field) => nextErrors[field]);

    if (!firstInvalidField) {
      return;
    }

    const focused = focusField(firstInvalidField);

    if (focused) {
      return;
    }

    scrollToMeasuredField(firstInvalidField);
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
    const submitErrors = getSubmitErrors();

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
    setAgreementTouched(true);
    setSubmitError("");
    setSuccessMessage("");

    if (hasValidationErrors(submitErrors) || !canSubmit) {
      focusFirstInvalidField(submitErrors);
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
      setAgreementChecked(false);
      setAgreementTouched(false);
      fieldLayoutsRef.current = {};
      setSuccessMessage("Account created successfully. Please sign in.");
      setTimeout(() => {
        navigation.navigate("Login");
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

            <View style={signupScreenStyles.selectorBlock} onLayout={registerFieldLayout("dateOfBirth")}>
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

            <View style={signupScreenStyles.selectorBlock} onLayout={registerFieldLayout("gender")}>
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

            <View style={signupScreenStyles.selectorBlock} onLayout={registerFieldLayout("age")}>
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

            <View style={signupScreenStyles.selectorBlock} onLayout={registerFieldLayout("purok")}>
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

            <View style={signupScreenStyles.agreementSection} onLayout={registerFieldLayout("agreement")}>
              <View
                style={signupScreenStyles.agreementRow}
              >
                <Pressable
                  style={signupScreenStyles.checkboxTapTarget}
                  onPress={() => {
                    setAgreementChecked((current) => !current);
                    setAgreementTouched(true);
                  }}
                >
                  <View
                    style={[
                      signupScreenStyles.checkbox,
                      agreementChecked ? signupScreenStyles.checkboxChecked : null,
                      visibleAgreementError ? signupScreenStyles.checkboxError : null,
                    ]}
                  >
                    {agreementChecked ? <Ionicons name="checkmark" size={15} color="#ffffff" /> : null}
                  </View>
                </Pressable>
                <Text style={signupScreenStyles.agreementText}>
                  I agree to the{" "}
                  <Text style={signupScreenStyles.linkText} onPress={() => setActivePolicy("privacy")}>
                    Privacy Policy
                  </Text>{" "}
                  and{" "}
                  <Text style={signupScreenStyles.linkText} onPress={() => setActivePolicy("terms")}>
                    Terms of Service
                  </Text>
                </Text>
              </View>
              {visibleAgreementError ? <Text style={signupScreenStyles.fieldError}>{visibleAgreementError}</Text> : null}
            </View>

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
              <Pressable onPress={() => navigation.navigate("Login")} android_ripple={{ color: "transparent" }}>
                <Text style={signupScreenStyles.footerLink}>Sign In</Text>
              </Pressable>
            </View>

            <Pressable
              style={signupScreenStyles.secondaryAction}
              onPress={() => navigation.navigate("Welcome")}
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

      <Modal visible={Boolean(activePolicy)} transparent animationType="fade" onRequestClose={() => setActivePolicy(null)}>
        <View style={signupScreenStyles.policyOverlay}>
          <Pressable style={signupScreenStyles.policyBackdrop} onPress={() => setActivePolicy(null)} />
          <View style={signupScreenStyles.policyCard}>
            <View style={signupScreenStyles.policyHeader}>
              <Text style={signupScreenStyles.policyTitle}>{activePolicy ? POLICY_COPY[activePolicy].title : ""}</Text>
              <Pressable style={signupScreenStyles.policyClose} onPress={() => setActivePolicy(null)}>
                <Text style={signupScreenStyles.policyCloseText}>Close</Text>
              </Pressable>
            </View>
            <ScrollView style={signupScreenStyles.policyScroll} contentContainerStyle={signupScreenStyles.policyScrollContent}>
              {activePolicy
                ? POLICY_COPY[activePolicy].sections.map((section) => (
                    <View key={section.heading} style={signupScreenStyles.policySection}>
                      <Text style={signupScreenStyles.policySectionTitle}>{section.heading}</Text>
                      <Text style={signupScreenStyles.policyBody}>{section.body}</Text>
                    </View>
                  ))
                : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
