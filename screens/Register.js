import React, { useState } from "react";
import axios from "axios";
import {
  SafeAreaView,
  View,
  ScrollView,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import BackButton from "../components/BackButton";
import { userService } from "../services/api";

export default (props) => {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [cedula, setCedula] = useState("");
  const [telefono, setTelefono] = useState("");
  const [codigoPais, setCodigoPais] = useState("+593");
  const [email, setEmail] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const ROL_USUARIO_ID = "67d8565e668d308ad20654cc";
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  const handleGoBack = () => {
    props.navigation.goBack();
  };

  // Validation functions
  const validateNombre = (text) => {
    // Only letters and spaces
    const lettersOnlyRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]*$/;
    if (lettersOnlyRegex.test(text)) {
      setNombre(text);
    }
  };

  const validateApellido = (text) => {
    // Only letters and spaces
    const lettersOnlyRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]*$/;
    if (lettersOnlyRegex.test(text)) {
      setApellido(text);
    }
  };

  const validateCedula = (text) => {
    // Only numbers, max 10 digits
    const numbersOnlyRegex = /^[0-9]{0,10}$/;
    if (numbersOnlyRegex.test(text)) {
      setCedula(text);
    }
  };

  const validateTelefono = (text) => {
    // Only numbers
    const numbersOnlyRegex = /^[0-9]*$/;
    if (numbersOnlyRegex.test(text)) {
      setTelefono(text);
    }
  };

  const validateNombreUsuario = (text) => {
    // Alphanumeric and underscore
    const usernameRegex = /^[a-zA-Z0-9_]*$/;
    if (usernameRegex.test(text)) {
      setNombreUsuario(text);
    }
  };

  const validateEmail = (text) => {
    // Allow basic email characters
    const emailRegex = /^[a-zA-Z0-9@._-]*$/;
    if (emailRegex.test(text)) {
      setEmail(text);
    }
  };

  const validateForm = () => {
    if (
      !nombre ||
      !apellido ||
      !cedula ||
      !email ||
      !nombreUsuario ||
      !password
    ) {
      Alert.alert(
        "Error",
        "Por favor complete todos los campos obligatorios (*)"
      );
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return false;
    }

    // Additional email validation
    const emailValidationRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValidationRegex.test(email)) {
      Alert.alert("Error", "Por favor ingrese un correo electrónico válido");
      return false;
    }

    return true;
  };

  const handleNext = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const userData = {
        nombre: nombre,
        apellido: apellido,
        cedula: cedula,
        email: email,
        telefono: telefono
          ? telefono.startsWith("0")
            ? telefono
            : `0${telefono}`
          : undefined,
        rol: ROL_USUARIO_ID,
        nombre_usuario: nombreUsuario,
        contraseña: password,
      };
      console.log("Enviando datos de registro:", userData);

      const response = await userService.createUser(userData);
      console.log("Respuesta de registro:", response.data);
      
      // Después del registro exitoso, iniciar sesión automáticamente
      try {
        const loginResponse = await authService.login(nombreUsuario, password);
        // Guardar el token en AsyncStorage
        if (loginResponse.data && loginResponse.data.access_token) {
          await AsyncStorage.setItem("token", loginResponse.data.access_token);
          props.navigation.replace("MainTabs"); // Redireccionar a la pantalla principal
        }
      } catch (loginError) {
        console.error("Error al iniciar sesión automáticamente:", loginError);
        Alert.alert(
          "Registro exitoso",
          "Tu cuenta ha sido creada. Por favor inicia sesión.",
          [{ text: "OK", onPress: () => props.navigation.navigate("Login") }]
        );
      }
    } catch (error) {
      let errorMsg = "Error desconocido al registrar";

      if (error.response && error.response.data) {
        // Handle validation errors from backend
        if (
          error.response.data.message &&
          Array.isArray(error.response.data.message)
        ) {
          // Join multiple validation error messages
          errorMsg = error.response.data.message.join("\n");
        } else if (error.response.data.message) {
          errorMsg = error.response.data.message;
        }

        // Additional specific error handling
        if (error.response.status === 409) {
          errorMsg = "Este usuario o cédula ya está registrado";
        }
      } else if (error.request) {
        errorMsg =
          "No se pudo conectar con el servidor. Verifica tu conexión a internet.";
      } else {
        errorMsg = "Error en la solicitud: " + error.message;
      }

      Alert.alert("Error de Registro", errorMsg);
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
          value={nombre}
          onChangeText={validateNombre}
          style={styles.input}
        />

        <Text style={styles.label}>Apellido*</Text>
        <TextInput
          placeholder="Ingresa tu apellido"
          value={apellido}
          onChangeText={validateApellido}
          style={styles.input}
        />

        <Text style={styles.label}>Cédula*</Text>
        <TextInput
          placeholder="Ingresa tu cédula"
          value={cedula}
          onChangeText={validateCedula}
          keyboardType="numeric"
          maxLength={10}
          style={styles.input}
        />

        <Text style={styles.label}>Número de teléfono</Text>
        <View style={styles.phoneContainer}>
          <TextInput
            placeholder="+593"
            value={codigoPais}
            onChangeText={setCodigoPais}
            style={styles.countryCodeInput}
          />
          <TextInput
            placeholder="0999999999"
            value={telefono}
            onChangeText={validateTelefono}
            keyboardType="numeric"
            style={styles.phoneInput}
          />
        </View>

        <Text style={styles.label}>Correo*</Text>
        <TextInput
          placeholder="name@example.com"
          value={email}
          onChangeText={validateEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <Text style={styles.label}>Nombre de usuario*</Text>
        <TextInput
          placeholder="Ingresa un nombre de usuario"
          value={nombreUsuario}
          onChangeText={validateNombreUsuario}
          autoCapitalize="none"
          style={styles.input}
        />

        {/* Password input remains the same */}
        <Text style={styles.label}>Contraseña*</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Ingresa una contraseña"
            value={password}
            onChangeText={setPassword}
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

        {/* Confirm Password input remains the same */}
        <Text style={styles.label}>Confirma tu contraseña*</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Ingresa la contraseña otra vez"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
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

        <TouchableOpacity
          onPress={handleNext}
          style={[styles.button, isLoading && styles.disabledButton]}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Registrarse</Text>
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
