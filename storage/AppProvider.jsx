import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { authThemes } from "../constants/theme";
import { createId } from "../utils/idUtils";
import { requestNotificationAccess, sendLocalNotification } from "../utils/notificationUtils";
import {
  calculateAgeFromDob,
  findPhoneConflict,
  validatePassword,
  isSamePassword,
  normalizePhoneNumber,
} from "../utils/authValidation";
import {
  bootstrapAppStorage,
  clearSession,
  loadPreferences,
  loadSession,
  saveAppStorage,
  savePreferences,
  saveSession,
} from "./appStorage";

const AppContext = createContext(null);
const CONFIRMATION_CYCLE_WAITING = "waiting_confirmation";
const CONFIRMATION_CYCLE_REJECTED_PENDING_FEEDBACK = "rejected_pending_feedback";

function getResetConfirmationCycleFields() {
  return {
    confirmationCycleState: null,
    confirmationRejectedAt: null,
    confirmationFeedbackSubmittedAt: null,
    confirmationAdminRespondedAt: null,
  };
}

function getWaitingConfirmationFields() {
  return {
    confirmationCycleState: CONFIRMATION_CYCLE_WAITING,
    confirmationRejectedAt: null,
    confirmationFeedbackSubmittedAt: null,
    confirmationAdminRespondedAt: null,
  };
}

function createNotification(userId, title, message, type = "info", reportId = null, residentId = null, details = null) {
  return {
    id: createId("notif"),
    userId,
    title,
    message,
    type,
    read: false,
    reportId,
    residentId,
    details,
    createdAt: new Date().toISOString(),
  };
}

function sortByLatest(items = [], dateKey = "createdAt") {
  return [...items].sort((a, b) => new Date(b[dateKey]).getTime() - new Date(a[dateKey]).getTime());
}

function normalizeProfileChanges(changes) {
  return {
    ...changes,
    ...(typeof changes.fullName === "string" ? { fullName: changes.fullName.trim() } : {}),
    ...(typeof changes.email === "string" ? { email: changes.email.trim().toLowerCase() } : {}),
    ...(typeof changes.contactNumber === "string"
      ? { contactNumber: normalizePhoneNumber(changes.contactNumber) }
      : {}),
    ...(typeof changes.address === "string" ? { address: changes.address.trim() } : {}),
    ...(typeof changes.gender === "string" ? { gender: changes.gender.trim() } : {}),
    ...(typeof changes.dateOfBirth === "string" ? { dateOfBirth: changes.dateOfBirth.trim() } : {}),
    ...(changes.age !== undefined ? { age: Number(changes.age) } : {}),
  };
}

function getAttachmentName(attachment = {}) {
  if (typeof attachment.name === "string" && attachment.name.trim()) {
    return attachment.name.trim();
  }

  const value = typeof attachment.uri === "string" ? attachment.uri : "";
  const parts = value.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] || "Attachment";
}

function isImageAttachment(type, uri = "") {
  const normalizedUri = String(uri || "").toLowerCase();

  if (normalizedUri.endsWith(".pdf") || normalizedUri.includes(".pdf?")) {
    return false;
  }

  if (type === "image") {
    return true;
  }

  return /(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.bmp|\.heic)(\?.*)?$/i.test(uri);
}

function normalizeThreadAttachments(items = []) {
  return (Array.isArray(items) ? items : [])
    .filter((item) => item?.uri)
    .map((item) => ({
      id: item.id || createId("attachment"),
      name: getAttachmentName(item),
      uri: item.uri.trim(),
      type: isImageAttachment(item.type, item.uri) ? "image" : "file",
      ...(item.mimeType ? { mimeType: item.mimeType } : {}),
    }));
}

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [reports, setReports] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [preferences, setPreferences] = useState({
    themeMode: "light",
    notificationsEnabled: false,
    notificationsPermission: "undetermined",
  });
  const [sessionUser, setSessionUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState(null);
  const [inAppNotification, setInAppNotification] = useState(null);
  const deliveredNotificationIdsRef = useRef(new Set());
  const notificationsHydratedRef = useRef(false);
  const inAppNotificationTimeoutRef = useRef(null);

  const theme = authThemes[preferences.themeMode] || authThemes.light;

  const showInAppNotification = (item) => {
    if (!item) {
      return;
    }

    setInAppNotification(item);

    if (inAppNotificationTimeoutRef.current) {
      clearTimeout(inAppNotificationTimeoutRef.current);
    }

    inAppNotificationTimeoutRef.current = setTimeout(() => {
      setInAppNotification((current) => (current?.id === item.id ? null : current));
      inAppNotificationTimeoutRef.current = null;
    }, 4000);
  };

  const showNotificationPopup = (item) => {
    if (!item) {
      return;
    }

    showInAppNotification(item);
    setDialogConfig({
      title: item.title || "New Notification",
      message: item.message || "",
      variant:
        item.type === "deleted_report" || item.type === "deleted_account"
          ? "danger"
          : item.type === "status" || item.type === "feedback" || item.type === "reply"
            ? "success"
            : "info",
      dismissible: true,
      buttons: [
        {
          text: "OK",
          variant: "primary",
        },
      ],
    });
  };

  const persistState = async (nextState, newNotifications = []) => {
    const nextNotifications = nextState.notifications ?? notifications;
    const persistedState = {
      accounts: nextState.accounts ?? accounts,
      reports: nextState.reports ?? reports,
      notifications: nextNotifications,
    };

    await saveAppStorage(persistedState);
    setAccounts(persistedState.accounts);
    setReports(persistedState.reports);
    setNotifications(persistedState.notifications);

    if (sessionUser?.id && newNotifications.length > 0) {
      const relevant = newNotifications.filter((item) => item.userId === sessionUser.id);

      if (relevant.length > 0) {
        showNotificationPopup(relevant[relevant.length - 1]);
        relevant.forEach((item) => deliveredNotificationIdsRef.current.add(item.id));
      }
    }
  };

  const hideDialog = () => setDialogConfig(null);
  const hideInAppNotification = () => {
    if (inAppNotificationTimeoutRef.current) {
      clearTimeout(inAppNotificationTimeoutRef.current);
      inAppNotificationTimeoutRef.current = null;
    }
    setInAppNotification(null);
  };

  const pressDialogButton = async (button) => {
    setDialogConfig(null);

    if (button?.onPress) {
      await button.onPress();
    }
  };

  const showAlert = (title, message = "", options = {}) => {
    setDialogConfig({
      title,
      message,
      variant: options.variant || "info",
      dismissible: options.dismissible !== false,
      buttons: options.buttons || [
        {
          text: options.buttonText || "OK",
          variant: "primary",
        },
      ],
    });
  };

  const showConfirmation = ({
    title,
    message = "",
    variant = "danger",
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
    dismissible = true,
    confirmVariant,
  }) => {
    setDialogConfig({
      title,
      message,
      variant,
      dismissible,
      buttons: [
        {
          text: cancelText,
          variant: "secondary",
          onPress: onCancel,
        },
        {
          text: confirmText,
          variant: confirmVariant || (variant === "danger" ? "danger" : "primary"),
          onPress: onConfirm,
        },
      ],
    });
  };

  const persistPreferences = async (changes) => {
    const nextPreferences = { ...preferences, ...changes };
    setPreferences(nextPreferences);
    await savePreferences(nextPreferences);
    return nextPreferences;
  };

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const [seededData, storedSession, storedPreferences] = await Promise.all([
          bootstrapAppStorage(),
          loadSession(),
          loadPreferences(),
        ]);

        if (!mounted) {
          return;
        }

        let nextPreferences = storedPreferences;

        if (storedPreferences.notificationsPermission === "undetermined") {
          const permission = await requestNotificationAccess();
          nextPreferences = {
            ...storedPreferences,
            notificationsEnabled: permission.granted || storedPreferences.notificationsEnabled,
            notificationsPermission: permission.status,
          };
          await savePreferences(nextPreferences);
        } else if (storedPreferences.notificationsPermission === "granted" && !storedPreferences.notificationsEnabled) {
          nextPreferences = {
            ...storedPreferences,
            notificationsEnabled: true,
          };
          await savePreferences(nextPreferences);
        }

        setAccounts(seededData.accounts);
        setReports(seededData.reports);
        setNotifications(seededData.notifications);
        setSessionUser(storedSession);
        setPreferences(nextPreferences);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  const currentUser = useMemo(
    () => accounts.find((account) => account.id === sessionUser?.id) || sessionUser,
    [accounts, sessionUser]
  );

  const currentNotifications = useMemo(
    () => sortByLatest(notifications.filter((item) => item.userId === currentUser?.id)),
    [currentUser?.id, notifications]
  );

  useEffect(() => {
    deliveredNotificationIdsRef.current = new Set();
    notificationsHydratedRef.current = false;
    hideInAppNotification();
  }, [currentUser?.id]);

  useEffect(() => {
    if (loading || !currentUser?.id) {
      return;
    }

    const currentIds = new Set(currentNotifications.map((item) => item.id));

    if (!notificationsHydratedRef.current) {
      deliveredNotificationIdsRef.current = currentIds;
      notificationsHydratedRef.current = true;
      return;
    }

    const pendingNotifications = [...currentNotifications]
      .filter((item) => !deliveredNotificationIdsRef.current.has(item.id))
      .reverse();

    if (!pendingNotifications.length) {
      return;
    }

    let cancelled = false;

    async function deliverNotifications() {
      for (const item of pendingNotifications) {
        if (cancelled) {
          return;
        }

        showNotificationPopup(item);

        if (preferences.notificationsEnabled && preferences.notificationsPermission === "granted") {
          await sendLocalNotification({
            title: item.title,
            body: item.message,
            data: {
              notificationId: item.id,
              reportId: item.reportId,
              type: item.type,
              details: item.details,
            },
          });
        }

        deliveredNotificationIdsRef.current.add(item.id);
      }
    }

    deliverNotifications();

    return () => {
      cancelled = true;
    };
  }, [
    currentNotifications,
    currentUser?.id,
    loading,
    preferences.notificationsEnabled,
    preferences.notificationsPermission,
  ]);

  useEffect(() => {
    return () => {
      if (inAppNotificationTimeoutRef.current) {
        clearTimeout(inAppNotificationTimeoutRef.current);
      }
    };
  }, []);

  const unreadNotificationsCount = useMemo(
    () => currentNotifications.filter((item) => !item.read).length,
    [currentNotifications]
  );

  const visibleUnreadNotificationsCount = useMemo(
    () => (preferences.notificationsEnabled ? unreadNotificationsCount : 0),
    [preferences.notificationsEnabled, unreadNotificationsCount]
  );

  const login = async (email, password) => {
    const account = accounts.find(
      (item) => item.email.trim().toLowerCase() === email.trim().toLowerCase() && item.password === password
    );

    if (!account) {
      throw new Error("Invalid email or password.");
    }

    await saveSession(account);
    setSessionUser(account);
    return account;
  };

  const signupResident = async (payload) => {
    const normalizedEmail = payload.email.trim().toLowerCase();
    const normalizedPhone = normalizePhoneNumber(payload.contactNumber);
    const timestamp = new Date().toISOString();

    if (accounts.some((item) => item.email.trim().toLowerCase() === normalizedEmail)) {
      throw new Error("Email is already registered.");
    }

    if (findPhoneConflict(accounts, normalizedPhone)) {
      throw new Error("Phone number is already registered.");
    }

    const nextResident = {
      id: createId("resident"),
      role: "resident",
      fullName: payload.fullName.trim(),
      email: normalizedEmail,
      password: payload.password,
      purok: payload.purok,
      address: payload.address.trim(),
      contactNumber: normalizedPhone,
      dateOfBirth: payload.dateOfBirth,
      gender: payload.gender,
      age: Number(payload.age),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const adminAccounts = accounts.filter((account) => account.role === "admin");
    const createdNotifications = [
      createNotification(nextResident.id, "Welcome", "Your resident account has been created successfully."),
      ...adminAccounts.map((admin) =>
        createNotification(
          admin.id,
          "New Resident Registration",
          `${nextResident.fullName} completed a resident registration.`,
          "account",
          null,
          nextResident.id
        )
      ),
    ];

    const nextState = {
      accounts: [...accounts, nextResident],
      reports,
      notifications: [...notifications, ...createdNotifications],
    };

    await persistState(nextState, createdNotifications);
    return nextResident;
  };

  const logout = async () => {
    await clearSession();
    setSessionUser(null);
  };

  const resetPasswordByPhone = async (phoneNumber, nextPassword) => {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    const matchedAccount = accounts.find((account) => normalizePhoneNumber(account.contactNumber) === normalizedPhone);

    if (!matchedAccount) {
      throw new Error("No account found with this phone number.");
    }

    const createdNotifications = [
      createNotification(matchedAccount.id, "Password Updated", "Your account password was updated.", "account"),
    ];

    const nextAccounts = accounts.map((account) =>
      account.id === matchedAccount.id
        ? {
            ...account,
            password: nextPassword,
            updatedAt: new Date().toISOString(),
          }
        : account
    );

    await persistState({ accounts: nextAccounts, reports, notifications: [...notifications, ...createdNotifications] }, createdNotifications);
    return matchedAccount;
  };

  const resetPasswordByEmail = async (email, nextPassword) => {
    const normalizedEmail = email.trim().toLowerCase();
    const matchedAccount = accounts.find((account) => account.email.trim().toLowerCase() === normalizedEmail);

    if (!matchedAccount) {
      throw new Error("No account found with this email.");
    }

    if (isSamePassword(matchedAccount.password, nextPassword)) {
      throw new Error("New password must be different from your previous password.");
    }

    const createdNotifications = [
      createNotification(matchedAccount.id, "Password Updated", "Your account password was updated.", "account"),
    ];

    const nextAccounts = accounts.map((account) =>
      account.id === matchedAccount.id
        ? {
            ...account,
            password: nextPassword,
            updatedAt: new Date().toISOString(),
          }
        : account
    );

    await persistState({ accounts: nextAccounts, reports, notifications: [...notifications, ...createdNotifications] }, createdNotifications);
    return matchedAccount;
  };

  const updateProfile = async (userId, changes) => {
    const normalizedChanges = normalizeProfileChanges(changes);

    if (normalizedChanges.email) {
      const emailTaken = accounts.some(
        (account) =>
          account.id !== userId && account.email.trim().toLowerCase() === normalizedChanges.email
      );

      if (emailTaken) {
        throw new Error("Email is already in use.");
      }
    }

    if (normalizedChanges.contactNumber) {
      const phoneConflict = findPhoneConflict(accounts, normalizedChanges.contactNumber, userId);

      if (phoneConflict) {
        throw new Error("Phone number is already registered.");
      }
    }

    const nextAccounts = accounts.map((account) =>
      account.id === userId
        ? { ...account, ...normalizedChanges, updatedAt: new Date().toISOString() }
        : account
    );
    const updatedUser = nextAccounts.find((item) => item.id === userId);

    await persistState({ accounts: nextAccounts, reports, notifications });

    if (sessionUser?.id === userId) {
      await saveSession(updatedUser);
      setSessionUser(updatedUser);
    }

    return updatedUser;
  };

  const changePassword = async (userId, currentPassword, nextPassword) => {
    const matchedAccount = accounts.find((account) => account.id === userId);

    if (!matchedAccount) {
      throw new Error("Account not found.");
    }

    if (!String(currentPassword || "")) {
      throw new Error("Current password is required.");
    }

    if (matchedAccount.password !== currentPassword) {
      throw new Error("Current password is incorrect.");
    }

    const passwordError = validatePassword(nextPassword);

    if (passwordError) {
      throw new Error(passwordError);
    }

    if (isSamePassword(currentPassword, nextPassword)) {
      throw new Error("New password must be different from your current password.");
    }

    const timestamp = new Date().toISOString();
    const nextAccounts = accounts.map((account) =>
      account.id === userId
        ? {
            ...account,
            password: nextPassword,
            passwordUpdatedAt: timestamp,
            updatedAt: timestamp,
          }
        : account
    );
    const updatedUser = nextAccounts.find((item) => item.id === userId);

    await persistState({ accounts: nextAccounts, reports, notifications });

    if (sessionUser?.id === userId) {
      await saveSession(updatedUser);
      setSessionUser(updatedUser);
    }

    return updatedUser;
  };

  const markNotificationRead = async (notificationId) => {
    const nextNotifications = notifications.map((item) =>
      item.id === notificationId ? { ...item, read: true } : item
    );

    await persistState({ accounts, reports, notifications: nextNotifications });
  };

  const deleteNotification = async (notificationId) => {
    const nextNotifications = notifications.filter((item) => item.id !== notificationId);
    await persistState({ accounts, reports, notifications: nextNotifications });
  };

  const sendAnnouncement = async (adminId, message) => {
    const admin = accounts.find((account) => account.id === adminId);
    const trimmedMessage = String(message || "").trim();

    if (!admin || trimmedMessage.length < 10 || !/[A-Za-z0-9]/.test(trimmedMessage)) {
      throw new Error("Message must contain meaningful text (min 10 characters)");
    }

    const residentNotifications = accounts
      .filter((account) => account.role === "resident")
      .map((resident) =>
        createNotification(
          resident.id,
          "Barangay Announcement",
          trimmedMessage,
          "announcement",
          null,
          resident.id,
          {
            fullMessage: trimmedMessage,
            sentBy: admin.fullName,
          }
        )
      );

    await persistState(
      {
        accounts,
        reports,
        notifications: [...notifications, ...residentNotifications],
      },
      residentNotifications
    );
  };

  const submitReport = async (payload) => {
    const resident = accounts.find((account) => account.id === payload.residentId);
    const normalizedPhotoUris = Array.isArray(payload.photoUris)
      ? payload.photoUris.filter(Boolean).slice(0, 5)
      : payload.photoUri
        ? [payload.photoUri]
        : [];
    const nextReport = {
      id: createId("report"),
      residentId: payload.residentId,
      residentName: resident?.fullName || "Resident",
      incidentType: payload.incidentType,
      description: payload.description,
      purok: payload.purok,
      date: payload.date,
      time: payload.time,
      photoUri: normalizedPhotoUris[0] || payload.photoUri || "",
      photoUris: normalizedPhotoUris,
      location: payload.location,
      status: "Pending",
      ...getResetConfirmationCycleFields(),
      adminFeedback: [],
      residentReplies: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const adminAccounts = accounts.filter((account) => account.role === "admin");
    const createdNotifications = [
      createNotification(payload.residentId, "Report Submitted", "Your report has been successfully sent.", "report", nextReport.id),
      ...adminAccounts.map((admin) =>
        createNotification(
          admin.id,
          "New Incident Report",
          `${nextReport.residentName} submitted a ${nextReport.incidentType} report.`,
          "report",
          nextReport.id
        )
      ),
    ];

    await persistState(
      {
        accounts,
        reports: [nextReport, ...reports],
        notifications: [...notifications, ...createdNotifications],
      },
      createdNotifications
    );

    return nextReport;
  };

  const updateResidentReport = async (reportId, changes) => {
    const report = reports.find((item) => item.id === reportId);
    const createdNotifications = accounts
      .filter((item) => item.role === "admin")
      .map((admin) =>
        createNotification(
          admin.id,
          "Report Updated",
          `${report?.residentName || "A resident"} updated a report entry.`,
          "report",
          reportId
        )
      );

    const nextReports = reports.map((item) =>
      item.id === reportId ? { ...item, ...changes, updatedAt: new Date().toISOString() } : item
    );

    await persistState(
      { accounts, reports: nextReports, notifications: [...notifications, ...createdNotifications] },
      createdNotifications
    );
  };

  const updateReportStatus = async (reportId, status, actorId, notificationOverrides = {}) => {
    const report = reports.find((item) => item.id === reportId);
    const actor = accounts.find((item) => item.id === actorId);

    if (!report || !actor) {
      return;
    }

    const nextReports = reports.map((item) => {
      if (item.id !== reportId) {
        return item;
      }

      const confirmationCycleFields =
        status === "For Confirmation"
          ? getWaitingConfirmationFields()
          : status === "Resolved" || status === "Rejected" || status === "Ongoing" || status === "Pending"
            ? getResetConfirmationCycleFields()
            : {};

      return {
        ...item,
        status,
        ...confirmationCycleFields,
        updatedAt: new Date().toISOString(),
      };
    });

    const reportOwnerNotification =
      actor.role === "admin"
        ? createNotification(
            report.residentId,
            notificationOverrides.reportOwnerTitle || "Report Status Updated",
            notificationOverrides.reportOwnerMessage || `Your report is now marked as ${status}.`,
            "status",
            reportId
          )
        : null;

    const adminNotifications =
      actor.role === "resident"
        ? accounts
            .filter((item) => item.role === "admin")
            .map((admin) =>
              createNotification(
                admin.id,
                notificationOverrides.adminTitle || "Resident Response Received",
                notificationOverrides.adminMessage || `${report.residentName} updated the report status to ${status}.`,
                "status",
                reportId
              )
            )
        : [];

    const createdNotifications = [...(reportOwnerNotification ? [reportOwnerNotification] : []), ...adminNotifications];

    await persistState(
      {
        accounts,
        reports: nextReports,
        notifications: [...notifications, ...createdNotifications],
      },
      createdNotifications
    );
  };

  const requestReportConfirmationFollowUp = async (reportId, residentId) => {
    const report = reports.find((item) => item.id === reportId);
    const resident = accounts.find((item) => item.id === residentId);

    if (!report || !resident || report.residentId !== residentId || report.status !== "For Confirmation") {
      return;
    }

    const nextReports = reports.map((item) =>
      item.id === reportId
        ? {
            ...item,
            status: "Ongoing",
            confirmationCycleState: CONFIRMATION_CYCLE_REJECTED_PENDING_FEEDBACK,
            confirmationRejectedAt: new Date().toISOString(),
            confirmationFeedbackSubmittedAt: null,
            confirmationAdminRespondedAt: null,
            updatedAt: new Date().toISOString(),
          }
        : item
    );

    const createdNotifications = accounts
      .filter((item) => item.role === "admin")
      .map((admin) =>
        createNotification(
          admin.id,
          "Resident requested follow-up",
          `${resident.fullName} marked the report as not yet resolved and returned it to ongoing.`,
          "status",
          reportId
        )
      );

    await persistState(
      {
        accounts,
        reports: nextReports,
        notifications: [...notifications, ...createdNotifications],
      },
      createdNotifications
    );
  };

  const addAdminFeedback = async (reportId, adminId, input, notificationOverrides = {}) => {
    const admin = accounts.find((account) => account.id === adminId);
    const report = reports.find((item) => item.id === reportId);

    if (!admin || !report) {
      return;
    }

    const payload = typeof input === "string" ? { text: input } : input || {};

    const nextFeedback = {
      id: createId("feedback"),
      text: String(payload.text || "").trim(),
      authorId: adminId,
      authorName: admin.fullName,
      createdAt: new Date().toISOString(),
      replyToId: payload.replyToId || null,
      attachments: normalizeThreadAttachments(payload.attachments),
    };

    const nextReports = reports.map((item) => {
      if (item.id !== reportId) {
        return item;
      }

      const confirmationCycleFields =
        item.confirmationCycleState === CONFIRMATION_CYCLE_REJECTED_PENDING_FEEDBACK && item.confirmationFeedbackSubmittedAt
          ? { confirmationAdminRespondedAt: new Date().toISOString() }
          : {};

      return {
        ...item,
        ...confirmationCycleFields,
        adminFeedback: [...item.adminFeedback, nextFeedback],
        updatedAt: new Date().toISOString(),
      };
    });

    const createdNotifications = [
      createNotification(
        report.residentId,
        notificationOverrides.reportOwnerTitle || "Admin Feedback Added",
        notificationOverrides.reportOwnerMessage || "Barangay admin added feedback to your report.",
        "feedback",
        reportId
      ),
    ];

    await persistState(
      {
        accounts,
        reports: nextReports,
        notifications: [...notifications, ...createdNotifications],
      },
      createdNotifications
    );
  };

  const editAdminFeedback = async (reportId, feedbackId, text) => {
    const nextReports = reports.map((report) =>
      report.id === reportId
        ? {
            ...report,
            adminFeedback: report.adminFeedback.map((feedback) =>
              feedback.id === feedbackId ? { ...feedback, text: text.trim(), editedAt: new Date().toISOString() } : feedback
            ),
            updatedAt: new Date().toISOString(),
          }
        : report
    );

    await persistState({ accounts, reports: nextReports, notifications });
  };

  const addResidentReply = async (reportId, residentId, input, notificationOverrides = {}) => {
    const resident = accounts.find((account) => account.id === residentId);

    if (!resident) {
      return;
    }

    const payload = typeof input === "string" ? { text: input } : input || {};

    const nextReply = {
      id: createId("reply"),
      text: String(payload.text || "").trim(),
      authorId: residentId,
      authorName: resident.fullName,
      createdAt: new Date().toISOString(),
      replyToId: payload.replyToId || null,
      attachments: normalizeThreadAttachments(payload.attachments),
    };

    const nextReports = reports.map((item) => {
      if (item.id !== reportId) {
        return item;
      }

      const confirmationCycleFields =
        item.confirmationCycleState === CONFIRMATION_CYCLE_REJECTED_PENDING_FEEDBACK
          ? { confirmationFeedbackSubmittedAt: new Date().toISOString() }
          : {};

      return {
        ...item,
        ...confirmationCycleFields,
        residentReplies: [...item.residentReplies, nextReply],
        updatedAt: new Date().toISOString(),
      };
    });

    const createdNotifications = accounts
      .filter((item) => item.role === "admin")
      .map((admin) =>
        createNotification(
          admin.id,
          notificationOverrides.adminTitle || "Resident Reply Added",
          notificationOverrides.adminMessage || `${resident.fullName} replied to a report feedback thread.`,
          "reply",
          reportId
        )
      );

    await persistState(
      {
        accounts,
        reports: nextReports,
        notifications: [...notifications, ...createdNotifications],
      },
      createdNotifications
    );
  };

  const reopenReportConfirmation = async (reportId, adminId) => {
    const report = reports.find((item) => item.id === reportId);
    const admin = accounts.find((item) => item.id === adminId);

    if (
      !report ||
      !admin ||
      admin.role !== "admin" ||
      report.status !== "For Confirmation" ||
      report.confirmationCycleState !== CONFIRMATION_CYCLE_REJECTED_PENDING_FEEDBACK ||
      !report.confirmationFeedbackSubmittedAt ||
      !report.confirmationAdminRespondedAt
    ) {
      return;
    }

    const nextReports = reports.map((item) =>
      item.id === reportId
        ? {
            ...item,
            ...getWaitingConfirmationFields(),
            updatedAt: new Date().toISOString(),
          }
        : item
    );

    const createdNotifications = [
      createNotification(
        report.residentId,
        "Report Reopened for Confirmation",
        "The barangay replied and reopened your report for confirmation.",
        "status",
        reportId
      ),
    ];

    await persistState(
      {
        accounts,
        reports: nextReports,
        notifications: [...notifications, ...createdNotifications],
      },
      createdNotifications
    );
  };

  const addResidentAccount = async (payload, adminId) => {
    const normalizedEmail = payload.email.trim().toLowerCase();
    const normalizedPhone = normalizePhoneNumber(payload.contactNumber);
    const timestamp = new Date().toISOString();
    const residentDateOfBirth = payload.dateOfBirth || "";
    const residentGender = payload.gender || "Prefer not to say";
    const residentAge = payload.age || calculateAgeFromDob(residentDateOfBirth);

    if (accounts.some((item) => item.email.trim().toLowerCase() === normalizedEmail)) {
      throw new Error("Email is already in use.");
    }

    if (findPhoneConflict(accounts, normalizedPhone)) {
      throw new Error("Phone number is already registered.");
    }

    const resident = {
      id: createId("resident"),
      role: "resident",
      fullName: payload.fullName.trim(),
      email: normalizedEmail,
      password: payload.password,
      purok: payload.purok,
      address: payload.address?.trim() || "",
      contactNumber: normalizedPhone,
      dateOfBirth: residentDateOfBirth,
      gender: residentGender,
      age: residentAge ? Number(residentAge) : "",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const createdNotifications = [
      createNotification(resident.id, "Resident Account Added", "A barangay admin created your account.", "account"),
      createNotification(adminId, "Resident Added", `${resident.fullName} has been added to the local registry.`, "account", null, resident.id),
    ];

    await persistState(
      {
        accounts: [...accounts, resident],
        reports,
        notifications: [...notifications, ...createdNotifications],
      },
      createdNotifications
    );
  };

  const deleteResidentAccount = async (residentId, adminId, options = {}) => {
    const resident = accounts.find((item) => item.id === residentId);
    const nextAccounts = accounts.filter((item) => item.id !== residentId);
    const nextReports = reports.filter((report) => report.residentId !== residentId);
    const nextNotifications = notifications.filter((item) => item.userId !== residentId);
    const deletedAt = new Date().toISOString();
    const adminMessage = options.message?.trim() || "";
    const createdNotifications = resident
      ? [
          createNotification(
            residentId,
            "Account Deleted",
            adminMessage
              ? `Your account has been deleted by admin. ${adminMessage}`
              : "Your account has been deleted by admin.",
            "deleted_account",
            null,
            residentId,
            {
              residentName: resident.fullName,
              message: adminMessage,
              deletedAt,
            }
          ),
          createNotification(
            adminId,
            "Resident Deleted",
            `${resident.fullName}'s account was removed.${adminMessage ? ` Reason: ${adminMessage}` : ""}`,
            "account",
            null,
            residentId,
            {
              residentName: resident.fullName,
              message: adminMessage,
              deletedAt,
            }
          ),
        ]
      : [];

    await persistState(
      {
        accounts: nextAccounts,
        reports: nextReports,
        notifications: [...nextNotifications, ...createdNotifications],
      },
      createdNotifications
    );
  };

  const deleteCurrentAccount = async (options = {}) => {
    if (!currentUser) {
      throw new Error("Account not found.");
    }

    const nextAccounts = accounts.filter((item) => item.id !== currentUser.id);
    const nextReports = currentUser.role === "resident"
      ? reports.filter((report) => report.residentId !== currentUser.id)
      : reports;
    const nextNotifications = notifications.filter((item) => item.userId !== currentUser.id);
    const deletedAt = new Date().toISOString();
    const feedback = options.message?.trim() || "";
    const createdNotifications = currentUser.role === "resident"
      ? accounts
          .filter((item) => item.role === "admin")
          .map((admin) =>
            createNotification(
              admin.id,
              "Resident Account Deleted",
              feedback
                ? `${currentUser.fullName} deleted their account. Feedback: ${feedback}`
                : `${currentUser.fullName} deleted their account.`,
              "account",
              null,
              currentUser.id,
              {
                residentName: currentUser.fullName,
                message: feedback,
                deletedAt,
              }
            )
          )
      : [];

    await persistState(
      {
        accounts: nextAccounts,
        reports: nextReports,
        notifications: [...nextNotifications, ...createdNotifications],
      },
      createdNotifications
    );

    await clearSession();
    setSessionUser(null);
  };

  const deleteReport = async (reportId, adminId, options = {}) => {
    const report = reports.find((item) => item.id === reportId);
    const nextReports = reports.filter((item) => item.id !== reportId);
    const deletedAt = new Date().toISOString();
    const adminMessage = options.message?.trim() || "";
    const createdNotifications = report
      ? [
          createNotification(
            report.residentId,
            "Report Deleted",
            adminMessage ? "Your report has been deleted." : "Your report has been deleted.",
            "deleted_report",
            reportId,
            report.residentId,
            {
              reportTitle: report.incidentType,
              message: adminMessage,
              deletedAt,
            }
          ),
          createNotification(
            adminId,
            "Report Deleted",
            `A report from ${report.residentName} was deleted.${adminMessage ? ` Reason: ${adminMessage}` : ""}`,
            "report",
            reportId,
            report.residentId,
            {
              reportTitle: report.incidentType,
              message: adminMessage,
              deletedAt,
            }
          ),
        ]
      : [];

    await persistState(
      {
        accounts,
        reports: nextReports,
        notifications: [...notifications, ...createdNotifications],
      },
      createdNotifications
    );
  };

  const setThemeMode = async (mode) => {
    await persistPreferences({ themeMode: mode });
  };

  const requestNotificationPermission = async () => {
    const permission = await requestNotificationAccess();
    const nextPreferences = await persistPreferences({
      notificationsEnabled: permission.granted,
      notificationsPermission: permission.status,
    });

    return permission.granted && nextPreferences.notificationsEnabled;
  };

  const setNotificationsEnabled = async (enabled) => {
    if (enabled && preferences.notificationsPermission !== "granted") {
      const permission = await requestNotificationAccess();
      const nextPreferences = await persistPreferences({
        notificationsEnabled: permission.granted,
        notificationsPermission: permission.status,
      });
      return nextPreferences.notificationsEnabled;
    }

    const nextPreferences = await persistPreferences({ notificationsEnabled: enabled });
    return nextPreferences.notificationsEnabled;
  };

  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);
  const toggleDrawer = () => setDrawerOpen((current) => !current);

  const value = {
    loading,
    accounts,
    reports: sortByLatest(reports, "updatedAt"),
    notifications,
    preferences,
    dialogConfig,
    inAppNotification,
    theme,
    drawerOpen,
    currentUser,
    currentNotifications,
    unreadNotificationsCount,
    visibleUnreadNotificationsCount,
    login,
    signupResident,
    logout,
    resetPasswordByPhone,
    resetPasswordByEmail,
    changePassword,
    updateProfile,
    markNotificationRead,
    deleteNotification,
    sendAnnouncement,
    submitReport,
    updateResidentReport,
    updateReportStatus,
    requestReportConfirmationFollowUp,
    addAdminFeedback,
    editAdminFeedback,
    addResidentReply,
    reopenReportConfirmation,
    addResidentAccount,
    deleteResidentAccount,
    deleteCurrentAccount,
    deleteReport,
    setThemeMode,
    requestNotificationPermission,
    setNotificationsEnabled,
    showAlert,
    showConfirmation,
    hideDialog,
    hideInAppNotification,
    pressDialogButton,
    openDrawer,
    closeDrawer,
    toggleDrawer,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used within AppProvider.");
  }

  return context;
}
