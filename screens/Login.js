import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

// Componente personalizado para el checkbox
const CustomCheckbox = ({ isSelected, onToggle }) => {
  return (
    <TouchableOpacity onPress={onToggle} style={styles.checkboxContainer}>
      <Text style={styles.checkbox}>{isSelected ? "✓" : ""}</Text>
    </TouchableOpacity>
  );
};

export default (props) => {
  const [textInput1, onChangeTextInput1] = useState("");
  const [textInput2, onChangeTextInput2] = useState("");
  const [isSelected, setSelection] = useState(false); // Estado para el checkbox
  const navigation = useNavigation();

  const handleLogin = () => {
    // Lógica de autenticación
    navigation.navigate("Home");
  };

  const handleRegister = () => {
    navigation.navigate("Register");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>{"Bienvenido! 👋"}</Text>
        <Text style={styles.subtitle}>
          {"Únete a nuestra comunidad. ¡Te estamos esperando!"}
        </Text>

        <Text style={styles.label}>{"Nombre"}</Text>
        <TextInput
          placeholder={"Ingresa tu nombre"}
          value={textInput1}
          onChangeText={onChangeTextInput1}
          style={styles.input}
        />

        <Text style={styles.label}>{"Contraseña"}</Text>
        <TextInput
          placeholder={"Ingresa tu contraseña"}
          value={textInput2}
          onChangeText={onChangeTextInput2}
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

        <View style={styles.loginButtonContainer}>
          <Button
            title="Iniciar sesión"
            onPress={handleLogin}
            color="#5C2684"
          />
        </View>

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
  loginButtonContainer: {
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