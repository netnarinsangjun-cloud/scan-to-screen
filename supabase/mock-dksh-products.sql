-- =============================================================================
-- Scan to Screen — 30 MOCK Health & Care products for testing (fictional brands)
-- Barcodes: EAN-13 in the GS1 in-house range (prefix 200), so they can never
-- clash with real retail barcodes. Images (AI-generated with ChatGPT, red-tone pack shots, no text) are served from /public/mock.
-- Safe to re-run (upsert by barcode). Remove later with:
--   delete from public.products where barcode_id like '20012060%';
-- =============================================================================
insert into public.products (barcode_id, title, description, price, image_url, video_url)
values
  ('2001206000014', 'VitaPlus Vitamin C 1000mg (60 เม็ด)', 'วิตามินซี 1000 มก. ผสมซิงค์ เสริมภูมิคุ้มกัน รับประทานวันละ 1 เม็ดหลังอาหาร', 450.00, 'https://scan-to-screen.vercel.app/mock/2001206000014.webp', null),
  ('2001206000021', 'OmegaPure Fish Oil 1000mg (90 แคปซูล)', 'น้ำมันปลาบริสุทธิ์ โอเมก้า-3 สูง มี EPA และ DHA บำรุงสมองและหัวใจ', 520.00, 'https://scan-to-screen.vercel.app/mock/2001206000021.webp', null),
  ('2001206000038', 'Beaute Collagen Peptide Drink (10 ซอง)', 'คอลลาเจนเปปไทด์ 10,000 มก. ผสมวิตามินซี ชงง่าย รสเบอร์รี่ ไม่มีกลิ่นคาว', 690.00, 'https://scan-to-screen.vercel.app/mock/2001206000038.webp', null),
  ('2001206000045', 'Probio Daily Probiotic (30 แคปซูล)', 'โพรไบโอติก 10 สายพันธุ์ 20,000 ล้านตัว ช่วยปรับสมดุลระบบขับถ่าย', 790.00, 'https://scan-to-screen.vercel.app/mock/2001206000045.webp', null),
  ('2001206000052', 'CalciMax Calcium + Vitamin D3 (60 เม็ด)', 'แคลเซียมพร้อมวิตามินดี 3 ช่วยเสริมสร้างกระดูกและฟันให้แข็งแรง', 390.00, 'https://scan-to-screen.vercel.app/mock/2001206000052.webp', null),
  ('2001206000069', 'MultiVita Daily Multivitamin (30 เม็ด)', 'วิตามินและแร่ธาตุรวม 23 ชนิด สำหรับคนทำงานที่ต้องการพลังงานตลอดวัน', 350.00, 'https://scan-to-screen.vercel.app/mock/2001206000069.webp', null),
  ('2001206000076', 'Yummy Kids Multivitamin Gummies (60 ชิ้น)', 'กัมมี่วิตามินรวมสำหรับเด็ก รสผลไม้รวม ไม่ใส่สีสังเคราะห์ เคี้ยวง่าย', 299.00, 'https://scan-to-screen.vercel.app/mock/2001206000076.webp', null),
  ('2001206000083', 'VisionIQ Lutein Eye Care (30 แคปซูล)', 'ลูทีนและซีแซนทีนจากดอกดาวเรือง บำรุงสายตาสำหรับคนที่ใช้หน้าจอนาน', 650.00, 'https://scan-to-screen.vercel.app/mock/2001206000083.webp', null),
  ('2001206000090', 'Electro Oral Rehydration Salts (10 ซอง)', 'เกลือแร่ทดแทนการสูญเสียน้ำ ชงดื่มง่าย เหมาะหลังออกกำลังกายหรือวันที่อากาศร้อน', 89.00, 'https://scan-to-screen.vercel.app/mock/2001206000090.webp', null),
  ('2001206000106', 'SleepWell Magnesium Night Formula (30 แคปซูล)', 'แมกนีเซียมผสมคาโมมายล์และ L-theanine ช่วยให้ผ่อนคลายก่อนนอน', 490.00, 'https://scan-to-screen.vercel.app/mock/2001206000106.webp', null),
  ('2001206000113', 'Herbal Cool Balm 15g', 'ยาหม่องสมุนไพรไทยสูตรเย็น บรรเทาอาการปวดเมื่อย วิงเวียน คัดจมูก', 59.00, 'https://scan-to-screen.vercel.app/mock/2001206000113.webp', null),
  ('2001206000120', 'Flexa Muscle Relief Gel 30g', 'เจลบรรเทาอาการปวดกล้ามเนื้อสูตรเย็น ซึมไว ไม่เหนียวเหนอะหนะ', 159.00, 'https://scan-to-screen.vercel.app/mock/2001206000120.webp', null),
  ('2001206000137', 'Throatee Honey Lemon Lozenges (20 เม็ด)', 'ยาอมรสน้ำผึ้งมะนาว ช่วยให้ชุ่มคอ บรรเทาอาการระคายคอ', 49.00, 'https://scan-to-screen.vercel.app/mock/2001206000137.webp', null),
  ('2001206000144', 'FlexiPlast Waterproof Bandages (20 ชิ้น)', 'พลาสเตอร์ปิดแผลกันน้ำ ยืดหยุ่นตามการเคลื่อนไหว ระบายอากาศได้ดี', 69.00, 'https://scan-to-screen.vercel.app/mock/2001206000144.webp', null),
  ('2001206000151', 'SaniPro Hand Sanitizer Gel 500ml', 'เจลล้างมือแอลกอฮอล์ 75% ผสมว่านหางจระเข้ ไม่ทำให้มือแห้ง', 129.00, 'https://scan-to-screen.vercel.app/mock/2001206000151.webp', null),
  ('2001206000168', 'SafeMask 3-Ply Medical Face Mask (50 ชิ้น)', 'หน้ากากอนามัย 3 ชั้น กรองฝุ่นและแบคทีเรีย สายคล้องหูนุ่มไม่เจ็บหู', 99.00, 'https://scan-to-screen.vercel.app/mock/2001206000168.webp', null),
  ('2001206000175', 'SalineCare Nasal Spray 30ml', 'สเปรย์น้ำเกลือสำหรับล้างจมูก ช่วยให้โล่ง ใช้ได้ทุกวัน', 189.00, 'https://scan-to-screen.vercel.app/mock/2001206000175.webp', null),
  ('2001206000182', 'EyeFresh Lubricant Eye Drops 10ml', 'น้ำตาเทียมหยอดตา ช่วยให้ดวงตาชุ่มชื้น บรรเทาอาการตาแห้งจากการใช้หน้าจอ', 145.00, 'https://scan-to-screen.vercel.app/mock/2001206000182.webp', null),
  ('2001206000199', 'ThermoCare Digital Ear Thermometer', 'เครื่องวัดไข้ทางหูแบบดิจิทัล อ่านค่าใน 1 วินาที ใช้ได้ทั้งเด็กและผู้ใหญ่', 1290.00, 'https://scan-to-screen.vercel.app/mock/2001206000199.webp', null),
  ('2001206000205', 'CardioSmart Blood Pressure Monitor', 'เครื่องวัดความดันอัตโนมัติแบบต้นแขน จอใหญ่ จำค่าได้ 2 ผู้ใช้ เชื่อมต่อแอปได้', 2490.00, 'https://scan-to-screen.vercel.app/mock/2001206000205.webp', null),
  ('2001206000212', 'OxyCheck Fingertip Pulse Oximeter', 'เครื่องวัดออกซิเจนในเลือดและชีพจรที่ปลายนิ้ว อ่านค่าเร็ว พกพาสะดวก', 890.00, 'https://scan-to-screen.vercel.app/mock/2001206000212.webp', null),
  ('2001206000229', 'GlucoSense Blood Glucose Meter', 'เครื่องวัดน้ำตาลในเลือด ใช้เลือดน้อย รู้ผลใน 5 วินาที บันทึกค่าได้ 500 ครั้ง', 1590.00, 'https://scan-to-screen.vercel.app/mock/2001206000229.webp', null),
  ('2001206000236', 'SmartScale Body Composition Scale', 'เครื่องชั่งน้ำหนักวัดมวลไขมันและกล้ามเนื้อ เชื่อมต่อแอปผ่านบลูทูธ', 1290.00, 'https://scan-to-screen.vercel.app/mock/2001206000236.webp', null),
  ('2001206000243', 'Hydra Glow Vitamin C Serum 30ml', 'เซรั่มวิตามินซีเข้มข้น 15% ช่วยให้ผิวกระจ่างใส ลดเลือนจุดด่างดำ', 590.00, 'https://scan-to-screen.vercel.app/mock/2001206000243.webp', null),
  ('2001206000250', 'SunShield Daily UV Protection SPF50+', 'กันแดดเนื้อบางเบา ไม่เหนียว กันน้ำกันเหงื่อ เหมาะกับอากาศร้อนชื้น', 349.00, 'https://scan-to-screen.vercel.app/mock/2001206000250.webp', null),
  ('2001206000267', 'Rose Hip Renewal Night Cream 50g', 'ครีมบำรุงผิวกลางคืนจากน้ำมันโรสฮิป ฟื้นฟูผิวระหว่างนอนหลับ', 690.00, 'https://scan-to-screen.vercel.app/mock/2001206000267.webp', null),
  ('2001206000274', 'Aloe Calm Body Lotion 400ml', 'โลชั่นบำรุงผิวกายสารสกัดว่านหางจระเข้ ซึมไว ผิวชุ่มชื้นตลอดวัน', 199.00, 'https://scan-to-screen.vercel.app/mock/2001206000274.webp', null),
  ('2001206000281', 'SensiCare Sensitive Toothpaste 100g', 'ยาสีฟันสำหรับฟันเสียวโดยเฉพาะ ผสมฟลูออไรด์ ช่วยปกป้องเคลือบฟัน', 89.00, 'https://scan-to-screen.vercel.app/mock/2001206000281.webp', null),
  ('2001206000298', 'Gentle Baby Head-to-Toe Wash 500ml', 'สบู่และแชมพูสำหรับเด็กสูตรอ่อนโยน ไม่แสบตา ผ่านการทดสอบโดยแพทย์ผิวหนัง', 229.00, 'https://scan-to-screen.vercel.app/mock/2001206000298.webp', null),
  ('2001206000304', 'DermaCica Barrier Repair Cream 50ml', 'ครีมบำรุงผิวแพ้ง่ายสูตรซิก้า ช่วยฟื้นฟูเกราะป้องกันผิว ลดรอยแดง', 420.00, 'https://scan-to-screen.vercel.app/mock/2001206000304.webp', null)
on conflict (barcode_id) do update
set title       = excluded.title,
    description = excluded.description,
    price       = excluded.price,
    image_url   = excluded.image_url,
    video_url   = excluded.video_url;
