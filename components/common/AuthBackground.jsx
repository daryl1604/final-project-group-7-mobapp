import { memo } from "react";
import { ImageBackground, StyleSheet, View } from "react-native";

const wallpaperSource = require("../../assets/images/wallpaper.png");

function AuthBackground({ blurRadius = 6 }) {
  return (
    <View pointerEvents="none" style={styles.layer}>
      <ImageBackground source={wallpaperSource} style={styles.image} resizeMode="cover" blurRadius={blurRadius} />
      <View style={styles.gradientOverlay} />
      <View style={styles.bottomFade} />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#100803",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 10, 4, 0.52)",
  },
  bottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 240,
    backgroundColor: "rgba(15, 8, 3, 0.48)",
  },
});

export default memo(AuthBackground);
