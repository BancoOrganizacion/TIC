import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  Image,
  Text,
  ImageBackground,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native"; 
import BottomNavBar from "./BottomNavBar";
import Greeting from "./Greeting";

const AccountDashboard = (props) => {
  const [textInput1, onChangeTextInput1] = useState("");
  const navigation = useNavigation();

  // Función para manejar la navegación a RestrictionsList
  const handleRestrictionsPress = () => {
    navigation.navigate("RestrictionsList");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
      <Greeting name="Ana" />
        {/* Primera tarjeta de cuenta */}
        <ImageBackground
          source={{
            uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/54dc6117-abfb-460e-b129-836050f7cc5f",
          }}
          resizeMode={"stretch"}
          style={styles.card}
        >
          <View style={styles.row2}>
            <Text style={styles.text3}>{"N°"}</Text>
            <Text style={styles.text4}>{"12345678"}</Text>
            <View style={styles.box}></View>
            <Image
              source={{
                uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/5f0cfb00-e23a-4ed1-b7bb-20246acd2470",
              }}
              resizeMode={"stretch"}
              style={styles.image2}
            />
          </View>
          <Text style={styles.text5}>{"Ana Campoverde"}</Text>
          <View style={styles.row3}>
            <Text style={styles.text6}>{"Principal"}</Text>
            <Image
              source={{
                uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/d2d29080-95fe-4f1c-980e-1dc112bdbfa4",
              }}
              resizeMode={"stretch"}
              style={styles.image3}
            />
          </View>
          <View style={styles.row4}>
            <Text style={styles.text7}>{"$210,43"}</Text>
            <Image
              source={{
                uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/7d485700-f659-44cf-beda-fbe52f82305f",
              }}
              resizeMode={"stretch"}
              style={styles.image4}
            />
          </View>
        </ImageBackground>

        {/* Segunda tarjeta de cuenta */}
        <ImageBackground
          source={{
            uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/54dc6117-abfb-460e-b129-836050f7cc5f",
          }}
          resizeMode={"stretch"}
          style={styles.card}
        >
          <View style={styles.row2}>
            <Text style={styles.text3}>{"N°"}</Text>
            <Text style={styles.text4}>{"87654321"}</Text>
            <View style={styles.box}></View>
            <Image
              source={{
                uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/5f0cfb00-e23a-4ed1-b7bb-20246acd2470",
              }}
              resizeMode={"stretch"}
              style={styles.image2}
            />
          </View>
          <Text style={styles.text5}>{"Carlos Pérez"}</Text>
          <View style={styles.row3}>
            <Text style={styles.text6}>{"Secundaria"}</Text>
            <Image
              source={{
                uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/d2d29080-95fe-4f1c-980e-1dc112bdbfa4",
              }}
              resizeMode={"stretch"}
              style={styles.image3}
            />
          </View>
          <View style={styles.row4}>
            <Text style={styles.text7}>{"$150,00"}</Text>
            <Image
              source={{
                uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/7d485700-f659-44cf-beda-fbe52f82305f",
              }}
              resizeMode={"stretch"}
              style={styles.image4}
            />
          </View>
        </ImageBackground>

        {/* Botón "Registrar restricciones" con icono de huellas */}
        <View style={styles.view}>
          <TouchableOpacity style={styles.row5} onPress={handleRestrictionsPress}>
            <Image
              source={{
                uri: "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/5b009de9-4d8a-4fd7-8f75-69efdd4f6190",
              }}
              resizeMode={"stretch"}
              style={styles.image5}
            />
            <TextInput
              placeholder={"Registrar restricciones"}
              value={textInput1}
              onChangeText={onChangeTextInput1}
              style={styles.input}
              editable={false} // Evita que el usuario edite el TextInput
            />
          </TouchableOpacity>
        </View>
        <BottomNavBar />
      </ScrollView>
    </SafeAreaView>
  );
};

export default AccountDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  box: {
    flex: 1,
  },
  column: {
    flex: 1,
  },
  card: {
    height: 179,
    padding: 18,
    marginBottom: 20,
    marginHorizontal: 45,
  },
  column3: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    paddingHorizontal: 56,
  },
  image: {
    width: 24,
    height: 24,
    marginRight: 16,
  },
  image2: {
    width: 18,
    height: 4,
  },
  image3: {
    width: 14,
    height: 14,
  },
  image4: {
    width: 6,
    height: 11,
  },
  image5: {
    width: 17,
    height: 22,
    marginRight: 5,
  },
  image6: {
    width: 19,
    height: 20,
  },
  image7: {
    width: 24,
    height: 24,
    marginRight: 97,
  },
  image8: {
    width: 14,
    height: 19,
  },
  input: {
    color: "#1C1B1F",
    fontSize: 13,
    flex: 1,
    paddingVertical: 26,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    marginLeft: 15,
    marginRight: 278,
  },
  row2: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  row3: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 11,
  },
  row4: {
    flexDirection: "row",
    alignItems: "center",
  },
  row5: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#5C2684",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  row6: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  row7: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 71,
  },
  text: {
    color: "#737373",
    fontSize: 9,
    textAlign: "center",
    marginBottom: 4,
  },
  text2: {
    color: "#000000",
    fontSize: 13,
    textAlign: "center",
  },
  text3: {
    color: "#23303B",
    fontSize: 9,
    marginRight: 17,
  },
  text4: {
    color: "#23303B",
    fontSize: 10,
  },
  text5: {
    color: "#23303B",
    fontSize: 9,
    marginBottom: 63,
  },
  text6: {
    color: "#23303B",
    fontSize: 9,
    marginRight: 10,
  },
  text7: {
    color: "#23303B",
    fontSize: 28,
    marginRight: 4,
    flex: 1,
  },
  text8: {
    color: "#1F2C37",
    fontSize: 11,
  },
  text9: {
    color: "#A09CAB",
    fontSize: 11,
  },
  text10: {
    color: "#8E949A",
    fontSize: 11,
  },
  view: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    marginBottom: 126,
  },
});