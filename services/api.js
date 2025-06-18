import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Constante para la URL base del API
const API_GATEWAY = "http://192.168.18.21:3000";
// Alternativa para emulador android:
// const API_GATEWAY = 'http://10.0.2.2:3000';

// Cliente para peticiones que NO requieren autenticación
const apiPublic = axios.create({
  baseURL: API_GATEWAY,
});

// Cliente para peticiones que requieren autenticación
const apiPrivate = axios.create({
  baseURL: API_GATEWAY,
});

// Configuración de interceptor para añadir token a peticiones privadas
apiPrivate.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación y renovar tokens
apiPrivate.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Comprobar si el error es por token expirado
    if (
      error.response?.status === 401 &&
      (error.response?.data?.message === "Token inválido o expirado" ||
        error.response?.data?.message === "jwt expired")) {
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
      } catch (refreshError) {
        // Error renovando token
      }
    }

    return Promise.reject(error);
  }
);

// Servicio para operaciones relacionadas con cuentas bancarias
export const accountService = {
  // Get user's accounts
  getMyAccounts: async () => {
    try {
      const response = await apiPrivate.get("/accounts/cuentas/mis-cuentas"); return response;
    } catch (error) {
      throw error;
    }
  },

  // Create a new account
  createAccount: async (accountType) => {
    try {
      const response = await apiPrivate.post("/accounts/cuentas", {
        tipo_cuenta: accountType,
      }); return response;
    } catch (error) {
      throw error;
    }
  },


  // Cancel an account
  cancelAccount: async (accountId) => {
    try {
      const response = await apiPrivate.delete(
        `/accounts/cuentas/${accountId}`
      );
      return response;
    } catch (error) {
      throw error;
    }
  },  // Get account transactions with pagination
  getAccountTransactions: async (accountId, options = { page: 1, limit: 10 }) => {
    try {      const { page, limit } = options;
      console.log(`Solicitando transacciones para cuenta ${accountId}, página ${page}, límite ${limit}`);
      console.log(`DEBUGGING - accountId value: "${accountId}"`);
      console.log(`DEBUGGING - accountId type: ${typeof accountId}`);

      // Asegurar que accountId es un string limpio sin duplicaciones
      const cleanAccountId = accountId ? accountId.toString().trim() : '';
      console.log(`DEBUGGING - cleanAccountId: "${cleanAccountId}"`);

      // Usar el endpoint correcto del backend: /accounts/cuentas/movimientos con id_cuenta como query param
      const response = await apiPrivate.get('/accounts/cuentas/movimientos', {
        params: {
          id_cuenta: cleanAccountId,
          page,
          limit
        }
      });

      console.log("Account transactions response:", response.status);
      console.log("Transaction data structure:", typeof response.data, Array.isArray(response.data));

      // El backend devuelve directamente un array de movimientos
      let transactionData = [];

      if (Array.isArray(response.data)) {
        transactionData = response.data;
      } else if (response.data && Array.isArray(response.data.movimientos)) {
        transactionData = response.data.movimientos;
      } else if (response.data && typeof response.data === 'object') {
        // Buscar arrays dentro del objeto
        const possibleArrays = Object.values(response.data).filter(value => Array.isArray(value));
        if (possibleArrays.length > 0) {
          transactionData = possibleArrays[0];
        }
      }

      // Estructurar la respuesta de manera consistente
      const structuredResponse = {
        ...response,
        data: {
          data: transactionData,
          pagination: {
            page,
            limit,
            total: transactionData.length,
            pages: Math.ceil(transactionData.length / limit)
          }
        }
      };

      return structuredResponse;
    } catch (error) {
      console.error("Error getting account transactions:", error);
      console.error("Error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // Add account restriction
  addAccountRestriction: async (accountId, restriction) => {
    try {
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
      }

      console.log("Enviando payload:", JSON.stringify(payload, null, 2));

      const response = await apiPrivate.post(
        `/accounts/cuentas/${accountId}/restricciones`,
        payload
      );

      console.log("Respuesta del servidor:", {
        status: response.status,
        data: response.data,
      });

      return response;
    } catch (error) {
      console.error("Error detallado al añadir restricción:", {
        message: error.message,
        config: error.config ? {
          url: error.config.url,
          method: error.config.method,
          data: error.config.data,
        } : "No hay config",
        response: error.response ? {
          status: error.response.status,
          data: error.response.data,
        } : "No hay response",
      });
      throw error;
    }
  },

  // Get account restrictions
  getAccountRestrictions: async (accountId) => {
    try {
      const response = await apiPrivate.get(`/accounts/cuentas/${accountId}/restricciones`);
      console.log("Account restrictions response:", response.status);
      return response;
    } catch (error) {
      console.error("Error getting account restrictions:", error);
      throw error;
    }
  },

  // Update account restriction
  updateAccountRestriction: async (accountId, restrictionId, updates) => {
    try {
      const payload = {
        monto_desde: Number(updates.monto_desde),
        monto_hasta: Number(updates.monto_hasta),
      };

      if (updates.patron_autenticacion) {
        payload.patron_autenticacion = updates.patron_autenticacion;
      }

      const response = await apiPrivate.put(
        `/accounts/cuentas/${accountId}/restricciones/${restrictionId}`,
        payload
      );
      console.log("Update restriction response:", response.status);
      return response;
    } catch (error) {
      console.error("Error updating restriction:", error);
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
};

// Servicios de autenticación
export const authService = {
  login: async (username, password) => {
    console.log("Logging in with username:", username);
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

  generateVerificationCode: async () => {
    try {
      console.log("Sending verification code request");
      const response = await apiPrivate.post("/auth/auth/codigo/generar", {
        tipo: "registro",
      });
      console.log("Verification code response:", response.status);
      return response;
    } catch (error) {
      console.error("Error generating verification code:", error);
      throw error;
    }
  },

  validateVerificationCode: async (data) => {
    try {
      console.log("Validating code with data:", data);
      const validationData = {
        userId: data.userId,
        code: data.code.toString(),
      };
      const response = await apiPublic.post(
        "/auth/auth/codigo/validar",
        validationData
      );
      console.log("Validation response:", response.status, response.data);
      return response;
    } catch (error) {
      console.error("Validation error:", error);
      throw error;
    }
  },

  checkUserTelegramChat: async () => {
    try {
      console.log("Checking if user has Telegram chat linked");
      const response = await apiPrivate.post("auth/telegram/check-chat");
      console.log("Telegram chat check response:", response.data);
      return response;
    } catch (error) {
      console.error("Error checking Telegram chat:", error);
      throw error;
    }
  },
};

// Servicios de usuario
export const userService = {
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
      await AsyncStorage.setItem("token", response.data.token);
    } else if (response.data.access_token) {
      await AsyncStorage.setItem("token", response.data.access_token);
    }

    return response;
  },

  updateUserRole: async (userId, roleId) => {
    try {
      console.log(`Updating user ${userId} to role ${roleId}`);
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

  getUserProfile: async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userId = await getUserIdFromToken(token);

      if (!userId) throw new Error("ID de usuario no disponible");

      const userResponse = await apiPrivate.get(`/users/usuarios/${userId}`);
      return {
        data: {
          ...userResponse.data,
          // Aseguramos que el nombre de usuario esté disponible
          nombre_usuario: userResponse.data.nombre_usuario || await AsyncStorage.getItem("nombre_usuario"),
        },
      };
    } catch (error) {
      console.error("Error al obtener perfil:", error);
      throw error;
    }
  },

  updateUserProfile: async (userData) => {
    try {
      return apiPrivate.put("/users/usuarios/perfil", userData);
    } catch (error) {
      console.error("Error updating profile:", error);
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

// Función auxiliar para codificar/decodificar Base64
const atob = (input) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = input.replace(/=+$/, '');
  let output = '';

  for (let bc = 0, bs = 0, buffer, i = 0;
    buffer = str.charAt(i++);
    ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
      bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
  ) {
    buffer = chars.indexOf(buffer);
  }

  return output;
};

export const biometricService = {
  // Obtener todas las huellas del usuario actual
  getMyFingerprints: async () => {
    try {
      console.log("Getting user fingerprints");
      // Usar el endpoint que funciona: POST /fingerprints/get-fingers
      const response = await apiPrivate.post("/fingerprints/get-fingers");
      console.log("My fingerprints response:", response.status);

      // Formatear los datos para que coincidan con lo que espera tu UI
      if (response.data && Array.isArray(response.data)) {
        response.data = response.data.map((fingerprint, index) => {
          return {
            _id: fingerprint.dedo_patron_id,
            id: fingerprint.dedo_patron_id,
            nombre: biometricService.getFingerTypeName(fingerprint.dedo),
            descripcion: `Huella ${fingerprint.dedo.toLowerCase()}`,
            dedo: fingerprint.dedo,
            fechaRegistro: new Date().toISOString(), // Valor por defecto
            calidad: 95, // Valor por defecto ya que no tienes este campo
            selected: false // Para la UI de selección
          };
        });
      }

      return response;
    } catch (error) {
      console.error("Error getting my fingerprints:", error);
      throw error;
    }
  },

  // Crear nuevo patrón de autenticación
  createPattern: async (selectedFingerprintIds) => {
    try {
      console.log("Creating pattern with fingerprint IDs:", selectedFingerprintIds);

      if (!Array.isArray(selectedFingerprintIds) || selectedFingerprintIds.length === 0) {
        throw new Error("Se requiere al menos una huella para crear el patrón");
      }

      // Validar que todos los IDs sean válidos (formato ObjectId de MongoDB)
      const invalidIds = selectedFingerprintIds.filter(id => !id || !/^[0-9a-fA-F]{24}$/.test(id));
      if (invalidIds.length > 0) {
        throw new Error(`IDs de huella inválidos: ${invalidIds.join(', ')}`);
      }

      // Usar el endpoint /patterns con dedosPatronIds según la documentación del backend
      const response = await apiPrivate.post("/patterns", {
        dedosPatronIds: selectedFingerprintIds
      });

      console.log("Pattern created successfully:", response.data);
      return response;
    } catch (error) {
      console.error("Error creating pattern:", error);

      // Proporcionar mensajes de error más específicos
      if (error.response?.status === 400) {
        throw new Error("Datos inválidos para crear el patrón. Verifica las huellas seleccionadas.");
      } else if (error.response?.status === 401) {
        throw new Error("No autorizado. Por favor, inicia sesión nuevamente.");
      } else if (error.response?.status === 500) {
        throw new Error("Error interno del servidor. Intenta nuevamente más tarde.");
      } else if (error.message && error.message.includes("IDs de huella inválidos")) {
        throw error; // Re-throw validation errors as-is
      } else {
        throw new Error("Error al crear el patrón. Verifica tu conexión a internet.");
      }
    }
  },

  getPatternDetails: async (patternId) => {
    try {
      console.log("Getting pattern details:", patternId);

      // Primero intentar obtener información básica del patrón
      try {
        const patternResponse = await apiPrivate.get(`/patterns/${patternId}`);
        console.log("Pattern basic info:", patternResponse.data);

        // Luego intentar obtener los dedos del patrón
        try {
          const fingersResponse = await apiPrivate.get(`/patterns/${patternId}/dedos`);
          console.log("Pattern fingers:", fingersResponse.data);

          // Formatear los datos para mostrar en la UI
          const patternDetails = {
            _id: patternId,
            nombre: `Patrón ${patternId.slice(-6)}`,
            descripcion: `Patrón con ${fingersResponse.data?.dedos?.length || 0} huellas`,
            huellas: fingersResponse.data?.dedos?.map((dedo, index) => ({
              _id: dedo.id,
              nombre: dedo.nombre || biometricService.getFingerTypeName(dedo.tipo || 'DESCONOCIDO'),
              descripcion: `Huella ${index + 1}`,
              calidad: dedo.calidad || 95
            })) || [],
            cantidadHuellas: fingersResponse.data?.dedos?.length || 0,
            fechaCreacion: patternResponse.data?.fechaCreacion || new Date().toISOString(),
            activo: patternResponse.data?.activo || true
          };

          return { data: patternDetails };

        } catch (fingersError) {
          console.log("Could not get fingers details, using basic pattern info");

          // Si no podemos obtener los dedos, usar info básica del patrón
          const patternDetails = {
            _id: patternId,
            nombre: `Patrón ${patternId.slice(-6)}`,
            descripcion: `Patrón con ${patternResponse.data?.dedosPatronIds?.length || 0} huellas`,
            huellas: [],
            cantidadHuellas: patternResponse.data?.dedosPatronIds?.length || 0,
            fechaCreacion: patternResponse.data?.fechaCreacion || new Date().toISOString(),
            activo: patternResponse.data?.activo || true
          };

          return { data: patternDetails };
        }

      } catch (patternError) {
        console.log("Pattern endpoint not available, creating fallback info");

        // Si no podemos obtener información del patrón, crear información básica
        const patternDetails = {
          _id: patternId,
          nombre: `Patrón ${patternId.slice(-6)}`,
          descripcion: `Patrón biométrico`,
          huellas: [],
          cantidadHuellas: 0,
          fechaCreacion: new Date().toISOString(),
          activo: true
        };

        return { data: patternDetails };
      }

    } catch (error) {
      console.error("Error getting pattern details:", error);
      throw error;
    }
  },

  // Mapear tipos de dedos para mostrar en UI
  getFingerTypeName: (fingerType) => {
    const mapping = {
      'PULGAR_DERECHO': 'Pulgar derecho',
      'INDICE_DERECHO': 'Índice derecho',
      'MEDIO_DERECHO': 'Medio derecho',
      'ANULAR_DERECHO': 'Anular derecho',
      'MENIQUE_DERECHO': 'Meñique derecho',
      'PULGAR_IZQUIERDO': 'Pulgar izquierdo',
      'INDICE_IZQUIERDO': 'Índice izquierdo',
      'MEDIO_IZQUIERDO': 'Medio izquierdo',
      'ANULAR_IZQUIERDO': 'Anular izquierdo',
      'MENIQUE_IZQUIERDO': 'Meñique izquierdo'
    }; return mapping[fingerType] || fingerType;
  },
};