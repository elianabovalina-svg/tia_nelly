(function () {
  'use strict';

  var CFG = window.CONFIG;
  var URL_API = CFG.APPS_SCRIPT_URL;
  var QUIENES = CFG.QUIENES;
  var LIMITE = CFG.LIMITE_INICIAL || 20;

  var moneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

  var gastos = [];
  var expandido = false;
  var guardando = false;

  function $(id) { return document.getElementById(id); }

  var el = {
    total: $('total'),
    form: $('form-gasto'),
    fecha: $('g-fecha'),
    monto: $('g-monto'),
    quien: $('g-quien'),
    desc: $('g-desc'),
    formMsg: $('form-msg'),
    btnGuardar: $('btn-guardar'),
    fTexto: $('f-texto'),
    fDesde: $('f-desde'),
    fHasta: $('f-hasta'),
    fQuien: $('f-quien'),
    btnLimpiar: $('btn-limpiar'),
    btnActualizar: $('btn-actualizar'),
    resumen: $('resumen'),
    estado: $('estado'),
    lista: $('lista'),
    btnExpandir: $('btn-expandir'),
    toast: $('toast')
  };

  /* ---------- utilidades ---------- */

  function hoy() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var dia = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + dia;
  }

  function fechaLarga(iso) {
    return iso.split('-').reverse().join('/');
  }

  function normalizar(s) {
    return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function sumar(lista) {
    var centavos = lista.reduce(function (acc, g) { return acc + Math.round(g.monto * 100); }, 0);
    return centavos / 100;
  }

  function configurado() {
    return /^https:\/\/script\.google\.com\/.+\/exec$/.test(URL_API);
  }

  var toastTimer;
  function aviso(texto, esError) {
    el.toast.textContent = texto;
    el.toast.className = 'toast show' + (esError ? ' error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.className = 'toast'; }, 3500);
  }

  function estado(texto, esError) {
    el.estado.textContent = texto || '';
    el.estado.className = 'estado' + (esError ? ' error' : '');
  }

  /* ---------- inicialización de campos ---------- */

  function opcion(valor, texto, extra) {
    var o = document.createElement('option');
    o.value = valor;
    o.textContent = texto;
    if (extra) Object.assign(o, extra);
    return o;
  }

  function iniciarCampos() {
    el.quien.appendChild(opcion('', 'Elegí una persona…', { disabled: true, selected: true }));
    el.fQuien.appendChild(opcion('', 'Todos'));
    QUIENES.forEach(function (q) {
      el.quien.appendChild(opcion(q, q));
      el.fQuien.appendChild(opcion(q, q));
    });
    el.fecha.value = hoy();
  }

  /* ---------- datos ---------- */

  function cargar(silencioso) {
    if (!configurado()) {
      estado('Falta configurar la URL de Google Apps Script en config.js (ver README).', true);
      el.total.textContent = '—';
      return Promise.resolve();
    }
    if (!silencioso) estado('Cargando gastos…');
    el.btnActualizar.disabled = true;

    return fetch(URL_API + '?action=list&_=' + Date.now())
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.ok) throw new Error(data.error || 'Error desconocido');
        gastos = data.gastos.sort(function (a, b) {
          if (a.fecha !== b.fecha) return a.fecha < b.fecha ? 1 : -1;
          return b.fila - a.fila;
        });
        estado('');
        render();
      })
      .catch(function (err) {
        console.error(err);
        estado('No se pudieron cargar los gastos. Revisá la conexión y que la implementación de Apps Script permita acceso a "Cualquier persona".', true);
      })
      .then(function () { el.btnActualizar.disabled = false; });
  }

  function guardar(payload) {
    return fetch(URL_API, {
      method: 'POST',
      // text/plain evita el preflight CORS que Apps Script no soporta.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); });
  }

  /* ---------- filtros y render ---------- */

  function hayFiltros() {
    return !!(el.fTexto.value.trim() || el.fDesde.value || el.fHasta.value || el.fQuien.value);
  }

  function filtrados() {
    var q = normalizar(el.fTexto.value.trim());
    var desde = el.fDesde.value;
    var hasta = el.fHasta.value;
    var quien = el.fQuien.value;
    return gastos.filter(function (g) {
      return (!q || normalizar(g.descripcion).indexOf(q) !== -1) &&
        (!desde || g.fecha >= desde) &&
        (!hasta || g.fecha <= hasta) &&
        (!quien || g.quien === quien);
    });
  }

  function itemGasto(g) {
    var li = document.createElement('li');
    li.className = 'gasto';

    var main = document.createElement('div');
    main.className = 'g-main';

    var desc = document.createElement('span');
    desc.className = 'g-desc';
    desc.textContent = g.descripcion;

    var meta = document.createElement('div');
    meta.className = 'g-meta';
    var fecha = document.createElement('span');
    fecha.textContent = fechaLarga(g.fecha);
    var badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = g.quien;
    meta.appendChild(fecha);
    meta.appendChild(badge);

    main.appendChild(desc);
    main.appendChild(meta);

    var monto = document.createElement('div');
    monto.className = 'g-monto';
    monto.textContent = moneda.format(g.monto);

    li.appendChild(main);
    li.appendChild(monto);
    return li;
  }

  function render() {
    // El total general siempre refleja TODOS los gastos, sin filtros.
    el.total.textContent = moneda.format(sumar(gastos));

    var lista = filtrados();
    var visibles = expandido ? lista : lista.slice(0, LIMITE);

    el.lista.textContent = '';
    visibles.forEach(function (g) { el.lista.appendChild(itemGasto(g)); });

    if (!gastos.length) {
      estado('Todavía no hay gastos registrados.');
    } else if (!lista.length) {
      estado('No hay gastos que coincidan con la búsqueda.');
    } else {
      estado('');
    }

    if (hayFiltros() && gastos.length) {
      el.resumen.textContent = lista.length + ' de ' + gastos.length +
        ' gastos · Subtotal de la búsqueda: ' + moneda.format(sumar(lista));
    } else if (lista.length) {
      el.resumen.textContent = 'Mostrando ' + visibles.length + ' de ' + lista.length + ' gastos';
    } else {
      el.resumen.textContent = '';
    }

    if (lista.length > LIMITE) {
      el.btnExpandir.hidden = false;
      el.btnExpandir.textContent = expandido
        ? 'Ver solo los últimos ' + LIMITE
        : 'Ver todos (' + lista.length + ')';
    } else {
      el.btnExpandir.hidden = true;
    }
  }

  /* ---------- eventos ---------- */

  el.form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (guardando) return;

    var fecha = el.fecha.value;
    var desc = el.desc.value.trim();
    var monto = parseFloat(el.monto.value);
    var quien = el.quien.value;

    el.formMsg.textContent = '';
    if (!fecha) return (el.formMsg.textContent = 'Elegí la fecha.');
    if (!(monto > 0)) return (el.formMsg.textContent = 'Ingresá un monto mayor a cero.');
    if (QUIENES.indexOf(quien) === -1) return (el.formMsg.textContent = 'Elegí quién realizó el gasto.');
    if (!desc) return (el.formMsg.textContent = 'Escribí una descripción.');
    if (!configurado()) return (el.formMsg.textContent = 'Falta configurar la URL de Apps Script en config.js.');

    guardando = true;
    el.btnGuardar.disabled = true;
    el.btnGuardar.textContent = 'Guardando…';

    guardar({ fecha: fecha, descripcion: desc, monto: monto, quien: quien })
      .then(function (res) {
        if (!res.ok) throw new Error(res.error || 'No se pudo guardar.');
        el.desc.value = '';
        el.monto.value = '';
        aviso('Gasto guardado');
        return cargar(true);
      })
      .catch(function (err) {
        console.error(err);
        el.formMsg.textContent = err.message && err.message !== 'Failed to fetch'
          ? err.message
          : 'No se pudo guardar. Revisá la conexión e intentá de nuevo.';
        aviso('No se guardó el gasto', true);
      })
      .then(function () {
        guardando = false;
        el.btnGuardar.disabled = false;
        el.btnGuardar.textContent = 'Guardar gasto';
      });
  });

  ['input', 'change'].forEach(function (evt) {
    [el.fTexto, el.fDesde, el.fHasta, el.fQuien].forEach(function (campo) {
      campo.addEventListener(evt, render);
    });
  });

  el.btnLimpiar.addEventListener('click', function () {
    el.fTexto.value = '';
    el.fDesde.value = '';
    el.fHasta.value = '';
    el.fQuien.value = '';
    render();
  });

  el.btnExpandir.addEventListener('click', function () {
    expandido = !expandido;
    render();
  });

  el.btnActualizar.addEventListener('click', function () { cargar(false); });

  // Como varias personas cargan gastos, se refresca al volver a la pestaña.
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && !guardando) cargar(true);
  });

  /* ---------- arranque ---------- */

  iniciarCampos();
  cargar(false);
})();
