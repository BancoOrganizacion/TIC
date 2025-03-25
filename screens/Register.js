import React, { useState } from "react";
import axios from 'axios';
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
} from "react-native";
import BackButton from "../components/BackButton";
import { userService } from "../services/api";
const API_USERS = 'http://10.0.2.2:3001';

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

  const handleGoBack = () => {
    props.navigation.goBack();
  };

  const validateForm = () => {
    if (!nombre || !apellido || !cedula || !email || !nombreUsuario || !password) {
      Alert.alert("Error", "Por favor complete todos los campos obligatorios (*)");
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Correo electrónico inválido");
      return false;
    }

    if (!/^\d{10}$/.test(cedula)) {
      Alert.alert("Error", "La cédula debe tener 10 dígitos numéricos");
      return false;
    }

    return true;
  };


  const handleNext = async () => {
    if (!validateForm()) return;
  
    setIsLoading(true);
    try {
      // Add the connection test here
      try {
        const testResponse = await axios.get(`${API_USERS}/roles`);
        console.log("Conexión exitosa - Roles:", testResponse.data);
      } catch (testError) {
        console.error("Error de prueba de conexión:", testError);
        Alert.alert("Error de conexión", 
          "No se pudo conectar con el servidor. Verifica que el servidor esté en ejecución y sea accesible.");
        setIsLoading(false);
        return;
      }
      console.log("Intentando registrar usuario...");
      
      // Preparar los datos según la estructura esperada por tu backend
      const userData = {
        nombre: nombre,
        apellido: apellido,
        cedula: cedula,
        email: email,
        telefono: telefono ? (telefono.startsWith('0') ? telefono : `0${telefono}`) : undefined,
        rol: ROL_USUARIO_ID,
        nombre_usuario: nombreUsuario,
        contraseña: password 
      };
  
      console.log("Datos de usuario:", JSON.stringify(userData, null, 2));
  
      const response = await userService.createUser(userData);
      console.log("Respuesta del servidor:", response.data);
      
      Alert.alert(
        "Registro exitoso", 
        "Tu cuenta ha sido creada correctamente.",
        [{ 
          text: "Iniciar sesión", 
          onPress: () => props.navigation.navigate("Login") 
        }]
      );
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      
      let errorMsg = "Error al crear la cuenta";
      
      if (error.response) {
        // El servidor respondió con un código de estado fuera del rango 2xx
        console.log('Datos de error:', error.response.data);
        console.log('Estado:', error.response.status);
        
        if (error.response.status === 409) {
          errorMsg = "Este usuario o cédula ya está registrado";
        } else if (error.response.data && error.response.data.message) {
          errorMsg = error.response.data.message;
        }
      } else if (error.request) {
        // La solicitud se realizó pero no se recibió respuesta
        console.log('Solicitud sin respuesta:', error.request);
        errorMsg = "No se pudo conectar con el servidor. Verifica tu conexión a internet y que el servidor esté en ejecución.";
      } else {
        // Ocurrió un error durante la configuración de la solicitud
        console.log('Error de configuración:', error.message);
        errorMsg = "Error en la configuración de la solicitud: " + error.message;
      }
      
      Alert.alert("Error", errorMsg);
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
          onChangeText={setNombre}
          style={styles.input}
        />

        <Text style={styles.label}>Apellido*</Text>
        <TextInput
          placeholder="Ingresa tu apellido"
          value={apellido}
          onChangeText={setApellido}
          style={styles.input}
        />

        <Text style={styles.label}>Cédula*</Text>
        <TextInput
          placeholder="Ingresa tu cédula"
          value={cedula}
          onChangeText={setCedula}
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
            onChangeText={setTelefono}
            keyboardType="numeric"
            style={styles.phoneInput}
          />
        </View>

        <Text style={styles.label}>Correo*</Text>
        <TextInput
          placeholder="name@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <Text style={styles.label}>Nombre de usuario*</Text>
        <TextInput
          placeholder="Ingresa un nombre de usuario"
          value={nombreUsuario}
          onChangeText={setNombreUsuario}
          autoCapitalize="none"
          style={styles.input}
        />

        <Text style={styles.label}>Contraseña*</Text>
        <TextInput
          placeholder="Ingresa una contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <Text style={styles.label}>Confirma tu contraseña*</Text>
        <TextInput
          placeholder="Ingresa la contraseña otra vez"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={styles.input}
        />

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
});