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
from rapidfuzz import fuzz  # Para fuzzy matching
import torch

# Configurar logging
logging.basicConfig(stream=sys.stderr, level=logging.INFO)
logger = logging.getLogger(__name__)

# Detectar si hay GPU disponible mediante PyTorch
gpu_disponible = torch.cuda.is_available()
if gpu_disponible:
    logger.info("GPU disponible: se utilizará para EasyOCR.")
else:
    logger.info("No se detectó GPU: se utilizará la CPU para EasyOCR.")

# Reducir el batch size para entornos con pocos recursos (CPU)
BATCH_SIZE = 16 if gpu_disponible else 1

# Reducir la resolución base para disminuir el uso de memoria y procesamiento
ANCHO_BASE = 600

# Inicializar EasyOCR para español (cargado una única vez)
reader = easyocr.Reader(['es'], gpu=gpu_disponible)


def normalizar_texto(texto: str) -> str:
    """Normaliza el texto: elimina espacios extra y lo pasa a mayúsculas."""
    return re.sub(r'\s+', ' ', texto).strip().upper()


def str_to_float(s: str) -> Optional[float]:
    """
    Convierte cadenas numéricas con diferentes formatos a float.
    Se limpian caracteres no numéricos y se detecta el formato (europeo o anglosajón).
    """
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
        if 10 < valor < 100000:
            return round(valor, 2)
        return None
    except Exception as e:
        logger.warning(f"Error en conversión de '{s}': {str(e)}")
        return None


def deskew_image_cv2(img: np.ndarray) -> np.ndarray:
    """
    Corrige la inclinación de la imagen utilizando la detección de líneas.
    Se usa Canny y HoughLinesP para estimar el ángulo medio y rotar la imagen.
    """
    if len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img.copy()
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=100, minLineLength=100, maxLineGap=10)
    if lines is None:
        return img
    angles = []
    for line in lines:
        x1, y1, x2, y2 = line[0]
        angle = np.degrees(np.arctan2(y2 - y1, x2 - x1))
        angles.append(angle)
    if len(angles) == 0:
        return img
    median_angle = np.median(angles)
    (h, w) = img.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, median_angle, 1.0)
    rotated = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    return rotated


def procesar_imagen_pil(ruta_imagen: str) -> str:
    """
    Pipeline de preprocesamiento usando PIL:
      - Aumenta el contraste.
      - Convierte a escala de grises y aplica un umbral fijo.
      - Redimensiona la imagen a un ancho base reducido.
      - Convierte a RGB y extrae el texto con EasyOCR.
    """
    try:
        img = Image.open(ruta_imagen)
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.5)
        img = img.convert('L').point(lambda x: 0 if x < 160 else 255)
        # Usar una resolución base menor (ANCHO_BASE)
        relacion = ANCHO_BASE / img.width
        alto = int(img.height * relacion)
        img = img.resize((ANCHO_BASE, alto), Image.LANCZOS)
        img_np = np.array(img.convert('RGB'))
        resultados = reader.readtext(
            img_np,
            paragraph=True,
            detail=0,
            batch_size=BATCH_SIZE,
            allowlist='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜÑ$€., '
        )
        return normalizar_texto(' '.join(resultados))
    except Exception as e:
        logger.error(f"Error en preprocesamiento PIL de la imagen '{ruta_imagen}': {str(e)}")
        raise


def procesar_imagen_cv2(ruta_imagen: str) -> str:
    """
    Pipeline de preprocesamiento usando OpenCV:
      - Lee la imagen y aplica corrección de inclinación (deskew).
      - Convierte a escala de grises y aplica filtro mediano para reducir ruido.
      - Emplea umbral adaptativo para binarizar la imagen.
      - Redimensiona la imagen a un ancho base reducido.
      - Convierte la imagen a RGB y ejecuta EasyOCR.
    """
    try:
        img_cv = cv2.imread(ruta_imagen)
        if img_cv is None:
            raise Exception("No se pudo cargar la imagen con cv2")
        img_cv = deskew_image_cv2(img_cv)
        gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
        gray = cv2.medianBlur(gray, 3)
        thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 31, 2
        )
        ratio = ANCHO_BASE / thresh.shape[1]
        nuevo_alto = int(thresh.shape[0] * ratio)
        resized = cv2.resize(thresh, (ANCHO_BASE, nuevo_alto), interpolation=cv2.INTER_AREA)
        img_rgb = cv2.cvtColor(resized, cv2.COLOR_GRAY2RGB)
        resultados = reader.readtext(
            img_rgb,
            paragraph=True,
            detail=0,
            batch_size=BATCH_SIZE,
            allowlist='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜÑ$€., '
        )
        return normalizar_texto(' '.join(resultados))
    except Exception as e:
        logger.error(f"Error en preprocesamiento OpenCV de la imagen '{ruta_imagen}': {str(e)}")
        raise


def procesar_imagen_mejorado(ruta_imagen: str) -> str:
    """
    Combina dos pipelines de preprocesamiento (PIL y OpenCV) y selecciona el resultado
    que parezca contener mayor cantidad de información (por ejemplo, que incluya la palabra "TOTAL").
    """
    try:
        texto_pil = procesar_imagen_pil(ruta_imagen)
        texto_cv2 = procesar_imagen_cv2(ruta_imagen)
        if 'TOTAL' in texto_pil and 'TOTAL' not in texto_cv2:
            return texto_pil
        elif 'TOTAL' in texto_cv2 and 'TOTAL' not in texto_pil:
            return texto_cv2
        else:
            return texto_pil if len(texto_pil) >= len(texto_cv2) else texto_cv2
    except Exception as e:
        logger.error(f"Error en el preprocesamiento mejorado de la imagen '{ruta_imagen}': {str(e)}")
        raise


def detectar_tienda(texto: str) -> str:
    """
    Detecta la tienda a partir del texto OCR usando:
      1. Patrones y keywords con expresiones regulares.
      2. Fuzzy matching para detectar tiendas conocidas.
    """
    texto_norm = normalizar_texto(texto)
    patrones = {
        r'\b(?:SUPER[\-\s]?AK[I1P]|SUPERAK[I1P]|SUP\.?AK[I1P]|AK[I1P]\s?GH|[CS]?AK(?:[I1PT]))\b': 'Super Aki',
        r'\b(?:BODEGA[\-\s]?AURRERA|WAL[\-\s]?MART|BODEGAAURRERA|B0DEGA\sAURRERA)\b': 'Bodega Aurrera',
        r'\b(?:S[O0]R[I1][A4]N[A4]|SORIANA|SORI@NA)\b': 'Soriana',
        r'\b(?:CHEDRAUI|CHEDRAUY|CHEDRAÜI)\b': 'Chedraui',
        r'\b(?:OXXO|7\-?ELEVEN)\b': 'OXXO',
        r'\b(?:LA\sCOMER|COMERCIAL\sMEXICANA)\b': 'La Comer',
        r'\b(?:TIENDA\s?CONVENIENCIA)\b': 'Tienda Conveniencia'
    }
    lineas = texto_norm.split('.')[:5]
    for patron, nombre in patrones.items():
        for linea in lineas:
            if re.search(patron, linea, re.IGNORECASE):
                logger.info(f"Tienda detectada por patrón: {nombre} (patrón: {patron})")
                return nombre

    keywords = {
        'AKI': 'Super Aki',
        'AKP': 'Super Aki',
        'AKT': 'Super Aki',
        'AURRERA': 'Bodega Aurrera',
        'WALMART': 'Bodega Aurrera',
        'SORIANA': 'Soriana',
        'CHEDRAUI': 'Chedraui',
        'OXXO': 'OXXO',
        'CONVENIENCIA': 'Tienda Conveniencia'
    }
    for key, value in keywords.items():
        if re.search(rf'\b{key}\b', texto_norm, re.IGNORECASE):
            logger.info(f"Tienda detectada por keyword: {value}")
            return value

    candidates = ["Super Aki", "Bodega Aurrera", "Soriana", "Chedraui", "OXXO", "La Comer", "7-Eleven", "Tienda Conveniencia"]
    best_score = 0
    best_candidate = "Desconocida"
    for linea in texto_norm.split('.'):
        for candidate in candidates:
            score = fuzz.partial_ratio(candidate, linea)
            if score > best_score and score > 70:
                best_score = score
                best_candidate = candidate
    logger.info(f"Tienda detectada por fuzzy matching: {best_candidate} (score: {best_score})")
    return best_candidate


def extraer_total_estrategias(texto: str) -> Optional[float]:
    """
    Extrae el total utilizando múltiples estrategias:
      1. Expresiones regulares que buscan la palabra TOTAL y patrones de moneda.
      2. Estrategias adicionales como TOTAL A PAGAR, IMPORTE, etc.
      3. Selección del mayor o del último número detectado.
      4. Fuzzy matching en líneas que contengan "TOTAL".
    """
    texto_norm = normalizar_texto(texto)
    estrategias = [
        lambda: re.search(r'T[O0O]+T[A4]+L.*?(\d[\d\.,]+\b)', texto_norm),
        lambda: re.search(r'(?:TOTAL\s*A\s*PAGAR|IMPORTE).*?(\d[\d\.,]+)', texto_norm),
        lambda: re.search(r'\$\s*(\d[\d\.,]+)\b', texto_norm),
        lambda: (lambda m: m[-1] if m else None)(re.findall(r'\b\d[\d\.,]+\b', texto_norm)),
        lambda: (lambda e, c: e - c if e and c else None)(
            next((str_to_float(m.group(1)) for m in re.finditer(r'EFECTIVO.*?(\d[\d\.,]+)', texto_norm)), None),
            next((str_to_float(m.group(1)) for m in re.finditer(r'CAMBIO.*?(\d[\d\.,]+)', texto_norm)), None)
        ),
        lambda: max(
            [str_to_float(x) for x in re.findall(r'\b\d[\d\.,]+\b', texto_norm) if str_to_float(x) is not None],
            default=None
        ),
        lambda: (lambda numbers: str_to_float(numbers[-1]) if numbers else None)(re.findall(r'\b\d[\d\.,]+\b', texto_norm))
    ]
    valores_validos = []
    for estrategia in estrategias:
        try:
            resultado = estrategia()
            if resultado:
                if hasattr(resultado, 'group'):
                    valor = str_to_float(resultado.group(1))
                elif isinstance(resultado, (int, float)):
                    valor = resultado
                elif isinstance(resultado, str):
                    valor = str_to_float(resultado)
                else:
                    valor = None
                if valor is not None and 10 < valor < 100000:
                    valores_validos.append(valor)
        except Exception as e:
            logger.warning(f"Error en estrategia de extracción: {str(e)}")
    
    total = None
    if valores_validos:
        total = max(set(valores_validos), key=valores_validos.count)
    
    if total is None:
        for linea in texto_norm.splitlines():
            if fuzz.partial_ratio("TOTAL", linea) > 70:
                match = re.search(r'(\d[\d\.,]+)', linea)
                if match:
                    total = str_to_float(match.group(1))
                    if total is not None:
                        logger.info(f"Total detectado por fuzzy matching: {total}")
                        break
    
    return total


def analizar_ticket(ruta_imagen: str) -> Dict[str, Union[str, float]]:
    """
    Proceso completo de análisis del ticket:
      1. Preprocesa la imagen (combinando dos pipelines).
      2. Detecta la tienda y extrae el total.
      3. Devuelve un diccionario con la tienda, el total y el texto OCR (para depuración).
    """
    try:
        texto = procesar_imagen_mejorado(ruta_imagen)
        logger.info(f"Texto OCR procesado:\n{texto}")
        tienda = detectar_tienda(texto)
        total = extraer_total_estrategias(texto)
        if tienda == 'Desconocida' or total is None:
            resultados_extras = reader.readtext(ruta_imagen, detail=0)
            texto_extras = normalizar_texto(' '.join(resultados_extras))
            if tienda == 'Desconocida' and 'BODEGA' in texto_extras:
                tienda = 'Bodega Aurrera'
            if total is None and 'TOTAL' in texto_extras:
                match = re.search(r'TOTAL\s*\$?\s*(\d+[,.]?\d*)', texto_extras)
                if match:
                    total = str_to_float(match.group(1))
        return {
            'tienda': tienda,
            'total': total,
            'texto_ocr': texto
        }
    except Exception as e:
        logger.error(f"Error en el análisis del ticket: {str(e)}")
        return {'error': str(e)}


def main():
    """
    Función principal:
      - Espera recibir la ruta de una única imagen como argumento.
      - Procesa la imagen y devuelve el resultado en formato JSON.
    """
    if len(sys.argv) != 2:
        logger.error("Se requiere exactamente un argumento: la ruta de la imagen.")
        print(json.dumps({"error": "Se requiere exactamente un argumento: la ruta de la imagen."}))
        sys.exit(1)
    
    ruta_imagen = sys.argv[1]
    resultado = analizar_ticket(ruta_imagen)
    print(json.dumps(resultado))


if __name__ == "__main__":
    main()
