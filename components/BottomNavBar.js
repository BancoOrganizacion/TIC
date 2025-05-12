// BottomNavBar.js (modificado para los nombres en inglés)
import React from "react";
import { View, TouchableOpacity, Image, Text, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

const BottomNavBar = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const currentScreen = route.name;

  // Función para determinar si un botón está activo
  const isActive = (screenName) => {
    return currentScreen === screenName;
  };

  // Estilos condicionales para texto de botones activos
  const getTextStyle = (screenName) => {
    return [styles.navText, isActive(screenName) && styles.activeNavText];
  };

  return (
    <View style={styles.navBar}>
      {/* Botón de Home */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigation.navigate("Home")}
      >
        <Image
          source={{
            uri: "https://cdn-icons-png.flaticon.com/512/263/263115.png",
          }}
          style={styles.navIcon}
        />
        <Text style={getTextStyle("Home")}>Inicio</Text>
      </TouchableOpacity>

      {/* Botón de Movimientos (mantenemos el texto en español) */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigation.navigate("TransactionHistory")}
      >
        <Image
          source={require("../assets/images/transfer.png")}
          style={[styles.navIcon,styles.bigBoldIcon]}
          resizeMode="contain"
        />
        <Text style={getTextStyle("TransactionHistory")}>Movimientos</Text>
      </TouchableOpacity>

      {/* Botón de Perfil */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigation.navigate("ProfileScreen")}
      >
        <Image
          source={{
            uri: "https://cdn-icons-png.flaticon.com/512/1144/1144760.png",
          }}
          style={styles.navIcon}
        />
        <Text style={getTextStyle("ProfileScreen")}>Perfil</Text>
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
  activeNavText: {
    color: "#5C2684",
    fontWeight: "bold",
  },
  bigBoldIcon: {
    width: 32,  
    height: 32,
    tintColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 }
  }
});

export default BottomNavBar;
