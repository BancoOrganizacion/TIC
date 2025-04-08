import React, { useState, useEffect } from "react";
import { 
  SafeAreaView, 
  View, 
  ScrollView, 
  Text, 
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import BottomNavBar from "../components/BottomNavBar";
import BackButton from "../components/BackButton";
import { userService } from "../services/api";
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserProfile = () => {
  const navigation = useNavigation();
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('');

  useEffect(() => {
    fetchUserProfile();
    fetchUsername();
  }, []);

  const fetchUsername = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem('nombre_usuario');
      if (storedUsername) {
        setUsername(storedUsername);
      }
    } catch (error) {
      console.error("Error fetching user name:", error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      
      // Cargar desde AsyncStorage primero
      const [storedProfile, storedUsername] = await Promise.all([
        AsyncStorage.getItem('userProfile'),
        AsyncStorage.getItem('nombre_usuario')
      ]);

      if (storedProfile) {
        setUserProfile(JSON.parse(storedProfile));
      }
      if (storedUsername) {
        setUsername(storedUsername);
      }

      // Actualizar desde la API
      const response = await userService.getUserProfile();
      if (response?.data) {
        const fullProfile = {
          ...response.data,
          nombre_usuario: response.data.nombre_usuario || storedUsername || ""
        };
        
        setUserProfile(fullProfile);
        setUsername(fullProfile.nombre_usuario);
        
        // Guardar datos actualizados
        await AsyncStorage.setItem('userProfile', JSON.stringify(fullProfile));
        if (fullProfile.nombre_usuario) {
          await AsyncStorage.setItem('nombre_usuario', fullProfile.nombre_usuario);
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      if (!userProfile) {
        Alert.alert("Error", "No se pudo cargar el perfil del usuario");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="small" color="#000000" />
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
            onPress={() => navigation.navigate("EditProfile", { 
              userProfile: {
                ...userProfile,
                nombre_usuario: username
              }
            })}
          >
            <Image
               source={require("../assets/images/edit.png")}
              style={styles.editIcon}
              tintColor="#000000"
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
        
        {/* Profile Icon */}
        <View style={styles.profileIconContainer}>
          <Image
           source={require("../assets/images/user.png")}
            style={styles.profileIcon}
            resizeMode="contain"
          />
        </View>
        
        {/* Profile Info Fields */}
        <View style={styles.formContainer}>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Nombre de Usuario</Text>
            <Text style={styles.fieldValue}>{username || 'No disponible'}</Text>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Nombre Completo</Text>
            <Text style={styles.fieldValue}>
              {userProfile.nombre || ''} {userProfile.apellido || ''}
            </Text>
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Correo</Text>
            <Text style={styles.fieldValue}>{userProfile.email || 'No registrado'}</Text>
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Cédula</Text>
            <Text style={styles.fieldValue}>{userProfile.cedula || 'No registrada'}</Text>
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Teléfono</Text>
            <Text style={styles.fieldValue}>
              {userProfile.telefono ? 
                (userProfile.telefono.startsWith('0') ? 
                  userProfile.telefono : 
                  `0${userProfile.telefono}`) : 
                'No registrado'}
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
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
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
    borderRadius: 40,
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  fieldContainer: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    paddingBottom: 8,
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
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
    color: '#FF0000',
  },
});

export default UserProfile;