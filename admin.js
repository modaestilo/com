// ✅ Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBEWbN1BfsNUWWOy0DpU0E7o7Ku09lcweQ",
  authDomain: "modayestilocol.firebaseapp.com",
  databaseURL: "https://modayestilocol-default-rtdb.firebaseio.com",
  projectId: "modayestilocol",
  storageBucket: "modayestilocol.firebasestorage.app",
  messagingSenderId: "794561383601",
  appId: "1:794561383601:web:e11695d3b9ccfd2659a690"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ✅ Autenticación
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

    cargarProductos(); // ✅ Carga los productos al iniciar sesión
  } else {
    document.getElementById("login").style.display = "block";
    document.getElementById("admin").style.display = "none";
  }
});

const productosCollection = db.collection("productos");

function loginFirebase() {
  const email = document.getElementById("correo").value.trim();
  const clave = document.getElementById("clave").value.trim();

  firebase.auth().signInWithEmailAndPassword(email, clave)
    .then(() => {
      document.getElementById("login").style.display = "none";
      document.getElementById("admin").style.display = "block";
    })
    .catch(error => {
      alert("Error de acceso: " + error.message);
    });
}

const user = firebase.auth().currentUser;
if (user) {
  const nombreUsuario = document.createElement("p");
  nombreUsuario.textContent = `👋 Bienvenido, ${user.email}`;
  document.getElementById("admin").prepend(nombreUsuario);
}

function cerrarSesion() {
  firebase.auth().signOut().then(() => {
    document.getElementById("admin").style.display = "none";
    document.getElementById("login").style.display = "block";
  });
}

function mostrarSeccion(id) {
  const seccion = document.getElementById(`seccion-${id}`);
  if (!seccion) return;

  const yaActiva = seccion.classList.contains("activa");

  // Ocultar todas
  document.querySelectorAll(".seccion").forEach(sec => sec.classList.remove("activa"));

  // Si no estaba activa, mostrarla; si ya estaba, se oculta
  if (!yaActiva) {
    seccion.classList.add("activa");
  }
}

function toggleConfiguracionFooter() {
  const seccion = document.getElementById("configuracion-footer");
  const btn = document.getElementById("btnToggleConfigFooter");

  const estaVisible = seccion.style.display !== "none";

  seccion.style.display = estaVisible ? "none" : "block";
  btn.textContent = estaVisible ? "⚙️ Mostrar configuración" : "🔽 Ocultar configuración";
}

function toggleAgregarProducto() {
  const form = document.getElementById("formAgregarProducto");
  const btn = document.getElementById("btnToggleAgregarProducto");
  const estaVisible = form.style.display !== "none";

  form.style.display = estaVisible ? "none" : "block";
  btn.textContent = estaVisible ? "➕ Mostrar formulario de producto" : "🔽 Ocultar formulario de producto";
}

function actualizarPreview() {
  const valor = document.getElementById('nuevoImagenes').value.trim();
  const preview = document.getElementById('preview');

  const partes = valor.split(',');
  if (partes.length > 0) {
    const primera = partes[0].split('|')[1]?.trim();
    if (primera && primera.startsWith('http')) {
      preview.src = primera;
      return;
    }
  }

  preview.src = '';
}

// ✅ Agregar producto
function agregarProducto() {
  const nombre = document.getElementById("nuevoNombre").value.trim();
  const precioOriginal = parseInt(document.getElementById("precioOriginal").value);
  const descuento = parseInt(document.getElementById("descuento").value) || 0;
  const descripcion = document.getElementById("descripcion").value.trim();
  const colorPrincipal = document.getElementById("colorPrincipal").value.trim();
  const tallas = document.getElementById("tallas").value.trim().split(",").map(t => t.trim()).filter(t => t);
  const imagenesInput = document.getElementById("imagenes").value.trim();

  const precio = Math.round(precioOriginal * (1 - descuento / 100));

  if (!nombre || isNaN(precioOriginal) || !colorPrincipal || !imagenesInput || tallas.length === 0) {
    alert("❌ Todos los campos son obligatorios.");
    return;
  }

  const imagenesPorColor = {};
  imagenesInput.split(",").forEach(url => {
    const [color, link] = url.trim().split("|");
    if (color && link) {
      imagenesPorColor[color.trim()] = link.trim();
    }
  });

  if (Object.keys(imagenesPorColor).length === 0) {
    alert("❌ Debes ingresar al menos una imagen válida en formato color|url");
    return;
  }

  const preciosPorCantidad = {};
  document.querySelectorAll("#preciosPorCantidad input").forEach(input => {
    const cantidad = input.dataset.cantidad;
    const valor = input.value.trim();
    if (valor) {
      preciosPorCantidad[cantidad] = parseInt(valor);
    }
  });

  const producto = {
    nombre,
    precio,
    precioOriginal,
    descuento,
    descripcion,
    colorPrincipal,
    imagenes: imagenesPorColor,
    tallas,
    colores: Object.keys(imagenesPorColor),
    preciosPorCantidad,
    fecha: new Date().toISOString()
  };

  db.collection("productos").add(producto)
    .then(() => {
      alert("✅ Producto agregado correctamente.");
      limpiarCampos();
      obtenerProductos();
    })
    .catch(error => {
      console.error("Error al agregar producto:", error);
      alert("❌ Ocurrió un error al agregar el producto.");
    });
}

function eliminarProductoAdmin(id) {
  if (!confirm("¿Estás seguro de eliminar este producto?")) return;
  db.collection("productos").doc(id).delete()
    .then(() => {
      alert("✅ Producto eliminado correctamente");
      obtenerProductos();
    })
    .catch(error => {
      console.error("❌ Error al eliminar producto:", error);
      alert("Ocurrió un error al eliminar el producto.");
    });
}

function cargarProductos() {
  db.collection("productos").onSnapshot(snapshot => {
    const contenedor = document.getElementById("productos");
    contenedor.innerHTML = "";

    snapshot.forEach(doc => {
      const p = doc.data();
      const div = document.createElement("div");
      div.className = "producto-item";
      div.innerHTML = `
        <strong>${p.nombre}</strong><br>
        💰 Precio: ${
          p.precio !== null
            ? `$${p.precio.toLocaleString()} - <s>$${p.precioOriginal.toLocaleString()}</s>`
            : `$${p.precioOriginal.toLocaleString()}`
        }
        <p style="font-size: 14px; margin: 5px 0;">📝 ${p.descripcion || "Sin descripción"}</p>
        <div style="display: flex; gap: 8px; overflow-x: auto; white-space: nowrap; padding: 5px 0;">
          🎨 ${Object.keys(p.imagenes).map(color =>
            `<div style="display: inline-block; text-align: center;">
              <img src="${p.imagenes[color]}" alt="${color}" style="height: 50px; border-radius: 6px;"><br>
              <span style="font-size: 12px;">${color}</span>
            </div>`).join('')}
        </div>
        <div style="display: flex; gap: 8px; overflow-x: auto; white-space: nowrap; padding: 5px 0;">
          📏 ${p.tallas.map(t => `
            <span style="display: inline-block; background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-size: 14px;">
              ${t}
            </span>`).join('')}
        </div>
        <div class="acciones">
          <button class="btn-verde" onclick="editarProducto('${doc.id}')">✏️ Editar</button>
          <button onclick="eliminarProductoAdmin('${doc.id}')" class="btn-rojo">❌ Eliminar</button>
        </div>
        <p style="font-size: 13px; color: #333;">📦 Precios por cantidad:<br>
          ${p.preciosPorCantidad ? Object.entries(p.preciosPorCantidad).map(([k, v]) => `${k} par${k > 1 ? 'es' : ''}: $${v.toLocaleString()}`).join(" | ") : "Ninguno"}
        </p>
      `;
      contenedor.appendChild(div);
    });
  });
}

// ✅ Configuración general (única versión)
function guardarConfiguracion() {
  const config = {
    titulo: document.getElementById("tituloPrincipal").value.trim(),
    whatsapp: document.getElementById("configWhatsapp").value.trim(),
    whatsappPedidos: document.getElementById("configWspPedido").value.trim(),
    facebook: document.getElementById("configFacebook").value.trim(),
    instagram: document.getElementById("configInstagram").value.trim(),
    tiktok: document.getElementById("configTikTok").value.trim()
  };

  db.collection("configuracion").doc("general").set(config)
    .then(() => {
      alert("✅ Configuración guardada correctamente.");
    })
    .catch(err => {
      console.error("❌ Error al guardar configuración:", err);
      alert("❌ No se pudo guardar la configuración.");
    });
}

function cargarConfiguracion() {
  db.collection("configuracion").doc("general").get()
    .then(doc => {
      if (doc.exists) {
        const c = doc.data();
        if (c.titulo) document.getElementById("tituloPrincipal").value = c.titulo;
        if (c.whatsapp) document.getElementById("configWhatsapp").value = c.whatsapp;
        if (c.whatsappPedidos) document.getElementById("configWspPedido").value = c.whatsappPedidos;
        if (c.facebook) document.getElementById("configFacebook").value = c.facebook;
        if (c.instagram) document.getElementById("configInstagram").value = c.instagram;
        if (c.tiktok) document.getElementById("configTikTok").value = c.tiktok;
      }
    })
    .catch(err => {
      console.warn("⚠️ No se pudo cargar la configuración:", err);
    });
}

// ✅ Métodos de pago
function guardarMetodoPago() {
  const nombre = document.getElementById('nombreBanco').value.trim();
  const cuenta = document.getElementById('numeroCuenta').value.trim();

  if (!nombre || !cuenta) {
    alert("Completa ambos campos para guardar el método.");
    return;
  }

  db.collection("metodosPago").add({
    nombre,
    cuenta
  }).then(() => {
    document.getElementById('nombreBanco').value = "";
    document.getElementById('numeroCuenta').value = "";
    cargarMetodosPago();
  });
}

function cargarMetodosPago() {
  const lista = document.getElementById('listaMetodosPago');
  lista.innerHTML = "";

  db.collection("metodosPago").onSnapshot(snapshot => {
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

// ✅ Guardar "Quiénes Somos"
function guardarQuienesSomos() {
  const nuevoTexto = document.getElementById("quienesSomosTexto").value.trim();

  if (!nuevoTexto) {
    alert("❌ El campo 'Quiénes somos' no puede estar vacío.");
    return;
  }

  db.collection("contenido").doc("quienesSomos").set({ texto: nuevoTexto })
    .then(() => {
      alert("✅ Sección 'Quiénes somos' actualizada correctamente.");
    })
    .catch(err => {
      console.error("❌ Error al guardar 'Quiénes somos':", err);
      alert("❌ Error al guardar: " + err.message);
    });
}

db.collection("contenido").doc("quienesSomos").get().then(doc => {
  if (doc.exists) {
    document.getElementById("quienesSomosTexto").value = doc.data().texto || "";
  }
});

// ✅ Galería
async function guardarGaleriaPorLinks() {
  try {
    const descripcion = document.getElementById("inputDescripcion").value.trim();
    const links = document.getElementById("inputLinks").value
                    .split("\n")
                    .map(l => l.trim())
                    .filter(l => l !== "");

    if (links.length === 0) {
      alert("⚠️ Debes ingresar al menos un enlace de imagen.");
      return;
    }

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
      if (doc.exists) {
        const data = doc.data();
        document.getElementById("inputDescripcion").value = data.descripcion || "";
        document.getElementById("textoPromocionCantidad").value = data.textoPromocion || "";
        document.getElementById("inputLinks").value = (data.imagenes || []).join("\n");
        mostrarVistaPreviaGaleria();
      }
    })
    .catch(err => {
      console.error("Error al cargar galería:", err);
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

// 🧹 Limpiar campos
function limpiarCampos() {
  document.getElementById("nuevoNombre").value = "";
  document.getElementById("nuevoPrecio").value = "";
  document.getElementById("precioOriginal").value = "";
  document.getElementById("nuevoImagenes").value = "";
  document.getElementById("nuevoColor").value = "";
  document.getElementById("nuevoTallas").value = "";
  document.getElementById("nuevoDescripcion").value = "";
  document.getElementById("nuevoPreciosCantidad").value = "";
  document.getElementById("preview").src = "";
}

// 🔁 Ejecutar cuando el DOM esté listo
window.addEventListener("DOMContentLoaded", () => {
  obtenerProductos();
  cargarConfiguracion();
  cargarMetodosPago();
  cargarGaleriaDesdeFirestore();
});

// 🛑 Capturar errores globales
window.addEventListener("error", function (e) {
  console.error("🛑 Error global detectado:", e.message);
});
