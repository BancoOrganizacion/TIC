// TransactionHistory.js
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import BottomNavBar from "../components/BottomNavBar";
import Greeting from "../components/Greeting";
import BackButton from "../components/BackButton";
import AccountCard from "../components/AccountCard";
import { accountsService } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";
import 'moment/locale/es';

const TransactionHistory = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accountData, setAccountData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true);
  const [userName, setUserName] = useState("Usuario");
  const [error, setError] = useState(null);
  
  // Configurar moment para usar español
  moment.locale('es');

  // Obtener la cuenta seleccionada de los parámetros de navegación o usar la primera cuenta
  const accountId = route.params?.accountId;
  
  useEffect(() => {
    loadUserInfo();
    if (accountId) {
      loadAccountData();
    } else {
      loadDefaultAccount();
    }
  }, [accountId]);

  const loadUserInfo = async () => {
    try {
      const userDataString = await AsyncStorage.getItem("userData");
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setUserName(userData.nombre || "Usuario");
      }
    } catch (error) {
      console.error("Error cargando información del usuario:", error);
    }
  };

  const loadDefaultAccount = async () => {
    try {
      const response = await accountsService.getMisCuentas();
      if (response.data && response.data.length > 0) {
        // Usar la primera cuenta por defecto
        const firstAccount = response.data[0];
        setAccountData({
          id: firstAccount._id,
          accountNumber: firstAccount.numero_cuenta,
          accountName: firstAccount.alias || "Cuenta Principal",
          accountType: firstAccount.tipo_cuenta === "CORRIENTE" ? "Corriente" : "Ahorros",
          balance: formatCurrency(firstAccount.saldo)
        });
        loadTransactions(firstAccount._id);
      } else {
        setLoading(false);
        setError("No tienes cuentas registradas");
      }
    } catch (error) {
      handleApiError(error, "cargar cuentas");
    }
  };

  const loadAccountData = async () => {
    try {
      const response = await accountsService.getCuentaPorId(accountId);
      const account = response.data;
      
      setAccountData({
        id: account._id,
        accountNumber: account.numero_cuenta,
        accountName: account.alias || "Cuenta Principal",
        accountType: account.tipo_cuenta === "CORRIENTE" ? "Corriente" : "Ahorros",
        balance: formatCurrency(account.saldo)
      });
      
      loadTransactions(accountId);
    } catch (error) {
      handleApiError(error, "cargar detalles de la cuenta");
    }
  };

  const loadTransactions = async (accountId, page = 1, shouldAppend = false) => {
    if (page === 1 && !shouldAppend) {
      setLoading(true);
      setError(null);
    }
    
    try {
      const response = await accountService.getAccountTransactions(accountId, {
        page,
        limit: 10
      });
      
      // Si hay error pero tenemos datos en caché, usarlos
      if (!response.data && page === 1) {
        const cached = await AsyncStorage.getItem(`transactions_${accountId}`);
        if (cached) {
          setTransactions(JSON.parse(cached));
          return;
        }
      }
      
      // Procesar transacciones
      const newTransactions = processTransactions(response.data);
      
      if (shouldAppend) {
        setTransactions(prev => [...prev, ...newTransactions]);
      } else {
        setTransactions(newTransactions);
        await AsyncStorage.setItem(
          `transactions_${accountId}`, 
          JSON.stringify(newTransactions)
        );
      }
      
      setHasMoreTransactions(newTransactions.length === 10);
    } catch (error) {
      console.error("Error loading transactions:", error);
      
      // Intentar cargar de caché si es el primer load
      if (page === 1 && !shouldAppend) {
        const cached = await AsyncStorage.getItem(`transactions_${accountId}`);
        if (cached) {
          setTransactions(JSON.parse(cached));
          setError("Usando datos almacenados. No hay conexión.");
          return;
        }
      }
      
      setError("Error al cargar transacciones");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getTransactionName = (transaction) => {
    // Personalizar el nombre de la transacción según el tipo
    if (transaction.concepto) return transaction.concepto;
    
    switch (transaction.tipo) {
      case "DEPOSITO":
        return "Depósito en cuenta";
      case "DEBITO":
        return "Retiro/Pago";
      case "TRANSFERENCIA_RECIBIDA":
        return `Transferencia de ${transaction.remitente_nombre || "cuenta externa"}`;
      case "TRANSFERENCIA_ENVIADA":
        return `Transferencia a ${transaction.beneficiario_nombre || "cuenta externa"}`;
      default:
        return "Movimiento";
    }
  };
moment.locale('es');
  const formatDate = (dateString) => {
    return moment(dateString).format('DD MMM, YYYY');
  };

  const formatCurrency = (amount, isNegative = false) => {
    // Si es un débito, asegurarse de que aparezca como negativo para visualización
    const sign = isNegative ? "-" : "+";
    return `${sign}$${parseFloat(Math.abs(amount)).toFixed(2)}`;
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    if (accountData?.id) {
      loadTransactions(accountData.id, 1, false);
    } else {
      setRefreshing(false);
    }
  };

  const loadMoreTransactions = () => {
    if (hasMoreTransactions && !loading && !refreshing && accountData?.id) {
      loadTransactions(accountData.id, currentPage + 1, true);
    }
  };

  const handleApiError = (error, action) => {
    console.error(`Error al ${action}:`, error);
    setLoading(false);
    
    let errorMessage = `No se pudieron ${action}`;
    
    if (error.response) {
      // El servidor respondió con un código de estado diferente de 2xx
      if (error.response.status === 401) {
        // Token expirado
        AsyncStorage.removeItem("token").then(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        });
        errorMessage = "Sesión expirada. Por favor inicia sesión nuevamente.";
      } else if (error.response.data?.message) {
        errorMessage = error.response.data.message;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    setError(errorMessage);
    
    if (errorMessage !== "Sesión expirada. Por favor inicia sesión nuevamente.") {
      Alert.alert("Error", errorMessage);
    }
  };

  const getTransactionIcon = (transaction) => {
    if (transaction.isIncome) {
      return require("../assets/images/income.png");
    } else {
      return require("../assets/images/expense.png");
    }
  };

  const navigateToTransactionDetail = (transaction) => {
    navigation.navigate("TransactionDetail", { transaction, accountData });
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0045B5" />
        <Text style={styles.loadingText}>Cargando movimientos...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Saludo "Hi, [Nombre]!" con la fecha de hoy */}
      <Greeting name={userName} />

      {/* Título "Movimientos" con BackButton a la izquierda */}
      <View style={styles.titleContainer}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.titleText}>Movimientos</Text>
      </View>

      {/* Utilizamos el componente AccountCard */}
      {accountData && (
        <AccountCard
          accountNumber={accountData.accountNumber}
          accountName={accountData.accountName}
          accountType={accountData.accountType}
          balance={accountData.balance}
          onPress={() => navigation.navigate("AccountSelector")}
        />
      )}

      {/* Lista de transacciones */}
      <View style={styles.transactionsContainer}>
        <Text style={styles.transactionsTitle}>Historial de Transacciones</Text>
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        {!error && transactions.length === 0 && !loading && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay movimientos registrados</Text>
          </View>
        )}

        <ScrollView
          style={styles.transactionsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
            if (isCloseToBottom && hasMoreTransactions) {
              loadMoreTransactions();
            }
          }}
          scrollEventThrottle={400}
        >
          {transactions.map((transaction) => (
            <TouchableOpacity
              key={transaction.id}
              style={styles.transactionItem}
              onPress={() => navigateToTransactionDetail(transaction)}
            >
              <View style={styles.transactionIconContainer}>
                <Image
                  source={getTransactionIcon(transaction)}
                  style={styles.transactionIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionName}>{transaction.name}</Text>
                <Text style={styles.transactionDate}>{transaction.date}</Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  transaction.isIncome ? styles.incomeText : styles.expenseText,
                ]}
              >
                {transaction.amount}
              </Text>
            </TouchableOpacity>
          ))}
          
          {loading && currentPage > 1 && (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color="#0045B5" />
              <Text style={styles.loadingMoreText}>Cargando más transacciones...</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Barra de navegación inferior */}
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
    paddingTop: 40,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  titleText: {
    color: "#1C1B1F",
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  accountCard: {
    marginBottom: 24, // Mantenemos el margen inferior
  },
  transactionsContainer: {
    marginBottom: 80,
  },
  transactionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    color: "#1C1B1F",
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F5",
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1C1B1F",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: "#83898F",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default TransactionHistory;