import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, RefreshControl, Image, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AppLayout from '../components/AppLayout';
import { biometricService } from '../services/api';

const FingerprintsList = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [fingerprints, setFingerprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [isToggling, setIsToggling] = useState(false);

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
  }, []); const loadFingerprints = async () => {
    try {
      setError(null);
      setLoading(true);

      const response = await biometricService.getMyFingerprints();

      if (response.data && Array.isArray(response.data)) {
        // Simplificar: solo procesar huellas sin generar IDs artificiales
        const fingerprintsWithSelection = response.data.map((fingerprint, index) => {
          // Buscar si esta huella estaba previamente seleccionada
          const wasSelected = selectedFingerprints.some(selected => {
            // Si ambos tienen _id, compararlos; sino, comparar por nombre
            if (fingerprint._id && selected._id) {
              return selected._id === fingerprint._id;
            }
            return selected.nombre === fingerprint.nombre;
          });

          return {
            ...fingerprint,
            selected: wasSelected
          };
        });

        setFingerprints(fingerprintsWithSelection);
      } else {
        setError("Error: Formato de respuesta inesperado del servidor");
      }
    } catch (error) {
      setError(`Error al cargar huellas: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFingerprints();
    setRefreshing(false);
  }; const toggleFingerprint = useCallback((index) => {
    if (isToggling) {
      return;
    }

    setIsToggling(true);

    setFingerprints(prevFingerprints => {
      if (typeof index !== 'number' || index < 0 || index >= prevFingerprints.length) {
        setIsToggling(false);
        return prevFingerprints;
      }

      const updated = prevFingerprints.map((fp, i) => {
        if (i === index) {
          return { ...fp, selected: !fp.selected };
        }
        return fp;
      });

      setTimeout(() => setIsToggling(false), 300);

      return updated;
    });
  }, [isToggling]); const handleConfirmSelection = () => {
    const selectedFingerprints = fingerprints.filter(fp => fp.selected);

    if (selectedFingerprints.length === 0) {
      Alert.alert("Advertencia", "Por favor selecciona al menos una huella");
      return;
    }

    if (selectedFingerprints.length < 3) {
      Alert.alert(
        "Huellas insuficientes",
        "Para mayor seguridad, se requiere seleccionar al menos 3 huellas para crear un patrón biométrico.",
        [
          { text: "Entendido", style: "default" }
        ]
      );
      return;
    }

    // Validar que las huellas seleccionadas tengan IDs válidos
    const invalidFingerprints = selectedFingerprints.filter(fp =>
      !fp._id || !/^[0-9a-fA-F]{24}$/.test(fp._id)
    ); if (invalidFingerprints.length > 0) {
      Alert.alert(
        "Problema con las huellas",
        `${invalidFingerprints.length} de las huellas seleccionadas no tienen identificadores válidos. ` +
        "Esto puede indicar que fueron registradas con una versión anterior del sistema. " +
        "¿Deseas continuar de todos modos?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Continuar",
            onPress: () => {
              // Filtrar solo las huellas válidas
              const validFingerprints = selectedFingerprints.filter(fp =>
                fp._id && /^[0-9a-fA-F]{24}$/.test(fp._id)
              );

              if (validFingerprints.length === 0) {
                Alert.alert("Error", "No hay huellas válidas para crear el patrón");
                return;
              }

              if (route.params?.onAdd) {
                route.params.onAdd(validFingerprints);
                navigation.goBack();
              }
            }
          }
        ]
      );
      return;
    } if (route.params?.onAdd) {
      // Enviar las huellas seleccionadas con sus IDs válidos
      route.params.onAdd(selectedFingerprints);
      navigation.goBack();
    } else {
      Alert.alert("Error", "No se pudo completar la selección");
    }
  };

  const handleAddNewFingerprint = () => {
    Alert.alert(
      "Registrar Nueva Huella",
      "Esta funcionalidad te permitirá registrar una nueva huella dactilar.",
      [
        { text: "Cancelar", style: "cancel" }, {
          text: "Continuar", onPress: () => {
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
          <Text style={styles.emptyTitle}>Sin huellas registradas</Text>          <Text style={styles.emptyText}>
            Aún no tienes huellas dactilares registradas.
          </Text>
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
      >        <Text style={styles.subtitle}>
          Selecciona las huellas requeridas para esta restricción ({fingerprints.filter(fp => fp.selected).length} seleccionadas)
        </Text>        {fingerprints.map((fingerprint, index) => (
          <TouchableOpacity
            key={`fingerprint-${index}`}
            style={[
              styles.fingerprintItem,
              fingerprint.selected && styles.selectedFingerprint,
              isToggling && styles.disabledFingerprint
            ]} onPress={() => {
              if (isToggling) {
                return;
              }

              toggleFingerprint(index);
            }}
            disabled={isToggling}
            activeOpacity={isToggling ? 1 : 0.7}
          >
            <View style={styles.fingerprintIcon}>
              <Image source={require('../assets/images/fingerprint.png')} style={styles.fingerprintImage} />
            </View>            <View style={styles.fingerprintInfo}>
              <Text style={styles.fingerprintName}>{fingerprint.nombre}</Text>
              <Text style={styles.fingerprintDesc}>{fingerprint.descripcion}</Text>
            </View>
            {fingerprint.selected && (
              <View style={styles.checkIcon}>
                <Image source={require('../assets/images/checkmark.png')} style={styles.checkImage} />
              </View>
            )}
          </TouchableOpacity>
        ))}        <View style={styles.buttonContainer}>
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
  }, selectedFingerprint: {
    backgroundColor: "#E8F0FE",
    borderColor: "#5C2684",
    borderWidth: 2,
  },
  disabledFingerprint: {
    opacity: 0.6,
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