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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Button from "../components/Button";
import { authService } from "../services/api";
import AsyncStorage from '@react-native-async-storage/async-storage';

const CustomCheckbox = ({ isSelected, onToggle }) => {
  return (
    <TouchableOpacity onPress={onToggle} style={styles.checkboxContainer}>
      <Text style={styles.checkbox}>{isSelected ? "✓" : ""}</Text>
    </TouchableOpacity>
  );
};

export default (props) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSelected, setSelection] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Por favor ingrese su nombre de usuario y contraseña");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.login(username, password);
      const token = response.data.access_token;
      
      // Guardar el token en AsyncStorage
      await AsyncStorage.setItem('token', token);
      
      // Si la opción "Recordarme" está seleccionada, guardar también el nombre de usuario
      if (isSelected) {
        await AsyncStorage.setItem('savedUsername', username);
      } else {
        await AsyncStorage.removeItem('savedUsername');
      }
      
      navigation.navigate("Home");
    } catch (error) {
      console.error('Error de login:', error);
      Alert.alert(
        "Error de inicio de sesión", 
        "Credenciales inválidas. Por favor intente nuevamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    navigation.navigate("Register");
  };

  // Verificar si hay un nombre de usuario guardado al cargar la pantalla
  React.useEffect(() => {
    const checkSavedUsername = async () => {
      const savedUsername = await AsyncStorage.getItem('savedUsername');
      if (savedUsername) {
        setUsername(savedUsername);
        setSelection(true);
      }
    };
    
    checkSavedUsername();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>{"Bienvenido! 👋"}</Text>
        <Text style={styles.subtitle}>
          {"Únete a nuestra comunidad. ¡Te estamos esperando!"}
        </Text>

        <Text style={styles.label}>{"Nombre de usuario"}</Text>
        <TextInput
          placeholder={"Ingresa tu usuario"}
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          autoCapitalize="none"
        />

        <Text style={styles.label}>{"Contraseña"}</Text>
        <TextInput
          placeholder={"Ingresa tu contraseña"}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <View style={styles.optionsRow}>
          <CustomCheckbox
            isSelected={isSelected}
            onToggle={() => setSelection(!isSelected)}
          />
          <Text style={styles.rememberMe}>{"Recordarme"}</Text>
          <View style={{ flex: 1 }}></View>
          <Text style={styles.forgotPassword}>{"Olvidaste tu contraseña"}</Text>
        </View>

        <Button
          title="Iniciar sesión"
          onPress={handleLogin}
          style={styles.loginButton}
          disabled={isLoading}
        />

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>{"No tienes una cuenta aún?"}</Text>
          <TouchableOpacity onPress={handleRegister}>
            <Text style={styles.registerButton}>{" Regístrate"}</Text>
          </TouchableOpacity>
        </View>
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
    position: "absolute",
    top: 126,
    bottom: 0,
    right: 0,
    left: 0,
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  title: {
    color: "#1F2C37",
    fontSize: 24,
    textAlign: "center",
    marginBottom: 19,
    marginHorizontal: 63,
  },
  subtitle: {
    color: "#78828A",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 58,
    marginHorizontal: 45,
  },
  label: {
    color: "#737373",
    fontSize: 15,
    marginLeft: 39,
  },
  input: {
    color: "#000000",
    fontSize: 15,
    marginBottom: 37,
    marginHorizontal: 23,
    borderColor: "#D9D9D9",
    borderRadius: 7,
    borderWidth: 1,
    paddingVertical: 19,
    paddingHorizontal: 20,
  },
  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 21,
    marginHorizontal: 27,
  },
  checkboxContainer: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#737373",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkbox: {
    fontSize: 14,
    color: "#5C2684",
  },
  rememberMe: {
    color: "#1F2C37",
    fontSize: 14,
  },
  forgotPassword: {
    color: "#57435C",
    fontSize: 14,
  },
  loginButton: {
    marginHorizontal: 23,
    marginBottom: 21,
  },
  registerContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 19,
  },
  registerText: {
    fontSize: 14,
  },
  registerButton: {
    fontSize: 14,
    color: "#5C2684",
    fontWeight: "bold",
  },
});