"""-----------------------------------------------------------------------------
# Name:             Economic_Development_SiteSelector_GPService

# Purpose:          To generate a report containing map of the site, result
#                   of the query and attachments

# Author:           Shreya Chatterjee

# Input Parameters:  1.	logo - gpstring (url to logo image)(optional),
#                    2.	report_title  - gpstring (optional),
#                    3.	webmap_json - gpstring (optional),
#                    4.	reportdata_json - gpstring (required),
#                    5. attachment_list - gpstring (optional)
#
# Created:          17/06/2014
#----------------------------------------------------------------------------"""

# Importing required modules

# pylint disable: E1101
import os
import json
import arcpy
import urllib
import collections
from cStringIO import StringIO
from PIL import Image as PILImage, ImageFile
import datetime, time
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, inch
from reportlab.lib.colors import Color
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.rl_config import defaultPageSize
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import SimpleDocTemplate, Paragraph, PageBreak, Image
from reportlab.platypus import Table, TableStyle, Spacer
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
import reportlab.rl_config
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


class NumberedCanvas(canvas.Canvas):
    """Class created for printing page numbers in X of Y format in Footer"""
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        """add page info to each page (page x of y)"""
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.setFont("Vera", 7.5)
        self.setFillGray(0.70)
        self.drawRightString(DOC.width - (DOC.rightMargin-2.35*inch),
                             0.25*DOC.bottomMargin,
                             "Page {0} of {1}".format(self._pageNumber,
                                                      page_count))


def export_web_map(web_map_json):
    """Fetches the webmap and formats it to proper size to fit the PDF report"""

    #Implemented in MAP_ONLY Layout template
    output_path = os.path.join(arcpy.env.scratchFolder, "Webmap.png") #pylint: disable=E1101

    web_map = convert(web_map_json)
    web_map_image = arcpy.ExportWebMap_server(str(web_map), output_path,
                                              Format="PNG32",
                                              Layout_Templates_Folder="",
                                              Layout_Template='MAP_ONLY')

    for img in os.listdir(arcpy.env.scratchFolder):    #pylint: disable=E1101
        if img.endswith(".png"):
            webmap = os.path.join(arcpy.env.scratchFolder, str(img)) #pylint: disable=E1101
            break

    pil_image = PILImage.open(webmap)
    map_image_width, image_height = ImageReader(pil_image).getSize()
    webmap_image_width = map_image_width

    webmap_image = Image(webmap, width=map_image_width, height=image_height)
    return webmap_image, webmap_image_width

def create_print_table(table_data):
    """Formats report data into table"""
    table_counter = 0
    h_alignment = ""
    temp_list = []
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='Header', alignment=TA_CENTER,
                              spaceAfter=4, borderPadding=(10, 10, 10),
                              leftIndent=10, fontName='VeraBd', fontSize=7.5))

    row_color = Color(0.9529411764705882, 0.9529411764705882,
                      0.9529411764705882, 1)

    column_header_color = Color(0.8666666666666667, 0.8745098039215686,
                                0.8745098039215686, 1)

    sorted_table_headers = []
    for index in SORTEDTABLESINDEX:
        sorted_table_headers.append(index[1])

    for k in sorted_table_headers:
        attribute_data = []
        table_style = TableStyle([('SPAN', (0, 0), (-1, 0)),
                                  ('ALIGN', (0, 0), (-1, 0), 'LEFT'),
                                  ('BACKGROUND', (0, 0), (-1, 0),
                                   column_header_color)])

        data = []
        data += [[Paragraph(k, styles['Header'])]]

        row_count = []
        table_keys = table_data.keys()
        row_count.append(len(table_data[table_keys[0]]))
        row_count.append(len(table_data[table_keys[1]]))

        styles_table = getSampleStyleSheet()
        styles_table.add(ParagraphStyle(name='TblBody', alignment=TA_LEFT,
                                        spaceAfter=4, fontName='Vera',
                                        fontSize=7.5))

        styles_table_right = getSampleStyleSheet()
        styles_table_right.add(ParagraphStyle(name='TblBody',
                                              alignment=TA_RIGHT, spaceAfter=4,
                                              fontName='Vera', fontSize=7.5))

        for i in xrange((max(row_count))):

            table_style.wordWrap = 'CJK'
            try:
                #Add keys and values as paragraph to wrap texts
                table_key = (Paragraph((table_data[k][i].split(":"))[0],
                                       styles_table['TblBody']))

                if k == sorted_table_headers[0]:
                    value = (Paragraph((table_data[k][i].split(":"))[1],
                                       styles_table['TblBody']))
                else:
                    value = (Paragraph((table_data[k][i].split(":"))[1],
                                       styles_table_right['TblBody']))
                table_str = []
                table_str.append(table_key)
                table_str.append(value)
                data.append(table_str)
                attribute_data.append(data)
            except Exception:
                data.append("  ")
                attribute_data.append(data)
            if i % 2 != 0:
                table_style.add('BACKGROUND', (0, (i+1)), (-1, (i+1)),
                                row_color)

                if table_counter == 1:
                    h_alignment = 'RIGHT'
                else:
                    h_alignment = 'LEFT'

        temp_table = Table(attribute_data[table_counter], vAlign='TOP',
                           colWidths=(150, 100), hAlign=h_alignment,
                           style=table_style)
        temp_list.append(temp_table)
        table_counter += 1

    table_data = [[temp_list[0], temp_list[1]]]
    table_holder = Table(table_data, vAlign='TOP', colWidths=(265),
                         style=[('VALIGN', (0, 0), (1, 0), 'TOP'),
                                ('HALIGN', (1, 0), (1, 0), 'RIGHT')])
    return table_holder

def on_first_page(canvas, DOC): #pylint: disable=W0621
    """Draws header and footer on first page"""
    canvas.saveState()
    header(canvas, DOC, MAPHEADERTEXT)
    footer(canvas, DOC)
    canvas.restoreState()

def on_later_pages(canvas, DOC):
    """Draws header and footer on every page"""
    if DOC.page > 1:
        canvas.saveState()
        header(canvas, DOC, MAPHEADERTEXT)
        footer(canvas, DOC)
        canvas.restoreState()

def header(canvas, DOC, MAPHEADERTEXT):
    """Draws the page header"""
    arcpy.AddMessage("Drawing Header...")
    canvas.saveState()
    header_top_padding = 1*cm
    logo_image_height = 50
    logo_header_gap = 0.75*cm
    indent_right = 40
    docy = PAGE_HEIGHT-60

    style_header = getSampleStyleSheet()
    style_header.add(ParagraphStyle(name='BodyT', alignment=TA_LEFT,
                                    borderPadding=(5, 10, 10), fontName='Vera',
                                    fontSize=14, spaceAfter=6,
                                    backColor=Color(0, 0.2627450980392157,
                                                    0.42745098039215684, 1),
                                    textColor=Color(1, 1, 1, 1)))
    para = Paragraph(MAPHEADERTEXT, style_header["BodyT"])

    logo_image_width, imageheight = ImageReader(IMAGE).getSize()

    aspect_ratio = imageheight/(float(logo_image_width))
    reduceby = 0.1

    while logo_image_height <= imageheight:
        logo_image_width = logo_image_width - reduceby
        imageheight = logo_image_width*aspect_ratio
        reduceby += 0.1

    para_width_total, para_height = para.wrap(DOC.width + 0.70*inch
                                              - logo_image_width
                                              - logo_header_gap,
                                              DOC.topMargin + 0.5 *inch)

    logo_y = ((para_height + imageheight) / 2) + header_top_padding
    canvas.drawImage(ImageReader(IMAGE), indent_right, PAGE_HEIGHT-logo_y,
                     logo_image_width, imageheight, mask='auto')

    para_y = para_height + header_top_padding

    para.drawOn(canvas,
                (indent_right+ 0.1*cm + logo_image_width + logo_header_gap),
                (PAGE_HEIGHT - para_y))

    canvas.setLineWidth(1.0)
    canvas.setStrokeColor(Color(0, 0.2627450980392157, 0.42745098039215684, 1))
    canvas.line(indent_right, docy, (PAGE_WIDTH - indent_right), docy)
    canvas.restoreState()

def footer(canvas, DOC):
    """Draws the page footer"""
    arcpy.AddMessage("Drawing Footer...")
    canvas.saveState()
    canvas.setFont("Vera", 7.5)

    text = MAPHEADERTEXT
    date_now = datetime.datetime.now()
    date_formatted = (str(time.strftime("%b")) + " " + str(date_now.day) +
                      ", " + str(date_now.year))
    canvas.drawRightString(DOC.width - (DOC.rightMargin-2.35*inch),
                           0.5*DOC.bottomMargin, date_formatted)
    canvas.setFillGray(0.70)
    canvas.drawString(DOC.leftMargin - 25, 0.5*DOC.bottomMargin, text)
    canvas.setLineWidth(2)
    canvas.setStrokeColor(Color(0, 0.2627450980392157, 0.42745098039215684, 1))
    pagex = 47.5
    pagey = 0.75*DOC.bottomMargin
    canvas.line(pagex, pagey, (PAGE_WIDTH - pagex), pagey)
    canvas.restoreState()

def check_if_image(attachment_url):
    """Checks the extensions of attachments, returns boolean true if image"""
    list_image_formats = ['png', 'jpeg', 'jfif', 'exif', 'tiff', 'gif',
                          'bmp', 'img', 'jpg']
    extention = (attachment_url[-4:]).split('.')
    if extention[1].lower() in list_image_formats:
        return 'true'
    else:
        return 'false'

def calculate_scale(imagewidth, ymin, xmax):
    """Calculates the scale of the map.
    scale = map distance / ground distance"""
    map_distance = abs(xmax-ymin)
    ground_distance = (0.000264583 * imagewidth)
    map_scale = int(map_distance/ground_distance)
    modified_scale = '{:20,}'.format(map_scale)
    return modified_scale

def convert(data):
    """Converts unicode to string"""
    if isinstance(data, basestring):
        return str(data)
    elif data == None:
        return 'null'
    elif isinstance(data, collections.Mapping):
        return dict(map(convert, data.iteritems()))
    elif isinstance(data, collections.Iterable):
        return type(data)(map(convert, data))
    else:
        return data

try:
    DPI = 96
    WEBMAP_WIDTH = 0
    arcpy.env.overwriteOutput = True
    ImageFile.LOAD_TRUNCATED_IMAGES = True
    PAGE_HEIGHT = defaultPageSize[1]
    PAGE_WIDTH = defaultPageSize[0]

    #Registering Verdana Font
    reportlab.rl_config.warnOnMissingFontGlyphs = 0
    pdfmetrics.registerFont(TTFont('Vera', 'Vera.ttf'))
    pdfmetrics.registerFont(TTFont('VeraBd', 'VeraBd.ttf'))
    pdfmetrics.registerFont(TTFont('VeraIt', 'VeraIt.ttf'))
    pdfmetrics.registerFont(TTFont('VeraBI', 'VeraBI.ttf'))

    MAPHEADERTEXT = arcpy.GetParameterAsText(1).strip()

    if len(MAPHEADERTEXT) == 0:
        MAPHEADERTEXT = "Site Selector Report"
    PDFNAME = MAPHEADERTEXT + ".pdf"
    PDFREPORTNAME = os.path.join(arcpy.env.scratchFolder, PDFNAME) #pylint: disable=E110

    #Getting the logo URL
    arcpy.AddMessage("Printing logo...")

    LOGOURL = arcpy.GetParameterAsText(0).strip() #pylint: disable=E1103

    try:
        LOGOIMAGE = PILImage.open(StringIO(urllib.urlopen(LOGOURL).read()))
    except:
        LOGOBASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAJAAAACQCAYAAADnRuK4AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MDI3MUYwQzlGMTJGMTFFM0E4RTZERjA3MTlFQTA3NEMiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MDI3MUYwQ0FGMTJGMTFFM0E4RTZERjA3MTlFQTA3NEMiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDowMjcxRjBDN0YxMkYxMUUzQThFNkRGMDcxOUVBMDc0QyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDowMjcxRjBDOEYxMkYxMUUzQThFNkRGMDcxOUVBMDc0QyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PpwkvO8AAAfzSURBVHja7J1pjBRF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'#pylint: disable=C
        IMGFILE = StringIO(LOGOBASE64.decode('base64'))
        IMGFILE.seek(0)
        LOGOIMAGE = PILImage.open(IMGFILE)

    IMAGE = LOGOIMAGE
    DOC = SimpleDocTemplate(PDFREPORTNAME, topMargin=65, pagesize=A4)

    # Container of flowable objects
    ELEMENTSOFDOC = []

    # Putting the table
    arcpy.AddMessage("Formatting Table...")
    ATTRIBUTEDATA = arcpy.GetParameterAsText(3).strip() #pylint: disable=E1103
    TEMPDICT = {}
    TABLEKEYSINDEX = {}
    if len(ATTRIBUTEDATA) > 0:
        RECEIVEDDATA = json.loads(ATTRIBUTEDATA)[0]
        for key in RECEIVEDDATA.keys():
            TEMPDICT = {key : ATTRIBUTEDATA.find(key)}
            TABLEKEYSINDEX.update(TEMPDICT)
        SORTEDTABLESINDEX = sorted((value, key) for (key, value)
                                   in TABLEKEYSINDEX.items())

        TABLEHOLDER = create_print_table(RECEIVEDDATA)

        arcpy.AddMessage("Printing Table...")

        ELEMENTSOFDOC.append(TABLEHOLDER)
        ELEMENTSOFDOC.append(Spacer(1, 0.25*inch))

    # Drawing the webmap
    if len(arcpy.GetParameterAsText(2).strip()) > 0: #pylint: disable=E1103
        WEBMAPJSON = json.loads(arcpy.GetParameterAsText(2).strip())
        arcpy.AddMessage("Printing the Webmap...")

     #To override the outputsize and dpi and obtain the extent of the webmap
        if "exportOptions" in WEBMAPJSON.keys():
            LISTATT = WEBMAPJSON["exportOptions"]
            LISTATT['outputSize'] = [500, 365]
            LISTATT['dpi'] = DPI
        if "mapOptions" in WEBMAPJSON.keys():
            LISTEXTENTS = WEBMAPJSON["mapOptions"]
            XMAX = LISTEXTENTS['extent']['xmax']
            YMIN = LISTEXTENTS['extent']['ymin']

            WEBMAP_IMAGE, WEBMAP_WIDTH = export_web_map(WEBMAPJSON)
            WEBMAPDATA = [[WEBMAP_IMAGE]]

            MAP_T = Table(WEBMAPDATA,
                          style=[('BOX', (0, 0), (-1, -1), 0.5,
                                  Color(0, 0, 0, 1)),
                                 ('LEFTPADDING', (0, 0), (-1, -1), 0),
                                 ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                                 ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
                                 ('TOPPADDING', (0, 0), (-1, -1), 0)])
            ELEMENTSOFDOC.append(MAP_T)
            RF = calculate_scale(WEBMAP_WIDTH, YMIN, XMAX)

            STYLE_RF = getSampleStyleSheet()
            STYLE_RF.add(ParagraphStyle(name='RF', alignment=TA_RIGHT,
                                        fontName='Vera', fontSize=10,
                                        rightIndent=-1.15*cm, spaceAfter=0))
            arcpy.AddMessage("Printing scale...")
            ELEMENTSOFDOC.append(Paragraph('Scale 1:'+str(RF),
                                           STYLE_RF['RF']))
            ELEMENTSOFDOC.append(PageBreak())
            del WEBMAP_IMAGE

    #Drawing the attachment images
    arcpy.AddMessage("Printing attachment images...")
    if len(arcpy.GetParameterAsText(4)) != 0:
        ATTACHMENT_URL_LIST = arcpy.GetParameter(4)

        if len(ATTACHMENT_URL_LIST) != 0:
            STORY = []
            ATTACHMENT_URL_LIST = convert(ATTACHMENT_URL_LIST)
            ATTACHMENT_URL_LIST = ATTACHMENT_URL_LIST[1:-1].split(",")
            for item in ATTACHMENT_URL_LIST:
                is_image = check_if_image(item[1:-1])
                if is_image == 'true':
                    image_str = urllib.urlopen(item[1:-1]).read()
                    attachmentimage = Image(StringIO(image_str), mask='auto')
                    image_height = attachmentimage.imageHeight
                    image_width = attachmentimage.imageWidth
                    aspectratio = image_height/(float(image_width))
                    reduce_by = 0.1

                    while (667.88976378 <= image_height or
                           511.275590551 <= image_width):
                        image_width = image_width - reduce_by
                        image_height = image_width*aspectratio
                        reduce_by += 0.1
                    attachmentimage = Image(StringIO(image_str),
                                            width=image_width,
                                            height=image_height, mask='auto')
                    STORY.append(attachmentimage)

            ELEMENTSOFDOC += STORY
            ELEMENTSOFDOC.append(PageBreak())
    DOC.build(ELEMENTSOFDOC, onFirstPage=on_first_page,
              onLaterPages=on_later_pages, canvasmaker=NumberedCanvas)
    arcpy.SetParameter(5, PDFREPORTNAME)
    print PDFREPORTNAME
except Exception as exception:
    arcpy.AddError(str(exception))
    print exception

