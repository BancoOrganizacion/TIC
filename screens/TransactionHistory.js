// TransactionHistory.js
import React from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import BottomNavBar from "../components/BottomNavBar";
import Greeting from "../components/Greeting";
import BackButton from "../components/BackButton";
import AccountCard from "../components/AccountCard"; // Importamos el componente AccountCard

const TransactionHistory = () => {
  const navigation = useNavigation();

  // Datos de ejemplo para la cuenta
  const accountData = {
    accountNumber: "12345678",
    accountName: "Ana Campoverde",
    accountType: "Principal",
    balance: "$210,43",
  };

  // Datos de ejemplo para las transacciones
  const transactions = [
    {
      id: 1,
      name: "Supermercado XYZ",
      date: "2025.03.11",
      amount: "-$45,30",
      isIncome: false,
    },
    {
      id: 2,
      name: "Transferencia de Carlos",
      date: "2025.03.10",
      amount: "+$120,00",
      isIncome: true,
    },
    {
      id: 3,
      name: "Pago de Luz",
      date: "2025.03.09",
      amount: "-$22,15",
      isIncome: false,
    },
    {
      id: 4,
      name: "Depósito Nómina",
      date: "2025.03.01",
      amount: "+$850,00",
      isIncome: true,
    },
    {
      id: 5,
      name: "Pago de Internet",
      date: "2025.02.28",
      amount: "-$35,99",
      isIncome: false,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Saludo "Hi, Ana!" con la fecha de hoy */}
        <Greeting name="Ana" />

        {/* Título "Movimientos" con BackButton a la izquierda */}
        <View style={styles.titleContainer}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.titleText}>Movimientos</Text>
        </View>

        {/* Utilizamos el componente AccountCard en lugar de la implementación anterior */}
        <AccountCard
          accountNumber={accountData.accountNumber}
          accountName={accountData.accountName}
          accountType={accountData.accountType}
          balance={accountData.balance}
          style={styles.accountCard}
        />

        {/* Lista de transacciones */}
        <View style={styles.transactionsContainer}>
          <Text style={styles.transactionsTitle}>
            Historial de Transacciones
          </Text>

          {transactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionName}>{transaction.name}</Text>
                <Text style={styles.transactionDate}>{transaction.date}</Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  { color: transaction.isIncome ? "#2E7D32" : "#C62828" },
                ]}
              >
                {transaction.amount}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

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