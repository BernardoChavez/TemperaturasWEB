from django.urls import path
from . import views

urlpatterns = [
    path('api/temperaturas/', views.lista_temperaturas, name='lista_temperaturas'),
    path('api/temperatura/', views.TemperaturaCamaraAPIView.as_view(), name='api_temperatura'),
    path('api/reportes/', views.lista_reportes, name='lista_reportes'),
    path('api/reportes/descargar/<str:nombre_archivo>/', views.descargar_reporte, name='descargar_reporte'),
    path('api/reportes/ver/<str:nombre_archivo>/', views.ver_reporte, name='ver_reporte'),
    path('api/cron/trigger-export/', views.trigger_export, name='trigger_export'),
    path('api/configuracion/', views.configuracion_camara, name='configuracion_camara'),
    path('api/configuracion/<int:pk>/mantenimiento/', views.mantenimiento_camara, name='mantenimiento_camara'),
    path('api/temperatura/<int:pk>/revisar/', views.revisar_temperatura, name='revisar_temperatura'),
    path('api/historico/', views.historico_temperaturas, name='historico_temperaturas'),
]