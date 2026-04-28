import {
  APP_PREFERENCES_KEY,
  APP_REMEMBERED_LOGIN_KEY,
  APP_SESSION_KEY,
  APP_STORAGE_KEY,
} from "../constants/appConstants";
import { getStoredJson, removeStoredJson, setStoredJson } from "./asyncStorageHelpers";
import { seedAccounts, seedNotifications, seedReports } from "./seedData";

const defaultPreferences = {
  themeMode: "light",
  notificationsEnabled: true,
  notificationsPermission: "undetermined",
};

function migrateAccounts(accounts = []) {
  const fallbackTimestamp = new Date().toISOString();

  return accounts.map((account) => {
    const createdAt = account.createdAt || account.updatedAt || fallbackTimestamp;

    return {
      ...account,
      createdAt,
      updatedAt: account.updatedAt || createdAt,
    };
  });
}

export async function bootstrapAppStorage() {
  const data = await getStoredJson(APP_STORAGE_KEY, null);

  if (data) {
    const mergedData = {
      // Preserve the user's saved account list exactly as stored so deleted demo
      // residents do not get re-added on every app launch.
      accounts: migrateAccounts(Array.isArray(data.accounts) ? data.accounts : []),
      reports: Array.isArray(data.reports) ? data.reports : seedReports,
      notifications: Array.isArray(data.notifications) ? data.notifications : seedNotifications,
    };

    await setStoredJson(APP_STORAGE_KEY, mergedData);
    return mergedData;
  }

  const seededData = {
    accounts: migrateAccounts(seedAccounts),
    reports: seedReports,
    notifications: seedNotifications,
  };

  await setStoredJson(APP_STORAGE_KEY, seededData);
  return seededData;
}

export async function saveAppStorage(value) {
  await setStoredJson(APP_STORAGE_KEY, value);
}

export async function loadSession() {
  return getStoredJson(APP_SESSION_KEY, null);
}

export async function saveSession(user) {
  await setStoredJson(APP_SESSION_KEY, user);
}

export async function clearSession() {
  await removeStoredJson(APP_SESSION_KEY);
}

export async function loadPreferences() {
  const stored = await getStoredJson(APP_PREFERENCES_KEY, null);
  return stored ? { ...defaultPreferences, ...stored } : defaultPreferences;
}

export async function savePreferences(value) {
  await setStoredJson(APP_PREFERENCES_KEY, { ...defaultPreferences, ...value });
}

export async function loadRememberedLogin() {
  return getStoredJson(APP_REMEMBERED_LOGIN_KEY, null);
}

export async function saveRememberedLogin(value) {
  await setStoredJson(APP_REMEMBERED_LOGIN_KEY, value);
}

export async function clearRememberedLogin() {
  await removeStoredJson(APP_REMEMBERED_LOGIN_KEY);
}
