import { useEffect, useMemo, useRef, useState } from "react";
import { Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AuthBackground from "../../components/common/AuthBackground";
import ScreenContainer from "../../components/common/ScreenContainer";
import AuthTextField from "../../components/forms/AuthTextField";
import PrimaryButton from "../../components/common/PrimaryButton";
import { useApp } from "../../storage/AppProvider";
import { clearRememberedLogin, loadRememberedLogin, saveRememberedLogin } from "../../storage/appStorage";
import useKeyboardAwareFieldFocus from "../../utils/useKeyboardAwareFieldFocus";
import { getLoginErrors, hasValidationErrors } from "../../utils/authValidation";
import { loginScreenStyles } from "../../styles/auth/LoginScreen.styles";

const logoSource = require("../../assets/images/brgywatch-logo.png");

export default function LoginScreen({ navigation }) {
  const { login } = useApp();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const ScreenWrapper = Platform.OS === "ios" ? KeyboardAvoidingView : View;
  const keyboardOffset = Math.max(insets.bottom, 18) + 72;
  const { handleFieldFocus, registerInputRef } = useKeyboardAwareFieldFocus({
    scrollRef,
    extraScrollHeight: keyboardOffset,
  });

  const errors = useMemo(() => getLoginErrors({ email, password }), [email, password]);
  const canSubmit = !hasValidationErrors(errors) && Boolean(email && password);

  const visibleError = (field) => (submitted || touched[field] ? errors[field] : "");

  useEffect(() => {
    let mounted = true;

    async function hydrateRememberedLogin() {
      const rememberedLogin = await loadRememberedLogin();

      if (!mounted || !rememberedLogin?.email) {
        return;
      }

      setEmail(rememberedLogin.email);
      setRememberMe(true);
    }

    hydrateRememberedLogin();

    return () => {
      mounted = false;
    };
  }, []);

  const handleBlur = (field) => {
    setTouched((current) => (current[field] ? current : { ...current, [field]: true }));
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    setSubmitError((current) => (current ? "" : current));
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    setSubmitError((current) => (current ? "" : current));
  };

  const handleRememberMeToggle = async () => {
    const nextRememberMe = !rememberMe;

    setRememberMe(nextRememberMe);

    if (!nextRememberMe) {
      await clearRememberedLogin();
    }
  };

  const handleLogin = async () => {
    setSubmitted(true);
    setTouched({ email: true, password: true });
    setSubmitError("");

    if (!canSubmit) {
      return;
    }

    try {
      Keyboard.dismiss();
      setSubmitting(true);
      await login(email.trim(), password);
      if (rememberMe) {
        await saveRememberedLogin({ email: email.trim().toLowerCase() });
      } else {
        await clearRememberedLogin();
      }
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={loginScreenStyles.screen}>
      <AuthBackground />
      <ScreenWrapper
        style={loginScreenStyles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <ScreenContainer
          scroll
          scrollRef={scrollRef}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          contentStyle={[loginScreenStyles.content, { paddingBottom: 52 + Math.max(insets.bottom, 18) }]}
          safeStyle={loginScreenStyles.safeArea}
        >
          <View style={loginScreenStyles.headerBlock}>
            <Image source={logoSource} style={loginScreenStyles.logo} resizeMode="contain" />
            <Text style={loginScreenStyles.title}>Welcome Back</Text>
            <Text style={loginScreenStyles.subtitle}>Sign in to continue to your account.</Text>
          </View>

          <View style={loginScreenStyles.card}>
            <AuthTextField
              label="Email"
              value={email}
              onChangeText={handleEmailChange}
              placeholder="name@email.com"
              keyboardType="email-address"
              autoComplete="email"
              inputRef={registerInputRef("email")}
              onBlur={() => handleBlur("email")}
              onFocus={handleFieldFocus("email")}
              error={visibleError("email")}
            />

            <AuthTextField
              label="Password"
              value={password}
              onChangeText={handlePasswordChange}
              placeholder="Enter your password"
              secureTextEntry
              showSecureToggle
              isPasswordVisible={showPassword}
              onToggleSecureEntry={() => setShowPassword((current) => !current)}
              autoComplete="password"
              inputRef={registerInputRef("password")}
              onBlur={() => handleBlur("password")}
              onFocus={handleFieldFocus("password")}
              error={visibleError("password")}
            />

            {submitError ? <Text style={loginScreenStyles.submitError}>{submitError}</Text> : null}

            <View style={loginScreenStyles.rememberRow}>
              <Pressable
                onPress={handleRememberMeToggle}
                style={loginScreenStyles.rememberPressable}
                android_ripple={{ color: "transparent" }}
              >
                <View style={[loginScreenStyles.checkbox, rememberMe ? loginScreenStyles.checkboxChecked : null]}>
                  {rememberMe ? <Ionicons name="checkmark" size={15} color="#dbeafe" /> : null}
                </View>
                <Text style={loginScreenStyles.rememberLabel}>Remember Me</Text>
              </Pressable>

              <Pressable onPress={() => navigation.navigate("ForgotPassword")} android_ripple={{ color: "transparent" }}>
                <Text style={loginScreenStyles.forgotLink}>Forgot Password?</Text>
              </Pressable>
            </View>

            <PrimaryButton label="Sign In" onPress={handleLogin} disabled={submitting} loading={submitting} />

            <View style={loginScreenStyles.footerRow}>
              <Text style={loginScreenStyles.footerText}>Don&apos;t have an account?</Text>
              <Pressable onPress={() => navigation.navigate("Signup")} android_ripple={{ color: "transparent" }}>
                <Text style={loginScreenStyles.footerLink}>Create Account</Text>
              </Pressable>
            </View>

            <Pressable
              style={loginScreenStyles.secondaryAction}
              onPress={() => navigation.navigate("Welcome")}
              android_ripple={{ color: "transparent" }}
            >
              <Text style={loginScreenStyles.secondaryLink}>Go to Welcome Screen</Text>
            </Pressable>
          </View>
        </ScreenContainer>
      </ScreenWrapper>
    </View>
  );
}
