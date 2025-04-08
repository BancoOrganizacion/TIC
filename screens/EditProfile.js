import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import BottomNavBar from "../components/BottomNavBar";
import Button from "../components/Button";
import BackButton from "../components/BackButton";
import { userService } from "../services/api";
import AsyncStorage from '@react-native-async-storage/async-storage';

const EditProfile = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [userData, setUserData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
  });

  const [originalUserData, setOriginalUserData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [readOnlyData, setReadOnlyData] = useState({
    cedula: "",
    nombre_usuario: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Cargar datos del perfil
        if (route.params?.userProfile) {
          setupUserData(route.params.userProfile);
        } else {
          const response = await userService.getUserProfile();
          if (response?.data) {
            setupUserData(response.data);
          }
        }
        
        // Cargar nombre de usuario desde AsyncStorage
        const username = await AsyncStorage.getItem('nombre_usuario');
        if (username) {
          setReadOnlyData(prev => ({...prev, nombre_usuario: username}));
        }
        
      } catch (error) {
        console.error("Error loading profile:", error);
        Alert.alert("Error", "No se pudo cargar el perfil");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const setupUserData = (profile) => {
    const updatableData = {
      nombre: profile.nombre || "",
      apellido: profile.apellido || "",
      email: profile.email || "",
      telefono: profile.telefono || "",
    };

    setUserData(updatableData);
    setOriginalUserData(updatableData);

    setReadOnlyData({
      cedula: profile.cedula || "",
      nombre_usuario: profile.nombre_usuario || "",
    });
  };

  const handleChange = (field, value) => {
    setUserData({
      ...userData,
      [field]: value,
    });
    
    // Limpiar error si existe
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: null,
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }
    
    if (!formData.apellido.trim()) {
      newErrors.apellido = "El apellido es requerido";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Ingrese un email válido";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      
      // Verificar si hay cambios reales
      const hasChanges = Object.keys(userData).some(
        key => userData[key] !== originalUserData[key]
      );
      
      if (!hasChanges) {
        Alert.alert("Información", "No hay cambios para guardar");
        return;
      }

      // Actualizar perfil en el backend
      const response = await userService.updateUserProfile(userData);
      
      if (response.data) {
        // Actualizar datos en AsyncStorage
        const updatedProfile = {
          ...userData,
          cedula: readOnlyData.cedula,
          nombre_usuario: readOnlyData.nombre_usuario,
        };
        
        await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
        
        // Notificar éxito
        Alert.alert("Éxito", "Perfil actualizado correctamente", [
          { text: "OK", onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "No se pudo actualizar el perfil");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#5C2684" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Editar Perfil</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre*</Text>
            <TextInput
              style={[styles.input, errors.nombre && styles.inputError]}
              value={userData.nombre}
              onChangeText={(text) => handleChange("nombre", text)}
              placeholder="Ingrese su nombre"
            />
            {errors.nombre && <Text style={styles.errorText}>{errors.nombre}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Apellido*</Text>
            <TextInput
              style={[styles.input, errors.apellido && styles.inputError]}
              value={userData.apellido}
              onChangeText={(text) => handleChange("apellido", text)}
              placeholder="Ingrese su apellido"
            />
            {errors.apellido && <Text style={styles.errorText}>{errors.apellido}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email*</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={userData.email}
              onChangeText={(text) => handleChange("email", text)}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Ingrese su correo electrónico"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Teléfono</Text>
            <TextInput
              style={styles.input}
              value={userData.telefono}
              onChangeText={(text) => handleChange("telefono", text)}
              keyboardType="phone-pad"
              placeholder="Ingrese su número de teléfono"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cédula</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={readOnlyData.cedula}
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre de usuario</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={readOnlyData.nombre_usuario}
              editable={false}
            />
          </View>

          <Button
            title="Guardar Cambios"
            onPress={handleSave}
            style={styles.saveButton}
            disabled={isLoading}
          />
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  inputError: {
    borderColor: '#ff0000',
  },
  errorText: {
    color: '#ff0000',
    fontSize: 12,
    marginTop: 4,
  },
  saveButton: {
    marginTop: 20,
  },
});

export default EditProfile;