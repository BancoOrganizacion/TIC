import React, { useState } from "react";
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
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import BackButton from "../components/BackButton";
import Greeting from "../components/Greeting";
import BottomNavBar from "../components/BottomNavBar";
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

  const handleSave = async () => {
    if (!fromAmount || !toAmount) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    const desde = parseFloat(fromAmount);
    const hasta = parseFloat(toAmount);

    if (isNaN(desde) || isNaN(hasta)) {
      Alert.alert("Error", "Los montos deben ser números válidos");
      return;
    }

    if (desde >= hasta) {
      Alert.alert("Error", "El monto 'Desde' debe ser menor que 'Hasta'");
      return;
    }


    setLoading(true);

    try {
      const newRestriction = {
        monto_desde: parseFloat(fromAmount),
        monto_hasta: parseFloat(toAmount),
        // mock para huellas
        huellas_requeridas: fingerprints.length,
        patron_autenticacion: fingerprints.length > 0 ? "mock_pattern" : null
      };

      await accountService.addAccountRestriction(accountId, newRestriction);

      Alert.alert("Éxito", "Restricción creada exitosamente");
      if (onSave) onSave();
      navigation.goBack();
    } catch (error) {
      console.error("Error creating restriction:", error);
      Alert.alert("Error", "No se pudo crear la restricción");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFingerprint = () => {
    navigation.navigate("AddFingerprint", {
      onAdd: (newPattern) => {
        setFingerprints([...fingerprints, newPattern]);
      },
    });
  };

  const handleDeleteFingerprint = (id) => {
    setFingerprints(fingerprints.filter((fp) => fp._id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Greeting name="Ana" />

        <View style={styles.titleContainer}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.titleText}>Nueva restricción</Text>
        </View>

        <View style={styles.amountContainer}>
          <View style={styles.amountInputContainer}>
            <Text style={styles.label}>Desde</Text>
            <View style={styles.inputRow}>
              <Image
                source={require("../assets/images/amount.png")}
                resizeMode={"stretch"}
                style={styles.icon}
              />
              <TextInput
                placeholder="Ej: 100"
                value={fromAmount}
                onChangeText={setFromAmount}
                style={styles.input}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.amountInputContainer}>
            <Text style={styles.label}>Hasta</Text>
            <View style={styles.inputRow}>
              <Image
                source={require("../assets/images/amount.png")}
                resizeMode={"stretch"}
                style={styles.icon}
              />
              <TextInput
                placeholder="Ej: 500"
                value={toAmount}
                onChangeText={setToAmount}
                style={styles.input}
                keyboardType="numeric"
              />
            </View>
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
      </ScrollView>

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
    bottom: 160,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#5C2684",
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
  },
  saveButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  saveButton: {
    width: "100%",
  },
});

export default CreateRestrictionScreen;
