import React, { useState, useEffect } from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import AppLayout from "../components/AppLayout";
import AccountCard from "../components/AccountCard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { accountService, userService } from "../services/api";

const Home = () => {
  const navigation = useNavigation();
  const [userProfile, setUserProfile] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAccountTypeModal, setShowAccountTypeModal] = useState(false);

  // Load user data and accounts when the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
          // Cargar perfil y cuentas en paralelo
          const [profileResponse, accountsResponse] = await Promise.all([
            userService.getUserProfile().catch(e => {
              console.warn("Error loading profile, using cached data:", e);
              return AsyncStorage.getItem("userProfile").then(stored => 
                stored ? { data: JSON.parse(stored) } : Promise.reject(e)
              );
            }),
            accountService.getMyAccounts().catch(e => {
              console.warn("Error loading accounts, using cached data:", e);
              return AsyncStorage.getItem("userAccounts").then(stored => 
                stored ? { data: JSON.parse(stored) } : { data: [] })
            })
          ]);
    
          // Actualizar estado
          setUserProfile(profileResponse.data);
          setAccounts(accountsResponse.data || []);
          
          // Guardar datos en caché
          await AsyncStorage.setItem("userProfile", JSON.stringify(profileResponse.data));
          await AsyncStorage.setItem("userAccounts", JSON.stringify(accountsResponse.data || []));
          
        } catch (error) {
          console.error("Error loading data:", error);
          setError("Error al cargar los datos. Por favor, inténtalo de nuevo.");
        } finally {
          setLoading(false);
        }
      };

      loadData();
      
      // No es necesario un intervalo para recargar datos automáticamente,
      // ya que useFocusEffect se activa cada vez que la pantalla recibe el foco
      // y después de navegaciones (como crear una nueva cuenta o agregar restricciones)
      
    }, [])
  );

  const handleRestrictionsPress = (accountId) => {
    navigation.navigate("RestrictionsList", { 
      accountId,
      onSave: refreshAccounts // Agregamos callback para refrescar datos al regresar
    });
  };

  const handleAccountPress = (accountId) => {
    navigation.navigate("TransactionHistory", { accountId });
  };

  // Función para refrescar solo las cuentas sin recargar el perfil
  const refreshAccounts = async () => {
    try {
      setLoading(true);
      const accountsResponse = await accountService.getMyAccounts();
      setAccounts(accountsResponse.data || []);
      await AsyncStorage.setItem("userAccounts", JSON.stringify(accountsResponse.data || []));
    } catch (error) {
      console.error("Error refreshing accounts:", error);
      // No mostramos error al usuario en una actualización silenciosa
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    // Check if user already has 2 accounts
    if (accounts.length >= 2) {
      Alert.alert(
        "Límite alcanzado",
        "Ya tienes el máximo de 2 cuentas permitidas."
      );
      return;
    }

    // Show custom account type selection modal instead of Alert
    setShowAccountTypeModal(true);
  };

  const createNewAccount = async (accountType) => {
    try {
      setLoading(true);
      setShowAccountTypeModal(false);
      await accountService.createAccount(accountType);

      // Refresh accounts list
      await refreshAccounts();

      Alert.alert("Éxito", "Cuenta creada exitosamente");
    } catch (error) {
      console.error("Error creating account:", error);
      Alert.alert(
        "Error",
        "No se pudo crear la cuenta. Por favor, inténtalo de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatAccountNumber = (number) => {
    return number ? `${number}`.padStart(10, "0") : "";
  };

  const formatBalance = (balance) => {
    return balance !== undefined
      ? `$${parseFloat(balance).toFixed(2)}`
      : "$0.00";
  };

  // Si está cargando, muestra un indicador de carga
  if (loading) {
    return (
      <AppLayout showHeader={false}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0062CC" />
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      </AppLayout>
    );
  }

  // Contenido principal
  return (
    <AppLayout 
      showHeader={false} 
      scrollable={true}
    >
      <View style={styles.content}>
        {accounts.length > 0 ? (
          <View style={styles.cardsContainer}>
            {accounts.map((account, index) => (
              <TouchableOpacity
                key={account._id || index}
                onPress={() => handleAccountPress(account._id)}
              >
                <AccountCard
                  accountNumber={formatAccountNumber(account.numero_cuenta)}
                  accountName={
                    userProfile
                      ? `${userProfile.nombre || ""} ${userProfile.apellido || ""}`
                      : "Usuario"
                  }
                  accountType={
                    account.tipo_cuenta === "AHORROS"
                      ? "Ahorros"
                      : "Corriente"
                  }
                  balance={formatBalance(account.monto_actual)}
                  style={styles.card}
                />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.noAccountsContainer}>
            <Image
              source={require("../assets/images/empty-account.png")}
              style={styles.noAccountsImage}
            />
            <Text style={styles.noAccountsText}>
              No tienes cuentas bancarias.
            </Text>
            <Text style={styles.noAccountsSubtext}>
              Crea tu primera cuenta para comenzar.
            </Text>
          </View>
        )}

        {accounts.length < 2 && (
          <TouchableOpacity
            style={styles.createAccountButton}
            onPress={handleCreateAccount}
          >
            <Image
              source={require("../assets/images/plus-circle.png")}
              style={styles.createAccountIcon}
            />
            <Text style={styles.createAccountText}>Crear nueva cuenta</Text>
          </TouchableOpacity>
        )}

        {accounts.length > 0 && (
          <TouchableOpacity
            style={styles.restrictionButton}
            onPress={() => handleRestrictionsPress(accounts[0]?._id)}
          >
            <Image
              source={require("../assets/images/fingerprint.png")}
              style={styles.restrictionIcon}
            />
            <Text style={styles.restrictionText}>
              Registrar restricciones
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal personalizado para selección de tipo de cuenta */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAccountTypeModal}
        onRequestClose={() => setShowAccountTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Crear cuenta</Text>
            <Text style={styles.modalSubtitle}>
              Selecciona el tipo de cuenta que deseas crear:
            </Text>
            
            <TouchableOpacity
              style={styles.accountTypeButton}
              onPress={() => createNewAccount("AHORROS")}
            >
              <Image
                source={require("../assets/images/savings-icon.png")}
                style={styles.accountTypeIcon}
              />
              <View style={styles.accountTypeInfo}>
                <Text style={styles.accountTypeTitle}>Cuenta de ahorros</Text>
                <Text style={styles.accountTypeDescription}>
                  Ideal para guardar tu dinero y generar intereses
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.accountTypeButton}
              onPress={() => createNewAccount("CORRIENTE")}
            >
              <Image
                source={require("../assets/images/current-icon.png")}
                style={styles.accountTypeIcon}
              />
              <View style={styles.accountTypeInfo}>
                <Text style={styles.accountTypeTitle}>Cuenta corriente</Text>
                <Text style={styles.accountTypeDescription}>
                  Perfecta para tus transacciones diarias
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAccountTypeModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingTop: 24,
  },
  cardsContainer: {
    marginBottom: 24,
  },
  card: {
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#0062CC",
  },
  // Estilo mejorado para el mensaje cuando no hay cuentas
  noAccountsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginTop: 50,
    marginBottom: 40,
  },
  noAccountsImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  noAccountsText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1C1B1F",
    marginBottom: 8,
    textAlign: "center",
  },
  noAccountsSubtext: {
    fontSize: 14,
    color: "#75747E",
    textAlign: "center",
    marginBottom: 24,
  },
  // Estilo mejorado para el botón de crear cuenta
  createAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5C2684",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    height: 60,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createAccountIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
    tintColor: "#FFFFFF",
  },
  createAccountText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // Estilo para el botón de restricciones
  restrictionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#5C2684",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 80,
    height: 60,
  },
  restrictionIcon: {
    width: 17,
    height: 22,
    marginRight: 12,
  },
  restrictionText: {
    color: "#1C1B1F",
    fontSize: 14,
    fontWeight: "500",
  },
  // Estilos para el modal de selección de tipo de cuenta
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1C1B1F",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#75747E",
    marginBottom: 24,
  },
  accountTypeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F7FA",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  accountTypeIcon: {
    width: 40,
    height: 40,
    marginRight: 16,
  },
  accountTypeInfo: {
    flex: 1,
  },
  accountTypeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1B1F",
    marginBottom: 4,
  },
  accountTypeDescription: {
    fontSize: 12,
    color: "#75747E",
  },
  cancelButton: {
    alignItems: "center",
    padding: 16,
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5C2684",
  },
});

export default Home;