import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { AppLayout } from "../components";
import AccountCard from "../components/AccountCard";
import { accountService } from "../services/api";
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
    loadData();
  }, [accountId]);

  const loadData = async () => {
    try {
      await loadUserInfo();
      
      if (accountId) {
        await loadAccountById();
      } else {
        await loadDefaultAccount();
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
      setError("Error al cargar datos. Por favor, intenta nuevamente.");
      setLoading(false);
    }
  };

  const loadUserInfo = async () => {
    try {
      // Intentar cargar desde userProfile en lugar de userData
      const userProfileString = await AsyncStorage.getItem("userProfile");
      if (userProfileString) {
        const userProfile = JSON.parse(userProfileString);
        setUserName(userProfile.nombre || "Usuario");
      } else {
        // Intenta con nombreReal como respaldo
        const nombreReal = await AsyncStorage.getItem("nombreReal");
        if (nombreReal) {
          setUserName(nombreReal);
        }
      }
    } catch (error) {
      console.error("Error cargando información del usuario:", error);
    }
  };

  const loadDefaultAccount = async () => {
    try {
      console.log("Cargando cuenta predeterminada...");
      const response = await accountService.getMyAccounts();
      
      if (response.data && response.data.length > 0) {
        // Usar la primera cuenta por defecto
        const firstAccount = response.data[0];
        console.log("Cuenta predeterminada encontrada:", firstAccount._id);
        
        setAccountData({
          id: firstAccount._id,
          accountNumber: firstAccount.numero_cuenta || "Sin número",
          accountName: "Cuenta Principal",
          accountType: firstAccount.tipo_cuenta === "CORRIENTE" ? "Corriente" : "Ahorros",
          balance: formatCurrency(firstAccount.monto_actual || 0)
        });
        
        // Cargar transacciones de la cuenta predeterminada
        await loadTransactions(firstAccount._id);
      } else {
        console.log("No se encontraron cuentas");
        setLoading(false);
        setError("No tienes cuentas registradas");
      }
    } catch (error) {
      console.error("Error cargando cuenta predeterminada:", error);
      handleApiError(error, "cargar cuentas");
    }
  };

  const loadAccountById = async () => {
    console.log("Cargando cuenta por ID:", accountId);
    
    try {
      // Obtener todas las cuentas primero
      const allAccountsResponse = await accountService.getMyAccounts();
      console.log("Cuentas obtenidas:", allAccountsResponse.data?.length || 0);
      
      const accounts = allAccountsResponse.data || [];
      // Buscar la cuenta por ID en el arreglo de cuentas
      const matchingAccount = accounts.find(acc => acc._id === accountId);
      
      if (matchingAccount) {
        console.log("Cuenta encontrada:", matchingAccount._id);
        setAccountData({
          id: matchingAccount._id,
          accountNumber: matchingAccount.numero_cuenta || "Sin número",
          accountName: "Cuenta Principal",
          accountType: matchingAccount.tipo_cuenta === "CORRIENTE" ? "Corriente" : "Ahorros",
          balance: formatCurrency(matchingAccount.monto_actual || 0)
        });
        
        // Cargar transacciones para la cuenta encontrada
        await loadTransactions(accountId);
      } else {
        console.log("Cuenta no encontrada en la lista de cuentas");
        setError("No se encontró la cuenta solicitada");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error buscando cuenta por ID:", error);
      handleApiError(error, "cargar detalles de la cuenta");
    }
  };

  const loadTransactions = async (accountId, page = 1, shouldAppend = false) => {
    console.log(`Cargando transacciones para cuenta ${accountId}, página ${page}`);
    
    if (page === 1 && !shouldAppend) {
      setLoading(true);
      setError(null);
    }
    
    try {
      // Intentar cargar las transacciones de la cuenta
      const response = await accountService.getAccountTransactions(accountId, {
        page,
        limit: 10
      });
      
      console.log("Respuesta de transacciones:", response.status);
      
      // Procesar los datos según la estructura de la respuesta
      let transactionData = [];
      let pagination = null;
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          // Si la respuesta es un array, esos son los datos
          transactionData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // Si la respuesta tiene un campo 'data', usamos ese
          transactionData = response.data.data;
          pagination = response.data.pagination;
        } else if (response.data.movimientos && Array.isArray(response.data.movimientos)) {
          // Si la respuesta tiene un campo 'movimientos', usamos ese
          transactionData = response.data.movimientos;
        } else {
          // Si no es ninguno de los anteriores, pero parece que podría ser una transacción
          if (response.data._id || response.data.monto || response.data.fecha) {
            transactionData = [response.data];
          }
        }
      }
      
      console.log(`Transacciones cargadas: ${transactionData.length}`);
      
      // Si no hay datos de transacciones, puede que estén en un formato diferente
      if (transactionData.length === 0 && response.data && response.data.movimientos) {
        // Intentamos buscar movimientos en un formato alternativo
        console.log("Intentando formato alternativo...");
        transactionData = response.data.movimientos;
        console.log(`Transacciones encontradas en formato alternativo: ${transactionData.length}`);
      }
      
      // Procesar las transacciones para la UI
      const processedTransactions = processTransactions(transactionData);
      console.log(`Transacciones procesadas: ${processedTransactions.length}`);
      
      if (shouldAppend) {
        setTransactions(prev => [...prev, ...processedTransactions]);
        setCurrentPage(page);
      } else {
        setTransactions(processedTransactions);
        setCurrentPage(1);
        
        // Guardar en caché para uso offline
        if (processedTransactions.length > 0) {
          await AsyncStorage.setItem(
            `transactions_${accountId}`, 
            JSON.stringify(processedTransactions)
          );
        }
      }
      
      // Determinar si hay más transacciones disponibles
      if (pagination) {
        setHasMoreTransactions(pagination.page < pagination.pages);
      } else {
        // Si no hay información de paginación, asumimos que hay más si recibimos resultados completos
        setHasMoreTransactions(transactionData.length === 10);
      }
    } catch (error) {
      console.error("Error cargando transacciones:", error);
      
      // Intentar cargar de caché si es el primer load
      if (page === 1 && !shouldAppend) {
        try {
          const cached = await AsyncStorage.getItem(`transactions_${accountId}`);
          if (cached) {
            console.log("Cargando transacciones desde caché");
            setTransactions(JSON.parse(cached));
            setError("Usando datos almacenados. No hay conexión.");
            setLoading(false);
            return;
          }
        } catch (cacheError) {
          console.error("Error cargando desde caché:", cacheError);
        }
      }
      
      setError("Error al cargar transacciones");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Función para procesar las transacciones y adaptarlas al formato de la UI
  const processTransactions = (data = []) => {
    if (!Array.isArray(data)) {
      console.warn("processTransactions recibió datos que no son un array:", data);
      return [];
    }
    
    return data.map(transaction => {
      // Verificar que la transacción tenga los campos necesarios
      if (!transaction || typeof transaction !== 'object') {
        console.warn("Transacción inválida:", transaction);
        return null;
      }
      
      // Si la transacción no tiene un tipo, intentamos determinarlo
      const tipo = transaction.tipo || determineTransactionType(transaction);
      
      // Determinar si es un ingreso o un egreso
      const isIncome = ['DEPOSITO', 'TRANSFERENCIA_RECIBIDA'].includes(tipo);
      
      return {
        id: transaction._id || `temp-${Math.random()}`,
        name: getTransactionName(transaction, tipo),
        date: formatDate(transaction.fecha),
        amount: formatCurrency(transaction.monto, !isIncome),
        isIncome,
        type: tipo,
        originalData: transaction
      };
    }).filter(Boolean); // Filtrar elementos nulos
  };

  // Función para determinar el tipo de transacción cuando no está especificado
  const determineTransactionType = (transaction) => {
    if (transaction.remitente && transaction.beneficiario === transaction.cuenta) {
      return "TRANSFERENCIA_RECIBIDA";
    }
    if (transaction.beneficiario && transaction.remitente === transaction.cuenta) {
      return "TRANSFERENCIA_ENVIADA";
    }
    if (!transaction.remitente && transaction.beneficiario === transaction.cuenta) {
      return "DEPOSITO";
    }
    if (transaction.remitente === transaction.cuenta && !transaction.beneficiario) {
      return "RETIRO";
    }
    
    // Si no podemos determinar, asumimos depósito
    return "DEPOSITO";
  };

  const getTransactionName = (transaction, tipo) => {
    // Personalizar el nombre de la transacción según el tipo
    if (transaction.concepto) return transaction.concepto;
    
    switch (tipo) {
      case "DEPOSITO":
        return "Depósito en cuenta";
      case "RETIRO":
        return "Retiro/Pago";
      case "TRANSFERENCIA_RECIBIDA":
        return `Transferencia de ${transaction.remitente_nombre || "cuenta externa"}`;
      case "TRANSFERENCIA_ENVIADA":
        return `Transferencia a ${transaction.beneficiario_nombre || "cuenta externa"}`;
      default:
        return "Movimiento";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Fecha no disponible";
    return moment(dateString).format('DD MMM, YYYY');
  };

  const formatCurrency = (amount, isNegative = false) => {
    if (amount === undefined || amount === null) return "$0.00";
    
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

  const handleBackPress = () => {
    navigation.goBack();
  };

  // Si está cargando y no es una actualización, mostrar pantalla de carga
  if (loading && !refreshing) {
    return (
      <AppLayout
        title="Movimientos"
        onBackPress={handleBackPress}
        showGreeting={false}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0045B5" />
          <Text style={styles.loadingText}>Cargando movimientos...</Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Movimientos"
      onBackPress={handleBackPress}
      showGreeting={false}
    >
      {/* Contenedor principal */}
      <View style={styles.mainContainer}>
        {/* Utilizamos el componente AccountCard */}
        {accountData && (
          <AccountCard
            accountNumber={accountData.accountNumber}
            accountName={accountData.accountName}
            accountType={accountData.accountType}
            balance={accountData.balance}
            onPress={() => navigation.navigate("AccountSelector")}
            style={styles.accountCard}
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
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#737373",
  },
  accountCard: {
    marginBottom: 24,
  },
  transactionsContainer: {
    flex: 1,
  },
  transactionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    color: "#1C1B1F",
  },
  transactionsList: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
    textAlign: "center",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#737373",
    fontSize: 16,
    textAlign: "center",
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F5",
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F2F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionIcon: {
    width: 24,
    height: 24,
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
  incomeText: {
    color: "#34C759",
  },
  expenseText: {
    color: "#FF3B30",
  },
  loadingMoreContainer: {
    padding: 16,
    alignItems: "center",
  },
  loadingMoreText: {
    fontSize: 14,
    color: "#737373",
    marginTop: 8,
  },
});

export default TransactionHistory;