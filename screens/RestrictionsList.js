import React from "react";
import { SafeAreaView, View, ScrollView, Image, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import BottomNavBar from "./BottomNavBar"; // Asegúrate de importar el componente
import Greeting from "./Greeting";

const RestrictionsList = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Greeting name="Ana" />

        {/* Título "Restricciones" en negrita con arrowBack a la izquierda */}
        <View style={styles.titleContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              source={{ uri: "https://cdn-icons-png.flaticon.com/512/271/271220.png" }} // URL de la flecha de retroceso
              style={styles.arrowBack}
            />
          </TouchableOpacity>
          <Text style={styles.titleText}>Restricciones</Text>
        </View>

        {/* Lista de restricciones */}
        <View style={styles.row2}>
          <Image
            source={{ uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/36a6f0df-14ca-494a-858c-9b916e1ce5e5" }}
            resizeMode={"stretch"}
            style={styles.image2}
          />
          <View style={styles.column2}>
            <Text style={styles.text4}>{"Menores de $100"}</Text>
            <Text style={styles.text5}>{"1 huella dactilar requerida"}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate("EditRestriction")}>
            <Image
              source={{ uri: "https://cdn-icons-png.flaticon.com/512/32/32213.png" }} // Ícono de flecha derecha
              style={styles.arrowGo}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.row2}>
          <Image
            source={{ uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/676db8f7-a3ac-4846-8dbc-b837c6c2ca5c" }}
            resizeMode={"stretch"}
            style={styles.image4}
          />
          <View style={styles.column2}>
            <Text style={styles.text6}>{"De $101 hasta $500"}</Text>
            <Text style={styles.text7}>{"2 huellas dactilares requeridas"}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate("EditRestriction")}>
            <Image
              source={{ uri: "https://cdn-icons-png.flaticon.com/512/32/32213.png" }} // Ícono de flecha derecha
              style={styles.arrowGo}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.row3}>
          <Image
            source={{ uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/0baf27db-cda6-4ff2-977d-68c43823aa60" }}
            resizeMode={"stretch"}
            style={styles.image2}
          />
          <View style={styles.column2}>
            <Text style={styles.text6}>{"De $501 hasta $1001"}</Text>
            <Text style={styles.text7}>{"2 huellas dactilares requeridas"}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate("EditRestriction")}>
            <Image
              source={{ uri: "https://cdn-icons-png.flaticon.com/512/32/32213.png" }} // Ícono de flecha derecha
              style={styles.arrowGo}
            />
          </TouchableOpacity>
        </View>

        
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("CreateRestriction")}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>

        <BottomNavBar />
      </ScrollView>
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 24,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  headerTextContainer: {
    flexDirection: "column",
  },
  headerName: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "bold",
  },
  headerDate: {
    color: "#737373",
    fontSize: 12,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  arrowBack: {
    width: 18,
    height: 18,
    marginRight: 90,
  },
  titleText: {
    color: "#1C1B1F",
    fontSize: 20,
    fontWeight: "bold",
  },
  row2: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#5C2684",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 17,
    paddingHorizontal: 16,
    marginBottom: 24,
    marginHorizontal: 16,
  },
  row3: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#5C2684",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 17,
    paddingHorizontal: 16,
    marginBottom: 235,
    marginHorizontal: 16,
  },
  image2: {
    width: 33,
    height: 31,
    marginRight: 8,
  },
  image4: {
    width: 33,
    height: 31,
    marginRight: 2,
  },
  text4: {
    color: "#1C1B1F",
    fontSize: 13,
    marginBottom: 5,
    marginLeft: 10,
  },
  text5: {
    color: "#53405B",
    fontSize: 12,
    marginLeft: 10,
  },
  text6: {
    color: "#1C1B1F",
    fontSize: 13,
    marginBottom: 4,
    marginLeft: 10,
  },
  text7: {
    color: "#737373",
    fontSize: 12,
    marginLeft: 10,
  },
  arrowGo: {
    marginHorizontal: 90,
    width: 24,
    height: 24,
  },
  addButton: {
    position: "absolute",
    bottom: 80,
    right: 20,
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
  scrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 99,
  },
});

export default RestrictionsList;