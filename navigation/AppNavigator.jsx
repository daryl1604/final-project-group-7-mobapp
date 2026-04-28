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
  BackHandler,
  Image,
  InteractionManager,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { addNotificationResponseListener, getLastNotificationResponse } from "../utils/notificationUtils";

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
    animation: "fade",
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
        <Ionicons
          name={iconMap[route.name]}
          size={route.name === "AdminProfile" || route.name === "ResidentProfile" ? 24 : 20}
          color={color}
        />
      </View>
    ),
  });
}

function createResidentTabOptions(theme, insets, iconMap) {
  return ({ route }) => {
    const isFabRoute = route.name === "ResidentAddReport";

    return {
      headerShown: false,
      sceneStyle: {
        backgroundColor: theme.background,
      },
      animation: "fade",
      tabBarActiveTintColor: theme.primary,
      tabBarInactiveTintColor: theme.textSoft,
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: "700",
        marginTop: isFabRoute ? 10 : 2,
        marginBottom: isFabRoute ? 2 : 6,
      },
      tabBarItemStyle: {
        paddingTop: isFabRoute ? 0 : 8,
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
      tabBarIcon: ({ color, focused }) => {
        if (isFabRoute) {
          const fabColors =
            theme.mode === "dark"
              ? focused
                ? ["#1e3f8f", "#16336f"]
                : ["#234ca7", "#1b3f89"]
              : focused
                ? ["#245ee7", "#1d4ed8"]
                : ["#2f6bff", "#2563eb"];

          return (
            <View style={styles.fabTabWrap}>
              <LinearGradient
                colors={fabColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.fabTabButton,
                  theme.mode === "dark"
                    ? styles.fabTabButtonDark
                    : styles.fabTabButtonLight,
                ]}
              >
                <Ionicons name={iconMap[route.name]} size={28} color="#ffffff" />
              </LinearGradient>
            </View>
          );
        }

        return (
          <View style={[styles.tabIconWrap, focused ? { backgroundColor: theme.primarySoft } : null]}>
            <Ionicons
              name={iconMap[route.name]}
              size={route.name === "ResidentProfile" ? 24 : 20}
              color={color}
            />
          </View>
        );
      },
    };
  };
}

function createStackScreenOptions(theme) {
  return {
    headerShown: false,
    contentStyle: {
      backgroundColor: theme.background,
    },
    animation: Platform.OS === "ios" ? "default" : "slide_from_right",
    animationDuration: Platform.OS === "ios" ? 240 : 210,
    gestureEnabled: true,
    fullScreenGestureEnabled: true,
  };
}

function SideMenuOverlay() {
  const { currentUser, logout, theme, drawerOpen, closeDrawer } = useApp();
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const manageRotate = useRef(new Animated.Value(0)).current;
  const navigationTimeoutRef = useRef(null);
  const isAdmin = currentUser?.role === "admin";
  const drawerPalette = getDrawerPalette(theme, isAdmin);
  const [manageMenuOpen, setManageMenuOpen] = useState(false);

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: drawerOpen ? 0 : -DRAWER_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [drawerOpen, translateX]);

  useEffect(() => {
    Animated.timing(manageRotate, {
      toValue: manageMenuOpen ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [manageMenuOpen, manageRotate]);

  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  const role = currentUser?.role;
  const initials = currentUser?.fullName
    ?.split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const displayName = (currentUser?.fullName || "Barangay User").toUpperCase();
  const displayEmail = (currentUser?.email || "No email available").toLowerCase();

  const closeDrawerThen = (callback) => {
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    setManageMenuOpen(false);
    closeDrawer();

    navigationTimeoutRef.current = setTimeout(() => {
      InteractionManager.runAfterInteractions(() => {
        callback();
      });
    }, 220);
  };

  const navigateTo = (target) => {
    closeDrawerThen(() => {
      if (navigationRef.isReady()) {
        navigationRef.navigate(target);
      }
    });
  };

  const navigateToManageAction = (screen) => {
    closeDrawerThen(() => {
      if (navigationRef.isReady()) {
        navigationRef.navigate(screen);
      }
    });
  };

  const getDrawerPressableStyle = () => styles.drawerItem;

  const getDrawerSubmenuPressableStyle = () => styles.drawerSubmenuItem;

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
                {isAdmin ? (
                  <View>
                    <Pressable
                      android_ripple={{ color: "transparent" }}
                      style={getDrawerPressableStyle}
                      onPress={() => setManageMenuOpen((current) => !current)}
                    >
                      <View style={styles.drawerIconWrap}>
                        <Ionicons name="construct-outline" size={20} color={drawerPalette.icon} />
                      </View>
                      <Text style={[styles.drawerItemLabel, { color: drawerPalette.text }]}>Manage</Text>
                      <Animated.View
                        style={{
                          transform: [
                            {
                              rotate: manageRotate.interpolate({
                                inputRange: [0, 1],
                                outputRange: ["0deg", "90deg"],
                              }),
                            },
                          ],
                        }}
                      >
                        <Ionicons name="chevron-forward" size={18} color={drawerPalette.chevron} />
                      </Animated.View>
                    </Pressable>
                    {manageMenuOpen ? (
                      <View style={styles.drawerSubmenu}>
                        <Pressable
                          android_ripple={{ color: "transparent" }}
                          style={getDrawerSubmenuPressableStyle}
                          onPress={() => navigateToManageAction("AddResidentAccountScreen")}
                        >
                          <View style={styles.drawerSubmenuContent}>
                            <Ionicons name="person-add-outline" size={17} color={drawerPalette.icon} />
                            <Text style={[styles.drawerSubmenuLabel, { color: drawerPalette.text }]}>Add Resident</Text>
                          </View>
                        </Pressable>
                        <Pressable
                          android_ripple={{ color: "transparent" }}
                          style={getDrawerSubmenuPressableStyle}
                          onPress={() => navigateToManageAction("ManageAccountsScreen")}
                        >
                          <View style={styles.drawerSubmenuContent}>
                            <Ionicons name="people-outline" size={17} color={drawerPalette.icon} />
                            <Text style={[styles.drawerSubmenuLabel, { color: drawerPalette.text }]}>Resident Accounts</Text>
                          </View>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                ) : null}
                <Pressable
                  android_ripple={{ color: "transparent" }}
                  style={getDrawerPressableStyle}
                  onPress={() => navigateTo("Settings")}
                >
                  <View style={styles.drawerIconWrap}>
                    <Ionicons name="settings-outline" size={20} color={drawerPalette.icon} />
                  </View>
                  <Text style={[styles.drawerItemLabel, { color: drawerPalette.text }]}>Settings</Text>
                  <Ionicons name="chevron-forward" size={18} color={drawerPalette.chevron} />
                </Pressable>
              </View>

              <View style={[styles.drawerDivider, { backgroundColor: drawerPalette.divider }]} />

              <View style={styles.drawerSection}>
                <Pressable
                  android_ripple={{ color: "transparent" }}
                  style={getDrawerPressableStyle}
                  onPress={() => navigateTo("Help")}
                >
                  <View style={styles.drawerIconWrap}>
                    <Ionicons name="help-circle-outline" size={20} color={drawerPalette.icon} />
                  </View>
                  <Text style={[styles.drawerItemLabel, { color: drawerPalette.text }]}>Help</Text>
                  <Ionicons name="chevron-forward" size={18} color={drawerPalette.chevron} />
                </Pressable>
                <Pressable
                  android_ripple={{ color: "transparent" }}
                  style={getDrawerPressableStyle}
                  onPress={() => navigateTo("About")}
                >
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
                  android_ripple={{ color: "transparent" }}
                  style={getDrawerPressableStyle}
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
  const { theme } = useApp();

  return (
    <Stack.Navigator screenOptions={createStackScreenOptions(theme)}>
      <Stack.Screen name="ResidentDashboardScreen" component={ResidentDashboardScreen} />
      <Stack.Screen name="SubmitReport" component={SubmitReportScreen} />
      <Stack.Screen
        name="ResidentReportDetails"
        component={ResidentReportDetailsScreen}
        getId={({ params }) => params?.reportId}
      />
      <Stack.Screen name="EditReport" component={EditReportScreen} />
    </Stack.Navigator>
  );
}

function ResidentReportsStack() {
  const { theme } = useApp();

  return (
    <Stack.Navigator screenOptions={createStackScreenOptions(theme)}>
      <Stack.Screen name="MyReportsScreen" component={MyReportsScreen} />
      <Stack.Screen
        name="ResidentReportDetails"
        component={ResidentReportDetailsScreen}
        getId={({ params }) => params?.reportId}
      />
      <Stack.Screen name="EditReport" component={EditReportScreen} />
    </Stack.Navigator>
  );
}

function AdminHomeStack() {
  const { theme } = useApp();

  return (
    <Stack.Navigator screenOptions={createStackScreenOptions(theme)}>
      <Stack.Screen name="AdminDashboardScreen" component={AdminDashboardScreen} />
      <Stack.Screen
        name="AdminReportDetails"
        component={AdminReportDetailsScreen}
        getId={({ params }) => params?.reportId}
      />
    </Stack.Navigator>
  );
}

function AdminReportsStack() {
  const { theme } = useApp();

  return (
    <Stack.Navigator screenOptions={createStackScreenOptions(theme)}>
      <Stack.Screen name="AllReportsScreen" component={AllReportsScreen} />
      <Stack.Screen
        name="AdminReportDetails"
        component={AdminReportDetailsScreen}
        getId={({ params }) => params?.reportId}
      />
    </Stack.Navigator>
  );
}

function AdminAnalyticsStack() {
  const { theme } = useApp();

  return (
    <Stack.Navigator screenOptions={createStackScreenOptions(theme)}>
      <Stack.Screen name="AdminAnalyticsScreen" component={AdminAnalyticsScreen} />
    </Stack.Navigator>
  );
}

function AdminProfileStack() {
  const { theme } = useApp();

  return (
    <Stack.Navigator screenOptions={createStackScreenOptions(theme)}>
      <Stack.Screen name="AdminProfileScreen" component={AdminProfileScreen} />
    </Stack.Navigator>
  );
}

function ResidentAddReportStack() {
  const { theme } = useApp();

  return (
    <Stack.Navigator screenOptions={createStackScreenOptions(theme)}>
      <Stack.Screen name="SubmitReport" component={SubmitReportScreen} />
    </Stack.Navigator>
  );
}

function ResidentProfileStack() {
  const { theme } = useApp();

  return (
    <Stack.Navigator screenOptions={createStackScreenOptions(theme)}>
      <Stack.Screen name="ResidentProfileScreen" component={ResidentProfileScreen} />
    </Stack.Navigator>
  );
}

function AdminManageStack() {
  const { theme } = useApp();

  return (
    <Stack.Navigator screenOptions={createStackScreenOptions(theme)}>
      <Stack.Screen name="ManageReportsScreen" component={ManageReportsScreen} />
      <Stack.Screen
        name="AdminReportDetails"
        component={AdminReportDetailsScreen}
        getId={({ params }) => params?.reportId}
      />
      <Stack.Screen name="AddResidentAccountScreen" component={AddResidentAccountScreen} />
      <Stack.Screen name="ManageAccountsScreen" component={ManageAccountsScreen} />
    </Stack.Navigator>
  );
}

function ResidentTabs() {
  const { theme, visibleUnreadNotificationsCount } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      backBehavior="history"
      screenOptions={createResidentTabOptions(theme, insets, {
        ResidentHome: "grid-outline",
        ResidentReports: "document-text-outline",
        ResidentAddReport: "add",
        ResidentNotifications: "notifications-outline",
        ResidentProfile: "person-circle-outline",
      })}
    >
      <Tab.Screen name="ResidentHome" component={ResidentHomeStack} options={{ title: "Dashboard" }} />
      <Tab.Screen
        name="ResidentReports"
        component={ResidentReportsStack}
        options={{ title: "Reports", popToTopOnBlur: true }}
      />
      <Tab.Screen name="ResidentAddReport" component={ResidentAddReportStack} options={{ title: "Add Report" }} />
      <Tab.Screen
        name="ResidentNotifications"
        component={ResidentNotificationsScreen}
        options={{
          title: "Alerts",
          tabBarBadge: visibleUnreadNotificationsCount > 0 ? visibleUnreadNotificationsCount : undefined,
        }}
      />
      <Tab.Screen name="ResidentProfile" component={ResidentProfileStack} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  const { theme, visibleUnreadNotificationsCount } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      backBehavior="history"
      screenOptions={createTabOptions(theme, insets, {
        AdminHome: "grid-outline",
        AdminReports: "folder-open-outline",
        AdminAnalytics: "bar-chart-outline",
        AdminNotifications: "notifications-outline",
        AdminProfile: "person-circle-outline",
      })}
    >
      <Tab.Screen name="AdminHome" component={AdminHomeStack} options={{ title: "Dashboard" }} />
      <Tab.Screen
        name="AdminReports"
        component={AdminReportsStack}
        options={{ title: "All Reports", popToTopOnBlur: true }}
      />
      <Tab.Screen name="AdminAnalytics" component={AdminAnalyticsStack} options={{ title: "Analytics" }} />
      <Tab.Screen
        name="AdminNotifications"
        component={AdminNotificationsScreen}
        options={{
          title: "Alerts",
          tabBarBadge: visibleUnreadNotificationsCount > 0 ? visibleUnreadNotificationsCount : undefined,
        }}
      />
      <Tab.Screen name="AdminProfile" component={AdminProfileStack} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}

function AdminRootStack() {
  const { closeDrawer, theme } = useApp();

  return (
    <Stack.Navigator screenOptions={createStackScreenOptions(theme)}>
      <Stack.Screen
        name="AdminTabsRoot"
        component={AdminTabs}
        listeners={{ focus: closeDrawer }}
      />
      <Stack.Screen name="AdminManage" component={AdminManageStack} listeners={{ focus: closeDrawer }} />
      <Stack.Screen name="AdminProfileDrawer" component={AdminProfileScreen} listeners={{ focus: closeDrawer }} />
      <Stack.Screen name="ResidentProfileView" component={ResidentProfileScreen} listeners={{ focus: closeDrawer }} />
      <Stack.Screen name="AddResidentAccountScreen" component={AddResidentAccountScreen} listeners={{ focus: closeDrawer }} />
      <Stack.Screen name="ManageAccountsScreen" component={ManageAccountsScreen} listeners={{ focus: closeDrawer }} />
      <Stack.Screen name="Settings" component={SettingsScreen} listeners={{ focus: closeDrawer }} />
      <Stack.Screen name="Help" component={HelpScreen} listeners={{ focus: closeDrawer }} />
      <Stack.Screen name="About" component={AboutScreen} listeners={{ focus: closeDrawer }} />
    </Stack.Navigator>
  );
}

function ResidentRootStack() {
  const { closeDrawer, theme } = useApp();

  return (
    <Stack.Navigator screenOptions={createStackScreenOptions(theme)}>
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
  const { theme } = useApp();

  return (
    <RootStack.Navigator initialRouteName="Welcome" screenOptions={createStackScreenOptions(theme)}>
      <RootStack.Screen name="Welcome" component={WelcomeScreen} />
      <RootStack.Screen name="Login" component={LoginScreen} />
      <RootStack.Screen name="Signup" component={SignupScreen} />
      <RootStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </RootStack.Navigator>
  );
}

function AppContent() {
  const { currentUser, closeDrawer, drawerOpen, showAlert } = useApp();
  const handledResponseRef = useRef(null);

  useEffect(() => {
    if (!currentUser) {
      closeDrawer();
    }
  }, [closeDrawer, currentUser]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!drawerOpen) {
        return false;
      }

      closeDrawer();
      return true;
    });

    return () => {
      subscription.remove();
    };
  }, [closeDrawer, drawerOpen]);

  useEffect(() => {
    if (!currentUser) {
      return undefined;
    }

    const openFromNotification = (response) => {
      const data = response?.notification?.request?.content?.data || {};
      const notificationId = data.notificationId || response?.notification?.request?.identifier;

      if (notificationId && handledResponseRef.current === notificationId) {
        return;
      }

      handledResponseRef.current = notificationId || null;

      if (!navigationRef.isReady()) {
        return;
      }

      if (data.type === "deleted_report" && currentUser.role === "resident") {
        const reportTitle = data.details?.reportTitle || "Report";
        const adminMessage = data.details?.message?.trim();
        const deletedAt = data.details?.deletedAt ? new Date(data.details.deletedAt).toLocaleString() : "Not available";

        showAlert(
          "Report Deleted",
          `${reportTitle}\n\n${adminMessage ? `Admin message: ${adminMessage}\n\n` : ""}Deleted: ${deletedAt}`,
          { variant: "info" }
        );
        return;
      }

      if (data.reportId) {
        if (currentUser.role === "admin") {
          navigationRef.navigate("AdminTabsRoot", {
            screen: "AdminReports",
            params: {
              screen: "AllReportsScreen",
              params: {
                selectedReportId: data.reportId,
                selectionKey: notificationId || `${data.reportId}_${Date.now()}`,
                scrollTo: data.type === "reply" || data.type === "feedback" ? "feedback" : undefined,
              },
            },
          });
        } else {
          navigationRef.navigate("ResidentTabsRoot", {
            screen: "ResidentReports",
            params: {
              screen: "MyReportsScreen",
              params: {
                selectedReportId: data.reportId,
                selectionKey: notificationId || `${data.reportId}_${Date.now()}`,
                scrollTo: data.type === "reply" || data.type === "feedback" ? "feedback" : undefined,
              },
            },
          });
        }
        return;
      }

      navigationRef.navigate(
        currentUser.role === "admin" ? "AdminTabsRoot" : "ResidentTabsRoot",
        {
          screen: currentUser.role === "admin" ? "AdminNotifications" : "ResidentNotifications",
        }
      );
    };

    let subscription;

    addNotificationResponseListener((response) => {
      openFromNotification(response);
    }).then((value) => {
      subscription = value;
    });

    getLastNotificationResponse().then((response) => {
      if (response) {
        openFromNotification(response);
      }
    });

    return () => {
      subscription?.remove?.();
    };
  }, [currentUser, closeDrawer, showAlert]);

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
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <NavigationContainer ref={navigationRef} theme={getNavigationTheme(theme)}>
        <AppContent />
      </NavigationContainer>
    </View>
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
  fabTabWrap: {
    marginTop: -34,
    alignItems: "center",
    justifyContent: "center",
  },
  fabTabButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 14,
    borderWidth: 4,
  },
  fabTabButtonLight: {
    shadowColor: "rgba(37, 99, 235, 0.48)",
    borderColor: "#f7faff",
  },
  fabTabButtonDark: {
    shadowColor: "rgba(0, 0, 0, 0.34)",
    borderColor: "#0d1728",
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
  drawerSubmenu: {
    marginTop: 2,
    marginLeft: 70,
    paddingRight: 10,
    paddingBottom: 10,
    gap: 8,
  },
  drawerSubmenuItem: {
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  drawerSubmenuContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  drawerSubmenuLabel: {
    fontSize: 15,
    fontWeight: "700",
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
