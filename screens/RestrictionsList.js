import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import {useNavigation,useRoute } from "@react-navigation/native";
import BottomNavBar from "../components/BottomNavBar"; // Asegúrate de importar el componente
import Greeting from "../components/Greeting"; // Componente reutilizable para el saludo
import BackButton from "../components/BackButton"; // Componente reutilizable para el botón de regresar
import { accountService } from "../services/api";

const RestrictionsList = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [restrictions, setRestrictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const accountId = route.params?.accountId;

  // Datos quemados para desarrollo
  const mockRestrictions = [
    {
      _id: "1",
      monto_desde: 0,
      monto_hasta: 100,
      patron_autenticacion: null,
      huellas_requeridas: 1,
    },
    {
      _id: "2",
      monto_desde: 101,
      monto_hasta: 500,
      patron_autenticacion: "60d5ecb74e4e8d1b5cbf2457",
      huellas_requeridas: 2,
    },
    {
      _id: "3",
      monto_desde: 501,
      monto_hasta: 1000,
      patron_autenticacion: "60d5ecb74e4e8d1b5cbf2458",
      huellas_requeridas: 2,
    },
  ];

  useEffect(() => {
    loadRestrictions();
  }, [accountId]);

  // RestrictionsList.js
  const loadRestrictions = async () => {
    setLoading(true);
    setError(null);

    try {
      // OBTENER DATOS REALES DE RESTRICCIONES
      const response = await accountService.getAccountRestrictions(accountId);

      if (response.data && response.data.length > 0) {
        // Usar restricciones reales del backend
        setRestrictions(response.data);
      } else {
        setRestrictions([]);
      }
    } catch (error) {
      console.error("Error cargando restricciones:", error);
      setError("Error al cargar restricciones");
      setRestrictions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatRangeText = (desde, hasta) => {
    if (desde === 0) return `Menores de $${hasta}`;
    if (hasta === 1000) return `Mayores de $${desde}`;
    return `De $${desde} hasta $${hasta}`;
  };

  const formatFingerprintsText = (count) => {
    return count === 1
      ? "1 huella dactilar requerida"
      : `${count} huellas dactilares requeridas`;
  };

  const handleEdit = (restriction) => {
    navigation.navigate("EditRestriction", {
      restriction,
      accountId,
      onSave: loadRestrictions,
    });
  };

  const handleCreate = () => {
    navigation.navigate("CreateRestriction", {
      accountId,
      onSave: loadRestrictions,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#5C2684" />
        <Text>Cargando restricciones...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Greeting name="Ana" />

        <View style={styles.titleContainer}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.titleText}>Restricciones</Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {restrictions.map((restriction) => (
          <View key={restriction._id} style={styles.row2}>
            <Image
              source={require("../assets/images/money.png")}
              resizeMode={"stretch"}
              style={styles.image2}
            />
            <View style={styles.column2}>
              <Text style={styles.text4}>
                {formatRangeText(
                  restriction.monto_desde,
                  restriction.monto_hasta
                )}
              </Text>
              <Text style={styles.text5}>
                {formatFingerprintsText(restriction.huellas_requeridas)}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleEdit(restriction)}>
              <Image
                source={{
                  uri: "https://cdn-icons-png.flaticon.com/512/32/32213.png",
                }}
                style={styles.arrowGo}
              />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={handleCreate}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingTop: 40, // Aumenta el espacio en la parte superior
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
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#5C2684",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 17,
    paddingHorizontal: 16,
    marginBottom: 24,
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
    marginBottom: 24,
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
  column2: {
    flex: 1,
    marginLeft: 10,
  },
  text4: {
    color: "#1C1B1F",
    fontSize: 13,
    marginBottom: 5,
  },
  text5: {
    color: "#53405B",
    fontSize: 12,
  },
  text6: {
    color: "#1C1B1F",
    fontSize: 13,
    marginBottom: 4,
  },
  text7: {
    color: "#737373",
    fontSize: 12,
  },
  arrowGo: {
    width: 24,
    height: 24,
  },
  addButton: {
    position: "absolute",
    bottom: -250,
    right: 5,
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
});

export default RestrictionsList;
