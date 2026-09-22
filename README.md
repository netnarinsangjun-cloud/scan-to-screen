# Scan to Screen

ระบบแสดงสินค้าบนจอทีวีสำหรับบูธงานอีเวนต์ เมื่อทีมงานสแกนบาร์โค้ดหรือ QR ของสินค้า จอทีวีจะแสดงสินค้านั้นทันทีพร้อมแอนิเมชัน แล้วกลับสู่หน้ารอสแกนเองหลังผ่านไป 30 วินาที

- **`/tv`** คือหน้าจอทีวีขนาด 1920×1080 รับการสแกนจากเครื่องสแกน USB และรอรับข้อมูลจาก Supabase Realtime
- **`/scanner`** คือหน้าสแกนบนมือถือ ใช้กล้องมือถือสแกน (`@zxing/browser`) มีช่องกรอกบาร์โค้ดเอง และปุ่ม "RESET TV"

เทคโนโลยีที่ใช้: Next.js 14 (App Router), TypeScript (strict), Tailwind CSS, Framer Motion, Supabase (Postgres + Realtime) และ Vercel

---

## 1. ติดตั้ง

```bash
npm install
cp .env.example .env.local   # แล้วใส่ค่า 2 ค่าให้ครบ
npm run dev                  # เปิดที่ http://localhost:3000
```

สร้างเวอร์ชันสำหรับใช้งานจริง:

```bash
npm run build && npm start
```

## 2. ตั้งค่า Supabase

1. สร้างโปรเจกต์ใหม่ที่ <https://supabase.com>
2. ไปที่ **SQL Editor → New query** แล้ววางเนื้อหาทั้งหมดของ [`supabase/schema.sql`](supabase/schema.sql) จากนั้นกด **Run**
   สคริปต์นี้จะสร้างตารางทั้งสอง นโยบาย RLS สินค้าตัวอย่าง 5 รายการ และแถว `tv_state` ที่ `id = 1` รวมถึงเพิ่ม `tv_state` เข้า publication ชื่อ `supabase_realtime` พร้อมตั้ง `replica identity full` สคริปต์นี้รันซ้ำได้โดยไม่มีปัญหา
3. ตรวจว่าเปิด Realtime แล้ว: ที่ **Database → Publications → `supabase_realtime`** ต้องมี `tv_state` อยู่ในรายการ หรือดูที่สวิตช์ Realtime ใน **Table Editor → tv_state**
4. ไปที่ **Project Settings → API** แล้วคัดลอก **Project URL** กับคีย์ **anon public** มาใส่ใน `.env.local`

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

> ⚠️ นโยบาย RLS เปิดกว้างโดยตั้งใจ เพื่อให้บูธใช้งานได้โดยไม่ต้องล็อกอิน ใครก็ตามที่มี anon key จะเปลี่ยนสิ่งที่แสดงบนจอได้ หลังจบงานควรเปลี่ยน (rotate) anon key หรือลบนโยบาย `booth: update tv_state` ออก

## 3. Deploy ขึ้น Vercel

1. Push โค้ดขึ้น GitHub แล้ว Import โปรเจกต์ใน Vercel
2. เพิ่ม `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_ANON_KEY` ที่ **Settings → Environment Variables**
3. กด Deploy กล้องมือถือต้องใช้ผ่าน **HTTPS** ซึ่งลิงก์ `*.vercel.app` รองรับอยู่แล้ว

## 4. เปิด `/tv` แบบเต็มจอ (Kiosk)

ใช้ Chrome หรือ Edge บนคอมพิวเตอร์ที่ต่อกับทีวี ตั้งความละเอียดจอเป็น 1920×1080 ที่สเกล 100% ถ้าจอมีขนาดอื่น หน้าจอก็จะย่อขยายให้พอดีเอง

**Windows**

```bat
"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble --autoplay-policy=no-user-gesture-required --app=https://YOUR-APP.vercel.app/tv
```

**macOS**

```bash
open -a "Google Chrome" --args --kiosk --noerrdialogs --autoplay-policy=no-user-gesture-required --app=https://YOUR-APP.vercel.app/tv
```

**Linux**

```bash
google-chrome --kiosk --noerrdialogs --disable-infobars --autoplay-policy=no-user-gesture-required --app=https://YOUR-APP.vercel.app/tv
```

ข้อควรรู้สำหรับโหมด Kiosk:

- เคอร์เซอร์เมาส์และแถบเลื่อนถูกซ่อนไว้ ถ้าไม่ได้เปิดแบบ Kiosk ให้คลิกหนึ่งครั้งที่ใดก็ได้บนจอเพื่อเข้าโหมดเต็มจอ หรือกด F11
- **หน้าต่าง `/tv` ต้องเป็นหน้าต่างที่ active อยู่** เครื่องสแกน USB จึงจะใช้งานได้ หลังเปิดให้คลิกที่หน้าจอหนึ่งครั้ง และอย่าเปิดหน้าต่างอื่นบนเครื่องนั้น
- หน้านี้ขอ Screen Wake Lock เพื่อไม่ให้จอดับ แต่ควรปิดโหมดพักเครื่องและภาพพักหน้าจอของระบบปฏิบัติการด้วย
- รูปสินค้าจะถูกโหลดล่วงหน้าตั้งแต่เปิดหน้า และรายการสินค้าจะรีเฟรชทุก 60 วินาที สินค้าที่เพิ่มระหว่างงานจึงแสดงได้โดยไม่ต้องรีโหลดหน้า

## 5. ทดสอบการสแกนทั้งสองแบบ

บาร์โค้ดตัวอย่าง (EAN-13 ที่ถูกต้องตามมาตรฐาน):

| บาร์โค้ด         | สินค้า                          | ราคา    |
| --------------- | ------------------------------ | ------- |
| `8850001000019` | AERO X PRO Wireless Headphones | ฿12,900 |
| `8850001000026` | NEXA Smart Watch S3 (มีวิดีโอ)  | ฿8,990  |
| `8850001000033` | LUMA 4K Mini Projector         | ฿24,500 |
| `8850001000040` | VOLT 65W GaN Charger           | ฿1,290  |
| `8850001000057` | ARC Mechanical Keyboard        | ฿3,490  |

ถ้าต้องการพิมพ์โค้ดไว้ทดสอบ ให้นำตัวเลขเหล่านี้ไปสร้าง QR code หรือบาร์โค้ด EAN-13 ด้วยเครื่องมือสร้างโค้ดทั่วไป

### วิธี A: เครื่องสแกน USB (แบบ keyboard wedge)

1. เสียบเครื่องสแกนเข้ากับคอมที่ต่อทีวี แล้วเปิด `/tv` ให้หน้าต่างนั้น active อยู่
2. สแกนโค้ด สินค้าควรขึ้นจอพร้อมแอนิเมชันภายใน 1 วินาที ระบบจะแสดงผลบนเครื่องทันทีก่อน แล้วค่อยบันทึกลง `tv_state`
3. สแกนโค้ดเดิมซ้ำ วงนับถอยหลังจะเริ่มนับ 30 ใหม่ และกรอบจอจะกะพริบสีแดง
4. สแกนโค้ดที่ไม่มีในระบบ เช่นบาร์โค้ดสินค้าทั่วไป จอจะขึ้น **PRODUCT NOT FOUND** 3 วินาที แล้วกลับหน้ารอสแกน
5. ถ้าไม่มีเครื่องสแกน ให้จำลองการสแกนได้ที่ DevTools Console ของหน้า `/tv`

   ```js
   for (const k of [..."8850001000019", "Enter"]) {
     window.dispatchEvent(new KeyboardEvent("keydown", { key: k }));
     await new Promise((r) => setTimeout(r, 5));
   }
   ```

   การพิมพ์ด้วยมือจะถูกละเว้นโดยตั้งใจ ถ้าแต่ละปุ่มห่างกันเกิน 50 มิลลิวินาที ระบบจะล้างค่าที่พิมพ์ไว้

> การตั้งค่าเครื่องสแกน: เครื่องต้องส่งปุ่ม **Enter** ต่อท้ายทุกครั้ง ซึ่งเครื่องส่วนใหญ่ตั้งไว้แบบนี้อยู่แล้ว ระบบอ่านตัวเลขและตัวอักษรอังกฤษจากตำแหน่งปุ่มจริงบนแป้นพิมพ์ จึงสแกนได้ถูกต้องแม้คอมตั้งภาษาไทยไว้ แต่ถ้าบาร์โค้ดมีสัญลักษณ์พิเศษ เช่น `-` หรือ `/` แนะนำให้สลับคอมเป็นภาษาอังกฤษ

### วิธี B: สแกนด้วยมือถือ

1. เปิด `https://YOUR-APP.vercel.app/scanner` บนมือถือ กด **START CAMERA** แล้วอนุญาตให้ใช้กล้อง
2. เล็งกล้องไปที่ QR code หรือบาร์โค้ด มือถือจะสั่นและมีเสียงบี๊บ แล้วแสดงการ์ดยืนยัน ทีวีจะเปลี่ยนภายในประมาณ 1 วินาทีผ่าน Realtime
3. ส่วนหัวของหน้าจะแสดงสถานะจอ คือ `กำลังแสดง · <ชื่อสินค้า>` หรือ `ว่าง (หน้ารอสแกน)` และจะเปลี่ยนเป็น "ว่าง" เองเมื่อครบ 30 วินาที
4. ถ้ากล้องใช้ไม่ได้ ให้ใช้ช่อง **กรอกบาร์โค้ดเอง** หรือกดเลือกจาก **รายการสินค้า** ปุ่ม **RESET TV** จะพาจอกลับหน้ารอสแกนทันที
5. ถ้าสแกนโค้ดที่ไม่มีในระบบ มือถือจะแจ้งเตือนข้อผิดพลาด และทีวีจะขึ้นหน้า NOT FOUND

### ทดสอบความทนทาน

- **ปิด Wi-Fi ของคอมทีวีประมาณ 20 วินาทีแล้วเปิดใหม่** บรรทัดสถานะในหน้ารอสแกนจะเปลี่ยนจาก `SYSTEM READY` เป็น `FALLBACK SYNC` หรือ `OFFLINE` แล้วกลับเป็น `SYSTEM READY` เมื่อเชื่อมต่อ Realtime ใหม่ได้ ระบบจะลองเชื่อมใหม่โดยรอนานขึ้นทีละขั้น สูงสุด 15 วินาที
- ระบบดึงค่า `tv_state` ทุก 5 วินาทีด้วย การสแกนจึงยังไปถึงทีวีแม้ Realtime จะหลุด
- เครื่องสแกน USB ยังใช้งานได้แม้ไม่มีอินเทอร์เน็ต สำหรับสินค้าที่โหลดไว้ในเครื่องแล้ว

## หลักการทำงาน

```
เครื่องสแกน USB ─keydown─▶ /tv ──(แสดงผลทันทีบนเครื่อง)──▶ จอ
                              └─อัปเดต tv_state──┐
/scanner (มือถือ) ──อัปเดต tv_state──────────────┤
                                                 ▼
                          Supabase tv_state (id=1)  ──Realtime UPDATE──▶ /tv, /scanner
                                                 ▲              (+ ดึงค่าสำรองทุก 5 วิ)
/tv นับถอยหลังครบ ─รีเซ็ตเป็น null แบบมีเงื่อนไข┘
```

- **แหล่งข้อมูลหลักมีที่เดียว** คือแถว `tv_state` ที่ `id = 1` ทุกการสแกนจะเขียน `updated_at` ใหม่ แม้เป็นบาร์โค้ดเดิม และค่าใหม่นี้ทำให้การนับถอยหลังเริ่มใหม่
- **ไม่เล่นแอนิเมชันซ้ำ** ทีวีจะจดค่าที่ตัวเองกำลังจะเขียนไว้ก่อน เมื่อ Supabase ส่งค่าเดียวกันกลับมา ทีวีจะไม่เล่นทรานซิชันซ้ำ
- **รีเซ็ตอย่างปลอดภัย** เมื่อนับถอยหลังครบ ทีวีจะตั้ง `current_barcode_id = null` เฉพาะเมื่อ `updated_at` ยังไม่เปลี่ยน ถ้ามือถือสแกนเข้ามาพอดีในจังหวะนั้น การสแกนนั้นจะไม่หายไป
- **โค้ดที่ไม่มีในระบบจากมือถือ** เขียนลง `current_barcode_id` ไม่ได้ เพราะคอลัมน์นี้มี foreign key ไปที่ `products` มือถือจึงส่งข้อความ **broadcast** (`not_found`) ผ่าน Realtime channel เดียวกันแทน แล้วทีวีจะแสดงหน้า not-found

## โครงสร้างโปรเจกต์

```
app/
  layout.tsx            ฟอนต์ (Orbitron / Rajdhani / IBM Plex Sans Thai) และเลเยอร์เส้นสแกนทั้งจอ
  globals.css           ยูทิลิตี้ของธีม: ตัวอักษรเรืองแสง, แผง HUD, เอฟเฟกต์ glitch, เส้นสแกน
  page.tsx              หน้าเลือกเปิด /tv หรือ /scanner
  tv/page.tsx           ลำดับสถานะของทีวี: standby → transition → product | not_found
  scanner/page.tsx      หน้าสแกนบนมือถือ
components/tv/          StandbyScreen, ScanTransition, ProductScreen, NotFoundScreen,
                        CountdownRing, ParticleField, TvCanvas (ย่อขยายแคนวาส 1920×1080)
components/scanner/     Toasts (ข้อความแจ้งเตือน)
hooks/                  useBarcodeScanner, useTvState, useQrScanner, useWakeLock
lib/                    Supabase client และคำสั่งดึงข้อมูล, types, config, ตัวจัดรูปแบบ, เสียง/การสั่น
supabase/schema.sql     schema, Realtime, RLS, ข้อมูลตัวอย่าง
```
