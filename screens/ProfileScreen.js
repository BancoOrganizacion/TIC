import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { userService } from "../services/api";
import AppLayout from "../components/AppLayout";
import Button from "../components/Button";

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);

      const [storedProfile, storedUsername] = await Promise.all([
        AsyncStorage.getItem("userProfile"),
        AsyncStorage.getItem("nombre_usuario"),
      ]);

      if (storedProfile) {
        setUserData(JSON.parse(storedProfile));
        setIsLoading(false);
      }

      // Obtener datos actualizados del backend
      const response = await userService.getUserProfile();
      if (response?.data) {
        const fullProfile = {
          ...response.data,
          nombre_usuario: response.data.nombre_usuario || storedUsername || "",
        };

        setUserData(fullProfile);

        // Guardar en AsyncStorage para futuras cargas rápidas
        await AsyncStorage.setItem("userProfile", JSON.stringify(fullProfile));
        if (fullProfile.nombre_usuario) {
          await AsyncStorage.setItem(
            "nombre_usuario",
            fullProfile.nombre_usuario
          );
        }
      }
    } catch (error) {
      console.error("Error al cargar datos del usuario:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserData();

    const unsubscribe = navigation.addListener("focus", () => {
      fetchUserData();
    });

    return unsubscribe;
  }, [navigation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove([
        "token",
        "userProfile",
        "nombre_usuario",
      ]);

      // Redirigir al login
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  if (isLoading) {
    return (
      <AppLayout
        title="Perfil"
        showBack={true}
        onBackPress={handleBackPress}
        showGreeting={false}
        scrollable={false}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5C2684" />
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Perfil"
      showBack={true}
      onBackPress={handleBackPress}
      showGreeting={false}
    >
      <View style={styles.profileImageContainer}>
        <Image
          source={require("../assets/images/user.png")}
          style={styles.profileImage}
          resizeMode="contain" />
      </View>

      <View style={styles.nameContainer}>
        <Text style={styles.nameText}>
          {userData?.nombre || "Nombre"} {userData?.apellido || "Apellido"}
        </Text>
        {userData?.nombre_usuario && (
          <Text style={styles.usernameText}>@{userData.nombre_usuario}</Text>
        )}
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Información Personal</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("UserProfile")}
        >
          <Image
            source={require("../assets/images/user.png")}
            style={styles.menuIcon}
            resizeMode="contain"
          />
          <Text style={styles.menuText}>Tu perfil</Text>
        </TouchableOpacity>

        <View style={styles.separator} />        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("AccountSelector")}
        >
          <Image
            source={require("../assets/images/transaction.png")}
            style={styles.menuIcon}
            resizeMode="contain"
          />
          <Text style={styles.menuText}>Historial de transacciones</Text>
        </TouchableOpacity>
      </View>      <View style={styles.fullSeparator} />

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Seguridad</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("BiometricPatterns")}
        >
          <Image
            source={require("../assets/images/fingerprint.png")}
            style={styles.menuIcon}
            resizeMode="contain"
          />
          <Text style={styles.menuText}>Patrones</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("RestrictionsList")}
        >
          <Image
            source={require("../assets/images/restrictions.png")}
            style={styles.menuIcon}
            resizeMode="contain"
          />
          <Text style={styles.menuText}>Restricciones</Text>
        </TouchableOpacity>
      </View>      <View style={styles.fullSeparator} />

      <View style={styles.buttonContainer}>
        <Button
          title="Cerrar sesión"
          onPress={handleLogout}
          style={styles.logoutButton}
          textStyle={styles.logoutText}
        />
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileImageContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  nameContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  nameText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1C1B1F",
  },
  usernameText: {
    fontSize: 16,
    color: "#83898F",
    marginTop: 5,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#83898F",
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  menuIcon: {
    width: 24,
    height: 24,
    marginRight: 15,
  },
  menuText: {
    fontSize: 16,
    color: "#1C1B1F",
  },
  separator: {
    height: 1,
    backgroundColor: "#F2F2F5",
    marginVertical: 8,
  },
  fullSeparator: {
    height: 1,
    backgroundColor: "#F2F2F5",
    marginVertical: 15,
    marginHorizontal: 20,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  logoutButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#5C2684",
  },
  logoutText: {
    color: "#5C2684",
  },
});

export default ProfileScreen;