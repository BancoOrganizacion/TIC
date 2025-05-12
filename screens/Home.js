import React, { useState, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  SafeAreaView,
  View,
  ScrollView,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation} from "@react-navigation/native";
import BottomNavBar from "../components/BottomNavBar";
import Greeting from "../components/Greeting";
import AccountCard from "../components/AccountCard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { accountService, userService } from "../services/api";

const AccountDashboard = () => {
  const navigation = useNavigation();
  const [userProfile, setUserProfile] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          await AsyncStorage.multiSet([
            ["userProfile", JSON.stringify(profileResponse.data)],
            ["userAccounts", JSON.stringify(accountsResponse.data || [])]
          ]);
          
        } catch (error) {
          console.error("Error loading data:", error);
          setError("Error al cargar los datos. Por favor, inténtalo de nuevo.");
        } finally {
          setLoading(false);
        }
      };

      loadData();

      const interval = setInterval(loadData, 10000);
      return () => clearInterval(interval);
    }, [])
  );

  const handleRestrictionsPress = (accountId) => {
    navigation.navigate("RestrictionsList", { accountId });
  };

  const handleAccountPress = (accountId) => {
    navigation.navigate("TransactionHistory", { accountId });
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

    // Ask user to select account type
    Alert.alert(
      "Crear cuenta",
      "Selecciona el tipo de cuenta que deseas crear:",
      [
        {
          text: "Cuenta de ahorros",
          onPress: () => createNewAccount("AHORROS"),
        },
        {
          text: "Cuenta corriente",
          onPress: () => createNewAccount("CORRIENTE"),
        },
        {
          text: "Cancelar",
          style: "cancel",
        },
      ]
    );
  };

  const createNewAccount = async (accountType) => {
    try {
      setLoading(true);
      await accountService.createAccount(accountType);

      // Refresh accounts list
      const accountsResponse = await accountService.getMyAccounts();
      setAccounts(accountsResponse.data || []);

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

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0062CC" />
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <Greeting style={styles.greeting} />

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
                      balance={formatBalance(account.saldo)}
                      style={styles.card}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.noAccountsContainer}>
                <Text style={styles.noAccountsText}>
                  No tienes cuentas bancarias.
                </Text>
              </View>
            )}

            {accounts.length < 2 && (
              <TouchableOpacity
                style={styles.createAccountButton}
                onPress={handleCreateAccount}
              >
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
        </ScrollView>
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
  },
  content: {
    flex: 1,
    paddingHorizontal: 5,
    paddingTop: 40,
  },
  greeting: {
    marginBottom: 24,
  },
  cardsContainer: {
    marginBottom: 24,
  },
  card: {
    marginBottom: 16,
  },
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
    flex: 1,
  },
});

export default AccountDashboard;
