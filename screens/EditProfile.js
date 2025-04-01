import React, { useState, useEffect } from "react";
import { 
  SafeAreaView, 
  View, 
  ScrollView, 
  Text, 
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import BottomNavBar from "../components/BottomNavBar";
import Button from "../components/Button";
import BackButton from "../components/BackButton";
import { userService } from "../services/api";

const EditProfile = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  const [userData, setUserData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: ''
  });

  // Original user data to compare and prevent unnecessary updates
  const [originalUserData, setOriginalUserData] = useState({});

  useEffect(() => {
    // Extract user profile from route params
    const { userProfile } = route.params || {};
    if (userProfile) {
      const updatableData = {
        nombre: userProfile.nombre,
        apellido: userProfile.apellido,
        email: userProfile.email,
        telefono: userProfile.telefono || ''
      };
      
      setUserData(updatableData);
      setOriginalUserData(updatableData);
    }
  }, [route.params]);

  const handleChange = (field, value) => {
    setUserData({
      ...userData,
      [field]: value
    });
  };

  const handleSave = async () => {
    // Check if any fields have actually changed
    const hasChanges = Object.keys(userData).some(
      key => userData[key] !== originalUserData[key]
    );

    if (!hasChanges) {
      Alert.alert("Información", "No hay cambios para guardar");
      return;
    }

    // Validate inputs
    if (!userData.nombre || !userData.apellido || !userData.email) {
      Alert.alert("Error", "Por favor complete todos los campos obligatorios");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      Alert.alert("Error", "Por favor ingrese un correo electrónico válido");
      return;
    }

    try {
      // Update only the fields that can be modified
      await userService.updateUserProfile({
        nombre: userData.nombre,
        apellido: userData.apellido,
        email: userData.email,
        telefono: userData.telefono
      });
      
      Alert.alert(
        "Éxito", 
        "Perfil actualizado correctamente",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error("Error updating profile:", error);
      
      // Handle specific error cases
      if (error.response && error.response.status === 409) {
        Alert.alert("Error", "El correo electrónico ya está en uso");
      } else {
        Alert.alert("Error", "No se pudo actualizar el perfil");
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Editar Perfil</Text>
          <View style={{width: 40}} />
        </View>
        
        {/* Form Fields */}
        <View style={styles.formContainer}>
          <Text style={styles.label}>Nombre*</Text>
          <TextInput
            style={styles.input}
            value={userData.nombre}
            onChangeText={(text) => handleChange("nombre", text)}
            placeholder="Ingrese su nombre"
          />
          
          <Text style={styles.label}>Apellido*</Text>
          <TextInput
            style={styles.input}
            value={userData.apellido}
            onChangeText={(text) => handleChange("apellido", text)}
            placeholder="Ingrese su apellido"
          />
          
          <Text style={styles.label}>Email*</Text>
          <TextInput
            style={styles.input}
            value={userData.email}
            onChangeText={(text) => handleChange("email", text)}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="Ingrese su correo electrónico"
          />
          
          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            value={userData.telefono}
            onChangeText={(text) => handleChange("telefono", text)}
            keyboardType="phone-pad"
            placeholder="Ingrese su número de teléfono (opcional)"
          />
          
          <Button 
            title="Guardar Cambios"
            onPress={handleSave}
            style={styles.saveButton}
          />
        </View>

        {/* Read-only Fields */}
        <View style={styles.readOnlyContainer}>
          <Text style={styles.readOnlyTitle}>Información que no puede modificarse</Text>
          
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyLabel}>Cédula</Text>
            <Text style={styles.readOnlyValue}>
              {route.params?.userProfile?.cedula || 'N/A'}
            </Text>
          </View>
          
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyLabel}>Nombre de Usuario</Text>
            <Text style={styles.readOnlyValue}>
              {route.params?.userProfile?.nombre_usuario || 'N/A'}
            </Text>
          </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  formContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  saveButton: {
    marginTop: 30,
  },
  readOnlyContainer: {
    padding: 20,
    backgroundColor: '#F5F5F5',
    marginTop: 20,
  },
  readOnlyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  readOnlyField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  readOnlyLabel: {
    fontSize: 14,
    color: '#666',
  },
  readOnlyValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});

export default EditProfile;