import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { accountService } from "../services/api";
import { AppLayout } from "../components";

const RestrictionsList = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [restrictions, setRestrictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const accountId = route.params?.accountId;

  useEffect(() => {
    loadRestrictions();
  }, [accountId]);

  const loadRestrictions = async () => {
    setLoading(true);
    setError(null);

    try {
      // OBTENER DATOS REALES DE RESTRICCIONES
      const response = await accountService.getAccountRestrictions(accountId);

      if (response.data && response.data.length > 0) {
        // Usar restricciones reales del backend
        setRestrictions(response.data);
      } else {
        setRestrictions([]);
      }
    } catch (error) {
      console.error("Error cargando restricciones:", error);
      setError("Error al cargar restricciones");
      setRestrictions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatRangeText = (desde, hasta) => {
    if (desde === 0) return `Menores de $${hasta}`;
    if (hasta === 1000) return `Mayores de $${desde}`;
    return `De $${desde} hasta $${hasta}`;
  };

  const formatFingerprintsText = (count) => {
    return count === 1
      ? "1 huella dactilar requerida"
      : `${count} huellas dactilares requeridas`;
  };

  const handleEdit = (restriction) => {
    navigation.navigate("EditRestriction", {
      restriction,
      accountId,
      onSave: loadRestrictions,
    });
  };

  const handleCreate = () => {
    navigation.navigate("CreateRestriction", {
      accountId,
      onSave: loadRestrictions,
    });
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  // Si está cargando
  if (loading) {
    return (
      <AppLayout 
        title="Restricciones"
        onBackPress={handleBackPress}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5C2684" />
          <Text style={styles.loadingText}>Cargando restricciones...</Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Restricciones"
      onBackPress={handleBackPress}
    >
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Lista de restricciones */}
      {restrictions.length === 0 && !error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No hay restricciones configuradas
          </Text>
        </View>
      ) : (
        restrictions.map((restriction) => (
          <View key={restriction._id} style={styles.restrictionCard}>
            <Image
              source={require("../assets/images/money.png")}
              resizeMode="contain"
              style={styles.restrictionIcon}
            />
            <View style={styles.restrictionInfo}>
              <Text style={styles.rangeText}>
                {formatRangeText(
                  restriction.monto_desde,
                  restriction.monto_hasta
                )}
              </Text>
              <Text style={styles.fingerprintsText}>
                {formatFingerprintsText(restriction.huellas_requeridas)}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => handleEdit(restriction)}
              style={styles.editButton}
            >
              <Image
                source={require("../assets/images/chevron-right.png")}
                style={styles.arrowIcon}
              />
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* Botón flotante para añadir */}
      <TouchableOpacity style={styles.addButton} onPress={handleCreate}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#737373",
  },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#737373",
    fontSize: 16,
    textAlign: "center",
  },
  restrictionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#5C2684",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 17,
    paddingHorizontal: 16,
    marginBottom: 16,
    // Sombra sutil
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  restrictionIcon: {
    width: 33,
    height: 31,
    marginRight: 8,
  },
  restrictionInfo: {
    flex: 1,
    marginLeft: 10,
  },
  rangeText: {
    color: "#1C1B1F",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 5,
  },
  fingerprintsText: {
    color: "#53405B",
    fontSize: 12,
  },
  editButton: {
    padding: 8,
  },
  arrowIcon: {
    width: 24,
    height: 24,
    tintColor: "#5C2684",
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#5C2684",
    justifyContent: "center",
    alignItems: "center",
    // Sombra para botón flotante
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "600",
  },
});

export default RestrictionsList;