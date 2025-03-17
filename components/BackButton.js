import React from "react";
import { TouchableOpacity, View, Image, StyleSheet } from "react-native";

const BackButton = ({ onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.button}>
      <View style={styles.circle}>
        <Image
          source={{ uri: "https://cdn-icons-png.flaticon.com/512/271/271220.png" }} // URL del ícono de flecha hacia atrás
          style={styles.icon}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: "center",
    alignItems: "center",
  },
  circle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9D9D9",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: 14,
    height: 14,
  },
});

export default BackButton;