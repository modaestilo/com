// =============================
// 🔥 Inicialización Firebase
// =============================
const firebaseConfig = {
  apiKey: "AIzaSyBEWbN1BfsNUWWOy0DpU0E7o7Ku09lcweQ",
  authDomain: "modayestilocol.firebaseapp.com",
  databaseURL: "https://modayestilocol-default-rtdb.firebaseio.com",
  projectId: "modayestilocol",
  storageBucket: "modayestilocol.appspot.com",
  messagingSenderId: "794561383601",
  appId: "1:794561383601:web:e11695d3b9ccfd2659a690"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// =============================
// 🔑 Autenticación y sesión
// =============================
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    document.getElementById("login").style.display = "none";
    document.getElementById("admin").style.display = "block";


    // Reiniciar botón a modo "Agregar"
    const boton = document.querySelector("#seccion-productos .btn-verde");
    if (boton) {
      boton.textContent = "Agregar producto";
      boton.onclick = agregarProducto;
    }

    // Cargar datos desde Firebase
    cargarProductos();
    cargarConfiguracion();
    cargarMetodosPago();
    cargarGaleriaDesdeFirestore();
    cargarQuienesSomos(); // 🔹 Agregado
  } else {
    document.getElementById("login").style.display = "block";
    document.getElementById("admin").style.display = "none";
  }
});

function loginFirebase() {
  const email = document.getElementById("correo").value.trim();
  const clave = document.getElementById("clave").value.trim();

  firebase.auth().signInWithEmailAndPassword(email, clave)
    .catch(error => alert("Error de acceso: " + error.message));
}

function cerrarSesion() {
  firebase.auth().signOut();
}

// =============================
// 🔀 Toggle secciones
// =============================
function mostrarSeccion(id) {
  const seccion = document.getElementById(`seccion-${id}`);
  if (!seccion) return;

  const yaActiva = seccion.classList.contains("activa");
  document.querySelectorAll(".seccion").forEach(sec => sec.classList.remove("activa"));
  if (!yaActiva) seccion.classList.add("activa");
}

// =============================
// 🧾 Configuración general
// =============================
function guardarConfiguracion() {
  let whatsapp = document.getElementById("configWhatsapp").value.trim();
  let whatsappPedidos = document.getElementById("configWspPedido").value.trim();

  // ✅ Limpiar WhatsApp: quitar +, espacios y dejar solo números
  if (whatsapp) {
    whatsapp = whatsapp.replace(/\D/g, ""); 
  }
  if (whatsappPedidos) {
    whatsappPedidos = whatsappPedidos.replace(/\D/g, "");
  }

  const config = {
    titulo: document.getElementById("tituloPrincipal").value.trim(),
    whatsapp: whatsapp,
    whatsappPedidos: whatsappPedidos,
    facebook: document.getElementById("configFacebook").value.trim(),
    instagram: document.getElementById("configInstagram").value.trim(),
    tiktok: document.getElementById("configTikTok").value.trim(),
  };

  db.collection("configuracion").doc("general").set(config, { merge: true })
    .then(() => {
      // ✅ Reflejar el número limpio en los inputs
      if (whatsapp) document.getElementById("configWhatsapp").value = whatsapp;
      if (whatsappPedidos) document.getElementById("configWspPedido").value = whatsappPedidos;

      alert("✅ Configuración guardada correctamente.");
    })
    .catch(err => alert("❌ Error: " + err.message));
}


function cargarConfiguracion() {
  db.collection("configuracion").doc("general").get()
    .then(doc => {
      if (!doc.exists) return;
      const c = doc.data();
      if (c.titulo) document.getElementById("tituloPrincipal").value = c.titulo;
      if (c.whatsapp) document.getElementById("configWhatsapp").value = c.whatsapp;
      if (c.whatsappPedidos) document.getElementById("configWspPedido").value = c.whatsappPedidos;
      if (c.facebook) document.getElementById("configFacebook").value = c.facebook;
      if (c.instagram) document.getElementById("configInstagram").value = c.instagram;
      if (c.tiktok) document.getElementById("configTikTok").value = c.tiktok;
      
    });
}

// =============================
// 💳 Métodos de pago
// =============================
function guardarMetodoPago() {
  const nombre = document.getElementById('nombreBanco').value.trim();
  const cuenta = document.getElementById('numeroCuenta').value.trim();
  if (!nombre || !cuenta) return alert("Completa ambos campos para guardar el método.");

  db.collection("metodosPago").add({ nombre, cuenta })
    .then(() => {
      document.getElementById('nombreBanco').value = "";
      document.getElementById('numeroCuenta').value = "";
    });
}

function cargarMetodosPago() {
  db.collection("metodosPago").onSnapshot(snapshot => {
    const lista = document.getElementById('listaMetodosPago');
    lista.innerHTML = "";
    snapshot.forEach(doc => {
      const metodo = doc.data();
      const li = document.createElement("li");
      li.textContent = `${metodo.nombre} - ${metodo.cuenta}`;

      const btnEliminar = document.createElement("button");
      btnEliminar.textContent = "❌";
      btnEliminar.onclick = () => eliminarMetodoPago(doc.id);

      li.appendChild(btnEliminar);
      lista.appendChild(li);
    });
  });
}

function eliminarMetodoPago(id) {
  if (confirm("¿Eliminar este método de pago?")) {
    db.collection("metodosPago").doc(id).delete();
  }
}

// =============================
// 🖼️ Galería
// =============================
async function guardarGaleriaPorLinks() {
  try {
    const descripcion = document.getElementById("inputDescripcion").value.trim();
    const links = document.getElementById("inputLinks").value
                    .split("\n")
                    .map(l => l.trim())
                    .filter(l => l !== "");

    if (links.length === 0) return alert("⚠️ Debes ingresar al menos un enlace de imagen.");

    await db.collection("galeria").doc("principal").set({
      descripcion,
      imagenes: links,
      textoPromocion: document.getElementById("textoPromocionCantidad").value.trim()
    });

    document.getElementById("estadoSubida").textContent = "✅ Galería guardada correctamente.";
    mostrarVistaPreviaGaleria();

  } catch (err) {
    console.error("🔥 Error al guardar galería:", err);
    alert(`❌ Error: ${err.message}`);
  }
}

function cargarGaleriaDesdeFirestore() {
  db.collection("galeria").doc("principal").get()
    .then(doc => {
      if (!doc.exists) return;
      const data = doc.data();
      document.getElementById("inputDescripcion").value = data.descripcion || "";
      document.getElementById("textoPromocionCantidad").value = data.textoPromocion || "";
      document.getElementById("inputLinks").value = (data.imagenes || []).join("\n");
      mostrarVistaPreviaGaleria();
    });
}

function mostrarVistaPreviaGaleria() {
  const linksTexto = document.getElementById("inputLinks").value.trim();
  const contenedor = document.getElementById("vistaGaleria");
  contenedor.innerHTML = "";
  contenedor.classList.remove("scroll-infinito");

  if (!linksTexto) return;

  const links = linksTexto.split(/\r?\n/).map(link => link.trim()).filter(link => link);
  const totalLinks = links.concat(links);

  totalLinks.forEach(link => {
    const img = document.createElement("img");
    img.src = link;
    img.alt = "Imagen galería";
    img.style.width = "100px";
    img.style.height = "auto";
    img.style.flexShrink = "0";
    img.style.margin = "5px";
    contenedor.appendChild(img);
  });

  setTimeout(() => contenedor.classList.add("scroll-infinito"), 100);
}

// =============================
// 🧺 Productos
// =============================
function limpiarCampos() {
  document.getElementById("nuevoNombre").value = "";
  document.getElementById("precioOriginal").value = "";
  document.getElementById("descuento").value = "";
  document.getElementById("descripcion").value = "";
  document.getElementById("colorPrincipal").value = "";
  document.getElementById("tallas").value = "";
  document.getElementById("imagenes").value = "";
  document.querySelectorAll("#preciosPorCantidad input").forEach(input => input.value = "");
}

function agregarProducto() {
  const nombre = document.getElementById("nuevoNombre").value.trim();
  const precioOriginal = parseInt(document.getElementById("precioOriginal").value);
  const descuento = parseInt(document.getElementById("descuento").value) || 0;
  const descripcion = document.getElementById("descripcion").value.trim();
  const colorPrincipal = document.getElementById("colorPrincipal").value.trim();
  const tallas = document.getElementById("tallas").value.trim().split(",").map(t => t.trim()).filter(t => t);
  const imagenesInput = document.getElementById("imagenes").value.trim();

  if (!nombre || isNaN(precioOriginal) || !colorPrincipal || !imagenesInput || tallas.length === 0) {
    return alert("❌ Todos los campos son obligatorios.");
  }

  const precio = Math.round(precioOriginal * (1 - descuento / 100));
  const imagenesPorColor = {};
  imagenesInput.split(",").forEach(url => {
    const [color, link] = url.trim().split("|");
    if (color && link) imagenesPorColor[color.trim()] = link.trim();
  });

  if (Object.keys(imagenesPorColor).length === 0) {
    return alert("❌ Debes ingresar al menos una imagen válida en formato color|url");
  }

  const preciosPorCantidad = {};
  document.querySelectorAll("#preciosPorCantidad input").forEach(input => {
    const cantidad = input.dataset.cantidad;
    const valor = input.value.trim();
    if (valor) preciosPorCantidad[cantidad] = parseInt(valor);
  });

  const producto = {
    nombre, precio, precioOriginal, descuento, descripcion,
    colorPrincipal, imagenes: imagenesPorColor,
    tallas, colores: Object.keys(imagenesPorColor),
    preciosPorCantidad, fecha: new Date().toISOString()
  };

  db.collection("productos").add(producto)
    .then(() => {
      alert("✅ Producto agregado correctamente.");
      limpiarCampos();
    })
    .catch(error => {
      console.error("Error al agregar producto:", error);
      alert("❌ Ocurrió un error al agregar el producto.");
    });
}

function eliminarProductoAdmin(id) {
  if (!confirm("¿Estás seguro de eliminar este producto?")) return;
  db.collection("productos").doc(id).delete()
    .catch(error => console.error("❌ Error al eliminar producto:", error));
}

function editarProducto(id) {
  db.collection("productos").doc(id).get().then(doc => {
    if (!doc.exists) return alert("❌ Producto no encontrado.");
    const p = doc.data();

    // Cargar datos en el formulario
    document.getElementById("nuevoNombre").value = p.nombre;
    document.getElementById("precioOriginal").value = p.precioOriginal;
    document.getElementById("descuento").value = p.descuento || 0;
    document.getElementById("descripcion").value = p.descripcion || "";
    document.getElementById("colorPrincipal").value = p.colorPrincipal;
    document.getElementById("tallas").value = p.tallas.join(",");
    document.getElementById("imagenes").value = Object.entries(p.imagenes).map(([c, url]) => `${c}|${url}`).join(",");

    // Precios por cantidad
    document.querySelectorAll("#preciosPorCantidad input").forEach(input => {
      input.value = p.preciosPorCantidad?.[input.dataset.cantidad] || "";
    });

    // Cambiar botón a "Actualizar"
    const boton = document.querySelector("#seccion-productos .btn-verde");
    boton.textContent = "Actualizar producto";
    boton.onclick = () => actualizarProducto(id);
  });
}

function actualizarProducto(id) {
  const nombre = document.getElementById("nuevoNombre").value.trim();
  const precioOriginal = parseInt(document.getElementById("precioOriginal").value);
  const descuento = parseInt(document.getElementById("descuento").value) || 0;
  const descripcion = document.getElementById("descripcion").value.trim();
  const colorPrincipal = document.getElementById("colorPrincipal").value.trim();
  const tallas = document.getElementById("tallas").value.trim().split(",").map(t => t.trim()).filter(t => t);
  const imagenesInput = document.getElementById("imagenes").value.trim();

  if (!nombre || isNaN(precioOriginal) || !colorPrincipal || !imagenesInput || tallas.length === 0) {
    return alert("❌ Todos los campos son obligatorios.");
  }

  const precio = Math.round(precioOriginal * (1 - descuento / 100));
  const imagenesPorColor = {};
  imagenesInput.split(",").forEach(url => {
    const [color, link] = url.trim().split("|");
    if (color && link) imagenesPorColor[color.trim()] = link.trim();
  });

  const preciosPorCantidad = {};
  document.querySelectorAll("#preciosPorCantidad input").forEach(input => {
    const cantidad = input.dataset.cantidad;
    const valor = input.value.trim();
    if (valor) preciosPorCantidad[cantidad] = parseInt(valor);
  });

  const producto = {
    nombre, precio, precioOriginal, descuento, descripcion,
    colorPrincipal, imagenes: imagenesPorColor,
    tallas, colores: Object.keys(imagenesPorColor),
    preciosPorCantidad, fecha: new Date().toISOString()
  };

  db.collection("productos").doc(id).set(producto)
    .then(() => {
      alert("✅ Producto actualizado correctamente.");
      limpiarCampos();
      const boton = document.querySelector("#seccion-productos .btn-verde");
      boton.textContent = "Agregar producto";
      boton.onclick = agregarProducto;
    })
    .catch(error => {
      console.error("Error al actualizar producto:", error);
      alert("❌ Ocurrió un error al actualizar el producto.");
    });
}

function guardarQuienesSomos() {
  const texto = document.getElementById("quienesSomosTexto").value.trim();
  if (!texto) return alert("⚠️ El texto no puede estar vacío.");

  db.collection("contenido").doc("quienesSomos")
    .set({ texto }, { merge: true })
    .then(() => alert("✅ Texto de 'Quiénes somos' guardado correctamente."))
    .catch(err => alert("❌ Error: " + err.message));
}


function mostrarSeccion(id) {
  const seccion = document.getElementById(`seccion-${id}`);
  if (!seccion) return;

  const yaActiva = seccion.classList.contains("activa");
  document.querySelectorAll(".seccion").forEach(sec => sec.classList.remove("activa"));
  if (!yaActiva) seccion.classList.add("activa");

  // 🔹 Cargar contenido de 'Quiénes somos' solo al abrir la sección
  if (id === "quienes") {
    cargarQuienesSomos();
  }
}


function cargarQuienesSomos() {
  db.collection("contenido").doc("quienesSomos").get()
    .then(doc => {
      if (!doc.exists) return;
      const data = doc.data();
      document.getElementById("quienesSomosTexto").value = data.texto || "";
    })
    .catch(err => console.error("Error al cargar 'Quiénes somos':", err));
}


function cargarProductos() {
  db.collection("productos").orderBy("fecha", "desc").onSnapshot(snapshot => {
    const contenedor = document.getElementById("productos");
    contenedor.innerHTML = "";

    snapshot.forEach(doc => {
      const p = doc.data();
      const div = document.createElement("div");
      div.className = "producto-item";

      div.innerHTML = `
        <strong>${p.nombre}</strong><br>
        💰 Precio: ${p.precio !== null ? `$${p.precio.toLocaleString()} - <s>$${p.precioOriginal.toLocaleString()}</s>` : `$${p.precioOriginal.toLocaleString()}`}
        <p style="font-size: 14px; margin: 5px 0;">📝 ${p.descripcion || "Sin descripción"}</p>
        <div style="display: flex; gap: 8px; overflow-x: auto; white-space: nowrap; padding: 5px 0;">
          🎨 ${Object.keys(p.imagenes).map(color =>
            `<div style="display: inline-block; text-align: center;">
              <img src="${p.imagenes[color]}" alt="${color}" style="height: 50px; border-radius: 6px;"><br>
              <span style="font-size: 12px;">${color}</span>
            </div>`).join('')}
        </div>
        <div style="display: flex; gap: 8px; overflow-x: auto; white-space: nowrap; padding: 5px 0;">
          📏 ${p.tallas.map(t => `<span style="display:inline-block;background:#f0f0f0;padding:4px 8px;border-radius:4px;font-size:14px;">${t}</span>`).join('')}
        </div>
        <div class="acciones">
          <button class="btn-verde" onclick="editarProducto('${doc.id}')">✏️ Editar</button>
          <button onclick="eliminarProductoAdmin('${doc.id}')" class="btn-rojo">❌ Eliminar</button>
        </div>
        <p style="font-size:13px;color:#333;">📦 Precios por cantidad:<br>
          ${p.preciosPorCantidad ? Object.entries(p.preciosPorCantidad).map(([k, v]) => `${k} par${k>1?'es':''}: $${v.toLocaleString()}`).join(" | ") : "Ninguno"}
        </p>
      `;

      contenedor.appendChild(div);
    });
  });
}

// =============================
// 🛑 Captura errores globales
// =============================
window.addEventListener("error", function(e) {
  console.error("🛑 Error global detectado:", e.message);
});
