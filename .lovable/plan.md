## Phase 4 — Roadmap الكامل (10 ميزات / 4 دفعات)

### الدفعة 1 — اكتمال الحساب والـ Profile
1. **صفحة `/profile`** — تغيير الإيميل، تغيير كلمة السر، حذف الحساب (مع تأكيد).
2. **نسيت كلمة السر** على `/login` — تدفق reset عبر إيميل Supabase.
3. **زرار خروج صريح** + عرض الإيميل في الهيدر.

### الدفعة 2 — PWA + تذكيرات + مشاركة
4. **PWA installable** — `manifest.json` فقط (بدون service worker — حسب قواعد Lovable)، أيقونات، `display: standalone`، theme-color متغير حسب الثيم.
5. **تذكيرات داخلية** — جدول `reminders` (user_id, title, due_at, kind) + بانر في الهوم بتذكيرات اليوم/الأسبوع. Browser `Notification API` لو المستخدم سمح.
6. **Share Achievement Card** — يولّد صورة PNG من كارت (GPA + المستوى + الجامعة) باستخدام `html-to-image`، زرار "شارك" مع Web Share API + تحميل.

### الدفعة 3 — تعميق الـ AI
7. **AI Chat tab** — محادثة مفتوحة (بديل زرار "اسأل المستشار") تستخدم streaming server-fn على Gemini 2.5 Flash، تحفظ سياق المحادثة في الذاكرة + خيار "مسح".
8. **Multi-Semester Roadmap** — تاب جديد "خريطة التخرج": AI يقترح توزيع الساعات المتبقية على الفصول حتى التخرج بناءً على المستوى الحالي + الهدف، مع GPA متوقع لكل فصل.

### الدفعة 4 — أكاديميات متقدمة
9. **Retake Tracker** — في جدول المواد: علامة "إعادة" تربط مادة بنسختها القديمة، يحسب التحسّن، ويعدّل CGPA بقاعدة جامعة بنها (آخر تقدير يحل محل القديم).
10. **Smart Course Loader** — قبل إضافة كورس: تنبيه لو الساعات المختارة تتجاوز الحد المسموح حسب CGPA الحالي (≥3.0: 21، 2.0–3.0: 18، إنذار: 14).
11. **مقارنة فصول Side-by-side** — في تاب "الرسوم": اختيار فصلين وعرض جدول مقارنة (GPA، عدد المواد، أعلى/أقل درجة، التحسن).

---

### تغييرات تقنية (للمرجع)

**DB migrations:**
- `reminders` (id, user_id, title, body, due_at, kind, done, RLS).
- `courses.retake_of` (uuid nullable, FK ذاتي للكورس الأصلي).

**ملفات جديدة:**
- `src/routes/_authenticated/profile.tsx`
- `src/routes/forgot-password.tsx` + `src/routes/reset-password.tsx`
- `src/lib/reminders.functions.ts`
- `src/lib/chat.functions.ts` (streaming async generator)
- `src/lib/roadmap.functions.ts`
- `src/components/gpa/AchievementCard.tsx`
- `src/components/gpa/ChatTab.tsx`
- `src/components/gpa/RoadmapTab.tsx`
- `src/components/gpa/CompareSemesters.tsx`
- `public/manifest.json` + أيقونات
- تعديل `__root.tsx` لإضافة link to manifest

**حزم جديدة:** `html-to-image`.

**حدود الجلسة:** كل دفعة في رسالة منفصلة (1500–2500 سطر تعديل تقريبًا).

---

### تأكيد قبل التنفيذ
- نبدأ بـ **الدفعة 1** بعد الموافقة، أم ترتيب مختلف؟
- التذكيرات: داخلية فقط (في التطبيق) أم نضيف Web Push notifications كمان؟ (Web Push يحتاج VAPID keys).
