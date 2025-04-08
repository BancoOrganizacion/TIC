import React, { useState, useEffect } from "react";
import { View, Image, Text, StyleSheet } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';


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
    const loadUserName = async () => {
      try {
        // First attempt: Try to get the real name directly from AsyncStorage
        const nombreReal = await AsyncStorage.getItem('nombreReal');
        if (nombreReal) {
          setName(nombreReal);
          return;
        }
        
        // Second attempt: Try to get user profile from AsyncStorage
        const storedProfile = await AsyncStorage.getItem('userProfile');
        if (storedProfile) {
          try {
            const profileData = JSON.parse(storedProfile);
            if (profileData && profileData.nombre) {
              // Use the real name from user profile
              setName(profileData.nombre);
              // Save for future quick access
              await AsyncStorage.setItem('nombreReal', profileData.nombre);
              return;
            }
          } catch (err) {
            console.error('Error parsing stored profile:', err);
          }
        }
        
        // Use a default name if no data is found
        setName("User");
      } catch (error) {
        console.error('Error loading user name:', error);
        setName("User");
      }
    };
    
    loadUserName();
  }, []);
  
  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../assets/images/user.png')}
        style={styles.image}
      />
      <View style={styles.textContainer}>
        <Text style={styles.dateText}>{getCurrentDate()}</Text>
        <Text style={styles.greetingText}>Hi, {name}!</Text>
      </View>
    </View>
  );
};

export default Greeting; 

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
