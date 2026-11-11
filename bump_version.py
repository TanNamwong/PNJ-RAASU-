#!/usr/bin/env python3
"""ใช้: python3 bump_version.py 1.0.1 "รายละเอียดการอัพเดท"
อัพเดทเลขเวอร์ชันใน sw.js, app.js และ version.json พร้อมกัน แล้วนำไฟล์ขึ้นโฮสต์ใหม่ ผู้ใช้จะเห็นแจ้งเตือนอัพเดท"""
import re, sys, json, pathlib
v = sys.argv[1]; notes = sys.argv[2] if len(sys.argv) > 2 else ''
d = pathlib.Path(__file__).parent
for f, pat in (('sw.js', r"const VERSION = '[^']*'"), ('app.js', r"const APP_VERSION = '[^']*'")):
    p = d / f; s = p.read_text(encoding='utf-8')
    name = 'VERSION' if f == 'sw.js' else 'APP_VERSION'
    p.write_text(re.sub(pat, f"const {name} = '{v}'", s), encoding='utf-8')
(d / 'version.json').write_text(json.dumps({'version': v, 'notes': notes}, ensure_ascii=False) + '\n', encoding='utf-8')
print('ตั้งเวอร์ชันเป็น', v)
