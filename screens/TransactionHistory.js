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
  }, [accountId]); const loadData = async () => {
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
        console.log("Cuenta encontrada:", matchingAccount._id); setAccountData({
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
  }; const loadTransactions = async (accountId, page = 1, shouldAppend = false) => {
    console.log(`Cargando transacciones para cuenta ${accountId}, página ${page}`);

    if (page === 1 && !shouldAppend) {
      setLoading(true);
      setError(null);
    }

    try {
      // Cargar las transacciones de la cuenta
      const response = await accountService.getAccountTransactions(accountId, {
        page,
        limit: 10
      });

      console.log("Transacciones cargadas:", response.status);
      console.log("DEBUGGING - Estructura completa de respuesta:", JSON.stringify(response.data, null, 2));

      // Obtener los datos de transacciones de la estructura de respuesta
      let transactionData = [];
      let pagination = null;

      if (response.data && response.data.data) {
        // Estructura con data y pagination
        transactionData = response.data.data;
        pagination = response.data.pagination;
      } else if (Array.isArray(response.data)) {
        // Array directo
        transactionData = response.data;
      } else if (response.data) {
        // Objeto con posibles arrays
        const possibleArrays = Object.values(response.data).filter(value => Array.isArray(value));
        if (possibleArrays.length > 0) {
          transactionData = possibleArrays[0];
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
      }

      // Determinar si hay más transacciones disponibles
      if (pagination) {
        setHasMoreTransactions(pagination.page < pagination.pages);
      } else {
        setHasMoreTransactions(transactionData.length >= 10);
      }

      console.log(`Estado final: ${processedTransactions.length} transacciones, hasMore: ${pagination ? pagination.page < pagination.pages : transactionData.length >= 10}`);

    } catch (error) {
      console.error("Error cargando transacciones:", error);

      // Si es un error 404, significa que no hay transacciones
      if (error.response?.status === 404 || error.message?.includes('404') || error.message?.includes('not found')) {
        setTransactions([]);
        setHasMoreTransactions(false);
        setError(null); // No mostrar error para "no hay transacciones"
      } else {
        setError(error.message || "Error cargando transacciones");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };// Función para procesar las transacciones y adaptarlas al formato de la UI
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

      // Campos del backend según la implementación
      const monto = transaction.monto_total || transaction.monto || transaction.amount || transaction.valor || 0;
      const fecha = transaction.fecha || transaction.date || transaction.fechaMovimiento || transaction.createdAt || transaction.created_at;
      const id = transaction._id || transaction.id || `temp-${Date.now()}-${index}`;
      const tipo = transaction.tipo || transaction.type || determineTransactionType(transaction);
      const descripcion = transaction.descripcion || transaction.description || transaction.concepto;

      // Determinar si es un ingreso o egreso basado en el campo 'tipo' del backend
      let isIncome = false;
      if (tipo === 'ENTRADA') {
        isIncome = true;
      } else if (tipo === 'SALIDA') {
        isIncome = false;
      } else {
        // Fallback basado en nombres de tipos comunes
        isIncome = ['DEPOSITO', 'TRANSFERENCIA_RECIBIDA', 'CREDITO', 'ABONO'].includes(tipo?.toUpperCase());
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
    // Priorizar la descripción del backend
    if (transaction.descripcion) return transaction.descripcion;
    if (transaction.concepto) return transaction.concepto;
    if (transaction.description) return transaction.description;

    // Para el sistema bancario, usar el número de transacción si está disponible
    if (transaction.numero_transaccion) {
      return `Transacción ${transaction.numero_transaccion}`;
    }

    // Nombres basados en el tipo del backend
    switch (tipo?.toUpperCase()) {
      case "ENTRADA":
        return "Depósito recibido";
      case "SALIDA":
        return "Pago realizado";
      case "DEPOSITO":
      case "CREDITO":
      case "ABONO":
        return "Depósito en cuenta";
      case "RETIRO":
      case "DEBITO":
      case "CARGO":
        return "Retiro/Pago";
      case "TRANSFERENCIA_RECIBIDA":
        return "Transferencia recibida";
      case "TRANSFERENCIA_ENVIADA":
        return "Transferencia enviada";
      case "TRANSFERENCIA":
        // Determinar dirección basada en las cuentas
        if (transaction.cuenta_destino === accountData?.id) {
          return "Transferencia recibida";
        } else if (transaction.cuenta_origen === accountData?.id) {
          return "Transferencia enviada";
        }
        return "Transferencia";
      case "PAGO":
        return "Pago realizado";
      case "COMPRA":
        return "Compra";
      case "COMISION":
        return "Comisión bancaria";
      default:
        return "Movimiento bancario";
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
      return "Fecha no disponible";
    }
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
          )}          <ScrollView
            style={styles.transactionsList}
            contentContainerStyle={styles.transactionsContent}
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
            showsVerticalScrollIndicator={false}          >
            {transactions.length > 0 && (
              <View style={styles.transactionsCard}>
                {transactions.map((transaction, index) => (
                  <View key={transaction.id}>
                    <View style={styles.transactionContent}>
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
                    </View>
                    {index < transactions.length - 1 && (
                      <View style={styles.transactionSeparator} />
                    )}
                  </View>
                ))}
              </View>
            )}

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

const styles = StyleSheet.create({  mainContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    marginBottom: 15,
  },  
  transactionsContainer: {
    flex: 1,
    paddingHorizontal: 8,
    marginTop: 20,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
    color: "#1C1B1F",
    paddingHorizontal: 16,
  },  transactionsList: {
    flex: 1,
  },  transactionsContent: {
    paddingHorizontal: 0,
    paddingBottom: 20,
  },errorContainer: {
    backgroundColor: "#FFEBEE",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
  },
  emptyText: {
    color: "#83898F",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
  },  transactionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  transactionSeparator: {
    height: 1,
    backgroundColor: "#E8E8E8",
    marginHorizontal: 20,
  },
  transactionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  },  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1B1F",
    marginBottom: 6,
  },
  transactionDate: {
    fontSize: 14,
    color: "#83898F",
    fontWeight: "400",
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: "700",
  },  incomeText: {
    color: "#00C853",
  },
  expenseText: {
    color: "#FF5252",
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