# PNJ-RAASU — PWA

ชุดไฟล์เว็บแอปสำหรับ GitHub Pages รองรับ Android และ iOS (เพิ่มลงหน้าจอโฮม)

## อัปโหลดขึ้น GitHub
1. สร้าง repository ชื่อ `PNJ-RAASU`
2. แตก ZIP แล้วอัปโหลดไฟล์/โฟลเดอร์ทั้งหมดในโฟลเดอร์ `PNJ-RAASU` ไปไว้ที่ root ของ repository
3. ไปที่ Settings → Pages
4. เลือก Deploy from a branch → `main` → `/ (root)` แล้ว Save
5. รอ GitHub Pages เผยแพร่ จากนั้นเปิด URL ด้วย HTTPS

## ติดตั้ง
- Android: เปิด URL ด้วย Chrome → เมนู ⋮ → Install app / Add to Home screen
- iPhone/iPad: เปิด URL ด้วย Safari → Share → Add to Home Screen

## วิธีเผยแพร่อัปเดต
1. แก้ไขไฟล์แอปตามต้องการ
2. เพิ่มค่า `version` ใน `version.json` เช่น `1.0.2`
3. เปลี่ยน `APP_VERSION` ใน `index.html` ให้ตรงกัน
4. แนะนำให้เปลี่ยนชื่อ CACHE ใน `sw.js` เช่น `pnj-raasu-shell-v3`
5. Commit/Push ขึ้น GitHub Pages
6. แอปจะตรวจสอบเวอร์ชันเมื่อเปิดแอป/กลับมาใช้งาน และตรวจซ้ำเป็นระยะขณะเปิดแอป

## ข้อจำกัดแพลตฟอร์ม
- iOS ไม่รองรับ prompt ติดตั้งจากเว็บไซต์ ต้องให้ผู้ใช้กด Share → Add to Home Screen เอง
- การแจ้งเตือนอัปเดตในชุดนี้เป็นการแจ้งในแอปขณะเปิดใช้งาน ไม่ใช่ Push Notification ตอนแอปปิด
- Push Notification จริงต้องมี Push Server, การสมัครรับ push และการตั้งค่าฝั่งเซิร์ฟเวอร์เพิ่มเติม
- PWA ไม่สามารถบังคับอัปเดตโดยไม่ให้ผู้ใช้ยืนยันได้

## ข้อมูลผู้พัฒนา
นายแทน นามวงค์ — รูปประกอบอยู่ที่ `assets/developer.png`

## หมายเหตุสำคัญ
โปรเจกต์นี้ยังเป็น PWA shell/หน้าหลัก เนื่องจากยังไม่มีรายละเอียดฟังก์ชันเฉพาะของ PNJ-RAASU ในคำขอ จึงไม่ได้สมมติหรือสร้างระบบงานเฉพาะขึ้นมาแทนของจริง
