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
const campoTitulo = document.getElementById("campo-titulo");

let notas = [];
let notaActual = null;
let modoNueva = false;
let guardando = false;

const ETIQUETAS_FECHA = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

// La nota viene del servidor, por eso la pido con fetch.
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

// Cuando hago clic en una nota de la lista, la abro para leerla o editarla.
function abrirNota(id) {
  const nota = notas.find((n) => n.id === id);
  if (!nota) return;
  notaActual = nota;
  modoNueva = false;
  campoTitulo.value = nota.titulo;
  campoNota.value = nota.contenido;
  textoFecha.textContent = nota.actualizada ? "Editada: " + fechaBonita(nota.actualizada) : "";
  pistaGuardado.textContent = "Listo";
  panelListas.hidden = true;
  panelEditor.hidden = false;
  campoTitulo.focus();
}

// Una nota nueva todavia no se guarda: recien llega a la base de datos al darle a Guardar.
function abrirNuevaNota() {
  notaActual = null;
  modoNueva = true;
  campoTitulo.value = "";
  campoNota.value = "";
  textoFecha.textContent = "";
  pistaGuardado.textContent = "";
  panelListas.hidden = true;
  panelEditor.hidden = false;
  campoTitulo.focus();
}

function volverALista() {
  notaActual = null;
  modoNueva = false;
  formulario.reset();
  restaurarPlaceholder(campoNota);
  restaurarPlaceholder(campoTitulo);
  panelEditor.hidden = true;
  panelListas.hidden = false;
}

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if (!notaActual && !modoNueva) return;
  if (guardando) return;

  const titulo = campoTitulo.value.trim();
  const contenido = campoNota.value.trim();
  if (!titulo && !contenido) {
    mostrarAviso("Escribe algo antes de guardar.");
    return;
  }

  guardando = true;
  pistaGuardado.textContent = "Guardando...";
  try {
    let guardada;
    if (modoNueva) {
      guardada = await pedir("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, contenido }),
      });
      notas.unshift(guardada);
    } else {
      guardada = await pedir(`/api/notes/${notaActual.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, contenido }),
      });
      const indice = notas.findIndex((n) => n.id === guardada.id);
      if (indice !== -1) notas[indice] = guardada;
    }
    notaActual = guardada;
    modoNueva = false;
    pintarNotas();
    textoFecha.textContent = "Editada: " + fechaBonita(guardada.actualizada);
    pistaGuardado.textContent = "Guardada";
  } catch (error) {
    mostrarAviso(error.message);
    pistaGuardado.textContent = "No se pudo guardar";
  } finally {
    guardando = false;
  }
});

botonBorrar.addEventListener("click", async () => {
  if (modoNueva) {
    volverALista();
    return;
  }
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

botonNueva.addEventListener("click", abrirNuevaNota);
botonVolver.addEventListener("click", volverALista);

// Con Ctrl + S guardo igual que si tocaras Guardar.
document.addEventListener("keydown", (evento) => {
  if ((evento.ctrlKey || evento.metaKey) && evento.key === "s") {
    evento.preventDefault();
    if (!panelEditor.hidden) formulario.dispatchEvent(new Event("submit", { cancelable: true }));
  }
});

function restaurarPlaceholder(campo) {
  const original = campo.dataset.placeholderOriginal;
  if (original !== undefined) campo.setAttribute("placeholder", original);
}

// El texto gris es solo un ejemplo: al hacer clic desaparece y me deja escribir libre.
function placeholderQueSeVa(campo) {
  campo.dataset.placeholderOriginal = campo.getAttribute("placeholder") || "";
  campo.addEventListener("focus", () => campo.setAttribute("placeholder", ""));
  campo.addEventListener("blur", () => restaurarPlaceholder(campo));
}
placeholderQueSeVa(campoNota);
placeholderQueSeVa(campoTitulo);

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

// El modo oscuro: al hacer clic en el boton cambio los colores y lo recuerdo para la proxima vez.
const botonTema = document.getElementById("boton-tema");

function pintarTema(oscuro) {
  document.body.classList.toggle("dark", oscuro);
  botonTema.textContent = oscuro ? "Modo claro" : "Modo oscuro";
  botonTema.setAttribute("aria-pressed", String(oscuro));
}

botonTema.addEventListener("click", () => {
  const oscuro = !document.body.classList.contains("dark");
  pintarTema(oscuro);
  localStorage.setItem("tema-mis-notas", oscuro ? "oscuro" : "claro");
});

function iniciarTema() {
  const elegido = localStorage.getItem("tema-mis-notas");
  if (elegido) {
    pintarTema(elegido === "oscuro");
    return;
  }
  const sensor = window.matchMedia("(prefers-color-scheme: dark)");
  pintarTema(sensor.matches);
  sensor.addEventListener("change", (evento) => {
    if (!localStorage.getItem("tema-mis-notas")) pintarTema(evento.matches);
  });
}

// Al cargar la pagina traigo todas mis notas guardadas en la base de datos.
async function iniciar() {
  try {
    notas = await pedir("/api/notes");
    notas.sort((a, b) => new Date(b.actualizada) - new Date(a.actualizada));
    pintarNotas();
  } catch (error) {
    mostrarAviso("No se pudo cargar tus notas: " + error.message);
  }
  aplicarFuente(localStorage.getItem("fuente-mis-notas") || "arial");
  iniciarTema();
}

iniciar();