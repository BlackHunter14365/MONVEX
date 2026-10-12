from pathlib import Path
from math import ceil
import shutil
from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.section import WD_SECTION
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.style import WD_STYLE_TYPE

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent
ASSETS = OUT / 'assets'
FIG = ASSETS / 'diagrams'
SHOTS = ASSETS / 'screenshots'
FIG.mkdir(parents=True, exist_ok=True)
SHOTS.mkdir(parents=True, exist_ok=True)

# The report uses a restrained academic palette and editable Word text/tables.
INK = '183044'
BLUE = '245B78'
TEAL = '168A8A'
PALE = 'EAF2F6'
LIGHT = 'F5F8FA'
GREY = '52616B'

def font_path(bold=False):
    candidates = [
        Path('C:/Windows/Fonts/arialbd.ttf' if bold else 'C:/Windows/Fonts/arial.ttf'),
        Path('C:/Windows/Fonts/segoeuib.ttf' if bold else 'C:/Windows/Fonts/segoeui.ttf'),
    ]
    return next((str(p) for p in candidates if p.exists()), None)

def draw_diagram(name, title, boxes, edges, size=(1500, 800), columns=None):
    """Draw editable-source-friendly conceptual diagrams as crisp PNG assets."""
    w, h = size
    im = Image.new('RGB', size, 'white')
    d = ImageDraw.Draw(im)
    titlefont = ImageFont.truetype(font_path(True), 32) if font_path(True) else ImageFont.load_default()
    bodyfont = ImageFont.truetype(font_path(), 23) if font_path() else ImageFont.load_default()
    smallfont = ImageFont.truetype(font_path(), 18) if font_path() else ImageFont.load_default()
    d.text((40, 24), title, fill='#183044', font=titlefont)
    coords = {}
    n = len(boxes)
    cols = columns or min(4, max(2, ceil(n / 3)))
    rows = ceil(n / cols)
    margin_x, top, gap_x, gap_y = 45, 110, 55, 42
    bw = (w - 2 * margin_x - gap_x * (cols - 1)) // cols
    bh = min(170, (h - top - 50 - gap_y * (rows - 1)) // rows)
    for i, (key, label, detail, color) in enumerate(boxes):
        row, col = divmod(i, cols)
        x = margin_x + col * (bw + gap_x)
        y = top + row * (bh + gap_y)
        coords[key] = (x, y, x + bw, y + bh)
    # Draw arrows first so node cards cover their ends.
    for source, target, label in edges:
        if source not in coords or target not in coords: continue
        a, b = coords[source], coords[target]
        sx, sy = (a[0] + a[2]) // 2, (a[1] + a[3]) // 2
        tx, ty = (b[0] + b[2]) // 2, (b[1] + b[3]) // 2
        if abs(tx - sx) >= abs(ty - sy):
            sx = a[2] if tx > sx else a[0]; tx = b[0] if tx > sx else b[2]
        else:
            sy = a[3] if ty > sy else a[1]; ty = b[1] if ty > sy else b[3]
        d.line((sx, sy, tx, ty), fill='#738592', width=4)
        ang = 0 if tx > sx else 3.14159 if tx < sx else 1.5708 if ty > sy else -1.5708
        import math
        p1=(tx-15*math.cos(ang-0.5),ty-15*math.sin(ang-0.5)); p2=(tx-15*math.cos(ang+0.5),ty-15*math.sin(ang+0.5))
        d.polygon([(tx,ty),p1,p2],fill='#738592')
        if label:
            mx,my=(sx+tx)//2,(sy+ty)//2
            bb=d.textbbox((0,0),label,font=smallfont); tw=bb[2]-bb[0]
            d.rounded_rectangle((mx-tw//2-5,my-14,mx+tw//2+5,my+14),radius=4,fill='white')
            d.text((mx-tw//2,my-11),label,fill='#52616B',font=smallfont)
    for key, label, detail, color in boxes:
        x1,y1,x2,y2=coords[key]
        d.rounded_rectangle((x1,y1,x2,y2),radius=18,fill=color,outline='#456276',width=3)
        lines = label.split('\n')
        yy = y1 + 18
        for line in lines:
            box=d.textbbox((0,0),line,font=bodyfont); d.text((x1+(x2-x1-(box[2]-box[0]))/2,yy),line,fill='#183044',font=bodyfont); yy+=29
        detail_lines = detail.split('\n')
        yy += 6
        for line in detail_lines[:3]:
            box=d.textbbox((0,0),line,font=smallfont); d.text((x1+(x2-x1-(box[2]-box[0]))/2,yy),line,fill='#394F5E',font=smallfont); yy+=23
    path=FIG/f'{name}.png'; im.save(path,dpi=(180,180)); return path

# Seven figures implement the six syllabus model types; the DFD has two levels.
draw_diagram('dfd_level0','Data Flow Diagram — Level 0 (Context)',[
 ('user','PERSONAL FINANCE USER','Credentials · entries · prompts','#E6F2F4'),('system','MONVEX','Ledger · analysis · reports','#E5EFF7'),('gemini','GOOGLE GEMINI API','Optional OCR and AI responses','#F4EDE4')],
 [('user','system',''),('system','gemini',''),('gemini','system','')],size=(1650,500),columns=3)
draw_diagram('dfd_level1','Data Flow Diagram — Level 1 (Core Processes)',[
 ('identity','1. Identity & access','Django auth · JWT · MFA','#E6F2F4'),('ingest','2. Ledger ingestion','Manual · NLP · receipt review','#E5EFF7'),('store','D1. Relational data','Users · transactions · budgets','#F5F1E9'),('budget','3. Budget & goals','Variance · contributions','#E6F2F4'),('analytics','4. Analytics','Health score · forecasts','#E5EFF7'),('ai','5. AI services','Scoped context · Gemini','#F2EBF7'),('reports','6. Reporting','CSV · PDF summaries','#E7F2EA'),('user','User interface','Next.js web client','#F4EDE4')],
 [('user','identity',''),('identity','store',''),('user','ingest',''),('ingest','store',''),('store','budget',''),('budget','analytics',''),('analytics','ai',''),('ai','reports',''),('reports','user','')],size=(1600,850),columns=4)
draw_diagram('erd','Entity–Relationship Diagram (Selected Core Entities)',[
 ('user','User\ninteger PK','Django auth user','#E6F2F4'),('profile','Profile\nUUID PK','one-to-one · user FK','#E5EFF7'),('tx','Transaction\nUUID PK','amount NUMERIC(12,2)','#E5EFF7'),('cat','Category\nUUID PK','system or user-owned','#F5F1E9'),('budget','Budget\nUUID PK','limit NUMERIC(12,2)','#E6F2F4'),('goal','Savings Goal\nUUID PK','target and balance','#E6F2F4'),('asset','Asset / Liability\nUUID PK','valuation / balance','#E7F2EA'),('receipt','Receipt\nUUID PK','staged OCR record','#F4EDE4'),('session','AI Session\nUUID PK','user-scoped turns','#F2EBF7')],
 [('user','profile','1:1'),('user','tx','1:M'),('user','budget','1:M'),('user','goal','1:M'),('user','asset','1:M'),('user','receipt','1:M'),('user','session','1:M'),('cat','tx','1:M'),('cat','budget','1:M'),('receipt','tx','0..1')],size=(1600,900),columns=3)
draw_diagram('class','Class Diagram (Selected Models and Services)',[
 ('user','User / Profile','identity and preferences','#E6F2F4'),('ledger','Transaction','Decimal amount · category FK','#E5EFF7'),('finance','FinanceService','dashboard · health score','#F5F1E9'),('forecast','ForecastService','cash-flow projection','#E6F2F4'),('ml','FinancialCategorizer','TF-IDF + Naive Bayes','#E5EFF7'),('ai','AICopilotService','scoped context · Gemini','#F2EBF7'),('ocr','OCRService','receipt extraction','#F4EDE4'),('validate','FileValidationService','magic-byte checks','#E7F2EA')],
 [('user','ledger',''),('finance','ledger',''),('forecast','ledger',''),('ml','ledger',''),('ai','finance',''),('ocr','validate','')],size=(1550,760),columns=4)
draw_diagram('use_cases','Use Case Model (Implemented and Configured Scope)',[
 ('visitor','Visitor','browse public pages · sign up','#E6F2F4'),('member','Authenticated user','ledger · budgets · goals','#E5EFF7'),('ai','Gemini service','optional external inference','#F2EBF7'),('auth','Account access','login · MFA · profile','#F5F1E9'),('finance','Financial workspace','track · analyze · forecast','#E6F2F4'),('receipt','Receipt review','upload · inspect · confirm','#F4EDE4'),('export','Exports','CSV · monthly PDF','#E7F2EA')],
 [('visitor','auth',''),('member','auth',''),('member','finance',''),('member','receipt',''),('receipt','ai',''),('member','ai',''),('member','export','')],size=(1500,760),columns=3)
draw_diagram('sequence','Sequence Diagram — Receipt to Reviewed Ledger Entry',[
 ('browser','Next.js browser','selects receipt image','#E6F2F4'),('api','Django API','authenticates · validates','#E5EFF7'),('file','File validator','checks allowed signatures','#E7F2EA'),('gemini','Gemini API','OCR response when configured','#F2EBF7'),('db','PostgreSQL','staged receipt · ledger link','#F5F1E9'),('user','User review','corrects · confirms or rejects','#F4EDE4')],
 [('browser','api',''),('api','file',''),('file','api',''),('api','gemini',''),('gemini','api',''),('api','db',''),('api','browser',''),('browser','user',''),('user','api',''),('api','db','')],size=(1600,800),columns=3)
draw_diagram('flowchart','System Flowchart — Transaction Entry and Review',[
 ('start','Start','user initiates entry','#E6F2F4'),('choice','Choose entry','manual · text · receipt','#E5EFF7'),('validate','Validate','amount · date · file','#F5F1E9'),('classify','Categorize','explicit category or ML hint','#E7F2EA'),('review','Receipt review?','confirm or reject staged data','#F4EDE4'),('save','Save transaction','user-scoped record','#E5EFF7'),('derive','Update views','budgets · score · reports','#F2EBF7'),('end','Complete','show updated ledger','#E6F2F4')],
 [('start','choice',''),('choice','validate',''),('validate','classify',''),('classify','review',''),('review','save',''),('save','derive',''),('derive','end','')],size=(1600,800),columns=4)

# Replace the three most notation-sensitive conceptual models with dedicated
# layouts: UML use-case ellipses, lifeline sequence messages, and flowchart
# decision diamonds. The PNGs remain reproducible from this source.
def custom_use_case():
    w,h=1500,850; im=Image.new('RGB',(w,h),'white'); d=ImageDraw.Draw(im)
    f=ImageFont.truetype(font_path(),22) if font_path() else ImageFont.load_default(); fb=ImageFont.truetype(font_path(True),30) if font_path(True) else ImageFont.load_default()
    d.text((35,24),'Use Case Diagram — Current MONVEX Scope',font=fb,fill='#183044')
    d.rounded_rectangle((310,100,1195,800),radius=18,outline='#456276',width=4,fill='#FAFCFD'); d.text((340,112),'MONVEX SYSTEM',font=fb,fill='#245B78')
    def actor(cx,cy,label):
        d.ellipse((cx-16,cy-65,cx+16,cy-33),outline='#183044',width=3); d.line((cx,cy-33,cx,cy+22),fill='#183044',width=3); d.line((cx-28,cy-8,cx+28,cy-8),fill='#183044',width=3); d.line((cx,cy+22,cx-23,cy+55),fill='#183044',width=3); d.line((cx,cy+22,cx+23,cy+55),fill='#183044',width=3); d.text((cx-50,cy+64),label,font=f,fill='#183044')
    actor(135,275,'Visitor'); actor(135,615,'User'); actor(1360,470,'Gemini API')
    cases=[(520,260,'Register / sign in'),(920,260,'Manage ledger'),(520,440,'Budgets and goals'),(920,440,'Review analytics'),(520,620,'Receipt OCR review'),(920,620,'AI copilot / what-if'),(720,740,'Export CSV / PDF')]
    for x,y,label in cases:
        d.ellipse((x-155,y-42,x+155,y+42),fill='#E6F2F4',outline='#456276',width=3); bb=d.textbbox((0,0),label,font=f); d.text((x-(bb[2]-bb[0])/2,y-12),label,font=f,fill='#183044')
    # Associations are thin and remain outside the labels.
    for yy,target in [(275,(365,260)),(615,(365,440)),(615,(365,620)),(615,(765,260)),(615,(765,440)),(615,(765,620)),(615,(565,740))]:
        d.line((165,yy,target[0],target[1]),fill='#738592',width=2)
    d.line((1195,620,1330,470),fill='#738592',width=2); d.line((1195,620,1330,470),fill='#738592',width=2)
    out=FIG/'use_cases.png'; im.save(out,dpi=(180,180)); return out

def custom_sequence():
    w,h=1600,900; im=Image.new('RGB',(w,h),'white'); d=ImageDraw.Draw(im)
    f=ImageFont.truetype(font_path(),20) if font_path() else ImageFont.load_default(); fb=ImageFont.truetype(font_path(True),30) if font_path(True) else ImageFont.load_default()
    d.text((35,24),'Sequence Diagram — Receipt Review and Ledger Confirmation',font=fb,fill='#183044')
    names=['Browser','Django API','File validator','Gemini API\n(optional)','PostgreSQL']; xs=[150,475,800,1125,1450]
    for x,name in zip(xs,names):
        d.rounded_rectangle((x-105,100,x+105,180),radius=12,fill='#EAF2F6',outline='#456276',width=3)
        for j,line in enumerate(name.split('\n')):
            bb=d.textbbox((0,0),line,font=f); d.text((x-(bb[2]-bb[0])/2,125+j*24),line,font=f,fill='#183044')
        for y in range(205,845,24): d.line((x,y,x,min(y+12,845)),fill='#80919B',width=2)
    messages=[(235,0,1,'1. Upload receipt image'),(310,1,2,'2. Validate file signature'),(385,2,1,'3. Return validation result'),(460,1,3,'4. Request OCR when configured'),(535,3,1,'5. Return candidate fields'),(610,1,4,'6. Save staged receipt'),(685,1,0,'7. Show review to user'),(760,0,1,'8. Confirm reviewed receipt'),(825,1,4,'9. Create linked transaction')]
    for y,a,b,label in messages:
        xa,xb=xs[a],xs[b]; right=xb>xa; x1=xa+(13 if right else -13); x2=xb+(-13 if right else 13); d.line((x1,y,x2,y),fill='#245B78',width=3)
        if right: d.polygon([(x2,y),(x2-13,y-8),(x2-13,y+8)],fill='#245B78')
        else: d.polygon([(x2,y),(x2+13,y-8),(x2+13,y+8)],fill='#245B78')
        bb=d.textbbox((0,0),label,font=f); tw=bb[2]-bb[0]; mx=(x1+x2)//2; d.rectangle((mx-tw//2-6,y-25,mx+tw//2+6,y-3),fill='white'); d.text((mx-tw//2,y-24),label,font=f,fill='#394F5E')
    out=FIG/'sequence.png'; im.save(out,dpi=(180,180)); return out

def custom_flowchart():
    w,h=1550,1120; im=Image.new('RGB',(w,h),'white'); d=ImageDraw.Draw(im)
    f=ImageFont.truetype(font_path(),20) if font_path() else ImageFont.load_default(); fb=ImageFont.truetype(font_path(True),30) if font_path(True) else ImageFont.load_default()
    d.text((35,24),'System Flowchart — Transaction Entry and Review',font=fb,fill='#183044')
    def text(s,cx,cy):
        for i,line in enumerate(s.split('\n')):
            bb=d.textbbox((0,0),line,font=f); d.text((cx-(bb[2]-bb[0])/2,cy-12+(i-(len(s.split('\n'))-1)/2)*24),line,font=f,fill='#183044')
    def rect(cx,cy,wid,hei,label,fill='#EAF2F6'):
        d.rounded_rectangle((cx-wid//2,cy-hei//2,cx+wid//2,cy+hei//2),radius=14,fill=fill,outline='#456276',width=3); text(label,cx,cy)
    def diamond(cx,cy,rx,ry,label):
        d.polygon([(cx,cy-ry),(cx+rx,cy),(cx,cy+ry),(cx-rx,cy)],fill='#F5F1E9',outline='#456276',width=3); text(label,cx,cy)
    def arrow(points,label=None):
        d.line(points,fill='#526C7B',width=4,joint='curve'); x,y=points[-1]; px,py=points[-2]; import math; a=math.atan2(y-py,x-px); d.polygon([(x,y),(x-15*math.cos(a-.5),y-15*math.sin(a-.5)),(x-15*math.cos(a+.5),y-15*math.sin(a+.5))],fill='#526C7B')
        if label: d.text(((points[0][0]+x)//2+4,(points[0][1]+y)//2-24),label,font=f,fill='#394F5E')
    # Start and entry choice, then parallel input options converge at validation.
    d.ellipse((600,75,950,145),fill='#E6F2F4',outline='#456276',width=3); text('Start: enter financial record',775,110)
    diamond(775,245,190,82,'Entry method?'); arrow([(775,145),(775,161)])
    rect(240,420,340,100,'Manual form\namount · date · category','#E6F2F4'); rect(775,420,390,100,'Natural language\nparse amount/date; suggest category','#E5EFF7'); rect(1310,420,340,100,'Receipt image\nvalidate signature; request OCR','#F2EBF7')
    arrow([(585,245),(240,245),(240,368)],'Manual'); arrow([(775,327),(775,368)],'Text'); arrow([(965,245),(1310,245),(1310,368)],'Receipt')
    rect(775,610,490,95,'Validate input and normalize fields','#F5F1E9'); arrow([(240,470),(240,560),(530,560),(530,610)]); arrow([(775,470),(775,562)]); arrow([(1310,470),(1310,560),(1020,560),(1020,610)])
    diamond(775,770,155,70,'Valid input?'); arrow([(775,657),(775,699)])
    rect(260,770,330,90,'Show error; correct input','#F7EAEA'); arrow([(620,770),(425,770)],'No')
    rect(775,930,500,90,'Categorize, then save transaction','#E7F2EA'); arrow([(775,840),(775,883)],'Yes')
    d.ellipse((610,1030,940,1090),fill='#E6F2F4',outline='#456276',width=3); text('Update budget and summaries',775,1060); arrow([(775,975),(775,1028)])
    out=FIG/'flowchart.png'; im.save(out,dpi=(180,180)); return out

def custom_dfd_level1():
    w,h=1650,850; im=Image.new('RGB',(w,h),'white'); d=ImageDraw.Draw(im)
    f=ImageFont.truetype(font_path(),21) if font_path() else ImageFont.load_default(); fb=ImageFont.truetype(font_path(True),30) if font_path(True) else ImageFont.load_default()
    d.text((35,24),'Data Flow Diagram — Level 1 (Core Processes)',font=fb,fill='#183044')
    xs=[205,615,1025,1435]; topy=205; boty=565; bw,bh=285,125
    nodes=[('User interface','Browser · inputs · review','#F4EDE4'),('1. Identity & access','Django auth · JWT · MFA','#E6F2F4'),('2. Ledger ingestion','Manual · NLP · receipt review','#E5EFF7'),('D1. Relational data','Users · transactions · budgets','#F5F1E9')]
    lower=[('6. Reporting','CSV · PDF summaries','#E7F2EA'),('5. AI services','Scoped context · Gemini','#F2EBF7'),('4. Analytics','Health score · forecasts','#E5EFF7'),('3. Budget & goals','Variance · contributions','#E6F2F4')]
    for row,y in [(nodes,topy),(lower,boty)]:
        for x,(label,detail,color) in zip(xs,row):
            d.rounded_rectangle((x-bw//2,y-bh//2,x+bw//2,y+bh//2),radius=18,fill=color,outline='#456276',width=3)
            if label.startswith('D1.'):
                d.line((x-bw//2+10,y-bh//2+8,x-bw//2+10,y+bh//2-8),fill='#456276',width=2); d.line((x+bw//2-10,y-bh//2+8,x+bw//2-10,y+bh//2-8),fill='#456276',width=2)
            bb=d.textbbox((0,0),label,font=f); d.text((x-(bb[2]-bb[0])/2,y-28),label,font=f,fill='#183044')
            bb=d.textbbox((0,0),detail,font=f); d.text((x-(bb[2]-bb[0])/2,y+10),detail,font=f,fill='#394F5E')
    def arrow(a,b):
        d.line((a,b),fill='#526C7B',width=4); import math; ang=math.atan2(b[1]-a[1],b[0]-a[0]); d.polygon([b,(b[0]-14*math.cos(ang-.5),b[1]-14*math.sin(ang-.5)),(b[0]-14*math.cos(ang+.5),b[1]-14*math.sin(ang+.5))],fill='#526C7B')
    # Primary flow traces the top row to storage, then returns along the
    # lower row through budget, analytics, AI, and reporting functions.
    for i in range(3): arrow((xs[i]+bw//2+5,topy),(xs[i+1]-bw//2-5,topy))
    arrow((xs[3],topy+bh//2+5),(xs[3],boty-bh//2-5))
    for i in range(3,0,-1): arrow((xs[i]-bw//2-5,boty),(xs[i-1]+bw//2+5,boty))
    arrow((xs[0],boty-bh//2-5),(xs[0],topy+bh//2+5))
    # External model is shown as an optional dependency of the AI service.
    d.rounded_rectangle((xs[1]-135,745,xs[1]+135,815),radius=14,fill='#FFF8EF',outline='#9A8061',width=3)
    bb=d.textbbox((0,0),'Google Gemini API',font=f); d.text((xs[1]-(bb[2]-bb[0])/2,770),'Google Gemini API',font=f,fill='#183044')
    arrow((xs[1],boty+bh//2+5),(xs[1],743)); d.text((xs[1]+15,694),'optional request / response',font=f,fill='#52616B')
    out=FIG/'dfd_level1.png'; im.save(out,dpi=(180,180)); return out

def custom_use_case_clean():
    w,h=1500,900; im=Image.new('RGB',(w,h),'white'); d=ImageDraw.Draw(im)
    f=ImageFont.truetype(font_path(),21) if font_path() else ImageFont.load_default(); fb=ImageFont.truetype(font_path(True),30) if font_path(True) else ImageFont.load_default()
    d.text((35,24),'Use Case Diagram — Current MONVEX Scope',font=fb,fill='#183044')
    d.rounded_rectangle((370,90,1135,830),radius=18,outline='#456276',width=4,fill='#FAFCFD'); d.text((400,105),'MONVEX SYSTEM',font=fb,fill='#245B78')
    def actor(cx,cy,label):
        d.ellipse((cx-16,cy-65,cx+16,cy-33),outline='#183044',width=3); d.line((cx,cy-33,cx,cy+22),fill='#183044',width=3); d.line((cx-28,cy-8,cx+28,cy-8),fill='#183044',width=3); d.line((cx,cy+22,cx-23,cy+55),fill='#183044',width=3); d.line((cx,cy+22,cx+23,cy+55),fill='#183044',width=3); bb=d.textbbox((0,0),label,font=f); d.text((cx-(bb[2]-bb[0])/2,cy+64),label,font=f,fill='#183044')
    actor(140,255,'Visitor'); actor(140,575,'User'); actor(1360,670,'Gemini API')
    cases=[(230,'Register / sign in'),(330,'Manage ledger'),(430,'Budgets and goals'),(530,'Review analytics'),(630,'Receipt OCR review'),(730,'AI copilot / what-if'),(810,'Export CSV / PDF')]
    for y,label in cases:
        d.ellipse((625,y-35,1015,y+35),fill='#E6F2F4',outline='#456276',width=3); bb=d.textbbox((0,0),label,font=f); d.text((820-(bb[2]-bb[0])/2,y-12),label,font=f,fill='#183044')
    def assoc(x1,y1,x2,y2): d.line((x1,y1,x2,y2),fill='#738592',width=2)
    assoc(168,255,623,230)
    for y,_ in cases[1:]: assoc(168,575,623,y)
    assoc(1017,630,1332,670); assoc(1017,730,1332,670)
    out=FIG/'use_cases.png'; im.save(out,dpi=(180,180)); return out

custom_dfd_level1(); custom_use_case_clean(); custom_sequence(); custom_flowchart()

# Copy only present, visually reviewed registered screenshots. Contact sheet review
# confirmed these show MONVEX layouts with empty/demo values and no visible secrets.
registered = [
 ('UI-01','Public landing page','audit_screenshots/verify_landing_desktop.png'),
 ('UI-02','Login','audit_screenshots/verify_login_desktop.png'),
 ('UI-03','Dashboard','audit_screenshots/dashboard_desktop.png'),
 ('UI-05','Transaction ledger','audit_screenshots/transactions_desktop.png'),
 ('UI-07','AI copilot workspace','audit_screenshots/ai_desktop.png'),
 ('UI-09','Budget overview','audit_screenshots/budgets_desktop.png'),
 ('UI-10','Savings goals','audit_screenshots/goals_desktop.png'),
 ('UI-15','Receipt review workspace','audit_screenshots/receipts_desktop.png'),
 ('UI-11','Analytics view','audit_screenshots/analytics_desktop.png'),
 ('UI-12','Cashflow forecast','audit_screenshots/forecast_desktop.png'),
 ('UI-13','Net worth view','audit_screenshots/net_worth_desktop.png'),
 ('UI-14','Debt planner','audit_screenshots/debt_desktop.png'),
 ('UI-17','Monthly report interface','audit_screenshots/reports_desktop.png'),
 ('UI-18','Security settings','audit_screenshots/security_desktop.png'),
 ('UI-04','Mobile dashboard','audit_screenshots/dashboard_mobile.png'),
 ('UI-06','Mobile transactions','audit_screenshots/transactions_mobile.png'),
 ('UI-08','Mobile copilot','audit_screenshots/ai_mobile.png'),
]
available=[]
for uid,label,rel in registered:
    src=ROOT/rel
    if src.exists():
        dst=SHOTS/f'{uid}_{src.name}'; shutil.copy2(src,dst); available.append((uid,label,dst))

doc=Document()
sec=doc.sections[0]
sec.top_margin=Inches(.78); sec.bottom_margin=Inches(.75); sec.left_margin=Inches(.88); sec.right_margin=Inches(.82)
sec.header_distance=Inches(.32); sec.footer_distance=Inches(.33)

styles=doc.styles
normal=styles['Normal']; normal.font.name='Times New Roman'; normal.font.size=Pt(12); normal.font.color.rgb=RGBColor.from_string('202A30')
normal._element.rPr.rFonts.set(qn('w:eastAsia'),'Times New Roman')
normal.paragraph_format.line_spacing=1.5; normal.paragraph_format.first_line_indent=Inches(.32); normal.paragraph_format.space_after=Pt(5)
for sty,size,col in [('Title',25,INK),('Subtitle',13,BLUE),('Heading 1',17,INK),('Heading 2',13,BLUE),('Heading 3',11.5,TEAL)]:
    s=styles[sty]; s.font.name='Times New Roman'; s.font.size=Pt(size); s.font.bold=sty.startswith('Heading') or sty=='Title'; s.font.color.rgb=RGBColor.from_string(col); s._element.rPr.rFonts.set(qn('w:eastAsia'),'Times New Roman')
    s.paragraph_format.keep_with_next=True
    if sty=='Heading 1': s.paragraph_format.space_before=Pt(5); s.paragraph_format.space_after=Pt(12)
    if sty in ('Heading 2','Heading 3'): s.paragraph_format.space_before=Pt(11); s.paragraph_format.space_after=Pt(5)
cap=styles['Caption']; cap.font.name='Times New Roman'; cap.font.size=Pt(10); cap.font.italic=True; cap.font.color.rgb=RGBColor.from_string(GREY); cap.paragraph_format.alignment=WD_ALIGN_PARAGRAPH.CENTER; cap.paragraph_format.first_line_indent=Inches(0); cap.paragraph_format.keep_with_next=True
if 'Code Block' not in styles:
    c=styles.add_style('Code Block',WD_STYLE_TYPE.PARAGRAPH)
else: c=styles['Code Block']
c.font.name='Consolas'; c.font.size=Pt(8.5); c.paragraph_format.left_indent=Inches(.18); c.paragraph_format.first_line_indent=Inches(0); c.paragraph_format.line_spacing=1.05; c.paragraph_format.space_after=Pt(3)

def shade(cell,fill):
    tcPr=cell._tc.get_or_add_tcPr(); shd=OxmlElement('w:shd'); shd.set(qn('w:fill'),fill); tcPr.append(shd)
def set_cell_text(cell,text,bold=False,color=None,size=8.5):
    cell.text=''; p=cell.paragraphs[0]; p.paragraph_format.first_line_indent=Inches(0); p.paragraph_format.space_after=Pt(1); p.paragraph_format.line_spacing=1.0
    r=p.add_run(str(text)); r.font.name='Times New Roman'; r.font.size=Pt(size); r.bold=bold
    if color: r.font.color.rgb=RGBColor.from_string(color)
    cell.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
def repeat_table_header(row):
    trPr=row._tr.get_or_add_trPr(); el=OxmlElement('w:tblHeader'); el.set(qn('w:val'),'true'); trPr.append(el)
def table(headers,rows,widths=None,fs=8.5):
    t=doc.add_table(rows=1,cols=len(headers)); t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.style='Table Grid'; t.autofit=False
    repeat_table_header(t.rows[0])
    for j,h in enumerate(headers):
        set_cell_text(t.rows[0].cells[j],h,True,'FFFFFF',fs); shade(t.rows[0].cells[j],BLUE)
    for i,row in enumerate(rows):
        cells=t.add_row().cells
        for j,v in enumerate(row):
            set_cell_text(cells[j],v,size=fs)
            if i%2==1: shade(cells[j],LIGHT)
        trPr=t.rows[-1]._tr.get_or_add_trPr(); trPr.append(OxmlElement('w:cantSplit'))
    if widths:
        for row in t.rows:
            for j,w in enumerate(widths): row.cells[j].width=Inches(w)
    doc.add_paragraph().paragraph_format.space_after=Pt(1)
    return t
def p(text='',boldlead=None,style=None,align=None):
    par=doc.add_paragraph(style=style)
    if align is not None: par.alignment=align
    if boldlead and text.startswith(boldlead): par.add_run(boldlead).bold=True; par.add_run(text[len(boldlead):])
    else: par.add_run(text)
    return par
def bullet(text,level=0):
    par=doc.add_paragraph(style='List Bullet' if level==0 else 'List Bullet 2'); par.paragraph_format.left_indent=Inches(.35+.2*level); par.paragraph_format.first_line_indent=Inches(-.18); par.paragraph_format.line_spacing=1.25; par.paragraph_format.space_after=Pt(3); par.add_run(text); return par
def heading(text,level=1): doc.add_heading(text,level=level)
def chapter(num,title):
    doc.add_page_break(); par=doc.add_paragraph(); par.alignment=WD_ALIGN_PARAGRAPH.CENTER; par.paragraph_format.first_line_indent=Inches(0); par.paragraph_format.space_before=Pt(110)
    r=par.add_run(f'CHAPTER {num}'); r.bold=True; r.font.name='Times New Roman'; r.font.size=Pt(15); r.font.color.rgb=RGBColor.from_string(TEAL)
    par=doc.add_paragraph(); par.alignment=WD_ALIGN_PARAGRAPH.CENTER; par.paragraph_format.first_line_indent=Inches(0); par.paragraph_format.space_after=Pt(40)
    r=par.add_run(title.upper()); r.bold=True; r.font.name='Times New Roman'; r.font.size=Pt(22); r.font.color.rgb=RGBColor.from_string(INK)
    doc.add_page_break(); doc.add_heading(f'{num}. {title.upper()}',level=1)
def caption(text):
    par=doc.add_paragraph(style='Caption')
    # Use real Word SEQ fields so the figure/table lists can be populated by
    # the Word TOC field codes below instead of being hard-coded text lists.
    if text.startswith('Figure ') or text.startswith('Table '):
        kind, rest = text.split(' ',1)
        _, description = rest.split(' — ',1)
        par.add_run(kind+' ')
        add_field(par,f'SEQ {kind} \\* ARABIC')
        par.add_run(' — '+description)
    else:
        par.add_run(text)
    return par
def figure(path,captext,width=6.5):
    par=doc.add_paragraph(); par.alignment=WD_ALIGN_PARAGRAPH.CENTER; par.paragraph_format.first_line_indent=Inches(0); par.paragraph_format.keep_with_next=True
    par.add_run().add_picture(str(path),width=Inches(width)); caption(captext)
def add_field(par,code):
    r=par.add_run(); begin=OxmlElement('w:fldChar'); begin.set(qn('w:fldCharType'),'begin')
    instr=OxmlElement('w:instrText'); instr.set(qn('xml:space'),'preserve'); instr.text=code
    sep=OxmlElement('w:fldChar'); sep.set(qn('w:fldCharType'),'separate'); txt=OxmlElement('w:t'); txt.text='Update field in Word if needed.'
    end=OxmlElement('w:fldChar'); end.set(qn('w:fldCharType'),'end')
    r._r.append(begin); r._r.append(instr); r._r.append(sep); r._r.append(txt); r._r.append(end)

# Header/footer and update-on-open settings
header=sec.header.paragraphs[0]; header.alignment=WD_ALIGN_PARAGRAPH.RIGHT; header.paragraph_format.first_line_indent=Inches(0)
r=header.add_run('MONVEX  |  B.Sc. COMPUTER SCIENCE — SEMESTER VI'); r.font.name='Times New Roman'; r.font.size=Pt(8); r.font.color.rgb=RGBColor.from_string(GREY)
footer=sec.footer.paragraphs[0]; footer.alignment=WD_ALIGN_PARAGRAPH.CENTER; footer.paragraph_format.first_line_indent=Inches(0)
footer.add_run('MONVEX Final Project Documentation  •  Page ').font.size=Pt(9); add_field(footer,'PAGE')
settings=doc.settings.element; upd=OxmlElement('w:updateFields'); upd.set(qn('w:val'),'true'); settings.append(upd)

# Cover
par=doc.add_paragraph(); par.alignment=WD_ALIGN_PARAGRAPH.CENTER; par.paragraph_format.first_line_indent=Inches(0); par.paragraph_format.space_before=Pt(52)
r=par.add_run('MONVEX'); r.bold=True; r.font.name='Times New Roman'; r.font.size=Pt(34); r.font.color.rgb=RGBColor.from_string(INK)
par=doc.add_paragraph(); par.alignment=WD_ALIGN_PARAGRAPH.CENTER; par.paragraph_format.first_line_indent=Inches(0)
r=par.add_run('AI-POWERED PERSONAL FINANCIAL\nINTELLIGENCE SYSTEM'); r.bold=True; r.font.size=Pt(18); r.font.color.rgb=RGBColor.from_string(BLUE)
par=doc.add_paragraph(); par.alignment=WD_ALIGN_PARAGRAPH.CENTER; par.paragraph_format.first_line_indent=Inches(0); par.paragraph_format.space_before=Pt(35)
par.add_run('A Project Report submitted in partial fulfilment of the requirements for the degree of').font.size=Pt(12)
for line in ['BACHELOR OF SCIENCE','(COMPUTER SCIENCE) — SEMESTER VI','[UNIVERSITY_NAME]','DEPARTMENT OF COMPUTER SCIENCE',"Chembur Trombay Education Society’s N.G. Acharya & D.K. Marathe College of Arts, Science & Commerce",'Shri N.G. Acharya Marg, Chembur, Mumbai – 71']:
    par=doc.add_paragraph(); par.alignment=WD_ALIGN_PARAGRAPH.CENTER; par.paragraph_format.first_line_indent=Inches(0); par.paragraph_format.space_after=Pt(5)
    rr=par.add_run(line); rr.bold=line.startswith('BACHELOR') or line.startswith('('); rr.font.size=Pt(12)
par=doc.add_paragraph(); par.alignment=WD_ALIGN_PARAGRAPH.CENTER; par.paragraph_format.first_line_indent=Inches(0); par.paragraph_format.space_before=Pt(18)
par.add_run('Submitted by\nANSARI DANISH ASLAM\nClass: TYCS A    Roll No.: 6\nStudent ID: 5072732\nSeat No.: [STUDENT_SEAT_NUMBER]    PRN: [STUDENT_PRN_NUMBER]\n\nUnder the guidance of\nProf. [GUIDE_FULL_NAME] — [GUIDE_DESIGNATION]\n\nACADEMIC YEAR: 2026–2027').font.size=Pt(11)
doc.add_page_break()

# Proforma
heading('PROFORMA FOR THE APPROVAL OF PROJECT PROPOSAL',1)
table(['Particular','Details'],[
 ('Student name','ANSARI DANISH ASLAM'),('Class / division','TYCS A'),('College roll number','6'),('Student ID','5072732'),('University seat number','[STUDENT_SEAT_NUMBER]'),('PRN / PNR','[STUDENT_PRN_NUMBER]'),('Academic year','2026–2027'),('Project title','MONVEX: AI-Powered Personal Financial Intelligence System'),('Project area','Web engineering, financial data processing, machine learning and generative AI'),('Project guide','Prof. [GUIDE_FULL_NAME]'),('Guide designation / qualification','[GUIDE_DESIGNATION] / [GUIDE_QUALIFICATIONS]'),('Teaching experience','[GUIDE_YEARS_EXPERIENCE] years'),('Decision','[APPROVED / NOT APPROVED — TO BE COMPLETED BY THE INSTITUTION]'),('Approval date','[APPROVAL_DATE]')],[2.1,4.7])
p('Guide signature: ______________________________       Student signature: ______________________________')
p('This proforma is supplied for completion by the college. No approval, signature, stamp, or examination result is asserted in this report.')
doc.add_page_break(); heading('CERTIFICATE',1)
p('This is to certify that the project entitled “MONVEX: AI-Powered Personal Financial Intelligence System” is the work of ANSARI DANISH ASLAM (Class TYCS A, College Roll No. 6, Student ID 5072732; University Seat No. [STUDENT_SEAT_NUMBER], PRN [STUDENT_PRN_NUMBER]) and is submitted in partial fulfilment of the requirements for the degree of Bachelor of Science in Computer Science, Semester VI, at Chembur Trombay Education Society’s N.G. Acharya & D.K. Marathe College of Arts, Science & Commerce, during academic year 2026–2027. The university affiliation and certificate are subject to institutional verification and approval.')
p('\nInternal Guide: ____________________             Head of Department: ____________________')
p('Prof. [GUIDE_FULL_NAME]                                  Prof. [HOD_FULL_NAME]')
p('\nExternal Examiner: __________________             Principal: ______________________________')
p('[EXTERNAL_EXAMINER_NAME]                         Dr. [PRINCIPAL_FULL_NAME]')
p('\nDate: [CERTIFICATION_DATE]     College seal: [TO BE AFFIXED BY THE INSTITUTION]')
doc.add_page_break(); heading('DECLARATION',1)
p('I, ANSARI DANISH ASLAM (Class TYCS A, College Roll No. 6, Student ID 5072732), declare that this report describes the MONVEX project work undertaken for the B.Sc. Computer Science Semester VI programme at Chembur Trombay Education Society’s N.G. Acharya & D.K. Marathe College of Arts, Science & Commerce, under the guidance of Prof. [GUIDE_FULL_NAME]. The implementation claims in this report are limited to the active repository and the evidence identified in the report. External sources are acknowledged in Chapter 8. This declaration must be reviewed and signed by the student before submission.')
p('\nPlace: Shri N.G. Acharya Marg, Chembur, Mumbai – 71     Date: [SUBMISSION_DATE]')
p('\nStudent signature: ______________________________     ANSARI DANISH ASLAM')
doc.add_page_break(); heading('ACKNOWLEDGEMENT',1)
p('I express my gratitude to Chembur Trombay Education Society’s N.G. Acharya & D.K. Marathe College of Arts, Science & Commerce, the Department of Computer Science, and my project guide, Prof. [GUIDE_FULL_NAME], for the academic support and feedback provided during this project. I also acknowledge the maintainers of the frameworks, libraries, standards, and technical documentation cited in this report. Guide acknowledgement details remain subject to confirmation.')
doc.add_page_break(); heading('ABSTRACT',1)
p('MONVEX is a personal finance application that combines transaction recording with budgeting, savings goals, portfolio summaries, forecasting, receipt processing, and AI-assisted explanation. The active repository contains a Next.js and React web client, a Django REST API, a relational data model, and a Tauri-based Windows desktop wrapper. The backend can use PostgreSQL through DATABASE_URL and has a SQLite development fallback; the Render and Neon deployment settings are configuration evidence, not proof of a currently running cloud service.')
p('Users can record income, expenses, and transfers manually or through natural-language parsing. An optional TF-IDF and Multinomial Naive Bayes pipeline suggests a transaction category. Uploaded receipts pass file-signature checks and can be processed through a configured Gemini model; extracted values are staged for user review before being linked to a ledger record. Budget and goal views summarize progress, while financial-health and cash-flow calculations provide rule-based estimates. A conversational assistant can use scoped financial context and an external generative model when credentials and provider access are configured. The system does not connect to bank accounts through Open Banking providers.')
p('The reviewed source demonstrates a multi-user web application with per-user query scoping, JWT authentication, optional TOTP multi-factor authentication, fixed-point decimal model fields, API throttling, and upload validation. Several dossier-reported checks and screenshot audit results are available, but their full original execution logs were not present for independent reproduction during this report build. The report therefore distinguishes repository verification from test results reported by Phase 1. Student and college details visible on the supplied identity card have been entered; university, seat/PRN, guide, approval, and signature details remain for institutional completion.')
doc.add_page_break(); heading('TABLE OF CONTENTS',1)
par=doc.add_paragraph(); par.paragraph_format.first_line_indent=Inches(0); add_field(par,'TOC \\o "1-3" \\h \\z \\u')
doc.add_page_break(); heading('LIST OF FIGURES',1)
par=doc.add_paragraph(); par.paragraph_format.first_line_indent=Inches(0); add_field(par,'TOC \\h \\z \\c "Figure"')
doc.add_page_break(); heading('LIST OF TABLES',1)
par=doc.add_paragraph(); par.paragraph_format.first_line_indent=Inches(0); add_field(par,'TOC \\h \\z \\c "Table"')
doc.add_page_break(); heading('ABBREVIATIONS',1)
table(['Term','Meaning'],[
 ('AI','Artificial Intelligence'),('API','Application Programming Interface'),('CSRF','Cross-Site Request Forgery'),('DFD','Data Flow Diagram'),('DRF','Django REST Framework'),('E2E','End-to-End'),('ERD','Entity–Relationship Diagram'),('JWT','JSON Web Token'),('MFA','Multi-Factor Authentication'),('ML','Machine Learning'),('NLP','Natural Language Processing'),('OCR','Optical Character Recognition'),('ORM','Object-Relational Mapper'),('PK / FK','Primary Key / Foreign Key'),('TOTP','Time-Based One-Time Password')],[1.2,5.6])

# Chapters 1–3
chapter(1,'Introduction')
heading('1.1 Background',2)
p('Personal financial information is often scattered among bank statements, receipts, budget sheets, and separate investment or debt records. Manual review makes it difficult to form a consistent picture of cash flow and spending patterns. MONVEX addresses this organizational problem by providing a single interface for a user-entered financial ledger and derived summaries. Its design combines familiar record keeping with optional automation: text parsing, category suggestions, receipt extraction, and conversational summaries.')
p('MONVEX should be understood as a personal tracking and decision-support system. It does not act as a bank, hold customer funds, or retrieve live bank transactions. The quality of its summaries depends on the completeness and accuracy of records entered or reviewed by the user. Its projections and AI outputs are informational and do not replace professional financial or tax advice.')
heading('1.2 Objectives',2)
for x in ['Provide authenticated users with a ledger for income, expenses, and transfers.','Organize transactions into categories and support search, filters, and export.','Help users set category budgets and savings goals and review progress.','Summarize assets and liabilities and calculate net worth from user-maintained values.','Offer rule-based financial indicators, cash-flow projections, and debt payoff comparisons.','Reduce repetitive entry through natural-language parsing, ML category suggestions, and reviewable receipt OCR.','Provide privacy-conscious multi-user access controls and make the limits of external AI and deployment explicit.']: bullet(x)
heading('1.3 Purpose, Scope and Applicability',2)
heading('1.3.1 Purpose',3); p('The purpose is to demonstrate an integrated software system that accepts personal finance data, validates and stores it, and presents understandable summaries. The academic focus is the interaction between frontend state, authenticated APIs, relational data, deterministic calculations, and selected ML/AI integrations.')
heading('1.3.2 Scope',3); p('The active scope includes the responsive web application, Django API, database models, and a Tauri Windows shell. Function groups cover identity, transaction management, budgets, goals, net worth, debt planning, forecasts, analytics, receipt review, reports, notifications, search, and AI assistance. A Flutter app is described in accessible Git history but is absent from the current checkout and is not part of the active runnable release documented here. Open Banking synchronization is future scope. Render/Neon files describe a deployment target; no live deployment was independently confirmed.')
heading('1.3.3 Applicability',3); p('The system is intended for individuals who want to maintain a private personal ledger and review their own manually supplied financial information. It can support students learning about full-stack architecture, API design, data modelling, and applied analytics. It is not a regulated financial institution, certified accounting system, or substitute for professional advice.')
heading('1.4 Achievement',2)
p('Source inspection confirms the core application structure and major feature flows. The repository includes a Next.js App Router frontend, Django apps and services, fixed-point monetary fields, a category-classification pipeline, receipt validation and OCR services, a financial assistant integration, export functionality, and a Windows desktop wrapper. Test and responsive audit outcomes are reported in the dossier and in an audit-results JSON file, but those outcomes are not equivalent to a fresh run of each backend and browser suite for this report.')
heading('1.5 Organization of Reports',2)
p('Chapter 1 introduces the problem and scope. Chapter 2 surveys the technologies. Chapter 3 specifies requirements, constraints, and conceptual models. Chapter 4 describes architecture, modules, data design, and verified UI captures. Chapter 5 discusses implementation and testing methods. Chapter 6 preserves the prescribed template title “SYSTEM DESIGN” and contains the test reports under section 6.1. Chapter 7 concludes with significance, limitations, and future scope using the supplied hierarchy. Chapter 8 lists the technical references.')

chapter(2,'Survey of Technologies')
p('MONVEX uses a layered web architecture. The browser client handles navigation, forms, state, and visualizations; the backend validates requests and applies domain rules; database models preserve records; and selected external services provide identity or generative inference. The version information below is stated at the precision supported by repository manifests and lockfiles.')
table(['Technology','Evidence-supported version / status','Role in MONVEX'],[
 ('Next.js / React','Next.js 14.2.35; React 18.3.1 in package lock','App Router web interface, server rendering/build, reusable views.'),
 ('TypeScript','Manifest range 5.5; lockfile exact version 5.9.3','Typed component and API contracts.'),
 ('Tailwind CSS','Manifest range 3.4; lockfile 3.4.19','Utility styling and responsive visual system.'),
 ('TanStack Query','Manifest range 5.51; lockfile 5.102.2','Asynchronous server data cache and query lifecycle.'),
 ('Django / DRF','requirements allow Django >=5,<6; DRF >=3.15','ORM, request routing, serializers, permissions, API responses.'),
 ('Database','PostgreSQL URL path configured; SQLite fallback in settings','Relational persistence; active production engine not confirmed.'),
 ('Scikit-learn / NumPy','Requirements ranges, no Python lockfile','TF-IDF feature extraction and Naive Bayes category suggestions.'),
 ('Google Gemini','Model defaults to gemini-2.0-flash; API key configuration required','Optional conversational responses and receipt extraction.'),
 ('Tauri / Rust','Tauri 1.x configured in Cargo manifest','Windows desktop wrapper around the web client.'),
 ('ReportLab','Dependency present in requirements','Backend PDF statement generation.'),
 ('Playwright','@playwright/test declared in web package','Browser navigation and responsive audit scripts.'),
 ('Render / Neon','Blueprint and environment configuration present','Intended cloud deployment configuration; runtime not verified.')],[1.25,2.1,3.45],fs=8)
caption('Table 2.1 — MONVEX technology roles and version evidence')
heading('2.1 Frontend: Next.js, React and TypeScript',2)
p('Next.js provides the web application framework and App Router structure, while React components compose pages and shared layouts. This organization supports route-specific screens alongside shared navigation, authentication, and theme state. TypeScript describes data structures passed between components and API clients, reducing mismatches that can be caught during compilation. The lockfile resolves newer compatible patch and minor versions than the original dossier’s figures; this report uses the checked-in lockfile where it records an exact frontend version and avoids presenting manifest ranges as exact versions [1–3].')
p('The trade-off is operational complexity compared with a static multipage site: a Node runtime and build pipeline are needed for the configured standalone application, and server data remains dependent on API availability. No performance benchmark is claimed here.')
heading('2.2 Styling, UI state and data fetching',2)
p('Tailwind CSS supplies utility classes and responsive styling conventions. TanStack Query manages server-state requests, caching, and invalidation; React contexts manage application-wide concerns such as authentication, theme, and navigation state. The project also declares Zustand for selected client state. These tools separate remote API state from transient presentation state, but correct cache invalidation and clear empty/error states remain important responsibilities of the application [4–6].')
heading('2.3 Backend: Django and Django REST Framework',2)
p('Django provides routing, model definitions, migrations, settings, and authentication primitives. Django REST Framework adds API views, serializers, authentication/permission checks, pagination, and throttling. The dependency file specifies version ranges rather than a resolved Python lockfile; therefore the report identifies the Django 5.x family and the DRF minimum range instead of repeating unverified patch versions [7–9].')
p('The backend separates endpoint orchestration from services for finance calculations, forecasting, OCR, parsing, validation, and PDF creation. This supports reuse, although modules still require integration tests to confirm interactions under real database and provider conditions.')
heading('2.4 PostgreSQL and relational persistence',2)
p('The data model is relational: users own transactions and financial records, categories classify transactions, and related objects are joined through foreign keys. PostgreSQL is supported through DATABASE_URL and a Neon-oriented Render blueprint; local settings also include a SQLite fallback. As no live database connection or deployed service was inspected, PostgreSQL 16 is treated as a configuration target rather than a verified active engine. Relational constraints and indexes support data integrity and common user/date queries [10–11].')
heading('2.5 Machine learning and numerical libraries',2)
p('The categorizer combines TF-IDF text features with a Multinomial Naive Bayes classifier. It uses merchant names and descriptions to suggest a category and confidence value when a category is absent. The output is a suggestion derived from the project’s training examples, not a universal or independently benchmarked classification accuracy claim. Scikit-learn supplies the vectorizer/classifier pipeline; NumPy supports numerical operations in the ecosystem. No accuracy percentage is asserted [14–15].')
heading('2.6 Generative AI and image processing',2)
p('The Gemini client reads configuration for a model defaulting to gemini-2.0-flash and requires an API key for external calls. Receipt OCR validates the uploaded content type/signature, requests structured extraction, and stages the resulting values for user review. The copilot can build a limited financial context from application data and then request a generated response. External availability, current provider model access, latency, and output accuracy were not measured; users should review generated results and avoid treating them as professional advice [13].')
heading('2.7 Desktop, report generation and test tools',2)
p('Tauri wraps the web interface for Windows using a Rust native shell and WebView2. Cargo configuration proves a Tauri 1.x dependency, but runtime behavior is not independently certified in this report. ReportLab is used by backend services to create monthly PDF statements. Playwright scripts and audit artifacts support browser navigation and viewport checks. Each tool has a limited role: an installed/configured library does not by itself prove a successful deployment or test execution [16–17].')
heading('2.8 Security standards and relevant references',2)
p('JWT and TOTP implementations are related to published IETF standards. The system also contains web security controls that align with common application security guidance, such as scoped data access, request throttling, secure cookie settings, and content validation. These controls reduce specific risks but do not establish an absolute security guarantee [18–20].')

chapter(3,'Requirements and Analysis')
heading('3.1 Problem Definition',2)
p('A person tracking finances across receipts, statements, and separate worksheets must repeatedly enter and reconcile information. This can make monthly spending patterns, budget variance, and estimated net worth harder to review. The proposed system provides one authenticated workspace in which users enter or import selected information, classify transactions, and inspect computed summaries.')
p('The design intentionally does not solve automatic bank aggregation. Users provide information through manual entry, natural-language parsing, receipt upload, or supported import flows. All calculations depend on the records and assumptions available in the application.')
heading('3.2 Requirement Specification',2)
table(['ID','Functional requirement','Acceptance intent / evidence status'],[
 ('FR-01','Register and authenticate a user','Create identity and profile; reject invalid credentials. Source and dossier-reported test evidence.'),('FR-02','Protect user-specific records','Scope reads/writes to authenticated user; cross-user test is dossier-reported.'),('FR-03','Record and maintain ledger entries','Create, retrieve, edit, delete and filter income/expense/transfer records.'),('FR-04','Categorize transactions','Accept explicit category or use optional ML suggestion; user can review.'),('FR-05','Parse short natural-language entries','Extract supported amount/date/text fields; incomplete parses require correction.'),('FR-06','Manage budgets and savings goals','Calculate budget consumption and record goal contributions.'),('FR-07','Review assets, liabilities and net worth','Summarize user-maintained balances; values are not bank-verified.'),('FR-08','Provide financial summaries','Expose dashboard, health-score and forecast calculations with their assumptions.'),('FR-09','Process receipt images','Check file signature, request optional OCR, stage results for confirmation.'),('FR-10','Offer AI assistance','Use scoped context and configured provider; handle missing provider/configuration.'),('FR-11','Export financial reports','Provide CSV and monthly PDF outputs for selected user data.'),('FR-12','Support desktop access','Wrap the web client using the configured Tauri Windows shell.')],[.55,2.15,4.1],fs=8)
caption('Table 3.1 — Functional requirements derived from the dossier and active source')
heading('3.2.1 Non-functional requirements',3)
table(['Quality area','Requirement / design evidence','Limitation'],[
 ('Privacy','User-specific foreign keys and request-user queryset scoping.','Must be verified for each endpoint; identifiers alone are not authorization.'),('Financial integrity','Decimal fields for monetary values and model/database constraints.','Input validation and domain rules must also be checked.'),('Security','JWT lifecycle, optional TOTP, throttling, file-signature checks, origin settings.','MFA secret field is plain CharField in active model; storage encryption not evidenced.'),('Usability','Responsive Next.js views, clear empty/loading states and exports.','Registered screenshot audit has missing paths; captures show empty/demo states.'),('Maintainability','Separate frontend, API, domain services, models, and tests.','No quantitative maintainability or runtime benchmark measured.'),('Availability','Health/readiness endpoints and deployment blueprint.','No live cloud availability or uptime verified.'),('Interoperability','JSON APIs, CSV and PDF output.','No live Open Banking connector in active source.')],[1.0,3.05,2.75],fs=8)
caption('Table 3.2 — Non-functional requirements and evidence limits')
heading('3.3 Planning and Scheduling',2)
p('No authoritative dated project plan was independently established. The dossier’s Gantt fragment marks several activities complete while using dates extending beyond the dossier’s stated inspection date. To avoid misrepresenting project history, Table 3.3 is a proposed planning illustration only; it is not a record of actual completion dates.')
table(['Illustrative phase','Indicative duration','Key work products','Status'],[
 ('1. Requirements and evidence review','Week 1','Scope, user needs, acceptance criteria','Planning illustration'),('2. Architecture and data design','Weeks 2–3','Component boundaries, ERD, API design','Planning illustration'),('3. Core application development','Weeks 4–7','Identity, ledger, budgets, goals, dashboard','Planning illustration'),('4. Analytics and integrations','Weeks 8–9','Forecasting, ML suggestions, OCR/AI paths','Planning illustration'),('5. Desktop and interface refinement','Week 10','Tauri shell, responsive states','Planning illustration'),('6. Verification and documentation','Weeks 11–12','Tests, screenshots, final report and review','Planning illustration')],[1.55,1.15,2.8,1.3],fs=8)
caption('Table 3.3 — Proposed project schedule; illustrative relative weeks, not actual dates')
heading('3.4 Hardware and Software Requirements',2)
table(['Category','Requirement / target','Evidence qualification'],[
 ('Client device','Desktop/laptop or modern smartphone with a current browser.','Responsive captures recorded at 1440×900 and 390×844 in the dossier.'),('Development runtime','Node.js for Next.js; Python for Django; Rust toolchain for Tauri builds.','Package and build configuration present; no single mandatory machine specification found.'),('Database','PostgreSQL connection for deployed configuration; SQLite fallback in Django settings.','Configuration only; live service not confirmed.'),('Network','Connectivity to API and optional Google identity/AI providers.','Required for remote API/provider use; offline provider behavior not established.'),('Build and test tools','npm, Django test tooling, Playwright, and optional WebView2 tooling.','Declared scripts and evidence artifacts; fresh full suite not run during this report build.')],[1.2,2.65,2.95],fs=8)
caption('Table 3.4 — Hardware and software requirements')
heading('3.5 Preliminary Product Description',2)
p('MONVEX is a client/server personal finance application. A user signs in through the web client, submits a validated API request, and receives a response derived from user-scoped records. Transaction ingestion can be direct or assisted. In the receipt flow, validation occurs before OCR, the candidate record remains reviewable, and only confirmation creates the associated ledger transaction. Budget, goal, analytics, and portfolio screens read their own records or derived aggregates. CSV/PDF outputs provide portable views of selected data.')
p('Feature boundaries are material: Open Banking sync is planned, external AI requires valid credentials and network access, and the historical Flutter code is not present in the current checkout. Render/Neon configuration is not the same as an active production deployment.')
heading('3.6 Conceptual Models',2)
p('The following models are explanatory views of the current web/API design. They show selected entities and flows rather than every endpoint, table, or runtime state. Figure 3.1 and 3.2 split the required DFD into context and functional decomposition levels.')
heading('3.6.1 Data Flow Diagram',3)
figure(FIG/'dfd_level0.png','Figure 3.1 — Data Flow Diagram, Level 0 (context boundary)',6.5)
figure(FIG/'dfd_level1.png','Figure 3.2 — Data Flow Diagram, Level 1 (selected processes)',6.5)
heading('3.6.2 Entity–Relationship Diagram',3)
figure(FIG/'erd.png','Figure 3.3 — ERD of selected core entities; User uses an integer PK while most domain records use UUIDs',6.5)
heading('3.6.3 Class Diagram',3)
figure(FIG/'class.png','Figure 3.4 — Class and service relationships (selected implementation)',6.5)
heading('3.6.4 Use Case Diagram',3)
figure(FIG/'use_cases.png','Figure 3.5 — Use case view of current web/API scope',6.5)
heading('3.6.5 Sequence Diagram',3)
figure(FIG/'sequence.png','Figure 3.6 — Sequence of staged receipt extraction and user confirmation',6.5)
heading('3.6.6 System Flowchart',3)
figure(FIG/'flowchart.png','Figure 3.7 — Flowchart for transaction entry and review',6.5)

# Chapter 4
chapter(4,'System Design')
heading('4.1 Basic Modules in Detail',2)
heading('4.1.1 Web client and navigation',3)
p('The Next.js App Router organizes public and protected route pages, shared shell components, and route-level financial workspaces. The app shell holds navigation and global states such as theme and authentication. Page components call typed API modules and query hooks. Loading, empty, and error states matter because an API response may be delayed, unavailable, or contain no records. The inspected captures mostly show empty account states with zero summaries; they are genuine UI views but do not prove provider-backed account data.')
heading('4.1.2 Authentication and profile',3)
p('Registration and login views send credentials to Django endpoints. The backend uses Django’s user model and a one-to-one Profile extension. JWT access/refresh handling is configured with refresh-cookie behavior and token rotation settings; TOTP setup and verification endpoints exist. Google identity support validates ID tokens through a service. These are code-level controls; actual provider configuration and live email delivery are environment-dependent. The active Profile model stores mfa_secret as a normal character field, and no encryption wrapper was found in the inspected model/view path, so this report does not claim encrypted-at-rest TOTP secrets.')
heading('4.1.3 Transaction ledger and ingestion',3)
p('The ledger supports income, expense, and transfer types and stores a positive Decimal amount, date, optional category and merchant, source, confidence, and text. The code uses a single transaction record per entry; it is not a general double-entry accounting ledger with balancing journal lines. A service normalizes known merchant spellings and may ask the classifier for a category when none is supplied. The user can add, filter, edit, delete, and export entries through authenticated API routes.')
heading('4.1.4 Budgets and savings goals',3)
p('Budget records connect a user, category, limit, and period. The unique user/category/period constraint prevents duplicate budget rows for that combination. Budget views compare recorded spending with a limit and present consumed/remaining amounts. Goal records track a target, current amount, optional deadline, and status; contributions are logged as related rows. Calculated progress is only as accurate as the supplied transaction and contribution data.')
heading('4.1.5 Portfolio, debt and forecast',3)
p('Asset and Liability records store user-entered values and debt parameters. Net worth is derived from asset totals less liability balances; the system does not independently verify market prices or account balances. Debt planning compares avalanche and snowball ordering using stored interest and payment assumptions. The forecast service projects cash flow from historical spending and recurring commitments; it is a simplified estimate rather than a bank-grade forecast or guaranteed prediction.')
heading('4.1.6 Analytics and AI',3)
p('Analytics endpoints aggregate transaction history and profile values into dashboard metrics and a 0–100 health score. This is an application-defined index, not a clinical or regulated rating. The copilot assembles scoped context and may call Gemini; a deterministic fallback is present in source. AI messages can be stored in conversation models. Prompt boundaries and disclaimers reduce misuse risk but cannot guarantee factual correctness, confidentiality outside the application boundary, or suitability of advice.')
heading('4.1.7 Receipt processing and reporting',3)
p('Receipt uploads are checked for allowed file signatures, parsed by a configured OCR service, and stored as reviewable Receipt objects. A user may reject the staged item or confirm it, which links it to a transaction. The service also exposes secure image retrieval. Monthly PDF generation is implemented with ReportLab; CSV export uses a data stream. Provider access, successful OCR for arbitrary images, and deployment storage persistence are not established merely by service code.')
heading('4.1.8 Desktop wrapper and external services',3)
p('The Tauri configuration and Rust source wrap the web experience as a Windows desktop application. It remains a web-backed client and does not create a distinct financial data store. Google Gemini, Google OAuth, and SMTP are optional integrations controlled by environment configuration. Open Banking providers such as Plaid or Yodlee are not implemented.')
heading('4.1.9 System architecture',3)
figure(FIG/'dfd_level1.png','Figure 4.1 — MONVEX logical architecture and data movement across modules',6.5)
p('The browser communicates with versioned JSON endpoints under the API route tree. Django views apply authentication, permissions, serializer validation, and domain-service calls. The ORM maps domain records to the selected relational database. External provider calls are isolated in service clients and depend on runtime configuration. Health and readiness endpoints support deployment monitoring but do not establish live availability.')
heading('4.1.10 API groups and integrations',3)
table(['API group','Representative operations','Access / integration boundary'],[
 ('Authentication','Register, login, logout, refresh, profile, MFA, Google identity','Registration/login are public; profile and MFA management require an authenticated session.'),
 ('Transactions','Ledger CRUD, categories, recurring records, natural-language parse, duplicates','Financial records are user-scoped; external bank sync is not present.'),
 ('Budgets and goals','Create/list limits; budget overview; goal contributions','Authenticated data endpoints; validations apply to monetary inputs and ownership.'),
 ('Analytics and portfolio','Dashboard, health score, forecast, assets, liabilities, net worth, debt planning','Authenticated summaries derived from stored records and user-maintained balances.'),
 ('Receipts and AI','Receipt upload/review/confirm; copilot chat; what-if; insights','Gemini calls require provider configuration; receipt extraction is staged for user review.'),
 ('Reports and utility','CSV export, monthly JSON/PDF report, search, notifications, health probes','Report/search endpoints use account context where financial data is returned; probes are operational endpoints.')],[1.2,2.7,2.8],fs=7.7)
caption('Table 4.2 — API groups and their integration boundaries; endpoint examples follow active URL routing')
heading('4.2 Data Design',2)
p('The project uses Django’s default auth.User as the identity root. Its primary key is integer-valued. Profile and most domain entities define UUID primary keys. Foreign keys use the target key type, so `user_id` is an integer while category, transaction, and other domain keys are commonly UUIDs. This is a mixed-key design; the dossier’s generalization that every model uses UUIDs is incorrect.')
table(['Entity','Primary key','Selected fields and relationships','Purpose'],[
 ('auth.User','Integer','username, email, password hash; one-to-one Profile','Identity and credential root.'),('Profile','UUID','user FK unique; currency, monthly_income, settings, mfa_secret','User preferences and finance baseline.'),('Category','UUID','nullable user FK; name/type; system-default flag','Income/expense classification.'),('Transaction','UUID','user FK integer; optional category/merchant UUID FKs; amount NUMERIC(12,2)','Single-entry cash-flow record.'),('Budget','UUID','user FK; category FK; limit NUMERIC(12,2); period; unique combination','Category spending limit.'),('SavingsGoal','UUID','user FK; target/current NUMERIC(12,2); contributions','Goal progress.'),('Asset / Liability','UUID','user FK; NUMERIC(14,2) valuations and balances','User-maintained balance sheet.'),('Receipt','UUID','user FK; total NUMERIC(12,2); status; JSON items; optional transaction FK','Staged OCR record and confirmation link.'),('ConversationSession / Message','UUID','session user FK; messages FK session; JSON data','AI conversation history.'),('Notification / AnomalyEvent','UUID','user FK; optional transaction FK; status and metadata','Alerts and review state.')],[1.25,.85,3.25,1.45],fs=7.8)
caption('Table 4.1 — Selected database entities, keys, and data roles')
heading('4.2.1 Data Integrity and Constraints',3)
for x in ['Monetary attributes use Django DecimalField/SQL NUMERIC precision; calculations should preserve Decimal values and avoid binary floating-point conversion. This does not prove every path is free of rounding mistakes.','Foreign-key behavior varies by relation: transaction categories and merchants may become null when removed; user-owned records generally cascade with account deletion.','Budget uniqueness is enforced across user, category, and period. GoogleIdentity adds uniqueness for provider and provider subject.','User scoping is implemented through authenticated request context in relevant API querysets. UUIDs make enumeration less predictable but do not replace authorization.','Receipt file signatures are checked before external processing; file size, storage durability, and provider-specific error handling remain separate concerns.','The active MFA secret field is not visibly encrypted in the reviewed model path. This is a security limitation and a candidate for remediation before sensitive production use.']: bullet(x)
heading('4.3 GUI Screenshots',2)
p(f'The UI screenshot register lists 33 captures. Paths for screenshots under the `artifacts/` directory were not present in the current checkout; verified report captures were selected from existing audit_screenshots assets. The selected files were opened in a contact sheet and visually checked for correct MONVEX pages, broken layout, obvious credentials, and personal financial details. They show mostly empty/demo states with zero-value summaries; no genuine user account data is intentionally reproduced. The dossier’s synthetic-data provenance is recorded, but the screenshots themselves do not independently prove a live service session.')
for i,(uid,label,path) in enumerate(available[:9],start=1):
    figure(path,f'Figure 4.{i+1} — {label} (registered UI capture {uid}; local audit asset)',6.35)
p('Additional existing mobile captures are included in the assets directory as evidence, but the main screenshot sequence prioritizes screens legible at report scale. Twelve registered `artifacts/` captures were not found and are excluded rather than recreated or presented as genuine.')

# Chapter 5
chapter(5,'Implementation and Testing')
heading('5.1 Implementation Approaches',2)
p('Implementation follows a layered approach. The web application presents route-level components and forms. API modules centralize endpoint calls and authentication behavior. Django views validate and authorize requests, then invoke model operations or domain services. The service layer contains reusable financial computations, natural-language parsing, machine-learning categorization, receipt validation/OCR, forecasting, and report generation. This structure keeps UI concerns separate from data persistence and calculations.')
p('For a transaction without a category, the service obtains a prediction from the categorizer and stores the returned confidence with the new record. For a receipt, signature validation happens before OCR; OCR output creates a staged record, and a separate confirmation action creates the ledger entry. This user-review step prevents extracted text from being silently treated as a verified transaction.')
heading('5.1.1 Coding Details and Code Efficiency',3)
heading('5.1.1.1 Code Details',3)
p('Representative service behavior from `backend/services/transaction_service.py` uses an atomic transaction boundary and a fixed-point Decimal value. In simplified form, the category decision is: use an explicit category if supplied; otherwise invoke the classifier with the description and merchant, resolve the predicted category, and persist the confidence. The database create operation associates the user, amount, type, date, category, merchant, source, and original text. The actual source should be consulted for full validation and exception behavior; this report does not reproduce entire modules.')
code=doc.add_paragraph(style='Code Block'); code.add_run("with transaction.atomic():\n    if category is absent:\n        prediction = categorizer.predict(description, merchant_name)\n        category = resolve_category(user, prediction['category'])\n        confidence = Decimal(str(prediction['confidence']))\n    Transaction.objects.create(\n        user=user, amount=amount, category=category, confidence=confidence\n    )")
caption('Listing 5.1 — Simplified explanation of the category fallback and atomic ledger write; not a verbatim source listing')
p('In the broader flow, serializers and API views validate inputs and apply the authenticated user boundary. The service may create a merchant record and normalize a known merchant name. Querysets are scoped before returning individual records, which is the key access-control check that complements opaque UUID identifiers. Errors should remain explicit at the API boundary so the client can show validation feedback rather than implying a successful write.')
heading('5.1.1.2 Code Efficiency',3)
p('Database indexes support common queries by user, date, category, and transaction type. Pagination limits response size. The web query cache can reduce duplicate requests and coordinate refresh after mutations. These are design choices, not measured performance results: no latency, throughput, memory, or scaling benchmark was produced for this report. Efficiency under large ledgers will depend on query plans, aggregation strategy, caching policy, database connection behavior, and the size of AI/OCR payloads.')
heading('5.2 Testing Approach',2)
p('Testing is described in layers: isolated application/service tests, API integration tests, browser route tests, and responsive viewport audits. Security configuration checks and frontend compilation are separate verification activities and should not be counted as application test cases of the same kind. Test artifacts and the dossier summarize outcomes; this report build did not rerun the backend suite, frontend build, or browser audit.')
heading('5.2.1 Unit Testing',3)
p('Unit tests focus on small rules such as amount handling, category suggestions, parsing, budget calculations, goal contributions, and health-score edge cases. A unit test should control its inputs, assert the expected output, and avoid relying on a live external AI response. Tests that call the Django API or database cross a component boundary and are described as integration tests in the dossier.')
heading('5.2.2 Integrated Testing',3)
p('Integration tests exercise request/response behavior and multiple components together: authentication and token refresh, user isolation, asset/liability aggregation, receipt staging and confirmation, and report responses. Provider-dependent paths should use controlled responses or test doubles so a network outage does not create misleading product failures. Browser tests validate navigation and viewport layout, not the correctness of every financial computation.')

# Chapter 6
chapter(6,'System Design')
heading('6.1 Test Reports',2)
p('The college template labels this chapter “SYSTEM DESIGN” while its only listed subsection is “6.1 Test Reports.” This report preserves that title and location. Table 6.1 reconciles the dossier’s stated 234 checks: 72 + 108 + 24 + 28 + 1 + 1 = 234. The two one-item checks are a production security configuration check and a frontend build; they are not additional unit tests.')
table(['Category','Count','Dossier-reported result','Evidence available in repository','Verification status for this report'],[
 ('Backend application unit tests','72','72 pass, 0 fail','Test modules exist; original full run log not found','Reported; not rerun'),('Backend integration tests','108','108 pass, 0 fail','Test modules exist; original full run log not found','Reported; not rerun'),('Public-route/navigation E2E','24','24 pass','Playwright script and related artifacts exist','Reported; results not fully reproduced'),('Responsive viewport checks','28','28 pass','audit_results.json contains route/viewport outcomes','Artifact inspected; not rerun'),('Django production check','1','Pass; zero issues reported','Command/result record in dossier only','Reported; not rerun'),('Frontend production build','1','Pass; zero errors reported','Package build script and source present','Reported; not rerun'),('Total','234','234 pass, 0 fail reported','Mixed evidence depth','Not a single homogeneous test suite')],[1.7,.55,1.25,1.8,1.5],fs=7.5)
caption('Table 6.1 — Reported test and verification totals, with evidence qualification')
heading('6.1.1 Representative test cases',3)
p('The cases below are taken from the Phase 1 test register and are presented as dossier-reported outcomes. “Actual result” reproduces the summarized result, not a fresh execution record. Raw test logs were not found alongside the suite during this report preparation.')
test_rows=[
 ('UT-06','Transactions — create transaction with decimal amount','Authenticated user; amount 450.75','201; stored amount retains 2 decimal places','Dossier reports 450.75 persisted','PASS reported','backend/tests/test_api_endpoints.py'),
 ('UT-07','Categorizer — suggest category for merchant description','“Swiggy food delivery”','Category suggestion and confidence returned','Dossier reports Food & Dining','PASS reported','backend/tests/test_financial_engines.py'),
 ('UT-09','Budgets — calculate limit variance','Limit 10,000; spend 7,500','Remaining variance 2,500; consumption 75%','Dossier reports expected arithmetic','PASS reported','backend/tests/test_financial_engines.py'),
 ('UT-13','Analytics — calculate health score','Income, expenses, debt and savings fixture','Bounded score and grade','Dossier reports 82 / A','PASS reported','backend/tests/test_financial_engines.py'),
 ('UT-15','File validation — reject executable bytes renamed as image','Disallowed ELF signature','Validation error; upload rejected','Dossier reports rejection','PASS reported','backend/apps/authentication/test_file_upload_security.py'),
 ('IT-01','Authentication — login and refresh cookie rotation','Valid test account; refresh request','Cookie set and rotated as configured','Dossier reports rotation','PASS reported','backend/apps/authentication/test_cookie_auth.py'),
 ('IT-02','Data isolation — User A requests User B transaction','Second user record identifier','Access denied / not found','Dossier reports HTTP 404','PASS reported','backend/tests/test_cyber_security.py'),
 ('IT-03','Net worth — aggregate an asset and liability','Asset 500,000; liability 200,000','Net worth 300,000','Dossier reports exact match','PASS reported','backend/tests/test_v42_data_integrity.py'),
 ('IT-05','Receipt workflow — upload, stage, confirm transaction','Valid test image and provider/test response','Receipt links to created transaction','Dossier reports completed flow','PASS reported; provider config dependency','backend/tests/test_api_endpoints.py'),
 ('IT-07','PDF report — generate selected monthly statement','Year/month query parameters','PDF response begins with PDF signature','Dossier reports valid stream','PASS reported','backend/tests/test_api_endpoints.py'),
 ('E2E-01','Public navigation — landing page to privacy page','Chromium desktop route','Expected route loads without login redirect','Dossier reports pass','PASS reported','web/scripts/test_all_public_links.mjs'),
 ('RWD-01','Responsive layout — desktop/mobile dashboard','1440×900 and 390×844','No horizontal overflow in recorded check','audit_results.json marks audited routes PASS','Artifact inspected; not rerun','audit_results.json')]
table(['Test ID','Module and scenario','Preconditions / input','Expected result','Actual result in dossier/artifact','Pass/fail status','Evidence reference'],test_rows,[.45,1.22,.93,1.0,1.0,.75,1.45],fs=7.2)
caption('Table 6.2 — Representative unit, integration, browser, and viewport cases')
p('The arithmetic is internally consistent: the six categories total 234. The term “234 tests” is therefore shorthand in the dossier; the total combines 180 backend tests, 24 browser route checks, 28 viewport checks, and two single configuration/build checks. Test status is reported rather than independently reproduced here. A fresh submission preflight should rerun applicable suites and archive raw outputs.')

# Chapter 7
chapter(7,'Conclusions')
heading('7.1 Conclusion',2)
p('MONVEX demonstrates a full-stack personal finance application that connects a responsive web interface to a modular API and relational data model. The active source supports user-managed transactions, budgeting, savings goals, asset and liability tracking, financial summaries, exports, receipt review, and optional ML/AI-assisted workflows. Its principal contribution is the integration of these functions behind authenticated, user-scoped endpoints and a common interface.')
p('The report’s evidence review also narrows the project claims. The service configuration does not prove a functioning public deployment; the Flutter app is historical, not present in the active checkout; Open Banking is not implemented; and third-party AI requires external configuration. The dossier-reported test suite is useful evidence but has not been fully reproduced in this report build. These distinctions should be retained in any academic presentation.')
heading('7.1.1 Significance of the System (Advantages)',3)
for x in ['Combines personal ledger entry, budget review, goals, net worth, debt planning, and analytics in a single application.','Uses Decimal/NUMERIC model fields for monetary data and relational constraints for key records.','Allows user review between receipt extraction and ledger creation.','Separates frontend, API views, models, and reusable domain services.','Provides web and configured Windows desktop access paths.','Includes controls such as per-user query scoping, token handling, throttling, and file-signature checks that address specific risks.']: bullet(x)
heading('7.1.2 Limitations of the System (Disadvantages)',3)
for x in ['No live bank-feed synchronization; financial records rely on user entry or supported ingestion paths.','No independently confirmed live Render deployment or production database state.','The Flutter mobile implementation is not in the current working tree and is not runnable from this checkout.','AI and OCR depend on provider configuration, network availability, and generated output that requires review.','The application-defined score and forecast depend on the quality and completeness of user data and simplified assumptions.','The TOTP secret is stored in a plain model field in the active source; encryption at rest was not evidenced.','Some registered screenshot assets are missing, and available screenshots predominantly show empty or zero-value states.','No performance benchmark or full fresh test-suite run was produced for this report.']: bullet(x)
heading('7.1.3 Future Scope of the Project',3)
for x in ['Implement Open Banking provider integration only after provider, consent, security, reconciliation, and regulatory requirements are defined.','Encrypt MFA secrets at rest and review key management, backup, data-retention, and incident-response practices.','Add repeatable CI execution with archived raw test/build reports and deterministic provider mocks.','Restore or separately maintain a supported mobile application if mobile-native functionality is required.','Benchmark database queries and forecast/analytics workloads using controlled, anonymized datasets.','Improve model evaluation with documented held-out data and category-wise error analysis; allow user correction to inform future suggestions.','Review file storage durability and move uploads to an appropriate persistent object store for a production deployment.','Expand report exports and user deletion/data portability workflows after privacy requirements are confirmed.']: bullet(x)

# Chapter 8
chapter(8,'References')
p('Online documentation and standards below are cited for the technologies and methods discussed in this report. Version numbers are stated only where supported by the project manifest/lockfile or a published standard. Documentation access date: 12 October 2026. The listed sources support general technology descriptions; they do not certify MONVEX behavior.')
refs=[
 ('[1]','Vercel Inc. “Next.js Documentation.” https://nextjs.org/docs'),('[2]','Meta Open Source. “React Reference.” https://react.dev/reference/react'),('[3]','Microsoft. “TypeScript Documentation.” https://www.typescriptlang.org/docs/'),('[4]','Tailwind Labs. “Tailwind CSS Documentation.” https://tailwindcss.com/docs'),('[5]','TanStack. “TanStack Query Documentation.” https://tanstack.com/query/latest/docs/framework/react/overview'),('[6]','Poimandres. “Zustand Documentation.” https://zustand.docs.pmnd.rs/'),('[7]','Django Software Foundation. “Django Documentation.” https://docs.djangoproject.com/en/5.2/'),('[8]','Encode OSS. “Django REST Framework Documentation.” https://www.django-rest-framework.org/'),('[9]','Jazzband. “Simple JWT Documentation.” https://django-rest-framework-simplejwt.readthedocs.io/'),('[10]','PostgreSQL Global Development Group. “PostgreSQL 16 Documentation.” https://www.postgresql.org/docs/16/'),('[11]','Neon. “Neon Documentation.” https://neon.tech/docs'),('[12]','WhiteNoise contributors. “WhiteNoise Documentation.” https://whitenoise.readthedocs.io/'),('[13]','Google. “Gemini API Documentation.” https://ai.google.dev/gemini-api/docs'),('[14]','Pedregosa, F. et al. “Scikit-learn: Machine Learning in Python.” Journal of Machine Learning Research, 12 (2011), 2825–2830. https://jmlr.org/papers/v12/pedregosa11a.html'),('[15]','Harris, C.R. et al. “Array programming with NumPy.” Nature 585 (2020), 357–362. https://doi.org/10.1038/s41586-020-2649-2'),('[16]','Tauri Apps. “Tauri v1 Documentation.” https://v1.tauri.app/'),('[17]','ReportLab. “ReportLab Documentation.” https://docs.reportlab.com/'),('[18]','Jones, M., Bradley, J. and Sakimura, N. “JSON Web Token (JWT).” RFC 7519, IETF, 2015. https://datatracker.ietf.org/doc/html/rfc7519'),('[19]','M’Raihi, D. et al. “TOTP: Time-Based One-Time Password Algorithm.” RFC 6238, IETF, 2011. https://datatracker.ietf.org/doc/html/rfc6238'),('[20]','OWASP Foundation. “OWASP Top 10.” https://owasp.org/projects/top-ten')]
for n,text in refs:
    par=doc.add_paragraph(); par.paragraph_format.first_line_indent=Inches(-.28); par.paragraph_format.left_indent=Inches(.28); par.paragraph_format.line_spacing=1.0; par.paragraph_format.space_after=Pt(3)
    rr=par.add_run(n+' '+text); rr.font.name='Times New Roman'; rr.font.size=Pt(10)

# Add final evidence note and document core properties.
doc.core_properties.title='MONVEX — Final Project Documentation'
doc.core_properties.subject='B.Sc. Computer Science Semester VI academic project report'
doc.core_properties.author='ANSARI DANISH ASLAM'
doc.core_properties.keywords='MONVEX, personal finance, Django, Next.js, project report'
path=OUT/'MONVEX_Final_Project_Documentation.docx'; doc.save(path)
print(f'Created {path}; {len(available)} screenshots copied; {len(list(FIG.glob("*.png")))} diagram assets created.')
