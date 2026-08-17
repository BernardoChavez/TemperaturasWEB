import React, { useState, useEffect } from 'react';
import api from '../api';
import { Settings, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Configuracion() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isNewCamara, setIsNewCamara] = useState(false);
  const [formData, setFormData] = useState({
    id_camara: 1,
    nombre: 'Cámara Principal',
    temp_min: '',
    temp_max: ''
  });

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await api.get('configuracion/');
      setConfigs(res.data);
      
      const cam1 = res.data.find(c => c.id_camara === formData.id_camara) || res.data[0];
      if (cam1 && !isNewCamara) {
        setFormData({
          id_camara: cam1.id_camara,
          nombre: cam1.nombre || `Cámara ${cam1.id_camara}`,
          temp_min: cam1.temp_min,
          temp_max: cam1.temp_max
        });
      }
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la configuración.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setSuccess(false);
  };

  const handleSelectCamara = (val) => {
    if (val === "new") {
      setIsNewCamara(true);
      setFormData({
        id_camara: '',
        nombre: 'Nueva Cámara',
        temp_min: '20.00',
        temp_max: '30.00'
      });
      setSuccess(false);
      setError(null);
      return;
    }

    setIsNewCamara(false);
    const id = parseInt(val);
    const cam = configs.find(c => c.id_camara === id);
    if (cam) {
      setFormData({
        id_camara: cam.id_camara,
        nombre: cam.nombre || `Cámara ${cam.id_camara}`,
        temp_min: cam.temp_min,
        temp_max: cam.temp_max
      });
    } else {
      setFormData({
        id_camara: id,
        nombre: `Cámara ${id}`,
        temp_min: '',
        temp_max: ''
      });
    }
    setSuccess(false);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      await api.post('configuracion/', formData);
      setSuccess(true);
      setIsNewCamara(false);
      fetchConfigs();
    } catch (err) {
      console.error(err);
      setError("Error al guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
          <Settings className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configuración del Sistema</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestiona los nombres y los rangos de temperatura para cada cámara.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Parámetros de Cámaras</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600 dark:text-slate-400 font-medium">Seleccionar Cámara:</label>
            <select 
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white font-medium"
              value={isNewCamara ? "new" : formData.id_camara}
              onChange={(e) => handleSelectCamara(e.target.value)}
            >
              {configs.map(c => (
                <option key={c.id_camara} value={c.id_camara}>
                  {c.nombre || `Cámara ${c.id_camara}`}
                </option>
              ))}
              {configs.length === 0 && !isNewCamara && (
                <option value={1}>Cámara 1</option>
              )}
              <option value="new" className="font-bold text-indigo-600 dark:text-indigo-400">+ Añadir nueva cámara...</option>
            </select>
          </div>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
            
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5" />
                <p className="text-sm font-medium">Configuración guardada exitosamente.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {isNewCamara ? "ID del ESP32 (Nuevo)" : "ID del ESP32 (Solo Lectura)"}
                </label>
                <input
                  type="number"
                  name="id_camara"
                  value={formData.id_camara}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border rounded-lg text-slate-900 dark:text-white ${isNewCamara ? 'bg-white dark:bg-slate-900 border-indigo-300 dark:border-indigo-600 focus:ring-2 focus:ring-indigo-500' : 'bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'}`}
                  disabled={!isNewCamara}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nombre Personalizado
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-900 dark:text-white"
                  placeholder="Ej: Cámara Carnes"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Temperatura Mínima (°C)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="temp_min"
                  value={formData.temp_min}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-900 dark:text-white"
                  placeholder="Ej: 20.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Temperatura Máxima (°C)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="temp_max"
                  value={formData.temp_max}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-900 dark:text-white"
                  placeholder="Ej: 30.00"
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-70"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {saving ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
