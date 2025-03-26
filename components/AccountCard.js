import React, { useState } from "react";
import { View, Text, Image, ImageBackground, StyleSheet, TouchableOpacity } from "react-native";

const AccountCard = ({ accountNumber, accountName, accountType, balance }) => {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  const toggleBalanceVisibility = () => {
    setIsBalanceVisible(!isBalanceVisible);
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
        </Text>
        <Image
          source={require("../assets/images/chevron-right.png")}
          resizeMode={"stretch"}
          style={styles.image4}
        />
      </View>
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
  },
  image4: {
    width: 15,
    height: 23,
  },
  image2: {
    width: 18,
    height: 4,
  },
});

export default AccountCard;