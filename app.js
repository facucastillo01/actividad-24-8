import { createServer } from "node:http";

const puerto = Number(process.env.PORT ?? 3000);

const PRIORIDADES = ["baja", "media", "alta"];
const tareas = [];
let siguienteId = 1;

function enviarJson(respuesta, estado, cuerpo, encabezados = {}) {
  for (const [nombre, valor] of Object.entries(encabezados)) {
    respuesta.setHeader(nombre, valor);
  }
  respuesta.writeHead(estado);
  respuesta.end(JSON.stringify(cuerpo));
}

function enviarError(respuesta, estado, code, message) {
  enviarJson(respuesta, estado, { error: { code, message } });
}

function leerCuerpo(solicitud) {
  return new Promise((resolve, reject) => {
    let texto = "";
    solicitud.on("data", (fragmento) => {
      texto += fragmento;
    });
    solicitud.on("end", () => resolve(texto));
    solicitud.on("error", reject);
  });
}

// Devuelve { titulo, prioridad } válidos o un objeto { error: { code, message } }
function validarCrearTarea(datos) {
  if (typeof datos !== "object" || datos === null || Array.isArray(datos)) {
    return { error: { code: "INVALID_BODY", message: "El cuerpo debe ser un objeto JSON" } };
  }
  if (typeof datos.titulo !== "string" || datos.titulo.trim().length < 3) {
    return { error: { code: "INVALID_TITLE", message: "El título debe tener al menos tres caracteres" } };
  }
  if (typeof datos.prioridad !== "string" || !PRIORIDADES.includes(datos.prioridad)) {
    return { error: { code: "INVALID_PRIORITY", message: "La prioridad debe ser baja, media o alta" } };
  }
  return { titulo: datos.titulo.trim(), prioridad: datos.prioridad };
}

async function crearTarea(solicitud, respuesta) {
  let datos;
  try {
    datos = JSON.parse(await leerCuerpo(solicitud));
  } catch {
    return enviarError(respuesta, 400, "INVALID_JSON", "El cuerpo no es un JSON válido");
  }

  const resultado = validarCrearTarea(datos);
  if (resultado.error) {
    const estado = resultado.error.code === "INVALID_BODY" ? 400 : 422;
    return enviarError(respuesta, estado, resultado.error.code, resultado.error.message);
  }

  const tarea = {
    id: siguienteId++,
    titulo: resultado.titulo,
    prioridad: resultado.prioridad,
    completada: false
  };
  tareas.push(tarea);

  enviarJson(respuesta, 201, { data: tarea }, { Location: `/api/tareas/${tarea.id}` });
}

const servidor = createServer((solicitud, respuesta) => {
  respuesta.setHeader("Content-Type", "application/json; charset=utf-8");

  if (solicitud.method === "GET" && solicitud.url === "/salud") {
    return enviarJson(respuesta, 200, { estado: "ok", fecha: new Date().toISOString() });
  }

  if (solicitud.method === "POST" && solicitud.url === "/api/tareas") {
    return crearTarea(solicitud, respuesta);
  }

  enviarError(respuesta, 404, "NOT_FOUND", "Recurso no encontrado");
});

if (process.env.NODE_ENV !== "test") {
  servidor.listen(puerto, () => {
    console.log(`Servidor disponible en http://localhost:${puerto}`);
  });
}

export default servidor;
