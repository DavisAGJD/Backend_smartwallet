from PIL import Image
import easyocr
import re
import sys
import json
import os
import numpy as np

# Inicializar el lector de EasyOCR para español (usa GPU si está disponible; en Render probablemente se usará CPU)
reader = easyocr.Reader(['es'], gpu=False)

def parse_number(num_str):
    """
    Convierte una cadena numérica a float, tratando de detectar si la coma es separador decimal o
    si es usada como separador de miles.
    Ejemplos:
      "1,234.56" -> 1234.56
      "1234,56"  -> 1234.56
    """
    num_str = num_str.strip().replace(' ', '')
    # Si no hay punto y sí hay coma, asumimos que la coma es decimal
    if '.' not in num_str and ',' in num_str:
        return float(num_str.replace(',', '.'))
    else:
        return float(num_str.replace(',', ''))

def procesar_imagen(ruta_imagen):
    """
    Preprocesa la imagen para optimizar la extracción de texto:
      - Convierte a escala de grises.
      - Mejora el contraste aplicando un umbral.
      - Escala la imagen (duplica sus dimensiones).
      - Convierte a RGB y la pasa a un array de NumPy.
      - Realiza OCR usando EasyOCR.
    
    Devuelve el texto extraído en mayúsculas.
    """
    # Abrir imagen con Pillow
    img = Image.open(ruta_imagen)

    # Convertir a escala de grises
    img = img.convert('L')

    # Mejorar contraste aplicando un umbral (compromiso entre 150 y 160)
    img = img.point(lambda x: 0 if x < 155 else 255)

    # Escalar la imagen para mejorar la legibilidad
    img = img.resize((img.width * 2, img.height * 2))

    # Convertir la imagen a RGB (EasyOCR suele funcionar mejor con 3 canales)
    img_rgb = img.convert('RGB')
    img_np = np.array(img_rgb)

    # Realizar OCR con EasyOCR; detail=0 devuelve solo el texto
    resultados = reader.readtext(img_np, detail=0)
    
    # Unir las líneas detectadas en un solo bloque de texto
    texto = "\n".join(resultados)
    return texto.upper()

def detectar_tienda(texto):
    """
    Identifica la tienda a partir del texto OCR, permitiendo errores comunes.
    Se evalúan distintos patrones sobre cada línea del texto.
    """
    patrones = {
        r'(SUPER\s?AKI|AKI\sGH|AKT\sGH|SUPER\.?AKI|SUP\sAKI)': 'Super Aki',
        r'SAN\sFRANCISCO\sDE\sASIS': 'Super Aki',
        r'.*B[O0]D[E3][G6]A.*A[UÜ]RR[E3]R[^ ]*': 'Bodega Aurrera',
        r'.*W[ÁA4]L.?M[ÁA4]R[^ ]*': 'Bodega Aurrera',
        r'(B[O0]D[E3][G6]A.*A[UÜ]RR[E3]R[^ ]*|W[ÁA4]L.?M[ÁA4]R[^ ]*)': 'Bodega Aurrera',
        r'BODEGA\sAURRERA': 'Bodega Aurrera',
        r'.*S[O0]R[I1][A4]N[A4].*': 'Soriana',
        r'SORIANA': 'Soriana'
    }

    # Evaluar línea por línea para mayor tolerancia a errores de OCR
    for linea in texto.split('\n'):
        for patron, nombre in patrones.items():
            if re.search(patron, linea, re.IGNORECASE):
                return nombre

    # Detección adicional si "AKI" aparece en el texto
    if re.search(r'AKI', texto, re.IGNORECASE):
        return 'Super Aki'

    return 'Desconocida'

def extraer_total(texto):
    """
    Extrae el total del ticket utilizando múltiples estrategias:
      1. Buscar patrones de "TOTAL" con posibles errores (p.ej. T0TAL).
      2. Buscar "TOTAL" acompañado de símbolo de moneda.
      3. Buscar secciones como "MONTO:".
      4. Calcular a partir de EFECTIVO - CAMBIO (dos variantes).
      5. Como último recurso, extraer el último monto significativo del ticket.
    Se valida que el valor esté en un rango lógico (entre 10 y 10,000).
    """
    estrategias = [
        # Estrategia 1: Buscar "TOTAL" con posibles errores OCR.
        lambda: re.search(r'T[O0]T[A4]L[\s:$]*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})', texto),
        # Estrategia 2: Buscar "TOTAL" seguido de símbolo de moneda.
        lambda: re.search(r'TOTAL\s*\$\s*(\d+\.\d{2})', texto),
        # Estrategia 3: Buscar "MONTO:".
        lambda: re.search(r'MONTO:\s*(\d+\.\d{2})', texto),
        # Estrategia 4: Calcular a partir de EFECTIVO - CAMBIO (variante 1).
        lambda: (
            (lambda e, c: parse_number(e) - parse_number(c) if e and c else None)(
                re.search(r'EFECT[I1]V[O0][^\d]*(\d+[.,]\d{2})', texto).group(1) if re.search(r'EFECT[I1]V[O0][^\d]*(\d+[.,]\d{2})', texto) else None,
                re.search(r'CAMB[I1]O[^\d]*(\d+[.,]\d{2})', texto).group(1) if re.search(r'CAMB[I1]O[^\d]*(\d+[.,]\d{2})', texto) else None
            )
        ),
        # Estrategia 5: Calcular a partir de EFECTIVO - CAMBIO (variante 2).
        lambda: (
            (lambda e, c: parse_number(e) - parse_number(c) if e and c else None)(
                re.search(r'EFECTIVO\s*(\d+\.\d{2})', texto).group(1) if re.search(r'EFECTIVO\s*(\d+\.\d{2})', texto) else None,
                re.search(r'CAMBIO\s*(\d+\.\d{2})', texto).group(1) if re.search(r'CAMBIO\s*(\d+\.\d{2})', texto) else None
            )
        ),
        # Estrategia 6: Extraer el último monto significativo del ticket.
        lambda: (lambda m: parse_number(m[-1]) if m else None)(
            re.findall(r'\b\d{3,}(?:[.,]\d{3})*[.,]\d{2}\b', texto)
        )
    ]

    for estrategia in estrategias:
        try:
            resultado = estrategia()
            if resultado:
                # Si la estrategia devuelve un objeto match, extraemos el grupo y convertimos a número
                if hasattr(resultado, "group"):
                    valor = parse_number(resultado.group(1))
                elif isinstance(resultado, (float, int)):
                    valor = resultado
                else:
                    valor = resultado

                if 10 < valor < 10000:
                    return round(valor, 2)
        except Exception:
            continue
    return None

def analizar_ticket(ruta_imagen):
    """
    Proceso completo de análisis del ticket:
      1. Preprocesa la imagen y extrae el texto con EasyOCR.
      2. Detecta la tienda mediante patrones definidos.
      3. Extrae el total usando múltiples estrategias.
    
    Devuelve un diccionario con la tienda, el total y el texto extraído (útil para depuración).
    """
    try:
        texto = procesar_imagen(ruta_imagen)
        tienda = detectar_tienda(texto)
        total = extraer_total(texto)
        return {
            'tienda': tienda,
            'total': total,
            'texto_ocr': texto  # Para depuración y ajustes en los patrones
        }
    except Exception as e:
        return {'error': str(e)}

if __name__ == "__main__":
    try:
        if len(sys.argv) != 2:
            print(json.dumps({'error': 'Número inválido de argumentos'}))
            sys.exit(1)

        ruta_imagen = sys.argv[1]
        resultados = analizar_ticket(ruta_imagen)
        print(json.dumps(resultados, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({
            'error': 'Error inesperado',
            'detalle': str(e).replace('\n', ' ')
        }))
