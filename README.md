# Mis Notas

Una aplicacion para guardar notas desde el navegador. Simple, tranquila y pensada para que cualquiera pueda usarla, incluida gente neurodivergente.

## Que hace

- Guarda las notas en una base de datos local (un archivo simple en tu computadora).
- Si cierras la app y la vuelves a abrir, tus notas siguen ahi.
- Tiene un boton para cambiar el tipo de letra entre 4 opciones.
- Colores calmados, botones grandes y texto que se lee facil.

## Requisitos

- Tener Node.js instalado (version 14 o superior).

## Como se abre

En la carpeta de la app, abre una terminal y escribe:

```
npm start
```

Despues abre tu navegador en: `http://localhost:3000`

Para cerrar la app, vuelve a la terminal y presiona `Ctrl + C`.

## Como se usa

1. Toca **"+ Nota nueva"** para empezar una nota.
2. Escribe un titulo (opcional) y tu texto.
3. Toca **"Guardar"** cuando termines.
4. Para ver una nota, solo tocala en la lista.
5. Para borrarla, abrela y toca **"Borrar nota"**.
6. Con **"Volver"** regresas a la lista.

Truco: tambien puedes guardar con `Ctrl + S`.

## Cambiar el tipo de letra

Arriba a la derecha hay 4 botones:

- **Arial** — clasica y simple.
- **Verdana** — espacios amplios, con la b y la q bien distintas.
- **Amable** — redondeada y relajada (Comic Sans o similar).
- **Georgia** — estilo libro con remates.

La app recuerda cual elegiste para la proxima vez.

## Como funciona por dentro

- `server.js` — el servidor. Cuida la base de datos y muestra las paginas.
- `public/` — la parte visual (HTML, CSS y JavaScript del navegador).
- `data/notes.json` — la base de datos. Es un archivo de texto donde estan tus notas. No lo borres a mano.

Los cambios se guardan solos cada vez que guardas o borras una nota.

## Notas tecnicas para gente curiosa

- La base de datos son archivos JSON, guardados con Node.js. No necesita instalar nada extra (sin paquetes externos).
- Todo corre en tu computadora (localhost). Nada se sube a internet.