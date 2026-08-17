# views.py
import os
import pandas as pd
from datetime import datetime, timedelta

from django.conf import settings
from django.utils import timezone
from django.http import FileResponse, Http404, HttpResponseForbidden, JsonResponse

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status

from .serializers import TemperaturaCamaraSerializer, ConfiguracionCamaraSerializer
from .models import TemperaturaCamaras, ConfiguracionCamara
from .alerts import enviar_alerta_telegram
from .storage import upload_file, list_files, download_bytes

# 📌 API que recibe datos del ESP32 (POST)
class TemperaturaCamaraAPIView(APIView):
    def post(self, request):
        serializer = TemperaturaCamaraSerializer(data=request.data)
        if serializer.is_valid():
            temp_obj = serializer.save()

            # Revisar y enviar alerta inmediatamente si está fuera de rango dinámico
            config, created = ConfiguracionCamara.objects.get_or_create(
                id_camara=temp_obj.id_camara, 
                defaults={'temp_min': 20.00, 'temp_max': 30.00}
            )

            if (temp_obj.temperatura < config.temp_min or temp_obj.temperatura > config.temp_max) and not temp_obj.alerta_enviada:
                
                # Revisar si está en mantenimiento
                en_mantenimiento = config.mantenimiento_hasta and timezone.now() < config.mantenimiento_hasta

                if not en_mantenimiento:
                    enviar_alerta_telegram(
                        f"⚠ Alerta HACCP: Cámara {temp_obj.id_camara} - Temperatura {temp_obj.temperatura}°C fuera de rango ({config.temp_min} a {config.temp_max})"
                    )
                    temp_obj.alerta_enviada = True
                    temp_obj.save(update_fields=["alerta_enviada"])

            return Response({"mensaje": "Dato guardado"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# 📌 API: Devuelve las temperaturas del día actual en JSON
@api_view(['GET'])
def lista_temperaturas(request):
    ahora = timezone.localtime(timezone.now())
    hoy = ahora.date()
    id_camara = request.GET.get('camara', 1)

    temperaturas = TemperaturaCamaras.objects.filter(fecha_hora__date=hoy, id_camara=id_camara).order_by('-fecha_hora')
    serializer = TemperaturaCamaraSerializer(temperaturas, many=True)

    config, created = ConfiguracionCamara.objects.get_or_create(
        id_camara=id_camara, 
        defaults={'temp_min': 20.00, 'temp_max': 30.00}
    )

    # Calcular KPI de eficiencia
    total_mediciones = len(temperaturas)
    fuera_de_rango = sum(1 for t in temperaturas if t.temperatura < config.temp_min or t.temperatura > config.temp_max)
    eficiencia = 100
    if total_mediciones > 0:
        eficiencia = round(((total_mediciones - fuera_de_rango) / total_mediciones) * 100, 1)

    return Response({
        'temperaturas': serializer.data,
        'temp_min': config.temp_min,
        'temp_max': config.temp_max,
        'eficiencia': eficiencia,
        'mantenimiento_hasta': config.mantenimiento_hasta
    })

# 📌 Nuevas APIs HACCP
@api_view(['GET', 'POST'])
def configuracion_camara(request):
    if request.method == 'GET':
        configs = ConfiguracionCamara.objects.all()
        serializer = ConfiguracionCamaraSerializer(configs, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        # Permite actualizar la configuración. Recibe id_camara, temp_min, temp_max
        id_camara = request.data.get('id_camara')
        config, created = ConfiguracionCamara.objects.get_or_create(id_camara=id_camara)
        
        serializer = ConfiguracionCamaraSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def revisar_temperatura(request, pk):
    try:
        temp = TemperaturaCamaras.objects.get(pk=pk)
    except TemperaturaCamaras.DoesNotExist:
        return Response({"error": "No encontrada"}, status=status.HTTP_404_NOT_FOUND)
    
    temp.revisada = True
    temp.fecha_revision = timezone.now()
    temp.save(update_fields=["revisada", "fecha_revision"])
    
    enviar_alerta_telegram(f"✅ Alerta revisada - Cámara {temp.id_camara} ({temp.temperatura}°C)")
    
    return Response({"mensaje": "Marcada como revisada"})

@api_view(['GET'])
def historico_temperaturas(request):
    fecha_inicio = request.GET.get('fecha_inicio')
    fecha_fin = request.GET.get('fecha_fin')
    id_camara = request.GET.get('camara', 1)

    queryset = TemperaturaCamaras.objects.filter(id_camara=id_camara)
    
    if fecha_inicio:
        queryset = queryset.filter(fecha_hora__gte=fecha_inicio)
    if fecha_fin:
        try:
            fin_dt = pd.to_datetime(fecha_fin) + pd.Timedelta(days=1) - pd.Timedelta(seconds=1)
            queryset = queryset.filter(fecha_hora__lte=fin_dt)
        except Exception:
            pass

    queryset = queryset.order_by('-fecha_hora')
    serializer = TemperaturaCamaraSerializer(queryset, many=True)
    return Response(serializer.data)

from django.db.models.functions import TruncDate

# 📌 Función: procesa días atrasados y aplica política de retención de 30 días
def procesar_y_limpiar_datos(forzar_hoy=False):
    hoy = timezone.localtime(timezone.now()).date()
    
    # 1. Encontrar todas las fechas únicas en la base de datos
    fechas_db = TemperaturaCamaras.objects.annotate(
        fecha_sola=TruncDate('fecha_hora')
    ).values_list('fecha_sola', flat=True).distinct()
    
    fechas_a_procesar = []
    for f in fechas_db:
        if f is None: continue
        # Procesar si es anterior a hoy, o si se fuerza procesar hoy
        if f < hoy or (forzar_hoy and f == hoy):
            fechas_a_procesar.append(f)
            
    reportes_dir = getattr(settings, "REPORTES_DIR", os.path.join(settings.BASE_DIR, "reportes"))
    os.makedirs(reportes_dir, exist_ok=True)
    
    archivos_generados = []
    
    for fecha_obj in fechas_a_procesar:
        archivo_excel = os.path.join(reportes_dir, f"reporte_{fecha_obj}.xlsx")
        
        # Si el excel no existe, lo generamos
        if not os.path.exists(archivo_excel):
            print(f"[INFO] Generando Excel para la fecha: {fecha_obj}")
            datos = TemperaturaCamaras.objects.filter(fecha_hora__date=fecha_obj)
            
            if datos.exists():
                df = pd.DataFrame(list(datos.values("id_camara", "temperatura", "fecha_hora", "revisada")))
                
                if not df.empty and "fecha_hora" in df.columns:
                    try:
                        df["fecha_hora"] = pd.to_datetime(df["fecha_hora"], utc=False, errors="coerce")
                        if hasattr(df["fecha_hora"], "dt"):
                            df["fecha_hora"] = df["fecha_hora"].dt.tz_localize(None)
                    except Exception:
                        df["fecha_hora"] = df["fecha_hora"].astype(str)
                
                df.to_excel(archivo_excel, index=False)
                archivos_generados.append(archivo_excel)
                print(f"[OK] Excel generado: {archivo_excel}")
                
                # Intento de subida a Supabase
                if os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_SERVICE_KEY"):
                    upload_file(
                        bucket=os.environ.get("SUPABASE_BUCKET", "reportes"),
                        remote_path=f"reporte_{fecha_obj}.xlsx",
                        local_path=archivo_excel,
                        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    )
        else:
            print(f"[INFO] El Excel para {fecha_obj} ya existía. Saltando generación.")

    # 2. Política de Retención: Borrar todo lo anterior a 30 días
    hace_30_dias = hoy - timedelta(days=30)
    viejos = TemperaturaCamaras.objects.filter(fecha_hora__date__lt=hace_30_dias)
    borrados, _ = viejos.delete()
    if borrados > 0:
        print(f"[OK] Política de retención: Se borraron {borrados} registros anteriores a 30 días ({hace_30_dias}).")
        
    return archivos_generados

# 📌 Endpoint para disparar exportación (Cron o Manual)
@api_view(['GET', 'POST'])
def trigger_export(request):
    # Si es un POST (botón manual), forzamos también el día de hoy
    forzar_hoy = request.method == 'POST'
    
    # Validación simple de token por GET o headers
    token = request.GET.get("token") or request.headers.get("X-EXPORT-TOKEN")
    expected = os.environ.get("EXPORT_CRON_TOKEN")
    if expected and token != expected and request.method == 'GET':
        return HttpResponseForbidden("Token inválido")
        
    archivos = procesar_y_limpiar_datos(forzar_hoy=forzar_hoy)
    return JsonResponse({
        "ok": True,
        "mensaje": "Procesamiento completado",
        "archivos_generados": [os.path.basename(a) for a in archivos]
    })

# 📌 API: Lista de reportes disponibles
@api_view(['GET'])
def lista_reportes(request):
    bucket = os.environ.get("SUPABASE_BUCKET")
    archivos = []
    uso_supabase = bucket and os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_SERVICE_KEY")
    
    if uso_supabase:
        try:
            archivos = list_files(bucket)
        except Exception:
            archivos = []

    if not archivos:
        reportes_dir = getattr(settings, "REPORTES_DIR", os.path.join(settings.BASE_DIR, "reportes"))
        os.makedirs(reportes_dir, exist_ok=True)
        if os.path.isdir(reportes_dir):
            archivos = sorted(os.listdir(reportes_dir), reverse=True)

    selected_date = request.GET.get('date')
    archivo_seleccionado = None
    if selected_date:
        nombre_archivo = f"reporte_{selected_date}.xlsx"
        if nombre_archivo in archivos:
            archivo_seleccionado = nombre_archivo

    return Response({
        "archivos": archivos,
        "selected_date": selected_date,
        "archivo_seleccionado": archivo_seleccionado
    })

# 📌 API: Descargar un reporte
def descargar_reporte(request, nombre_archivo):
    bucket = os.environ.get("SUPABASE_BUCKET")
    if bucket and os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_SERVICE_KEY"):
        content = download_bytes(bucket, nombre_archivo)
        if content is None:
            raise Http404("Archivo no encontrado")
        from io import BytesIO
        return FileResponse(BytesIO(content), as_attachment=True, filename=nombre_archivo)
    else:
        reportes_dir = getattr(settings, "REPORTES_DIR", os.path.join(settings.BASE_DIR, "reportes"))
        archivo_path = os.path.join(reportes_dir, nombre_archivo)
        if not os.path.exists(archivo_path):
            raise Http404("Archivo no encontrado")
        return FileResponse(open(archivo_path, "rb"), as_attachment=True, filename=nombre_archivo)

# 📌 API: Ver datos de un reporte (devuelve JSON)
@api_view(['GET'])
def ver_reporte(request, nombre_archivo):
    bucket = os.environ.get("SUPABASE_BUCKET")
    if bucket and os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_SERVICE_KEY"):
        content = download_bytes(bucket, nombre_archivo)
        if content is None:
            return Response({"error": "Archivo no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        from io import BytesIO
        df = pd.read_excel(BytesIO(content))
    else:
        reportes_dir = getattr(settings, "REPORTES_DIR", os.path.join(settings.BASE_DIR, "reportes"))
        archivo_path = os.path.join(reportes_dir, nombre_archivo)
        if not os.path.exists(archivo_path):
            return Response({"error": "Archivo no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        df = pd.read_excel(archivo_path)
    
    # Limpiar timestamps o valores nulos antes de pasar a JSON
    df = df.fillna("") 
    datos = df.to_dict(orient="records")

    return Response({
        "nombre_archivo": nombre_archivo,
        "datos": datos
    })

@api_view(['POST'])
def mantenimiento_camara(request, pk):
    try:
        config = ConfiguracionCamara.objects.get(id_camara=pk)
    except ConfiguracionCamara.DoesNotExist:
        return Response({"error": "Configuración no encontrada"}, status=status.HTTP_404_NOT_FOUND)
        
    if request.data.get('cancelar'):
        config.mantenimiento_hasta = None
    else:
        minutos = request.data.get('minutos', 60)
        from datetime import timedelta
        config.mantenimiento_hasta = timezone.now() + timedelta(minutes=int(minutos))
        
    config.save()
    return Response({"mensaje": "Modo mantenimiento actualizado", "mantenimiento_hasta": config.mantenimiento_hasta})