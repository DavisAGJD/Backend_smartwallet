from PIL import Image, ImageEnhance, ImageFilter, ImageStat
import pytesseract
import re
import sys
import json

# Configuración de Tesseract para Render
pytesseract.pytesseract.tesseract_cmd = r'/usr/bin/tesseract'

def procesar_imagen(ruta_imagen):
    """Mejorado con preprocesamiento avanzado de imagen"""
    try:
        img = Image.open(ruta_imagen)
        
        # Mejorar calidad de imagen
        img = img.convert('L').filter(ImageFilter.SHARPEN)
        
        # Ajuste automático de contraste
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(2.0)
        
        # Redimensionamiento inteligente
        base_width = 800
        w_percent = (base_width / float(img.size[0]))
        h_size = int((float(img.size[1]) * float(w_percent)))
        img = img.resize((base_width, h_size), Image.LANCZOS)
        
        # Binarización adaptativa
        threshold = ImageStat.Stat(img).mean[0] * 0.8
        img = img.point(lambda x: 0 if x < threshold else 255)
        
        # OCR con configuración optimizada
        texto = pytesseract.image_to_string(
            img,
            config='--psm 3 --oem 3',
            lang='spa'
        ).upper()
        
        return texto.replace('\n', ' ').replace('  ', ' ')  # Normalizar espacios
    
    except Exception as e:
        print(f"Error procesando imagen: {str(e)}")
        return ""

def detectar_tienda(texto):
    """Versión mejorada con más patrones y tolerancia a errores"""
    patrones = {
        # Super Aki
        r'(SUPER[\s\-]?AK[I1]|SUPERAKI|SUPER\.AKI|AKI[\s\-]GH)': 'Super Aki',
        # Bodega Aurrera
        r'(B[O0]D[E3][G6]A[\s\-]?AURRERA|WAL[\s\-]?MART|WALMEX|BODEGA[\s\-]AUR)': 'Bodega Aurrera',
        # Soriana
        r'(S[O0]R[I1][A4]N[A4]|SORI@NA|SORI\sANA)': 'Soriana',
        # Otras tiendas
        r'(OXXO|7[\s\-]?ELEVEN|CIRCLE[\s\-]?K)': 'Tienda Conveniencia',
        r'(C[H4]EDR[A4]UI|CHEDRAUY)': 'Chedraui',
        r'(L[A4] C[O0]MER|COMERCIAL)': 'La Comer'
    }
    
    # Búsqueda prioritaria en primeras líneas
    lineas = texto.split('.')[:5]  # Considerar solo primeras 5 líneas
    for linea in lineas:
        for patron, nombre in patrones.items():
            if re.search(patron, linea, re.IGNORECASE):
                return nombre
    
    # Búsqueda por palabras clave
    keywords = {
        'aurrera': 'Bodega Aurrera',
        'walmart': 'Bodega Aurrera',
        'soriana': 'Soriana',
        'superaki': 'Super Aki',
        'chedraui': 'Chedraui',
        'oxxo': 'OXXO'
    }
    
    texto_sin_espacios = texto.replace(' ', '')
    for key, value in keywords.items():
        if key in texto_sin_espacios.lower():
            return value
    
    return 'Otra Tienda'

def extraer_total(texto):
    """Versión mejorada con más patrones y lógica de validación"""
    # Normalización del texto
    texto = texto.replace(',', '.').replace(' ', '')
    
    # Patrones prioritarios
    patrones = [
        r'T(OTAL|0TAL)[\s:\-$]*(\d+\.\d{2})',  # Total con posibles errores OCR
        r'IMPORTE[\s\-]TOTAL[\s:\-$]*(\d+\.\d{2})',
        r'(PAGAR|PAGO)[\s:\-$]*(\d+\.\d{2})',
        r'(TARJETA|EFECTIVO)[\s:\-$]*(\d+\.\d{2})',
        r'\b(\d{3,}\.\d{2})\b(?![^\$]*\d)'  # Último monto grande
    ]
    
    for patron in patrones:
        matches = re.finditer(patron, texto, re.IGNORECASE)
        for match in matches:
            try:
                valor = float(match.group(2 if match.lastindex > 1 else 1))
                if 50 <= valor <= 20000:  # Rango más realista
                    return round(valor, 2)
            except (ValueError, IndexError):
                continue
                
    # Último recurso: Buscar el número más grande
    montos = re.findall(r'\d{3,}\.\d{2}', texto)
    if montos:
        try:
            max_monto = max(map(float, montos))
            if 50 <= max_monto <= 20000:
                return round(max_monto, 2)
        except:
            pass
    
    return None

def analizar_ticket(ruta_imagen):
    """Función principal con logging mejorado"""
    try:
        texto = procesar_imagen(ruta_imagen)
        print(f"\n=== TEXTO OCR ===\n{texto}\n================")
        
        tienda = detectar_tienda(texto)
        total = extraer_total(texto)
        
        print(f"DETECCIÓN: Tienda={tienda}, Total={total}")
        
        return {
            'tienda': tienda,
            'total': total,
            'texto_ocr': texto
        }
    except Exception as e:
        print(f"ERROR: {str(e)}")
        return {'error': str(e)}

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({'error': 'Se requiere la ruta de la imagen como argumento'}))
        sys.exit(1)
        
    resultados = analizar_ticket(sys.argv[1])
    print(json.dumps(resultados))