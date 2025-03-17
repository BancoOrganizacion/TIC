import React from "react";
import { 
  SafeAreaView, 
  View, 
  ScrollView, 
  Text, 
  Image, 
  StyleSheet,
  TouchableOpacity 
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import BottomNavBar from "../components/BottomNavBar";

const ProfileScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Perfil</Text>
        </View>
        
        {/* Profile Image */}
        <View style={styles.profileImageContainer}>
          <Image
            source={{uri: "https://storage.googleapis.com/tagjs-prod.appspot.com/EdAcYWzYdN/dggsx94n.png"}}
            style={styles.profileImage}
            resizeMode="stretch"
          />
        </View>
        
        {/* User Name */}
        <View style={styles.nameContainer}>
          <Text style={styles.nameText}>Ana Campoverde</Text>
        </View>
        
        {/* Personal Info Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Personal Info</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate("UserProfile")}
          >
            <Image
              source={{uri: "https://storage.googleapis.com/tagjs-prod.appspot.com/EdAcYWzYdN/5k8uftb4.png"}}
              style={styles.menuIcon}
              resizeMode="stretch"
            />
            <Text style={styles.menuText}>Tu perfil</Text>
          </TouchableOpacity>
          
          <View style={styles.separator} />
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate("TransactionHistory")}
          >
            <Image
              source={{uri: "https://storage.googleapis.com/tagjs-prod.appspot.com/EdAcYWzYdN/8zne9x1w.png"}}
              style={styles.menuIcon}
              resizeMode="stretch"
            />
            <Text style={styles.menuText}>Historial de transacciones</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.fullSeparator} />
        
        {/* Security Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate("BiometricPatterns")}
          >
            <Image
              source={{uri: "https://storage.googleapis.com/tagjs-prod.appspot.com/EdAcYWzYdN/eff5jcnz.png"}}
              style={styles.menuIcon}
              resizeMode="stretch"
            />
            <Text style={styles.menuText}>Patrones</Text>
          </TouchableOpacity>
          
          <View style={styles.separator} />

          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate("RestrictionsList")}
          >
            <Image
              source={{uri: "https://cdn-icons-png.flaticon.com/512/3064/3064155.png"}}
              style={styles.menuIcon}
              resizeMode="stretch"
            />
            <Text style={styles.menuText}>Restricciones</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.fullSeparator} />
        
        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => {
            // Lógica para cerrar sesión
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }}
        >
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
        
        {/* Space for BottomNavBar */}
        <View style={styles.bottomNavSpacer} />
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
  header: {
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1B1F",
  },
  profileImageContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  nameContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  nameText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1C1B1F",
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#83898F",
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  menuIcon: {
    width: 24,
    height: 24,
    marginRight: 15,
  },
  menuText: {
    fontSize: 16,
    color: "#1C1B1F",
  },
  separator: {
    height: 1,
    backgroundColor: "#F2F2F5",
    marginVertical: 8,
  },
  fullSeparator: {
    height: 1,
    backgroundColor: "#F2F2F5",
    marginVertical: 15,
    marginHorizontal: 20,
  },
  logoutButton: {
    alignItems: "center",
    padding: 15,
    marginHorizontal: 20,
    marginTop: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#5C2684",
  },
  bottomNavSpacer: {
    height: 80,
  },
});

export default ProfileScreen;