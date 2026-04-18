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
}) {
  const { theme, openDrawer } = useApp();
  const navigation = useNavigation();
  const styles = createAppHeaderStyles(theme);
  const isToolbar = variant === "toolbar";
  const shouldUseBackButton = ["Settings", "Help", "About", "Profile", "View Profile"].includes(title);
  const leftIconName = shouldUseBackButton ? "arrow-back-outline" : "menu-outline";
  const handleLeftPress = shouldUseBackButton && navigation.canGoBack()
    ? () => navigation.goBack()
    : openDrawer;

  const menuButton = (
    <Pressable
      style={[
        isToolbar ? styles.toolbarIconButton : styles.menuButton,
        isToolbar ? null : { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
      ]}
      onPress={handleLeftPress}
    >
      <Ionicons name={leftIconName} size={22} color={theme.text} />
    </Pressable>
  );

  return (
    <View style={[styles.header, isToolbar ? styles.toolbarHeader : null]}>
      <View style={[styles.titleRow, isToolbar ? styles.toolbarRow : null]}>
        {showMenu ? <View>{menuButton}</View> : null}
        <View style={styles.textBlock}>
          <Text style={[styles.title, isToolbar ? styles.toolbarTitle : null]}>{title}</Text>
        </View>
        {!isToolbar && rightContent ? <View>{rightContent}</View> : null}
      </View>
    </View>
  );
}
