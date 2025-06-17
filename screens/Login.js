import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppLayout } from "../components";
import FormField from "../components/FormField";
import Button from "../components/Button";
import { authService } from "../services/api";

const LoginScreen = () => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const checkSavedUsername = async () => {
      try {
        const savedUsername = await AsyncStorage.getItem("savedUsername");
        if (savedUsername) {
          setCredentials(prev => ({ ...prev, username: savedUsername }));
        }
      } catch (error) {
        console.error("Error al recuperar usuario guardado:", error);
      }
    };

    checkSavedUsername();
  }, []);
  const handleChange = (field, value) => {
    setCredentials({
      ...credentials,
      [field]: value,
    });

    // Limpiar errores cuando el usuario escribe
    if (errors[field]) {
      const newErrors = { ...errors };

      // Si es un error de credenciales inválidas, limpiar ambos campos
      if (errors[field] === "Usuario o contraseña incorrectos") {
        newErrors.username = null;
        newErrors.password = null;
      } else {
        newErrors[field] = null;
      }

      setErrors(newErrors);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!credentials.username.trim()) {
      newErrors.username = "El nombre de usuario es requerido";
    }

    if (!credentials.password) {
      newErrors.password = "La contraseña es requerida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await authService.login(
        credentials.username,
        credentials.password
      );

      if (response.data && response.data.access_token) {
        await AsyncStorage.setItem("token", response.data.access_token);
        await AsyncStorage.setItem("nombre_usuario", credentials.username);
        console.log("Login response data:", response.data);

        // Save user profile if available in response
        if (response.data.usuario) {
          console.log("Saving user profile:", response.data.usuario);
          await AsyncStorage.setItem("userProfile", JSON.stringify(response.data.usuario));

          // Save the real name specifically
          if (response.data.usuario.nombre) {
            console.log("Saving real name:", response.data.usuario.nombre);
            await AsyncStorage.setItem("nombreReal", response.data.usuario.nombre);
          }
        }

        navigation.reset({
          index: 0,
          routes: [{ name: "Home" }],
        });
      } else {
        throw new Error("Token no recibido del servidor");
      }
    } catch (error) {
      console.error("Login error:", error);
      console.error("Error de login:", error);

      let errorMessage = "Ha ocurrido un error inesperado";
      let errorTitle = "Error de inicio de sesión";

      if (error.response?.status === 401) {
        errorTitle = "Credenciales inválidas";
        errorMessage = "El usuario o contraseña ingresados son incorrectos. Por favor, verifica tus datos e intenta nuevamente.";

        // Limpiar el campo de contraseña en caso de credenciales inválidas
        setCredentials(prev => ({ ...prev, password: "" }));

        // Mostrar error específico en los campos
        setErrors({
          username: "Usuario o contraseña incorrectos",
          password: "Usuario o contraseña incorrectos"
        });
      } else if (error.response?.status === 500) {
        errorTitle = "Error del servidor";
        errorMessage = "Hay un problema con el servidor. Por favor, intenta más tarde.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert(errorTitle, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    navigation.navigate("Register");
  };

  return (
    <AppLayout
      showGreeting={false}
      showNavBar={false}
      showHeader={false}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        paddingBottom: 40,
      }}
      contentStyle={{
        paddingHorizontal: 24,
        paddingTop: 40,
      }}
    >
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>¡Bienvenido! 👋</Text>
      <Text style={styles.subtitle}>
        Únete a nuestra comunidad. ¡Te estamos esperando!
      </Text>

      <FormField
        label="Nombre de usuario"
        value={credentials.username}
        onChangeText={(value) => handleChange("username", value)}
        placeholder="Ingresa tu usuario"
        errorMessage={errors.username}
        autoCapitalize="none"
        style={styles.formField}
      />

      <FormField
        label="Contraseña"
        value={credentials.password}
        onChangeText={(value) => handleChange("password", value)}
        placeholder="Ingresa tu contraseña"
        errorMessage={errors.password}
        isPassword={true}
        isPasswordVisible={isPasswordVisible}
        togglePasswordVisibility={() => setIsPasswordVisible(!isPasswordVisible)}
        style={styles.formField}
      />

      <View style={styles.buttonContainer}>
        <Button
          title={isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
          onPress={handleLogin}
          style={isLoading ? styles.disabledButton : null}
          disabled={isLoading}
        />
      </View>

      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>¿No tienes una cuenta aún?</Text>
        <TouchableOpacity onPress={handleRegister}>
          <Text style={styles.registerButton}> Regístrate</Text>
        </TouchableOpacity>
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 80,
  },
  title: {
    color: "#1F2C37",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    color: "#78828A",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
  },
  formField: {
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  disabledButton: {
    opacity: 0.7,
    backgroundColor: "#9B59B6",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  registerText: {
    color: "#1F2C37",
    fontSize: 16,
  },
  registerButton: {
    color: "#5C2684",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default LoginScreen;