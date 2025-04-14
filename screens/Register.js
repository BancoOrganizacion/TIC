import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import BackButton from "../components/BackButton";
import { userService, authService } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default () => {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    cedula: "",
    telefono: "",
    email: "",
    nombreUsuario: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigation = useNavigation();

  // El rol de usuario regular
  const ROL_USUARIO_ID = "67ec71573b2822762122e79a";
  // Rol temporal para usuarios en proceso de verificación (debes crear este rol en tu backend)
  const ROL_USUARIO_REGISTRADO_ID = "67f498c2384e616c30a4a074";

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });

    // Clear error when user types
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: null,
      });
    }
  };

  // Validation functions
  const validateNombre = (value) => {
    handleChange("nombre", value);
    if (!value.trim()) {
      setErrors({ ...errors, nombre: "El nombre es requerido" });
      return false;
    }
    return true;
  };

  const validateApellido = (value) => {
    handleChange("apellido", value);
    if (!value.trim()) {
      setErrors({ ...errors, apellido: "El apellido es requerido" });
      return false;
    }
    return true;
  };

  const validateCedula = (value) => {
    handleChange("cedula", value);
    if (!value.trim()) {
      setErrors({ ...errors, cedula: "La cédula es requerida" });
      return false;
    }
    if (!/^\d{10}$/.test(value)) {
      setErrors({ ...errors, cedula: "La cédula debe tener 10 dígitos" });
      return false;
    }
    return true;
  };

  const validateTelefono = (value) => {
    handleChange("telefono", value);
    if (!value.trim()) {
      setErrors({ ...errors, telefono: "El teléfono es requerido" });
      return false;
    }
    if (!/^0\d{9}$/.test(value)) {
      setErrors({
        ...errors,
        telefono: "Formato inválido: debe comenzar con 0 y tener 10 dígitos",
      });
      return false;
    }
    return true;
  };

  const validateEmail = (value) => {
    handleChange("email", value);
    if (!value.trim()) {
      setErrors({ ...errors, email: "El correo es requerido" });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setErrors({ ...errors, email: "Formato de correo inválido" });
      return false;
    }
    return true;
  };

  const validateNombreUsuario = (value) => {
    handleChange("nombreUsuario", value);
    if (!value.trim()) {
      setErrors({
        ...errors,
        nombreUsuario: "El nombre de usuario es requerido",
      });
      return false;
    }
    if (value.length < 4) {
      setErrors({
        ...errors,
        nombreUsuario: "El nombre de usuario debe tener al menos 4 caracteres",
      });
      return false;
    }
    return true;
  };

  const validatePassword = () => {
    const { password } = formData;
    if (!password) {
      setErrors({ ...errors, password: "La contraseña es requerida" });
      return false;
    }
    if (password.length < 8) {
      setErrors({
        ...errors,
        password: "La contraseña debe tener al menos 8 caracteres",
      });
      return false;
    }
    return true;
  };

  const validateConfirmPassword = () => {
    const { password, confirmPassword } = formData;
    if (!confirmPassword) {
      setErrors({ ...errors, confirmPassword: "Confirma tu contraseña" });
      return false;
    }
    if (password !== confirmPassword) {
      setErrors({ ...errors, confirmPassword: "Las contraseñas no coinciden" });
      return false;
    }
    return true;
  };

  const validateForm = () => {
    const isNombreValid = validateNombre(formData.nombre);
    const isApellidoValid = validateApellido(formData.apellido);
    const isCedulaValid = validateCedula(formData.cedula);
    const isTelefonoValid = validateTelefono(formData.telefono);
    const isEmailValid = validateEmail(formData.email);
    const isNombreUsuarioValid = validateNombreUsuario(formData.nombreUsuario);
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();

    return (
      isNombreValid &&
      isApellidoValid &&
      isCedulaValid &&
      isTelefonoValid &&
      isEmailValid &&
      isNombreUsuarioValid &&
      isPasswordValid &&
      isConfirmPasswordValid
    );
  };

  // Método para manejar el flujo de enrolamiento en Telegram
  const handleTelegramEnrollment = async (userId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("No hay token de autenticación");
      }

      // Generate Telegram link
      const telegramResponse = await authService.getTelegramLink(userId);
      const telegramLink = telegramResponse.data?.deepLink;

      if (!telegramLink) {
        throw new Error("No se pudo generar enlace de Telegram");
      }

      Alert.alert(
        "Vincula tu Telegram",
        "Para completar tu registro, por favor vincúlate con nuestro bot de Telegram",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Abrir Telegram",
            onPress: async () => {
              try {
                await Linking.openURL(telegramLink);

                await authService.generateVerificationCode();

                navigation.navigate("Verification", {
                  userId,
                  telegramLink,
                  finalRolId: ROL_USUARIO_ID,
                });
              } catch (error) {
                console.error("Error:", error);
                Alert.alert(
                  "Error",
                  "No se pudo abrir Telegram o generar código de verificación"
                );
              }
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error("Error in Telegram enrollment:", error);

      // Check if it's an authentication error
      if (error.response?.status === 401) {
        Alert.alert(
          "Sesión expirada",
          "Tu sesión ha expirado. Por favor, inicia sesión de nuevo.",
          [
            {
              text: "OK",
              onPress: () => {
                // Clear tokens and redirect to login
                AsyncStorage.multiRemove(["token", "refreshToken"]).then(() => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "Login" }],
                  });
                });
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Error",
          error.response?.data?.message ||
            error.message ||
            "Error en el proceso de vinculación con Telegram"
        );
      }
    }
  };

  const handleNext = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Register user first
      const userData = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        cedula: formData.cedula,
        email: formData.email,
        telefono: formData.telefono,
        nombreUsuario: formData.nombreUsuario,
        password: formData.password,
        rol: ROL_USUARIO_REGISTRADO_ID,
      };

      console.log("Registering user with data:", {
        ...userData,
        password: "[REDACTED]",
      });

      const registerResponse = await userService.createUser(userData);
      console.log("Register response:", registerResponse.status);

      if (!registerResponse.data?.usuario?._id) {
        console.error("Unexpected response format:", registerResponse.data);
        throw new Error("Respuesta inesperada del servidor");
      }

      const userId = registerResponse.data.usuario._id;
      console.log("User registered with ID:", userId);

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check if Telegram chat exists
      try {
        console.log("Checking if user has Telegram chat linked");
        const chatResponse = await authService.checkUserTelegramChat();
        console.log("Response from checkUserTelegramChat:", chatResponse.data);

        // If chatId exists and is not null/undefined, go directly to verification
        if (chatResponse.data?.linked) {
          console.log("Chat ID found:", chatResponse.data.chatId);
          // Pass userId to generateVerificationCode
          await authService.generateVerificationCode();
          navigation.navigate("Verification", {
            userId,
            finalRolId: ROL_USUARIO_ID,
          });
        } else {
          console.log("No chat ID found, starting Telegram enrollment");
          handleTelegramEnrollment(userId);
        }
      } catch (error) {
        console.error("Error checking Telegram chat:", error);
        handleTelegramEnrollment(userId);
      }
    } catch (error) {
      console.error("Error in registration:", error);

      // Format the error message properly
      let errorMessage = "Error en el registro";

      if (error.response?.data?.message) {
        // If it's an object, convert to string
        if (typeof error.response.data.message === "object") {
          errorMessage = JSON.stringify(error.response.data.message);
        } else {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.headerContainer}>
          <BackButton onPress={handleGoBack} />
          <Text style={styles.title}>Registro</Text>
        </View>

        <Text style={styles.label}>Nombre*</Text>
        <TextInput
          placeholder="Ingresa tu nombre"
          value={formData.nombre}
          onChangeText={validateNombre}
          style={styles.input}
        />
        {errors.nombre && <Text style={styles.errorText}>{errors.nombre}</Text>}

        <Text style={styles.label}>Apellido*</Text>
        <TextInput
          placeholder="Ingresa tu apellido"
          value={formData.apellido}
          onChangeText={validateApellido}
          style={styles.input}
        />
        {errors.apellido && (
          <Text style={styles.errorText}>{errors.apellido}</Text>
        )}

        <Text style={styles.label}>Cédula*</Text>
        <TextInput
          placeholder="Ingresa tu cédula"
          value={formData.cedula}
          onChangeText={validateCedula}
          keyboardType="numeric"
          maxLength={10}
          style={styles.input}
        />
        {errors.cedula && <Text style={styles.errorText}>{errors.cedula}</Text>}

        <Text style={styles.label}>Número de teléfono*</Text>
        <TextInput
          placeholder="0999999999"
          value={formData.telefono}
          onChangeText={validateTelefono}
          keyboardType="numeric"
          style={styles.input}
        />
        {errors.telefono && (
          <Text style={styles.errorText}>{errors.telefono}</Text>
        )}

        <Text style={styles.label}>Correo*</Text>
        <TextInput
          placeholder="name@example.com"
          value={formData.email}
          onChangeText={validateEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

        <Text style={styles.label}>Nombre de usuario*</Text>
        <TextInput
          placeholder="Ingresa un nombre de usuario"
          value={formData.nombreUsuario}
          onChangeText={validateNombreUsuario}
          autoCapitalize="none"
          style={styles.input}
        />
        {errors.nombreUsuario && (
          <Text style={styles.errorText}>{errors.nombreUsuario}</Text>
        )}

        <Text style={styles.label}>Contraseña*</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Ingresa una contraseña"
            value={formData.password}
            onChangeText={(text) => handleChange("password", text)}
            secureTextEntry={!isPasswordVisible}
            style={styles.passwordInput}
          />
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.eyeIconContainer}
          >
            <Image
              source={
                isPasswordVisible
                  ? require("../assets/images/eye-visible.png")
                  : require("../assets/images/eye-hidden.png")
              }
              style={styles.eyeIcon}
            />
          </TouchableOpacity>
        </View>
        {errors.password && (
          <Text style={styles.errorText}>{errors.password}</Text>
        )}

        <Text style={styles.label}>Confirma tu contraseña*</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Ingresa la contraseña otra vez"
            value={formData.confirmPassword}
            onChangeText={(text) => handleChange("confirmPassword", text)}
            secureTextEntry={!isConfirmPasswordVisible}
            style={styles.passwordInput}
          />
          <TouchableOpacity
            onPress={() =>
              setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
            }
            style={styles.eyeIconContainer}
          >
            <Image
              source={
                isConfirmPasswordVisible
                  ? require("../assets/images/eye-visible.png")
                  : require("../assets/images/eye-hidden.png")
              }
              style={styles.eyeIcon}
            />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && (
          <Text style={styles.errorText}>{errors.confirmPassword}</Text>
        )}

        <TouchableOpacity
          onPress={handleNext}
          style={[styles.button, isLoading && styles.disabledButton]}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Siguiente</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 20,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    marginHorizontal: 20,
  },
  title: {
    color: "#000000",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  label: {
    color: "#737373",
    fontSize: 15,
    marginBottom: 8,
    marginLeft: 25,
  },
  input: {
    color: "#000000",
    fontSize: 15,
    marginBottom: 20,
    marginHorizontal: 23,
    borderColor: "#D9D9D9",
    borderRadius: 7,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 13,
  },
  phoneContainer: {
    flexDirection: "row",
    marginHorizontal: 23,
    marginBottom: 20,
  },
  countryCodeInput: {
    color: "#000000",
    fontSize: 15,
    borderColor: "#D9D9D9",
    borderRadius: 7,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 13,
    width: "25%",
    marginRight: 10,
  },
  phoneInput: {
    color: "#000000",
    fontSize: 15,
    borderColor: "#D9D9D9",
    borderRadius: 7,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 13,
    flex: 1,
  },
  button: {
    marginHorizontal: 23,
    backgroundColor: "#5C2684",
    borderRadius: 7,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 30,
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 23,
    marginBottom: 20,
    borderColor: "#D9D9D9",
    borderRadius: 7,
    borderWidth: 1,
  },
  passwordInput: {
    color: "#000000",
    fontSize: 15,
    paddingVertical: 12,
    paddingHorizontal: 13,
    flex: 1,
  },
  eyeIconContainer: {
    padding: 10,
  },
  eyeIcon: {
    width: 24,
    height: 24,
    tintColor: "#737373",
  },
});
