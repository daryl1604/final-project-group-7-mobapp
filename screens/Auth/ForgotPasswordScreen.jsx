import { useMemo, useRef, useState } from "react";
import { Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AuthBackground from "../../components/common/AuthBackground";
import ScreenContainer from "../../components/common/ScreenContainer";
import AuthTextField from "../../components/forms/AuthTextField";
import PasswordStrengthIndicator from "../../components/forms/PasswordStrengthIndicator";
import PrimaryButton from "../../components/common/PrimaryButton";
import { useApp } from "../../storage/AppProvider";
import useKeyboardAwareFieldFocus from "../../utils/useKeyboardAwareFieldFocus";
import {
  getEmailForgotPasswordErrors,
  getPasswordStrength,
  hasValidationErrors,
  isSamePassword,
  normalizePhoneNumber,
  validatePhoneNumber,
} from "../../utils/authValidation";
import { forgotPasswordScreenStyles } from "../../styles/auth/ForgotPasswordScreen.styles";

const logoSource = require("../../assets/images/brgywatch-logo.png");

export default function ForgotPasswordScreen({ navigation }) {
  const { accounts, resetPasswordByEmail } = useApp();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [verifiedAccount, setVerifiedAccount] = useState(null);
  const [resetCompleted, setResetCompleted] = useState(false);
  const ScreenWrapper = Platform.OS === "ios" ? KeyboardAvoidingView : View;
  const keyboardOffset = Math.max(insets.bottom, 18) + 76;
  const { handleFieldFocus, registerInputRef, scrollToField } = useKeyboardAwareFieldFocus({
    scrollRef,
    extraScrollHeight: keyboardOffset,
  });
  const matchedAccount = accounts.find((account) => {
    const normalizedEmail = account.email.trim().toLowerCase();
    const normalizedContactNumber = normalizePhoneNumber(account.contactNumber);

    return (
      normalizedEmail === String(form.email || "").trim().toLowerCase() &&
      normalizedContactNumber === normalizePhoneNumber(form.phoneNumber)
    );
  });
  const passwordStrength = getPasswordStrength(form.password);
  const errors = useMemo(() => {
    const baseErrors = getEmailForgotPasswordErrors(form, step);
    const finalErrors = {
      ...baseErrors,
      phoneNumber: step === 1 ? validatePhoneNumber(form.phoneNumber) : "",
    };

    if (
      step === 2 &&
      !resetCompleted &&
      !baseErrors.password &&
      isSamePassword(verifiedAccount?.previousPassword, form.password)
    ) {
      finalErrors.password = "New password must be different from your previous password.";
    }

    return finalErrors;
  }, [form, resetCompleted, step, verifiedAccount?.previousPassword]);
  const canSubmit =
    !hasValidationErrors(errors) &&
    (step === 1
      ? Boolean(form.email && form.phoneNumber)
      : Boolean(form.email && form.phoneNumber && form.password && form.confirmPassword));
  const resetButtonDisabled = step === 2 ? submitting || !canSubmit || resetCompleted : submitting;

  const updateField = (key, value) => {
    setForm((current) => (current[key] === value ? current : { ...current, [key]: value }));
    setMessage((current) => (current ? "" : current));
    setMessageType((current) => (current ? "" : current));
    if (key === "email" || key === "phoneNumber") {
      setVerifiedAccount(null);
    }
    if (key === "password" || key === "confirmPassword") {
      setResetCompleted(false);
    }
  };

  const visibleError = (field) => (submitted || touched[field] ? errors[field] : "");

  const handleBlur = (field) => {
    setTouched((current) => (current[field] ? current : { ...current, [field]: true }));
  };

  const handleCheckDetails = () => {
    setSubmitted(true);
    setTouched({ email: true, phoneNumber: true });
    setMessage("");
    setMessageType("");
    if (!canSubmit) {
      return;
    }
    if (!matchedAccount) {
      setMessage("Account details do not match our records.");
      setMessageType("error");
      return;
    }

    setVerifiedAccount({
      id: matchedAccount.id,
      previousPassword: matchedAccount.password,
    });
    setResetCompleted(false);
    setStep(2);
    setSubmitted(false);
    setTouched({ email: true, phoneNumber: true });
    setMessage("Account verified. You can now set a new password.");
    setMessageType("success");
    setTimeout(() => {
      scrollToField("password");
    }, 0);
  };

  const handleReset = async () => {
    setSubmitted(true);
    setTouched({ email: true, phoneNumber: true, password: true, confirmPassword: true });
    setMessage("");
    setMessageType("");
    if (!canSubmit) {
      return;
    }
    if (!verifiedAccount || !matchedAccount || matchedAccount.id !== verifiedAccount.id) {
      setMessage("Account details do not match our records.");
      setMessageType("error");
      return;
    }

    try {
      Keyboard.dismiss();
      setSubmitting(true);
      await resetPasswordByEmail(form.email.trim(), form.password);
      setResetCompleted(true);
      setSubmitted(false);
      setTouched({ email: true, phoneNumber: true });
      setMessage("Password updated successfully. Please sign in.");
      setMessageType("success");
      setTimeout(() => {
        navigation.replace("Login");
      }, 900);
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={forgotPasswordScreenStyles.screen}>
      <AuthBackground />
      <ScreenWrapper
        style={forgotPasswordScreenStyles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <ScreenContainer
          scroll
          scrollRef={scrollRef}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          contentStyle={[forgotPasswordScreenStyles.content, { paddingBottom: 52 + Math.max(insets.bottom, 18) }]}
          safeStyle={forgotPasswordScreenStyles.safeArea}
        >
          <View style={forgotPasswordScreenStyles.hero}>
            <Image source={logoSource} style={forgotPasswordScreenStyles.logo} resizeMode="contain" />
            <Text style={forgotPasswordScreenStyles.title}>Reset Your Password</Text>
            <Text style={forgotPasswordScreenStyles.subtitle}>Enter your email and phone number to reset your password.</Text>
          </View>

          <View style={forgotPasswordScreenStyles.card}>
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
              value={form.phoneNumber}
              onChangeText={(value) => updateField("phoneNumber", value)}
              placeholder="09xxxxxxxxx"
              keyboardType="number-pad"
              autoComplete="tel"
              maxLength={11}
              inputRef={registerInputRef("phoneNumber")}
              onBlur={() => handleBlur("phoneNumber")}
              onFocus={handleFieldFocus("phoneNumber")}
              error={visibleError("phoneNumber")}
            />

            {step === 2 ? (
              <>
                <AuthTextField
                  label="New Password"
                  value={form.password}
                  onChangeText={(value) => updateField("password", value)}
                  placeholder="Enter new password"
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
                  label="Confirm New Password"
                  value={form.confirmPassword}
                  onChangeText={(value) => updateField("confirmPassword", value)}
                  placeholder="Confirm new password"
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
              </>
            ) : null}

            {message ? (
              <Text
                style={[
                  forgotPasswordScreenStyles.message,
                  messageType === "success"
                    ? forgotPasswordScreenStyles.messageSuccess
                    : forgotPasswordScreenStyles.messageError,
                ]}
              >
                {message}
              </Text>
            ) : null}

            <PrimaryButton
              label={step === 1 ? "Continue" : "Reset Password"}
              onPress={step === 1 ? handleCheckDetails : handleReset}
              disabled={resetButtonDisabled}
              loading={submitting}
            />

            <Pressable onPress={() => navigation.replace("Login")} android_ripple={{ color: "transparent" }}>
              <Text style={forgotPasswordScreenStyles.link}>Back to Sign In</Text>
            </Pressable>

            <Pressable
              style={forgotPasswordScreenStyles.secondaryAction}
              onPress={() => navigation.replace("Welcome")}
              android_ripple={{ color: "transparent" }}
            >
              <Text style={forgotPasswordScreenStyles.secondaryLink}>Go to Welcome Screen</Text>
            </Pressable>
          </View>
        </ScreenContainer>
      </ScreenWrapper>
    </View>
  );
}
