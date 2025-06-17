import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
    RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AppLayout } from "../components";
import { accountService } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AccountSelector = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [totalBalance, setTotalBalance] = useState(0);
    const [userName, setUserName] = useState("Usuario");
    const [error, setError] = useState(null);

    useEffect(() => {
        loadUserInfo();
        loadAccounts();
    }, []);

    const loadUserInfo = async () => {
        try {
            const userProfileString = await AsyncStorage.getItem("userProfile");
            if (userProfileString) {
                const userProfile = JSON.parse(userProfileString);
                setUserName(userProfile.nombre || "Usuario");
            } else {
                const nombreReal = await AsyncStorage.getItem("nombreReal");
                if (nombreReal) {
                    setUserName(nombreReal);
                }
            }
        } catch (error) {
            console.error("Error cargando información del usuario:", error);
        }
    };

    const loadAccounts = async () => {
        try {
            setError(null);
            const response = await accountService.getMyAccounts();

            if (response.data && response.data.length > 0) {
                const processedAccounts = response.data.map(account => ({
                    id: account._id,
                    accountNumber: account.numero_cuenta || "Sin número",
                    accountType: account.tipo_cuenta === "CORRIENTE" ? "Corriente" : "Ahorros",
                    balance: parseFloat(account.monto_actual || 0),
                    formattedBalance: `$${parseFloat(account.monto_actual || 0).toLocaleString('es-CO', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}`,
                    rawData: account
                }));

                setAccounts(processedAccounts);

                // Calcular el saldo total
                const total = processedAccounts.reduce((sum, account) => sum + account.balance, 0);
                setTotalBalance(total);

            } else {
                setAccounts([]);
                setTotalBalance(0);
                setError("No tienes cuentas registradas");
            }
        } catch (error) {
            console.error("Error cargando cuentas:", error);
            handleApiError(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleApiError = (error) => {
        setLoading(false);
        setRefreshing(false);

        let errorMessage = "No se pudieron cargar las cuentas";

        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;

            switch (status) {
                case 401:
                    errorMessage = "Sesión expirada. Por favor inicia sesión nuevamente.";
                    AsyncStorage.removeItem("token").then(() => {
                        navigation.reset({
                            index: 0,
                            routes: [{ name: "Login" }],
                        });
                    });
                    return;
                case 403:
                    errorMessage = "No tienes permisos para acceder a esta información.";
                    break;
                case 404:
                    errorMessage = "No se encontraron cuentas registradas.";
                    break;
                case 500:
                    errorMessage = "Error del servidor. Intenta más tarde.";
                    break;
                default:
                    errorMessage = data?.message || `Error ${status}`;
            }
        } else if (error.message) {
            if (error.message.includes('Network')) {
                errorMessage = "Error de conexión. Verifica tu internet.";
            } else {
                errorMessage = error.message;
            }
        }

        setError(errorMessage);

        if (!errorMessage.includes("Sesión expirada")) {
            Alert.alert("Error", errorMessage);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadAccounts();
    };

    const handleAccountPress = (account) => {
        navigation.navigate("TransactionHistory", {
            accountId: account.id,
            accountData: {
                id: account.id,
                accountNumber: account.accountNumber,
                accountName: "Cuenta Principal",
                accountType: account.accountType,
                balance: account.formattedBalance
            }
        });
    };

    const handleBackPress = () => {
        navigation.goBack();
    };

    const getAccountTypeIcon = (accountType) => {
        return accountType === "Corriente" ? "💳" : "💰";
    };

    if (loading) {
        return (
            <AppLayout
                title="Seleccionar Cuenta"
                onBackPress={handleBackPress}
                showGreeting={false}
            >
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0045B5" />
                    <Text style={styles.loadingText}>Cargando cuentas...</Text>
                </View>
            </AppLayout>
        );
    }

    return (
        <AppLayout
            title="Seleccionar Cuenta"
            onBackPress={handleBackPress}
            showGreeting={false}
        >
            <ScrollView
                style={styles.container}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Saludo personalizado */}
                <View style={styles.greetingContainer}>
                    <Text style={styles.greetingText}>Hola, {userName}</Text>
                    <Text style={styles.subtitleText}>Selecciona una cuenta para ver sus movimientos</Text>
                </View>

                {/* Mensaje de error */}
                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {/* Lista de cuentas */}
                {!error && accounts.length > 0 && (
                    <View style={styles.accountsContainer}>
                        {accounts.map((account) => (
                            <TouchableOpacity
                                key={account.id}
                                style={styles.accountCard}
                                onPress={() => handleAccountPress(account)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.accountHeader}>
                                    <View style={styles.accountTypeContainer}>
                                        <Text style={styles.accountTypeIcon}>
                                            {getAccountTypeIcon(account.accountType)}
                                        </Text>
                                        <Text style={styles.accountType}>{account.accountType}</Text>
                                    </View>
                                    <Text style={styles.chevronIcon}>›</Text>
                                </View>

                                <View style={styles.accountInfo}>
                                    <Text style={styles.accountNumber}>
                                        **** **** **** {account.accountNumber.slice(-4)}
                                    </Text>
                                    <Text style={styles.accountBalance}>{account.formattedBalance}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Resumen total */}
                {!error && accounts.length > 1 && (
                    <View style={styles.totalContainer}>
                        <View style={styles.totalCard}>
                            <Text style={styles.totalLabel}>Saldo Total</Text>
                            <Text style={styles.totalAmount}>
                                ${totalBalance.toLocaleString('es-CO', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </Text>
                            <Text style={styles.totalSubtext}>
                                {accounts.length} cuenta{accounts.length > 1 ? 's' : ''} registrada{accounts.length > 1 ? 's' : ''}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Estado vacío */}
                {!error && accounts.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>🏦</Text>
                        <Text style={styles.emptyTitle}>No hay cuentas registradas</Text>
                        <Text style={styles.emptySubtext}>
                            Contacta con el banco para registrar una cuenta
                        </Text>
                    </View>
                )}
            </ScrollView>
        </AppLayout>
    );
};

const styles = StyleSheet.create({
    container: {
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
    greetingContainer: {
        marginBottom: 24,
    },
    greetingText: {
        fontSize: 24,
        fontWeight: "700",
        color: "#1C1B1F",
        marginBottom: 4,
    },
    subtitleText: {
        fontSize: 16,
        color: "#737373",
    },
    errorContainer: {
        backgroundColor: "#FFEBEE",
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    errorText: {
        color: "#D32F2F",
        fontSize: 14,
        textAlign: "center",
    },
    accountsContainer: {
        marginBottom: 24,
    },
    accountCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: "#6B46C1",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    accountHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    accountTypeContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    accountTypeIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    accountType: {
        fontSize: 16,
        fontWeight: "600",
        color: "#6B46C1",
    },
    chevronIcon: {
        fontSize: 24,
        color: "#6B46C1",
        fontWeight: "bold",
    },
    accountInfo: {
        alignItems: "flex-start",
    },
    accountNumber: {
        fontSize: 14,
        color: "#737373",
        marginBottom: 8,
        fontFamily: "monospace",
    },
    accountBalance: {
        fontSize: 28,
        fontWeight: "700",
        color: "#1C1B1F",
    },
    totalContainer: {
        marginBottom: 24,
    },
    totalCard: {
        backgroundColor: "#F8F9FF",
        borderRadius: 16,
        padding: 24,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    totalLabel: {
        fontSize: 16,
        color: "#737373",
        marginBottom: 8,
    },
    totalAmount: {
        fontSize: 32,
        fontWeight: "700",
        color: "#6B46C1",
        marginBottom: 4,
    },
    totalSubtext: {
        fontSize: 14,
        color: "#737373",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "600",
        color: "#1C1B1F",
        marginBottom: 8,
        textAlign: "center",
    },
    emptySubtext: {
        fontSize: 16,
        color: "#737373",
        textAlign: "center",
        lineHeight: 24,
    },
});

export default AccountSelector;
