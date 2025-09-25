from django.urls import path
from . import views

urlpatterns = [
    path('', views.lista_temperaturas, name='lista_temperaturas'),
    path('api/temperatura/', views.TemperaturaCamaraAPIView.as_view(), name='api_temperatura'),  # <-- POST ESP32
    path('reportes/', views.lista_reportes, name='lista_reportes'),
    path('reportes/descargar/<str:nombre_archivo>/', views.descargar_reporte, name='descargar_reporte'),
    path('reportes/ver/<str:nombre_archivo>/', views.ver_reporte, name='ver_reporte'),
    path('cron/trigger-export/', views.trigger_export, name='trigger_export'),
]