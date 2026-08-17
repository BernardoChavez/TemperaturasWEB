import { useState, useEffect } from "react";
import api from "../api";
import { Link } from "react-router-dom";
import { FileSpreadsheet, Download, Eye, AlertCircle } from "lucide-react";

export default function ReportList() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get("reportes/");
        setReports(res.data.archivos || []);
      } catch (err) {
        setError("No se pudieron cargar los reportes.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleForceClose = async () => {
    if (!window.confirm("¿Estás seguro de que deseas forzar el cierre de día? Esto empaquetará las lecturas en Excel y limpiará la BD de datos antiguos.")) return;
    try {
      setLoading(true);
      await api.post("cron/trigger-export/");
      alert("Cierre de día y limpieza ejecutados exitosamente.");
      // Recargar reportes
      const res = await api.get("reportes/");
      setReports(res.data.archivos || []);
    } catch (err) {
      alert("Error al ejecutar el cierre de día.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Reportes Históricos</h1>
        <button
          onClick={handleForceClose}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          Forzar Cierre de Día (Manual)
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-200">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            Cargando reportes...
          </div>
        ) : reports.length > 0 ? (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {reports.map((reportName) => (
              <li key={reportName} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <div className="px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400 shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-slate-900 dark:text-slate-200">{reportName}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Generado automáticamente por el sistema</p>
                    </div>
                  </div>
                  <div className="flex gap-3 opacity-90 group-hover:opacity-100 transition-opacity">
                    <Link
                      to={`/reportes/${reportName}`}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Visualizar
                    </Link>
                    <a
                      href={`http://localhost:8000/api/reportes/descargar/${reportName}/`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      Descargar
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileSpreadsheet className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No hay reportes disponibles</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Los reportes se generan automáticamente al final de cada día a través del cronjob.</p>
          </div>
        )}
      </div>
    </div>
  );
}
