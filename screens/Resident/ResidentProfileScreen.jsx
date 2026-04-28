import { useEffect, useMemo, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../../components/common/AppHeader";
import PrimaryButton from "../../components/common/PrimaryButton";
import ScreenContainer from "../../components/common/ScreenContainer";
import FormField from "../../components/forms/FormField";
import OptionSelector from "../../components/forms/OptionSelector";
import { PUROK_OPTIONS } from "../../constants/appConstants";
import { useApp } from "../../storage/AppProvider";
import useKeyboardAwareFieldFocus from "../../utils/useKeyboardAwareFieldFocus";
import {
  calculateAgeFromDob,
  findPhoneConflict,
  GENDER_OPTIONS,
  normalizePhoneNumber,
  validateAddress,
  validateAge,
  validateDateOfBirth,
  validateGender,
  validateConfirmPassword,
  validateCurrentPassword,
  validateEmail,
  validateFullName,
  isSamePassword,
  validateMinimumAge,
  validatePassword,
  validatePhoneNumber,
} from "../../utils/authValidation";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function createInitialForm(user) {
  const dateOfBirth = user?.dateOfBirth || "";
  const derivedAge = calculateAgeFromDob(dateOfBirth);
  const ageValue = user?.age === 0 || user?.age ? String(user.age) : derivedAge;

  return {
    fullName: user?.fullName || "",
    email: user?.email || "",
    contactNumber: user?.contactNumber || "",
    purok: user?.purok || PUROK_OPTIONS[0],
    address: user?.address || "",
    dateOfBirth,
    gender: user?.gender || "Prefer not to say",
    age: ageValue || "",
    photoUri: user?.photoUri || "",
    bio: user?.bio || "",
  };
}

function formatDateValue(date) {
  return date.toISOString().split("T")[0];
}

function formatDateLabel(dateValue) {
  if (!dateValue) {
    return "Not available";
  }

  const parsed = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return "Not available";
  }

  return parsed.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
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

function getInitials(fullName = "") {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "BR";
}

function normalizeProfileForm(form) {
  return {
    fullName: String(form?.fullName || "").trim(),
    email: String(form?.email || "").trim().toLowerCase(),
    contactNumber: String(form?.contactNumber || "").trim(),
    purok: String(form?.purok || "").trim(),
    address: String(form?.address || "").trim(),
    dateOfBirth: String(form?.dateOfBirth || "").trim(),
    gender: String(form?.gender || "").trim(),
    age: String(form?.age || "").trim(),
    photoUri: String(form?.photoUri || "").trim(),
    bio: String(form?.bio || "").trim(),
  };
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

function formatRegisteredDate(value) {
  if (!value) {
    return "Not available";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Not available";
  }

  return parsed.toLocaleString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ResidentProfileScreen({ route, navigation }) {
  const { accounts, currentUser, updateProfile, changePassword, showAlert, showConfirmation, logout, theme, reports, openDrawer } = useApp();
  const isReadOnly = Boolean(route?.params?.isReadOnly);
  const profileUser = isReadOnly
    ? accounts.find((account) => account.id === route?.params?.userId) || null
    : currentUser;
  const scrollRef = useRef(null);
  const unavailableAlertShownRef = useRef(false);
  const { handleFieldFocus, registerInputRef } = useKeyboardAwareFieldFocus({ scrollRef });
  const [form, setForm] = useState(createInitialForm(profileUser));
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordTouched, setPasswordTouched] = useState({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState("day");
  const [pickerMonth, setPickerMonth] = useState(() => {
    const initialDate = new Date();
    initialDate.setFullYear(initialDate.getFullYear() - 18);
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  });
  const styles = createStyles(theme);

  useEffect(() => {
    unavailableAlertShownRef.current = false;
    setForm(createInitialForm(profileUser));
    setTouched({});
    setPhotoError("");
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });
    setPasswordTouched({});
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setShowDobPicker(false);
    setPickerMode("day");
    setEditingProfile(false);
    setEditingPassword(false);
  }, [profileUser]);

  useEffect(() => {
    if (!isReadOnly || profileUser || unavailableAlertShownRef.current) {
      return;
    }

    unavailableAlertShownRef.current = true;
    showAlert(
      "Account Unavailable",
      "This account has been deleted. You can no longer view this resident's profile.",
      {
        variant: "info",
        buttons: [
          {
            text: "OK",
            variant: "primary",
            onPress: () => navigation.goBack(),
          },
        ],
      }
    );
  }, [isReadOnly, navigation, profileUser, showAlert]);

  if (!profileUser) {
    return null;
  }

  const residentReports = useMemo(
    () => reports.filter((report) => report.residentId === profileUser?.id),
    [reports, profileUser?.id]
  );

  const summary = useMemo(
    () => ({
      totalReports: residentReports.length,
      pendingReports: residentReports.filter((report) => report.status === "Pending").length,
      ongoingReports: residentReports.filter((report) => report.status === "Ongoing").length,
      resolvedReports: residentReports.filter((report) => report.status === "Resolved").length,
    }),
    [residentReports]
  );

  const normalizedEmail = form.email.trim().toLowerCase();
  const normalizedPhone = normalizePhoneNumber(form.contactNumber);
  const duplicateEmail = accounts.some(
    (account) => account.id !== profileUser?.id && account.email.trim().toLowerCase() === normalizedEmail
  );
  const duplicatePhone = Boolean(findPhoneConflict(accounts, normalizedPhone, profileUser?.id));
  const dobDisplayValue = formatDateLabel(form.dateOfBirth);
  const calendarDays = useMemo(() => buildCalendarDays(pickerMonth), [pickerMonth]);
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 121 }, (_, index) => currentYear - index);
  }, []);

  const errors = useMemo(
    () => {
      const nextErrors = {
        fullName: validateFullName(form.fullName),
        email: validateEmail(form.email),
        contactNumber: validatePhoneNumber(form.contactNumber),
        address: validateAddress(form.address),
        dateOfBirth: validateDateOfBirth(form.dateOfBirth) || validateMinimumAge(form.dateOfBirth),
        gender: validateGender(form.gender),
        age: validateAge(form.age, form.dateOfBirth),
        bio: "",
        photoUri: photoError,
      };

      if (!nextErrors.email && duplicateEmail) {
        nextErrors.email = "Email is already registered.";
      }

      if (!nextErrors.contactNumber && duplicatePhone) {
        nextErrors.contactNumber = "Phone number is already registered.";
      }

      return nextErrors;
    },
    [duplicateEmail, duplicatePhone, form.address, form.age, form.contactNumber, form.dateOfBirth, form.email, form.fullName, form.gender, photoError]
  );

  const passwordErrors = useMemo(
    () => ({
      currentPassword: validateCurrentPassword(passwordForm.currentPassword, profileUser?.password),
      newPassword: !String(passwordForm.newPassword || "")
        ? "New password is required."
        : isSamePassword(passwordForm.currentPassword, passwordForm.newPassword)
          ? "New password must be different from your current password."
          : validatePassword(passwordForm.newPassword),
      confirmNewPassword: validateConfirmPassword(passwordForm.newPassword, passwordForm.confirmNewPassword),
    }),
    [passwordForm, profileUser?.password]
  );

  const showError = (field) => (touched[field] ? errors[field] : "");
  const showPasswordError = (field) => (passwordTouched[field] ? passwordErrors[field] : "");
  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updatePasswordField = (key, value) => setPasswordForm((current) => ({ ...current, [key]: value }));

  const updateDateOfBirth = (nextDate) => {
    const dateValue = formatDateValue(nextDate);
    const nextAge = calculateAgeFromDob(dateValue);

    setForm((current) => ({
      ...current,
      dateOfBirth: dateValue,
      age: nextAge,
    }));
    setTouched((current) => ({
      ...current,
      dateOfBirth: true,
      age: true,
    }));
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
    setTouched((current) => ({ ...current, dateOfBirth: true }));
  };

  const handleSelectDob = (selectedDate) => {
    updateDateOfBirth(selectedDate);
    setShowDobPicker(false);
    setPickerMode("day");
  };

  const handleProfileEdit = () => {
    setEditingProfile(true);
    setTouched({});
    setPhotoError("");
  };

  const handleProfileCancel = () => {
    setForm(createInitialForm(profileUser));
    setTouched({});
    setPhotoError("");
    setEditingProfile(false);
  };

  const handlePasswordEdit = () => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });
    setEditingPassword(true);
    setPasswordTouched({});
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handlePasswordCancel = () => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });
    setPasswordTouched({});
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setEditingPassword(false);
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showAlert("Permission needed", "Please allow gallery access to update your profile photo.", { variant: "danger" });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets?.[0];

    if (!isSupportedImageAsset(asset)) {
      setPhotoError("Please select a valid image file.");
      setTouched((current) => ({ ...current, photoUri: true }));
      return;
    }

    if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
      setPhotoError("Please choose an image smaller than 10 MB.");
      setTouched((current) => ({ ...current, photoUri: true }));
      return;
    }

    updateField("photoUri", asset.uri);
    setPhotoError("");
    setTouched((current) => ({ ...current, photoUri: false }));
  };

  const handleRemovePhoto = () => {
    updateField("photoUri", "");
    setPhotoError("");
    setTouched((current) => ({ ...current, photoUri: false }));
  };

  const handleProfileSave = async () => {
    setTouched({
      fullName: true,
      email: true,
      contactNumber: true,
      address: true,
      dateOfBirth: true,
      gender: true,
      age: true,
      bio: true,
      photoUri: true,
    });

    if (Object.values(errors).some(Boolean)) {
      return;
    }

    try {
      setSaving(true);
      await updateProfile(profileUser.id, {
        ...form,
        address: form.address.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        age: Number(form.age),
        bio: form.bio.trim(),
      });
      setEditingProfile(false);

      showAlert(
        "Profile updated",
        "Your resident profile details were saved successfully.",
        { variant: "success" }
      );
    } catch (error) {
      showAlert("Unable to save profile", error.message, { variant: "danger" });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    setPasswordTouched({
      currentPassword: true,
      newPassword: true,
      confirmNewPassword: true,
    });

    if (Object.values(passwordErrors).some(Boolean)) {
      return;
    }

    try {
      setSaving(true);
      await changePassword(profileUser.id, passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setPasswordTouched({});
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setEditingPassword(false);

      showAlert("Password updated", "Your password was updated successfully.", { variant: "success" });
    } catch (error) {
      showAlert("Unable to update password", error.message, { variant: "danger" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    showConfirmation({
      title: "Log out?",
      message: "Are you sure you want to log out?",
      confirmText: "Logout",
      onConfirm: async () => {
        await logout();
      },
    });
  };

  const initials = getInitials(form.fullName || profileUser?.fullName);
  const registeredDate = formatRegisteredDate(profileUser?.createdAt);
  const lastPasswordChanged = formatRegisteredDate(profileUser?.passwordUpdatedAt || profileUser?.createdAt);
  const isProfileValid = !Object.values(errors).some(Boolean);
  const hasProfileChanges = useMemo(() => {
    return JSON.stringify(normalizeProfileForm(form)) !== JSON.stringify(normalizeProfileForm(createInitialForm(profileUser)));
  }, [form, profileUser]);
  const hasPasswordChanges = Boolean(
    passwordForm.currentPassword || passwordForm.newPassword || passwordForm.confirmNewPassword
  );
  const isPasswordValid = !Object.values(passwordErrors).some(Boolean);
  const canSaveProfile = hasProfileChanges && isProfileValid && !saving;
  const canSavePassword = hasPasswordChanges && isPasswordValid && !saving;

  return (
    <ScreenContainer
      scrollRef={scrollRef}
      keyboardShouldPersistTaps="handled"
      contentStyle={styles.screenContent}
    >
      <AppHeader
        title={isReadOnly ? "View Profile" : "Profile"}
        variant="toolbar"
        leftIconName={isReadOnly ? undefined : "menu-outline"}
        onLeftPress={isReadOnly ? undefined : openDrawer}
      />

      <View style={styles.profileHero}>
        <View style={styles.avatarShell}>
          {form.photoUri ? (
            <Image source={{ uri: form.photoUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>{initials}</Text>
            </View>
          )}

          {editingProfile && !isReadOnly ? (
            <>
              <Pressable style={[styles.avatarAction, styles.avatarEditAction]} onPress={handlePickImage}>
                <Ionicons name="camera-outline" size={16} color="#ffffff" />
              </Pressable>
              {form.photoUri ? (
                <Pressable style={[styles.avatarAction, styles.avatarRemoveAction]} onPress={handleRemovePhoto}>
                  <Ionicons name="close-outline" size={16} color="#ffffff" />
                </Pressable>
              ) : null}
            </>
          ) : null}
        </View>

        <View style={styles.profileHeroText}>
          <Text style={styles.profileName}>{profileUser?.fullName || "Resident"}</Text>
          <Text style={styles.profileMeta}>{profileUser?.email || "Not available"}</Text>
        </View>

        {showError("photoUri") ? <Text style={styles.errorText}>{showError("photoUri")}</Text> : null}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          {!editingProfile && !isReadOnly ? (
            <Pressable style={styles.editChip} onPress={handleProfileEdit}>
              <Ionicons name="create-outline" size={15} color={theme.primary} />
              <Text style={styles.editChipText}>Edit Profile</Text>
            </Pressable>
          ) : null}
        </View>

        {editingProfile ? (
          <View style={styles.formStack}>
            <FormField
              label="Full name"
              value={form.fullName}
              onChangeText={(value) => updateField("fullName", value)}
              onBlur={() => setTouched((current) => ({ ...current, fullName: true }))}
              onFocus={handleFieldFocus("fullName")}
              inputRef={registerInputRef("fullName")}
              error={showError("fullName")}
              placeholder="Full name"
              autoCapitalize="words"
              returnKeyType="next"
            />
            <FormField
              label="Email"
              value={form.email}
              onChangeText={(value) => updateField("email", value)}
              onBlur={() => setTouched((current) => ({ ...current, email: true }))}
              error={showError("email")}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false}
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
              returnKeyType="next"
            />
            <FormField
              label="Address"
              value={form.address}
              onChangeText={(value) => updateField("address", value)}
              onBlur={() => setTouched((current) => ({ ...current, address: true }))}
              onFocus={handleFieldFocus("address")}
              inputRef={registerInputRef("address")}
              error={showError("address")}
              placeholder="House no., street, barangay"
              autoCapitalize="words"
              returnKeyType="next"
            />
            <View style={styles.customFieldGroup}>
              <Text style={styles.customFieldLabel}>Date of birth</Text>
              <Pressable
                style={[
                  styles.customFieldShell,
                  showError("dateOfBirth") ? styles.customFieldShellError : null,
                ]}
                onPress={openDobPicker}
              >
                <Text
                  style={[
                    styles.customFieldValue,
                    !form.dateOfBirth ? styles.customFieldPlaceholder : null,
                  ]}
                >
                  {form.dateOfBirth ? dobDisplayValue : "Select your date of birth"}
                </Text>
              </Pressable>
              {showError("dateOfBirth") ? <Text style={styles.customFieldError}>{showError("dateOfBirth")}</Text> : null}
            </View>
            <View style={styles.customFieldGroup}>
              <OptionSelector
                label="Gender"
                value={form.gender}
                onChange={(value) => {
                  updateField("gender", value);
                  setTouched((current) => ({ ...current, gender: true }));
                }}
                options={GENDER_OPTIONS}
                variant="profileGrid"
              />
              {showError("gender") ? <Text style={styles.customFieldError}>{showError("gender")}</Text> : null}
            </View>
            <View style={styles.customFieldGroup}>
              <Text style={styles.customFieldLabel}>Age</Text>
              <View
                style={[
                  styles.customFieldShell,
                  styles.readOnlyFieldShell,
                  showError("age") ? styles.customFieldShellError : null,
                ]}
              >
                <Text
                  style={[
                    styles.customFieldValue,
                    !form.age ? styles.customFieldPlaceholder : null,
                  ]}
                >
                  {form.age || "Age will appear after selecting your birth date"}
                </Text>
              </View>
              {showError("age") ? <Text style={styles.customFieldError}>{showError("age")}</Text> : null}
            </View>
            <OptionSelector
              label="Purok"
              value={form.purok}
              onChange={(value) => {
                updateField("purok", value);
                setTouched((current) => ({ ...current, purok: true }));
              }}
              options={PUROK_OPTIONS}
              variant="profileGrid"
            />
            <FormField
              label="Bio (Optional)"
              value={form.bio}
              onChangeText={(value) => updateField("bio", value)}
              onBlur={() => setTouched((current) => ({ ...current, bio: true }))}
              onFocus={handleFieldFocus("bio")}
              inputRef={registerInputRef("bio")}
              error={showError("bio")}
              placeholder="Add a short bio"
              multiline
            />
            <View style={styles.staticField}>
              <Text style={styles.staticFieldLabel}>Date registered</Text>
              <Text style={styles.staticFieldValue}>{registeredDate}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.detailsList}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Full name</Text>
              <Text style={styles.detailValue}>{profileUser?.fullName || "Not available"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{profileUser?.email || "Not available"}</Text>
            </View>
            {!isReadOnly && profileUser?.password ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Password</Text>
                <Text style={styles.detailValue}>********</Text>
              </View>
            ) : null}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Contact number</Text>
              <Text style={styles.detailValue}>{profileUser?.contactNumber || "Not available"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Address</Text>
              <Text style={styles.detailValue}>{profileUser?.address?.trim() || "Not available"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date of birth</Text>
              <Text style={styles.detailValue}>{formatDateLabel(profileUser?.dateOfBirth)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Gender</Text>
              <Text style={styles.detailValue}>{profileUser?.gender || "Not available"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Age</Text>
              <Text style={styles.detailValue}>{profileUser?.age ?? "Not available"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Purok</Text>
              <Text style={styles.detailValue}>{profileUser?.purok || "Not available"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bio</Text>
              <Text style={styles.detailValue}>{profileUser?.bio?.trim() || "No bio added yet."}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date registered</Text>
              <Text style={styles.detailValue}>{registeredDate}</Text>
            </View>
          </View>
        )}

        {editingProfile && !isReadOnly ? (
          <View style={styles.sectionActions}>
            <View style={styles.primaryActionWrap}>
              <PrimaryButton
                label={saving ? "Saving..." : "Save Changes"}
                onPress={handleProfileSave}
                loading={saving}
                disabled={!canSaveProfile}
              />
            </View>
            <Pressable style={styles.cancelButton} onPress={handleProfileCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {!isReadOnly ? (
        <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          {!editingPassword ? (
            <Pressable style={styles.editChip} onPress={handlePasswordEdit}>
              <Ionicons name="lock-closed-outline" size={15} color={theme.primary} />
              <Text style={styles.editChipText}>Change Password</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.staticField}>
          <Text style={styles.staticFieldLabel}>Last password changed</Text>
          <Text style={styles.staticFieldValue}>{lastPasswordChanged}</Text>
        </View>

        {editingPassword ? (
          <View style={styles.formStack}>
            <View style={styles.passwordFieldWrap}>
              <Text style={styles.passwordLabel}>Current Password</Text>
              <View
                style={[
                  styles.passwordShell,
                  showPasswordError("currentPassword") ? styles.passwordShellError : null,
                ]}
              >
                <TextInput
                  ref={registerInputRef("currentPassword")}
                  value={passwordForm.currentPassword}
                  onChangeText={(value) => updatePasswordField("currentPassword", value)}
                  placeholder="Enter current password"
                  placeholderTextColor={theme.placeholder}
                  style={styles.passwordShellInput}
                  secureTextEntry={!showCurrentPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={handleFieldFocus("currentPassword")}
                  onBlur={() => setPasswordTouched((current) => ({ ...current, currentPassword: true }))}
                  returnKeyType="next"
                />
                <Pressable style={styles.passwordEye} onPress={() => setShowCurrentPassword((current) => !current)}>
                  <Ionicons
                    name={showCurrentPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={theme.textSoft}
                  />
                </Pressable>
              </View>
              {showPasswordError("currentPassword") ? (
                <Text style={styles.passwordError}>{showPasswordError("currentPassword")}</Text>
              ) : null}
            </View>

            <View style={styles.passwordFieldWrap}>
              <Text style={styles.passwordLabel}>New Password</Text>
              <View
                style={[
                  styles.passwordShell,
                  showPasswordError("newPassword") ? styles.passwordShellError : null,
                ]}
              >
                <TextInput
                  ref={registerInputRef("newPassword")}
                  value={passwordForm.newPassword}
                  onChangeText={(value) => updatePasswordField("newPassword", value)}
                  placeholder="Enter new password"
                  placeholderTextColor={theme.placeholder}
                  style={styles.passwordShellInput}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={handleFieldFocus("newPassword")}
                  onBlur={() => setPasswordTouched((current) => ({ ...current, newPassword: true }))}
                  returnKeyType="next"
                />
                <Pressable style={styles.passwordEye} onPress={() => setShowNewPassword((current) => !current)}>
                  <Ionicons
                    name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={theme.textSoft}
                  />
                </Pressable>
              </View>
              {showPasswordError("newPassword") ? (
                <Text style={styles.passwordError}>{showPasswordError("newPassword")}</Text>
              ) : null}
            </View>

            <View style={styles.passwordFieldWrap}>
              <Text style={styles.passwordLabel}>Confirm New Password</Text>
              <View
                style={[
                  styles.passwordShell,
                  showPasswordError("confirmNewPassword") ? styles.passwordShellError : null,
                ]}
              >
                <TextInput
                  ref={registerInputRef("confirmNewPassword")}
                  value={passwordForm.confirmNewPassword}
                  onChangeText={(value) => updatePasswordField("confirmNewPassword", value)}
                  placeholder="Confirm new password"
                  placeholderTextColor={theme.placeholder}
                  style={styles.passwordShellInput}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={handleFieldFocus("confirmNewPassword")}
                  onBlur={() =>
                    setPasswordTouched((current) => ({ ...current, confirmNewPassword: true }))
                  }
                />
                <Pressable
                  style={styles.passwordEye}
                  onPress={() => setShowConfirmPassword((current) => !current)}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={theme.textSoft}
                  />
                </Pressable>
              </View>
              {showPasswordError("confirmNewPassword") ? (
                <Text style={styles.passwordError}>{showPasswordError("confirmNewPassword")}</Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {editingPassword ? (
          <View style={styles.sectionActions}>
            <View style={styles.primaryActionWrap}>
              <PrimaryButton
                label={saving ? "Updating..." : "Update Password"}
                onPress={handlePasswordSave}
                loading={saving}
                disabled={!canSavePassword}
              />
            </View>
            <Pressable style={styles.cancelButton} onPress={handlePasswordCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        ) : null}
        </View>
      ) : null}

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Account Overview</Text>
        </View>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryTile}>
            <Text style={styles.summaryValue}>{summary.totalReports}</Text>
            <Text style={styles.summaryLabel}>Total Reports</Text>
          </View>
          <View style={styles.summaryTile}>
            <Text style={styles.summaryValue}>{summary.pendingReports}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={styles.summaryTile}>
            <Text style={styles.summaryValue}>{summary.ongoingReports}</Text>
            <Text style={styles.summaryLabel}>Ongoing</Text>
          </View>
          <View style={styles.summaryTile}>
            <Text style={styles.summaryValue}>{summary.resolvedReports}</Text>
            <Text style={styles.summaryLabel}>Resolved</Text>
          </View>
        </View>
      </View>

      {!isReadOnly ? (
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={theme.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      ) : null}

      <Modal visible={showDobPicker} transparent animationType="fade" onRequestClose={closeDobPicker}>
        <View style={styles.datePickerOverlay}>
          <Pressable style={styles.datePickerBackdrop} onPress={closeDobPicker} />
          <View style={styles.datePickerCard}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Select Date of Birth</Text>
              <Pressable style={styles.datePickerClose} onPress={closeDobPicker}>
                <Text style={styles.datePickerCloseText}>Close</Text>
              </Pressable>
            </View>

            <View style={styles.datePickerMonthRow}>
              <Pressable
                style={styles.datePickerArrow}
                onPress={() =>
                  setPickerMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
                }
                disabled={pickerMode !== "day"}
              >
                <Text style={styles.datePickerArrowText}>{"<"}</Text>
              </Pressable>

              <View style={styles.datePickerMonthControls}>
                <Pressable
                  style={[
                    styles.datePickerHeaderPill,
                    pickerMode === "month" ? styles.datePickerHeaderPillActive : null,
                  ]}
                  onPress={() => setPickerMode("month")}
                >
                  <Text
                    style={[
                      styles.datePickerHeaderPillText,
                      pickerMode === "month" ? styles.datePickerHeaderPillTextActive : null,
                    ]}
                  >
                    {pickerMonth.toLocaleDateString("en-US", { month: "long" })}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.datePickerHeaderPill,
                    pickerMode === "year" ? styles.datePickerHeaderPillActive : null,
                  ]}
                  onPress={() => setPickerMode("year")}
                >
                  <Text
                    style={[
                      styles.datePickerHeaderPillText,
                      pickerMode === "year" ? styles.datePickerHeaderPillTextActive : null,
                    ]}
                  >
                    {pickerMonth.getFullYear()}
                  </Text>
                </Pressable>
              </View>

              <Pressable
                style={styles.datePickerArrow}
                onPress={() =>
                  setPickerMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
                }
                disabled={pickerMode !== "day"}
              >
                <Text style={styles.datePickerArrowText}>{">"}</Text>
              </Pressable>
            </View>

            {pickerMode === "day" ? (
              <>
                <View style={styles.datePickerWeekdays}>
                  {WEEKDAY_LABELS.map((label) => (
                    <View key={label} style={styles.datePickerCellSlot}>
                      <Text style={styles.datePickerWeekdayText}>{label}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.datePickerGrid}>
                  {calendarDays.map((date, index) => {
                    if (!date) {
                      return <View key={`empty-${index}`} style={styles.datePickerCellSlot} />;
                    }

                    const dateValue = formatDateValue(date);
                    const isSelected = dateValue === form.dateOfBirth;
                    const isFuture = date.getTime() > new Date().getTime();

                    return (
                      <View key={dateValue} style={styles.datePickerCellSlot}>
                        <Pressable
                          style={[
                            styles.datePickerDay,
                            isSelected ? styles.datePickerDayActive : null,
                            isFuture ? styles.datePickerDayDisabled : null,
                          ]}
                          onPress={() => handleSelectDob(date)}
                          disabled={isFuture}
                        >
                          <Text
                            style={[
                              styles.datePickerDayText,
                              isSelected ? styles.datePickerDayTextActive : null,
                              isFuture ? styles.datePickerDayTextDisabled : null,
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
              <View style={styles.selectionGrid}>
                {MONTH_LABELS.map((monthLabel, monthIndex) => {
                  const isActive = pickerMonth.getMonth() === monthIndex;

                  return (
                    <View key={monthLabel} style={styles.selectionGridItem}>
                      <Pressable
                        style={[
                          styles.selectionPill,
                          isActive ? styles.selectionPillActive : null,
                        ]}
                        onPress={() => {
                          setPickerMonth((current) => new Date(current.getFullYear(), monthIndex, 1));
                          setPickerMode("day");
                        }}
                      >
                        <Text
                          style={[
                            styles.selectionPillText,
                            isActive ? styles.selectionPillTextActive : null,
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
              <ScrollView style={styles.yearScroll} contentContainerStyle={styles.selectionGrid} showsVerticalScrollIndicator={false}>
                {yearOptions.map((yearValue) => {
                  const isActive = pickerMonth.getFullYear() === yearValue;

                  return (
                    <View key={yearValue} style={styles.selectionGridItem}>
                      <Pressable
                        style={[
                          styles.selectionPill,
                          isActive ? styles.selectionPillActive : null,
                        ]}
                        onPress={() => {
                          setPickerMonth((current) => new Date(yearValue, current.getMonth(), 1));
                          setPickerMode("day");
                        }}
                      >
                        <Text
                          style={[
                            styles.selectionPillText,
                            isActive ? styles.selectionPillTextActive : null,
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
    </ScreenContainer>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    screenContent: {
      paddingBottom: 156,
    },
    profileHero: {
      backgroundColor: theme.surface,
      borderRadius: 30,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 22,
      paddingVertical: 24,
      alignItems: "center",
      gap: 14,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 4,
    },
    avatarShell: {
      position: "relative",
      width: 112,
      height: 112,
    },
    avatarImage: {
      width: 112,
      height: 112,
      borderRadius: 56,
      backgroundColor: theme.surfaceSoft,
      borderWidth: 3,
      borderColor: theme.border,
    },
    avatarFallback: {
      width: 112,
      height: 112,
      borderRadius: 56,
      backgroundColor: theme.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 3,
      borderColor: theme.border,
    },
    avatarFallbackText: {
      color: theme.primary,
      fontSize: 34,
      fontWeight: "800",
    },
    avatarAction: {
      position: "absolute",
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.32)",
    },
    avatarEditAction: {
      right: -2,
      bottom: 4,
      backgroundColor: theme.primary,
    },
    avatarRemoveAction: {
      left: -2,
      bottom: 4,
      backgroundColor: theme.danger,
    },
    profileHeroText: {
      alignItems: "center",
      gap: 4,
    },
    profileName: {
      color: theme.text,
      fontSize: 24,
      fontWeight: "800",
      textAlign: "center",
    },
    profileMeta: {
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: "center",
    },
    sectionCard: {
      backgroundColor: theme.surface,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      gap: 16,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 3,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: -0.2,
    },
    editChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.primarySoft,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    editChipText: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: "800",
    },
    detailsList: {
      gap: 14,
    },
    detailRow: {
      gap: 6,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    detailLabel: {
      color: theme.textSoft,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    detailValue: {
      color: theme.text,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "600",
    },
    formStack: {
      gap: 14,
    },
    customFieldGroup: {
      gap: 8,
    },
    customFieldLabel: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "700",
    },
    customFieldShell: {
      minHeight: 56,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      paddingHorizontal: 16,
      justifyContent: "center",
    },
    readOnlyFieldShell: {
      opacity: 0.92,
    },
    customFieldShellError: {
      borderColor: theme.error,
    },
    customFieldValue: {
      color: theme.inputText,
      fontSize: 15,
    },
    customFieldPlaceholder: {
      color: theme.placeholder,
    },
    customFieldError: {
      color: theme.error,
      fontSize: 12,
      lineHeight: 18,
    },
    staticField: {
      gap: 6,
      backgroundColor: theme.surfaceSoft,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    staticFieldLabel: {
      color: theme.textSoft,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    staticFieldValue: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "600",
    },
    passwordFieldWrap: {
      gap: 6,
    },
    passwordLabel: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "700",
    },
    passwordInput: {
      minHeight: 56,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      color: theme.inputText,
      paddingHorizontal: 16,
      fontSize: 15,
    },
    passwordInputError: {
      borderColor: theme.error,
    },
    passwordShell: {
      minHeight: 56,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      flexDirection: "row",
      alignItems: "center",
      paddingLeft: 16,
      paddingRight: 10,
    },
    passwordShellError: {
      borderColor: theme.error,
    },
    passwordShellInput: {
      flex: 1,
      color: theme.inputText,
      fontSize: 15,
      paddingVertical: 14,
    },
    passwordEye: {
      width: 34,
      height: 34,
      alignItems: "center",
      justifyContent: "center",
    },
    passwordError: {
      color: theme.error,
      fontSize: 12,
    },
    datePickerOverlay: {
      flex: 1,
      backgroundColor: "rgba(15, 23, 42, 0.56)",
      justifyContent: "center",
      paddingHorizontal: 18,
    },
    datePickerBackdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    datePickerCard: {
      backgroundColor: theme.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20,
      gap: 16,
    },
    datePickerHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    datePickerTitle: {
      flex: 1,
      color: theme.text,
      fontSize: 18,
      fontWeight: "800",
    },
    datePickerClose: {
      minHeight: 36,
      paddingHorizontal: 12,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.primarySoft,
    },
    datePickerCloseText: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: "700",
    },
    datePickerMonthRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    datePickerArrow: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border,
    },
    datePickerArrowText: {
      color: theme.text,
      fontSize: 22,
      fontWeight: "700",
      lineHeight: 24,
    },
    datePickerMonthControls: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
    },
    datePickerHeaderPill: {
      minHeight: 40,
      paddingHorizontal: 14,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border,
    },
    datePickerHeaderPillActive: {
      backgroundColor: theme.primarySoft,
      borderColor: theme.primary,
    },
    datePickerHeaderPillText: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "700",
    },
    datePickerHeaderPillTextActive: {
      color: theme.primary,
    },
    datePickerWeekdays: {
      flexDirection: "row",
    },
    datePickerCellSlot: {
      width: "14.2857%",
      padding: 3,
    },
    datePickerWeekdayText: {
      textAlign: "center",
      color: theme.textSoft,
      fontSize: 12,
      fontWeight: "700",
    },
    datePickerGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    datePickerDay: {
      width: "100%",
      aspectRatio: 1,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border,
    },
    datePickerDayActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    datePickerDayDisabled: {
      opacity: 0.34,
    },
    datePickerDayText: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "700",
    },
    datePickerDayTextActive: {
      color: "#ffffff",
    },
    datePickerDayTextDisabled: {
      color: theme.placeholder,
    },
    selectionGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginHorizontal: -4,
      rowGap: 8,
    },
    selectionGridItem: {
      width: "33.3333%",
      paddingHorizontal: 4,
    },
    selectionPill: {
      minHeight: 46,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border,
    },
    selectionPillActive: {
      backgroundColor: theme.primarySoft,
      borderColor: theme.primary,
    },
    selectionPillText: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "700",
    },
    selectionPillTextActive: {
      color: theme.primary,
    },
    yearScroll: {
      maxHeight: 260,
    },
    sectionActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: 4,
    },
    primaryActionWrap: {
      flex: 1,
    },
    cancelButton: {
      minHeight: 60,
      minWidth: 112,
      paddingHorizontal: 18,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelButtonText: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "800",
    },
    summaryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    summaryTile: {
      width: "47%",
      minHeight: 100,
      borderRadius: 22,
      backgroundColor: theme.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      justifyContent: "space-between",
    },
    summaryValue: {
      color: theme.text,
      fontSize: 24,
      fontWeight: "900",
      letterSpacing: -0.4,
    },
    summaryLabel: {
      color: theme.textMuted,
      fontSize: 13,
      fontWeight: "700",
    },
    logoutButton: {
      minHeight: 54,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: "rgba(248, 113, 113, 0.22)",
      backgroundColor: theme.dangerSoft,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    logoutText: {
      color: theme.danger,
      fontSize: 15,
      fontWeight: "800",
    },
    errorText: {
      color: theme.error,
      fontSize: 12,
      textAlign: "center",
      lineHeight: 18,
    },
  });
}
