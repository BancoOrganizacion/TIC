import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import BottomNavBar from "../components/BottomNavBar";
import Greeting from "../components/Greeting";
import AccountCard from "../components/AccountCard"; 
import AsyncStorage from '@react-native-async-storage/async-storage';
const AccountDashboard = () => {
  const navigation = useNavigation();
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    // Load user profile data from AsyncStorage only
    const loadUserProfile = async () => {
      try {
        const storedProfile = await AsyncStorage.getItem('userProfile');
        if (storedProfile) {
          const profileData = JSON.parse(storedProfile);
          setUserProfile(profileData);
        }
      } catch (error) {
        console.error("Error loading stored profile:", error);
      }
    };

    loadUserProfile();
  }, []);

  // Save user profile data when login is successful
  // This function should be called after successful login
  const saveUserProfileAfterLogin = async (userData) => {
    try {
      await AsyncStorage.setItem('userProfile', JSON.stringify(userData));
      if (userData.nombre) {
        await AsyncStorage.setItem('nombreReal', userData.nombre);
      }
    } catch (error) {
      console.error("Error saving user profile:", error);
    }
  };

  const handleRestrictionsPress = () => {
    navigation.navigate("RestrictionsList");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Greeting style={styles.greeting} />

          <View style={styles.cardsContainer}>
            <AccountCard
              accountNumber="12345678"
              accountName={userProfile ? `${userProfile.nombre || ''} ${userProfile.apellido || ''}` : "Ana Campoverde"}
              accountType="Principal"
              balance="$210,43"
              style={styles.card}
            />

            <AccountCard
              accountNumber="87654321"
              accountName="Carlos Pérez"
              accountType="Secundaria"
              balance="$150,00"
              style={styles.card}
            />
          </View>

          <TouchableOpacity 
            style={styles.restrictionButton} 
            onPress={handleRestrictionsPress}
          >
            <Image
              source={{
                uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/5b009de9-4d8a-4fd7-8f75-69efdd4f6190",
              }}
              style={styles.restrictionIcon}
            />
            <Text style={styles.restrictionText}>
              Registrar restricciones
            </Text>
          </TouchableOpacity>
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
  },
  content: {
    flex: 1,
    paddingHorizontal: 5,
    paddingTop: 40,
  },
  greeting: {
    marginBottom: 24,
  },
  cardsContainer: {
    marginBottom: 24,
  },
  card: {
    marginBottom: 16,
  },
  restrictionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#5C2684",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 80,
    height: 60,
  },
  restrictionIcon: {
    width: 17,
    height: 22,
    marginRight: 12,
  },
  restrictionText: {
    color: "#1C1B1F",
    fontSize: 14,
    flex: 1,
  },
});

export default AccountDashboard;