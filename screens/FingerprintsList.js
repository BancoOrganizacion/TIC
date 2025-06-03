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

  // Cargar huellas al montar el componente
  useEffect(() => {
    loadFingerprints();
  }, []);

  const loadFingerprints = async () => {
    try {
      setError(null);
      setLoading(true);

      console.log("Loading fingerprints from API");
      
      // Llamada al servicio corregido
      const response = await biometricService.getMyFingerprints();
        console.log("API Response status:", response.status);
      console.log("API Response data:", JSON.stringify(response.data, null, 2));
      console.log("API Response data type:", typeof response.data);
      console.log("API Response data is array:", Array.isArray(response.data));
      
      if (response.data !== null && response.data !== undefined) {
        let fingerprintsData = [];
        
        // La respuesta puede venir en diferentes formatos, manejamos todos
        if (Array.isArray(response.data)) {
          console.log("Response is direct array");
          fingerprintsData = response.data;
        } else if (response.data.fingerprints && Array.isArray(response.data.fingerprints)) {
          console.log("Response has fingerprints property");
          fingerprintsData = response.data.fingerprints;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          console.log("Response has nested data property");
          fingerprintsData = response.data.data;
        } else if (typeof response.data === 'object' && response.data !== null) {
          console.log("Response is object, checking for array properties");
          // Buscar cualquier propiedad que sea un array
          const arrayProps = Object.keys(response.data).filter(key => Array.isArray(response.data[key]));
          if (arrayProps.length > 0) {
            console.log("Found array properties:", arrayProps);
            fingerprintsData = response.data[arrayProps[0]];
          } else {
            console.log("No array properties found, treating as empty");
            fingerprintsData = [];
          }
        } else {
          console.log("Formato de respuesta inesperado:", response.data);
          fingerprintsData = [];
        }        console.log("Fingerprints data to process:", fingerprintsData);
        console.log("Number of fingerprints found:", fingerprintsData.length);
        
        // Filtrar elementos null antes del mapeo
        const validFingerprintsData = fingerprintsData.filter(fp => fp !== null && fp !== undefined);
        console.log("Valid fingerprints (non-null):", validFingerprintsData.length);
        
        if (validFingerprintsData.length === 0) {
          console.log("No valid fingerprints found - all elements are null");
          setFingerprints([]);
          return;
        }

        // Mapear los datos de la API al formato esperado por el componente
        const mappedFingerprints = validFingerprintsData.map((fingerprint, index) => {
          console.log(`Processing fingerprint ${index}:`, JSON.stringify(fingerprint, null, 2));
          
          // Validar que el objeto tenga la estructura mínima esperada
          if (!fingerprint || typeof fingerprint !== 'object') {
            console.warn(`Fingerprint ${index} is not a valid object:`, fingerprint);
            return null;
          }
          
          const fingerprintId = fingerprint._id || fingerprint.id || `fingerprint-${index}`;
          
          // Verificar si esta huella ya está seleccionada
          const isSelected = selectedFingerprints.some(selected => selected._id === fingerprintId);
          
          return {
            id: fingerprintId,
            _id: fingerprintId,
            nombre: fingerTypeMapping[fingerprint.dedo] || fingerprint.nombre || fingerprint.dedo || `Huella ${index + 1}`,
            descripcion: `Huella del ${(fingerTypeMapping[fingerprint.dedo] || fingerprint.dedo || 'dedo desconocido').toLowerCase()}`,
            dedo: fingerprint.dedo,
            calidad: fingerprint.calidad || fingerprint.quality || null,
            template: fingerprint.template || fingerprint.huella,
            fechaRegistro: fingerprint.fechaRegistro || fingerprint.createdAt || fingerprint.fechaCreacion,
            selected: isSelected
          };
        }).filter(Boolean); // Filtrar elementos null

        console.log("Mapped fingerprints:", mappedFingerprints);
        console.log("Number of valid fingerprints:", mappedFingerprints.length);
        setFingerprints(mappedFingerprints);
      } else {
        console.log("No data in response");
        setFingerprints([]);
      }

    } catch (error) {
      console.error("Error loading fingerprints:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data,
        } : "No response",
        config: error.config ? {
          url: error.config.url,
          method: error.config.method,
        } : "No config"
      });
        let errorMessage = "Error al cargar las huellas. Por favor, intenta nuevamente.";
      
      if (error.response) {
        console.error("Response error details:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
        
        switch (error.response.status) {
          case 401:
            errorMessage = "Sesión expirada. Por favor, inicia sesión nuevamente.";
            break;
          case 404:
            errorMessage = "No se encontraron huellas registradas. Registra tu primera huella para comenzar.";
            setFingerprints([]); // Establecer como array vacío para mostrar estado sin huellas
            break;
          case 500:
            errorMessage = "Error del servidor. Intenta más tarde.";
            break;
          default:
            errorMessage = error.response.data?.message || `Error ${error.response.status}: ${error.response.statusText}`;
        }
      } else if (error.message.includes("Network")) {
        errorMessage = "Error de conexión. Verifica tu internet.";
      }
      
      setError(errorMessage);
      setFingerprints([]);
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
        { text: "Continuar", onPress: () => {
          console.log("Navegar a registro de huellas");
          navigation.navigate('CreateRestriction');
        }}
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