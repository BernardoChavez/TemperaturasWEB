import os
from pathlib import Path

# 📂 Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# 🔑 Secret key y debug desde variables de entorno
SECRET_KEY = os.environ.get('SECRET_KEY', 'default_key')
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

# 🌐 Hosts permitidos
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')

# 🛠 Installed apps
INSTALLED_APPS = [
    'django_crontab',   # Para tareas automáticas
    'camaras',
    'rest_framework',
    'corsheaders',      # Para que el ESP32 pueda enviar datos
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

# 🧩 Middleware
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Debe ir arriba
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# 🔗 URL Configuration
ROOT_URLCONF = 'monitoreo.urls'

# 🖼 Templates
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# 🖥 WSGI
WSGI_APPLICATION = 'monitoreo.wsgi.application'

# 💾 Base de datos (Supabase PostgreSQL)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST'),
        'PORT': '5432',
        'CONN_MAX_AGE': 600,
        'OPTIONS': {'sslmode': 'require'},
    }
}

# 🔐 Validators
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',},
]

# 🌍 Internacionalización
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'America/La_Paz'
USE_I18N = True
USE_TZ = True

# 📦 Archivos estáticos
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# 📂 Carpeta de reportes (solo temporal, Render reinicia contenedores)
REPORTES_DIR = os.path.join(BASE_DIR, 'reportes')
os.makedirs(REPORTES_DIR, exist_ok=True)

# 🌐 CORS para ESP32
CORS_ALLOW_ALL_ORIGINS = True  # Para desarrollo, luego restringir si quieres

# ⏰ Cron jobs
# Render no soporta cron directamente, usar endpoint o Render Scheduled Jobs
CRONJOBS = [
    ('0 0 * * *', 'camaras.views.exportar_datos_diarios')
]

# 🔹 Ajustes por defecto
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
APP_DIRS = True
