import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import BackButton from "../components/BackButton"; 
import Greeting from "../components/Greeting"; 
import BottomNavBar from "../components/BottomNavBar"; 
import Button from "../components/Button"; 

const CreateRestrictionScreen = () => {
  const navigation = useNavigation();
  const [textInput1, onChangeTextInput1] = useState("");
  const [textInput2, onChangeTextInput2] = useState("");
  const [textInput3, onChangeTextInput3] = useState("");

  const handleSave = () => {
    alert("Restricción guardada");
    
  };

  const handleAddFingerprint = () => {
    navigation.navigate("FingerprintList"); 
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Greeting name="Ana" />

        <View style={styles.titleContainer}>
          <BackButton onPress={() => navigation.goBack()} /> 
          <Text style={styles.titleText}>Crear restricción</Text>
        </View>

        <View style={styles.row2}>
          <View style={styles.view3}>
            <View style={styles.column2}>
              <View style={styles.view4}>
                <Text style={styles.text4}>Desde</Text>
              </View>
              <View style={styles.row3}>
                <Image
                  source={{ uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/0eaed135-4b7e-427b-be24-825cb3fd8c31" }}
                  resizeMode={"stretch"}
                  style={styles.image2}
                />
                <TextInput
                  placeholder={"Monto desde"}
                  value={textInput1}
                  onChangeText={onChangeTextInput1}
                  style={styles.input}
                />
              </View>
            </View>
          </View>
          <View style={styles.view5}>
            <View style={styles.column2}>
              <View style={styles.view4}>
                <Text style={styles.text4}>Hasta</Text>
              </View>
              <View style={styles.row3}>
                <Image
                  source={{ uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/5dc463aa-e2a6-4cb0-bc36-200a734c63d2" }}
                  resizeMode={"stretch"}
                  style={styles.image3}
                />
                <TextInput
                  placeholder={"Monto hasta"}
                  value={textInput2}
                  onChangeText={onChangeTextInput2}
                  style={styles.input}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.fingerprintRow}>
          <Text style={styles.fingerprintNumber}>1.</Text>
          <Image
            source={{ uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/a31e8a2e-29a4-43c2-ac55-0d26872d0401" }}
            resizeMode={"stretch"}
            style={styles.fingerprintIcon}
          />
          <Text style={styles.fingerprintText}>Palabra secreta</Text>
        </View>
      </ScrollView>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("EditRestriction")}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>

        <Button
          title="Guardar restricción"
          onPress={handleSave}
          style={styles.saveButton}
        />
      </View>

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
    paddingTop: 40,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  titleText: {
    color: "#1C1B1F",
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  row2: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 21,
  },
  view3: {
    width: "48%",
  },
  view5: {
    width: "48%",
  },
  column2: {
    alignItems: "flex-start",
  },
  view4: {
    marginBottom: 8,
  },
  text4: {
    color: "#000000",
    fontSize: 14,
  },
  row3: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#D9D9D9",
    borderRadius: 7,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  image2: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  image3: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  input: {
    color: "#737373",
    fontSize: 15,
    flex: 1,
  },
  fingerprintRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 21,
  },
  fingerprintNumber: {
    color: "#000000",
    fontSize: 17,
    marginRight: 8,
  },
  fingerprintIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  fingerprintText: {
    color: "#737373",
    fontSize: 14,
  },
  buttonsContainer: {
    position: "absolute",
    bottom: 80, 
    right: 20,  
    alignItems: "flex-end", 
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#5C2684",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15, 
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
  },
  saveButton: {
    width: 350,
  },
});

export default CreateRestrictionScreen;