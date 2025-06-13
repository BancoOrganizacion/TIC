import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Image, StyleSheet, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("Login");
    }, 5000);

    return () => clearTimeout(timer); 
  }, [navigation]);

  return (
    <LinearGradient
      style={styles.portada}
      locations={[0, 1]}
      colors={["#57435c", "#130c2a"]}
      useAngle={true}
      angle={180}
    >
      <StatusBar style="auto" />
      <Pressable style={styles.pressable}>
        <Image
          style={styles.maskGroupIcon}
          resizeMode="cover"
          source={require("../assets/images/cash-logo.png")}
        />
        <Text style={styles.nameApp}>Cash App</Text>
      </Pressable>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  maskGroupIcon: {
    top: 320,
    left: 130,
    width: 142,
    height: 171,
    position: "absolute",
  },
  nameApp: {
    top: 460,
    left: 120,
    fontSize: 30,
    letterSpacing: 0,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
    color: "#fff",
    textAlign: "center",
    width: 162,
    height: 68,
    position: "absolute",
  },
  pressable: {
    flex: 1,
    height: "100%",
    overflow: "hidden",
    backgroundColor: "transparent",
    width: "100%",
  },
  portada: {
    height: "100%",
    width: "100%",
  },
});

export default SplashScreen;
