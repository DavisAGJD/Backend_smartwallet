// ============================================================================
// MODELOS Y CONFIGURACIÓN
// ============================================================================
const Notificacion = require("../models/notificaciones");
const db = require("../config/db");

// ============================================================================
// ESTRATEGIAS POR CATEGORÍA (CON MÁS DE 20 CONSEJOS CADA UNA)
// ============================================================================
// Consejos genéricos sin mención de autores.

const ESTRATEGIAS = {
  Alimentación: {
    max_porcentaje: 15,
    mensajes: [
      "Compra alimentos de temporada para aprovechar mejores precios.",
      "Haz una lista de compras y cíñete a ella para evitar compras impulsivas.",
      "Compra productos al por mayor cuando sea posible y almacénalos adecuadamente.",
      "Prepara tus comidas en casa en lugar de pedir comida a domicilio.",
      "Planifica un menú semanal para optimizar tus compras y reducir desperdicios.",
      "Congela porciones de comida para tener platos listos sin gastar de más.",
      "Revisa ofertas y cupones en supermercados locales o en línea.",
      "Prueba marcas genéricas en lugar de las más costosas.",
      "Evita hacer la compra con hambre para no caer en tentaciones.",
      "Aprovecha los restos de comida para crear nuevos platos (reciclaje culinario).",
      "Cultiva tus propias hierbas y vegetales si tienes espacio.",
      "Compra frutas y verduras frescas en mercados locales para apoyar productores y ahorrar.",
      "Controla tu consumo de bebidas azucaradas; el agua es más barata y saludable.",
      "Compara precios en diferentes establecimientos antes de comprar.",
      "Utiliza aplicaciones de ofertas o descuentos en alimentos.",
      "Si comes fuera, busca menús del día o promociones especiales.",
      "Planifica recetas que compartan ingredientes para reducir el desperdicio.",
      "Aprovecha la comida cercana a la fecha de vencimiento con descuentos.",
      "Usa un presupuesto fijo mensual para alimentación y mantente dentro del límite.",
      "Lleva tus propias comidas al trabajo o a la universidad para evitar gastos en cafeterías.",
    ],
  },

  Transporte: {
    max_porcentaje: 10,
    mensajes: [
      "Comparte coche con compañeros o amigos para dividir costos de gasolina.",
      "Usa aplicaciones de rutas y tráfico para evitar atascos y ahorrar combustible.",
      "Realiza mantenimiento regular al vehículo para prevenir reparaciones costosas.",
      "Explora opciones de transporte público para trayectos habituales.",
      "Utiliza bicicleta o camina distancias cortas para ahorrar y ejercitarte.",
      "Compra combustible en días con precios más bajos o en gasolineras económicas.",
      "Planifica tus rutas para hacer varios recados en un solo viaje.",
      "Verifica la presión de las llantas para optimizar el consumo de combustible.",
      "Considera vehículos con bajo consumo o híbridos si planeas cambiar de auto.",
      "Aprovecha descuentos y pases mensuales en transporte público.",
      "Si usas servicios de taxi o apps, compara tarifas y aprovecha promociones.",
      "Evita acelerar y frenar bruscamente para ahorrar gasolina.",
      "Busca estacionamientos más económicos o estaciona en zonas gratuitas.",
      "Mantén tu auto limpio y sin peso innecesario que incremente el consumo.",
      "Si viajas en avión, reserva con anticipación para obtener mejores precios.",
      "Trata de compartir viajes largos con otros para dividir costos.",
      "Analiza si un auto propio es realmente necesario o si puedes rentar ocasionalmente.",
      "Si vives cerca de tu trabajo, considera mudarte para reducir tiempo y gastos de transporte.",
      "Evita desplazamientos innecesarios organizando tus actividades desde casa.",
      "Aprovecha el teletrabajo si es posible para reducir gastos de desplazamiento.",
    ],
  },

  Entretenimiento: {
    max_porcentaje: 5,
    mensajes: [
      "Organiza noches de juegos de mesa con amigos en lugar de salir a bares.",
      "Aprovecha días de cine con descuento o suscripciones de streaming compartidas.",
      "Busca eventos gratuitos en tu ciudad como conciertos, exposiciones o ferias.",
      "Explora parques y áreas naturales para pasar tiempo al aire libre.",
      "Intercambia libros o películas con amigos en lugar de comprarlos nuevos.",
      "Limita las salidas costosas y define un presupuesto mensual para ocio.",
      "Aprovecha bibliotecas públicas que ofrezcan préstamos de libros y películas.",
      "Haz voluntariado en eventos para disfrutar de espectáculos sin costo.",
      "Organiza comidas o cenas compartidas en casa con cada invitado aportando algo.",
      "Suscríbete a boletines de ofertas para encontrar descuentos en entretenimiento.",
      "Prueba juegos gratuitos en línea en lugar de comprar los últimos estrenos.",
      "Planifica actividades de fin de semana que no requieran grandes gastos.",
      "Participa en intercambios de ropa o artículos para renovar sin gastar.",
      "Descubre aplicaciones de cupones y promociones para eventos culturales.",
      "Utiliza plataformas de streaming gratuitas con publicidad en lugar de planes premium.",
      "Evita compras impulsivas de música o películas digitales; compara precios.",
      "Organiza talleres o cursos caseros con amigos para aprender juntos.",
      "Busca entradas de último minuto con descuento para espectáculos.",
      "Sigue redes sociales de centros culturales para enterarte de eventos gratuitos.",
      "Si eres fan de los videojuegos, considera servicios de suscripción en lugar de comprar cada título.",
    ],
  },

  Educación: {
    max_porcentaje: 10,
    mensajes: [
      "Aprovecha cursos gratuitos en línea para aprender nuevas habilidades.",
      "Haz uso de bibliotecas y préstamos de libros para ahorrar en material.",
      "Participa en grupos de estudio para compartir recursos y reducir costos.",
      "Investiga becas y ayudas disponibles para tu área de estudio.",
      "Compra libros de texto usados o en formato digital para ahorrar.",
      "Asiste a conferencias o seminarios gratuitos que ofrezcan certificados.",
      "Crea un plan de estudios y evita gastos en cursos que no usarás.",
      "Comparte materiales con compañeros para dividir costos.",
      "Utiliza plataformas de enseñanza en línea en lugar de academias costosas.",
      "Mantén ordenadas tus notas y apuntes para no comprar material innecesario.",
      "Aprovecha ofertas de software educativo con licencia para estudiantes.",
      "Pregunta a profesores sobre recursos abiertos o alternativos al libro oficial.",
      "Crea tu propia biblioteca de apuntes digital y evita imprimir sin necesidad.",
      "Revisa las suscripciones a herramientas de aprendizaje y cancela las que no uses.",
      "Asiste a ferias de libros donde se ofrecen descuentos especiales.",
      "Únete a foros de estudiantes para intercambiar información y materiales.",
      "Considera estudios semipresenciales o a distancia para reducir gastos de transporte.",
      "Haz prácticas en empresas que cubran algunos costos de formación.",
      "Sigue canales educativos en redes sociales para aprender gratuitamente.",
      "Si terminas un curso, vende o intercambia los materiales que ya no necesites.",
    ],
  },

  Salud: {
    max_porcentaje: 8,
    mensajes: [
      "Mantén una rutina de ejercicio regular para prevenir problemas de salud.",
      "Revisa opciones de seguros médicos que se adapten a tu presupuesto.",
      "Realiza chequeos médicos periódicos para detectar problemas a tiempo.",
      "Practica técnicas de relajación para reducir el estrés y gastos en terapias.",
      "Elige alimentos nutritivos para prevenir gastos en suplementos.",
      "Evita el sedentarismo caminando o usando la bicicleta cuando sea posible.",
      "Compara precios de medicamentos en diferentes farmacias o en línea.",
      "Aprende primeros auxilios básicos para emergencias menores.",
      "Aprovecha campañas gratuitas de vacunación y revisión si están disponibles.",
      "Mantén un botiquín en casa para evitar compras de última hora a precios altos.",
      "Evita hábitos costosos y poco saludables que afecten tu bienestar.",
      "Practica deportes al aire libre en lugar de pagar gimnasios caros.",
      "Organiza un grupo de ejercicio con amigos para motivarse mutuamente.",
      "Infórmate sobre programas de salud comunitarios con servicios gratuitos o económicos.",
      "Bebe suficiente agua para mantenerte hidratado y evitar refrescos costosos.",
      "Planifica tus visitas al dentista con anticipación para evitar tratamientos caros.",
      "Cocina en casa platos balanceados en lugar de comer comida rápida.",
      "Revisa si tu empleador ofrece beneficios de salud o planes colectivos.",
      "Si necesitas terapias, pregunta por tarifas especiales o planes de pago.",
      "Descansa lo suficiente para fortalecer tu sistema inmunológico y reducir gastos médicos.",
    ],
  },

  Hogar: {
    max_porcentaje: 20,
    mensajes: [
      "Usa bombillas LED para reducir el consumo eléctrico.",
      "Desconecta dispositivos que no estés usando para evitar consumo en standby.",
      "Instala burletes en puertas y ventanas para mejorar el aislamiento térmico.",
      "Lava la ropa con agua fría siempre que sea posible.",
      "Repara en lugar de reemplazar muebles u objetos domésticos.",
      "Aprovecha la luz natural abriendo cortinas y persianas.",
      "Pinta paredes con colores claros para mejorar la iluminación.",
      "Haz un mantenimiento regular a electrodomésticos para prolongar su vida útil.",
      "Colecta agua de lluvia para regar plantas y jardines.",
      "Compra productos de limpieza al por mayor o elabora limpiadores caseros.",
      "Descongela el frigorífico regularmente para un mejor rendimiento.",
      "Aprovecha las horas de tarifa eléctrica más barata si tu país las ofrece.",
      "Ordena y organiza tus espacios para saber qué tienes y no comprar de más.",
      "Cierra la llave del agua mientras te cepillas los dientes o lavas platos.",
      "Considera instalar paneles solares si es viable a largo plazo.",
      "Seca la ropa al aire libre en lugar de usar secadora.",
      "Utiliza regletas con interruptor para apagar varios dispositivos a la vez.",
      "Compra muebles de segunda mano en buen estado para ahorrar.",
      "Haz una lista de tareas de mantenimiento para evitar gastos mayores.",
      "Comparte herramientas con vecinos en lugar de comprarlas todas.",
    ],
  },

  Ropa: {
    max_porcentaje: 5,
    mensajes: [
      "Revisa tu armario antes de comprar algo nuevo para evitar duplicados.",
      "Compra ropa de segunda mano en tiendas vintage o de reventa.",
      "Aprovecha rebajas de temporada para adquirir prendas básicas.",
      "Invierte en piezas de calidad que duren varios años.",
      "Repara o ajusta ropa en lugar de desecharla.",
      "Intercambia prendas con amigos para renovar tu guardarropa.",
      "Compra ropa fuera de temporada a precios más bajos.",
      "Aprende a coser pequeños arreglos para alargar la vida de tus prendas.",
      "Separa tu ropa por temporadas y guárdala adecuadamente.",
      "Evita comprar ropa por impulso, define un presupuesto.",
      "Usa ropa neutra que puedas combinar fácilmente.",
      "Si cambias de talla, dona lo que no uses en lugar de almacenarlo.",
      "Busca cupones y descuentos en línea antes de comprar.",
      "Lava la ropa con ciclos adecuados y evita altas temperaturas que la dañen.",
      "Seca la ropa al aire libre para evitar desgaste prematuro.",
      "Revisa la etiqueta de cuidado para lavar y planchar correctamente.",
      "Planifica tus compras de ropa según tus necesidades reales.",
      "Mantén tus zapatos en buen estado lustrándolos y guardándolos correctamente.",
      "Considera alquilar ropa elegante para eventos especiales en lugar de comprar.",
      "Compra prendas versátiles que sirvan para distintas ocasiones.",
    ],
  },

  Tecnología: {
    max_porcentaje: 5,
    mensajes: [
      "Evita comprar dispositivos nuevos si el actual sigue funcionando bien.",
      "Compara precios en diferentes tiendas y en línea antes de adquirir un producto.",
      "Revisa reseñas y especificaciones para no pagar por funciones que no necesitas.",
      "Desactiva actualizaciones automáticas de apps que no uses.",
      "Suscríbete a planes de telefonía o internet adecuados a tu uso real.",
      "Usa programas gratuitos o de código abierto en lugar de software costoso.",
      "Considera reparaciones antes de reemplazar aparatos dañados.",
      "Mantén el sistema operativo y antivirus actualizados para evitar problemas.",
      "Vende o intercambia dispositivos antiguos para recuperar parte de la inversión.",
      "Limpia regularmente tus equipos para evitar sobrecalentamientos.",
      "Desconecta cargadores y aparatos que no estés usando.",
      "Si necesitas un nuevo dispositivo, espera ofertas especiales o rebajas.",
      "Evalúa si un teléfono de gama media satisface tus necesidades.",
      "No cambies de teléfono cada año, prolonga su vida útil con buen cuidado.",
      "Usa accesorios genéricos de calidad en lugar de los de marca oficial.",
      "Revisa planes de suscripción de música o almacenamiento en la nube para no duplicarlos.",
      "Desactiva notificaciones innecesarias que consumen datos y batería.",
      "Configura tu computadora para que entre en suspensión tras inactividad.",
      "Compra cables y periféricos en tiendas especializadas a mejor precio.",
      "Renueva componentes en lugar de cambiar todo el equipo cuando sea posible.",
    ],
  },

  Viajes: {
    max_porcentaje: 5,
    mensajes: [
      "Reserva vuelos y alojamiento con anticipación para obtener mejores precios.",
      "Viaja en temporada baja para ahorrar en transporte y hospedaje.",
      "Aprovecha paquetes turísticos que incluyan varias actividades.",
      "Compara precios en diferentes buscadores de viajes.",
      "Evita el exceso de equipaje para no pagar costos adicionales.",
      "Hospédate en lugares con cocina para ahorrar en comida.",
      "Usa transporte local en lugar de taxis o autos de alquiler.",
      "Compra souvenirs de forma consciente y evita gastos innecesarios.",
      "Si es posible, viaja ligero para moverte con mayor libertad y menos costos.",
      "Cambia moneda en lugares con buena tasa de cambio y evita aeropuertos.",
      "Investiga descuentos para estudiantes, jubilados o residentes.",
      "Planea itinerarios que optimicen el tiempo y eviten recorridos repetidos.",
      "Utiliza tarjetas de puntos o millas para acumular beneficios en aerolíneas.",
      "Compara seguros de viaje para cubrir emergencias médicas.",
      "Prueba el intercambio de casas si planeas estancias largas.",
      "Evita restaurantes turísticos, busca lugares locales más económicos.",
      "Aprovecha el turismo de caminata o bicicleta en destinos naturales.",
      "Consulta blogs de viajeros para descubrir opciones baratas o gratuitas.",
      "Arma un presupuesto diario para comida, transporte y actividades.",
      "Considera viajar en grupo para dividir gastos de hospedaje y transporte.",
    ],
  },

  Otros: {
    max_porcentaje: 5,
    mensajes: [
      "Lleva un registro de gastos diarios para identificar fugas de dinero.",
      "Establece metas de ahorro a corto y largo plazo.",
      "Crea un fondo de emergencia con al menos 3-6 meses de gastos.",
      "Evita usar la tarjeta de crédito para compras impulsivas.",
      "Paga tus facturas a tiempo para no incurrir en recargos.",
      "Compara pólizas de seguro para encontrar la mejor relación costo-beneficio.",
      "Trata de renegociar tus deudas con tasas de interés más bajas.",
      "Ahorra monedas sueltas en un frasco y deposítalas al final del mes.",
      "Realiza transferencias automáticas a tu cuenta de ahorros.",
      "Si recibes un dinero extra, ahorra una parte antes de gastarlo.",
      "Revisa tu plan de telefonía y cable, cancela canales o servicios que no uses.",
      "Busca cupones de descuento en internet para compras generales.",
      "Evita compras a plazos con altos intereses, ahorra y compra de contado.",
      "Comparte membresías y suscripciones con familiares o amigos.",
      "Analiza tus suscripciones mensuales y da de baja las que no usas.",
      "Vende artículos que ya no necesites en plataformas de segunda mano.",
      "Si compras en línea, usa un carrito y espera unos días antes de finalizar la compra.",
      "Establece un sistema de sobres o categorías para administrar tu efectivo.",
      "Crea un presupuesto detallado y revísalo periódicamente.",
      "Distingue entre necesidades y deseos antes de gastar.",
    ],
  },

  Ticket: {
    max_porcentaje: 5,
    mensajes: [
      "Compra boletos en preventa para obtener descuentos anticipados.",
      "Compara precios en diferentes plataformas de venta de entradas.",
      "Evita cargos adicionales imprimiendo tus tickets en casa o usando códigos digitales.",
      "Si el evento es recurrente, espera a ofertas de último minuto.",
      "Revisa las políticas de devolución o reventa en caso de imprevistos.",
      "Busca promociones con tarjetas de crédito que ofrezcan pagos sin intereses.",
      "Comparte pases o abonos con amigos si es permitido.",
      "Compra entradas grupales para obtener descuentos colectivos.",
      "Elige asientos en zonas más económicas si la visibilidad no es un problema.",
      "Pregunta en taquillas si hay ofertas especiales para estudiantes o mayores.",
      "Revisa redes sociales oficiales de los eventos para sorteos y promociones.",
      "Aprovecha la compra de abonos para varios días si planeas asistir más de una vez.",
      "Si es un concierto, considera ubicaciones alejadas del escenario pero más baratas.",
      "Suscríbete a newsletters de promotoras para enterarte de ofertas exclusivas.",
      "Si vas a un parque de atracciones, lleva comida y bebida si está permitido.",
      "Compra tus boletos en temporada baja para evitar sobreprecios.",
      "Comparte transporte con amigos para dividir gastos de traslado al evento.",
      "Llega temprano para evitar costos extra de estacionamiento o recargos de última hora.",
      "Si el evento es al aire libre, lleva lo necesario para no comprar dentro a precios altos.",
      "Revende tu ticket solo en canales oficiales para evitar fraudes o estafas.",
    ],
  },
};

// ============================================================================
// FUNCIONES PRINCIPALES CORREGIDAS
// ============================================================================

// Función de ayuda para manejo seguro de callbacks
function safeCallback(callback, error, result) {
  if (typeof callback === "function") {
    if (error) callback(error);
    else callback(null, result);
  } else if (error) {
    console.error("Error no manejado:", error);
  }
}

// ============================================================================
// NOTIFICACIONES DE GASTOS
// ============================================================================

function generarNotificacionesDeGastos(callback) {
  obtenerUsuarios((err, usuarios) => {
    if (err) return safeCallback(callback, err);

    let procesados = 0;
    const total = usuarios.length;
    if (total === 0) return safeCallback(callback);

    usuarios.forEach((usuario) => {
      obtenerGastosDelMes(usuario.usuario_id, (err, totalGastos) => {
        if (err) {
          procesados++;
          console.error("Error en gastos:", err);
          return checkCompletion();
        }

        const porcentaje =
          usuario.ingresos > 0 ? (totalGastos / usuario.ingresos) * 100 : 0;

        if (porcentaje >= 20) {
          Notificacion.create(
            {
              usuario_id: usuario.usuario_id,
              tipo: "gastos",
              mensaje: "Alerta: Límite de gastos alcanzado",
            },
            () => checkCompletion()
          );
        } else {
          checkCompletion();
        }

        function checkCompletion() {
          procesados++;
          if (procesados === total) safeCallback(callback);
        }
      });
    });
  });
}

// ============================================================================
// NOTIFICACIONES DE METAS
// ============================================================================

function generarNotificacionesDeMetas(callback) {
  obtenerMetas((err, metas) => {
    if (err) return safeCallback(callback, err);

    let procesadas = 0;
    const total = metas.length;
    if (total === 0) return safeCallback(callback);

    metas.forEach((meta) => {
      const porcentaje =
        meta.monto_objetivo > 0
          ? (meta.monto_actual / meta.monto_objetivo) * 100
          : 0;

      const notificaciones = [];

      // Lógica de notificaciones
      if (porcentaje >= 100) {
        notificaciones.push({
          tipo: "meta_completada",
          mensaje: `¡Meta cumplida: ${meta.nombre_meta}!`,
        });
      }

      procesarNotificaciones(meta, notificaciones, () => {
        procesadas++;
        if (procesadas === total) safeCallback(callback);
      });
    });
  });
}

// ============================================================================
// NOTIFICACIONES DE RECORDATORIOS
// ============================================================================

function generarNotificacionesDeRecordatorios(callback) {
  obtenerRecordatoriosProximos((err, recordatorios) => {
    if (err) return safeCallback(callback, err);

    let procesados = 0;
    const total = recordatorios.length;
    if (total === 0) return safeCallback(callback);

    recordatorios.forEach((recordatorio) => {
      Notificacion.create(
        {
          usuario_id: recordatorio.usuario_id,
          tipo: "recordatorio",
          mensaje: recordatorio.descripcion,
        },
        (err) => {
          if (err) console.error("Error en recordatorio:", err);
          procesados++;
          if (procesados === total) safeCallback(callback);
        }
      );
    });
  });
}

// ============================================================================
// ELIMINAR NOTIFICACIONES VIEJAS
// ============================================================================

function eliminarNotificacionesViejas(callback) {
  const query =
    "DELETE FROM notificaciones WHERE fecha < NOW() - INTERVAL 7 DAY";
  db.query(query, (err, result) => {
    if (err) return safeCallback(callback, err);
    safeCallback(callback, null, result.affectedRows);
  });
}

// ============================================================================
// NOTIFICACIONES DE METAS VENCIDAS
// ============================================================================

function generarNotificacionesDeMetasVencidas(callback) {
  obtenerMetasVencidas((err, metas) => {
    if (err) return safeCallback(callback, err);

    let procesadas = 0;
    const total = metas.length;
    if (total === 0) return safeCallback(callback);

    metas.forEach((meta) => {
      Notificacion.create(
        {
          usuario_id: meta.usuario_id,
          tipo: "meta_vencida",
          mensaje: `Meta vencida: ${meta.nombre_meta}`,
        },
        (err) => {
          if (err) console.error("Error notificando meta vencida:", err);

          eliminarMeta(meta.meta_id, () => {
            procesadas++;
            if (procesadas === total) safeCallback(callback);
          });
        }
      );
    });
  });
}

// ============================================================================
// NOTIFICACIONES FINANCIERAS
// ============================================================================

function generarNotificacionesFinancieras(callback) {
  obtenerUsuariosConGastos((err, usuarios) => {
    if (err) return safeCallback(callback, err);

    let procesados = 0;
    const total = usuarios.length;
    if (total === 0) return safeCallback(callback);

    usuarios.forEach((usuario) => {
      generarRecomendaciones(usuario, (err, recomendaciones) => {
        if (recomendaciones && recomendaciones.length > 0) {
          Notificacion.create(
            {
              usuario_id: usuario.usuario_id,
              tipo: "consejo_financiero",
              mensaje: recomendaciones.join("\n"),
            },
            () => checkCompletion()
          );
        } else {
          checkCompletion();
        }

        function checkCompletion() {
          procesados++;
          if (procesados === total) safeCallback(callback);
        }
      });
    });
  });
}

// ============================================================================
// NOTIFICAR INICIO DE META
// ============================================================================

function notificarInicioMeta(meta, callback) {
  Notificacion.create(
    {
      usuario_id: meta.usuario_id,
      tipo: "meta_inicio",
      mensaje: `Nueva meta creada: ${meta.nombre_meta}`,
    },
    (err) => {
      if (err) console.error("Error notificando inicio de meta:", err);
      safeCallback(callback);
    }
  );
}

// ============================================================================
// FUNCIONES AUXILIARES CORREGIDAS
// ============================================================================

function obtenerUsuarios(callback) {
  db.query("SELECT usuario_id, ingresos FROM usuarios", (err, results) => {
    if (err) return safeCallback(callback, err);
    safeCallback(callback, null, results);
  });
}

function obtenerGastosDelMes(usuarioId, callback) {
  const query = `
    SELECT COALESCE(SUM(monto), 0) AS total 
    FROM gastos 
    WHERE usuario_id = ? 
      AND MONTH(fecha) = MONTH(CURRENT_DATE())
  `;
  db.query(query, [usuarioId], (err, results) => {
    if (err) return safeCallback(callback, err);
    safeCallback(callback, null, results[0]?.total || 0);
  });
}

function obtenerMetas(callback) {
  db.query("SELECT * FROM metas_de_ahorro", (err, results) => {
    if (err) return safeCallback(callback, err);
    safeCallback(callback, null, results);
  });
}

function obtenerRecordatoriosProximos(callback) {
  const query = `
    SELECT * FROM recordatorios 
    WHERE fecha_recordatorio BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 1 DAY)
  `;
  db.query(query, (err, results) => {
    if (err) return safeCallback(callback, err);
    safeCallback(callback, null, results);
  });
}

function obtenerMetasVencidas(callback) {
  const query = `
    SELECT * FROM metas_de_ahorro 
    WHERE fecha_limite < NOW() AND monto_actual < monto_objetivo
  `;
  db.query(query, (err, results) => {
    if (err) return safeCallback(callback, err);
    safeCallback(callback, null, results);
  });
}

function eliminarMeta(metaId, callback) {
  db.query("DELETE FROM metas_de_ahorro WHERE meta_id = ?", [metaId], (err) => {
    if (err) console.error("Error eliminando meta:", err);
    safeCallback(callback);
  });
}

function generarRecomendaciones(usuario, callback) {
  // Implementación segura de recomendaciones
  const recomendaciones = [
    "Ejemplo recomendación 1",
    "Ejemplo recomendación 2",
  ];
  safeCallback(callback, null, recomendaciones);
}

function procesarNotificaciones(meta, notificaciones, callback) {
  let procesadas = 0;
  const total = notificaciones.length;
  if (total === 0) return safeCallback(callback);

  notificaciones.forEach((notificacion) => {
    Notificacion.create(
      {
        usuario_id: meta.usuario_id,
        ...notificacion,
      },
      (err) => {
        if (err) console.error("Error en notificación:", err);
        procesadas++;
        if (procesadas === total) safeCallback(callback);
      }
    );
  });
}

const obtenerUsuariosConGastos = (callback) => {
  const query = `
    SELECT 
        u.usuario_id,
        u.nombre_usuario,
        u.ingresos,
        COALESCE(
            GROUP_CONCAT(
                CONCAT(
                    gastos_por_categoria.categoria,
                    ':',
                    gastos_por_categoria.total
                ) SEPARATOR '|'
            ), 
            ''
        ) AS gastos
    FROM usuarios u
    LEFT JOIN (
        SELECT 
            g.usuario_id,
            c.nombre_categoria AS categoria,
            SUM(g.monto) AS total
        FROM gastos g
        LEFT JOIN categorias_gasto c 
            ON g.categoria_gasto_id = c.categoria_gasto_id
        WHERE g.fecha >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
        GROUP BY g.usuario_id, c.nombre_categoria
    ) gastos_por_categoria ON u.usuario_id = gastos_por_categoria.usuario_id
    GROUP BY u.usuario_id;
  `;

  db.query(query, (err, results) => {
    if (err) return safeCallback(callback, err);

    try {
      const parsedResults = results.map((row) => {
        const gastos = row.gastos
          ? row.gastos
              .split("|")
              .map((item) => {
                const [categoria, total] = item.split(":");
                return {
                  categoria: (categoria || "").trim(),
                  total: parseFloat(total) || 0,
                };
              })
              .filter((g) => g.categoria && g.total > 0)
          : [];

        return {
          usuario_id: row.usuario_id,
          nombre_usuario: row.nombre_usuario,
          ingresos: parseFloat(row.ingresos) || 0,
          gastos: gastos,
        };
      });

      const usuariosConGastos = parsedResults.filter(
        (user) => user.gastos.length > 0
      );
      safeCallback(callback, null, usuariosConGastos);
    } catch (error) {
      console.error("Error procesando resultados:", error);
      safeCallback(callback, error);
    }
  });
};

// ============================================================================
// EXPORTACIONES
// ============================================================================
module.exports = {
  generarNotificacionesDeGastos,
  generarNotificacionesDeMetas,
  generarNotificacionesDeRecordatorios,
  eliminarNotificacionesViejas,
  generarNotificacionesDeMetasVencidas,
  generarNotificacionesFinancieras,
  notificarInicioMeta,
};
