import React from "react";
import { View, Text, StyleSheet } from "react-native";
import BackButton from "./BackButton";

/**
 * 
 * @param {Object} props 
 * @param {string} props.title 
 * @param {Function} props.onBackPress 
 * @param {boolean} props.showBack 
 * @param {React.ReactNode} props.headerRight 
 * @param {Object} props.style 
 * @param {Object} props.titleStyle -
 */
const Header = ({
  title,
  onBackPress,
  showBack = true,
  headerRight,
  style,
  titleStyle
}) => {
  return (
    <View style={[styles.container, style]}>
      {showBack ? (
        <View style={styles.backButtonContainer}>
          <BackButton onPress={onBackPress} />
        </View>
      ) : (
        <View style={styles.placeholderLeft} />
      )}

      <Text style={[styles.title, titleStyle]}>{title}</Text>

      {headerRight ? (
        <View style={styles.rightContainer}>
          {headerRight}
        </View>
      ) : (
        <View style={styles.placeholderRight} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  backButtonContainer: {
    width: 50,
    alignItems: "flex-start",
  },
  placeholderLeft: {
    width: 50,
  },
  placeholderRight: {
    width: 50,
  },
  rightContainer: {
    width: 50,
    alignItems: "flex-end",
  },
  title: {
    flex: 1,
    color: "#1C1B1F",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default Header;