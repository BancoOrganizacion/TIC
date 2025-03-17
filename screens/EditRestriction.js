import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import BackButton from "../components/BackButton"; 
import Greeting from "../components/Greeting"; 
import BottomNavBar from "../components/BottomNavBar"; 
import Button from "../components/Button";
const EditRestrictionScreen = () => {
  const [fromAmount, setFromAmount] = useState("101");
  const [toAmount, setToAmount] = useState("500");
  const navigation = useNavigation();

  const handleSave = () => {
    alert("Restricción guardada");
    // Lógica para guardar la restricción
  };

  const handleAddFingerprint = () => {
    navigation.navigate("AddFingerprint"); // Navegar a la pantalla de agregar huella
  };

  const handleDeleteFingerprint = (index) => {
    alert(`Huella ${index + 1} eliminada`);
    // Lógica para eliminar la huella
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Saludo "Hi, Ana!" con la fecha de hoy */}
        <Greeting name="Ana" />

        {/* Título "Editar restricción" con BackButton a la izquierda */}
        <View style={styles.titleContainer}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.titleText}>Editar restricción</Text>
        </View>

        {/* Campos de "Desde" y "Hasta" */}
        <View style={styles.amountContainer}>
          <View style={styles.amountInputContainer}>
            <Text style={styles.label}>Desde</Text>
            <View style={styles.inputRow}>
              <Image
                source={{
                  uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/41296732-ba63-4249-8234-f0ebf39041f3",
                }}
                style={styles.icon}
              />
              <TextInput
                placeholder="Monto desde"
                value={fromAmount}
                onChangeText={setFromAmount}
                style={styles.input}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.amountInputContainer}>
            <Text style={styles.label}>Hasta</Text>
            <View style={styles.inputRow}>
              <Image
                source={{
                  uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/3d3fc587-05d1-4a0d-8a00-05345e43e4be",
                }}
                style={styles.icon}
              />
              <TextInput
                placeholder="Monto hasta"
                value={toAmount}
                onChangeText={setToAmount}
                style={styles.input}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Lista de huellas */}
        <View style={styles.fingerprintsContainer}>
          <Text style={styles.sectionTitle}>Huellas</Text>

          {/* Huella 1 */}
          <View style={styles.fingerprintRow}>
            <Text style={styles.fingerprintNumber}>1.</Text>
            <Image
              source={{
                uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/bee7e6d0-046c-487b-a1f0-a5340a97beed",
              }}
              style={styles.fingerprintIcon}
            />
            <Text style={styles.fingerprintText}>Keyword 1</Text>
            <TouchableOpacity
              onPress={() => handleDeleteFingerprint(0)}
              style={styles.deleteButton}
            >
              <Image
                source={{
                  uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/c2ff8cec-cdd4-4a4a-be1e-2b15cffb4ff8",
                }}
                style={styles.deleteIcon}
              />
            </TouchableOpacity>
          </View>

          {/* Huella 2 */}
          <View style={styles.fingerprintRow}>
            <Text style={styles.fingerprintNumber}>2.</Text>
            <Image
              source={{
                uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/1b9e65a0-0be9-4936-8545-ab525ef2d6f3",
              }}
              style={styles.fingerprintIcon}
            />
            <Text style={styles.fingerprintText}>Keyword 2</Text>
            <TouchableOpacity
              onPress={() => handleDeleteFingerprint(1)}
              style={styles.deleteButton}
            >
              <Image
                source={{
                  uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/48a7840e-a756-4e86-9a46-aa7bff677f5f",
                }}
                style={styles.deleteIcon}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Botón "Guardar restricción" */}
      <View style={styles.saveButtonContainer}>
        <Button
          title="Guardar restricción"
          onPress={handleSave}
          style={styles.saveButton}
        />
      </View>

      {/* Botón "Agregar otra huella" */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddFingerprint}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      {/* Barra de navegación inferior */}
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
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  titleText: {
    color: "#1C1B1F",
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  amountContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  amountInputContainer: {
    width: "48%",
  },
  label: {
    color: "#000000",
    fontSize: 14,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#D9D9D9",
    borderRadius: 7,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: "#737373",
    fontSize: 15,
  },
  fingerprintsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#737373",
    fontSize: 14,
    marginBottom: 16,
  },
  fingerprintRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  fingerprintNumber: {
    color: "#000000",
    fontSize: 17,
    marginRight: 8,
  },
  fingerprintIcon: {
    width: 32,
    height: 40,
    marginRight: 8,
  },
  fingerprintText: {
    color: "#737373",
    fontSize: 14,
    flex: 1,
  },
  deleteButton: {
    padding: 8,
  },
  deleteIcon: {
    width: 21,
    height: 25,
  },
  addButton: {
    position: "absolute",
    bottom: 160, // Ajusta la posición vertical
    right: 20, // Ajusta la posición horizontal
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#5C2684",
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
  },
  saveButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  saveButton: {
    width: "100%",
  },
});

export default EditRestrictionScreen;