const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = 3000;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "notes.json");
const PUBLIC_DIR = path.join(__dirname, "public");

let notes = [];

// Aqui cargo mis notas guardadas para que esten cuando abro la app de nuevo.
function cargarNotas() {
  try {
    const datos = fs.readFileSync(DATA_FILE, "utf8");
    notes = JSON.parse(datos);
    if (!Array.isArray(notes)) notes = [];
  } catch {
    notes = [];
  }
}

// Esta es la base de datos: un archivo de texto donde guardo todo.
function guardarNotas() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(notes, null, 2), "utf8");
}

function leerCuerpo(req) {
  return new Promise((resolve, reject) => {
    let datos = "";
    req.on("data", (trozo) => {
      datos += trozo;
      if (datos.length > 1e6) reject(new Error("muy grande"));
    });
    req.on("end", () => {
      try {
        resolve(datos ? JSON.parse(datos) : {});
      } catch {
        reject(new Error("no es json"));
      }
    });
    req.on("error", reject);
  });
}

function enviarJson(res, codigo, contenido) {
  res.writeHead(codigo, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(contenido));
}

function servirArchivo(res, ruta) {
  const archivo = path.join(PUBLIC_DIR, path.normalize(ruta));
  if (!archivo.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Prohibido");
  }
  const tipos = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
  };
  fs.readFile(archivo, (err, contenido) => {
    if (err) {
      res.writeHead(404);
      return res.end("No encontrado");
    }
    const ext = path.extname(archivo);
    res.writeHead(200, { "Content-Type": tipos[ext] || "application/octet-stream" });
    res.end(contenido);
  });
}

cargarNotas();

// Este es el servidor: de un lado guarda mis notas y del otro muestra la app.
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const ruta = url.pathname;

  try {
    if (ruta === "/api/notes" && req.method === "GET") {
      enviarJson(res, 200, notes);
      return;
    }

    if (ruta === "/api/notes" && req.method === "POST") {
      const cuerpo = await leerCuerpo(req);
      const nota = {
        id: crypto.randomUUID(),
        titulo: String(cuerpo.titulo || "").slice(0, 200),
        contenido: String(cuerpo.contenido || "").slice(0, 20000),
        creada: new Date().toISOString(),
        actualizada: new Date().toISOString(),
      };
      if (!nota.titulo && !nota.contenido) {
        enviarJson(res, 400, { error: "Una nota vacia no se puede guardar" });
        return;
      }
      notes.push(nota);
      guardarNotas();
      enviarJson(res, 201, nota);
      return;
    }

    const coincide = ruta.match(/^\/api\/notes\/([\w-]+)$/);
    if (coincide) {
      const id = coincide[1];
      const indice = notes.findIndex((n) => n.id === id);

      if (req.method === "PUT") {
        if (indice === -1) {
          enviarJson(res, 404, { error: "Nota no encontrada" });
          return;
        }
        const cuerpo = await leerCuerpo(req);
        const titulo = String(cuerpo.titulo !== undefined ? cuerpo.titulo : notes[indice].titulo).slice(0, 200);
        const contenido = String(cuerpo.contenido !== undefined ? cuerpo.contenido : notes[indice].contenido).slice(0, 20000);
        if (!titulo && !contenido) {
          enviarJson(res, 400, { error: "No se puede dejar la nota vacia" });
          return;
        }
        notes[indice].titulo = titulo;
        notes[indice].contenido = contenido;
        notes[indice].actualizada = new Date().toISOString();
        guardarNotas();
        enviarJson(res, 200, notes[indice]);
        return;
      }

      if (req.method === "DELETE") {
        if (indice === -1) {
          enviarJson(res, 404, { error: "Nota no encontrada" });
          return;
        }
        notes.splice(indice, 1);
        guardarNotas();
        enviarJson(res, 200, { ok: true });
        return;
      }
    }

    if (ruta === "/" || ruta === "") {
      servirArchivo(res, "/index.html");
      return;
    }

    servirArchivo(res, ruta);
  } catch {
    enviarJson(res, 500, { error: "Algo salio mal" });
  }
});

server.listen(PORT, () => {
  console.log(`Mis Notas esta corriendo en: http://localhost:${PORT}`);
});