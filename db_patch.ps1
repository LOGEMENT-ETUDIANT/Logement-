$p = "backend\config\settings.py"
$c = Get-Content $p -Raw

if ($c -notmatch "^\s*import os") {
    $c = $c -replace "from pathlib import Path", "from pathlib import Path`r`nimport os"
}

$c = $c -replace "SECRET_KEY\s*=.*", "SECRET_KEY = os.getenv^('DJANGO_SECRET_KEY', 'dev-secret'^)"
$c = $c -replace "DEBUG\s*=.*", "DEBUG = os.getenv^('DJANGO_DEBUG', '1'^) -eq '1'"
$c = $c -replace "ALLOWED_HOSTS\s*=.*", "ALLOWED_HOSTS = [h.strip^(^) for h in os.getenv^('DJANGO_ALLOWED_HOSTS',''^).split^(','^) if h.strip^(^)]"

$db = @"
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('POSTGRES_DB'),
        'USER': os.getenv('POSTGRES_USER'),
        'PASSWORD': os.getenv('POSTGRES_PASSWORD'),
        'HOST': os.getenv('POSTGRES_HOST', 'db'),
        'PORT': os.getenv('POSTGRES_PORT', '5432'),
    }
}
"@

$c = [regex]::Replace($c, "DATABASES\s*=\s*\{.*?\}\s*\n\}", $db, [System.Text.RegularExpressions.RegexOptions]::Singleline)
Set-Content $p $c
