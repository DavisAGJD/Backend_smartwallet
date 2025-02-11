from PIL import Image
import pytesseract
import re
import sys
import json
import os

pytesseract.pytesseract.tesseract_cmd = '/usr/bin/tesseract'  # Ruta correcta en Render
os.environ['TESSDATA_PREFIX'] = '/usr/share/tesseract-ocr/4.00/tessdata' 

# Verificar existencia del modelo de idioma
if not os.path.exists(os.path.join(os.environ['TESSDATA_PREFIX'], 'spa.traineddata')):
    raise Exception(f"Modelo español no encontrado en: {os.environ['TESSDATA_PREFIX']}")

def procesar_imagen(ruta_imagen):
    """
    Preprocesa la imagen para optimizar la extracción de texto.
    Se aplica conversión a escala de grises, mejora de contraste y escalado.
    Además se realiza OCR con dos configuraciones (PSM 4 y PSM 6) y se selecciona
    el resultado que presente mayor cantidad de dígitos (heurística para textos numéricos).
    """
    img = Image.open(ruta_imagen)
    
    # Convertir a escala de grises
    img = img.convert('L')
    
    # Mejorar contraste con un umbral intermedio (compromiso entre 150 y 160)
    img = img.point(lambda x: 0 if x < 155 else 255)
    
    # Escalar la imagen para mejorar la legibilidad
    img = img.resize((img.width * 2, img.height * 2))
    
    # Realizar OCR con dos configuraciones:
    texto_psm4 = pytesseract.image_to_string(
        img,
        config='--psm 4 --oem 3',
        lang='spa'
    )
    texto_psm6 = pytesseract.image_to_string(
        img,
        config='--psm 6 --oem 3',
        lang='spa'
    )
    
    # Heurística: se selecciona el texto que tenga mayor cantidad de dígitos
    if sum(c.isdigit() for c in texto_psm4) >= sum(c.isdigit() for c in texto_psm6):
        texto = texto_psm4
    else:
        texto = texto_psm6

    return texto.upper()

def detectar_tienda(texto):
    """
    Identifica la tienda a partir del texto OCR, permitiendo errores comunes de OCR.
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
    
    # Detección adicional si "AKI" aparece en la dirección o datos de la tienda
    if re.search(r'AKI', texto, re.IGNORECASE):
        return 'Super Aki'
    
    return 'Desconocida'


def extraer_total(texto):
    """
    Extrae el total del ticket utilizando múltiples estrategias combinadas:
      1. Buscar patrones de TOTAL con variaciones y posibles errores (por ejemplo, T0TAL).
      2. Buscar TOTAL con símbolo de moneda.
      3. Buscar secciones como "MONTO:".
      4. Calcular a partir de EFECTIVO - CAMBIO (se prueba con dos variantes de patrones).
      5. Como último recurso, extraer el último monto significativo del ticket.
    Se valida que el valor obtenido se encuentre en un rango lógico (por ejemplo, entre 10 y 10,000).
    """
    estrategias = [
        # Estrategia 1 (Código 1): Buscar "TOTAL" (permitiendo errores OCR)
        lambda: re.search(r'T[O0]T[A4]L[\s:$]*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})', texto),
        # Estrategia 2 (Código 2): Buscar "TOTAL" con símbolo de moneda
        lambda: re.search(r'TOTAL\s*\$\s*(\d+\.\d{2})', texto),
        # Estrategia 3 (Código 2): Buscar "MONTO:"
        lambda: re.search(r'MONTO:\s*(\d+\.\d{2})', texto),
        # Estrategia 4 (Código 1): Calcular a partir de EFECTIVO y CAMBIO (variante 1)
        lambda: (lambda e, c: e - c if e and c else None)(
                    re.search(r'EFECT[I1]V[O0][\D]*(\d+[.,]\d{2})', texto),
                    re.search(r'CAMB[I1]O[\D]*(\d+[.,]\d{2})', texto)
                ),
        # Estrategia 5 (Código 2): Calcular a partir de EFECTIVO y CAMBIO (variante 2)
        lambda: (lambda e, c: e - c if e and c else None)(
                    re.search(r'EFECTIVO\s*(\d+\.\d{2})', texto),
                    re.search(r'CAMBIO\s*(\d+\.\d{2})', texto)
                ),
        # Estrategia 6 (Código 1): Extraer el último monto significativo
        lambda: (lambda m: float(m[-1].replace(',', '')) if m else None)(
                    re.findall(r'\b\d{3,}(?:[.,]\d{3})*[.,]\d{2}\b', texto)
                )
    ]
    
    for estrategia in estrategias:
        try:
            resultado = estrategia()
            if resultado:
                if isinstance(resultado, float):
                    valor = resultado
                else:
                    valor = float(resultado.group(1).replace(',', ''))
                if 10 < valor < 10000:
                    return round(valor, 2)
        except Exception:
            continue
    return None

def analizar_ticket(ruta_imagen):
    """
    Proceso completo de análisis del ticket:
      1. Preprocesa la imagen y extrae el texto (combinando dos configuraciones OCR).
      2. Detecta la tienda a partir de los patrones definidos.
      3. Extrae el total mediante múltiples estrategias.
      
    Devuelve un diccionario con la tienda, el total y el texto extraído (útil para depuración).
    """
    try:
        texto = procesar_imagen(ruta_imagen)
        tienda = detectar_tienda(texto)
        total = extraer_total(texto)
        return {
            'tienda': tienda,
            'total': total,
            'texto_ocr': texto  # Útil para depurar y ajustar patrones
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
