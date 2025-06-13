import React, { useState } from "react";
import { View, Text, Image, ImageBackground, StyleSheet, TouchableOpacity, Modal, Alert } from "react-native";

const AccountCard = ({ accountNumber, accountName, accountType, balance, onDeleteAccount }) => {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const toggleBalanceVisibility = () => {
    setIsBalanceVisible(!isBalanceVisible);
  };

  const handleActionsPress = () => {
    setShowActionsModal(true);
  };
  const handleDeleteAccount = () => {
    setShowActionsModal(false);
    
    // Verificar si el saldo es mayor a 0
    if (!isBalanceEmpty()) {
      Alert.alert(
        "Error",
        "No puedes eliminar una cuenta que tiene saldo. Transfiere o retira todo el dinero antes de eliminar la cuenta.",
        [
          {
            text: "Entendido",
            style: "default"
          }
        ]
      );
      return;
    }

    Alert.alert(
      "Eliminar cuenta",
      "¿Estás seguro de que deseas eliminar esta cuenta? Esta acción no se puede deshacer.",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            if (onDeleteAccount) {
              onDeleteAccount(accountNumber);
            }
          }
        }
      ]
    );
  };

  // Función para verificar si el saldo está vacío o es 0
  const isBalanceEmpty = () => {
    const cleanBalance = balance?.replace(/[^\d.-]/g, '') || '0';
    return parseFloat(cleanBalance) === 0;
  };
  return (
    <ImageBackground
      source={require("../assets/images/card.png")}
      resizeMode={"stretch"}
      style={styles.card}
    >
      {/* Número de cuenta */}
      <View style={styles.row2}>
        <Text style={styles.text3}>{"N°"}</Text>
        <Text style={styles.text4}>{accountNumber}</Text>
        <View style={styles.box}></View>
        <TouchableOpacity onPress={handleActionsPress}>
          <Image
            source={require("../assets/images/actions_accounts.png")}
            resizeMode={"contain"}
            style={styles.actionsIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Nombre del titular */}
      <Text style={styles.text5}>{accountName}</Text>

      {/* Tipo de cuenta */}
      <View style={styles.row3}>
        <Text style={styles.text6}>{accountType}</Text>
        
        <TouchableOpacity onPress={toggleBalanceVisibility}>
          <Image
            source={
              isBalanceVisible 
                ? require("../assets/images/eye-visible.png")
                : require("../assets/images/eye-hidden.png")
            }
            resizeMode={"stretch"}
            style={styles.image3}
          />
        </TouchableOpacity>
      </View>

      {/* Saldo */}
      <View style={styles.row4}>
        <Text style={styles.text7}>
          {isBalanceVisible ? balance : '•••••••'}
        </Text>        <Image
          source={require("../assets/images/chevron-right.png")}
          resizeMode={"stretch"}
          style={styles.image4}
        />
      </View>

      {/* Modal de acciones */}
      <Modal
        visible={showActionsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowActionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Acciones de cuenta</Text>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleDeleteAccount}
            >
              <Image
                source={require("../assets/images/delete.png")}
                style={styles.actionIcon}
                resizeMode="contain"
              />
              <Text style={styles.actionText}>Eliminar cuenta</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowActionsModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  card: {
    height: 200,
    padding: 18,
    marginBottom: 20,
    marginHorizontal: 26,
  },
  row2: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  box: {
    flex: 1,
  },
  text3: {
    color: "#23303B",
    fontSize: 15,
    marginRight: 8,
  },
  text4: {
    color: "#23303B",
    fontSize: 15,
  },
  text5: {
    color: "#23303B",
    fontSize: 13,
    marginBottom: 63,
  },
  row3: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 11,
  },
  text6: {
    color: "#23303B",
    fontSize: 13,
    marginRight: 10,
  },
  image3: {
    width: 14,
    height: 14,
  },
  row4: {
    flexDirection: "row",
    alignItems: "center",
  },
  text7: {
    color: "#23303B",
    fontSize: 25,
    marginRight: 4,
    flex: 1,
  },  image4: {
    width: 15,
    height: 23,
  },
  image2: {
    width: 18,
    height: 4,
  },
  actionsIcon: {
    width: 20,
    height: 20,
    tintColor: "#23303B",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "80%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1C1B1F",
    marginBottom: 20,
    textAlign: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  actionIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    tintColor: "#D32F2F",
  },
  actionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#D32F2F",
  },
  cancelButton: {
    alignItems: "center",
    padding: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#5C2684",
  },
});

export default AccountCard;