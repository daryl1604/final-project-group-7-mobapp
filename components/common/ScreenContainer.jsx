import { Children } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AppHeader from "./AppHeader";
import { useApp } from "../../storage/AppProvider";
import { createScreenContainerStyles } from "../../styles/common/ScreenContainer.styles";

export default function ScreenContainer({
  children,
  scroll = true,
  contentStyle,
  safeStyle,
  keyboardShouldPersistTaps = "never",
  keyboardDismissMode = "none",
  scrollRef,
  onScroll,
  onLayout,
}) {
  const { theme } = useApp();
  const insets = useSafeAreaInsets();
  const styles = createScreenContainerStyles(theme, insets);
  const childArray = Children.toArray(children);
  const headerIndex = childArray.findIndex((child) => child?.type === AppHeader);
  const header = headerIndex >= 0 ? childArray[headerIndex] : null;
  const bodyChildren = headerIndex >= 0
    ? childArray.filter((_, index) => index !== headerIndex)
    : childArray;

  return (
    <SafeAreaView style={[styles.safeArea, safeStyle]}>
      <KeyboardAvoidingView
        style={styles.wrapper}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {header ? <View style={styles.headerSlot}>{header}</View> : null}
        {scroll ? (
          <ScrollView
            ref={scrollRef}
            style={styles.body}
            contentContainerStyle={[styles.content, contentStyle]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            keyboardDismissMode={keyboardDismissMode}
            automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
            onScroll={onScroll}
            onLayout={onLayout}
            scrollEventThrottle={16}
          >
            {bodyChildren}
          </ScrollView>
        ) : (
          <View style={[styles.body, styles.content, contentStyle]}>{bodyChildren}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
