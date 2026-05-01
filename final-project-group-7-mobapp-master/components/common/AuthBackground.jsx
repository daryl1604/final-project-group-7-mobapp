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
    backgroundColor: "#020617",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4,12,24,0.42)",
  },
  bottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 240,
    backgroundColor: "rgba(3,10,20,0.4)",
  },
});

export default memo(AuthBackground);
