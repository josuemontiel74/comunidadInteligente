const API_URL = "http://localhost:3001/api";

const parqueaderoService = {
  /**
   * Obtiene el token del localStorage
   * @returns {string|null} Token de autenticación
   */
  getToken() {
    return localStorage.getItem("token");
  },

  /**
   * Obtiene los headers necesarios para las peticiones
   * @returns {Object} Headers con autenticación y content-type
   */
  getHeaders() {
    const token = this.getToken();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "Cache-Control": "no-cache",
    };
  },

  /**
   * Maneja errores de las peticiones HTTP
   * @param {Response} response - Respuesta del fetch
   * @throws {Error} Error con mensaje descriptivo
   */
  async handleResponse(response) {
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        throw new Error("Sesión expirada. Por favor inicia sesión nuevamente.");
      }
      if (response.status === 403) {
        throw new Error("No tienes permisos para realizar esta acción.");
      }
      if (response.status === 404) {
        throw new Error("Recurso no encontrado.");
      }
      if (response.status === 500) {
        throw new Error("Error en el servidor. Intenta nuevamente.");
      }
      throw new Error(`Error en la petición: ${response.status}`);
    }
    return await response.json();
  },

  /**
   * Obtiene todos los parqueaderos
   * @returns {Promise<Array>} Lista de parqueaderos
   */
  async obtenerParqueaderos() {
    try {
      const response = await fetch(`${API_URL}/parqueadero`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse(response);
      return data.body || [];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene un parqueadero específico por su código
   * @param {string} codigoParqueadero - Código del parqueadero
   * @returns {Promise<Object>} Información del parqueadero
   */
  async obtenerParqueaderoPorCodigo(codigoParqueadero) {
    try {
      const response = await fetch(
        `${API_URL}/parqueadero/${codigoParqueadero}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        },
      );

      const data = await this.handleResponse(response);
      return data.body;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Asigna un espacio de parqueadero
   * @param {string} codigoParqueadero - Código del parqueadero
   * @param {number|string} tipoVehiculo - ID del tipo de vehículo (1: Carro, 2: Moto)
   * @returns {Promise<Object>} Respuesta de la asignación
   */
  async asignarEspacio(codigoParqueadero, tipoVehiculo = 1) {
    try {
      const body = {
        estadoId: 3, // Estado ocupado
        tipoVehiculo: parseInt(tipoVehiculo),
      };

      const response = await fetch(
        `${API_URL}/parqueadero/${codigoParqueadero}`,
        {
          method: "PATCH",
          headers: this.getHeaders(),
          body: JSON.stringify(body),
        },
      );

      const data = await this.handleResponse(response);
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Libera un espacio de parqueadero
   * @param {string} codigoParqueadero - Código del parqueadero
   * @returns {Promise<Object>} Respuesta de la liberación
   */
  async liberarEspacio(codigoParqueadero) {
    try {
      const body = {
        estadoId: 4, // Estado libre
      };

      const response = await fetch(
        `${API_URL}/parqueadero/${codigoParqueadero}`,
        {
          method: "PATCH",
          headers: this.getHeaders(),
          body: JSON.stringify(body),
        },
      );

      const data = await this.handleResponse(response);
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Actualiza el estado de un parqueadero
   * @param {string} codigoParqueadero - Código del parqueadero
   * @param {Object} datosActualizacion - Datos a actualizar
   * @returns {Promise<Object>} Respuesta de la actualización
   */
  async actualizarEstado(codigoParqueadero, datosActualizacion) {
    try {
      const response = await fetch(
        `${API_URL}/parqueadero/${codigoParqueadero}`,
        {
          method: "PATCH",
          headers: this.getHeaders(),
          body: JSON.stringify(datosActualizacion),
        },
      );

      const data = await this.handleResponse(response);
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene estadísticas de los parqueaderos
   * @returns {Promise<Object>} Estadísticas calculadas
   */
  async obtenerEstadisticas() {
    try {
      const parqueaderos = await this.obtenerParqueaderos();

      const stats = {
        total: parqueaderos.length,
        libres: parqueaderos.filter((p) => p.estadoId === 4).length,
        ocupados: parqueaderos.filter((p) => p.estadoId === 3).length,
        carros: parqueaderos.filter((p) => p.tipoVehiculoId === 1).length,
        motos: parqueaderos.filter((p) => p.tipoVehiculoId === 2).length,
        porcentajeOcupacion:
          parqueaderos.length > 0
            ? Math.round(
                (parqueaderos.filter((p) => p.estadoId === 3).length /
                  parqueaderos.length) *
                  100,
              )
            : 0,
      };

      return stats;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Filtra parqueaderos por estado
   * @param {Array} parqueaderos - Lista de parqueaderos
   * @param {string} estado - Estado a filtrar ('libre' o 'ocupado')
   * @returns {Array} Parqueaderos filtrados
   */
  filtrarPorEstado(parqueaderos, estado) {
    if (estado === "libre") {
      return parqueaderos.filter((p) => p.estadoId === 4);
    }
    if (estado === "ocupado") {
      return parqueaderos.filter((p) => p.estadoId === 3);
    }
    return parqueaderos;
  },

  /**
   * Filtra parqueaderos por tipo de vehículo
   * @param {Array} parqueaderos - Lista de parqueaderos
   * @param {number} tipoVehiculo - Tipo de vehículo (1: Carro, 2: Moto)
   * @returns {Array} Parqueaderos filtrados
   */
  filtrarPorTipoVehiculo(parqueaderos, tipoVehiculo) {
    return parqueaderos.filter((p) => p.tipoVehiculoId === tipoVehiculo);
  },

  /**
   * Busca parqueaderos por código
   * @param {Array} parqueaderos - Lista de parqueaderos
   * @param {string} termino - Término de búsqueda
   * @returns {Array} Parqueaderos que coinciden con la búsqueda
   */
  buscarPorCodigo(parqueaderos, termino) {
    if (!termino) return parqueaderos;
    const terminoLower = termino.toLowerCase();
    return parqueaderos.filter((p) =>
      p.codigoParqueadero.toLowerCase().includes(terminoLower),
    );
  },

  /**
   * Verifica si un espacio está disponible
   * @param {string} codigoParqueadero - Código del parqueadero
   * @returns {Promise<boolean>} true si está disponible, false si está ocupado
   */
  async estaDisponible(codigoParqueadero) {
    try {
      const parqueadero =
        await this.obtenerParqueaderoPorCodigo(codigoParqueadero);
      return parqueadero.estadoId === 4;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene todos los espacios disponibles
   * @returns {Promise<Array>} Lista de espacios disponibles
   */
  async obtenerEspaciosDisponibles() {
    try {
      const parqueaderos = await this.obtenerParqueaderos();
      return parqueaderos.filter((p) => p.estadoId === 4);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene todos los espacios ocupados
   * @returns {Promise<Array>} Lista de espacios ocupados
   */
  async obtenerEspaciosOcupados() {
    try {
      const parqueaderos = await this.obtenerParqueaderos();
      return parqueaderos.filter((p) => p.estadoId === 3);
    } catch (error) {
      throw error;
    }
  },
};

export default parqueaderoService;
