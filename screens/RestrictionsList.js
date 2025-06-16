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
      const response = await accountService.getAccountRestrictions(accountId);

      if (response.data && response.data.length > 0) {
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
    if (hasta === Number.MAX_SAFE_INTEGER || hasta >= 999999) return `Mayores de $${desde}`;
    return `De $${desde} hasta $${hasta}`;
  };

  const formatFingerprintsText = (restriction) => {
    // Verificar si tiene patrón de autenticación configurado
    if (restriction.patron_autenticacion) {
      return "Autenticación biométrica requerida";
    }
    return "Sin autenticación adicional";
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

  const handleDelete = async (restrictionId) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que deseas eliminar esta restricción?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await accountService.removeAccountRestriction(accountId, restrictionId);
              Alert.alert("Éxito", "Restricción eliminada correctamente");
              loadRestrictions();
            } catch (error) {
              console.error("Error eliminando restricción:", error);
              Alert.alert("Error", "No se pudo eliminar la restricción");
            }
          },
        },
      ]
    );
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

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
          <TouchableOpacity onPress={loadRestrictions}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {restrictions.length === 0 && !error ? (
        <View style={styles.emptyContainer}>
          <Image
            source={require("../assets/images/empty-state.png")}
            style={styles.emptyImage}
            defaultSource={require("../assets/images/money.png")}
          />
          <Text style={styles.emptyText}>
            No hay restricciones configuradas
          </Text>
          <Text style={styles.emptySubtext}>
            Agrega restricciones para controlar los montos de tus transacciones
          </Text>
        </View>
      ) : (        restrictions.map((restriction) => (
          <View key={restriction._id} style={styles.restrictionCard}>
            <TouchableOpacity 
              style={styles.restrictionContent}
              onPress={() => handleEdit(restriction)}
            >
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
                  {formatFingerprintsText(restriction)}
                </Text>
              </View>
              <View style={styles.statusIndicator}>
                {restriction.patron_autenticacion ? (
                  <Image
                    source={require("../assets/images/fingerprint.png")}
                    style={styles.fingerprintIndicator}
                  />
                ) : (
                  <View style={styles.noAuthIndicator} />
                )}
              </View>
              <Image
                source={require("../assets/images/chevron-right.png")}
                style={styles.arrowIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDelete(restriction._id)}
            >
              <Image
                source={require("../assets/images/delete.png")}
                style={styles.deleteIcon}
              />
            </TouchableOpacity>
          </View>
        ))
      )}

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
    alignItems: "center",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
    textAlign: "center",
  },
  retryText: {
    color: "#5C2684",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyImage: {
    width: 80,
    height: 80,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    color: "#1C1B1F",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    color: "#737373",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
  },  restrictionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#5C2684",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 17,
    paddingLeft: 16,
    paddingRight: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  restrictionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 8,
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
  statusIndicator: {
    marginRight: 8,
  },
  fingerprintIndicator: {
    width: 20,
    height: 20,
    tintColor: "#5C2684",
  },
  noAuthIndicator: {
    width: 20,
    height: 20,
  },  arrowIcon: {
    width: 24,
    height: 24,
    tintColor: "#5C2684",
  },
  deleteButton: {
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  deleteIcon: {
    width: 24,
    height: 24,
    tintColor: "#D32F2F",
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