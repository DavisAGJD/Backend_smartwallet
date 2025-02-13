import os
os.environ["TQDM_DISABLE"] = "1"
import sys
import json
import logging
import re
from typing import Optional, Dict, Union
import numpy as np
from PIL import Image, ImageEnhance
import easyocr
import cv2
from rapidfuzz import fuzz
import torch

# Configuración avanzada de logging
logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)
logger.setLevel(logging.WARNING)

def suppress_logs():
    import warnings
    warnings.filterwarnings("ignore")
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
    from easyocr.utils import get_logger
    easyocr_logger = get_logger()
    easyocr_logger.setLevel(logging.ERROR)

suppress_logs()

gpu_disponible = torch.cuda.is_available()
BATCH_SIZE = 16 if gpu_disponible else 4

# Inicializar EasyOCR con configuración optimizada
reader = easyocr.Reader(
    ['es'],
    gpu=gpu_disponible,
    verbose=False,
    recognizer=False
)

def normalizar_texto(texto: str) -> str:
    return re.sub(r'\s+', ' ', texto).strip().upper()

def str_to_float(s: str) -> Optional[float]:
    try:
        s_limpia = re.sub(r'[^\d.,]', '', s)
        if ',' in s_limpia and '.' in s_limpia:
            parte_decimal = s_limpia.split(',')[-1]
            if len(parte_decimal) == 2:
                return float(s_limpia.replace('.', '').replace(',', '.'))
        s_limpia = s_limpia.replace(',', '.')
        partes = s_limpia.split('.')
        if len(partes) > 1:
            entero = ''.join(partes[:-1])
            decimal = partes[-1]
            s_final = f"{entero}.{decimal}"
        else:
            s_final = s_limpia
        valor = float(s_final)
        return round(valor, 2) if 10 < valor < 100000 else None
    except Exception:
        return None

def deskew_image_cv2(img: np.ndarray) -> np.ndarray:
    if len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img.copy()
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    lines = cv2.HoughLinesP(edges, 1, np.pi/180, 100, minLineLength=100, maxLineGap=10)
    if lines is None:
        return img
    angles = [np.degrees(np.arctan2(y2-y1, x2-x1)) for line in lines for x1,y1,x2,y2 in line]
    if not angles:
        return img
    median_angle = np.median(angles)
    h, w = img.shape[:2]
    center = (w//2, h//2)
    M = cv2.getRotationMatrix2D(center, median_angle, 1.0)
    return cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

def procesar_imagen_pil(ruta_imagen: str) -> str:
    try:
        img = Image.open(ruta_imagen)
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.5)
        img = img.convert('L').point(lambda x: 0 if x < 160 else 255)
        img = img.resize((1200, int(img.height * 1200/img.width)), Image.LANCZOS)
        img_np = np.array(img.convert('RGB'))
        resultados = reader.readtext(
            img_np,
            paragraph=True,
            detail=0,
            batch_size=BATCH_SIZE,
            allowlist='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜÑ$€., ',
            verbose=False
        )
        return normalizar_texto(' '.join(resultados))
    except Exception as e:
        logger.error(f"Error PIL: {str(e)}")
        raise

def procesar_imagen_cv2(ruta_imagen: str) -> str:
    try:
        img_cv = cv2.imread(ruta_imagen)
        if img_cv is None:
            raise ValueError("Imagen no válida")
        img_cv = deskew_image_cv2(img_cv)
        gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
        gray = cv2.medianBlur(gray, 3)
        thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 2)
        resized = cv2.resize(thresh, (1200, int(thresh.shape[0] * 1200/thresh.shape[1])), interpolation=cv2.INTER_AREA)
        img_rgb = cv2.cvtColor(resized, cv2.COLOR_GRAY2RGB)
        resultados = reader.readtext(
            img_rgb,
            paragraph=True,
            detail=0,
            batch_size=BATCH_SIZE,
            allowlist='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜÑ$€., ',
            verbose=False
        )
        return normalizar_texto(' '.join(resultados))
    except Exception as e:
        logger.error(f"Error CV2: {str(e)}")
        raise

def procesar_imagen_mejorado(ruta_imagen: str) -> str:
    try:
        texto_pil = procesar_imagen_pil(ruta_imagen)
        texto_cv2 = procesar_imagen_cv2(ruta_imagen)
        return texto_pil if len(texto_pil) >= len(texto_cv2) else texto_cv2
    except Exception as e:
        logger.error(f"Error procesamiento mejorado: {str(e)}")
        raise

def detectar_tienda(texto: str) -> str:
    texto_norm = normalizar_texto(texto)
    patrones = {
        r'\b(?:SUPER[\-\s]?AK[I1P])\b': 'Super Aki',
        r'\b(?:BODEGA[\-\s]?AURRERA)\b': 'Bodega Aurrera',
        r'\b(?:S[O0]R[I1][A4]N[A4])\b': 'Soriana',
        r'\b(?:CHEDRAUI)\b': 'Chedraui',
        r'\b(?:OXXO)\b': 'OXXO'
    }
    for patron, nombre in patrones.items():
        if re.search(patron, texto_norm, re.IGNORECASE):
            return nombre
    return "Desconocida"

def extraer_total_estrategias(texto: str) -> Optional[float]:
    texto_norm = normalizar_texto(texto)
    matches = re.findall(r'TOTAL.*?(\d[\d\.,]+)|\$(\d[\d\.,]+)', texto_norm)
    for match in matches:
        valor_str = next(v for v in match if v)
        valor = str_to_float(valor_str)
        if valor and 10 < valor < 100000:
            return valor
    return None

def analizar_ticket(ruta_imagen: str) -> Dict[str, Union[str, float]]:
    try:
        texto = procesar_imagen_mejorado(ruta_imagen)
        return {
            'tienda': detectar_tienda(texto),
            'total': extraer_total_estrategias(texto),
            'texto_ocr': texto[:500]
        }
    except Exception as e:
        return {'error': str(e)}

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Se requiere la ruta de la imagen"}))
        sys.exit(1)
    
    ruta_imagen = sys.argv[1]
    if not os.path.isfile(ruta_imagen):
        print(json.dumps({"error": f"Archivo no encontrado: {ruta_imagen}"}))
        sys.exit(1)
    
    resultado = analizar_ticket(ruta_imagen)
    print(json.dumps(resultado))

if __name__ == "__main__":
    main()