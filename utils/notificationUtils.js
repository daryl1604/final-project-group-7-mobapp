import { Platform } from "react-native";
import { isRunningInExpoGo } from "expo";

let notificationHandlerConfigured = false;

async function getNotificationsModule() {
  if (isRunningInExpoGo()) {
    return null;
  }

  const Notifications = await import("expo-notifications");

  if (!notificationHandlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    notificationHandlerConfigured = true;
  }

  return Notifications;
}

export async function requestNotificationAccess() {
  const Notifications = await getNotificationsModule();

  if (!Notifications) {
    return {
      granted: false,
      status: "unavailable_in_expo_go",
      isDevice: false,
    };
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 180, 250],
      lightColor: "#2563eb",
    });
  }

  const existingStatus = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus.status;

  if (finalStatus !== "granted") {
    const permission = await Notifications.requestPermissionsAsync();
    finalStatus = permission.status;
  }

  return {
    granted: finalStatus === "granted",
    status: finalStatus,
    isDevice: true,
  };
}

export async function sendLocalNotification({ title, body, data }) {
  const Notifications = await getNotificationsModule();

  if (!Notifications) {
    return false;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null,
  });

  return true;
}

export async function addNotificationResponseListener(listener) {
  const Notifications = await getNotificationsModule();

  if (!Notifications) {
    return null;
  }

  return Notifications.addNotificationResponseReceivedListener(listener);
}

export async function getLastNotificationResponse() {
  const Notifications = await getNotificationsModule();

  if (!Notifications) {
    return null;
  }

  return Notifications.getLastNotificationResponseAsync();
}
