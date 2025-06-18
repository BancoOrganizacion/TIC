import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import BackButton from "../components/BackButton";
import Greeting from "../components/Greeting";
import BottomNavBar from "../components/BottomNavBar";
import Button from "../components/Button";
import { accountService, biometricService } from "../services/api";

const EditRestrictionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { restriction, accountId, onSave } = route.params;
  
  const [fromAmount, setFromAmount] = useState(restriction.monto_desde.toString());
  const [toAmount, setToAmount] = useState(restriction.monto_hasta.toString());
  const [fingerprints, setFingerprints] = useState([]);
  const [loading, setLoading] = useState(false);  const [loadingPatterns, setLoadingPatterns] = useState(true);
  const [errors, setErrors] = useState({});  useEffect(() => {
    loadCurrentPattern();
  }, []);

  const loadCurrentPattern = async () => {
    setLoadingPatterns(true);
    try {
      if (restriction.patron_autenticacion) {
        console.log("Loading current pattern:", restriction.patron_autenticacion);
        
        try {
          // Intentar obtener detalles del patrón desde el backend
          const patternDetails = await biometricService.getPatternDetails(restriction.patron_autenticacion);
          
          if (patternDetails.data) {
            // Crear una representación del patrón para la UI
            const patternForUI = {
              _id: restriction.patron_autenticacion,
              nombre: patternDetails.data.nombre || `Patrón ${restriction.patron_autenticacion.slice(-6)}`,
              descripcion: patternDetails.data.descripcion || `Patrón con ${patternDetails.data.cantidadHuellas || 0} huellas`,
              cantidadHuellas: patternDetails.data.cantidadHuellas || 0,
              huellas: patternDetails.data.huellas || []
            };
            
            setFingerprints([patternForUI]);
            console.log("Current pattern loaded:", patternForUI);
          } else {
            // Si no se puede obtener detalles, crear información básica
            const basicPattern = {
              _id: restriction.patron_autenticacion,
              nombre: `Patrón ${restriction.patron_autenticacion.slice(-6)}`,
              descripcion: "Patrón biométrico existente",
              cantidadHuellas: 0,
              huellas: []
            };
            
            setFingerprints([basicPattern]);
            console.log("Basic pattern info created:", basicPattern);
          }
        } catch (patternError) {
          console.warn("Could not load pattern details:", patternError);
          
          // En caso de error, crear información básica del patrón
          const fallbackPattern = {
            _id: restriction.patron_autenticacion,
            nombre: `Patrón ${restriction.patron_autenticacion.slice(-6)}`,
            descripcion: "Patrón biométrico existente",
            cantidadHuellas: 0,
            huellas: []
          };
          
          setFingerprints([fallbackPattern]);
        }
      } else {
        setFingerprints([]);
      }
    } catch (error) {
      console.error("Error cargando patrón actual:", error);
      setFingerprints([]);
    } finally {
      setLoadingPatterns(false);
    }
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
      const updatedData = {
        monto_desde: parseFloat(fromAmount),
        monto_hasta: parseFloat(toAmount),
      };

      if (fingerprints.length > 0 && fingerprints[0]._id) {
        updatedData.patron_autenticacion = fingerprints[0]._id;
      } else {
        updatedData.patron_autenticacion = null;
      }
      
      await accountService.updateAccountRestriction(
        accountId, 
        restriction._id, 
        updatedData
      );
      
      Alert.alert(
        "Éxito", 
        "Restricción actualizada correctamente",
        [{ text: "OK", onPress: () => {
          if (onSave) onSave();
          navigation.goBack();
        }}]
      );
    } catch (error) {
      console.error("Error guardando:", error);
      
      if (error.response?.status === 400 && error.response?.data?.message?.includes("rangos solapados")) {
        Alert.alert(
          "Error",
          "Los rangos de monto se solapan con otra restricción existente."
        );
      } else {
        Alert.alert(
          "Error", 
          error.response?.data?.message || "No se pudo actualizar la restricción"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddFingerprint = () => {
    navigation.navigate("FingerprintsList", {
      selectedFingerprints: fingerprints,
      onAdd: (selectedFingerprints) => {
        setFingerprints(selectedFingerprints);
      }
    });
  };

  const handleDeleteFingerprint = (id) => {
    Alert.alert(
      "Eliminar autenticación",
      "¿Estás seguro de que deseas eliminar esta autenticación biométrica?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: () => setFingerprints(fingerprints.filter(fp => fp._id !== id))
        }
      ]
    );
  };

  if (loadingPatterns) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5C2684" />
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Greeting />

        <View style={styles.titleContainer}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.titleText}>Editar restricción</Text>
        </View>

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
                placeholder="Monto desde"
                value={fromAmount}
                onChangeText={(text) => {
                  setFromAmount(text);
                  if (errors.fromAmount) {
                    setErrors({...errors, fromAmount: null});
                  }
                }}
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
                placeholder="Monto hasta"
                value={toAmount}
                onChangeText={(text) => {
                  setToAmount(text);
                  if (errors.toAmount) {
                    setErrors({...errors, toAmount: null});
                  }
                }}
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Autenticación biométrica
            </Text>
            <Text style={styles.sectionSubtitle}>
              ({fingerprints.length} configurada{fingerprints.length !== 1 ? 's' : ''})
            </Text>
          </View>

          {fingerprints.length === 0 ? (
            <View style={styles.noFingerprintsContainer}>
              <Image
                source={require("../assets/images/fingerprint.png")}
                style={styles.noFingerprintIcon}
              />
              <Text style={styles.noFingerprintsText}>
                Sin autenticación adicional
              </Text>
              <TouchableOpacity 
                style={styles.addPatternButton}
                onPress={handleAddFingerprint}
              >
                <Text style={styles.addPatternButtonText}>
                  Agregar autenticación
                </Text>
              </TouchableOpacity>
            </View>
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
                  <Text style={styles.fingerprintText}>{fingerprint.nombre}</Text>
                  <Text style={styles.fingerprintDesc}>{fingerprint.descripcion}</Text>
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
      </ScrollView>

      <View style={styles.saveButtonContainer}>
        <Button
          title={loading ? "Guardando..." : "Guardar cambios"}
          onPress={handleSave}
          style={styles.saveButton}
          disabled={loading}
        />
      </View>

      {fingerprints.length > 0 && (
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={handleAddFingerprint}
        >
          <Text style={styles.addButtonText}>✎</Text>
        </TouchableOpacity>
      )}

      <BottomNavBar />
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
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: "#737373",
    fontSize: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  titleText: {
    color: "#1C1B1F",
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
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
    marginBottom: 12,
  },
  addPatternButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
  },
  addPatternButtonText: {
    color: "#5C2684",
    fontSize: 13,
    fontWeight: "500",
  },
  fingerprintRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
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
  },  deleteButton: {
    padding: 12,
    borderRadius: 8,
  },
  deleteIcon: {
    width: 24,
    height: 28,
    tintColor: "#D32F2F",
  },
  addButton: {
    position: "absolute",
    bottom: 160,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#8E24AA",
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
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  saveButton: {
    width: "100%",
  },
});

export default EditRestrictionScreen;