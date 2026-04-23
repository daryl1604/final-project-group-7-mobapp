import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useApp } from "../../storage/AppProvider";
import { createAppHeaderStyles } from "../../styles/common/AppHeader.styles";

export default function AppHeader({
  eyebrow,
  title,
  subtitle,
  rightContent,
  showMenu = true,
  variant = "default",
  preferBackButton = false,
  leftIconName,
  onLeftPress,
}) {
  const { theme, openDrawer } = useApp();
  const navigation = useNavigation();
  const styles = createAppHeaderStyles(theme);
  const isToolbar = variant === "toolbar";
  const shouldUseBackButton = preferBackButton || [
    "Settings",
    "Help",
    "About",
    "Profile",
    "View Profile",
    "Add Resident",
    "Manage Accounts",
    "Resident Accounts",
    "New Message",
  ].includes(title);
  const resolvedLeftIconName = leftIconName || (shouldUseBackButton ? "arrow-back-outline" : "menu-outline");
  const handleLeftPress = onLeftPress || (shouldUseBackButton && navigation.canGoBack()
    ? () => navigation.goBack()
    : openDrawer);

  const menuButton = (
    <Pressable
      style={[
        isToolbar ? styles.toolbarIconButton : styles.menuButton,
        isToolbar ? null : { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
      ]}
      onPress={handleLeftPress}
    >
      <Ionicons name={resolvedLeftIconName} size={22} color={theme.text} />
    </Pressable>
  );

  return (
    <View style={[styles.header, isToolbar ? styles.toolbarHeader : null]}>
      <View style={[styles.titleRow, isToolbar ? styles.toolbarRow : null]}>
        {showMenu ? <View>{menuButton}</View> : null}
        <View style={styles.textBlock}>
          <Text style={[styles.title, isToolbar ? styles.toolbarTitle : null]}>{title}</Text>
        </View>
        {rightContent ? <View>{rightContent}</View> : null}
      </View>
    </View>
  );
}
