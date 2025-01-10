import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons"; // Para el ícono de flecha

export default (props) => {
  const [code, setCode] = useState(["", "", "", ""]); // Estado para los inputs del código
  const [resendDisabled, setResendDisabled] = useState(false); // Estado para deshabilitar el botón de reenviar
  const [countdown, setCountdown] = useState(180); // Contador regresivo de 3 minutos (180 segundos)
  const navigation = useNavigation();

  // Función para manejar el reenvío del código
  const handleResendCode = () => {
    setResendDisabled(true); // Deshabilita el botón
    setCountdown(180); // Reinicia el contador a 3 minutos

    // Simula el envío del código
    alert("Código reenviado");

    // Inicia el contador regresivo
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(interval); // Detiene el contador
          setResendDisabled(false); // Habilita el botón nuevamente
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Función para formatear el tiempo en minutos y segundos
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Flecha de regreso y título */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.title}>{"Confirmación de celular"}</Text>
        </View>

        {/* Imagen */}
        <Image
          source={{
            uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/b26b23fa-bd1d-42f3-bdcf-052a65b4e5f4",
          }}
          width={138} height={138} marginLeft={130}
          style={styles.image}
        />

        {/* Inputs numéricos */}
        <View style={styles.row}>
          {code.map((value, index) => (
            <TextInput
              key={index}
              style={styles.box}
              value={value}
              onChangeText={(text) => {
                const newCode = [...code];
                newCode[index] = text;
                setCode(newCode);
              }}
              keyboardType="numeric"
              maxLength={1}
              textAlign="center"
            />
          ))}
        </View>

        {/* Texto "¿No has recibido el código?" */}
        <Text style={styles.text2}>{"¿No has recibido el código?"}</Text>

        {/* Botón "Reenviar código" */}
        <TouchableOpacity
          onPress={handleResendCode}
          disabled={resendDisabled}
          style={styles.resendButton}
        >
          <Text style={styles.buttonText}>
            {resendDisabled
              ? `Reenviar código en ${formatTime(countdown)}`
              : "Reenviar código"}
          </Text>
        </TouchableOpacity>

        {/* Botón "Registrar" */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => alert("Registro exitoso!")}
        >
          <Text style={styles.text4}>{"Registrar"}</Text>
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
    marginTop: 90,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 41,
    marginHorizontal: 20,
  },
  title: {
    color: "#000000",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 50,

  },
  text2: {
    color: "#A4A9AE",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#57435C",
    fontSize: 16,
    textAlign: "center",
  },
  resendButton: {
    alignItems: "center",
    marginBottom: 93,
  },
  image: {
    height: 138,
    marginBottom: 46,
    marginHorizontal: 111,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginHorizontal: 35,
  },
  box: {
    width: 59,
    height: 58,
    backgroundColor: "#A4A9AE26",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#A4A9AE",
    textAlign: "center",
    fontSize: 24,
  },
  button: {
    backgroundColor: "#5C2684",
    borderRadius: 5,
    paddingVertical: 18,
    paddingHorizontal: 123,
    marginHorizontal: 20,
    alignItems: "center",
  },
  text4: {
    color: "#FFFFFF",
    fontSize: 15,
    textAlign: "center",
  },
});