import { useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import AppHeader from "../../components/common/AppHeader";
import PrimaryButton from "../../components/common/PrimaryButton";
import ScreenContainer from "../../components/common/ScreenContainer";
import FormField from "../../components/forms/FormField";
import OptionSelector from "../../components/forms/OptionSelector";
import { PUROK_OPTIONS } from "../../constants/appConstants";
import { useApp } from "../../storage/AppProvider";
import useKeyboardAwareFieldFocus from "../../utils/useKeyboardAwareFieldFocus";
import {
  validateAddress,
  validateConfirmPassword,
  validateDateOfBirth,
  validateEmail,
  validateFullName,
  validatePassword,
  validatePhoneNumber,
} from "../../utils/authValidation";

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
    purok: PUROK_OPTIONS[0],
    password: "",
    confirmPassword: "",
  });
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
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
      fullName: validateFullName(form.fullName),
      email: validateEmail(form.email) || duplicateEmail,
      contactNumber: validatePhoneNumber(form.contactNumber) || duplicatePhone,
      address: validateAddress(form.address),
      dateOfBirth: validateDateOfBirth(form.dateOfBirth),
      password: validatePassword(form.password),
      confirmPassword: validateConfirmPassword(form.password, form.confirmPassword),
    };
  }, [accounts, form]);

  const showError = (field) => touched[field] ? errors[field] : "";
  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

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
        purok: PUROK_OPTIONS[0],
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

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Resident information</Text>
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
        <FormField
          label="Date of birth"
          value={form.dateOfBirth}
          onChangeText={(value) => updateField("dateOfBirth", value)}
          onBlur={() => setTouched((current) => ({ ...current, dateOfBirth: true }))}
          onFocus={handleFieldFocus("dateOfBirth")}
          inputRef={registerInputRef("dateOfBirth")}
          error={showError("dateOfBirth")}
          placeholder="YYYY-MM-DD"
          autoCapitalize="none"
          returnKeyType="next"
        />
        <OptionSelector label="Purok" value={form.purok} onChange={(value) => updateField("purok", value)} options={PUROK_OPTIONS} />
        <FormField
          label="Password"
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

      <PrimaryButton label="Add resident" onPress={handleAddResident} loading={submitting} />
    </ScreenContainer>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      gap: 14,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 17,
      fontWeight: "800",
    },
  });
}
