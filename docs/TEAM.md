# فريق AI Agents — Full E-Commerce (NestJS)

هؤلاء **موظفو AI** داخل Cursor (Custom Subagents)، وليس مجرد أسماء توثيقية.
كل عضو ملف في `.cursor/agents/` ويمكن استدعاؤه مباشرة.

---

## كيف تستخدم الفريق

```text
/adel خطط ميزة الطلبات ووزّع المهام
/mahmoud نفّذ تسجيل الدخول والصلاحيات
/sara أضف وحدة المنتجات
/ahmed نفّذ السلة والطلبات
/fatima تحقق أن الدفع النقدي يشتغل
```

أو اطلب بالعربية بشكل طبيعي، مثل: «خلّي عادل يخطط ثم سارة تنفّذ الكتالوج».

---

## الهيكل التنظيمي

```
                    عادل (/adel) — مدير المشروع
                              │
              ┌───────────────┼───────────────┐
              │               │               │
     ياسر (/yasser)   نورة (/noura)   كريم (/karim)
      محلل أعمال         UI/UX         قائد تقني
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
    Backend Agents       Frontend Agents      الجودة والتشغيل
```

---

## الإدارة والقيادة

| Agent | الاسم | الدور | الملف |
|-------|------|--------|-------|
| `/adel` | عادل | مدير المشروع | `.cursor/agents/adel.md` |
| `/karim` | كريم | قائد تقني | `.cursor/agents/karim.md` |

---

## تحليل وتصميم

| Agent | الاسم | الدور | الملف |
|-------|------|--------|-------|
| `/yasser` | ياسر | محلل أعمال | `.cursor/agents/yasser.md` |
| `/noura` | نورة | مصممة UI/UX | `.cursor/agents/noura.md` |

---

## Backend Agents (NestJS + MongoDB)

| Agent | الاسم | التخصص | الملف |
|-------|------|----------|-------|
| `/mahmoud` | محمود | Auth / Users / Security | `.cursor/agents/mahmoud.md` |
| `/sara` | سارة | Categories / Brands / Products / Suppliers | `.cursor/agents/sara.md` |
| `/ahmed` | أحمد | Cart / Coupons / Orders / Tax / Payment | `.cursor/agents/ahmed.md` |
| `/hend` | هند | Reviews / Request Product / DTOs / Swagger | `.cursor/agents/hend.md` |

---

## Frontend Agents

| Agent | الاسم | التخصص | الملف |
|-------|------|----------|-------|
| `/mona` | منى | واجهة المتجر | `.cursor/agents/mona.md` |
| `/omar` | عمر | لوحة الأدمن | `.cursor/agents/omar.md` |
| `/layla` | ليلى | تكامل API والحالة المشتركة | `.cursor/agents/layla.md` |

---

## الجودة والتشغيل

| Agent | الاسم | الدور | الملف |
|-------|------|--------|-------|
| `/fatima` | فاطمة | QA | `.cursor/agents/fatima.md` |
| `/khaled` | خالد | DevOps | `.cursor/agents/khaled.md` |
| `/reem` | ريم | توثيق تقني | `.cursor/agents/reem.md` |

---

## توزيع الوحدات

| الوحدة | المسؤول | الداعم |
|--------|----------|--------|
| Users & Auth | محمود | هند |
| Category / SubCategory / Brand | سارة | هند |
| Product / Suppliers | سارة | أحمد |
| Review / Request Product | هند | سارة |
| Cart / Coupon | أحمد | محمود |
| Order / Tax / Payment | أحمد | كريم |
| واجهة المتجر | منى | ليلى |
| لوحة الأدمن | عمر | منى |
| الاختبارات | فاطمة | الفريق |
| النشر | خالد | كريم |
| التوثيق | ريم | هند |

---

## سير القبول

1. **ياسر** يثبّت المتطلبات ومعايير القبول  
2. التنفيذ عبر الوكيل المختص  
3. **فاطمة** تختبر  
4. **عادل** يغلق المهمة  

> المرجع التقني للمتطلبات: `docs/1-Requirements-ex.docx`  
> تعليمات المشروع العامة: `AGENTS.md`
