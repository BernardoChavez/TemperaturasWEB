import React, { useState, useEffect } from 'react';
import api from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toPng } from 'html-to-image';
import { Calendar, Download, Search, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Historico() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filtros, setFiltros] = useState({
    fecha_inicio: format(new Date(), 'yyyy-MM-dd'),
    fecha_fin: format(new Date(), 'yyyy-MM-dd'),
    camara: 1
  });

  const [config, setConfig] = useState({ temp_min: 20, temp_max: 30 });
  const chartRef = React.useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  const fetchHistorico = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const configRes = await api.get('configuracion/');
      const camConfig = configRes.data.find(c => c.id_camara == filtros.camara);
      if (camConfig) {
        setConfig(camConfig);
      }

      const res = await api.get('historico/', { params: filtros });

      const parsedData = res.data.map(t => ({
        ...t,
        formattedTime: format(new Date(t.fecha_hora), "dd/MM/yy HH:mm"),
        rawDate: new Date(t.fecha_hora)
      })).reverse();

      setData(parsedData);
    } catch (err) {
      console.error(err);
      setError("Error al cargar el historial.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorico();
  }, []);

  const handleChange = (e) => {
    setFiltros({
      ...filtros,
      [e.target.name]: e.target.value
    });
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    // Esperamos un instante a que React quite el ResponsiveContainer y renderice el gráfico estático
    await new Promise(resolve => setTimeout(resolve, 150));

    if (!chartRef.current) {
      setIsExporting(false);
      return;
    }
    const chartNode = chartRef.current;
    
    // Forzamos fondo claro para la foto de la gráfica
    const originalClass = chartNode.className;
    chartNode.className = "bg-white text-black p-4 inline-block"; // inline-block ayuda a que html-to-image calcule bien el tamaño
    
    try {
      const width = chartNode.offsetWidth;
      const height = chartNode.offsetHeight;
      
      const dataUrl = await toPng(chartNode, { 
        cacheBust: true, 
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        width: width,
        height: height,
        style: { width: `${width}px`, height: `${height}px` }
      });
      
      // Creamos PDF en formato 'letter' (carta), midiendo en puntos (pt)
      const pdf = new jsPDF('p', 'pt', 'letter');
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      // Título
      pdf.setFontSize(16);
      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.text("Reporte de Control de Temperaturas (HACCP)", 40, 50);
      
      pdf.setFontSize(11);
      pdf.setTextColor(100, 116, 139); // slate-500
      pdf.text(`Cámara ${filtros.camara} | Periodo: ${filtros.fecha_inicio} a ${filtros.fecha_fin}`, 40, 70);
      
      // Calculamos el tamaño de la gráfica respetando un margen de 40pt
      const margin = 40;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (height * imgWidth) / width;
      
      pdf.addImage(dataUrl, 'PNG', margin, 90, imgWidth, imgHeight);
      
      // Preparamos los datos para la tabla
      const tableColumn = ["Fecha y Hora", "Temperatura", "Estado", "Revisión"];
      const tableRows = [];
      
      data.forEach(temp => {
        const outOfRange = temp.temperatura < config.temp_min || temp.temperatura > config.temp_max;
        const estado = outOfRange ? "Fuera de rango" : "Normal";
        const revision = outOfRange ? (temp.revisada ? "Revisado" : "Falta revisión") : "-";
        
        tableRows.push([
          temp.formattedTime,
          `${temp.temperatura} °C`,
          estado,
          revision
        ]);
      });
      
      // Dibujamos la tabla nativa (no es una foto, es texto real seleccionable)
      autoTable(pdf, {
        head: [tableColumn],
        body: tableRows,
        startY: 90 + imgHeight + 30, // Debajo de la gráfica
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [79, 70, 229] }, // indigo-600
        alternateRowStyles: { fillColor: [248, 250, 252] },
        didParseCell: function(data) {
          if (data.section === 'body') {
            // Colorear en rojo si está fuera de rango
            if (data.column.index === 2 && data.cell.text[0] === 'Fuera de rango') {
              data.cell.styles.textColor = [220, 38, 38];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      });
      
      pdf.save(`Reporte_HACCP_Camara${filtros.camara}_${filtros.fecha_inicio}.pdf`);
    } catch (err) {
      console.error("Error al generar PDF:", err);
      alert("Hubo un error al generar el PDF.");
    } finally {
      // Restauramos las clases y la interactividad
      chartNode.className = originalClass;
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Auditoría / Histórico</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Consulta el historial completo de temperaturas y genera reportes HACCP.
          </p>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={data.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Exportar PDF (Guardar)
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 print:hidden">
        <form onSubmit={fetchHistorico} className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Cámara ID</label>
            <input type="number" name="camara" value={filtros.camara} onChange={handleChange} className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Fecha Inicio</label>
            <input type="date" name="fecha_inicio" value={filtros.fecha_inicio} onChange={handleChange} className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Fecha Fin</label>
            <input type="date" name="fecha_fin" value={filtros.fecha_fin} onChange={handleChange} className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white" />
          </div>
          <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2">
            <Search className="w-4 h-4" /> Consultar
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
      ) : error ? (
        <div className="text-red-500 text-center py-4">{error}</div>
      ) : (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-8 print:shadow-none print:border-none print:p-0">
          <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reporte de Control de Temperaturas</h2>
            <p className="text-slate-500 dark:text-slate-400">Cámara {filtros.camara} | Periodo: {filtros.fecha_inicio} a {filtros.fecha_fin}</p>
          </div>

          <div className="overflow-x-auto w-full">
            <div ref={chartRef} className="h-72 w-full min-w-[800px]">
              {isExporting ? (
                <LineChart width={800} height={288} data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="formattedTime" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} domain={['auto', 'auto']} />
                  <ReferenceLine y={config.temp_max} label="Máx" stroke="#ef4444" strokeDasharray="3 3" />
                  <ReferenceLine y={config.temp_min} label="Mín" stroke="#3b82f6" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="temperatura" stroke="#6366f1" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis dataKey="formattedTime" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#818cf8' }}
                    />
                    <ReferenceLine y={config.temp_max} label="Máx" stroke="#ef4444" strokeDasharray="3 3" />
                    <ReferenceLine y={config.temp_min} label="Mín" stroke="#3b82f6" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="temperatura" stroke="#6366f1" strokeWidth={2} dot={false} activeDot={{ r: 6 }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 print:text-black">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Fecha y Hora</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Temperatura</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Revisión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {data.map((temp) => {
                  const outOfRange = temp.temperatura < config.temp_min || temp.temperatura > config.temp_max;
                  return (
                    <tr key={temp.id}>
                      <td className="px-4 py-2 text-sm text-slate-900 dark:text-slate-300 print:text-black">{temp.formattedTime}</td>
                      <td className="px-4 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 print:text-black">{temp.temperatura} °C</td>
                      <td className="px-4 py-2">
                        {outOfRange ? (
                          <span className="text-xs font-medium text-red-600">Fuera de rango</span>
                        ) : (
                          <span className="text-xs font-medium text-emerald-600">Normal</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-500 print:text-black">
                        {outOfRange && !temp.revisada && <span className="text-amber-500 font-semibold">Falta revisión</span>}
                        {outOfRange && temp.revisada && <span className="text-emerald-500">Revisado</span>}
                        {!outOfRange && "-"}
                      </td>
                    </tr>
                  )
                })}
                {data.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-4 py-4 text-center text-slate-500">No hay datos en este periodo</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}
    </div>
  );
}
