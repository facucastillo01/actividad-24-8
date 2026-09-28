import request from "supertest";
import servidor from "./app.js";

afterAll(() => {
  servidor.close();
});

describe("GET /salud (ejemplo base)", () => {
  it("responde 200 con estado ok", async () => {
    const respuesta = await request(servidor).get("/salud");
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.estado).toBe("ok");
  });

  it("responde 404 en una ruta inexistente", async () => {
    const respuesta = await request(servidor).get("/ruta-inexistente");
    expect(respuesta.status).toBe(404);
  });
});

/*
  Nuevo endpoint: POST /api/tareas
  Reglas (escritas como tests ANTES de programar la función):
  - Body JSON con "titulo" (string, mínimo 3 caracteres sin espacios sobrantes)
    y "prioridad" ("baja" | "media" | "alta").
  - Éxito: 201 + tarea creada { id, titulo, prioridad, completada: false }
    + encabezado Location con la URL del recurso nuevo.
  - JSON malformado: 400.
  - Datos que no cumplen las reglas: 422.
*/
describe("POST /api/tareas", () => {
  it("crea la tarea y responde 201 con Location", async () => {
    const respuesta = await request(servidor)
      .post("/api/tareas")
      .send({ titulo: "Estudiar Node", prioridad: "alta" });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.data).toMatchObject({
      titulo: "Estudiar Node",
      prioridad: "alta",
      completada: false
    });
    expect(Number.isInteger(respuesta.body.data.id)).toBe(true);
    expect(respuesta.headers.location).toBe(`/api/tareas/${respuesta.body.data.id}`);
  });

  it("recorta espacios del título antes de guardarlo", async () => {
    const respuesta = await request(servidor)
      .post("/api/tareas")
      .send({ titulo: "  Hacer TP  ", prioridad: "media" });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.data.titulo).toBe("Hacer TP");
  });

  it("asigna ids distintos a tareas distintas", async () => {
    const a = await request(servidor).post("/api/tareas").send({ titulo: "Tarea uno", prioridad: "baja" });
    const b = await request(servidor).post("/api/tareas").send({ titulo: "Tarea dos", prioridad: "baja" });
    expect(a.body.data.id).not.toBe(b.body.data.id);
  });

  it("responde 400 si el JSON está mal formado", async () => {
    const respuesta = await request(servidor)
      .post("/api/tareas")
      .set("Content-Type", "application/json")
      .send("{esto no es json");

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error.code).toBe("INVALID_JSON");
  });

  it("responde 422 si el título es muy corto", async () => {
    const respuesta = await request(servidor)
      .post("/api/tareas")
      .send({ titulo: " ab ", prioridad: "alta" });

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error.code).toBe("INVALID_TITLE");
  });

  it("responde 422 si el título no es un string", async () => {
    const respuesta = await request(servidor)
      .post("/api/tareas")
      .send({ titulo: 123, prioridad: "alta" });

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error.code).toBe("INVALID_TITLE");
  });

  it("responde 422 si la prioridad no es válida", async () => {
    const respuesta = await request(servidor)
      .post("/api/tareas")
      .send({ titulo: "Estudiar Node", prioridad: "urgente" });

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error.code).toBe("INVALID_PRIORITY");
  });
});
