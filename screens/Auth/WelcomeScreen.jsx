import { Image, ImageBackground, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import ScreenContainer from "../../components/common/ScreenContainer";
import { welcomeScreenStyles } from "../../styles/auth/WelcomeScreen.styles";

const wallpaperSource = require("../../assets/images/wallpaper.png");
const logoSource = require("../../assets/images/brgywatch-logo.png");

export default function WelcomeScreen({ navigation }) {
  return (
    <ImageBackground source={wallpaperSource} style={welcomeScreenStyles.backgroundImage} resizeMode="cover" blurRadius={9}>
      <LinearGradient
        colors={["rgba(4,10,20,0.64)", "rgba(5,14,28,0.72)", "rgba(3,8,18,0.82)"]}
        locations={[0, 0.42, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={welcomeScreenStyles.gradientOverlay}
      />
      <LinearGradient
        colors={["rgba(41,98,255,0.08)", "rgba(255,255,255,0)", "rgba(0,0,0,0.22)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={welcomeScreenStyles.atmosphereOverlay}
      />

      <ScreenContainer contentStyle={welcomeScreenStyles.content} safeStyle={welcomeScreenStyles.safeArea}>
        <View style={welcomeScreenStyles.hero}>
          <Image source={logoSource} style={welcomeScreenStyles.logo} resizeMode="contain" />
        </View>

        <View style={welcomeScreenStyles.buttonStack}>
          <Pressable
            style={[welcomeScreenStyles.pressable, welcomeScreenStyles.primaryButton]}
            onPress={() => navigation.navigate("Login")}
            android_ripple={{ color: "transparent" }}
          >
            <LinearGradient
              colors={["#65a3ff", "#3478f6", "#1f5fe0"]}
              locations={[0, 0.48, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={welcomeScreenStyles.primaryButtonGradient}
            >
              <Text style={welcomeScreenStyles.primaryButtonText}>Sign In</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={[welcomeScreenStyles.pressable, welcomeScreenStyles.secondaryButton]}
            onPress={() => navigation.navigate("Signup")}
            android_ripple={{ color: "transparent" }}
          >
            <Text style={welcomeScreenStyles.secondaryButtonText}>Create Account</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    </ImageBackground>
  );
}
