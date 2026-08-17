import { useState, useEffect } from "react";
import api from "../api";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, FileSpreadsheet, Download, AlertCircle } from "lucide-react";

export default function ReportViewer() {
  const { filename } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const res = await api.get(`reportes/ver/${filename}/`);
        setData(res.data.datos);
      } catch (err) {
        setError("Error al leer el archivo. Es posible que no exista o esté corrupto.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [filename]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link
          to="/reportes"
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors bg-slate-100 dark:bg-slate-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
            <FileSpreadsheet className="w-8 h-8 text-green-600 dark:text-green-500" />
            {filename}
          </h1>
        </div>
        <div className="ml-auto">
          <a
            href={`http://localhost:8000/api/reportes/descargar/${filename}/`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 dark:bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors shadow-sm hover:shadow"
          >
            <Download className="w-4 h-4" />
            Descargar Excel
          </a>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-200">
        {loading ? (
          <div className="p-16 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            Leyendo archivo Excel...
          </div>
        ) : data && data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  {Object.keys(data[0]).map((key) => (
                    <th
                      key={key}
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                    >
                      {key.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-50 dark:divide-slate-800">
                {data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    {Object.keys(data[0]).map((key, i) => {
                      let val = row[key];
                      
                      if (key === 'fecha_hora' && val) {
                        const dateObj = new Date(val);
                        if (!isNaN(dateObj.getTime())) {
                          // Formato: DD/MM/YYYY, HH:MM:SS
                          val = dateObj.toLocaleString('es-ES', { 
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          });
                        }
                      } else if (key === 'temperatura' && val !== "") {
                        val = <span className="font-semibold text-slate-900 dark:text-slate-100">{val} °C</span>;
                      } else if (key === 'revisada') {
                        if (val === true || val === "True" || val === 1 || val === "1.0") {
                          val = <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Revisado</span>;
                        } else {
                          val = <span className="text-slate-400 dark:text-slate-500">-</span>;
                        }
                      } else if (key === 'id_camara') {
                        val = <span className="text-slate-900 dark:text-slate-100 font-medium">Camara {val}</span>;
                      }

                      return (
                        <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center text-slate-500 dark:text-slate-400">
            <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-lg">El reporte está vacío o no contiene datos válidos.</p>
          </div>
        )}
      </div>
    </div>
  );
}
