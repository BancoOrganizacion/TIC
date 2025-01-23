// Greeting.js
import React from "react";
import { View, Image, Text, StyleSheet } from "react-native";

const Greeting = ({ name }) => {
  const getCurrentDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  return (
    <View style={styles.row}>
      <Image
        source={{
          uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/e8ba1347-b50c-4c6f-aeb8-655ea0c40b5a",
        }}
        resizeMode={"stretch"}
        style={styles.image}
      />
      <View style={styles.column}>
        <Text style={styles.dateText}>{getCurrentDate()}</Text>
        <Text style={styles.greetingText}>Hi, {name}!</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    marginLeft: 15,
  },
  image: {
    width: 24,
    height: 24,
    marginRight: 16,
  },
  column: {
    flexDirection: "column",
  },
  dateText: {
    color: "#737373",
    fontSize: 11,
    marginBottom: 4,
  },
  greetingText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Greeting;