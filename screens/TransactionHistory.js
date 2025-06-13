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
  }, [accountId]);  const loadData = async () => {
    try {
      console.log("Cargando datos de cuenta:", accountId || "predeterminada");
      
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
          balance: `$${parseFloat(firstAccount.monto_actual || 0).toFixed(2)}`
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
        console.log("Cuenta encontrada:", matchingAccount._id);        setAccountData({
          id: matchingAccount._id,
          accountNumber: matchingAccount.numero_cuenta || "Sin número",
          accountName: "Cuenta Principal",
          accountType: matchingAccount.tipo_cuenta === "CORRIENTE" ? "Corriente" : "Ahorros",
          balance: `$${parseFloat(matchingAccount.monto_actual || 0).toFixed(2)}`
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
    
    try {      // Intentar cargar las transacciones de la cuenta
      const response = await accountService.getAccountTransactions(accountId, {
        page,
        limit: 10
      });
      
      console.log("Transacciones cargadas:", response.status);
      console.log("DEBUGGING - Estructura completa de respuesta:", JSON.stringify(response.data, null, 2));
      console.log("DEBUGGING - Tipo de data:", typeof response.data);
      console.log("DEBUGGING - Es array:", Array.isArray(response.data));
      if (response.data && typeof response.data === 'object') {
        console.log("DEBUGGING - Keys de data:", Object.keys(response.data));
      }
      
      // Procesar los datos según la estructura de la respuesta
      let transactionData = [];
      let pagination = null;
      
      if (response.data) {
        // Verificar si la respuesta tiene estructura de paginación
        if (response.data.data && Array.isArray(response.data.data)) {
          transactionData = response.data.data;
          pagination = response.data.pagination;
        } 
        // Si la respuesta es un array directo
        else if (Array.isArray(response.data)) {
          transactionData = response.data;
        }        // Si la respuesta tiene movimientos específicos
        else if (response.data.movimientos && Array.isArray(response.data.movimientos)) {
          transactionData = response.data.movimientos;
        }
        // Si la respuesta es la cuenta completa y tiene movimientos
        else if (response.data.cuenta && response.data.cuenta.movimientos && Array.isArray(response.data.cuenta.movimientos)) {
          transactionData = response.data.cuenta.movimientos;
        }
        // Si es una sola transacción
        else if (response.data._id || response.data.monto || response.data.fecha) {
          transactionData = [response.data];
        }
        // Si hay otras estructuras posibles
        else if (typeof response.data === 'object' && !Array.isArray(response.data)) {
          // Buscar cualquier propiedad que contenga un array de transacciones
          const possibleArrays = Object.values(response.data).filter(value => Array.isArray(value));
          if (possibleArrays.length > 0) {
            transactionData = possibleArrays[0];
          }
        }
      }
        console.log(`Transacciones procesadas: ${transactionData.length}`);      
      // Procesar las transacciones para la UI
      const processedTransactions = processTransactions(transactionData);
      
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
      
      console.log(`Estado final: ${processedTransactions.length} transacciones, hasMore: ${hasMoreTransactions}`);
      
    } catch (error) {
      console.error("Error cargando transacciones:", error);
      console.error("Detalles del error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Intentar cargar de caché si es el primer load
      if (page === 1 && !shouldAppend) {
        try {
          const cached = await AsyncStorage.getItem(`transactions_${accountId}`);
          if (cached) {
            console.log("Cargando transacciones desde caché");
            const cachedTransactions = JSON.parse(cached);
            setTransactions(cachedTransactions);
            setError("Usando datos almacenados. Problema de conexión.");
            setLoading(false);
            return;
          }
        } catch (cacheError) {
          console.error("Error cargando desde caché:", cacheError);
        }
      }
      
      // Si es un error 404, significa que no hay transacciones
      if (error.response?.status === 404) {
        setTransactions([]);
        setError(null);
      } else {
        setError("Error al cargar transacciones. Verifica tu conexión.");
      }
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
    
    console.log("Procesando transacciones:", data.length);
    
    return data.map((transaction, index) => {
      // Verificar que la transacción tenga los campos necesarios
      if (!transaction || typeof transaction !== 'object') {
        console.warn(`Transacción ${index} inválida:`, transaction);
        return null;
      }
      
      // Campos posibles para el monto
      const monto = transaction.monto || transaction.amount || transaction.valor || 0;
      
      // Campos posibles para la fecha
      const fecha = transaction.fecha || transaction.date || transaction.fechaMovimiento || transaction.created_at;
      
      // Campos posibles para el ID
      const id = transaction._id || transaction.id || `temp-${Date.now()}-${index}`;
      
      // Si la transacción no tiene un tipo, intentamos determinarlo
      const tipo = transaction.tipo || transaction.type || determineTransactionType(transaction);
      
      // Determinar si es un ingreso o un egreso basado en el tipo y el monto
      let isIncome = false;
      if (tipo) {
        isIncome = ['DEPOSITO', 'TRANSFERENCIA_RECIBIDA', 'CREDITO', 'ABONO'].includes(tipo.toUpperCase());
      } else {
        // Si no hay tipo, usar el signo del monto
        isIncome = monto >= 0;
      }
      
      // Si el monto es negativo y no sabemos el tipo, es probablemente un débito
      if (monto < 0) {
        isIncome = false;
      }
        const processedTransaction = {
        id,
        name: getTransactionName(transaction, tipo),
        date: formatDate(fecha),
        amount: `${!isIncome ? "-" : ""}$${parseFloat(Math.abs(monto)).toFixed(2)}`,
        isIncome,
        type: tipo,
        originalData: transaction
      };
      
      console.log(`Transacción procesada ${index}:`, {
        id: processedTransaction.id,
        name: processedTransaction.name,
        amount: processedTransaction.amount,
        isIncome: processedTransaction.isIncome,
        tipo,
        monto
      });
      
      return processedTransaction;
    }).filter(Boolean); // Filtrar elementos nulos
  };
  // Función para determinar el tipo de transacción cuando no está especificado
  const determineTransactionType = (transaction) => {
    // Verificar campos específicos de la transacción
    const monto = transaction.monto || transaction.amount || transaction.valor || 0;
    
    // Si hay información de remitente/beneficiario
    if (transaction.remitente && transaction.beneficiario) {
      if (transaction.beneficiario === accountData?.id || transaction.cuenta_destino === accountData?.id) {
        return "TRANSFERENCIA_RECIBIDA";
      } else if (transaction.remitente === accountData?.id || transaction.cuenta_origen === accountData?.id) {
        return "TRANSFERENCIA_ENVIADA";
      }
    }
    
    // Si solo hay beneficiario y coincide con nuestra cuenta
    if (transaction.beneficiario === accountData?.id || transaction.cuenta_destino === accountData?.id) {
      return "DEPOSITO";
    }
    
    // Si solo hay remitente y coincide con nuestra cuenta  
    if (transaction.remitente === accountData?.id || transaction.cuenta_origen === accountData?.id) {
      return "RETIRO";
    }
    
    // Basado en el monto si no hay otra información
    if (monto > 0) {
      return "DEPOSITO";
    } else if (monto < 0) {
      return "RETIRO";
    }
    
    // Por defecto
    return "MOVIMIENTO";
  };

  const getTransactionName = (transaction, tipo) => {
    // Priorizar el concepto si existe
    if (transaction.concepto) return transaction.concepto;
    if (transaction.descripcion) return transaction.descripcion;
    if (transaction.description) return transaction.description;
    
    // Nombres basados en el tipo
    switch (tipo?.toUpperCase()) {
      case "DEPOSITO":
      case "CREDITO":
      case "ABONO":
        return "Depósito en cuenta";
      case "RETIRO":
      case "DEBITO":
      case "CARGO":
        return "Retiro/Pago";
      case "TRANSFERENCIA_RECIBIDA":
        return `Transferencia recibida${transaction.remitente_nombre ? ` de ${transaction.remitente_nombre}` : ""}`;
      case "TRANSFERENCIA_ENVIADA":
        return `Transferencia enviada${transaction.beneficiario_nombre ? ` a ${transaction.beneficiario_nombre}` : ""}`;
      case "PAGO":
        return "Pago realizado";
      case "COMPRA":
        return "Compra";
      case "COMISION":
        return "Comisión bancaria";
      default:
        return transaction.tipo || "Movimiento bancario";
    }
  };
  const formatDate = (dateString) => {
    if (!dateString) return "Fecha no disponible";
    
    try {
      // Intentar parsear la fecha con moment
      const momentDate = moment(dateString);
      
      // Verificar si la fecha es válida
      if (!momentDate.isValid()) {
        console.warn("Fecha inválida:", dateString);
        return "Fecha inválida";
      }
      
      return momentDate.format('DD MMM, YYYY');
    } catch (error) {
      console.error("Error formateando fecha:", error, dateString);
      return "Fecha no disponible";    }
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
      const status = error.response.status;
      const data = error.response.data;
      
      console.log("Error response:", { status, data });
      
      switch (status) {
        case 401:
          errorMessage = "Sesión expirada. Por favor inicia sesión nuevamente.";
          // Limpiar token y navegar al login
          AsyncStorage.removeItem("token").then(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          });
          break;
        case 403:
          errorMessage = "No tienes permisos para acceder a esta información.";
          break;
        case 404:
          errorMessage = action.includes("transacciones") ? 
            "No se encontraron transacciones para esta cuenta." : 
            `No se encontró la información solicitada.`;
          break;
        case 500:
          errorMessage = "Error del servidor. Intenta más tarde.";
          break;
        case 0:
        case -1:
          errorMessage = "Error de conexión. Verifica tu internet.";
          break;
        default:
          errorMessage = data?.message || `Error ${status}: ${data?.error || 'Error desconocido'}`;
      }
    } else if (error.message) {
      if (error.message.includes('Network')) {
        errorMessage = "Error de conexión. Verifica tu internet.";
      } else {
        errorMessage = error.message;
      }
    }
    
    setError(errorMessage);
    
    // Solo mostrar alert si no es error de autenticación
    if (!errorMessage.includes("Sesión expirada")) {
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