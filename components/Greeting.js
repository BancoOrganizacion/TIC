import React, { useState, useEffect } from "react";
import { View, Image, Text, StyleSheet } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userService } from "../services/api"; // Adjust the import path as needed

const Greeting = ({ style }) => {
  const [name, setName] = useState("");

  const getCurrentDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        // First, try to get the username from AsyncStorage
        const storedUsername = await AsyncStorage.getItem('savedUsername');
        
        if (storedUsername) {
          setName(storedUsername);
        }

        // Then try to fetch user details from the API
        const response = await userService.getUserProfile();
        if (response.data && response.data.nombre) {
          setName(response.data.nombre);
        }
      } catch (error) {
        console.error('Error fetching user name:', error);
        // If fetching fails, fall back to stored username
      }
    };

    fetchUserName();
  }, []);

  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../assets/images/user.png')} // Local image path
        style={styles.image}
      />
      <View style={styles.textContainer}>
        <Text style={styles.dateText}>{getCurrentDate()}</Text>
        <Text style={styles.greetingText}>Hi, {name || 'User'}!</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  image: {
    width: 24,
    height: 24,
    marginRight: 12,
    borderRadius: 12, // Optional: if you want a circular image
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  dateText: {
    color: "#737373",
    fontSize: 12,
    marginBottom: 4,
  },
  greetingText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Greeting;