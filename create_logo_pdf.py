#!/usr/bin/env python3
"""
Скрипт для создания PDF версии логотипа компании
"""

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.colors import Color
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics.renderPDF import drawToFile
from reportlab.graphics.widgetbase import Widget
import os

def create_logo_pdf():
    """Создает PDF файл с логотипом компании"""
    
    # Создаем PDF документ
    pdf_path = "/workspaces/codespaces-django/hello_world/static/images/company_logo.pdf"
    
    # Размеры страницы и логотипа
    page_width, page_height = A4
    logo_size = 200
    
    # Центрируем логотип на странице
    x = (page_width - logo_size) / 2
    y = (page_height - logo_size) / 2
    
    c = canvas.Canvas(pdf_path, pagesize=A4)
    
    # Устанавливаем цвета
    blue_color = Color(59/255, 130/255, 246/255)  # #3b82f6
    dark_blue_color = Color(29/255, 78/255, 216/255)  # #1d4ed8
    white_color = Color(1, 1, 1)
    
    # Рисуем основной прямоугольник с закругленными углами
    c.setFillColor(blue_color)
    c.roundRect(x, y, logo_size, logo_size, 20, fill=1, stroke=0)
    
    # Добавляем градиент эффект (упрощенный)
    c.setFillColor(dark_blue_color)
    c.setFillAlpha(0.3)
    c.roundRect(x + logo_size*0.7, y, logo_size*0.3, logo_size, 20, fill=1, stroke=0)
    
    # Сбрасываем альфа канал
    c.setFillAlpha(1.0)
    
    # Добавляем текст "EZ"
    c.setFillColor(white_color)
    c.setFont("Helvetica-Bold", 64)
    
    # Буква E
    text_width_e = c.stringWidth("E", "Helvetica-Bold", 64)
    c.drawString(x + 30, y + logo_size/2 + 10, "E")
    
    # Буква Z
    c.drawString(x + 110, y + logo_size/2 + 10, "Z")
    
    # Добавляем линию
    c.setStrokeColor(white_color)
    c.setLineWidth(4)
    c.setStrokeAlpha(0.8)
    c.line(x + 30, y + logo_size/2 - 10, x + logo_size - 30, y + logo_size/2 - 10)
    
    # Сбрасываем альфа канал
    c.setStrokeAlpha(1.0)
    
    # Добавляем подпись "Company"
    c.setFont("Helvetica", 24)
    company_text = "Company"
    text_width = c.stringWidth(company_text, "Helvetica", 24)
    c.drawString(x + (logo_size - text_width)/2, y + 40, company_text)
    
    # Добавляем метаданные
    c.setTitle("EZ Company Logo")
    c.setAuthor("EZ Company")
    c.setSubject("Company Logo")
    c.setKeywords(["logo", "company", "EZ", "brand"])
    
    c.save()
    print(f"PDF логотип создан: {pdf_path}")

if __name__ == "__main__":
    try:
        create_logo_pdf()
    except ImportError:
        print("Устанавливаем reportlab...")
        os.system("pip install reportlab")
        create_logo_pdf()
    except Exception as e:
        print(f"Ошибка при создании PDF: {e}")
