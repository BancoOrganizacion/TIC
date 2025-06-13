import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Image
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { AppLayout } from "../components";
import { biometricService } from "../services/api";

const FingerprintsList = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [fingerprints, setFingerprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Obtener huellas ya seleccionadas desde los parámetros de navegación
  const { selectedFingerprints = [], onAdd } = route.params || {};

  // Mapear tipos de dedos del backend a nombres descriptivos
  const fingerTypeMapping = {
    'PULGAR_DERECHO': 'Pulgar derecho',
    'INDICE_DERECHO': 'Índice derecho',
    'MEDIO_DERECHO': 'Medio derecho',
    'ANULAR_DERECHO': 'Anular derecho',
    'MENIQUE_DERECHO': 'Meñique derecho',
    'PULGAR_IZQUIERDO': 'Pulgar izquierdo',
    'INDICE_IZQUIERDO': 'Índice izquierdo',
    'MEDIO_IZQUIERDO': 'Medio izquierdo',
    'ANULAR_IZQUIERDO': 'Anular izquierdo',
    'MENIQUE_IZQUIERDO': 'Meñique izquierdo'
  };

  useEffect(() => {
    loadFingerprints();
  }, []);

  const loadFingerprints = async () => {
    try {
      setError(null);
      setLoading(true);

      console.log("Loading fingerprints from API");

      const response = await biometricService.getMyFingerprints();
      console.log("API Response status:", response.status);
      console.log("API Response data:", JSON.stringify(response.data, null, 2));

      if (response.data && Array.isArray(response.data)) {
        // Marcar como seleccionadas las huellas que ya estaban seleccionadas
        const fingerprintsWithSelection = response.data.map(fingerprint => ({
          ...fingerprint,
          selected: selectedFingerprints.some(selected => selected._id === fingerprint._id)
        }));

        setFingerprints(fingerprintsWithSelection);
      } else {
        console.error("Unexpected response format - not an array:", response.data);
        setError("Error: Formato de respuesta inesperado del servidor");
      }
    } catch (error) {
      console.error("Error loading fingerprints:", error);
      setError(`Error al cargar huellas: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFingerprints();
    setRefreshing(false);
  };

  const toggleFingerprint = (id) => {
    setFingerprints(fingerprints.map(fp =>
      fp._id === id ? { ...fp, selected: !fp.selected } : fp
    ));
  };

  const handleConfirmSelection = () => {
    const selectedFingerprints = fingerprints.filter(fp => fp.selected);

    if (selectedFingerprints.length === 0) {
      Alert.alert("Advertencia", "Por favor selecciona al menos una huella");
      return;
    }

    if (route.params?.onAdd) {
      const simplifiedFingerprints = selectedFingerprints.map(({ _id, nombre, descripcion, dedo }) => ({
        _id,
        nombre,
        descripcion,
        dedo
      }));

      console.log("Enviando huellas seleccionadas:", JSON.stringify(simplifiedFingerprints, null, 2));

      route.params.onAdd(simplifiedFingerprints);
      navigation.goBack();
    } else {
      console.error("onAdd callback no está definido");
      Alert.alert("Error", "No se pudo completar la selección");
    }
  };

  const handleAddNewFingerprint = () => {
    Alert.alert(
      "Registrar Nueva Huella",
      "Esta funcionalidad te permitirá registrar una nueva huella dactilar.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Continuar", onPress: () => {
            console.log("Navegar a registro de huellas");
            navigation.navigate('CreateRestriction');
          }
        }
      ]
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#5C2684" />
          <Text style={styles.loadingText}>Cargando huellas...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadFingerprints}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (fingerprints.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>Sin huellas registradas</Text>
          <Text style={styles.emptyText}>
            Aún no tienes huellas dactilares registradas. Registra tu primera huella para poder crear patrones de autenticación.
          </Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddNewFingerprint}>
            <Text style={styles.addButtonText}>Registrar Primera Huella</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#5C2684"]}
            tintColor="#5C2684"
          />
        }
      >
        <Text style={styles.subtitle}>
          Selecciona las huellas requeridas para esta restricción ({fingerprints.filter(fp => fp.selected).length} seleccionadas)
        </Text>

        {fingerprints.map((fingerprint) => (
          <TouchableOpacity
            key={fingerprint.id}
            style={[
              styles.fingerprintItem,
              fingerprint.selected && styles.selectedFingerprint
            ]}
            onPress={() => toggleFingerprint(fingerprint.id)}
            activeOpacity={0.7}
          >
            <View style={styles.fingerprintIcon}>
              <Image source={require('../assets/images/fingerprint.png')} style={styles.fingerprintImage} />
            </View>
            <View style={styles.fingerprintInfo}>
              <Text style={styles.fingerprintName}>{fingerprint.nombre}</Text>
              <Text style={styles.fingerprintDesc}>{fingerprint.descripcion}</Text>
              {fingerprint.calidad && (
                <Text style={styles.qualityText}>Calidad: {fingerprint.calidad}%</Text>
              )}
              {fingerprint.fechaRegistro && (
                <Text style={styles.dateText}>
                  Registrado: {new Date(fingerprint.fechaRegistro).toLocaleDateString()}
                </Text>
              )}
            </View>
            {fingerprint.selected && (
              <View style={styles.checkIcon}>
                <Image source={require('../assets/images/checkmark.png')} style={styles.checkImage} />
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddNewFingerprint}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>+ Registrar Nueva Huella</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              fingerprints.filter(fp => fp.selected).length === 0 && styles.disabledButton
            ]}
            onPress={handleConfirmSelection}
            disabled={fingerprints.filter(fp => fp.selected).length === 0}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.confirmButtonText,
              fingerprints.filter(fp => fp.selected).length === 0 && styles.disabledButtonText
            ]}>
              Confirmar Selección ({fingerprints.filter(fp => fp.selected).length})
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  return (
    <AppLayout
      title="Seleccionar Huellas"
      onBackPress={() => navigation.goBack()}
      showBack={true}
    >
      {renderContent()}
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  subtitle: {
    color: "#737373",
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  fingerprintItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  selectedFingerprint: {
    backgroundColor: "#E8F0FE",
    borderColor: "#5C2684",
    borderWidth: 2,
  },
  fingerprintIcon: {
    width: 40,
    height: 40,
    marginRight: 16,
    backgroundColor: "#5C2684",
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fingerprintImage: {
    width: 24,
    height: 24,
    tintColor: "#FFFFFF",
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
    marginBottom: 2,
  },
  qualityText: {
    color: "#5C2684",
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 2,
  },
  dateText: {
    color: "#999999",
    fontSize: 10,
  },
  checkIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkImage: {
    width: 16,
    height: 16,
    tintColor: "#000000",
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 80,
    paddingHorizontal: 16,
  },
  confirmButton: {
    backgroundColor: "#5C2684",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
  },
  disabledButtonText: {
    color: "#666666",
  },
  addButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#5C2684",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  addButtonText: {
    color: "#5C2684",
    fontSize: 16,
    fontWeight: "500",
  },
  loadingText: {
    marginTop: 16,
    color: "#737373",
    fontSize: 16,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: "#5C2684",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyIcon: {
    width: 80,
    height: 80,
    marginBottom: 24,
    backgroundColor: "#E0E0E0",
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1C1B1F",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#737373",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
});

export default FingerprintsList;