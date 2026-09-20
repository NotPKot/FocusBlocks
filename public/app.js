const listaNotas = document.getElementById("lista-notas");
const panelListas = document.getElementById("panel-listas");
const panelEditor = document.getElementById("panel-editor");
const botonNueva = document.getElementById("boton-nueva");
const botonVolver = document.getElementById("boton-volver");
const botonBorrar = document.getElementById("boton-borrar");
const textoFecha = document.getElementById("pista-fecha");
const pistaGuardado = document.getElementById("pista-guardado");
const mensaje = document.getElementById("mensaje");
const aviso = document.getElementById("aviso-error");
const formulario = document.getElementById("form-nota");
const campoNota = document.getElementById("campo-nota");

let notas = [];
let notaActual = null;
let guardando = false;

const ETIQUETAS_FECHA = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

async function pedir(url, opciones) {
  const respuesta = await fetch(url, opciones);
  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => ({}));
    throw new Error(cuerpo.error || "Hubo un problema");
  }
  return respuesta.json();
}

function mostrarAviso(texto) {
  aviso.textContent = texto;
  aviso.hidden = false;
  setTimeout(() => {
    aviso.hidden = true;
  }, 4000);
}

function fechaBonita(iso) {
  if (!iso) return "";
  return ETIQUETAS_FECHA.format(new Date(iso));
}

function recortar(texto, largo) {
  const limpio = texto.replace(/\s+/g, " ").trim();
  return limpio.length > largo ? limpio.slice(0, largo) + "..." : limpio;
}

function pintarNotas() {
  listaNotas.innerHTML = "";
  mensaje.hidden = notas.length > 0;

  notas.forEach((nota) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "item-nota";
    item.addEventListener("click", () => abrirNota(nota.id));

    const titulo = document.createElement("span");
    titulo.className = "item-nota-titulo";
    titulo.textContent = nota.titulo.trim() || "Sin titulo";

    const fecha = document.createElement("span");
    fecha.className = "item-nota-fecha";
    fecha.textContent = fechaBonita(nota.actualizada);

    const contenido = document.createElement("span");
    contenido.className = "item-nota-fecha";
    contenido.textContent = recortar(nota.contenido, 90);

    item.append(titulo, fecha, contenido);
    listaNotas.append(item);
  });
}

function abrirNota(id) {
  const nota = notas.find((n) => n.id === id);
  if (!nota) return;
  notaActual = nota;
  document.getElementById("campo-titulo").value = nota.titulo;
  campoNota.value = nota.contenido;
  textoFecha.textContent = nota.actualizada ? "Editada: " + fechaBonita(nota.actualizada) : "";
  pistaGuardado.textContent = "Listo";
  panelListas.hidden = true;
  panelEditor.hidden = false;
  document.getElementById("campo-titulo").focus();
}

function volverALista() {
  notaActual = null;
  formulario.reset();
  panelEditor.hidden = true;
  panelListas.hidden = false;
}

async function crearNota() {
  try {
    const nota = await pedir("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo: "", contenido: "" }),
    });
    notas.unshift(nota);
    pintarNotas();
    abrirNota(nota.id);
  } catch (error) {
    mostrarAviso(error.message);
  }
}

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if (!notaActual || guardando) return;

  const titulo = document.getElementById("campo-titulo").value.trim();
  const contenido = campoNota.value.trim();
  if (!titulo && !contenido) {
    mostrarAviso("Escribe algo antes de guardar.");
    return;
  }

  guardando = true;
  pistaGuardado.textContent = "Guardando...";
  try {
    const actualizada = await pedir(`/api/notes/${notaActual.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, contenido }),
    });
    const indice = notas.findIndex((n) => n.id === actualizada.id);
    if (indice !== -1) notas[indice] = actualizada;
    notaActual = actualizada;
    pintarNotas();
    textoFecha.textContent = "Editada: " + fechaBonita(actualizada.actualizada);
    pistaGuardado.textContent = "Guardada";
  } catch (error) {
    mostrarAviso(error.message);
    pistaGuardado.textContent = "No se pudo guardar";
  } finally {
    guardando = false;
  }
});

botonBorrar.addEventListener("click", async () => {
  if (!notaActual) return;
  if (!window.confirm("¿Seguro que quieres borrar esta nota? No se puede deshacer.")) return;

  try {
    await pedir(`/api/notes/${notaActual.id}`, { method: "DELETE" });
    notas = notas.filter((n) => n.id !== notaActual.id);
    pintarNotas();
    volverALista();
  } catch (error) {
    mostrarAviso(error.message);
  }
});

botonNueva.addEventListener("click", crearNota);
botonVolver.addEventListener("click", volverALista);

document.addEventListener("keydown", (evento) => {
  if ((evento.ctrlKey || evento.metaKey) && evento.key === "s") {
    evento.preventDefault();
    if (!panelEditor.hidden) formulario.dispatchEvent(new Event("submit", { cancelable: true }));
  }
});

function aplicarFuente(nombre) {
  document.body.className = "";
  if (nombre && nombre !== "arial") document.body.classList.add("fuente-" + nombre);
  localStorage.setItem("fuente-mis-notas", nombre || "arial");
  document.querySelectorAll(".btn-fuente").forEach((boton) => {
    const activa = boton.dataset.fuente === (nombre || "arial");
    boton.classList.toggle("activa", activa);
    boton.setAttribute("aria-pressed", String(activa));
  });
}

document.querySelectorAll(".btn-fuente").forEach((boton) => {
  boton.addEventListener("click", () => aplicarFuente(boton.dataset.fuente));
});

async function iniciar() {
  try {
    notas = await pedir("/api/notes");
    notas.sort((a, b) => new Date(b.actualizada) - new Date(a.actualizada));
    pintarNotas();
  } catch (error) {
    mostrarAviso("No se pudo cargar tus notas: " + error.message);
  }
  aplicarFuente(localStorage.getItem("fuente-mis-notas") || "arial");
}

iniciar();