# camaras/tasks.py
import os
import pandas as pd
from datetime import datetime
from django.conf import settings
from .models import TemperaturaCamaras

def exportar_datos_diarios():
    hoy = datetime.now().date()
    datos = TemperaturaCamaras.objects.filter(fecha_hora__date=hoy)
    
    if datos.exists():
        df = pd.DataFrame(list(datos.values("id_camara", "temperatura", "fecha_hora")))
        reportes_dir = os.path.join(settings.BASE_DIR, "reportes")
        os.makedirs(reportes_dir, exist_ok=True)
        archivo = os.path.join(reportes_dir, f"reporte_{hoy}.xlsx")
        df.to_excel(archivo, index=False)
        print(f"[INFO] Datos del día {hoy} exportados a {archivo}")
    else:
        print(f"[INFO] No hay datos para exportar el día {hoy}")