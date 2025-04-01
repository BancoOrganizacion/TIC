import React, { useState, useEffect } from "react";
import { 
  SafeAreaView, 
  View, 
  ScrollView, 
  Text, 
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert 
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import BottomNavBar from "../components/BottomNavBar";
import BackButton from "../components/BackButton";
import { userService } from "../services/api";

const UserProfile = () => {
  const navigation = useNavigation();
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await userService.getUserProfile();
      setUserProfile(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      Alert.alert("Error", "No se pudo cargar el perfil del usuario");
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>No se pudo cargar el perfil</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Perfil</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate("EditProfile", { userProfile })}
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
            <Text style={styles.fieldLabel}>Nombre Completo</Text>
            <Text style={styles.fieldValue}>{`${userProfile.nombre} ${userProfile.apellido}`}</Text>
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Correo</Text>
            <Text style={styles.fieldValue}>{userProfile.email}</Text>
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Cédula</Text>
            <Text style={styles.fieldValue}>{userProfile.cedula}</Text>
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Número de Teléfono</Text>
            <Text style={styles.fieldValue}>
              {userProfile.telefono ? 
                (userProfile.telefono.startsWith('0') ? userProfile.telefono : `0${userProfile.telefono}`) : 
                'No registrado'
              }
            </Text>
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
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
    color: '#333',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
    color: 'red',
  },

});

export default UserProfile;