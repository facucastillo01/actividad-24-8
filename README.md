# Primer servidor HTTP con Node.js (desarrollo con TDD / XP)

Nuevo endpoint: `POST /api/tareas`, desarrollado escribiendo primero los tests y después el código.

## Cómo correrlo

```bash
npm install
npm test          # corre los tests con Jest + Supertest
npm start         # levanta el servidor en http://localhost:3000
```

## Ciclo XP / TDD seguido

1. **Rojo:** se escribieron los tests de `POST /api/tareas` en `app.test.js` con el servidor del punto 7 sin el endpoint. Resultado: 7 tests fallando, 2 pasando (los del ejemplo base).
2. **Verde:** se escribió el código mínimo en `app.js` (lectura del body, validación y creación de la tarea) hasta que pasaron los 9 tests.
3. **Refactor:** se extrajeron funciones auxiliares (`enviarJson`, `enviarError`, `leerCuerpo`, `validarCrearTarea`) manteniendo los tests en verde.

## Reglas del endpoint

| Caso | Respuesta |
|---|---|
| Datos válidos | `201 Created` + `{ data: tarea }` + encabezado `Location` |
| JSON mal formado | `400` (`INVALID_JSON`) |
| Título con menos de 3 caracteres o que no es string | `422` (`INVALID_TITLE`) |
| Prioridad distinta de `baja`, `media`, `alta` | `422` (`INVALID_PRIORITY`) |

## Pruebas con curl

```bash
# Crear una tarea (201)
curl -i -X POST -H "Content-Type: application/json" \
  -d '{"titulo":"Estudiar API","prioridad":"alta"}' \
  http://localhost:3000/api/tareas

# Título muy corto (422)
curl -i -X POST -H "Content-Type: application/json" \
  -d '{"titulo":"ab","prioridad":"alta"}' \
  http://localhost:3000/api/tareas

# Prioridad inválida (422)
curl -i -X POST -H "Content-Type: application/json" \
  -d '{"titulo":"Estudiar API","prioridad":"urgente"}' \
  http://localhost:3000/api/tareas

# JSON mal formado (400)
curl -i -X POST -H "Content-Type: application/json" \
  -d '{esto no es json' \
  http://localhost:3000/api/tareas

# Ruta inexistente (404)
curl -i http://localhost:3000/ruta-inexistente
```

En Postman: método `POST`, URL `http://localhost:3000/api/tareas`, Body → raw → JSON.
