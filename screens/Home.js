import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  Image,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import BottomNavBar from "../components/BottomNavBar";
import Greeting from "../components/Greeting";
import AccountCard from "../components/AccountCard"; 
import { userService } from "../services/api";
import AsyncStorage from '@react-native-async-storage/async-storage';

const AccountDashboard = () => {
  const navigation = useNavigation();
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState(null);

  const handleRestrictionsPress = () => {
    navigation.navigate("RestrictionsList");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Greeting name="Ana" style={styles.greeting} />

          <View style={styles.cardsContainer}>
            <AccountCard
              accountNumber="12345678"
              accountName="Ana Campoverde"
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