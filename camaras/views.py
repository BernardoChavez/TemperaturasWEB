# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import render
from django.http import FileResponse, Http404
from django.conf import settings
from .serializers import TemperaturaCamaraSerializer
from .models import TemperaturaCamaras
from django.utils import timezone
from .alerts import enviar_alerta_telegram
import os
import pandas as pd
from datetime import datetime, timedelta
from .storage import upload_file

# 📌 API que recibe datos del ESP32
class TemperaturaCamaraAPIView(APIView):
    def post(self, request):
        serializer = TemperaturaCamaraSerializer(data=request.data)
        if serializer.is_valid():
            temp_obj = serializer.save()  # Guardamos el registro

            # Revisar y enviar alerta inmediatamente si está fuera de rango
            temperatura_min = 5
            temperatura_max = 30

            if (temp_obj.temperatura < temperatura_min or temp_obj.temperatura > temperatura_max) and not temp_obj.alerta_enviada:
                enviar_alerta_telegram(
                    f"⚠ Alerta: Cámara {temp_obj.id_camara} - Temperatura {temp_obj.temperatura}°C fuera de rango"
                )
                temp_obj.alerta_enviada = True
                temp_obj.save(update_fields=["alerta_enviada"])

            return Response({"mensaje": "Dato guardado"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# 📌 Vista: muestra solo datos del día actual
def lista_temperaturas(request):
    ahora = timezone.localtime(timezone.now())
    hoy = ahora.date()

    temperaturas = [
        t for t in TemperaturaCamaras.objects.all()
        if timezone.localtime(t.fecha_hora).date() == hoy
    ]
    temperaturas.sort(key=lambda x: x.fecha_hora, reverse=True)

    return render(request, 'camaras/lista_temperaturas.html', {
        'temperaturas': temperaturas,
        'temp_min': 5,
        'temp_max': 30
    })

# 📌 Función: exporta los datos de ayer y los borra de la base de datos
def exportar_datos_diarios():
    ayer = datetime.now().date() - timedelta(days=1)
    datos = TemperaturaCamaras.objects.filter(fecha_hora__date=ayer)

    if not datos.exists():
        print(f"[INFO] No hay datos para exportar del {ayer}")
        return None

    df = pd.DataFrame(list(datos.values("id_camara", "temperatura", "fecha_hora")))
    # Excel no soporta timezone-aware datetimes; convertir a naive (o string)
    if not df.empty and "fecha_hora" in df.columns:
        try:
            df["fecha_hora"] = pd.to_datetime(df["fecha_hora"], utc=False, errors="coerce")
            if hasattr(df["fecha_hora"], "dt"):
                # Si viene con tz, quitarla
                df["fecha_hora"] = df["fecha_hora"].dt.tz_localize(None)
        except Exception:
            # fallback a string legible
            df["fecha_hora"] = df["fecha_hora"].astype(str)

    reportes_dir = getattr(settings, "REPORTES_DIR", os.path.join(settings.BASE_DIR, "reportes"))
    os.makedirs(reportes_dir, exist_ok=True)

    archivo_excel = os.path.join(reportes_dir, f"reporte_{ayer}.xlsx")
    df.to_excel(archivo_excel, index=False)

    # Subir a Supabase Storage si está configurado
    remote_path = f"reporte_{ayer}.xlsx"
    upload_file(
        bucket=os.environ.get("SUPABASE_BUCKET", "reportes"),
        remote_path=remote_path,
        local_path=archivo_excel,
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )

    datos.delete()

    print(f"[OK] Datos del {ayer} exportados y borrados.")
    return archivo_excel

# 📌 Vista: lista los reportes
def lista_reportes(request):
    reportes_dir = getattr(settings, "REPORTES_DIR", os.path.join(settings.BASE_DIR, "reportes"))
    os.makedirs(reportes_dir, exist_ok=True)

    archivos = sorted(os.listdir(reportes_dir), reverse=True)
    selected_date = request.GET.get('date')
    archivo_seleccionado = None

    if selected_date:
        nombre_archivo = f"reporte_{selected_date}.xlsx"
        if nombre_archivo in archivos:
            archivo_seleccionado = nombre_archivo

    return render(request, "camaras/lista_reportes.html", {
        "archivos": archivos,
        "selected_date": selected_date,
        "archivo_seleccionado": archivo_seleccionado
    })

# 📌 Vista: descargar reporte
def descargar_reporte(request, nombre_archivo):
    reportes_dir = getattr(settings, "REPORTES_DIR", os.path.join(settings.BASE_DIR, "reportes"))
    archivo_path = os.path.join(reportes_dir, nombre_archivo)

    if not os.path.exists(archivo_path):
        raise Http404("Archivo no encontrado")

    return FileResponse(open(archivo_path, "rb"), as_attachment=True, filename=nombre_archivo)

# 📌 Vista: ver reporte en la web
def ver_reporte(request, nombre_archivo):
    reportes_dir = getattr(settings, "REPORTES_DIR", os.path.join(settings.BASE_DIR, "reportes"))
    archivo_path = os.path.join(reportes_dir, nombre_archivo)

    if not os.path.exists(archivo_path):
        raise Http404("Archivo no encontrado")

    df = pd.read_excel(archivo_path)
    datos = df.to_dict(orient="records")

    return render(request, "camaras/ver_reporte.html", {
        "nombre_archivo": nombre_archivo,
        "datos": datos
    })


# python manage.py runserver 0.0.0.0:8000