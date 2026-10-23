"""Generate 30 mock Health & Care products: SVG pack shots + SQL seed.

Brands are fictional. Barcodes are EAN-13 in the GS1 "restricted circulation"
range (prefix 200), so they can never collide with real retail products.
"""
import html
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_SVG = os.path.join(ROOT, "public", "mock")
OUT_SQL = os.path.join(ROOT, "supabase", "mock-dksh-products.sql")
BASE_URL = "https://scan-to-screen.vercel.app/mock"

# (shape, brand, label lines, title, description TH, price, hue key)
P = [
    # --- Vitamins & supplements ---
    ("jar", "VITAPLUS", ["VITAMIN C", "1000 MG"], "VitaPlus Vitamin C 1000mg (60 เม็ด)", "วิตามินซี 1000 มก. ผสมซิงค์ เสริมภูมิคุ้มกัน รับประทานวันละ 1 เม็ดหลังอาหาร", 450, "orange"),
    ("jar", "OMEGAPURE", ["FISH OIL", "1000 MG"], "OmegaPure Fish Oil 1000mg (90 แคปซูล)", "น้ำมันปลาบริสุทธิ์ โอเมก้า-3 สูง มี EPA และ DHA บำรุงสมองและหัวใจ", 520, "gold"),
    ("box", "BEAUTE", ["COLLAGEN", "DRINK"], "Beaute Collagen Peptide Drink (10 ซอง)", "คอลลาเจนเปปไทด์ 10,000 มก. ผสมวิตามินซี ชงง่าย รสเบอร์รี่ ไม่มีกลิ่นคาว", 690, "rose"),
    ("jar", "PROBIO", ["DAILY", "PROBIOTIC"], "Probio Daily Probiotic (30 แคปซูล)", "โพรไบโอติก 10 สายพันธุ์ 20,000 ล้านตัว ช่วยปรับสมดุลระบบขับถ่าย", 790, "green"),
    ("jar", "CALCIMAX", ["CALCIUM", "+ D3"], "CalciMax Calcium + Vitamin D3 (60 เม็ด)", "แคลเซียมพร้อมวิตามินดี 3 ช่วยเสริมสร้างกระดูกและฟันให้แข็งแรง", 390, "sky"),
    ("jar", "MULTIVITA", ["MULTI", "VITAMIN"], "MultiVita Daily Multivitamin (30 เม็ด)", "วิตามินและแร่ธาตุรวม 23 ชนิด สำหรับคนทำงานที่ต้องการพลังงานตลอดวัน", 350, "orange"),
    ("jar", "YUMMY", ["KIDS", "GUMMIES"], "Yummy Kids Multivitamin Gummies (60 ชิ้น)", "กัมมี่วิตามินรวมสำหรับเด็ก รสผลไม้รวม ไม่ใส่สีสังเคราะห์ เคี้ยวง่าย", 299, "violet"),
    ("jar", "VISIONIQ", ["LUTEIN", "EYE CARE"], "VisionIQ Lutein Eye Care (30 แคปซูล)", "ลูทีนและซีแซนทีนจากดอกดาวเรือง บำรุงสายตาสำหรับคนที่ใช้หน้าจอนาน", 650, "gold"),
    ("box", "ELECTRO", ["ORAL", "REHYDRATION"], "Electro Oral Rehydration Salts (10 ซอง)", "เกลือแร่ทดแทนการสูญเสียน้ำ ชงดื่มง่าย เหมาะหลังออกกำลังกายหรือวันที่อากาศร้อน", 89, "sky"),
    ("jar", "SLEEPWELL", ["MAGNESIUM", "NIGHT"], "SleepWell Magnesium Night Formula (30 แคปซูล)", "แมกนีเซียมผสมคาโมมายล์และ L-theanine ช่วยให้ผ่อนคลายก่อนนอน", 490, "violet"),
    # --- Pharmacy & first aid ---
    ("balm", "HERBAL", ["COOL", "BALM"], "Herbal Cool Balm 15g", "ยาหม่องสมุนไพรไทยสูตรเย็น บรรเทาอาการปวดเมื่อย วิงเวียน คัดจมูก", 59, "green"),
    ("tube", "FLEXA", ["MUSCLE", "RELIEF GEL"], "Flexa Muscle Relief Gel 30g", "เจลบรรเทาอาการปวดกล้ามเนื้อสูตรเย็น ซึมไว ไม่เหนียวเหนอะหนะ", 159, "red"),
    ("box", "THROATEE", ["HONEY", "LOZENGES"], "Throatee Honey Lemon Lozenges (20 เม็ด)", "ยาอมรสน้ำผึ้งมะนาว ช่วยให้ชุ่มคอ บรรเทาอาการระคายคอ", 49, "gold"),
    ("box", "FLEXIPLAST", ["WATERPROOF", "BANDAGES"], "FlexiPlast Waterproof Bandages (20 ชิ้น)", "พลาสเตอร์ปิดแผลกันน้ำ ยืดหยุ่นตามการเคลื่อนไหว ระบายอากาศได้ดี", 69, "cream"),
    ("bottle", "SANIPRO", ["HAND", "SANITIZER"], "SaniPro Hand Sanitizer Gel 500ml", "เจลล้างมือแอลกอฮอล์ 75% ผสมว่านหางจระเข้ ไม่ทำให้มือแห้ง", 129, "sky"),
    ("box", "SAFEMASK", ["3-PLY", "MASK"], "SafeMask 3-Ply Medical Face Mask (50 ชิ้น)", "หน้ากากอนามัย 3 ชั้น กรองฝุ่นและแบคทีเรีย สายคล้องหูนุ่มไม่เจ็บหู", 99, "sky"),
    ("dropper", "SALINECARE", ["NASAL", "SPRAY"], "SalineCare Nasal Spray 30ml", "สเปรย์น้ำเกลือสำหรับล้างจมูก ช่วยให้โล่ง ใช้ได้ทุกวัน", 189, "sky"),
    ("dropper", "EYEFRESH", ["EYE", "DROPS"], "EyeFresh Lubricant Eye Drops 10ml", "น้ำตาเทียมหยอดตา ช่วยให้ดวงตาชุ่มชื้น บรรเทาอาการตาแห้งจากการใช้หน้าจอ", 145, "sky"),
    # --- Home health devices ---
    ("device", "THERMOCARE", ["36.8", "°C"], "ThermoCare Digital Ear Thermometer", "เครื่องวัดไข้ทางหูแบบดิจิทัล อ่านค่าใน 1 วินาที ใช้ได้ทั้งเด็กและผู้ใหญ่", 1290, "sky"),
    ("device", "CARDIOSMART", ["120/80", "mmHg"], "CardioSmart Blood Pressure Monitor", "เครื่องวัดความดันอัตโนมัติแบบต้นแขน จอใหญ่ จำค่าได้ 2 ผู้ใช้ เชื่อมต่อแอปได้", 2490, "red"),
    ("device", "OXYCHECK", ["98%", "SpO2"], "OxyCheck Fingertip Pulse Oximeter", "เครื่องวัดออกซิเจนในเลือดและชีพจรที่ปลายนิ้ว อ่านค่าเร็ว พกพาสะดวก", 890, "graphite"),
    ("device", "GLUCOSENSE", ["105", "mg/dL"], "GlucoSense Blood Glucose Meter", "เครื่องวัดน้ำตาลในเลือด ใช้เลือดน้อย รู้ผลใน 5 วินาที บันทึกค่าได้ 500 ครั้ง", 1590, "violet"),
    ("device", "SMARTSCALE", ["68.5", "kg"], "SmartScale Body Composition Scale", "เครื่องชั่งน้ำหนักวัดมวลไขมันและกล้ามเนื้อ เชื่อมต่อแอปผ่านบลูทูธ", 1290, "graphite"),
    # --- Skin, oral & baby care ---
    ("dropper", "HYDRA GLOW", ["VITAMIN C", "SERUM"], "Hydra Glow Vitamin C Serum 30ml", "เซรั่มวิตามินซีเข้มข้น 15% ช่วยให้ผิวกระจ่างใส ลดเลือนจุดด่างดำ", 590, "orange"),
    ("tube", "SUNSHIELD", ["SPF50+", "PA++++"], "SunShield Daily UV Protection SPF50+", "กันแดดเนื้อบางเบา ไม่เหนียว กันน้ำกันเหงื่อ เหมาะกับอากาศร้อนชื้น", 349, "gold"),
    ("jar", "ROSE HIP", ["NIGHT", "CREAM"], "Rose Hip Renewal Night Cream 50g", "ครีมบำรุงผิวกลางคืนจากน้ำมันโรสฮิป ฟื้นฟูผิวระหว่างนอนหลับ", 690, "rose"),
    ("bottle", "ALOE CALM", ["BODY", "LOTION"], "Aloe Calm Body Lotion 400ml", "โลชั่นบำรุงผิวกายสารสกัดว่านหางจระเข้ ซึมไว ผิวชุ่มชื้นตลอดวัน", 199, "green"),
    ("tube", "SENSICARE", ["SENSITIVE", "TOOTHPASTE"], "SensiCare Sensitive Toothpaste 100g", "ยาสีฟันสำหรับฟันเสียวโดยเฉพาะ ผสมฟลูออไรด์ ช่วยปกป้องเคลือบฟัน", 89, "sky"),
    ("bottle", "GENTLE BABY", ["HEAD TO TOE", "WASH"], "Gentle Baby Head-to-Toe Wash 500ml", "สบู่และแชมพูสำหรับเด็กสูตรอ่อนโยน ไม่แสบตา ผ่านการทดสอบโดยแพทย์ผิวหนัง", 229, "cream"),
    ("tube", "DERMACICA", ["CICA", "REPAIR"], "DermaCica Barrier Repair Cream 50ml", "ครีมบำรุงผิวแพ้ง่ายสูตรซิก้า ช่วยฟื้นฟูเกราะป้องกันผิว ลดรอยแดง", 420, "green"),
]

HUES = {
    # main, dark, light
    "green": ("#3E8E5A", "#22603A", "#DDF1E3"),
    "brown": ("#8A5A3C", "#5C3A24", "#F3E4D7"),
    "cream": ("#E8C28A", "#B98B45", "#FFF6E5"),
    "choco": ("#6B3E2E", "#45251A", "#F1E1D8"),
    "blue": ("#2F5DA8", "#1D3E75", "#DFE9F8"),
    "sky": ("#2BA3D9", "#1878A6", "#DDF2FB"),
    "gold": ("#E39A2D", "#B5711A", "#FFF0D6"),
    "rose": ("#D9577A", "#A8365A", "#FBE3EA"),
    "orange": ("#EE7A2D", "#BD5617", "#FFE9DA"),
    "graphite": ("#4A4E57", "#2C2F35", "#E7E8EB"),
    "red": ("#CC122A", "#960018", "#FADDE1"),
    "lime": ("#7CB342", "#558B2F", "#EDF7DF"),
    "violet": ("#8E6CC9", "#634497", "#EEE7FA"),
}


def ean13(n: int) -> str:
    body = f"20012060{n:04d}"  # 200 = in-house range · 1206 = "120 years, since 1906"
    s = sum(int(d) * (3 if i % 2 else 1) for i, d in enumerate(body))
    return body + str((10 - s % 10) % 10)


def label(x, y, w, h, brand, lines, c, rx=24):
    main, dark, light = c
    # Fit the longest line inside the label (bold caps ≈ 0.66 em per character).
    longest = max(len(l) for l in lines)
    fs = int(min(58, (w - 36) / (0.66 * longest)))
    t = [
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="#FFFFFF" opacity="0.96"/>',
        f'<rect x="{x}" y="{y + h - 18}" width="{w}" height="18" fill="{main}" opacity="0.9"/>',
        f'<text x="{x + w / 2}" y="{y + 54}" text-anchor="middle" font-size="{min(28, int((w - 24) / (0.9 * len(brand))))}" font-weight="700" letter-spacing="4" fill="{main}">{html.escape(brand)}</text>',
    ]
    for i, l in enumerate(lines):
        t.append(
            f'<text x="{x + w / 2}" y="{y + 54 + 20 + (i + 1) * (fs + 6)}" text-anchor="middle" font-size="{fs}" font-weight="800" fill="{dark}">{html.escape(l)}</text>'
        )
    return "".join(t)


def shape_svg(shape, brand, lines, c):
    main, dark, light = c
    g = f'url(#body)'
    s = []
    if shape == "bottle":
        s.append(f'<rect x="520" y="170" width="160" height="96" rx="18" fill="{dark}"/>')
        s.append(f'<rect x="545" y="256" width="110" height="90" fill="{main}"/>')
        s.append(f'<path d="M545,340 C470,380 420,420 420,500 L420,960 Q420,1010 470,1010 L730,1010 Q780,1010 780,960 L780,500 C780,420 730,380 655,340 Z" fill="{g}"/>')
        s.append(label(440, 560, 320, 330, brand, lines, c))
    elif shape == "dropper":
        s.append(f'<ellipse cx="600" cy="230" rx="62" ry="80" fill="{dark}"/>')
        s.append(f'<rect x="540" y="280" width="120" height="120" rx="14" fill="#2C2F35"/>')
        s.append(f'<rect x="460" y="400" width="280" height="610" rx="56" fill="{g}"/>')
        s.append(label(478, 560, 244, 320, brand, lines, c, rx=18))
    elif shape == "jar":
        s.append(f'<rect x="370" y="380" width="460" height="130" rx="26" fill="{dark}"/>')
        s.append(f'<rect x="350" y="500" width="500" height="500" rx="64" fill="{g}"/>')
        s.append(label(390, 560, 420, 330, brand, lines, c))
    elif shape == "balm":
        s.append(f'<ellipse cx="600" cy="800" rx="290" ry="90" fill="{dark}"/>')
        s.append(f'<rect x="310" y="600" width="580" height="200" fill="{g}"/>')
        s.append(f'<ellipse cx="600" cy="600" rx="290" ry="90" fill="{main}"/>')
        s.append(f'<ellipse cx="600" cy="600" rx="230" ry="62" fill="#FFFFFF" opacity="0.95"/>')
        s.append(f'<text x="600" y="590" text-anchor="middle" font-size="30" font-weight="700" letter-spacing="5" fill="{main}">{html.escape(brand)}</text>')
        s.append(f'<text x="600" y="634" text-anchor="middle" font-size="40" font-weight="800" fill="{dark}">{html.escape(" ".join(lines))}</text>')
    elif shape == "box":
        s.append(f'<path d="M780,260 L880,210 L880,950 L780,1000 Z" fill="{dark}"/>')
        s.append(f'<path d="M380,260 L480,210 L880,210 L780,260 Z" fill="{light}"/>')
        s.append(f'<rect x="380" y="260" width="400" height="740" fill="{g}"/>')
        s.append(label(410, 470, 340, 330, brand, lines, c, rx=16))
    elif shape == "carton":
        s.append(f'<path d="M420,330 L600,200 L780,330 Z" fill="{light}"/>')
        s.append(f'<rect x="560" y="170" width="80" height="40" fill="{light}"/>')
        s.append(f'<rect x="420" y="330" width="360" height="680" fill="{g}"/>')
        s.append(label(440, 520, 320, 330, brand, lines, c, rx=16))
    elif shape in ("can", "tin"):
        top, h = (330, 640) if shape == "can" else (470, 470)
        w = 380 if shape == "can" else 520
        x = 600 - w / 2
        s.append(f'<ellipse cx="600" cy="{top + h}" rx="{w / 2}" ry="44" fill="{dark}"/>')
        s.append(f'<rect x="{x}" y="{top}" width="{w}" height="{h}" fill="{g}"/>')
        s.append(f'<ellipse cx="600" cy="{top}" rx="{w / 2}" ry="44" fill="#D9D9DE"/>')
        s.append(f'<ellipse cx="600" cy="{top}" rx="{w / 2 - 22}" ry="30" fill="#C2C2C8"/>')
        s.append(label(x + 30, top + (110 if shape == "can" else 70), w - 60, 330, brand, lines, c))
    elif shape == "tube":
        s.append(f'<rect x="410" y="170" width="380" height="56" rx="8" fill="{dark}"/>')
        s.append(f'<path d="M420,226 L780,226 L690,880 L510,880 Z" fill="{g}"/>')
        s.append(f'<rect x="530" y="880" width="140" height="130" rx="20" fill="{dark}"/>')
        s.append(label(455, 330, 290, 330, brand, lines, c))
    elif shape == "pouch":
        s.append(f'<path d="M380,240 L820,240 L840,950 Q840,1010 780,1010 L420,1010 Q360,1010 360,950 Z" fill="{g}"/>')
        s.append(f'<rect x="380" y="240" width="440" height="40" fill="{dark}" opacity="0.6"/>')
        s.append(f'<circle cx="600" cy="320" r="18" fill="#FFFFFF" opacity="0.8"/>')
        s.append(label(410, 480, 380, 330, brand, lines, c))
    elif shape == "device":
        s.append(f'<rect x="400" y="240" width="400" height="770" rx="90" fill="{g}"/>')
        s.append(f'<rect x="450" y="330" width="300" height="230" rx="26" fill="#1E2A22"/>')
        s.append(f'<text x="600" y="460" text-anchor="middle" font-size="84" font-weight="800" fill="#9CF0B5" font-family="ui-monospace, Menlo, monospace">{html.escape(lines[0])}</text>')
        s.append(f'<text x="600" y="520" text-anchor="middle" font-size="34" fill="#9CF0B5">{html.escape(lines[1])}</text>')
        s.append(f'<text x="600" y="640" text-anchor="middle" font-size="30" font-weight="700" letter-spacing="5" fill="#FFFFFF">{html.escape(brand)}</text>')
        s.append(f'<circle cx="600" cy="800" r="74" fill="#FFFFFF" opacity="0.95"/>')
        s.append(f'<circle cx="600" cy="800" r="52" fill="{main}"/>')
    elif shape == "purifier":
        s.append(f'<rect x="390" y="220" width="420" height="790" rx="70" fill="{g}"/>')
        for r in range(8):
            s.append(f'<rect x="450" y="{300 + r * 34}" width="300" height="12" rx="6" fill="#FFFFFF" opacity="0.35"/>')
        s.append(label(430, 620, 340, 300, brand, lines, c))
    return "".join(s)


def svg(shape, brand, lines, hue):
    c = HUES[hue]
    main, dark, light = c
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200" width="1200" height="1200" font-family="'Segoe UI', 'Helvetica Neue', Arial, sans-serif">
<defs>
<radialGradient id="bg" cx="0.5" cy="0.42" r="0.75"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.55" stop-color="{light}"/><stop offset="1" stop-color="#FCE7CB"/></radialGradient>
<linearGradient id="body" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{dark}"/><stop offset="0.35" stop-color="{main}"/><stop offset="0.6" stop-color="{main}"/><stop offset="1" stop-color="{dark}"/></linearGradient>
<linearGradient id="shine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0.35"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>
</defs>
<rect width="1200" height="1200" fill="url(#bg)"/>
<ellipse cx="600" cy="1030" rx="330" ry="46" fill="#3C2A1A" opacity="0.14"/>
{shape_svg(shape, brand, lines, c)}
<rect x="0" y="1110" width="1200" height="90" fill="#FFFFFF" opacity="0.55"/>
<text x="600" y="1168" text-anchor="middle" font-size="30" font-weight="600" letter-spacing="8" fill="#94949B">SAMPLE PRODUCT · MOCKUP</text>
</svg>"""


def sql_str(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


os.makedirs(OUT_SVG, exist_ok=True)
rows = []
manifest = []
for i, (shape, brand, lines, title, desc, price, hue) in enumerate(P, start=1):
    code = ean13(i)
    with open(os.path.join(OUT_SVG, f"{code}.svg"), "w") as f:
        f.write(svg(shape, brand, lines, hue))
    url = f"{BASE_URL}/{code}.svg"
    rows.append(f"  ({sql_str(code)}, {sql_str(title)}, {sql_str(desc)}, {price:.2f}, {sql_str(url)}, null)")
    manifest.append({"barcode": code, "title": title, "price": price})

sql = f"""-- =============================================================================
-- Scan to Screen — 30 MOCK Health & Care products for testing (fictional brands)
-- Barcodes: EAN-13 in the GS1 in-house range (prefix 200), so they can never
-- clash with real retail barcodes. Images are served from /public/mock.
-- Safe to re-run (upsert by barcode). Remove later with:
--   delete from public.products where barcode_id like '20012060%';
-- =============================================================================
insert into public.products (barcode_id, title, description, price, image_url, video_url)
values
{(','+chr(10)).join(rows)}
on conflict (barcode_id) do update
set title       = excluded.title,
    description = excluded.description,
    price       = excluded.price,
    image_url   = excluded.image_url,
    video_url   = excluded.video_url;
"""
with open(OUT_SQL, "w") as f:
    f.write(sql)
print(json.dumps(manifest, ensure_ascii=False, indent=0)[:400])
print("count", len(P))
