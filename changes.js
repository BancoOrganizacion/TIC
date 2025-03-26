/*
users-microservice\src\main.ts
app.enableCors(); 

// Endpoint para listar todos los usuarios
@Get()
async findAll() {
  try {
    return await this.usuariosService.findAll();
  } catch (error) {
    throw new HttpException(
      'Error al obtener los usuarios',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}





*/