import React, { useState, useEffect } from "react";
import { View, Image, Text, StyleSheet } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const Greeting = ({ style }) => {
  const [name, setName] = useState("");

  const getCurrentDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  const loadUserName = async () => {
    try {
      const storedProfile = await AsyncStorage.getItem('userProfile');
      if (storedProfile) {
        try {
          const profileData = JSON.parse(storedProfile);
          if (profileData && profileData.nombre) {
            setName(profileData.nombre);
            return;
          }
        } catch (err) {
          console.error('Error parsing stored profile:', err);
        }
      }

      const nombreReal = await AsyncStorage.getItem('nombreReal');
      if (nombreReal) {
        setName(nombreReal);
        return;
      }

      setName("Usuario");
    } catch (error) {
      console.error('Error loading user name:', error);
      setName("Usuario");
    }
  };

  useEffect(() => {
    loadUserName();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadUserName();
      return () => { };
    }, [])
  );
  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../assets/images/user.png')}
        style={styles.image}
      />
      <View style={styles.textContainer}>
        <Text style={styles.dateText}>{getCurrentDate()}</Text>
        <Text style={styles.greetingText}>Hi, {name || "Usuario"}!</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 24,
  },
  image: {
    width: 36,
    height: 36,
    marginRight: 12,
    borderRadius: 18,
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
    fontSize: 18,
    fontWeight: "600",
  },
});

export default Greeting;