import { useEffect, useMemo, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../../components/common/AppHeader";
import PrimaryButton from "../../components/common/PrimaryButton";
import ScreenContainer from "../../components/common/ScreenContainer";
import FormField from "../../components/forms/FormField";
import { useApp } from "../../storage/AppProvider";
import useKeyboardAwareFieldFocus from "../../utils/useKeyboardAwareFieldFocus";
import {
  validateConfirmPassword,
  validateCurrentPassword,
  validateEmail,
  validateFullName,
  validatePassword,
  validatePhoneNumber,
  isSamePassword,
} from "../../utils/authValidation";

function createInitialForm(user) {
  return {
    fullName: user?.fullName || "",
    email: user?.email || "",
    contactNumber: user?.contactNumber || "",
    photoUri: user?.photoUri || "",
    bio: user?.bio || "",
  };
}

function getInitials(fullName = "") {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "BA";
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

export default function AdminProfileScreen() {
  const { currentUser, updateProfile, changePassword, showAlert, theme, reports, unreadNotificationsCount, openDrawer } = useApp();
  const scrollRef = useRef(null);
  const { handleFieldFocus, registerInputRef } = useKeyboardAwareFieldFocus({ scrollRef });
  const [form, setForm] = useState(createInitialForm(currentUser));
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
  const styles = createStyles(theme);

  useEffect(() => {
    setForm(createInitialForm(currentUser));
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
    setEditingProfile(false);
    setEditingPassword(false);
  }, [currentUser]);

  const errors = useMemo(
    () => ({
      fullName: validateFullName(form.fullName),
      email: validateEmail(form.email),
      contactNumber: validatePhoneNumber(form.contactNumber),
      bio: "",
      photoUri: photoError,
    }),
    [form.fullName, form.email, form.contactNumber, photoError]
  );

  const passwordErrors = useMemo(
    () => ({
      currentPassword: validateCurrentPassword(passwordForm.currentPassword, currentUser?.password),
      newPassword: !String(passwordForm.newPassword || "")
        ? "New password is required."
        : isSamePassword(passwordForm.currentPassword, passwordForm.newPassword)
          ? "New password must be different from your current password."
          : validatePassword(passwordForm.newPassword),
      confirmNewPassword: validateConfirmPassword(passwordForm.newPassword, passwordForm.confirmNewPassword),
    }),
    [currentUser?.password, passwordForm]
  );

  const summary = useMemo(
    () => ({
      totalReports: reports.length,
      pendingReports: reports.filter((report) => report.status === "Pending").length,
      resolvedReports: reports.filter((report) => report.status === "Resolved").length,
      unreadNotifications: unreadNotificationsCount || 0,
    }),
    [reports, unreadNotificationsCount]
  );

  const showError = (field) => (touched[field] ? errors[field] : "");
  const showPasswordError = (field) => (passwordTouched[field] ? passwordErrors[field] : "");
  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updatePasswordField = (key, value) => setPasswordForm((current) => ({ ...current, [key]: value }));

  const handleProfileEdit = () => {
    setEditingProfile(true);
    setTouched({});
    setPhotoError("");
  };

  const handleProfileCancel = () => {
    setForm(createInitialForm(currentUser));
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
      bio: true,
      photoUri: true,
    });

    if (Object.values(errors).some(Boolean)) {
      return;
    }

    try {
      setSaving(true);
      await updateProfile(currentUser.id, {
        ...form,
        bio: form.bio.trim(),
      });
      setEditingProfile(false);

      showAlert(
        "Profile updated",
        "Your admin profile details were saved successfully.",
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
      await changePassword(currentUser.id, passwordForm.currentPassword, passwordForm.newPassword);
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

  const initials = getInitials(form.fullName || currentUser?.fullName);
  const registeredDate = formatRegisteredDate(currentUser?.createdAt);
  const lastPasswordChanged = formatRegisteredDate(currentUser?.passwordUpdatedAt || currentUser?.createdAt);
  const isProfileValid = !Object.values(errors).some(Boolean);
  const hasPasswordChanges = Boolean(
    passwordForm.currentPassword || passwordForm.newPassword || passwordForm.confirmNewPassword
  );
  const isPasswordValid = !Object.values(passwordErrors).some(Boolean);
  const canSaveProfile = isProfileValid && !saving;
  const canSavePassword = hasPasswordChanges && isPasswordValid && !saving;

  return (
    <ScreenContainer
      scrollRef={scrollRef}
      keyboardShouldPersistTaps="handled"
      contentStyle={styles.screenContent}
    >
      <AppHeader title="Profile" variant="toolbar" leftIconName="menu-outline" onLeftPress={openDrawer} />

      <View style={styles.profileHero}>
        <View style={styles.avatarShell}>
          {form.photoUri ? (
            <Image source={{ uri: form.photoUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>{initials}</Text>
            </View>
          )}

          {editingProfile ? (
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
          <Text style={styles.profileName}>{currentUser?.fullName || "Barangay Admin"}</Text>
          <Text style={styles.profileMeta}>{currentUser?.email || "Not available"}</Text>
        </View>

        {showError("photoUri") ? <Text style={styles.errorText}>{showError("photoUri")}</Text> : null}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          {!editingProfile ? (
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
              placeholder="Admin full name"
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
              placeholder="admin@email.com"
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
              returnKeyType="next"
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
              <Text style={styles.detailValue}>{currentUser?.fullName || "Not available"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{currentUser?.email || "Not available"}</Text>
            </View>
            {currentUser?.password ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Password</Text>
                <Text style={styles.detailValue}>********</Text>
              </View>
            ) : null}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Contact number</Text>
              <Text style={styles.detailValue}>{currentUser?.contactNumber || "Not available"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bio</Text>
              <Text style={styles.detailValue}>{currentUser?.bio?.trim() || "No bio added yet."}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date registered</Text>
              <Text style={styles.detailValue}>{registeredDate}</Text>
            </View>
          </View>
        )}

        {editingProfile ? (
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

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Admin Account Overview</Text>
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
            <Text style={styles.summaryValue}>{summary.resolvedReports}</Text>
            <Text style={styles.summaryLabel}>Resolved</Text>
          </View>
          <View style={styles.summaryTile}>
            <Text style={styles.summaryValue}>{summary.unreadNotifications}</Text>
            <Text style={styles.summaryLabel}>Unread Alerts</Text>
          </View>
        </View>
      </View>
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
    errorText: {
      color: theme.error,
      fontSize: 12,
      textAlign: "center",
      lineHeight: 18,
    },
  });
}
