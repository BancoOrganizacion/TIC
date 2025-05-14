import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppLayout } from "../components";
import Button from "../components/Button";
import { accountService } from "../services/api";

const CreateRestrictionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { accountId, onSave } = route.params;

  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [fingerprints, setFingerprints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Función auxiliar para validar si un string es un ID de MongoDB válido
  const isValidMongoId = (id) => {
    return id && /^[0-9a-fA-F]{24}$/.test(id);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!fromAmount.trim()) {
      newErrors.fromAmount = "El monto desde es requerido";
    } else if (isNaN(parseFloat(fromAmount)) || parseFloat(fromAmount) < 0) {
      newErrors.fromAmount = "Ingrese un valor numérico válido";
    }
    
    if (!toAmount.trim()) {
      newErrors.toAmount = "El monto hasta es requerido";
    } else if (isNaN(parseFloat(toAmount)) || parseFloat(toAmount) <= 0) {
      newErrors.toAmount = "Ingrese un valor numérico válido";
    }
    
    if (parseFloat(fromAmount) >= parseFloat(toAmount)) {
      newErrors.toAmount = "El monto hasta debe ser mayor que el monto desde";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Verificar sesión antes de continuar
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert(
          "Sesión no disponible",
          "Por favor inicia sesión nuevamente.",
          [{ text: "OK", onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) }]
        );
        return;
      }

      // Crear el objeto de restricción con el formato que espera el backend
      const newRestriction = {
        monto_desde: parseFloat(fromAmount),
        monto_hasta: parseFloat(toAmount),
        patron_autenticacion: fingerprints.length > 0 ? 
          // Si hay huellas seleccionadas, usar el ID de la primera huella
          fingerprints[0]._id : 
          // Si no hay huellas seleccionadas, usar un valor predeterminado
          "60d5ecb74e4e8d1b5cbf2457"
      };

      console.log("Enviando restricción:", JSON.stringify(newRestriction, null, 2));

      const response = await accountService.addAccountRestriction(
        accountId,
        newRestriction
      );

      console.log("Respuesta del servidor:", response.data);

      Alert.alert("Éxito", "Restricción creada exitosamente");
      if (onSave) onSave();
      navigation.goBack();
    } catch (error) {
      console.error("Error creating restriction:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      // Manejar específicamente errores de autenticación
      if (error.response?.status === 401) {
        Alert.alert(
          "Sesión expirada",
          "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
          [
            { 
              text: "OK", 
              onPress: () => navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              })
            }
          ]
        );
      } else {
        // Otros errores
        Alert.alert(
          "Error",
          error.response?.data?.message || 
          error.message || 
          "No se pudo crear la restricción"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddFingerprint = () => {
    navigation.navigate("FingerprintsList", {
      onAdd: (selectedFingerprints) => {
        console.log("Huellas seleccionadas:", JSON.stringify(selectedFingerprints));
        setFingerprints(selectedFingerprints);
      },
    });
  };

  const handleDeleteFingerprint = (id) => {
    console.log("Eliminando huella con id:", id);
    setFingerprints((prev) => prev.filter((fp) => fp._id !== id));
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <AppLayout
      title="Nueva restricción"
      onBackPress={handleBackPress}
      showGreeting={false}
    >
      {/* Campos de monto uno al lado del otro */}
      <View style={styles.amountContainer}>
        <View style={styles.amountInputContainer}>
          <Text style={styles.label}>Desde</Text>
          <View style={[
            styles.inputRow,
            errors.fromAmount ? styles.inputError : null
          ]}>
            <Image
              source={require("../assets/images/amount.png")}
              resizeMode={"stretch"}
              style={styles.icon}
            />
            <TextInput
              placeholder="Ej: 0"
              value={fromAmount}
              onChangeText={setFromAmount}
              style={styles.input}
              keyboardType="numeric"
            />
          </View>
          {errors.fromAmount && (
            <Text style={styles.errorText}>{errors.fromAmount}</Text>
          )}
        </View>

        <View style={styles.amountInputContainer}>
          <Text style={styles.label}>Hasta</Text>
          <View style={[
            styles.inputRow,
            errors.toAmount ? styles.inputError : null
          ]}>
            <Image
              source={require("../assets/images/amount.png")}
              resizeMode={"stretch"}
              style={styles.icon}
            />
            <TextInput
              placeholder="Ej: 100"
              value={toAmount}
              onChangeText={setToAmount}
              style={styles.input}
              keyboardType="numeric"
            />
          </View>
          {errors.toAmount && (
            <Text style={styles.errorText}>{errors.toAmount}</Text>
          )}
        </View>
      </View>

      <View style={styles.fingerprintsContainer}>
        <Text style={styles.sectionTitle}>
          Huellas ({fingerprints.length} configuradas)
        </Text>

        {fingerprints.length === 0 ? (
          <Text style={styles.noFingerprintsText}>
            No hay huellas configuradas para esta restricción
          </Text>
        ) : (
          fingerprints.map((fingerprint, index) => (
            <View key={fingerprint._id} style={styles.fingerprintRow}>
              <Text style={styles.fingerprintNumber}>{index + 1}.</Text>
              <Image
                source={require("../assets/images/fingerprint.png")}
                resizeMode={"stretch"}
                style={styles.fingerprintIcon}
              />
              <View style={styles.fingerprintInfo}>
                <Text style={styles.fingerprintText}>
                  {fingerprint.nombre}
                </Text>
                <Text style={styles.fingerprintDesc}>
                  {fingerprint.descripcion}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteFingerprint(fingerprint._id)}
                style={styles.deleteButton}
              >
                <Image
                  source={require("../assets/images/delete.png")}
                  resizeMode={"stretch"}
                  style={styles.deleteIcon}
                />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <View style={styles.saveButtonContainer}>
        <Button
          title={loading ? "Creando..." : "Crear restricción"}
          onPress={handleSave}
          style={styles.saveButton}
          disabled={loading}
        />
      </View>

      <TouchableOpacity style={styles.addButton} onPress={handleAddFingerprint}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  amountContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  amountInputContainer: {
    width: "48%",
  },
  label: {
    color: "#000000",
    fontSize: 14,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#D9D9D9",
    borderRadius: 7,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  inputError: {
    borderColor: "#D32F2F",
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: "#737373",
    fontSize: 15,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 12,
    marginTop: 4,
  },
  fingerprintsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#737373",
    fontSize: 14,
    marginBottom: 16,
  },
  noFingerprintsText: {
    color: "#737373",
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 10,
  },
  fingerprintRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  fingerprintNumber: {
    color: "#000000",
    fontSize: 17,
    marginRight: 8,
  },
  fingerprintIcon: {
    width: 32,
    height: 40,
    marginRight: 8,
  },
  fingerprintInfo: {
    flex: 1,
    marginLeft: 8,
  },
  fingerprintText: {
    color: "#000000",
    fontSize: 14,
  },
  fingerprintDesc: {
    color: "#737373",
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
  },
  deleteIcon: {
    width: 21,
    height: 25,
  },
  addButton: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#5C2684",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  saveButtonContainer: {
    marginTop: 24,
    marginBottom: 80,
  },
  saveButton: {
    width: "100%",
  },
});

export default CreateRestrictionScreen;