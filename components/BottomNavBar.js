import React from "react";
import { View, TouchableOpacity, Image, Text, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

const BottomNavBar = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const currentScreen = route.name;

  // Función para determinar si un botón está activo
  const isActive = (screenName) => {
    if (screenName === "Home" && currentScreen === "Home") {
      return true;
    }
    return currentScreen === screenName;
  };

  // Estilos condicionales para texto de botones activos
  const getTextStyle = (screenName) => {
    return [styles.navText, isActive(screenName) && styles.activeNavText];
  };

  // Estilos condicionales para iconos activos
  const getIconStyle = (screenName) => {
    return [styles.navIcon, isActive(screenName) && styles.activeNavIcon];
  };

  return (
    <View style={styles.navContainer}>
      <View style={styles.navBar}>
        {/* Botón de Home */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Image
            source={require("../assets/images/home.png")}
            style={getIconStyle("Home")}
            resizeMode="contain"
          />
          <Text style={getTextStyle("Home")}>Inicio</Text>
        </TouchableOpacity>

        {/* Botón de Movimientos */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("TransactionHistory")}
        >
          <Image
            source={require("../assets/images/transfer.png")}
            style={getIconStyle("TransactionHistory")}
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
            source={require("../assets/images/profile.png")}
            style={getIconStyle("ProfileScreen")}
            resizeMode="contain"
          />
          <Text style={getTextStyle("ProfileScreen")}>Perfil</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.bottomSafeArea} />
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 8,
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
  },
  navButton: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  navIcon: {
    width: 24,
    height: 24,
    marginBottom: 4,
    tintColor: "#83898F",
  },
  activeNavIcon: {
    tintColor: "#5C2684",
  },
  navText: {
    color: "#83898F",
    fontSize: 12,
  },
  activeNavText: {
    color: "#5C2684",
    fontWeight: "bold",
  },
  bottomSafeArea: {
    height: 24,
  }
});

export default BottomNavBar;