import { Ionicons } from "@expo/vector-icons";
import {
  createNavigationContainerRef,
  NavigationContainer,
} from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useEffect, useMemo, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getNavigationTheme } from "../constants/theme";
import ForgotPasswordScreen from "../screens/Auth/ForgotPasswordScreen";
import LoginScreen from "../screens/Auth/LoginScreen";
import SignupScreen from "../screens/Auth/SignupScreen";
import WelcomeScreen from "../screens/Auth/WelcomeScreen";
import AddResidentAccountScreen from "../screens/Admin/AddResidentAccountScreen";
import AdminAnalyticsScreen from "../screens/Admin/AdminAnalyticsScreen";
import AdminDashboardScreen from "../screens/Admin/AdminDashboardScreen";
import AdminNotificationsScreen from "../screens/Admin/AdminNotificationsScreen";
import AdminProfileScreen from "../screens/Admin/AdminProfileScreen";
import AdminReportDetailsScreen from "../screens/Admin/AdminReportDetailsScreen";
import AllReportsScreen from "../screens/Admin/AllReportsScreen";
import ManageAccountsScreen from "../screens/Admin/ManageAccountsScreen";
import ManageReportsScreen from "../screens/Admin/ManageReportsScreen";
import AboutScreen from "../screens/Shared/AboutScreen";
import HelpScreen from "../screens/Shared/HelpScreen";
import SettingsScreen from "../screens/Shared/SettingsScreen";
import EditReportScreen from "../screens/Resident/EditReportScreen";
import MyReportsScreen from "../screens/Resident/MyReportsScreen";
import ResidentDashboardScreen from "../screens/Resident/ResidentDashboardScreen";
import ResidentNotificationsScreen from "../screens/Resident/ResidentNotificationsScreen";
import ResidentProfileScreen from "../screens/Resident/ResidentProfileScreen";
import ResidentReportDetailsScreen from "../screens/Resident/ResidentReportDetailsScreen";
import SubmitReportScreen from "../screens/Resident/SubmitReportScreen";
import { useApp } from "../storage/AppProvider";

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();
const DRAWER_WIDTH = 312;

function LoadingScreen() {
  const { theme } = useApp();

  return (
    <View style={[styles.loadingScreen, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.loadingText, { color: theme.textMuted }]}>Loading mobile app...</Text>
    </View>
  );
}

function createTabOptions(theme, insets, iconMap) {
  return ({ route }) => ({
    headerShown: false,
    sceneStyle: {
      backgroundColor: theme.background,
    },
    tabBarActiveTintColor: theme.primary,
    tabBarInactiveTintColor: theme.textSoft,
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: "700",
      marginTop: 2,
      marginBottom: 6,
    },
    tabBarItemStyle: {
      paddingTop: 8,
    },
    tabBarStyle: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 68 + Math.max(insets.bottom, 0),
      paddingTop: 6,
      paddingBottom: Math.max(insets.bottom, 8),
      paddingHorizontal: 12,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      backgroundColor: theme.tabBar,
      borderTopWidth: 1,
      borderWidth: 1,
      borderColor: theme.tabBarBorder,
      shadowColor: theme.shadowStrong,
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 10,
    },
    tabBarIcon: ({ color, focused }) => (
      <View style={[styles.tabIconWrap, focused ? { backgroundColor: theme.primarySoft } : null]}>
        <Ionicons name={iconMap[route.name]} size={20} color={color} />
      </View>
    ),
  });
}

function SideMenuOverlay() {
  const { currentUser, logout, theme, drawerOpen, openDrawer, closeDrawer } = useApp();
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const isAdmin = currentUser?.role === "admin";
  const drawerPalette = getDrawerPalette(theme, isAdmin);

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: drawerOpen ? 0 : -DRAWER_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [drawerOpen, translateX]);

  const role = currentUser?.role;
  const initials = currentUser?.fullName
    ?.split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const displayName = (currentUser?.fullName || "Barangay User").toUpperCase();
  const displayEmail = (currentUser?.email || "No email available").toLowerCase();

  const navigateTo = (target) => {
    closeDrawer();
    if (navigationRef.isReady()) {
      navigationRef.navigate(target);
    }
  };

  return (
    <>
      {currentUser && drawerOpen ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Pressable style={[styles.drawerBackdrop, { backgroundColor: theme.overlay }]} onPress={closeDrawer} />
          <Animated.View
            style={[
              styles.drawerShell,
              {
                backgroundColor: drawerPalette.shell,
                transform: [{ translateX }],
                paddingTop: Math.max(insets.top, 16),
                paddingBottom: Math.max(insets.bottom, 12),
              },
            ]}
          >
            <View style={styles.drawerScroll}>
              <LinearGradient
                colors={drawerPalette.hero}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.drawerHero}
              >
                {currentUser?.photoUri ? (
                  <Image source={{ uri: currentUser.photoUri }} style={[styles.avatarImage, { borderColor: drawerPalette.divider }]} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: drawerPalette.avatar, borderColor: drawerPalette.divider }]}>
                    <Text style={[styles.avatarText, { color: drawerPalette.avatarText }]}>{initials || "BW"}</Text>
                  </View>
                )}
                <Text style={[styles.drawerName, { color: drawerPalette.text }]}>{displayName}</Text>
                <Text style={[styles.drawerEmail, { color: drawerPalette.email }]}>{displayEmail}</Text>
              </LinearGradient>

              <View style={[styles.drawerDivider, { backgroundColor: drawerPalette.divider }]} />

              <View style={styles.drawerSection}>
                <Pressable style={styles.drawerItem} onPress={() => navigateTo(role === "admin" ? "AdminProfileDrawer" : "ResidentProfileDrawer")}>
                  <View style={styles.drawerIconWrap}>
                    <Ionicons name="person-circle-outline" size={20} color={drawerPalette.icon} />
                  </View>
                  <Text style={[styles.drawerItemLabel, { color: drawerPalette.text }]}>View Profile</Text>
                  <Ionicons name="chevron-forward" size={18} color={drawerPalette.chevron} />
                </Pressable>
                <Pressable style={styles.drawerItem} onPress={() => navigateTo("Settings")}>
                  <View style={styles.drawerIconWrap}>
                    <Ionicons name="settings-outline" size={20} color={drawerPalette.icon} />
                  </View>
                  <Text style={[styles.drawerItemLabel, { color: drawerPalette.text }]}>Settings</Text>
                  <Ionicons name="chevron-forward" size={18} color={drawerPalette.chevron} />
                </Pressable>
              </View>

              <View style={[styles.drawerDivider, { backgroundColor: drawerPalette.divider }]} />

              <View style={styles.drawerSection}>
                <Pressable style={styles.drawerItem} onPress={() => navigateTo("Help")}>
                  <View style={styles.drawerIconWrap}>
                    <Ionicons name="help-circle-outline" size={20} color={drawerPalette.icon} />
                  </View>
                  <Text style={[styles.drawerItemLabel, { color: drawerPalette.text }]}>Help</Text>
                  <Ionicons name="chevron-forward" size={18} color={drawerPalette.chevron} />
                </Pressable>
                <Pressable style={styles.drawerItem} onPress={() => navigateTo("About")}>
                  <View style={styles.drawerIconWrap}>
                    <Ionicons name="information-circle-outline" size={20} color={drawerPalette.icon} />
                  </View>
                  <Text style={[styles.drawerItemLabel, { color: drawerPalette.text }]}>About</Text>
                  <Ionicons name="chevron-forward" size={18} color={drawerPalette.chevron} />
                </Pressable>
              </View>

              <View style={[styles.drawerDivider, { backgroundColor: drawerPalette.divider }]} />

              <View style={styles.drawerSection}>
                <Pressable
                  style={styles.drawerItem}
                  onPress={async () => {
                    closeDrawer();
                    await logout();
                  }}
                >
                  <View style={styles.drawerIconWrap}>
                    <Ionicons name="log-out-outline" size={20} color={drawerPalette.logoutText} />
                  </View>
                  <Text style={[styles.drawerItemLabel, { color: drawerPalette.logoutText }]}>Log out</Text>
                </Pressable>
              </View>

              <View style={styles.drawerBottom}>
                <Text style={[styles.drawerVersion, { color: drawerPalette.version }]}>v. 1.0.0</Text>
              </View>
            </View>
          </Animated.View>
        </View>
      ) : null}
    </>
  );
}

function ResidentHomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ResidentDashboardScreen" component={ResidentDashboardScreen} />
      <Stack.Screen name="ResidentReportDetails" component={ResidentReportDetailsScreen} />
      <Stack.Screen name="EditReport" component={EditReportScreen} />
    </Stack.Navigator>
  );
}

function ResidentReportsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyReportsScreen" component={MyReportsScreen} />
      <Stack.Screen name="ResidentReportDetails" component={ResidentReportDetailsScreen} />
      <Stack.Screen name="EditReport" component={EditReportScreen} />
    </Stack.Navigator>
  );
}

function AdminHomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboardScreen" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminReportDetails" component={AdminReportDetailsScreen} />
    </Stack.Navigator>
  );
}

function AdminReportsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AllReportsScreen" component={AllReportsScreen} />
      <Stack.Screen name="AdminReportDetails" component={AdminReportDetailsScreen} />
    </Stack.Navigator>
  );
}

function AdminAnalyticsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminAnalyticsScreen" component={AdminAnalyticsScreen} />
    </Stack.Navigator>
  );
}

function AdminManageStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ManageReportsScreen" component={ManageReportsScreen} />
      <Stack.Screen name="AddResidentAccountScreen" component={AddResidentAccountScreen} />
      <Stack.Screen name="ManageAccountsScreen" component={ManageAccountsScreen} />
      <Stack.Screen name="AdminReportDetails" component={AdminReportDetailsScreen} />
    </Stack.Navigator>
  );
}

function ResidentTabs() {
  const { theme, unreadNotificationsCount } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={createTabOptions(theme, insets, {
        ResidentHome: "grid-outline",
        SubmitReport: "add-circle-outline",
        ResidentReports: "document-text-outline",
        ResidentNotifications: "notifications-outline",
      })}
    >
      <Tab.Screen name="ResidentHome" component={ResidentHomeStack} options={{ title: "Dashboard" }} />
      <Tab.Screen name="SubmitReport" component={SubmitReportScreen} options={{ title: "Submit" }} />
      <Tab.Screen name="ResidentReports" component={ResidentReportsStack} options={{ title: "My Reports" }} />
      <Tab.Screen
        name="ResidentNotifications"
        component={ResidentNotificationsScreen}
        options={{
          title: "Alerts",
          tabBarBadge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
        }}
      />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  const { theme, unreadNotificationsCount } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={createTabOptions(theme, insets, {
        AdminHome: "grid-outline",
        AdminReports: "folder-open-outline",
        AdminAnalytics: "bar-chart-outline",
        AdminNotifications: "notifications-outline",
        AdminManage: "people-outline",
      })}
    >
      <Tab.Screen name="AdminHome" component={AdminHomeStack} options={{ title: "Dashboard" }} />
      <Tab.Screen name="AdminReports" component={AdminReportsStack} options={{ title: "All Reports" }} />
      <Tab.Screen name="AdminAnalytics" component={AdminAnalyticsStack} options={{ title: "Analytics" }} />
      <Tab.Screen
        name="AdminNotifications"
        component={AdminNotificationsScreen}
        options={{
          title: "Notifications",
          tabBarBadge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
        }}
      />
      <Tab.Screen name="AdminManage" component={AdminManageStack} options={{ title: "Manage" }} />
    </Tab.Navigator>
  );
}

function AdminRootStack() {
  const { closeDrawer } = useApp();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="AdminTabsRoot"
        component={AdminTabs}
        listeners={{ focus: closeDrawer }}
      />
      <Stack.Screen name="AdminProfileDrawer" component={AdminProfileScreen} listeners={{ focus: closeDrawer }} />
      <Stack.Screen name="Settings" component={SettingsScreen} listeners={{ focus: closeDrawer }} />
      <Stack.Screen name="Help" component={HelpScreen} listeners={{ focus: closeDrawer }} />
      <Stack.Screen name="About" component={AboutScreen} listeners={{ focus: closeDrawer }} />
    </Stack.Navigator>
  );
}

function ResidentRootStack() {
  const { closeDrawer } = useApp();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="ResidentTabsRoot"
        component={ResidentTabs}
        listeners={{ focus: closeDrawer }}
      />
      <Stack.Screen name="ResidentProfileDrawer" component={ResidentProfileScreen} listeners={{ focus: closeDrawer }} />
      <Stack.Screen name="Settings" component={SettingsScreen} listeners={{ focus: closeDrawer }} />
      <Stack.Screen name="Help" component={HelpScreen} listeners={{ focus: closeDrawer }} />
      <Stack.Screen name="About" component={AboutScreen} listeners={{ focus: closeDrawer }} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <RootStack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Welcome" component={WelcomeScreen} />
      <RootStack.Screen name="Login" component={LoginScreen} />
      <RootStack.Screen name="Signup" component={SignupScreen} />
      <RootStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </RootStack.Navigator>
  );
}

function AppContent() {
  const { currentUser, closeDrawer } = useApp();

  useEffect(() => {
    if (!currentUser) {
      closeDrawer();
    }
  }, [closeDrawer, currentUser]);

  return (
    <>
      {currentUser ? currentUser.role === "admin" ? <AdminRootStack /> : <ResidentRootStack /> : <AuthStack />}
      <SideMenuOverlay />
    </>
  );
}

export default function AppNavigator() {
  const { loading, theme } = useApp();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef} theme={getNavigationTheme(theme)}>
      <AppContent />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: "600",
  },
  tabIconWrap: {
    width: 38,
    height: 30,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 60,
  },
  drawerShell: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    zIndex: 70,
    paddingHorizontal: 16,
  },
  drawerScroll: {
    flex: 1,
    gap: 0,
  },
  drawerHero: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 22,
    gap: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    borderWidth: 3,
  },
  avatarText: {
    fontSize: 44,
    fontWeight: "400",
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 18,
    backgroundColor: "#ffffff",
    borderWidth: 3,
  },
  drawerName: {
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  drawerEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  drawerSection: {
    paddingVertical: 12,
  },
  drawerDivider: {
    height: 1,
    marginHorizontal: 6,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    paddingHorizontal: 10,
    paddingVertical: 14,
  },
  drawerIconWrap: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerItemLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  drawerBottom: {
    marginTop: "auto",
    gap: 16,
    paddingTop: 8,
  },
  drawerVersion: {
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: "500",
  },
  drawerLogout: {
    minHeight: 56,
    alignItems: "flex-start",
    justifyContent: "center",
    flexDirection: "row",
    gap: 18,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  drawerLogoutText: {
    fontSize: 16,
    fontWeight: "500",
  },
});

function getDrawerPalette(theme, isAdmin) {
  return {
    shell: theme.background,
    hero: [theme.background, theme.background],
    avatar: theme.surface,
    avatarText: theme.textSoft,
    card: theme.surface,
    cardBorder: theme.border,
    iconSurface: "transparent",
    icon: theme.text,
    text: theme.text,
    email: theme.textSoft,
    chevron: theme.textSoft,
    divider: theme.border,
    logoutText: theme.text,
    version: theme.textSoft,
  };
}
