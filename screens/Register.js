import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { userService, authService } from "../services/api";
import AppLayout from "../components/AppLayout";
import FormField from "../components/FormField";
import Button from "../components/Button";

const RegistrationScreen = () => {
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
  // Rol temporal para usuarios en proceso de verificación
  const ROL_USUARIO_REGISTRADO_ID = "681144a24ea765b9fe82406f";

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

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

  // Función de validación de contraseña mejorada
  const validatePassword = (value) => {
    handleChange("password", value);
    
    // Si no hay valor
    if (!value) {
      setErrors({ ...errors, password: "La contraseña es requerida" });
      return false;
    }
    
    // Si no tiene al menos 8 caracteres
    if (value.length < 8) {
      setErrors({
        ...errors,
        password: "La contraseña debe tener al menos 8 caracteres",
      });
      return false;
    }
    
    // Validar que tenga al menos una mayúscula
    if (!/[A-Z]/.test(value)) {
      setErrors({
        ...errors,
        password: "La contraseña debe contener al menos una letra mayúscula",
      });
      return false;
    }
    
    // Validar que tenga al menos una minúscula
    if (!/[a-z]/.test(value)) {
      setErrors({
        ...errors,
        password: "La contraseña debe contener al menos una letra minúscula",
      });
      return false;
    }
    
    // Validar que tenga al menos un número
    if (!/\d/.test(value)) {
      setErrors({
        ...errors,
        password: "La contraseña debe contener al menos un número",
      });
      return false;
    }
    
    // Validar que tenga al menos un carácter especial
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
      setErrors({
        ...errors,
        password: "La contraseña debe contener al menos un carácter especial",
      });
      return false;
    }
    
    // Si cambia la contraseña, validar de nuevo la confirmación
    if (formData.confirmPassword) {
      validateConfirmPassword(formData.confirmPassword);
    }
    
    return true;
  };

  const validateConfirmPassword = (value) => {
    handleChange("confirmPassword", value);
    if (!value) {
      setErrors({ ...errors, confirmPassword: "Confirma tu contraseña" });
      return false;
    }
    // Compara con el valor actualizado de password
    if (formData.password !== value) {
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
    const isPasswordValid = validatePassword(formData.password);
    const isConfirmPasswordValid = validateConfirmPassword(formData.confirmPassword);

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

      const encodedLink = encodeURI(telegramLink);
      Alert.alert(
        "Vincula tu Telegram",
        "Para completar tu registro, por favor vincúlate con nuestro bot de Telegram",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Abrir Telegram",
            onPress: async () => {
              try {
                // Check if Telegram is installed first
                const canOpen = await Linking.canOpenURL(encodedLink);

                if (canOpen) {
                  await Linking.openURL(encodedLink);
                } else {
                  // Fallback to browser if Telegram app isn't installed
                  await Linking.openURL(
                    `https://t.me/${telegramLink.split("t.me/")[1]}`
                  );
                }

                await authService.generateVerificationCode();

                navigation.navigate("Verification", {
                  userId,
                  telegramLink: encodedLink,
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
      console.error("Error response data:", error.response?.data);
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
    <AppLayout 
      title="Registro" 
      onBackPress={handleGoBack}
      contentContainerStyle={styles.contentContainer}
      showNavBar={false}  // No mostrar navbar en pantalla de registro
      showGreeting={false} // No mostrar greeting en pantalla de registro
    >
      <FormField
        label="Nombre*"
        value={formData.nombre}
        onChangeText={validateNombre}
        placeholder="Ingresa tu nombre"
        errorMessage={errors.nombre}
      />

      <FormField
        label="Apellido*"
        value={formData.apellido}
        onChangeText={validateApellido}
        placeholder="Ingresa tu apellido"
        errorMessage={errors.apellido}
      />

      <FormField
        label="Cédula*"
        value={formData.cedula}
        onChangeText={validateCedula}
        placeholder="Ingresa tu cédula"
        keyboardType="numeric"
        maxLength={10}
        errorMessage={errors.cedula}
      />

      <FormField
        label="Número de teléfono*"
        value={formData.telefono}
        onChangeText={validateTelefono}
        placeholder="0999999999"
        keyboardType="numeric"
        errorMessage={errors.telefono}
      />

      <FormField
        label="Correo*"
        value={formData.email}
        onChangeText={validateEmail}
        placeholder="name@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        errorMessage={errors.email}
      />

      <FormField
        label="Nombre de usuario*"
        value={formData.nombreUsuario}
        onChangeText={validateNombreUsuario}
        placeholder="Ingresa un nombre de usuario"
        autoCapitalize="none"
        errorMessage={errors.nombreUsuario}
      />

      <FormField
        label="Contraseña*"
        value={formData.password}
        onChangeText={validatePassword}
        placeholder="Ingresa una contraseña"
        errorMessage={errors.password}
        isPassword={true}
        isPasswordVisible={isPasswordVisible}
        togglePasswordVisibility={() => setIsPasswordVisible(!isPasswordVisible)}
      />

      <FormField
        label="Confirma tu contraseña*"
        value={formData.confirmPassword}
        onChangeText={validateConfirmPassword}
        placeholder="Ingresa la contraseña otra vez"
        errorMessage={errors.confirmPassword}
        isPassword={true}
        isPasswordVisible={isConfirmPasswordVisible}
        togglePasswordVisibility={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
      />

      <View style={styles.buttonContainer}>
        <Button
          title={isLoading ? "Procesando..." : "Siguiente"}
          onPress={handleNext}
          style={[isLoading && styles.disabledButton]}
          disabled={isLoading}
        />
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    paddingTop: 10,
    paddingBottom: 40,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.7,
    backgroundColor: "#9B59B6",
  },
});

export default RegistrationScreen;