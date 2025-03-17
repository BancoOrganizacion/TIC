import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Picker } from "@react-native-picker/picker"; 
import BackButton from "../components/BackButton";

export default (props) => {
  const [textInput1, onChangeTextInput1] = useState("");
  const [textInput2, onChangeTextInput2] = useState("");
  const [textInput3, onChangeTextInput3] = useState("");
  const [textInput4, onChangeTextInput4] = useState("");
  const [textInput5, onChangeTextInput5] = useState("");
  const [textInput6, onChangeTextInput6] = useState("");
  const [selectedGender, setSelectedGender] = useState(""); 
  const [textInput8, onChangeTextInput8] = useState("");
  const [textInput9, onChangeTextInput9] = useState("");
  const [textInput10, onChangeTextInput10] = useState("");

  const handleGoBack = () => {
    props.navigation.goBack();
  };

  const handleNext = () => {
    props.navigation.navigate("Code"); 
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.headerContainer}>
          <BackButton onPress={handleGoBack} /> 
          <Text style={styles.title}>Registro</Text>
        </View>

        <Text style={styles.text2}>Nombre*</Text>
        <TextInput
          placeholder="Ingresa tu nombre"
          value={textInput1}
          onChangeText={onChangeTextInput1}
          style={styles.input}
        />

        <Text style={styles.text3}>Cédula*</Text>
        <TextInput
          placeholder="Ingresa tu cédula"
          value={textInput2}
          onChangeText={onChangeTextInput2}
          style={styles.input2}
        />

        <Text style={styles.text3}>Número de teléfono</Text>
        <View style={styles.row2}>
          <TextInput
            placeholder="+593"
            value={textInput3}
            onChangeText={onChangeTextInput3}
            style={styles.input3}
          />
          <TextInput
            placeholder="0999999999"
            value={textInput4}
            onChangeText={onChangeTextInput4}
            style={styles.input4}
          />
        </View>

        <Text style={styles.text4}>Correo</Text>
        <TextInput
          placeholder="name@example.com"
          value={textInput5}
          onChangeText={onChangeTextInput5}
          style={styles.input5}
        />

        <View style={styles.row3}>
          <Text style={styles.text5}>Día de nacimiento</Text>
          <Text style={styles.text6}>Género</Text>
        </View>
        <View style={styles.row4}>
          <TextInput
            placeholder="dd/mm/aaaa"
            value={textInput6}
            onChangeText={onChangeTextInput6}
            style={styles.input6}
          />
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedGender}
              onValueChange={(itemValue) => setSelectedGender(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Femenino" value="Femenino" />
              <Picker.Item label="Masculino" value="Masculino" />
            </Picker>
          </View>
        </View>

        <Text style={styles.text7}>Dirección</Text>
        <TextInput
          placeholder="Ingresa tu dirección"
          value={textInput8}
          onChangeText={onChangeTextInput8}
          style={styles.input8}
        />

        <Text style={styles.text8}>Contraseña</Text>
        <TextInput
          placeholder="Ingresa una contraseña"
          value={textInput9}
          onChangeText={onChangeTextInput9}
          secureTextEntry
          style={styles.input9}
        />

        <Text style={styles.text9}>Confirma tu contraseña</Text>
        <TextInput
          placeholder="Ingresa la contraseña otra vez"
          value={textInput10}
          onChangeText={onChangeTextInput10}
          secureTextEntry
          style={styles.input10}
        />

        {/* Botón de Siguiente */}
        <TouchableOpacity onPress={handleNext} style={styles.button}>
          <Text style={styles.buttonText}>Siguiente</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 45,
    marginHorizontal: 20,
  },
  title: {
    color: "#000000",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1, 
  },
  row2: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 11,
    marginHorizontal: 22,
  },
  row3: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    marginHorizontal: 31,
  },
  row4: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 7,
    marginHorizontal: 22,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginTop: 99,
  },
  text2: {
    color: "#737373",
    fontSize: 15,
    marginBottom: 4,
    marginLeft: 37,
  },
  text3: {
    color: "#737373",
    fontSize: 15,
    marginBottom: 5,
    marginLeft: 35,
  },
  text4: {
    color: "#737373",
    fontSize: 15,
    marginBottom: 5,
    marginLeft: 36,
  },
  text5: {
    color: "#737373",
    fontSize: 15,
    marginRight: 49,
  },
  text6: {
    color: "#737373",
    fontSize: 15,
    flex: 1,
  },
  text7: {
    color: "#737373",
    fontSize: 15,
    marginBottom: 6,
    marginLeft: 33,
  },
  text8: {
    color: "#737373",
    fontSize: 15,
    marginBottom: 6,
    marginLeft: 34,
  },
  text9: {
    color: "#737373",
    fontSize: 15,
    marginBottom: 6,
    marginHorizontal: 34,
  },
  input: {
    color: "#000000",
    fontSize: 15,
    marginBottom: 8,
    marginHorizontal: 23,
    borderColor: "#D9D9D9",
    borderRadius: 7,
    borderWidth: 1,
    paddingVertical: 19,
    paddingHorizontal: 13,
  },
  input2: {
    color: "#000000",
    fontSize: 15,
    marginBottom: 11,
    marginHorizontal: 22,
    borderColor: "#D9D9D9",
    borderRadius: 7,
    borderWidth: 1,
    paddingVertical: 19,
    paddingHorizontal: 10,
  },
  input3: {
    color: "#000000",
    fontSize: 15,
    width: 70,
    borderColor: "#D9D9D9",
    borderRadius: 7,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 7,
  },
  input4: {
    color: "#000000",
    fontSize: 15,
    width: 246,
    borderColor: "#D9D9D9",
    borderRadius: 7,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  input5: {
    color: "#000000",
    fontSize: 15,
    marginBottom: 15,
    marginHorizontal: 21,
    borderColor: "#D9D9D9",
    borderRadius: 7,
    borderWidth: 1,
    paddingVertical: 19,
    paddingHorizontal: 9,
  },
  input6: {
    color: "#000000",
    fontSize: 15,
    width: 155,
    borderColor: "#D9D9D9",
    borderRadius: 7,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 10,
  },
  input8: {
    color: "#000000",
    fontSize: 15,
    marginBottom: 7,
    marginHorizontal: 22,
    borderColor: "#D9D9D9",
    borderRadius: 7,
    borderWidth: 1,
    paddingVertical: 17,
    paddingHorizontal: 13,
  },
  input9: {
    color: "#000000",
    fontSize: 15,
    marginBottom: 7,
    marginHorizontal: 22,
    borderColor: "#D9D9D9",
    borderRadius: 7,
    borderWidth: 1,
    paddingVertical: 17,
    paddingHorizontal: 12,
  },
  input10: {
    color: "#000000",
    fontSize: 15,
    marginBottom: 30,
    marginHorizontal: 22,
    borderColor: "#D9D9D9",
    borderRadius: 7,
    borderWidth: 1,
    paddingVertical: 17,
    paddingHorizontal: 14,
  },
  pickerContainer: {
    flex: 1,
    borderColor: "#D9D9D9",
    borderRadius: 7,
    borderWidth: 1,
    justifyContent: "center",
    marginLeft: 10,
  },
  picker: {
    height: 58,
  },
  button: {
    marginHorizontal: 23,
    backgroundColor: "#5C2684",
    borderRadius: 7,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 50,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});