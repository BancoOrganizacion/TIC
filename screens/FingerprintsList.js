import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AppLayout from "../components/AppLayout";

const FingerprintsList = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Datos quemados con IDs únicos
  const [fingerprints, setFingerprints] = useState([
    {
      id: "fingerprint-1",
      _id: "60d5ecb74e4e8d1b5cbf2456",  // ID en formato MongoDB
      nombre: "Pulgar derecho",
      descripcion: "Huella del pulgar de la mano derecha",
      selected: false
    },
    {
      id: "fingerprint-2",
      _id: "60d5ecb74e4e8d1b5cbf2457",  // ID en formato MongoDB
      nombre: "Índice derecho",
      descripcion: "Huella del dedo índice derecho",
      selected: false
    },
    {
      id: "fingerprint-3",
      _id: "60d5ecb74e4e8d1b5cbf2458",  // ID en formato MongoDB
      nombre: "Pulgar izquierdo",
      descripcion: "Huella del pulgar de la mano izquierda",
      selected: false
    },
    {
      id: "fingerprint-4",
      _id: "60d5ecb74e4e8d1b5cbf2459",  // ID en formato MongoDB
      nombre: "Índice izquierdo",
      descripcion: "Huella del dedo índice izquierdo",
      selected: false
    }
  ]);

  const toggleFingerprint = (id) => {
    setFingerprints(fingerprints.map(fp => 
      fp.id === id ? { ...fp, selected: !fp.selected } : fp
    ));
  };

  const handleConfirmSelection = () => {
    const selectedFingerprints = fingerprints.filter(fp => fp.selected);
    
    if (selectedFingerprints.length === 0) {
      Alert.alert("Advertencia", "Por favor selecciona al menos una huella");
      return;
    }

    if (route.params?.onAdd) {
      // Formato simplificado para evitar problemas de serialización
      const simplifiedFingerprints = selectedFingerprints.map(({ _id, nombre, descripcion }) => ({
        _id,
        nombre,
        descripcion
      }));
      
      console.log("Enviando huellas seleccionadas:", JSON.stringify(simplifiedFingerprints));
      
      route.params.onAdd(simplifiedFingerprints);
      navigation.goBack();
    } else {
      console.error("onAdd callback no está definido");
      Alert.alert("Error", "No se pudo completar la selección");
    }
  };

  return (
    <AppLayout
      title="Seleccionar Huellas"
      onBackPress={() => navigation.goBack()}
      showBack={true}
    >
      <Text style={styles.subtitle}>
        Selecciona las huellas requeridas para esta restricción
      </Text>

      {fingerprints.map((fingerprint) => (
        <TouchableOpacity
          key={fingerprint.id}  // Usamos el id único aquí
          style={[
            styles.fingerprintItem,
            fingerprint.selected && styles.selectedFingerprint
          ]}
          onPress={() => toggleFingerprint(fingerprint.id)}
        >
          <Image
            source={require("../assets/images/fingerprint.png")}
            style={styles.fingerprintIcon}
          />
          <View style={styles.fingerprintInfo}>
            <Text style={styles.fingerprintName}>{fingerprint.nombre}</Text>
            <Text style={styles.fingerprintDesc}>{fingerprint.descripcion}</Text>
          </View>
          {fingerprint.selected && (
            <Image
              source={require("../assets/images/checkmark.png")}
              style={styles.checkIcon}
            />
          )}
        </TouchableOpacity>
      ))}

      <TouchableOpacity 
        style={styles.confirmButton}
        onPress={handleConfirmSelection}
      >
        <Text style={styles.confirmButtonText}>Confirmar Selección</Text>
      </TouchableOpacity>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  subtitle: {
    color: "#737373",
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
  },
  fingerprintItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  selectedFingerprint: {
    backgroundColor: "#E8F0FE",
    borderColor: "#5C2684",
    borderWidth: 1,
  },
  fingerprintIcon: {
    width: 40,
    height: 40,
    marginRight: 16,
  },
  fingerprintInfo: {
    flex: 1,
  },
  fingerprintName: {
    color: "#1C1B1F",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  fingerprintDesc: {
    color: "#737373",
    fontSize: 12,
  },
  checkIcon: {
    width: 24,
    height: 24,
  },
  confirmButton: {
    backgroundColor: "#5C2684",
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
    marginBottom: 80,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default FingerprintsList;