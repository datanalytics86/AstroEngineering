"""
Configuración compartida de pytest: asegura que `backend/` esté en sys.path
para que `import astro...` y `import main` funcionen sin instalar el paquete,
sin importar desde qué directorio se invoque pytest.
"""
import os
import sys

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
