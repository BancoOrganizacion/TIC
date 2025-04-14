import React, { useState, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
  StyleSheet,
} from "react-native";
import { authService, userService } from "../services/api";

const VerificationScreen = ({ route, navigation }) => {
  const { userId, telegramLink, finalRolId } = route.params;
  const [code, setCode] = useState(["", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [canResend, setCanResend] = useState(false);
  const [activeInput, setActiveInput] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [isChatVerified, setIsChatVerified] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);

  // References for text inputs to allow focus manipulation
  const inputRefs = useRef([...Array(4)].map(() => React.createRef()));

  // Countdown timer for code resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  
  const handleOpenTelegram = async () => {
    if (!telegramLink) return;

    try {
      const canOpen = await Linking.canOpenURL(telegramLink);
      if (canOpen) {
        await Linking.openURL(telegramLink);
      } else {
        Alert.alert(
          "Telegram no instalado",
          "Por favor instala Telegram para continuar",
          [
            { text: "OK" },
            {
              text: "Instalar",
              onPress: () =>
                Linking.openURL("market://details?id=org.telegram.messenger"),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo abrir Telegram");
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    setIsLoading(true);
    setErrorMessage("");
    try {
      await authService.generateVerificationCode();
      setCountdown(60);
      setCanResend(false);
      Alert.alert("Éxito", "Se ha enviado un nuevo código a tu Telegram");
    } catch (error) {
      Alert.alert(
        "Error",
        "No se pudo reenviar el código" +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index, value) => {
    // Clear error message when user starts typing again
    if (errorMessage) setErrorMessage("");

    // Solo permitir dígitos
    if (/^\d*$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Mover al siguiente campo si se ingresó un dígito
      if (value && index < 3) {
        setActiveInput(index + 1);
        // Auto focus next input
        inputRefs.current[index + 1].focus();
      }

      // Si se completó el código, verificar automáticamente
      if (newCode.every((digit) => digit) && newCode.length === 4) {
        handleVerifyCode(newCode.join(""));
      }
    }
  };

  const handleVerifyCode = async (fullCode = code.join("")) => {
    if (fullCode.length !== 4) {
      setErrorMessage("Por favor ingresa el código completo");
      return;
    }
  
    setIsLoading(true);
    setErrorMessage("");
    try {
      const validationData = {
        userId: userId.toString(),
        code: fullCode
      };
      
      console.log("Validating with data:", validationData);
      
      const validationResponse = await authService.validateVerificationCode(validationData);
      console.log("Validation response:", validationResponse.data);
  
      if (validationResponse.data?.valid) {
        try {
          // Actualizar el rol del usuario al completar la verificación
          console.log("Updating user role from", userId, "to", finalRolId);
          await userService.updateUserRole(userId, finalRolId);
          
          Alert.alert(
            "Verificación exitosa",
            "Tu cuenta ha sido verificada correctamente.",
            [
              {
                text: "OK",
                onPress: () => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "Login" }],
                  });
                },
              },
            ],
            { cancelable: false }
          );
        } catch (roleError) {
          console.error("Error updating role:", roleError);
          Alert.alert(
            "Verificación exitosa",
            "Tu cuenta ha sido verificada, pero hubo un problema actualizando tu rol. Por favor contacta a soporte.",
            [
              {
                text: "OK",
                onPress: () => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "Login" }],
                  });
                },
              },
            ]
          );
        }
      } else {
        setErrorMessage(
          "El código de verificación no coincide. Inténtalo de nuevo."
        );
        // Limpiar los campos en caso de error
        setCode(["", "", "", ""]);
        setActiveInput(0);
        // Focus first input after error
        inputRefs.current[0].focus();
      }
    } catch (error) {
      console.error("Verification error:", error);
      
      // Mejor manejo del mensaje de error
      let errMsg = "Error al verificar el código";
      if (error.response?.data) {
        if (typeof error.response.data === "string") {
          errMsg = error.response.data;
        } else if (error.response.data.message) {
          errMsg = typeof error.response.data.message === "string" 
            ? error.response.data.message 
            : JSON.stringify(error.response.data.message);
        }
      } else if (error.message) {
        errMsg = error.message;
      }
  
      setErrorMessage(errMsg);
      // Limpiar los campos en caso de error
      setCode(["", "", "", ""]);
      setActiveInput(0);
      // Focus first input after error
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.text}>Confirmación de celular</Text>

        <View style={styles.imageContainer}>
          <Image
            source={require("../assets/images/img_code.png")}
            resizeMode="contain"
            style={styles.image}
          />
        </View>

        <Text style={styles.instructions}>
          Ingresa el código de 4 dígitos que enviamos a tu Telegram
        </Text>

        <View style={styles.row}>
          {[0, 1, 2, 3].map((index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.box,
                activeInput === index && styles.activeBox,
                code[index] && styles.filledBox,
              ]}
              keyboardType="numeric"
              maxLength={1}
              value={code[index]}
              onChangeText={(value) => handleCodeChange(index, value)}
              onFocus={() => setActiveInput(index)}
              secureTextEntry={code[index] !== ""}
              selectTextOnFocus
            />
          ))}
        </View>

        {errorMessage ? (
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        ) : null}

        <View style={styles.column}>
          <Text style={styles.text2}>No has recibido el código?</Text>
          <TouchableOpacity
            onPress={handleResendCode}
            disabled={!canResend || isLoading}
          >
            <Text
              style={[
                styles.text3,
                (!canResend || isLoading) && styles.disabledText,
              ]}
            >
              {canResend
                ? "Reenviar código"
                : `Reenviar código (${countdown}s)`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mostramos el botón de abrir Telegram solo si existe un telegramLink */}
        {telegramLink && (
          <TouchableOpacity
            style={styles.telegramButton}
            onPress={handleOpenTelegram}
          >
            <Text style={styles.telegramButtonText}>Abrir Telegram</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.input}
          onPress={() => handleVerifyCode()}
          disabled={isLoading || !code.every((digit) => digit)}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Verificar</Text>
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
    paddingTop: 120,
  },
  text: {
    color: "#000000",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 41,
    textAlign: "center",
  },
  instructions: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 30,
  },
  imageContainer: {
    width: 154,
    height: 154,
    borderRadius: 77,
    backgroundColor: "#5C2684",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 30,
  },
  image: {
    width: 80,
    height: 80,
    tintColor: "#FFFFFF",
  },
  column: {
    alignItems: "center",
    marginBottom: 30,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
  },
  box: {
    width: 59,
    height: 58,
    backgroundColor: "#A4A9AE26",
    borderRadius: 5,
    marginRight: 17,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
  },
  activeBox: {
    borderColor: "#456EFE",
    borderWidth: 1,
  },
  filledBox: {
    backgroundColor: "#F0F0F0",
  },
  input: {
    backgroundColor: "#5C2684",
    borderRadius: 5,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginBottom: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  telegramButton: {
    backgroundColor: "#0088cc",
    borderRadius: 5,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginBottom: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  telegramButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  text2: {
    color: "#A4A9AE",
    fontSize: 16,
  },
  text3: {
    color: "#57435C",
    fontSize: 18,
    fontWeight: "bold",
  },
  disabledText: {
    opacity: 0.5,
  },
  errorMessage: {
    color: "red",
    textAlign: "center",
    marginBottom: 15,
    paddingHorizontal: 20,
  },
});

export default VerificationScreen;
