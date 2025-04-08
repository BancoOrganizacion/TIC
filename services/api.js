import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

//const API_GATEWAY = 'http://192.168.0.104:3000';
const API_GATEWAY = "http://192.168.100.101:3000";
//emulador android
//const API_GATEWAY = 'http://10.0.2.2:3000';

// Cliente para peticiones que NO requieren autenticación
const apiPublic = axios.create({
  baseURL: API_GATEWAY,
});

// Cliente para peticiones que requieren autenticación
const apiPrivate = axios.create({
  baseURL: API_GATEWAY,
});

// Interceptor para agregar el token solo a las peticiones autenticadas
apiPrivate.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error al obtener token:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Servicios de autenticación (no requieren token)
export const authService = {
  login: (username, password) => {
    return apiPublic.post("/auth/auth/login", { username, password });
  },
  generateVerificationCode: (userId) => {
    return apiPrivate.post('/auth/codigo/generar', { userId });
  },

  validateVerificationCode: (userId, code) => {
    return apiPrivate.post('/auth/codigo/validar', { userId, code });
  },

  getTelegramLink: (userId) => {
    return apiPrivate.get('/auth/telegram/link', { 
      params: { userId } 
    });
  },
};

// Servicios de usuarios
export const userService = {
  // Métodos públicos (no requieren token)
  getRoles: () => {
    return apiPublic.get("/users/roles");
  },
  createUser: (userData) => {
    return apiPublic.post("/users/usuarios", userData);
  },

  // Métodos privados (requieren token)
  updateUserProfile: async (userData) => {
    try {
      // Get user ID from token instead of relying on userData.id
      const token = await AsyncStorage.getItem("token");
      const userId = await getUserIdFromToken(token);

      if (!userId) {
        throw new Error("No se pudo obtener el ID del usuario");
      }

      return apiPrivate.put(`/users/usuarios/${userId}`, userData);
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  },

getUserProfile: async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const userId = await getUserIdFromToken(token);
    
    if (!userId) throw new Error('ID de usuario no disponible');
    
    const [userResponse, accountResponse] = await Promise.all([
      apiPrivate.get(`/users/usuarios/${userId}`),
      apiPrivate.get(`/users/cuenta-app/by-user/${userId}`).catch(() => null)
    ]);
    
    return {
      data: {
        ...userResponse.data,
        nombre_usuario: accountResponse?.data?.nombre_usuario
      }
    };
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    throw error;
  }
}

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

