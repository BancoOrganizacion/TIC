import React, { useState } from "react";
import { 
  SafeAreaView, 
  View, 
  ScrollView, 
  Text, 
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import BottomNavBar from "../components/BottomNavBar";
import Button from "../components/Button";
import BackButton from "../components/BackButton";

const EditProfile = () => {
  const navigation = useNavigation();
  
  const [userData, setUserData] = useState({
    name: "Ana Campoverde",
    email: "ana@gmail.com",
    cedula: "17235689875",
    phone: "+593 9999999999"
  });

  const handleChange = (field, value) => {
    setUserData({
      ...userData,
      [field]: value
    });
  };

  const handleSave = () => {
    // Here you would typically save the data to your backend
    // For now, we'll just navigate back
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header - sin la línea inferior */}
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Editar Perfil</Text>
          <View style={{width: 40}} /> {/* Espacio para mantener el header centrado */}
        </View>
        
        {/* Form Fields */}
        <View style={styles.formContainer}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={userData.name}
            onChangeText={(text) => handleChange("name", text)}
          />
          
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={userData.email}
            onChangeText={(text) => handleChange("email", text)}
            keyboardType="email-address"
          />
          
          <Text style={styles.label}>Cédula</Text>
          <TextInput
            style={styles.input}
            value={userData.cedula}
            onChangeText={(text) => handleChange("cedula", text)}
            keyboardType="numeric"
          />
          
          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            value={userData.phone}
            onChangeText={(text) => handleChange("phone", text)}
            keyboardType="phone-pad"
          />
          
          <Button 
            title="Guardar Cambios"
            onPress={handleSave}
            style={styles.saveButton}
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    // Se eliminó borderBottomWidth y borderBottomColor
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
  }
});

export default EditProfile;