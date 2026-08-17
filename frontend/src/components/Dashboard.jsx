import { useState, useEffect } from "react";
import api from "../api";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertCircle, CheckCircle2, RefreshCw, Thermometer, Video } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useOutletContext } from "react-router-dom";

export default function Dashboard() {
  const { darkMode } = useOutletContext();
  const [data, setData] = useState({ temperaturas: [], temp_min: 0, temp_max: 5, eficiencia: null, mantenimiento_hasta: null });
  const [configs, setConfigs] = useState([]);
  const [selectedCamara, setSelectedCamara] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mantenimientoMinutos, setMantenimientoMinutos] = useState(60);

  const fetchConfigs = async () => {
    try {
      const res = await api.get("configuracion/");
      setConfigs(res.data);
    } catch (err) {
      console.error("Error al cargar configuraciones", err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`temperaturas/?camara=${selectedCamara}`);

      const parsedData = res.data.temperaturas.map(t => ({
        ...t,
        formattedTime: format(new Date(t.fecha_hora), "HH:mm"),
        rawDate: new Date(t.fecha_hora)
      })).reverse();

      setData({ ...res.data, temperaturas: parsedData });
      setError(null);
    } catch (err) {
      setError("Error al cargar los datos del servidor.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevisar = async (id) => {
    try {
      await api.post(`temperatura/${id}/revisar/`);
      fetchData(); // Recargar los datos para quitar el botón
    } catch (err) {
      console.error("Error al revisar", err);
      alert("No se pudo marcar como revisado");
    }
  };

  const handleMantenimiento = async (cancelar = false) => {
    try {
      await api.post(`configuracion/${selectedCamara}/mantenimiento/`, {
        cancelar,
        minutos: mantenimientoMinutos
      });
      fetchData();
    } catch (err) {
      console.error("Error al actualizar mantenimiento", err);
      alert("Error al actualizar estado de mantenimiento");
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [selectedCamara]);

  const reversedList = [...data.temperaturas].reverse();
  const activeCamaraName = configs.find(c => c.id_camara === selectedCamara)?.nombre || `Cámara ${selectedCamara}`;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl">
          <p className="font-semibold text-slate-800 dark:text-slate-200">{`Hora: ${label}`}</p>
          <p className="text-blue-600 dark:text-blue-400 font-bold">{`Temp: ${payload[0].value}°C`}</p>
        </div>
      );
    }
    return null;
  };

  const isMantenimiento = data.mantenimiento_hasta && new Date(data.mantenimiento_hasta) > new Date();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          Dashboard de Hoy
        </h1>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Video className="h-4 w-4 text-slate-400" />
            </div>
            <select
              value={selectedCamara}
              onChange={(e) => setSelectedCamara(Number(e.target.value))}
              className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer appearance-none"
            >
              {configs.length > 0 ? (
                configs.map(c => (
                  <option key={c.id_camara} value={c.id_camara}>
                    {c.nombre || `Cámara ${c.id_camara}`}
                  </option>
                ))
              ) : (
                <option value={1}>Cámara Principal</option>
              )}
            </select>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {isMantenimiento && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-xl border border-yellow-200 dark:border-yellow-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Modo Mantenimiento Activo</p>
              <p className="text-xs mt-0.5 opacity-90">Las alertas de Telegram están pausadas hasta las {format(new Date(data.mantenimiento_hasta), "HH:mm")}.</p>
            </div>
          </div>
          <button
            onClick={() => handleMantenimiento(true)}
            className="px-4 py-1.5 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-800/50 dark:hover:bg-yellow-700/50 text-yellow-800 dark:text-yellow-300 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            Cancelar Mantenimiento
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
            Eficiencia de Calidad Hoy
          </span>
          {data.eficiencia !== null ? (
            <div className="flex items-end gap-3">
              <span className={`text-4xl font-bold ${data.eficiencia >= 95 ? 'text-emerald-600 dark:text-emerald-400' : data.eficiencia >= 85 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                {data.eficiencia}%
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400 pb-1">tiempo en rango</span>
            </div>
          ) : (
            <span className="text-2xl font-bold text-slate-400">---</span>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-center gap-3 lg:col-span-2">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Control de Alertas</span>
          {!isMantenimiento ? (
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                value={mantenimientoMinutos}
                onChange={(e) => setMantenimientoMinutos(e.target.value)}
              />
              <span className="text-sm text-slate-500 dark:text-slate-400">minutos</span>
              <button
                onClick={() => handleMantenimiento(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
              >
                Modo Mantenimiento
              </button>
            </div>
          ) : (
            <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Alertas silenciadas actualmente.</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-200">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
          Gráfico de Temperaturas ({activeCamaraName})
        </h2>
        <div className="h-[350px] w-full">
          {loading && data.temperaturas.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.temperaturas} margin={{ top: 10, right: 20, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#f1f5f9"} vertical={false} />
                <XAxis dataKey="formattedTime" stroke={darkMode ? "#94a3b8" : "#94a3b8"} tick={{ fill: darkMode ? '#cbd5e1' : '#64748b', fontSize: 12 }} tickMargin={10} axisLine={false} tickLine={false} />
                <YAxis stroke={darkMode ? "#94a3b8" : "#94a3b8"} tick={{ fill: darkMode ? '#cbd5e1' : '#64748b', fontSize: 12 }} tickMargin={10} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={data.temp_max} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} opacity={0.8} />
                <ReferenceLine y={data.temp_min} stroke="#3b82f6" strokeDasharray="4 4" strokeWidth={1.5} opacity={0.8} />
                <Line
                  type="monotone"
                  dataKey="temperatura"
                  stroke="#3b82f6"
                  strokeWidth={4}
                  dot={{ r: 0 }}
                  activeDot={{ r: 6, fill: '#3b82f6', stroke: darkMode ? '#0f172a' : '#fff', strokeWidth: 3 }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-200">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Registros Recientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha y Hora</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cámara</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Temperatura</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-50 dark:divide-slate-800">
              {reversedList.length > 0 ? (
                reversedList.map((temp) => {
                  const outOfRange = temp.temperatura < data.temp_min || temp.temperatura > data.temp_max;
                  return (
                    <tr key={temp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                        {format(temp.rawDate, "dd MMM yyyy, HH:mm:ss", { locale: es })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700 dark:text-slate-200">
                        {activeCamaraName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-bold ${outOfRange ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
                          {temp.temperatura} °C
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {outOfRange ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-200/50 dark:border-red-800/50">
                            <AlertCircle className="w-3.5 h-3.5" /> Fuera de rango
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Normal
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {outOfRange && !temp.revisada && (
                          <button
                            onClick={() => handleRevisar(temp.id)}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                          >
                            Marcar Revisado
                          </button>
                        )}
                        {outOfRange && temp.revisada && (
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Revisado
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <Thermometer className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                      </div>
                      <p>No hay registros de temperatura para hoy en la {activeCamaraName}.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
