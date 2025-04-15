import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { use } from "react";
//const API_GATEWAY = 'http://192.168.0.102:3000';
const API_GATEWAY = "http://192.168.100.101:3000";
// emulador android
// const API_GATEWAY = 'http://10.0.2.2:3000';

// Cliente para peticiones que NO requieren autenticación
const apiPublic = axios.create({
  baseURL: API_GATEWAY,
});

// Cliente para peticiones que requieren autenticación
const apiPrivate = axios.create({
  baseURL: API_GATEWAY,
});

apiPrivate.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("Using token in request:", token.substring(0, 10) + "...");
    } else {
      console.warn("No token found for request to:", config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
apiPrivate.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log detailed error information
    console.error("API Request Failed:", {
      url: error.config?.url,
      method: error.config?.method,
      data: error.config?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
    });

    return Promise.reject(error);
  }
);

// Servicios de autenticación
export const authService = {
  login: async (username, password) => {
    console.log("Logging in with username:", { username, password });
    try {
      const response = await apiPublic.post("/auth/auth/login", {
        username,
        password,
      });
      console.log("Login response status:", response.status);
      return response;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  getTelegramLink: async () => {
    try {
      console.log("Getting Telegram link");

      const response = await apiPrivate.post("/auth/telegram/link");
      console.log("Telegram link response status:", response.status);

      if (!response.data || !response.data.deepLink) {
        console.error("Unexpected response format:", response.data);
        throw new Error("Respuesta inesperada del servidor");
      }

      return response;
    } catch (error) {
      console.error("Error getting Telegram link:", error);
      throw error;
    }
  },

  // Generar código de verificación para un usuario
  generateVerificationCode: async () => {
    try {
      console.log("Sending verification code request");

      // Asegurarse de que estamos usando el token
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.warn("No token found for generating code");
      }

      const response = await apiPrivate.post("/auth/auth/codigo/generar", {
        tipo: "registro",
      });

      console.log("Verification code response:", response.status);
      return response;
    } catch (error) {
      console.error("Error generating verification code:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  // Validar código de verificación
  validateVerificationCode: async (data) => {
    try {
      console.log("Validating code with data:", data);

      const validationData = {
        userId: data.userId,
        code: data.code.toString(),
      };

      // Verificar si tenemos token
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.warn("No token found for code validation");
      }

      const response = await apiPublic.post(
        "/auth/auth/codigo/validar",
        validationData
      );
      console.log("Validation response:", response.status, response.data);
      return response;
    } catch (error) {
      console.error("Validation error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  // Verificar si ya existe un chat con el bot para este usuario
  checkTelegramChatId: (telefono) => {
    console.log("Checking chat ID for phone:", telefono);
    return apiPublic
      .post("auth/telegram/find-chat-id", { telefono })
      .then((response) => {
        console.log("Chat ID response:", response.data);
        return response;
      })
      .catch((error) => {
        console.error(
          "Chat ID check error:",
          error.response?.data || error.message
        );
        throw error;
      });
  },

  checkUserTelegramChat: async () => {
    try {
      console.log("Checking if user has Telegram chat linked");
      const token = await AsyncStorage.getItem("token");

      // Asegúrate de que el token esté configurado
      if (!token) {
        console.error("No token available for Telegram check");
        throw new Error("No token available");
      }

      const response = await apiPrivate.post("auth/telegram/check-chat");
      console.log("Telegram chat check response:", response.data);
      return response;
    } catch (error) {
      console.error("Error checking Telegram chat:", error);
      throw error;
    }
  },
};

// Servicios de usuarios
export const userService = {
  // Métodos públicos (no requieren token)
  getRoles: () => {
    return apiPublic.get("/users/roles");
  },

  // Crear usuario (con rol temporal "usuario registrado")
  createUser: async (userData) => {
    const formattedData = {
      nombre: userData.nombre,
      apellido: userData.apellido,
      cedula: userData.cedula,
      email: userData.email,
      telefono: userData.telefono,
      nombre_usuario: userData.nombreUsuario,
      contraseña: userData.password,
      rol: userData.rol,
    };
    const response = await apiPublic.post("/users/usuarios", formattedData);

    // Guardar el token si viene en la respuesta
    if (response.data.token) {
      console.log(
        "Saving token to AsyncStorage:",
        response.data.token.substring(0, 10) + "..."
      );
      await AsyncStorage.setItem("token", response.data.token);
    } else if (response.data.access_token) {
      console.log(
        "Saving access_token to AsyncStorage:",
        response.data.access_token.substring(0, 10) + "..."
      );
      await AsyncStorage.setItem("token", response.data.access_token);
    } else {
      console.error("No token found in response:", response.data);
    }

    return response;
  },

  // Actualizar el rol de un usuario (después de verificación)
  updateUserRole: async (userId, roleId) => {
    try {
      console.log(`Updating user ${userId} to role ${roleId}`);
      // Esta operación requiere token de autenticación
      const response = await apiPrivate.put(`/users/usuarios/${userId}/rol`, {
        rolId: roleId,
      });
      console.log("Role update response:", response.status);
      return response;
    } catch (error) {
      console.error("Error updating role:", error);
      throw error;
    }
  },

  // Métodos privados (requieren token)
  updateUserProfile: async (userData) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userId = await getUserIdFromToken(token);
      return apiPrivate.put('/users/perfil', userData);
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  },

  getUserProfile: async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userId = await getUserIdFromToken(token);

      if (!userId) throw new Error("ID de usuario no disponible");

      const [userResponse, accountResponse] = await Promise.all([
        apiPrivate.get(`/users/usuarios/${userId}`),
        apiPrivate.get(`/users/cuenta-app/by-user/${userId}`).catch(() => null),
      ]);

      return {
        data: {
          ...userResponse.data,
          nombre_usuario: accountResponse?.data?.nombre_usuario,
        },
      };
    } catch (error) {
      console.error("Error al obtener perfil:", error);
      throw error;
    }
  },
};

// Función para decodificar el token y obtener el ID del usuario
const getUserIdFromToken = async (token) => {
  if (!token) return null;

  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    const payload = JSON.parse(jsonPayload);
    return payload.id_usuario;
  } catch (error) {
    console.error("Error al decodificar token:", error);
    return null;
  }
};
