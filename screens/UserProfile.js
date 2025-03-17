import React from "react";
import { 
  SafeAreaView, 
  View, 
  ScrollView, 
  Text, 
  StyleSheet,
  TouchableOpacity,
  Image 
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import BottomNavBar from "../components/BottomNavBar";
import BackButton from "../components/BackButton";

const UserProfile = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Perfil</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <Image
              source={{uri: "https://cdn-icons-png.flaticon.com/512/1160/1160758.png"}}
              style={styles.editIcon}
              tintColor="#000000"
              resizeMode="stretch"
            />
          </TouchableOpacity>
        </View>
        
        {/* Profile Icon */}
        <View style={styles.profileIconContainer}>
          <Image
            source={{uri: "https://cdn-icons-png.flaticon.com/512/1144/1144760.png"}}
            style={styles.profileIcon}
            resizeMode="stretch"
          />
        </View>
        
        {/* Profile Info Fields */}
        <View style={styles.formContainer}>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Nombre</Text>
            <Text style={styles.fieldValue}>Ana Campoverde</Text>
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Correo</Text>
            <Text style={styles.fieldValue}>ana@gmail.com</Text>
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Cédula</Text>
            <Text style={styles.fieldValue}>17235689875</Text>
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <Text style={styles.fieldValue}>+593 9999999999</Text>
          </View>
        </View>
        
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  editIcon: {
    width: 20,
    height: 20,
  },
  profileIconContainer: {
    alignItems: "center",
    marginVertical: 30,
  },
  profileIcon: {
    width: 80,
    height: 80,
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 14,
    color: "#83898F",
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1C1B1F",
  },
  bottomNavSpacer: {
    height: 80,
  },
});

export default UserProfile;