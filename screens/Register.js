import React, { useState } from "react";
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
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigation = useNavigation();
  const ROL_USUARIO_ID = "67ec71573b2822762122e79a";
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  // Validation functions
  const validateNombre = (text) => {
    const lettersOnlyRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]*$/;
    if (lettersOnlyRegex.test(text)) {
      handleChange('nombre', text);
    }
  };

  const validateApellido = (text) => {
    const lettersOnlyRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]*$/;
    if (lettersOnlyRegex.test(text)) {
      handleChange('apellido', text);
    }
  };

  const validateCedula = (text) => {
    const numbersOnlyRegex = /^[0-9]{0,10}$/;
    if (numbersOnlyRegex.test(text)) {
      handleChange('cedula', text);
    }
  };

  const validateTelefono = (text) => {
    const numbersOnlyRegex = /^[0-9]*$/;
    if (numbersOnlyRegex.test(text)) {
      handleChange('telefono', text);
    }
  };

  const validateNombreUsuario = (text) => {
    const usernameRegex = /^[a-zA-Z0-9_]*$/;
    if (usernameRegex.test(text)) {
      handleChange('nombreUsuario', text);
    }
  };

  const validateEmail = (text) => {
    const emailRegex = /^[a-zA-Z0-9@._-]*$/;
    if (emailRegex.test(text)) {
      handleChange('email', text);
    }
  };

  const validateForm = () => {
    const { nombre, apellido, cedula, email, nombreUsuario, password, confirmPassword } = formData;
    
    if (!nombre || !apellido || !cedula || !email || !nombreUsuario || !password) {
      Alert.alert("Error", "Por favor complete todos los campos obligatorios (*)");
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return false;
    }

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
      const { nombre, apellido, cedula, email, telefono, nombreUsuario, password } = formData;
      
      const userData = {
        nombre,
        apellido,
        cedula,
        email,
        telefono,
        rol: ROL_USUARIO_ID,
        nombre_usuario: nombreUsuario,
        contraseña: password,
      };
      console.log("Enviando datos de registro:", userData);

      const registerResponse = await userService.createUser(userData);
      const userId = registerResponse.data._id;
  
      // Generar código de verificación
      const codeResponse = await authService.generateVerificationCode(userId);
      const verificationCode = codeResponse.data.code;
  
      // Obtener enlace de Telegram
      const telegramResponse = await authService.getTelegramLink(userId);
      const telegramLink = telegramResponse.data.deepLink;
  
      // Navegar a pantalla de verificación
      navigation.navigate('Verification', { 
        userId,
        initialCode: verificationCode,
        telegramLink 
      });
      
    } catch (error) {
      let errorMsg = "Error desconocido al registrar";
  
      if (error.response && error.response.data) {
        if (error.response.data.message && Array.isArray(error.response.data.message)) {
          errorMsg = error.response.data.message.join("\n");
        } else if (error.response.data.message) {
          errorMsg = error.response.data.message;
        }
  
        if (error.response.status === 409) {
          errorMsg = "Este usuario o cédula ya está registrado";
        }
      } else if (error.request) {
        errorMsg = "No se pudo conectar con el servidor. Verifica tu conexión a internet.";
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
          value={formData.nombre}
          onChangeText={validateNombre}
          style={styles.input}
        />

        <Text style={styles.label}>Apellido*</Text>
        <TextInput
          placeholder="Ingresa tu apellido"
          value={formData.apellido}
          onChangeText={validateApellido}
          style={styles.input}
        />

        <Text style={styles.label}>Cédula*</Text>
        <TextInput
          placeholder="Ingresa tu cédula"
          value={formData.cedula}
          onChangeText={validateCedula}
          keyboardType="numeric"
          maxLength={10}
          style={styles.input}
        />

        <Text style={styles.label}>Número de teléfono</Text>
        <TextInput
          placeholder="0999999999"
          value={formData.telefono}
          onChangeText={validateTelefono}
          keyboardType="numeric"
          style={styles.input}
        />

        <Text style={styles.label}>Correo*</Text>
        <TextInput
          placeholder="name@example.com"
          value={formData.email}
          onChangeText={validateEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <Text style={styles.label}>Nombre de usuario*</Text>
        <TextInput
          placeholder="Ingresa un nombre de usuario"
          value={formData.nombreUsuario}
          onChangeText={validateNombreUsuario}
          autoCapitalize="none"
          style={styles.input}
        />

        <Text style={styles.label}>Contraseña*</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Ingresa una contraseña"
            value={formData.password}
            onChangeText={(text) => handleChange('password', text)}
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

        <Text style={styles.label}>Confirma tu contraseña*</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Ingresa la contraseña otra vez"
            value={formData.confirmPassword}
            onChangeText={(text) => handleChange('confirmPassword', text)}
            secureTextEntry={!isConfirmPasswordVisible}
            style={styles.passwordInput}
          />
          <TouchableOpacity
            onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
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
