# 🌡️ TemperaturasWEB - Sistema HACCP para Cámaras Frigoríficas

![Dashboard](https://img.shields.io/badge/UI-React_Vite-blue?style=for-the-badge&logo=react)
![Backend](https://img.shields.io/badge/Backend-Django_REST-092E20?style=for-the-badge&logo=django)
![Hardware](https://img.shields.io/badge/IoT-ESP32-E83524?style=for-the-badge&logo=espressif)

**TemperaturasWEB** es una solución integral y moderna diseñada específicamente para empresas (como CAMPEON SRL) que necesitan monitorear de forma continua y automatizada las temperaturas de sus cámaras frigoríficas. 

El sistema reemplaza el control manual por una arquitectura IoT robusta, garantizando la frescura de los productos y el cumplimiento de las normas de calidad HACCP.

## 🌟 Características Principales

*   📊 **Dashboard Moderno en Tiempo Real**: Visualización interactiva de gráficas de temperatura con modo claro/oscuro automático.
*   🔔 **Alertas Inteligentes por Telegram**: El sistema envía notificaciones instantáneas a los administradores si la temperatura de cualquier cámara excede los rangos configurados.
*   🤫 **Modo Mantenimiento/Limpieza**: Posibilidad de silenciar las alertas por un tiempo específico (ej. 60 minutos) durante limpiezas o reposición de stock, evitando falsas alarmas.
*   🏆 **KPIs de Eficiencia de Calidad**: Cálculo automático del "Tiempo en Rango" (ej. 98%), lo que permite medir con exactitud el rendimiento diario de las cámaras frigoríficas.
*   📈 **Generación Automática de Reportes**: Un sistema de trabajos programados (Cron) crea y archiva diariamente un reporte en formato Excel listo para auditorías sanitarias o revisión gerencial.
*   📱 **Diseño 100% Responsivo**: Control y visualización perfecta desde cualquier dispositivo móvil o computadora.

## 🏗️ Arquitectura del Sistema

El proyecto consta de tres componentes principales:

1.  **Hardware (IoT)**: Microcontroladores ESP32 equipados con sensores (ej. DS18B20 o DHT) que envían la temperatura vía WiFi al servidor central.
2.  **Backend (Django REST Framework)**: El cerebro del sistema. Recibe los datos, evalúa los rangos permitidos (min/max), dispara alertas si es necesario, calcula KPIs y exporta el histórico a Excel de manera automatizada.
3.  **Frontend (React + Vite + TailwindCSS)**: Una interfaz de usuario premium, limpia y veloz. Muestra el estado del sistema, gráficas interactivas y permite configurar múltiples cámaras.

## 🚀 Instalación y Despliegue Local

### Requisitos Previos
*   Python 3.10+
*   Node.js 18+

### 1. Configuración del Servidor Backend (Django)
```bash
# Clonar el repositorio
git clone https://github.com/BernardoChavez/TemperaturasWEB.git
cd TemperaturasWEB

# Crear entorno virtual y activarlo
python -m venv .venv
# En Windows:
.venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar migraciones
python manage.py migrate

# Levantar el servidor en el puerto 8000
python manage.py runserver 0.0.0.0:8000
```

### 2. Configuración del Cliente Frontend (React)
```bash
# Entrar a la carpeta del frontend
cd frontend

# Instalar dependencias de Node
npm install

# Iniciar servidor de desarrollo en el puerto 5173
npm run dev
```

## 🛠️ Tecnologías Usadas

- **Frontend:** React, Vite, TailwindCSS, Recharts, Lucide React, Date-fns.
- **Backend:** Django, Django REST Framework, APScheduler (para tareas en segundo plano), Pandas/Openpyxl (para generar Excel).
- **IoT:** C/C++ para ESP32, protocolo HTTP/JSON.

---
*Desarrollado para proveer seguridad y eficiencia en el manejo de la cadena de frío.*
