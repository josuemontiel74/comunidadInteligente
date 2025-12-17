import React, { useEffect, useRef, useState } from "react";
import Swal from 'sweetalert2';
import { Link, useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import "../Styles/dashboardSuperAdmin.css";
import logo from "../../img/logo.png";
import * as echarts from "echarts";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// URL base del backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

    // Descargar como PDF
    const downloadPDF = () => {
        const container = document.getElementById('report-container');
        if (!container) {
            alert('No se encontró el contenedor para imprimir');
            return;
        }

        setPrintingMode(true);

        setTimeout(() => {
            try {
                window.dispatchEvent(new Event('resize'));
            } catch (err) {
                console.warn('No se pudo despachar resize:', err);
            }

            setTimeout(() => {
                try {
                    window.print();
                } catch (err) {
                    console.error('Error al imprimir:', err);
                    alert('Error al intentar imprimir.');
                } finally {
                    setPrintingMode(false);
                }
            }, 700);
        }, 600);
    };

    // Verificar usuario
    useEffect(() => {
        const token = localStorage.getItem("token");
        const userGuardado = localStorage.getItem("user");

        if (!token) {
            Swal.fire({ 
                icon: 'warning', 
                title: 'Sesión expirada', 
                text: 'La sesión expiró. Vuelva a iniciar sesión.', 
                timer: 2000, 
                showConfirmButton: false, 
                timerProgressBar: true 
            }).then(() => {
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

    // Obtener reporte de parqueaderos
    useEffect(() => {
        async function fetchParqueaderos() {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const rango = construirRango();
                console.log("🚗 Fetching parqueaderos con rango:", rango);
                const res = await fetch(
                    `${API_URL}/api/reportes/parqueaderos?fechaInicio=${rango.fechaInicio}&fechaFin=${rango.fechaFin}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                const data = await res.json();
                console.log("🚗 Respuesta parqueaderos:", data);
                if (data.success && data.data) {
                    setParqueaderos(data.data.resumenActual || []);
                    console.log("🚗 Parqueaderos seteados:", data.data.resumenActual);
                } else {
                    console.warn("⚠️ No hay datos de parqueaderos");
                }
            } catch (error) {
                console.error("❌ Error cargando parqueaderos:", error);
            }
        }
        fetchParqueaderos();
    }, [tipoReporte, anioInicio, anioFin, mesInicio, mesFin, mesSemana, anioSemana]);

    // Obtener datos de áreas comunes (reservas)
    useEffect(() => {
        async function fetchAreacomunes() {
            const token = localStorage.getItem("token");
            if (!token) return;
            
            try {
                const rango = construirRango();
                console.log("🏢 Fetching reservas con rango:", rango);
                const res = await fetch(
                    `${API_URL}/api/reportes/reservas?fechaInicio=${rango.fechaInicio}&fechaFin=${rango.fechaFin}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                const data = await res.json();
                console.log("🏢 Respuesta reservas:", data);

                if (data.success && data.data && data.data.porArea) {
                    setReporte(data.data.porArea);
                    console.log("🏢 Reservas seteadas:", data.data.porArea);
                } else {
                    console.warn("⚠️ No hay datos en el reporte de reservas");
                    setReporte([]);
                }
            } catch (error) {
                console.error("❌ Error cargando áreas comunes:", error);
                setReporte([]);
            }
        }
        fetchAreacomunes();
    }, [tipoReporte, anioInicio, anioFin, mesInicio, mesFin, mesSemana, anioSemana]);

    // Gráfico de Áreas Comunes
    useEffect(() => {
        if (!areasChartRef.current) {
            console.log("⚠️ No hay referencia al chart de áreas");
            return;
        }

        console.log("📊 Iniciando gráfico de áreas comunes con datos:", reporte);

        const myChart = echarts.init(areasChartRef.current);

        if (!reporte || reporte.length === 0) {
            console.log("⚠️ Sin datos para graficar áreas comunes");
            myChart.clear();
            myChart.setOption({
                title: { text: 'Áreas Comunes (Sin información en la fecha elegida.)', left: 'center' }
            });
            return () => myChart.dispose();
        }

        const areas = reporte.map(r => r.nombreArea);
        const cantidades = reporte.map(r => parseInt(r.cantidad || 0));
        
        console.log("📊 Áreas:", areas);
        console.log("📊 Cantidades:", cantidades);

        const option = {
            title: {
                text: 'Reservas por Área Común',
                left: 'center'
            },
            tooltip: { trigger: 'axis' },
            legend: { top: 'bottom' },
            grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
            xAxis: { type: 'category', data: areas, axisLabel: { rotate: 45 } },
            yAxis: { type: 'value', name: 'Reservas' },
            series: [{
                data: cantidades,
                type: 'bar',
                barMaxWidth: '60%',
                itemStyle: { color: '#198754' }
            }]
        };

        myChart.setOption(option, true);
        console.log("✅ Gráfico de áreas comunes renderizado");

        const resizeChart = () => myChart.resize();
        window.addEventListener('resize', resizeChart);

        return () => {
            window.removeEventListener('resize', resizeChart);
            myChart.dispose();
        };
    }, [reporte, tipoReporte]);

    // Gráfico de Visitas
    useEffect(() => {
        async function fetchVisitasReporte() {
            const token = localStorage.getItem('token');
            if (!token || !visitasChartRef.current) return;

            const rango = construirRango();
            try {
                console.log('Llamando a reportes/visitas con rango:', rango);
                const res = await fetch(
                    `${API_URL}/api/reportes/visitas?fechaInicio=${rango.fechaInicio}&fechaFin=${rango.fechaFin}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                console.log('Respuesta reportes/visitas status:', res.status);
                const data = await res.json();
                console.log('Datos visitas:', data);

                const myChart = echarts.init(visitasChartRef.current);

                if (!data.success || !data.data || !data.data.porDia || data.data.porDia.length === 0) {
                    myChart.clear();
                    myChart.setOption({ title: { text: 'Visitas (sin datos)', left: 'center' } });
                    return;
                }

                const registros = data.data.porDia;
                const fechas = registros.map(d => {
                    const fecha = new Date(d.fecha);
                    return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
                });
                const cantidades = registros.map(d => parseInt(d.cantidad || 0));

                const option = {
                    title: {
                        text: 'Visitas por Día',
                        left: 'center'
                    },
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: { type: 'shadow' },
                        formatter: function (params) {
                            const p = params[0];
                            return `${p.axisValueLabel}<br/>Visitas: <strong>${p.data}</strong>`;
                        }
                    },
                    xAxis: { type: 'category', data: fechas, axisLabel: { rotate: 45 } },
                    yAxis: { type: 'value', name: 'Visitas' },
                    series: [{ data: cantidades, type: 'bar', barMaxWidth: '48%', itemStyle: { color: '#0d6efd' } }]
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

    // Gráfico de Paquetería
    useEffect(() => {
        async function fetchPaqueteriaReporte() {
            const token = localStorage.getItem('token');
            if (!token || !paqueteriaChartRef.current) return;

            const rango = construirRango();
            try {
                console.log('Llamando a reportes/paquetes con rango:', rango);
                const res = await fetch(
                    `${API_URL}/api/reportes/paquetes?fechaInicio=${rango.fechaInicio}&fechaFin=${rango.fechaFin}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                console.log('Respuesta reportes/paquetes status:', res.status);
                const data = await res.json();
                console.log('Datos paquetería:', data);

                const myChart = echarts.init(paqueteriaChartRef.current);

                if (!data.success || !data.data || !data.data.porDia || data.data.porDia.length === 0) {
                    myChart.clear();
                    myChart.setOption({ title: { text: 'Paquetería (sin datos)', left: 'center' } });
                    return;
                }

                const registros = data.data.porDia;
                const fechas = registros.map(d => {
                    const fecha = new Date(d.fecha);
                    return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
                });
                const cantidades = registros.map(d => parseInt(d.cantidad || 0));

                // Construir datos para las tres series (esto es una aproximación, ajusta según tu backend)
                const recibidos = cantidades;
                const pendientes = registros.map(() => data.data.pendientes || 0);
                const entregados = registros.map(() => data.data.entregados || 0);

                const option = {
                    title: { 
                        text: 'Paquetería por Día', 
                        left: 'center' 
                    },
                    tooltip: { trigger: 'axis' },
                    legend: { top: 'bottom' },
                    xAxis: { type: 'category', data: fechas, axisLabel: { rotate: 45 } },
                    yAxis: { type: 'value', name: 'Paquetes' },
                    series: [
                        { 
                            name: 'Recibidos', 
                            data: recibidos, 
                            type: 'line', 
                            smooth: true, 
                            itemStyle: { color: '#0d6efd' }, 
                            areaStyle: { color: 'rgba(13,110,253,0.12)' } 
                        }
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

        const espaciosLibres = parqueaderos.reduce((sum, p) => sum + parseInt(p.disponibles || 0), 0);
        const espaciosOcupados = parqueaderos.reduce((sum, p) => sum + parseInt(p.ocupados || 0), 0);

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
                                        Paquetería
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <div ref={paqueteriaChartRef} style={{ width: '100%', height: '300px' }}></div>
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