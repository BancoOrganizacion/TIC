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
import { accountService, biometricService } from "../services/api";

// Función de utilidad para diagnosticar problemas con huellas
const diagnoseBiometricIssues = async () => {
  try {
    console.log("Diagnosing biometric issues...");
    
    // Diagnóstico básico de huellas
    const diagnosis = await biometricService.diagnoseFingerprintIds();
    
    if (diagnosis.error) {
      return {
        canCreatePattern: false,
        reason: `Error getting fingerprints: ${diagnosis.error}`,
        suggestions: ["Verify internet connection", "Check authentication"]
      };
    }

    if (diagnosis.totalFingerprints === 0) {
      return {
        canCreatePattern: false,
        reason: "No fingerprints registered",
        suggestions: ["Register fingerprints first"]
      };
    }

    if (diagnosis.withValidIds === 0) {
      return {
        canCreatePattern: false,
        reason: "No fingerprints have valid IDs",
        suggestions: [
          "Fingerprints may have been registered with an older system version",
          "Try re-registering the fingerprints",
          "Contact system administrator"
        ]
      };
    }

    return {
      canCreatePattern: true,
      validFingerprints: diagnosis.withValidIds,
      totalFingerprints: diagnosis.totalFingerprints,
      details: diagnosis
    };

  } catch (error) {
    console.error("Error diagnosing biometric issues:", error);
    return {
      canCreatePattern: false,
      reason: `Diagnosis failed: ${error.message}`,
      suggestions: ["Check system connectivity"]
    };
  }
};

const CreateRestrictionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { accountId, onSave } = route.params;

  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [fingerprints, setFingerprints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [creatingPattern, setCreatingPattern] = useState(false);

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

const createBiometricPattern = async (selectedFingerprints) => {
  try {
    console.log("Creating biometric pattern with fingerprints:", selectedFingerprints);
    
    if (!selectedFingerprints || selectedFingerprints.length === 0) {
      throw new Error("No hay huellas seleccionadas para crear el patrón");
    }

    // Validar que las huellas tengan IDs válidos
    const fingerprintIds = selectedFingerprints.map(fp => fp._id || fp.id).filter(Boolean);
    
    if (fingerprintIds.length === 0) {
      throw new Error("Las huellas seleccionadas no tienen identificadores válidos");
    }

    console.log("Extracted fingerprint IDs:", fingerprintIds);
    
    // Validar formato de ObjectIds de MongoDB
    const invalidIds = fingerprintIds.filter(id => !id || !/^[0-9a-fA-F]{24}$/.test(id));
    if (invalidIds.length > 0) {
      console.warn("Invalid fingerprint IDs found:", invalidIds);
      throw new Error(`IDs de huella inválidos: ${invalidIds.join(', ')}`);
    }

    // Usar el servicio correcto con los IDs de las huellas
    console.log("Sending fingerprint IDs to backend:", fingerprintIds);
    const response = await biometricService.createPattern(fingerprintIds);
    
    if (response.data && (response.data.id || response.data._id || response.data.patternId)) {
      const patternId = response.data.id || response.data._id || response.data.patternId;
      console.log("Pattern created successfully with ID:", patternId);
      return patternId;
    } else {
      throw new Error("El backend no devolvió un ID de patrón válido");
    }
    } catch (error) {
    console.error("Error creating biometric pattern:", error);
    
    // Mensaje más específico según el tipo de error
    if (error.message && error.message.includes("IDs de huella inválidos")) {
      throw new Error(
        "Las huellas seleccionadas no tienen identificadores válidos en el sistema. " +
        "Esto puede ocurrir si las huellas fueron registradas con una versión anterior del sistema. " +
        "Por favor, registra nuevas huellas o contacta al administrador."
      );
    } else if (error.message && error.message.includes("identificadores válidos")) {
      throw new Error(
        "Las huellas deben ser registradas en el sistema antes de crear un patrón. " +
        "Por favor, registra las huellas primero y luego intenta crear la restricción."
      );
    } else if (error.message && error.message.includes("No autorizado")) {
      throw new Error("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
    } else if (error.message && error.message.includes("conexión")) {
      throw new Error("Error de conexión. Verifica tu internet e intenta nuevamente.");
    }
    
    throw error;
  }
};

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert(
          "Sesión no disponible",
          "Por favor inicia sesión nuevamente.",
          [{ text: "OK", onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) }]
        );
        return;
      }

      const newRestriction = {
        monto_desde: parseFloat(fromAmount),
        monto_hasta: parseFloat(toAmount),
      };      let patternId = null;

      if (fingerprints.length > 0) {
        try {
          setCreatingPattern(true);
          console.log("Creating pattern for restriction...");          // Realizar diagnóstico antes de intentar crear el patrón
          console.log("Running biometric diagnosis before pattern creation...");
          const diagnosis = await diagnoseBiometricIssues();
          
          if (!diagnosis.canCreatePattern) {
            console.warn("Biometric diagnosis failed:", diagnosis.reason);
            
            Alert.alert(
              "Problema con las huellas biométricas",              `${diagnosis.reason}\n\nSugerencias:\n${diagnosis.suggestions.map(s => `• ${s}`).join('\n')}`,
              [
                { text: "Cancelar", style: "cancel" },
                { 
                  text: "Crear sin biometría", 
                  onPress: () => {
                    // Continuar sin patrón biométrico
                    console.log("User chose to continue without biometric pattern");
                    setFingerprints([]);
                    setCreatingPattern(false);
                  }
                }
              ]
            );
            return;
          }

          console.log(`Diagnosis passed: ${diagnosis.validFingerprints}/${diagnosis.totalFingerprints} valid fingerprints`);

          patternId = await createBiometricPattern(fingerprints);
          if (patternId) {
            try {
              console.log("Getting pattern details for UI update...");
              const patternDetails = await biometricService.getPatternDetails(patternId);

              newRestriction.patron_autenticacion = patternId;
              console.log("Pattern created with details:", patternDetails.data);

            } catch (detailsError) {
              console.warn("Could not get pattern details, but pattern was created:", detailsError);
              newRestriction.patron_autenticacion = patternId;
            }
          }        } catch (patternError) {
          console.error("Error creating pattern:", patternError);

          let errorMessage = "No se pudo crear el patrón biométrico.";
          
          if (patternError.message) {
            if (patternError.message.includes("Se requiere al menos una huella")) {
              errorMessage = "Debes seleccionar al menos una huella para crear el patrón.";
            } else if (patternError.message.includes("Datos inválidos")) {
              errorMessage = "Las huellas seleccionadas no son válidas. Intenta nuevamente.";
            } else if (patternError.message.includes("No autorizado")) {
              errorMessage = "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.";
            } else if (patternError.message.includes("Error interno del servidor")) {
              errorMessage = "Error del servidor. Intenta nuevamente más tarde.";
            } else if (patternError.message.includes("conexión")) {
              errorMessage = "Error de conexión. Verifica tu internet e intenta nuevamente.";
            } else {
              errorMessage = `Error: ${patternError.message}`;
            }
          }

          Alert.alert(
            "Error al crear patrón biométrico",
            `${errorMessage}\n\n¿Deseas crear la restricción sin autenticación biométrica?`,
            [
              {
                text: "Cancelar",
                style: "cancel",
                onPress: () => setLoading(false)
              },
              {
                text: "Continuar sin biometría",
                onPress: () => proceedWithRestriction(newRestriction)
              }
            ]
          );
          return;
        } finally {
          setCreatingPattern(false);
        }
      }

      await proceedWithRestriction(newRestriction);

    } catch (error) {
      console.error("Unexpected error:", error);
      Alert.alert("Error", "Ocurrió un error inesperado");
      setLoading(false);
    }
  };

  const proceedWithRestriction = async (restrictionData) => {
    try {
      console.log("Saving restriction:", JSON.stringify(restrictionData, null, 2));

      const response = await accountService.addAccountRestriction(
        accountId,
        restrictionData
      );

      console.log("Restriction saved successfully:", response.data);

      Alert.alert(
        "Éxito",
        restrictionData.patron_autenticacion
          ? `Restricción creada con autenticación biométrica (Patrón: ${restrictionData.patron_autenticacion.slice(-6)})`
          : "Restricción creada sin autenticación adicional",
        [{
          text: "OK", onPress: () => {
            if (onSave) onSave();
            navigation.goBack();
          }
        }]
      );
    } catch (restrictionError) {
      console.error("Error saving restriction:", restrictionError);
      handleRestrictionError(restrictionError);
    } finally {
      setLoading(false);
    }
  };

  const handleRestrictionError = (error) => {
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
    } else if (error.response?.status === 400 && error.response?.data?.message?.includes("rangos solapados")) {
      Alert.alert(
        "Error",
        "Los rangos de monto se solapan con una restricción existente. Por favor, verifica los valores."
      );
    } else {
      Alert.alert(
        "Error",
        error.response?.data?.message ||
        error.message ||
        "No se pudo crear la restricción"
      );
    }  };

  // Función de debugging para probar el sistema biométrico manualmente
  const handleBiometricDiagnosis = async () => {
    try {
      Alert.alert(
        "Diagnóstico del Sistema Biométrico",
        "Esto ejecutará un diagnóstico completo del sistema de huellas. ¿Continuar?",
        [
          { text: "Cancelar", style: "cancel" },
          { 
            text: "Ejecutar",            onPress: async () => {
              console.log("Starting manual biometric diagnosis...");
              
              const diagnosis = await diagnoseBiometricIssues();
              
              let message = `Resultado del diagnóstico:\n\n`;
              
              if (diagnosis.canCreatePattern) {
                message += `Sistema funcional\n`;
                message += `Huellas válidas: ${diagnosis.validFingerprints}/${diagnosis.totalFingerprints}\n`;
                message += `Puedes crear patrones biométricos.`;
              } else {
                message += `Problema detectado\n`;
                message += `Razón: ${diagnosis.reason}\n\n`;
                message += `Sugerencias:\n${diagnosis.suggestions.map(s => `• ${s}`).join('\n')}`;
              }
              
              Alert.alert("Diagnóstico Completo", message);
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert("Error", `No se pudo ejecutar el diagnóstico: ${error.message}`);
    }
  };

  const handleAddFingerprint = () => {
    navigation.navigate("FingerprintsList", {
      selectedFingerprints: fingerprints,
      onAdd: (selectedFingerprints) => {
        console.log("Huellas seleccionadas recibidas:", JSON.stringify(selectedFingerprints, null, 2));
        setFingerprints(selectedFingerprints);
      },
    });
  };
  const handleDeleteFingerprint = (index) => {
    console.log("Eliminando huella con índice:", index);
    setFingerprints((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBackPress = () => {
    // Si hay cambios no guardados, mostrar confirmación
    if (fromAmount || toAmount || fingerprints.length > 0) {
      Alert.alert(
        "Descartar cambios",
        "¿Estás seguro de que quieres salir? Se perderán los cambios no guardados.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Salir", onPress: () => navigation.goBack() }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const getLoadingText = () => {
    if (creatingPattern) return "Creando patrón...";
    if (loading) return "Guardando...";
    return "Crear restricción";
  };

  const isFormLoading = loading || creatingPattern;

  return (
    <AppLayout
      title="Nueva restricción"
      onBackPress={handleBackPress}
      showGreeting={false}
      style={styles.appLayout}
    >
      {/* Campos de monto */}
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
              onChangeText={(text) => {
                setFromAmount(text);
                if (errors.fromAmount) {
                  setErrors({ ...errors, fromAmount: null });
                }
              }}
              style={styles.input}
              keyboardType="numeric"
              editable={!isFormLoading}
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
              onChangeText={(text) => {
                setToAmount(text);
                if (errors.toAmount) {
                  setErrors({ ...errors, toAmount: null });
                }
              }}
              style={styles.input}
              keyboardType="numeric"
              editable={!isFormLoading}
            />
          </View>
          {errors.toAmount && (
            <Text style={styles.errorText}>{errors.toAmount}</Text>
          )}
        </View>
      </View>

      {/* Sección de huellas */}
      <View style={styles.fingerprintsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Autenticación biométrica
          </Text>
          <Text style={styles.sectionSubtitle}>
            (Opcional)
          </Text>
        </View>

        {fingerprints.length === 0 ? (
          <View style={styles.noFingerprintsContainer}>
            <Image
              source={require("../assets/images/fingerprint.png")}
              style={styles.noFingerprintIcon}
            />
            <Text style={styles.noFingerprintsText}>
              Sin autenticación adicional configurada
            </Text>
            <Text style={styles.noFingerprintsSubtext}>
              Agregar huellas dactilares creará un patrón de autenticación para esta restricción.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.patternInfoContainer}>
              <Text style={styles.fingerprintCount}>
                Patrón biométrico: {fingerprints.length} {fingerprints.length === 1 ? 'huella' : 'huellas'}
              </Text>
              <Text style={styles.patternDescription}>
                Se creará un nuevo patrón con las huellas seleccionadas
              </Text>
            </View>            {fingerprints.map((fingerprint, index) => (
              <View key={`fingerprint-${index}-${fingerprint.nombre || fingerprint.dedo}`} style={styles.fingerprintRow}>
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
                {!isFormLoading && (                  <TouchableOpacity
                    onPress={() => handleDeleteFingerprint(index)}
                    style={styles.deleteButton}
                  >
                    <Image
                      source={require("../assets/images/delete.png")}
                      resizeMode={"stretch"}
                      style={styles.deleteIcon}
                    />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </>
        )}
      </View>      {/* Botón de agregar huella */}
      {!isFormLoading && (
        <>
          <TouchableOpacity
            style={[styles.addButton, fingerprints.length > 0 && styles.addButtonSecondary]}
            onPress={handleAddFingerprint}
          >
            {fingerprints.length > 0 ? (
              <Image
                source={require("../assets/images/edit.png")}
                resizeMode={"stretch"}
                style={styles.editIcon}
              />
            ) : (
              <Text style={styles.addButtonText}>+</Text>
            )}
          </TouchableOpacity>          {/* Botón de diagnóstico - solo visible durante desarrollo */}
          {__DEV__ && (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: "#FF6B35", right: 90 }]}
              onPress={handleBiometricDiagnosis}
            >
              <Text style={[styles.addButtonText, { fontSize: 18 }]}>?</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Indicador de carga para el patrón */}
      {creatingPattern && (
        <View style={styles.patternLoadingContainer}>
          <ActivityIndicator size="small" color="#5C2684" />
          <Text style={styles.patternLoadingText}>
            Creando patrón biométrico...
          </Text>
        </View>
      )}

      {/* Botón de crear restricción */}
      <View style={styles.saveButtonContainer}>
        <Button
          title={getLoadingText()}
          onPress={handleSave}
          style={styles.saveButton}
          disabled={isFormLoading}
        />
        {isFormLoading && (
          <ActivityIndicator
            size="small"
            color="#FFFFFF"
            style={styles.buttonLoader}
          />
        )}
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  appLayout: {
    flex: 1,
    position: 'relative',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100,
  },
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
    fontWeight: "500",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#D9D9D9",
    borderRadius: 7,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#FAFAFA",
  },
  inputError: {
    borderColor: "#D32F2F",
    backgroundColor: "#FFF5F5",
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: "#000000",
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#1C1B1F",
    fontSize: 16,
    fontWeight: "500",
  },
  sectionSubtitle: {
    color: "#737373",
    fontSize: 14,
    marginLeft: 8,
  },
  patternInfoContainer: {
    backgroundColor: "#F0F8FF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#5C2684",
  },
  fingerprintCount: {
    color: "#5C2684",
    fontSize: 14,
    fontWeight: "500",
  },
  patternDescription: {
    color: "#666666",
    fontSize: 12,
    marginTop: 4,
  },
  noFingerprintsContainer: {
    alignItems: "center",
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    borderStyle: "dashed",
  },
  noFingerprintIcon: {
    width: 40,
    height: 40,
    opacity: 0.3,
    marginBottom: 12,
  },
  noFingerprintsText: {
    color: "#737373",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 4,
  },
  noFingerprintsSubtext: {
    color: "#9E9E9E",
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  fingerprintRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#F8F8F8",
    padding: 12,
    borderRadius: 8,
  },
  fingerprintNumber: {
    color: "#5C2684",
    fontSize: 16,
    fontWeight: "500",
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
    fontWeight: "500",
  },
  fingerprintDesc: {
    color: "#737373",
    fontSize: 12,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  deleteIcon: {
    width: 21,
    height: 25,
    tintColor: "#000000",
  },
  addButton: {
    position: "absolute",
    bottom: 70,
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
  addButtonSecondary: {
    backgroundColor: "#5C2684",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  editIcon: {
    width: 20,
    height: 20,
    tintColor: "#FFFFFF",
  },
  patternLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F8FF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  patternLoadingText: {
    color: "#5C2684",
    fontSize: 14,
    marginLeft: 8,
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
  },
  buttonLoader: {
    position: 'absolute',
    right: 30,
  },
});

export default CreateRestrictionScreen;