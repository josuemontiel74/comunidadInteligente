import React, { useEffect, useRef, useState } from "react";
import Swal from 'sweetalert2';
import { Link, useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import "../Styles/dashboardSuperAdmin.css";
import logo from "../../img/logo.png";
import * as echarts from "echarts";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { visitasDia } from "../services/visitas.services";
import { paquetesDia } from "../services/paqueteria.services";
import { obtenerParqueaderos } from "../services/parqueadero.services.jsx";
import { reportes, reportesvisitas ,reportepaqueteria} from "../services/reportes.services.jsx";

function Reportes() {
    const navigator = useNavigate();
    const chartRef = useRef(null);
    const areasChartRef = useRef(null);
    const visitasChartRef = useRef(null);
    const paqueteriaChartRef = useRef(null);

    const [showUserMenu, setShowUserMenu] = useState(false);
    const [loading, setLoading] = useState(true);
    const [usuario, setUsuario] = useState(null);
    const [totalVisitas, setTotalVisitas] = useState(0);
    const [totalPaquetes, setTotalPaquetes] = useState(0);
    const [parqueaderos, setParqueaderos] = useState([]);
    // Token y roles
    const verificarTokenVencido = (token) => {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const fechaExp = payload.exp * 1000;
            return Date.now() >= fechaExp;
        } catch (err) {
            return true;
        }
    };

    const obtenerRolDelToken = (token) => {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            return payload.rolesId;
        } catch (err) {
            return null;
        }
    };

    const token = localStorage.getItem('token');
    const tokenValido = token && !verificarTokenVencido(token);
    const rolesId = token ? obtenerRolDelToken(token) : null;
    const showUserManagement = tokenValido && rolesId === 1; // solo SuperAdmin
    const showAreasComunes = tokenValido && rolesId !== 3; // ocultar para Vigilante (3)
    const [verificadorRol, setVerificadorRol] = useState(rolesId || null);

    useEffect(() => {
        setVerificadorRol(rolesId || null);
    }, [rolesId]);
    const [reporte, setReporte] = useState([]);
    const [paqueteriaRecords, setPaqueteriaRecords] = useState([]);
    const [tipoReporte, setTipoReporte] = useState(3);
    const [separateMetricPages, setSeparateMetricPages] = useState(false);
    const [printingMode, setPrintingMode] = useState(false);
    const paqRecRef = useRef(null);
    const paqPendRef = useRef(null);
    const paqEntRef = useRef(null);
    const paqRecChartInstance = useRef(null);
    const paqPendChartInstance = useRef(null);
    const paqEntChartInstance = useRef(null);

    // Estados para los filtros de fecha
    const [anioInicio, setAnioInicio] = useState(new Date().getFullYear());
    const [anioFin, setAnioFin] = useState(new Date().getFullYear());
    const [mesInicio, setMesInicio] = useState(1);
    const [mesFin, setMesFin] = useState(12);
    const [mesSemana, setMesSemana] = useState(new Date().getMonth() + 1);
    const [anioSemana, setAnioSemana] = useState(new Date().getFullYear());

    // Generar array de años (últimos 10 años + próximos 2)
    const generarAnios = () => {
        const anioActual = new Date().getFullYear();
        const anios = [];
        for (let i = anioActual - 10; i <= anioActual + 2; i++) {
            anios.push(i);
        }
        return anios;
    };

    const meses = [
        { valor: 1, nombre: 'Enero' },
        { valor: 2, nombre: 'Febrero' },
        { valor: 3, nombre: 'Marzo' },
        { valor: 4, nombre: 'Abril' },
        { valor: 5, nombre: 'Mayo' },
        { valor: 6, nombre: 'Junio' },
        { valor: 7, nombre: 'Julio' },
        { valor: 8, nombre: 'Agosto' },
        { valor: 9, nombre: 'Septiembre' },
        { valor: 10, nombre: 'Octubre' },
        { valor: 11, nombre: 'Noviembre' },
        { valor: 12, nombre: 'Diciembre' }
    ];

    // Construir rango según tipo de reporte
    const construirRango = () => {
        if (tipoReporte === 1) {
            return {
                fechaInicio: `${anioInicio}-01-01`,
                fechaFin: `${anioFin}-12-31`
            };
        } else if (tipoReporte === 2) {
            return {
                fechaInicio: `${anioInicio}-${String(mesInicio).padStart(2, '0')}-01`,
                fechaFin: `${anioFin}-${String(mesFin).padStart(2, '0')}-31`
            };
        } else if (tipoReporte === 3) {
            return {
                fechaInicio: `${anioSemana}-${String(mesSemana).padStart(2, '0')}-01`,
                fechaFin: `${anioSemana}-${String(mesSemana).padStart(2, '0')}-31`
            };
        }
        return { fechaInicio: null, fechaFin: null };
    };



    // Descargar como PDF (
    const downloadPDF = () => {
        const container = document.getElementById('report-container');
        if (!container) {
            alert('No se encontró el contenedor para imprimir');
            return;
        }

        // Activar modo de impresión para ocultar controles en la UI inmediatamente
        setPrintingMode(true);

        // Crear reglas temporales para impresión en la misma ventana
        const style = document.createElement('style');
        style.id = 'print-only-report-container';
        style.type = 'text/css';
        let cssText = `


@media print {
 
    /* Ocultar todo y mostrar solo el reporte */
    body * { visibility: hidden !important; }
    #report-container, #report-container * { 
        visibility: visible !important; 
        font-family: Arial, sans-serif !important;
    }
    
    #report-container { 
    
        position: absolute !important; 
        left: 0; 
        top: 0; 
        width: 100% !important; 
        padding: 40px !important; 
        font-size: 12pt !important;
    }

    /* LOGO CENTRADO Y GRANDE */
    .report-print-header { 
        text-align: center !important;
        margin-bottom: 20px !important; 
        padding-bottom: 10px !important;
        border-bottom: 2px solid #000 !important;
    }

    .report-print-header img.print-logo {
        height: 110px !important;
        max-width: 260px !important;
        margin-bottom: 10px !important;
    }

    .report-print-header h1 {
        font-size: 22pt !important;
        margin: 0 !important;
        font-weight: bold !important;
        text-transform: uppercase !important;
    }

    /* SUBTÍTULOS PROFESIONALES */
    .report-section-title {
        font-size: 18pt !important;
        font-weight: bold !important;
        margin-top: 30px !important;
        margin-bottom: 12px !important;
        text-transform: uppercase !important;
        border-left: 5px solid #198754 !important;
        padding-left: 10px !important;
    }

    /* LIMPIAR TARJETAS Y AUMENTAR ESPACIADO PARA IMPRESIÓN */
    #report-container .card { 
        box-shadow: none !important; 
        border: none !important; 
        background: transparent !important; 
        margin: 28px 0 !important;
        padding-bottom: 12px !important;
        page-break-inside: avoid !important;
    }

    /* Cuerpo de tarjetas */
    #report-container .card-body { 
        padding: 8px 0 !important; 
        /* Anular cualquier max-height inline para impresión */
        max-height: none !important;
        overflow: visible !important;
    }

    /* Gráficos a ancho completo y con mayor altura para evitar solapamientos en PDF */
    #report-container canvas, 
    #report-container svg,
    #report-container .card-body > div {
        width: 100% !important; 
        height: auto !important; 
        max-height: none !important;
        min-height: 520px !important;
    }

    /* Asegurar separación entre columnas cuando se apilan */
    #report-container .row.g-4 { 
        display: block !important; 
    }

    #report-container .row.g-4 > .col-md-6 {
        width: 100% !important; 
        display: block !important;
        margin-bottom: 18px !important;
    }

    /* Filas de Bootstrap: una columna debajo de otra */
    #report-container .row.g-4 { 
        display: block !important; 
    }

    #report-container .row.g-4 > .col-md-6 {
        width: 100% !important; 
        display: block !important;
    }

    /* Mostrar bloques exclusivos de impresión */
    .print-only { display: block !important; }
`;

        // Si el usuario pidió métricas en páginas separadas añadir regla
        if (separateMetricPages) {
            cssText += `
    /* Forzar salto de página entre métricas */
    .metric-card { page-break-after: always !important; }
`;
        }

        cssText += `
}

/* En pantalla normal ocultar los elementos print-only */
.print-only { display: none; }
`;

        style.appendChild(document.createTextNode(cssText));


        document.head.appendChild(style);

        // Esperar que React actualice el DOM y que los gráficos se redibujen.
        // Despachamos un resize para que ECharts vuelva a ajustar tamaños,
        // luego esperamos antes de abrir la ventana de impresión.
        setTimeout(() => {
            try {
                // Forzar redimensionado de gráficos registrados
                window.dispatchEvent(new Event('resize'));
            } catch (err) {
                console.warn('No se pudo despachar resize:', err);
            }

            // Dar tiempo a que ECharts re-renderice antes de imprimir
            setTimeout(() => {
                try {
                    window.print();
                } catch (err) {
                    console.error('Error al imprimir:', err);
                    alert('Error al intentar imprimir. Revisa la consola para más detalles.');
                } finally {
                    const existing = document.getElementById('print-only-report-container');
                    if (existing) existing.parentNode.removeChild(existing);
                    setPrintingMode(false);
                }
            }, 700);
        }, 600);
    };

    // Obtener parqueaderos
    useEffect(() => {
        async function fetchParqueaderos() {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const res = await obtenerParqueaderos(token);
                const data = await res.json();
                setParqueaderos(data.body);
            } catch (error) {
                console.error("Error cargando parqueaderos:", error);
            }
        }
        fetchParqueaderos();
    }, []);





    // Verificar usuario
    useEffect(() => {
        const token = localStorage.getItem("token");
        const userGuardado = localStorage.getItem("user");

        if (!token) {
            Swal.fire({ icon: 'warning', title: 'Sesión expirada', text: 'La sesión expiró. Vuelva a iniciar sesión.', timer: 2000, showConfirmButton: false, timerProgressBar: true }).then(() => {
                localStorage.clear();
                navigator('/');
            });
            return;
        }

        if (userGuardado) {
            try {
                const usuarioParsed = JSON.parse(userGuardado);
                setUsuario(usuarioParsed);
                setLoading(false);
            } catch (error) {
                console.error("Error parseando usuario:", error);
                localStorage.clear();
                navigator("/");
            }
        }
    }, [navigator]);

    //Obtner datos de paqueteria

    // Obtener datos de áreas comunes
    useEffect(() => {
        async function fetchAreacomunes() {
            const token = localStorage.getItem("token");
            if (!token) return;
            try {
                const rango = construirRango();
                const res = await reportes(token, tipoReporte, rango);
                const data = await res.json();
                console.log("=== RESPUESTA COMPLETA ===");
                console.log("Datos:", data);
                console.log("Reporte:", data.areascomunesReporte);
                console.log("Tipo de reporte:", tipoReporte);
                console.log("Rango:", rango);

                if (data.ok && data.areascomunesReporte) {
                    setReporte(data.areascomunesReporte);
                } else {
                    console.error("No hay datos en el reporte");
                    setReporte([]);
                }
            } catch (error) {
                console.error("Error cargando áreas comunes:", error);
                setReporte([]);
            }
        }
        fetchAreacomunes();
    }, [tipoReporte, anioInicio, anioFin, mesInicio, mesFin, mesSemana, anioSemana]);

    // Log para depurar lo que llega del backend
    useEffect(() => {
        console.log('DEBUG - datos recibidos en `reporte`:', reporte);
    }, [reporte]);

    // Gráfico de Áreas Comunes (líneas separadas por cada área para comparar)
    useEffect(() => {
        if (!areasChartRef.current) {
            console.log("No hay referencia al chart");
            return;
        }

        const myChart = echarts.init(areasChartRef.current);

        if (reporte.length === 0) {
            myChart.clear();
            myChart.setOption({
                title: { text: 'Áreas Comunes (Sin información en la fecha elegida.)', left: 'center' }
            });
            return () => myChart.dispose();
        }


        console.log("Datos del reporte:", reporte);

        // Mapear nombres legibles para las áreas
        const nombresAreas = {
            1: "Salón Comunal 1",
            2: "Salón Comunal 2",
            3: "BBQ"
        };

        // Construir un conjunto de claves ordenables y su etiqueta legible
        const keysMap = new Map();
        reporte.forEach(r => {
            const anio = r.anio !== undefined ? String(r.anio) : '';
            const mesNum = r.mes !== undefined ? Number(r.mes) : null;
            const semana = r.semanaMes ?? r.semana ?? r.week ?? null;
            let key = '';
            let label = '';
            let sortValue = 0;
            if (tipoReporte === 1) {
                key = anio;
                label = anio;
                sortValue = Number(anio) || 0;
            } else if (tipoReporte === 2) {
                key = `${anio}-${String(mesNum).padStart(2, '0')}`;
                const mesName = meses.find(m => m.valor === mesNum)?.nombre || (mesNum || '');
                label = `${mesName} ${anio}`;
                sortValue = Number(anio) * 100 + (mesNum || 0);
            } else {
                key = `${anio}-W${String(semana).padStart(2, '0')}`;
                label = `Sem ${semana} ${anio}`;
                sortValue = Number(anio) * 100 + (Number(semana) || 0);
            }

            if (!keysMap.has(key)) keysMap.set(key, { label, sortValue });
        });

        // Ordenar por sortValue
        const orderedKeys = Array.from(keysMap.entries())
            .sort((a, b) => a[1].sortValue - b[1].sortValue)
            .map(([k, v]) => ({ key: k, label: v.label }));

        const ejeXArray = orderedKeys.map(k => k.label);

        // Obtener lista de áreas únicas
        const areasIds = [...new Set(reporte.map(r => r.areaComunId))];

        // Paleta de colores
        const colores = ['#198754', '#0d6efd', '#fd7e14', '#6f42c1', '#20c997', '#dc3545'];

        // Construir series: una línea por área, con suma por cada key
        const seriesData = areasIds.map((id, idx) => {
            const name = nombresAreas[id] || `Área ${id}`;
            const data = orderedKeys.map(k => {
                const sum = reporte.reduce((acc, r) => {
                    // reconstruir key del registro
                    let recordKey = '';
                    if (tipoReporte === 1) recordKey = String(r.anio);
                    else if (tipoReporte === 2) recordKey = `${String(r.anio)}-${String(r.mes).padStart(2, '0')}`;
                    else recordKey = `${String(r.anio)}-W${String((r.semanaMes ?? r.semana ?? r.week) || '').padStart(2, '0')}`;
                    return acc + ((r.areaComunId === id && recordKey === k.key) ? parseInt(r.totalVisitas || 0) : 0);
                }, 0);
                return sum;
            });

            return {
                name,
                type: 'line',
                smooth: true,
                data,
                itemStyle: { color: colores[idx % colores.length] },
                areaStyle: { color: colores[idx % colores.length], opacity: 0.15 }
            };
        });

        const option = {
            title: {
                text: tipoReporte === 1 ? 'Áreas Comunes por Año' : tipoReporte === 2 ? 'Áreas Comunes por Mes' : 'Áreas Comunes por Semana',
                left: 'center'
            },
            tooltip: { trigger: 'axis' },
            legend: { top: 'bottom' },
            grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
            xAxis: { type: 'category', data: ejeXArray, axisLabel: { rotate: 45 } },
            yAxis: { type: 'value', name: 'Reservas' },
            series: seriesData
        };

        myChart.setOption(option, true);

        const resizeChart = () => myChart.resize();
        window.addEventListener('resize', resizeChart);

        return () => {
            window.removeEventListener('resize', resizeChart);
            myChart.dispose();
        };
    }, [reporte, tipoReporte]);

    // Gráfico de Visitas (datos reales desde backend)
    useEffect(() => {
        async function fetchVisitasReporte() {
            const token = localStorage.getItem('token');
            if (!token || !visitasChartRef.current) return;

            const rango = construirRango();
            try {
                // Enviar el tipo de reporte seleccionado al backend (1=año,2=mes,3=semana)
                console.log('Llamando a reportesvisitas con por=', tipoReporte, 'y rango:', rango);
                const res = await reportesvisitas(token, tipoReporte, rango);
                console.log('Respuesta reportesvisitas status:', res.status);
                const data = await res.json();

                // Normalizar posibles formas de respuesta: array, { body: [...] } o Sequelize rows ({ dataValues })
                const registrosRaw = Array.isArray(data) ? data : (data.body || []);
                const registros = registrosRaw.map(r => (r && r.dataValues) ? r.dataValues : r);
                console.log('Registros normalizados para graficar (registros):', registros);

                const myChart = echarts.init(visitasChartRef.current);

                if (!registros || registros.length === 0) {
                    myChart.clear();
                    myChart.setOption({ title: { text: 'Visitas (sin datos)', left: 'center' } });
                    return;
                }

                // Construir eje X ordenado y mapear valores
                const keysMap = new Map();
                registros.forEach(r => {
                    const anio = r.anio !== undefined ? String(r.anio) : '';
                    const mesNum = r.mes !== undefined ? Number(r.mes) : null;
                    const semana = r.semana ?? r.week ?? r.semanaMes ?? null;
                    let key = '';
                    let label = '';
                    let sortValue = 0;

                    if (tipoReporte === 1) {
                        key = anio;
                        label = anio;
                        sortValue = Number(anio) || 0;
                    } else if (tipoReporte === 2) {
                        key = `${anio}-${String(mesNum).padStart(2, '0')}`;
                        const mesName = meses.find(m => m.valor === mesNum)?.nombre || (mesNum || '');
                        label = `${mesName} ${anio}`;
                        sortValue = Number(anio) * 100 + (mesNum || 0);
                    } else {
                        key = `${anio}-W${String(semana).padStart(2, '0')}`;
                        label = `Sem ${semana} ${anio}`;
                        sortValue = Number(anio) * 100 + (Number(semana) || 0);
                    }

                    if (!keysMap.has(key)) keysMap.set(key, { label, sortValue });
                });

                const orderedKeys = Array.from(keysMap.entries())
                    .sort((a, b) => a[1].sortValue - b[1].sortValue)
                    .map(([k, v]) => ({ key: k, label: v.label }));

                const ejeXArray = orderedKeys.map(k => k.label);

                // Mapear numeroVisitas a cada key
                const valores = orderedKeys.map(k => {
                    const registro = registros.find(r => {
                        let recordKey = '';
                        if (tipoReporte === 1) recordKey = String(r.anio);
                        else if (tipoReporte === 2) recordKey = `${String(r.anio)}-${String(r.mes).padStart(2, '0')}`;
                        else {
                            const sem = r.semana ?? r.week ?? r.semanaMes ?? '';
                            recordKey = `${String(r.anio)}-W${String(sem).padStart(2, '0')}`;
                        }
                        return recordKey === k.key;
                    });
                    return registro ? Number(registro.numeroVisitas ?? registro.numero ?? registro.numero_visitas ?? 0) : 0;
                });

                const titulo = tipoReporte === 1 ? 'Visitas por Año' : tipoReporte === 2 ? 'Visitas por Mes' : 'Visitas por Semana';

                const option = {
                    title: { text: titulo, left: 'center' },
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: { type: 'shadow' },
                        formatter: function (params) {
                            const p = params[0];
                            return `${p.axisValueLabel}<br/>Visitas: <strong>${p.data}</strong>`;
                        }
                    },
                    xAxis: { type: 'category', data: ejeXArray, axisLabel: { rotate: 45 } },
                    yAxis: { type: 'value', name: 'Visitas' },
                    series: [{ data: valores, type: 'bar', barMaxWidth: '48%', itemStyle: { color: '#0d6efd' } }]
                };

                myChart.setOption(option, true);

                const resizeChart = () => myChart.resize();
                window.addEventListener('resize', resizeChart);

                return () => {
                    window.removeEventListener('resize', resizeChart);
                    myChart.dispose();
                };

            } catch (error) {
                console.error('Error cargando reporte de visitas:', error);
            }
        }

        fetchVisitasReporte();
    }, [loading, tipoReporte, anioInicio, anioFin, mesInicio, mesFin, mesSemana, anioSemana]);

    // Gráfico de Paquetería (datos reales desde backend)
    useEffect(() => {
        async function fetchPaqueteriaReporte() {
            const token = localStorage.getItem('token');
            if (!token || !paqueteriaChartRef.current) return;

            const rango = construirRango();
            try {
                console.log('Llamando a reportepaqueteria (paqueteria) con por=', tipoReporte, 'rango:', rango);
                const res = await reportepaqueteria(token, tipoReporte, rango);
                console.log('Respuesta reportes(paquete) status:', res.status);
                const data = await res.json();
                console.log('Datos crudos paqueteria:', data);

                // Normalizar posibles formas de respuesta: array, { informe: [...] }, { body: [...] }
                const registrosRaw = Array.isArray(data) ? data : (data.informe || data.body || data.paqueteria || []);
                const registros = registrosRaw.map(r => (r && r.dataValues) ? r.dataValues : r);
                setPaqueteriaRecords(registros);

                // Guardar registros
                setPaqueteriaRecords(registros);

                // Construir eje X (año/mes/semana)
                const keysMap = new Map();
                registros.forEach(r => {
                    const anio = r.anio !== undefined ? String(r.anio) : '';
                    const mesNum = r.mes !== undefined ? Number(r.mes) : null;
                    const semana = r.semana ?? r.semanaMes ?? r.week ?? null;
                    let key = '';
                    let label = '';
                    let sortValue = 0;

                    if (tipoReporte === 1) {
                        key = anio;
                        label = anio;
                        sortValue = Number(anio) || 0;
                    } else if (tipoReporte === 2) {
                        key = `${anio}-${String(mesNum).padStart(2, '0')}`;
                        const mesName = meses.find(m => m.valor === mesNum)?.nombre || (mesNum || '');
                        label = `${mesName} ${anio}`;
                        sortValue = Number(anio) * 100 + (mesNum || 0);
                    } else {
                        key = `${anio}-W${String(semana).padStart(2, '0')}`;
                        label = `Sem ${semana} ${anio}`;
                        sortValue = Number(anio) * 100 + (Number(semana) || 0);
                    }

                    if (!keysMap.has(key)) keysMap.set(key, { label, sortValue });
                });

                const orderedKeys = Array.from(keysMap.entries())
                    .sort((a, b) => a[1].sortValue - b[1].sortValue)
                    .map(([k, v]) => ({ key: k, label: v.label }));

                const ejeXArray = orderedKeys.map(k => k.label);

                // Mapear 3 series: recibidos, pendientes, entregados
                const recibidos = orderedKeys.map(k => {
                    const reg = registros.find(r => {
                        let rk = '';
                        if (tipoReporte === 1) rk = String(r.anio);
                        else if (tipoReporte === 2) rk = `${String(r.anio)}-${String(r.mes).padStart(2, '0')}`;
                        else {
                            const sem = r.semana ?? r.semanaMes ?? r.week ?? '';
                            rk = `${String(r.anio)}-W${String(sem).padStart(2, '0')}`;
                        }
                        return rk === k.key;
                    });
                    return reg ? Number(reg.recibidos ?? reg.recibido ?? reg.count ?? 0) : 0;
                });

                const pendientes = orderedKeys.map(k => {
                    const reg = registros.find(r => {
                        let rk = '';
                        if (tipoReporte === 1) rk = String(r.anio);
                        else if (tipoReporte === 2) rk = `${String(r.anio)}-${String(r.mes).padStart(2, '0')}`;
                        else {
                            const sem = r.semana ?? r.semanaMes ?? r.week ?? '';
                            rk = `${String(r.anio)}-W${String(sem).padStart(2, '0')}`;
                        }
                        return rk === k.key;
                    });
                    return reg ? Number(reg.pendientes ?? reg.pendiente ?? reg.pendientes_count ?? 0) : 0;
                });

                const entregados = orderedKeys.map(k => {
                    const reg = registros.find(r => {
                        let rk = '';
                        if (tipoReporte === 1) rk = String(r.anio);
                        else if (tipoReporte === 2) rk = `${String(r.anio)}-${String(r.mes).padStart(2, '0')}`;
                        else {
                            const sem = r.semana ?? r.semanaMes ?? r.week ?? '';
                            rk = `${String(r.anio)}-W${String(sem).padStart(2, '0')}`;
                        }
                        return rk === k.key;
                    });
                    return reg ? Number(reg.entregados ?? reg.entregado ?? reg.entregados_count ?? 0) : 0;
                });

                // Si el usuario quiere métricas separadas, dibujar 3 charts individuales
                if (separateMetricPages) {
                    // limpiar chart combinado si existe
                    try { if (paqueteriaChartRef.current) echarts.dispose(paqueteriaChartRef.current); } catch(e){}

                    // Recibidos
                    if (paqRecChartInstance.current) { paqRecChartInstance.current.dispose(); paqRecChartInstance.current = null; }
                    if (paqRecRef.current) {
                        paqRecChartInstance.current = echarts.init(paqRecRef.current);
                        paqRecChartInstance.current.setOption({
                            title: { text: 'Recibidos', left: 'center' },
                            xAxis: { type: 'category', data: ejeXArray, axisLabel: { rotate: 45 } },
                            yAxis: { type: 'value' },
                            tooltip: { trigger: 'axis' },
                            series: [{ data: recibidos, type: 'line', smooth: true, itemStyle: { color: '#0d6efd' }, areaStyle: { color: 'rgba(13,110,253,0.12)' } }]
                        }, true);
                    }

                    // Pendientes
                    if (paqPendChartInstance.current) { paqPendChartInstance.current.dispose(); paqPendChartInstance.current = null; }
                    if (paqPendRef.current) {
                        paqPendChartInstance.current = echarts.init(paqPendRef.current);
                        paqPendChartInstance.current.setOption({
                            title: { text: 'Pendientes', left: 'center' },
                            xAxis: { type: 'category', data: ejeXArray, axisLabel: { rotate: 45 } },
                            yAxis: { type: 'value' },
                            tooltip: { trigger: 'axis' },
                            series: [{ data: pendientes, type: 'line', smooth: true, itemStyle: { color: '#ffc107' }, areaStyle: { color: 'rgba(255,193,7,0.12)' } }]
                        }, true);
                    }

                    // Entregados
                    if (paqEntChartInstance.current) { paqEntChartInstance.current.dispose(); paqEntChartInstance.current = null; }
                    if (paqEntRef.current) {
                        paqEntChartInstance.current = echarts.init(paqEntRef.current);
                        paqEntChartInstance.current.setOption({
                            title: { text: 'Entregados', left: 'center' },
                            xAxis: { type: 'category', data: ejeXArray, axisLabel: { rotate: 45 } },
                            yAxis: { type: 'value' },
                            tooltip: { trigger: 'axis' },
                            series: [{ data: entregados, type: 'line', smooth: true, itemStyle: { color: '#198754' }, areaStyle: { color: 'rgba(25,135,84,0.12)' } }]
                        }, true);
                    }

                    const resizeRec = () => { if (paqRecChartInstance.current) paqRecChartInstance.current.resize(); };
                    const resizePend = () => { if (paqPendChartInstance.current) paqPendChartInstance.current.resize(); };
                    const resizeEnt = () => { if (paqEntChartInstance.current) paqEntChartInstance.current.resize(); };
                    window.addEventListener('resize', resizeRec);
                    window.addEventListener('resize', resizePend);
                    window.addEventListener('resize', resizeEnt);

                    return () => {
                        window.removeEventListener('resize', resizeRec);
                        window.removeEventListener('resize', resizePend);
                        window.removeEventListener('resize', resizeEnt);
                        if (paqRecChartInstance.current) { paqRecChartInstance.current.dispose(); paqRecChartInstance.current = null; }
                        if (paqPendChartInstance.current) { paqPendChartInstance.current.dispose(); paqPendChartInstance.current = null; }
                        if (paqEntChartInstance.current) { paqEntChartInstance.current.dispose(); paqEntChartInstance.current = null; }
                    };
                }

                // Si no separamos métricas, dibujar gráfico combinado
                const myChart = echarts.init(paqueteriaChartRef.current);

                if (!registros || registros.length === 0) {
                    myChart.clear();
                    myChart.setOption({ title: { text: 'Paquetería (sin datos)', left: 'center' } });
                    return;
                }

                const option = {
                    title: { text: tipoReporte === 1 ? 'Paquetería por Año' : tipoReporte === 2 ? 'Paquetería por Mes' : 'Paquetería por Semana', left: 'center' },
                    tooltip: { trigger: 'axis' },
                    legend: { top: 'bottom' },
                    xAxis: { type: 'category', data: ejeXArray, axisLabel: { rotate: 45 } },
                    yAxis: { type: 'value', name: 'Paquetes' },
                    series: [
                        { name: 'Recibidos', data: recibidos, type: 'line', smooth: true, itemStyle: { color: '#0d6efd' }, areaStyle: { color: 'rgba(13,110,253,0.12)' } },
                        { name: 'Pendientes', data: pendientes, type: 'line', smooth: true, itemStyle: { color: '#ffc107' }, areaStyle: { color: 'rgba(255,193,7,0.12)' } },
                        { name: 'Entregados', data: entregados, type: 'line', smooth: true, itemStyle: { color: '#198754' }, areaStyle: { color: 'rgba(25,135,84,0.12)' } }
                    ]
                };

                myChart.setOption(option, true);

                const resizeChart = () => myChart.resize();
                window.addEventListener('resize', resizeChart);

                return () => {
                    window.removeEventListener('resize', resizeChart);
                    myChart.dispose();
                };

            } catch (error) {
                console.error('Error cargando paquetería:', error);
            }
        }

        fetchPaqueteriaReporte();
    }, [loading, tipoReporte, anioInicio, anioFin, mesInicio, mesFin, mesSemana, anioSemana]);

    // Gráfico de Parqueaderos
    useEffect(() => {
        if (loading) return;

        const ctx = document.getElementById("parqueoChart");
        if (!ctx) return;

        if (chartRef.current) {
            chartRef.current.destroy();
        }

        const espaciosLibres = parqueaderos.filter((p) => p.estadoId === 4).length;
        const espaciosOcupados = parqueaderos.filter((p) => p.estadoId === 3).length;

        chartRef.current = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Ocupados", "Disponibles"],
                datasets: [{
                    data: [espaciosOcupados, espaciosLibres],
                    backgroundColor: ["#dc3545", "#198754"]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: "bottom" },
                    title: {
                        display: true,
                        text: 'Estado de Parqueaderos'
                    }
                }
            }
        });

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, [parqueaderos, loading]);

    const cerrarSesión = (e) => {
        e.preventDefault();
        localStorage.clear();
        navigator("/");
    };

    if (loading) {
        return <h2 className="text-center text-success mt-5">Verificando sesión...</h2>;
    }

    return (
        <div className="main-dashboard dashboard-container d-flex">
            <aside id="menuTrabajador" className="worker-menu bg-success text-white">
                <div className="p-3 d-flex flex-column h-100">
                    <div className="d-flex align-items-center gap-3 mb-4">
                        <div className="user-circle bg-white d-flex align-items-center justify-content-center"
                            style={{ width: "50px", height: "50px", borderRadius: "50%" }}>
                            <span className="fw-bold text-success">
                                {usuario?.username?.substring(0, 2).toUpperCase() || "US"}
                            </span>
                        </div>
                        <div className="d-flex flex-column">
                            <span className="fw-semibold text-white">
                                {usuario?.username || usuario?.nombre || "Usuario"}
                            </span>
                            <span className="fw-semibold text-white">Super Admin</span>
                            <span className="small text-white-50">Sesión activa</span>
                        </div>
                    </div>

                    <h5 className="mb-3 mx-4">Menú Super Admin</h5>

                    <div className="mb-4">
                        <h6 className="text-uppercase fw-bold">Gestión de Paquetes</h6>
                        <ul className="nav flex-column mt-2 gap-2">
                            <li>
                                <Link className="nav-link text-white" to="/Paqueteria" state={{ abrirModal: true }}>
                                    Registrar Paquete
                                </Link>
                            </li>
                            <li>
                                <Link className="nav-link text-white" to="/Paqueteria">
                                    Historial de Paquetes
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="mb-4">
                        <h6 className="text-uppercase fw-bold">Gestión de Visitas</h6>
                        <ul className="nav flex-column mt-2 gap-2">
                            <li>
                                <Link className="nav-link text-white" to="/visitas" state={{ abrirModal: true }}>
                                    Crear Visita
                                </Link>
                            </li>
                            <li>
                                <Link className="nav-link text-white" to="/visitas">
                                    Consultar Visitas
                                </Link>
                            </li>
                            <li>
                                <Link className="nav-link text-white" to="/parqueaderos">
                                    Consultar Parqueaderos
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {showAreasComunes && (
                        <div className="mb-4">
                            <h6 className="text-uppercase fw-bold">Gestión de Áreas Comunes</h6>
                            <ul className="nav flex-column mt-2 gap-2">
                                <li>
                                    <Link className="nav-link text-white" to="/AreasComunes">
                                        Registrar Reserva
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    )}

                    {showUserManagement && (
                        <div className="mb-4">
                            <h6 className="text-uppercase fw-bold">Gestión de Usuarios</h6>
                            <ul className="nav flex-column mt-2 gap-2">
                                <li>
                                    <Link className="nav-link text-white" to="/GestionUsuario" state={{ abrirModal: true }}>
                                        Registrar Usuario
                                    </Link>
                                </li>
                                <li>
                                    <Link className="nav-link text-white" to="/GestionUsuario">
                                        Consultar Usuarios
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    )}

                    <div className="mb-4">
                        <h6 className="text-uppercase fw-bold">Gestión Residentes</h6>
                        <ul className="nav flex-column mt-2 gap-2">
                            <li>
                                <Link className="nav-link text-white" to="/Residentes" state={{ abrirModal: true }}>
                                    Crear Residente
                                </Link>
                            </li>
                            <li>
                                <Link className="nav-link text-white" to="/Residentes">
                                    Consultar Residente
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="mt-auto text-center logout-container">
                        <button onClick={cerrarSesión} className="btn btn-light w-100">
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            </aside>

            <div className="main-content flex-grow-1">
                <div className="container-md d-flex align-items-center justify-content-between px-3 py-2">
                    <div className="logo-container text-center flex-grow-1">
                        <Link to="/Superadmin">
                            <img src={logo} alt="Logo del sistema" className="logo-img" />
                        </Link>
                    </div>
                    <div className="position-relative">
                        <div
                            className="btn btn-outline-success d-flex align-items-center gap-2"
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            style={{ cursor: "pointer" }}
                        >
                            {usuario?.username || usuario?.nombre || "Usuario"}
                        </div>
                        {showUserMenu && (
                            <div className="user-menu text-center">
                                <p>
                                    Usuario: <strong>{usuario?.username || usuario?.nombre || "Usuario"}</strong>
                                </p>
                                <p>
                                    Rol: <strong>Super Admin</strong>
                                </p>
                                <hr />
                                <div className="text-center">
                                    <button onClick={cerrarSesión} className="btn btn-danger d-block mx-auto">
                                        Cerrar sesión
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-center mt-3 my-4">
                    <h2 className="fw-bold"> Reportes del conjunto</h2>
                </div>

                <div id="report-container" className="container-fluid px-4">

                    <div className={`d-flex justify-content-end gap-2 mb-3 ${printingMode ? 'd-none' : ''} no-print`}>

                    </div>
                    {/* Botones de tipo de reporte */}
                    <div className={`d-flex flex-wrap justify-content-center gap-3 mb-4 ${printingMode ? 'd-none' : ''} no-print`}>

                        <button className="btn btn-danger d-flex align-items-center px-4 shadow-sm fw-semibold"
                            onClick={() => downloadPDF()}>
                            <i className="bi bi-filetype-pdf me-2 fs-5"></i>
                            Descargar PDF
                        </button>

                        <button
                            onClick={() => setTipoReporte(2)}
                            className={`btn d-flex align-items-center px-4 shadow-sm fw-semibold 
            ${tipoReporte === 2 ? 'btn-success' : 'btn-outline-success'}`}
                        >
                            <i className="bi bi-calendar-month me-2 fs-5"></i>
                            Reporte por Mes
                        </button>

                        <button
                            onClick={() => setTipoReporte(1)}
                            className={`btn d-flex align-items-center px-4 shadow-sm fw-semibold 
            ${tipoReporte === 1 ? 'btn-success' : 'btn-outline-success'}`}
                        >
                            <i className="bi bi-calendar-range me-2 fs-5"></i>
                            Reporte por Año
                        </button>

                        <button
                            onClick={() => setTipoReporte(3)}
                            className={`btn d-flex align-items-center px-4 shadow-sm fw-semibold 
            ${tipoReporte === 3 ? 'btn-success' : 'btn-outline-success'}`}
                        >
                            <i className="bi bi-calendar-week me-2 fs-5"></i>
                            Reporte por Semanas
                        </button>

                    </div>


                    {/* Filtros según tipo de reporte */}
                    <div className={`card border-0 shadow-lg mb-4 ${printingMode ? 'd-none' : ''} no-print`}>
                        <div className="card-header bg-success text-white py-3">
                            <h5 className="mb-0">
                                <i className="bi bi-funnel-fill me-2"></i> Filtros de Fecha
                            </h5>
                        </div>

                        <div className="card-body">

                            <h5 className="card-title mb-3">
                                <i className="bi bi-funnel me-2"></i>
                                Filtros de Fecha
                            </h5>

                            {/* Filtros para reporte por año */}
                            {tipoReporte === 1 && (
                                <div className="row g-4">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Año Inicio</label>
                                        <select className="form-select shadow-sm"
                                            value={anioInicio}
                                            onChange={(e) => setAnioInicio(parseInt(e.target.value))}
                                        >
                                            {generarAnios().map(anio => (
                                                <option key={anio} value={anio}>{anio}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Año Fin</label>
                                        <select className="form-select shadow-sm"
                                            value={anioFin}
                                            onChange={(e) => setAnioFin(parseInt(e.target.value))}
                                        >
                                            {generarAnios().map(anio => (
                                                <option key={anio} value={anio}>{anio}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}


                            {/* Filtros para reporte por mes */}
                            {tipoReporte === 2 && (
                                <div className="row g-4">
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Mes Inicio</label>
                                        <select className="form-select shadow-sm"
                                            value={mesInicio}
                                            onChange={(e) => setMesInicio(parseInt(e.target.value))}
                                        >
                                            {meses.map(m => (
                                                <option key={m.valor} value={m.valor}>{m.nombre}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Año Inicio</label>
                                        <select className="form-select shadow-sm"
                                            value={anioInicio}
                                            onChange={(e) => setAnioInicio(parseInt(e.target.value))}
                                        >
                                            {generarAnios().map(anio => (
                                                <option key={anio} value={anio}>{anio}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Mes Fin</label>
                                        <select className="form-select shadow-sm"
                                            value={mesFin}
                                            onChange={(e) => setMesFin(parseInt(e.target.value))}
                                        >
                                            {meses.map(m => (
                                                <option key={m.valor} value={m.valor}>{m.nombre}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Año Fin</label>
                                        <select className="form-select shadow-sm"
                                            value={anioFin}
                                            onChange={(e) => setAnioFin(parseInt(e.target.value))}
                                        >
                                            {generarAnios().map(anio => (
                                                <option key={anio} value={anio}>{anio}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Filtros para reporte por semana */}
                            {tipoReporte === 3 && (
                                <div className="row g-4">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Mes</label>
                                        <select className="form-select shadow-sm"
                                            value={mesSemana}
                                            onChange={(e) => setMesSemana(parseInt(e.target.value))}
                                        >
                                            {meses.map(m => (
                                                <option key={m.valor} value={m.valor}>{m.nombre}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Año</label>
                                        <select className="form-select shadow-sm"
                                            value={anioSemana}
                                            onChange={(e) => setAnioSemana(parseInt(e.target.value))}
                                        >
                                            {generarAnios().map(anio => (
                                                <option key={anio} value={anio}>{anio}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Gráficos */}
                    <div className="row g-4">
                        <div className="col-md-12">
                            <div className="card shadow-sm border-success">
                                <div className="card-header bg-success text-white">
                                    <h5 className="mb-0">
                                        <i className="bi bi-graph-up me-2"></i>
                                        Áreas Comunes
                                    </h5>
                                </div>
                                <div className="card-body overflow-auto" style={{ maxHeight: '100%' }}>
                                    <div ref={areasChartRef} style={{ width: '100%', height: '400px' }}>

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-12">
                            <div className="card shadow-sm border-info">
                                <div className="card-header bg-info text-white">
                                    <h5 className="mb-0">
                                        <i className="bi bi-calendar-event me-2"></i>
                                        Visitas
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <div ref={visitasChartRef} style={{ width: '100%', height: '300px' }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-12">
                            <div className="card shadow-sm border-primary">
                                <div className="card-header bg-primary text-white">
                                    <h5 className="mb-0">
                                        <i className="bi bi-box-seam me-2"></i>
                                        Paquetería Semanal
                                    </h5>
                                </div>
                                <div className="card-body">
                                    {!separateMetricPages ? (
                                        <>
                                            <div ref={paqueteriaChartRef} style={{ width: '100%', height: '300px' }}></div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="metric-card card shadow-sm mb-3">
                                                <div className="card-header bg-light">
                                                    <strong>Recibidos</strong>
                                                </div>
                                                <div className="card-body">
                                                    <div ref={paqRecRef} style={{ width: '100%', height: '520px' }}></div>
                                                </div>
                                            </div>

                                            <div className="metric-card card shadow-sm mb-3">
                                                <div className="card-header bg-light">
                                                    <strong>Pendientes</strong>
                                                </div>
                                                <div className="card-body">
                                                    <div ref={paqPendRef} style={{ width: '100%', height: '520px' }}></div>
                                                </div>
                                            </div>

                                            <div className="metric-card card shadow-sm mb-3">
                                                <div className="card-header bg-light">
                                                    <strong>Entregados</strong>
                                                </div>
                                                <div className="card-body">
                                                    <div ref={paqEntRef} style={{ width: '100%', height: '520px' }}></div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                </div>
                            </div>
                        </div>

                        <div className="col-md-12">
                            <div className="card shadow-sm border-danger">
                                <div className="card-header bg-danger text-white">
                                    <h5 className="mb-0">
                                        <i className="bi bi-car-front me-2"></i>
                                        Estado de Parqueaderos
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <canvas id="parqueoChart" style={{ maxHeight: '300px' }}></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Reportes;