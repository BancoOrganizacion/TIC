import React, {useState} from "react";
import { SafeAreaView, View, ScrollView, Text, TextInput, Image, Button } from "react-native";
import { useNavigation } from '@react-navigation/native';

export default (props) => {
    const [textInput1, onChangeTextInput1] = useState('');
    const [textInput2, onChangeTextInput2] = useState('');
    const navigation = useNavigation();

    const handleLogin = () => {
        // lógica de autenticación
        navigation.navigate('Home'); 
    };

    return (
        <SafeAreaView 
            style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
            }}>
            <ScrollView  
                style={{
                    position: "absolute",
                    top: 126,
                    bottom: 0,
                    right: 0,
                    left: 0,
                    flex: 1,
                    backgroundColor: "#FFFFFF",
                }}>
                <Text 
                    style={{
                        color: "#1F2C37",
                        fontSize: 24,
                        textAlign: "center",
                        marginBottom: 19,
                        marginHorizontal: 63,
                    }}>
                    {"Bienvenido! 👋"}
                </Text>
                <Text 
                    style={{
                        color: "#78828A",
                        fontSize: 14,
                        textAlign: "center",
                        marginBottom: 58,
                        marginHorizontal: 45,
                    }}>
                    {"Lorem ipsum dolor sit amet, consectetur"}
                </Text>
                <Text 
                    style={{
                        color: "#737373",
                        fontSize: 15,
                        marginLeft: 39,
                    }}>
                    {"Nombre"}
                </Text>
                <TextInput
                    placeholder={"Ingresa tu nombre"}
                    value={textInput1}
                    onChangeText={onChangeTextInput1}
                    style={{
                        color: "#000000",
                        fontSize: 15,
                        marginBottom: 37,
                        marginHorizontal: 23,
                        borderColor: "#D9D9D9",
                        borderRadius: 7,
                        borderWidth: 1,
                        paddingVertical: 19,
                        paddingHorizontal: 20,
                    }}
                />
                <Text 
                    style={{
                        color: "#737373",
                        fontSize: 15,
                        marginBottom: 1,
                        marginLeft: 36,
                    }}>
                    {"Contraseña"}
                </Text>
                <TextInput
                    placeholder={"Ingresa tu contraseña"}
                    value={textInput2}
                    onChangeText={onChangeTextInput2}
                    style={{
                        color: "#000000",
                        fontSize: 15,
                        marginBottom: 21,
                        marginHorizontal: 23,
                        borderColor: "#D9D9D9",
                        borderRadius: 7,
                        borderWidth: 1,
                        paddingVertical: 18,
                        paddingHorizontal: 20,
                    }}
                />
                <View 
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 21,
                        marginHorizontal: 27,
                    }}>
                    <Image
                        source = {{uri: "https://i.imgur.com/1tMFzp8.png"}} 
                        resizeMode = {"stretch"}
                        style={{
                            width: 20,
                            height: 20,
                            marginRight: 12,
                        }}
                    />
                    <Text 
                        style={{
                            color: "#1F2C37",
                            fontSize: 14,
                        }}>
                        {"Recordarme"}
                    </Text>
                    <View 
                        style={{
                            flex: 1,
                        }}>
                    </View>
                    <Text 
                        style={{
                            color: "#57435C",
                            fontSize: 14,
                        }}>
                        {"Olvidaste tu contraseña"}
                    </Text>
                </View>
                <View 
                    style={{
                        marginHorizontal: 23,
                        marginBottom: 21,
                    }}>
                    <Button
                        title="Iniciar sesión"
                        onPress={handleLogin}
                        color="#5C2684"
                    />
                </View>
                <View 
                    style={{
                        alignItems: "center",
                        backgroundColor: "#FFFFFF",
                        paddingVertical: 19,
                    }}>
                    <Text 
                        style={{
                            fontSize: 14,
                        }}>
                        {"No tienes una cuenta aún?  Registrate"}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}