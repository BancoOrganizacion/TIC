import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AppLayout } from "../components";
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

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleEditProfile = () => {
    navigation.navigate("EditProfile", { 
      userProfile: {
        ...userProfile,
        nombre_usuario: username
      }
    });
  };

  // Renderiza el botón de edición que aparecerá en el header
  const renderEditButton = () => (
    <TouchableOpacity 
      style={styles.editButton}
      onPress={handleEditProfile}
    >
      <Image
        source={require("../assets/images/edit.png")}
        style={styles.editIcon}
        tintColor="#000000"
        resizeMode="contain"
      />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <AppLayout
        title="Perfil"
        onBackPress={handleBackPress}
        showGreeting={false}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5C2684" />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </AppLayout>
    );
  }

  if (!userProfile) {
    return (
      <AppLayout
        title="Perfil"
        onBackPress={handleBackPress}
        showGreeting={false}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No se pudo cargar el perfil</Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Perfil"
      onBackPress={handleBackPress}
      showGreeting={false}
      headerRight={renderEditButton()}
    >
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
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#737373",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#D32F2F",
    textAlign: "center",
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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F5F5F5", // Fondo gris claro para el icono
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  fieldContainer: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    paddingBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    color: "#83898F",
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1C1B1F",
  },
});

export default UserProfile;