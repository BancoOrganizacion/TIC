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
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("Using token in request:", token.substring(0, 10) + "...");
      } else {
        console.warn("No token found for request to:", config.url);
        // Redirigir a login si no hay token
        NavigationService.reset("Login");
      }
      return config;
    } catch (error) {
      console.error("Error getting token:", error);
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Fragmento mejorado para el interceptor de respuesta de apiPrivate
// Para incluir en tu archivo de servicios API

apiPrivate.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Comprobar si el error es por token expirado
    if (
      error.response?.status === 401 &&
      (error.response?.data?.message === "Token inválido o expirado" ||
        error.response?.data?.message === "jwt expired")
    ) {
      console.log("Token expirado, intentando renovar sesión...");

      try {
        // Intentar obtener el refreshToken
        const refreshToken = await AsyncStorage.getItem("refreshToken");

        if (refreshToken) {
          // Si hay un refreshToken, intentar renovar el token
          const response = await apiPublic.post("/auth/auth/refresh", {
            refreshToken,
          });

          if (response.data && response.data.token) {
            // Guardar el nuevo token
            await AsyncStorage.setItem("token", response.data.token);
            if (response.data.refreshToken) {
              await AsyncStorage.setItem(
                "refreshToken",
                response.data.refreshToken
              );
            }

            // Repetir la solicitud original con el nuevo token
            const originalRequest = error.config;
            originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
            return apiPrivate(originalRequest);
          }
        }

        // Si no se puede renovar, redirigir al login
        console.log("No se pudo renovar el token, redirigiendo a login");
        await AsyncStorage.multiRemove(["token", "refreshToken"]);

        // Usar el navigationRef para navegar (asegúrate de tenerlo configurado)
        if (navigationRef && navigationRef.current) {
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        }

        // Mostrar alerta al usuario
        Alert.alert(
          "Sesión expirada",
          "Tu sesión ha expirado. Por favor, inicia sesión nuevamente."
        );
      } catch (refreshError) {
        // Si falla la renovación, limpiar tokens y redirigir a login
        console.error("Error renovando token:", refreshError);
        await AsyncStorage.multiRemove(["token", "refreshToken"]);

        // Usar el navigationRef para navegar
        if (navigationRef && navigationRef.current) {
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        }
      }
    }

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

      let deepLink = response.data.deepLink;
      if (!deepLink.startsWith("https://") && !deepLink.startsWith("tg://")) {
        // Assume it's a bot username and format properly
        deepLink = `https://t.me/${deepLink.replace("@", "")}`;
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
      return apiPrivate.put("/users/usuarios/perfil", userData);
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

export const accountService = {
  // Get user's accounts
  getMyAccounts: async () => {
    try {
      const response = await apiPrivate.get("/accounts/cuentas/mis-cuentas");
      console.log("My accounts response:", response.status);
      return response;
    } catch (error) {
      console.error("Error getting accounts:", error);
      throw error;
    }
  },

  // Create a new account
  createAccount: async (accountType) => {
    try {
      const response = await apiPrivate.post("/accounts/cuentas", {
        tipo_cuenta: accountType, // 'CORRIENTE' or 'AHORROS'
      });
      console.log("Create account response:", response.status);
      return response;
    } catch (error) {
      console.error("Error creating account:", error);
      throw error;
    }
  },

  // Get account by number
  getAccountByNumber: async (accountNumber) => {
    try {
      const response = await apiPrivate.get(
        `/accounts/cuentas/numero/${accountNumber}`
      );
      console.log("Account by number response:", response.status);
      return response;
    } catch (error) {
      console.error("Error getting account by number:", error);
      throw error;
    }
  },

  // Cancel an account
  cancelAccount: async (accountId) => {
    try {
      const response = await apiPrivate.delete(
        `/accounts/cuentas/${accountId}`
      );
      console.log("Cancel account response:", response.status);
      return response;
    } catch (error) {
      console.error("Error canceling account:", error);
      throw error;
    }
  },

  // Get account transactions
  getAccountTransactions: async (accountId) => {
    try {
      const response = await apiPrivate.get(
        `/accounts/cuentas/${accountId}/movimientos`
      );
      console.log("Account transactions response:", response.status);
      return response;
    } catch (error) {
      console.error("Error getting account transactions:", error);
      throw error;
    }
  },

  // Add account restriction
  // Método corregido para addAccountRestriction
  // Método mejorado para addAccountRestriction con mejor debugging
  addAccountRestriction: async (accountId, restriction) => {
    try {
      // Verificar token antes de hacer la petición
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("No hay token disponible");
      }

      // Validar que el ID de patrón de autenticación sea válido para MongoDB (24 caracteres hexadecimales)
      const isValidMongoId = (id) => {
        return id && /^[0-9a-fA-F]{24}$/.test(id);
      };

      // Asegurar que los montos son números
      const payload = {
        monto_desde: Number(restriction.monto_desde),
        monto_hasta: Number(restriction.monto_hasta),
      };

      // Solo incluir patron_autenticacion si es un ID válido de MongoDB
      if (
        restriction.patron_autenticacion &&
        isValidMongoId(restriction.patron_autenticacion)
      ) {
        payload.patron_autenticacion = restriction.patron_autenticacion;
      } else if (restriction.patron_autenticacion) {
        console.warn(
          "ID de patrón de autenticación no válido:",
          restriction.patron_autenticacion
        );
        // Si se proporcionó un ID pero no es válido, intentamos usar uno de muestra válido
        payload.patron_autenticacion = "60d5ecb74e4e8d1b5cbf2457"; // ID MongoDB de ejemplo
      }

      // También podemos incluir huellas_requeridas si está disponible
      if (typeof restriction.huellas_requeridas === "number") {
        payload.huellas_requeridas = restriction.huellas_requeridas;
      } else if (restriction.patron_autenticacion) {
        // Si hay un patrón de autenticación pero no se especificó huellas_requeridas,
        // podemos asumir que se requiere al menos 1 huella
        payload.huellas_requeridas = 1;
      }

      console.log(
        "URL completa:",
        `${API_GATEWAY}/accounts/cuentas/${accountId}/restricciones`
      );
      console.log("Headers:", {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.substring(0, 15)}...`,
      });
      console.log("Enviando payload:", JSON.stringify(payload, null, 2));

      // Hacer la solicitud con logging detallado
      const response = await apiPrivate.post(
        `/accounts/cuentas/${accountId}/restricciones`,
        payload
      );

      console.log("Respuesta del servidor:", {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
      });

      return response;
    } catch (error) {
      // Logging detallado del error
      console.error("Error detallado al añadir restricción:", {
        message: error.message,
        config: error.config
          ? {
              url: error.config.url,
              method: error.config.method,
              data: error.config.data,
            }
          : "No hay config",
        response: error.response
          ? {
              status: error.response.status,
              statusText: error.response.statusText,
              data: error.response.data,
            }
          : "No hay response",
      });

      // Si el error es de red (timeout, sin conexión, etc.)
      if (!error.response) {
        console.error("Error de red:", error.message);
        throw new Error("Error de conexión. Verifica tu conexión a internet.");
      }

      // Si el error es de autenticación
      if (error.response?.status === 401) {
        console.error("Error de autenticación:", error.response?.data);
        throw new Error("Sesión expirada o inválida");
      }

      // Si el error es de validación (400)
      if (error.response?.status === 400) {
        console.error("Error de validación:", error.response?.data);
        let errorMsg = "Los datos enviados no son válidos";

        // Intentar extraer el mensaje de error específico
        if (error.response?.data?.message?.message) {
          if (Array.isArray(error.response.data.message.message)) {
            errorMsg = error.response.data.message.message.join(", ");
          } else {
            errorMsg = error.response.data.message.message;
          }
        } else if (error.response?.data?.message) {
          errorMsg = error.response.data.message;
        }

        throw new Error(errorMsg);
      }

      // Otros errores
      throw error;
    }
  },

  // Remove account restriction
  removeAccountRestriction: async (accountId, restrictionId) => {
    try {
      const response = await apiPrivate.delete(
        `/accounts/cuentas/${accountId}/restricciones/${restrictionId}`
      );
      console.log("Remove restriction response:", response.status);
      return response;
    } catch (error) {
      console.error("Error removing restriction:", error);
      throw error;
    }
  },

  // Get account restrictions with mock data
  getAccountRestrictions: async (accountId) => {
    return apiPrivate.get(`/accounts/cuentas/${accountId}/restricciones`);
  },

  updateAccountRestriction: async (accountId, restrictionId, updates) => {
    return apiPrivate.put(
      `/accounts/cuentas/${accountId}/restricciones/${restrictionId}`,
      updates
    );
  },

  // Método MOCK para huellas
  getFingerprintPatterns: async () => {
    // Simular delay de red
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      data: [
        {
          _id: "mock_1",
          nombre: "Huella Derecha",
          descripcion: "Dedo índice derecho",
          requiere_autenticacion: true,
        },
        {
          _id: "mock_2",
          nombre: "Huella Izquierda",
          descripcion: "Dedo índice izquierdo",
          requiere_autenticacion: true,
        },
      ],
    };
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
