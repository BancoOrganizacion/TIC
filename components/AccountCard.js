import React from "react";
import { View, Text, Image, ImageBackground, StyleSheet } from "react-native";

const AccountCard = ({ accountNumber, accountName, accountType, balance }) => {
  return (
    <ImageBackground
      source={{
        uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/54dc6117-abfb-460e-b129-836050f7cc5f",
      }}
      resizeMode={"stretch"}
      style={styles.card}
    >
      {/* Número de cuenta */}
      <View style={styles.row2}>
        <Text style={styles.text3}>{"N°"}</Text>
        <Text style={styles.text4}>{accountNumber}</Text>
        <View style={styles.box}></View>
        <Image
          source={{
            uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/5f0cfb00-e23a-4ed1-b7bb-20246acd2470",
          }}
          resizeMode={"stretch"}
          style={styles.image2}
        />
      </View>

      {/* Nombre del titular */}
      <Text style={styles.text5}>{accountName}</Text>

      {/* Tipo de cuenta */}
      <View style={styles.row3}>
        <Text style={styles.text6}>{accountType}</Text>
        <Image
          source={{
            uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/d2d29080-95fe-4f1c-980e-1dc112bdbfa4",
          }}
          resizeMode={"stretch"}
          style={styles.image3}
        />
      </View>

      {/* Saldo */}
      <View style={styles.row4}>
        <Text style={styles.text7}>{balance}</Text>
        <Image
          source={{
            uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/7d485700-f659-44cf-beda-fbe52f82305f",
          }}
          resizeMode={"stretch"}
          style={styles.image4}
        />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  card: {
    height: 179,
    padding: 18,
    marginBottom: 20,
    marginHorizontal: 45,
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
    fontSize: 9,
    marginRight: 17,
  },
  text4: {
    color: "#23303B",
    fontSize: 10,
  },
  text5: {
    color: "#23303B",
    fontSize: 9,
    marginBottom: 63,
  },
  row3: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 11,
  },
  text6: {
    color: "#23303B",
    fontSize: 9,
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
    fontSize: 28,
    marginRight: 4,
    flex: 1,
  },
  image4: {
    width: 6,
    height: 11,
  },
  image2: {
    width: 18,
    height: 4,
  },
});

export default AccountCard;