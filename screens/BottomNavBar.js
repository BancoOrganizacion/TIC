import React from "react";
import { View, TouchableOpacity, Image, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

const BottomNavBar = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.navBar}>
      {/* Botón de Inicio */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigation.navigate("Inicio")}
      >
        <Image
          source={{ uri: "https://cdn-icons-png.flaticon.com/512/25/25694.png" }} // Ícono de casita
          style={styles.navIcon}
        />
        <Text style={styles.navText}>Inicio</Text>
      </TouchableOpacity>

      {/* Botón de Movimientos */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigation.navigate("Movimientos")}
      >
        <Image
          source={{ uri: "https://cdn-icons-png.flaticon.com/512/44/44500.png" }} // Ícono de dos flechas bidireccionales
          style={styles.navIcon}
        />
        <Text style={styles.navText}>Movimientos</Text>
      </TouchableOpacity>

      {/* Botón de Perfil */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigation.navigate("Perfil")}
      >
        <Image
          source={{ uri: "https://cdn-icons-png.flaticon.com/512/64/64572.png" }} // Ícono de perfil
          style={styles.navIcon}
        />
        <Text style={styles.navText}>Perfil</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  navButton: {
    alignItems: "center",
  },
  navIcon: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  navText: {
    color: "#83898F",
    fontSize: 11,
  },
});

export default BottomNavBar;