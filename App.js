import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./navigation/AppNavigator";
import AppDialog from "./components/common/AppDialog";
import InAppNotificationBanner from "./components/common/InAppNotificationBanner";
import { AppProvider, useApp } from "./storage/AppProvider";

function AppShell() {
  const { theme } = useApp();

  return (
    <>
      <StatusBar style={theme.statusBar} />
      <AppNavigator />
      <InAppNotificationBanner />
      <AppDialog />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </SafeAreaProvider>
  );
}
