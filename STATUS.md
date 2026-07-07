# TradeMethod — Status

מסמך חי, מחולק ל**קטגוריות ממוספרות**. כל קטגוריה = תחום עבודה, וכל פריט בתוכה ממוספר
(למשל `7.2`) כדי שיהיה קל להתייחס אליו ולשנות בעתיד. סימון: `[x]` בוצע · `[ ]` מתוכנן.
יומן הסבבים הכרונולוגי נמצא בסוף.

---

## 0. סקירה כללית (Overview)

- **0.1 אתר חי:** Vercel — `trade-method.vercel.app` (כניסה מייל+סיסמה, מכל מכשיר)
- **0.2 קוד:** GitHub `github.com/ilaid/trade-journal` · ענף `main` (push = פריסה אוטומטית)
- **0.3 מסד נתונים:** Supabase project `utsszwbemheztqobzcjw`
- **0.4 סטאק:** React 18 + Vite · Supabase (Auth/DB/Storage) · Recharts · PapaParse
- **0.5 גישה:** טוקן GitHub (`ghp_TB2my…`, תקף שנה) · מפתחות Supabase ב-Vercel Env Vars

---

## 1. תשתית ופריסה (Infrastructure)

- **1.1** [x] פרויקט Vite + React מודולרי
- **1.2** [x] פריסה אוטומטית ב-Vercel מ-`main`
- **1.3** [x] משתני סביבה (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- **1.4** [ ] דומיין אישי

## 2. מסד נתונים (Database)

- **2.1** [x] סכימה מנורמלת: `instruments`, `contracts`, `trades`, `trade_exits`, `tags`, `trade_tags`, `day_notes`, `trade_screenshots`
- **2.2** [x] RLS לכל טבלה (scoping ל-`auth.uid()`)
- **2.3** [x] RPC אטומי `save_trade`
- **2.4** [x] קבצי SQL: `schema.sql`, `0002_normalize_schema.sql`, `0003_screenshots.sql`
- **2.5** [x] טבלת `user_settings` (JSONB) — `sql/0004` ✅ *הורץ ב-Supabase*
- **2.6** [x] טבלת `playbooks` — `sql/0005` ✅ *הורץ ב-Supabase*
- **2.7** ℹ️ כל המיגרציות (`schema.sql`, `0002`–`0005`) רצו בהצלחה במסד החי.

## 3. עיצוב ומיתוג (Design & Branding)

- **3.1** [x] Theme בהיר "צפחה + אינדיגו" עם טוקני CSS
- **3.2** [x] פונט Inter (גוף) + Syne (כותרות)
- **3.3** [x] שם המערכת: **TradeMethod** (כותרת, התחברות, טאב דפדפן)
- **3.4** [ ] מצב כהה (Dark mode) עם מתג
- **3.5** [ ] אייקון/פאביקון מותאם

## 4. התחברות ומשתמשים (Auth)

- **4.1** [x] הרשמה/כניסה מייל+סיסמה (Supabase Auth)
- **4.2** [x] בידוד נתונים מלא לכל משתמש

## 5. דשבורד (Dashboard)

- **5.1** [x] יעד חודשי + פס התקדמות
  - 5.1.1 [x] סנכרון היעד בין מכשירים (Supabase + fallback ל-localStorage)
- **5.2** [x] כרטיסי KPI (P&L, Win Rate, Trades, Profit Factor, Avg R:R)
- **5.3** [x] עקומת הון (Equity Curve)
- **5.4** [x] P&L יומי (עמודות) + Win/Loss donut + רצפים
- **5.5** [x] עסקאות אחרונות

## 6. לוח שנה (Calendar)

- **6.1** [x] טאב נפרד עם תאים מרווחים
- **6.2** [x] פופאפ יומי (עסקאות + הערת יום)

## 7. אנליטיקה (Analytics)

- **7.1** [x] KPIs + ממוצעים (יומי/שבועי/חודשי)
- **7.2** [x] Key Statistics (Expectancy, Avg Win/Loss, Payoff, הכי טוב/גרוע, רצפים)
- **7.3** [x] ביצועים שנתיים + חודשיים
- **7.4** [x] תדירות טעויות
- **7.5** [ ] Heatmap לפי יום/שעה
- **7.6** [ ] החלת מסננים גם על האנליטיקה

## 8. עסקאות (Trades)

- **8.1** [x] טופס 4 שלבים (פרטים · פסיכולוגיה · רפלקציה · סקירה)
- **8.2** [x] יציאות חלקיות + חישוב P&L ו-R:R
- **8.3** [x] תגיות/סטאפים + אירועים כלכליים
- **8.4** [x] **מסננים** (מכשיר · כיוון · תגית · תוצאה · טווח תאריכים)
- **8.5** [x] ייבוא CSV מברוקר
- **8.6** [x] צילומי מסך לעסקה
- **8.7** [x] מכשירים מרובים + מותאמים אישית

## 8א. פלייבוק (Playbook)

- **8א.1** [x] טאב אסטרטגיות + CRUD (שם, צבע, תיאור, כללי כניסה/יציאה, הערות)
- **8א.2** [ ] קישור עסקה לאסטרטגיה (playbook_id על trades)

## 8ב. ייבוא אוטומטי (Auto-Import)

- **8ב.1** [x] Webhook endpoint (`api/ingest.js`) — Vercel serverless שמקבל POST, מזהה משתמש לפי טוקן אישי, מחשב P&L ו-R:R, וכותב עסקה עם Service Role.
- **8ב.2** [x] מזהה שדות גמיש (symbol/ticker, buy→Long/sell→Short, entry/exit/stop/target, contracts/position_size, pnl, external_id) + ניקוי סימבול (`CME_MINI:ES1!`→`ES`).
- **8ב.3** [x] UI ב-Settings (`AutoImportCard`) — טוקן אישי נוצר אוטומטית, כתובת webhook עם העתקה + Regenerate, והוראות TradingView + תבנית JSON.
- **8ב.4** [x] טוקן נשמר ב-`user_settings.data.webhook_token` (עם fallback ל-localStorage).
- **8ב.5** ⚠️ דורש הגדרה חד-פעמית ב-Vercel: `SUPABASE_SERVICE_ROLE_KEY` (+ `SUPABASE_URL`) ב-Env Vars.
- **8ב.6** [x] **מחבר Tradovate אמיתי (fills)** — טבלת `broker_connections` (`sql/0006`), צינור כתיבה משותף `api/_lib/trade.js` (גם TradingView וגם Tradovate עוברים דרכו), עוזר REST `api/_lib/tradovate.js`, endpoints `api/tradovate/connect.js` + `api/tradovate/sync.js`, כרטיס "חבר Tradovate" ב-Settings (Demo/Live, בדיקת חיבור, "סנכרן עכשיו", ניתוק).
  - 8ב.6.1 [x] מניעת כפילויות דרך `external_id = tv-fp-<fillPairId>` (האינדקס הייחודי הקיים).
  - 8ב.6.2 [x] תזמון אוטומטי דרך Supabase pg_cron (`sql/0007`) — כי Vercel חינמי מריץ cron רק פעם ביום.
  - 8ב.6.3 ⚠️ דורש env ב-Vercel: `SUPABASE_SERVICE_ROLE_KEY` + `SYNC_SECRET`; ולחשבון Tradovate צריכה להיות "גישת API".
  - 8ב.6.4 [ ] בדיקה חיה — ממתין לחשבון ממומן; בינתיים דרך Tradovate Demo או mock.
- **8ב.7** [ ] מחברים נוספים (NinjaTrader add-on מקומי, OAuth ל-Tradovate) — בהמשך.

## 8ג. אזור בק-טסט (Backtest)

- **8ג.1** [x] טבלת `backtest_folders` + עמודה `trades.backtest_folder_id` (`sql/0008`) — NULL = יומן חי.
- **8ג.2** [x] כרטיס אזור בק-טסט (`BacktestArea`) — רשימת תיקיות שטוחה (יצירה/שינוי שם/מחיקה/פתיחה) בכפתור ⏪.
- **8ג.3** [x] תצוגת תיקייה: לוח שנה (רכיב `Calendar` בשימוש חוזר) + סיכום (P&L כולל · מספר עסקאות · Win Rate) + פופאפ יום.
- **8ג.4** [x] ניתוב יבוא: "תיקייה פעילה" נשמרת ב-`user_settings.data.active_backtest_folder_id`; `api/ingest.js` מכניס עסקאות מיובאות לתיקייה הפעילה (או ליומן החי אם אין).
- **8ג.5** [x] כל תכונות העסקה (תגיות, הערות, צילומי מסך) עובדות גם בתיקייה. מחיקת תיקייה מוחקת את עסקאותיה (cascade).
- **8ג.6** [x] תמונה לעסקה בלחיצה על תאריך — שורת תמונות קלה ב-`DayPopup` (בשימוש חוזר של `screenshots.js`), עובד ביומן ובבק-טסט.
- **8ג.7** ⚠️ דורש הרצת `sql/0008` ב-Supabase.

## 9. Backlog (לפי סדר עדיפות)

- **9.1** [ ] קישור עסקאות לפלייבוק (playbook_id על trades)
- **9.2** [ ] Heatmap ביצועים לפי יום/שעה
- **9.3** [ ] ניהול סיכונים (מחשבון גודל פוזיציה, מגבלת הפסד יומי)
- **9.4** [ ] דוח/ייצוא PDF · דומיין אישי · PWA (אייקון למסך הבית)
- **9.5** [~] מצב כהה — *נדחה לבקשת המשתמש (לא נחוץ כרגע)*

## 10. הערות ואזהרות (Notes)

- **10.1** ערכי הטיק של CL/GC/YM/RTY/6E הם ערכי התחלה — לאמת מול הבורסה לפני P&L אמיתי.
- **10.2** היעד החודשי נשמר מקומית (per-device) עד סבב הסנכרון.
- **10.3** ייבוא אוטומטי דורש `SUPABASE_SERVICE_ROLE_KEY` ב-Vercel + תוכנית TradingView שתומכת ב-Webhook alerts.

---

## 🗒️ יומן סבבים (Session Log)

- **סבב 1 — יסודות:** פרויקט Vite, סכימה מנורמלת, RPC, ייבוא CSV, צילומי מסך, מכשירים.
- **סבב 2 — עיצוב וגרפים:** theme בהיר "צפחה + אינדיגו" + עקומת הון / P&L יומי / Win-Loss.
- **סבב 3 — ארגון מסך:** לוח שנה לטאב נפרד, ממוצעים ל-Analytics, יעד חודשי.
- **סבב 4 — סטטיסטיקות:** כרטיס Key Statistics.
- **סבב 5 — מיתוג:** שם TradeMethod + מסמך STATUS.
- **סבב 6 — מסננים:** מסנני עסקאות (מכשיר/כיוון/תגית/תוצאה/תאריך) בטאב Trades + הבניית STATUS לקטגוריות ממוספרות.
- **סבב 7 — סנכרון יעד:** טבלת `user_settings` + היעד החודשי מסונכרן בענן (עם fallback ל-localStorage).
- **סבב 8 — פלייבוק:** טאב אסטרטגיות עם CRUD מלא (טבלת `playbooks`).
- **סבב 9 — הרצת מיגרציות + פיווט:** המשתמש הריץ `0004`+`0005` בהצלחה (יעד ופלייבוק חיים בענן). מצב כהה נדחה. עוברים לחלק חדש בפרויקט.
- **סבב 10 — ייבוא אוטומטי (TradingView):** Webhook endpoint (`api/ingest.js`) + כרטיס Auto-Import ב-Settings — קישור אישי חד-פעמי, וכל עסקה שהאסטרטגיה מפעילה ב-TradingView נכנסת ליומן אוטומטית. נשאר: המשתמש מוסיף `SUPABASE_SERVICE_ROLE_KEY` ב-Vercel ומדביק את הקישור+JSON ב-alert.
- **סבב 12 — אזור בק-טסט:** תיקיות בק-טסט (`sql/0008`) עם לוח שנה + סיכום P&L לכל תיקייה, ניתוב יבוא TradingView לתיקייה "פעילה" (ולא ליומן החי), ותמונה לעסקה בלחיצה על תאריך ב-`DayPopup`. הצינור המשותף (`importTrade`) מקבל `backtestFolderId`.
- **סבב 11 — מחבר Tradovate אמיתי:** ריפקטור לצינור כתיבה משותף (`api/_lib/trade.js`) + מחבר Tradovate מלא (טבלה, עוזר REST, connect/sync, כרטיס Settings, pg_cron). מושך עסקאות סגורות (fillPairs) עם P&L אמיתי ומכניס ליומן, עם מניעת כפילויות. TradingView נשאר למסלול הבק-טסט. בדיקה חיה ממתינה לחשבון ממומן (בינתיים Demo/mock). דחיפה ל-`main` חסומה במדיניות הארגון (GitHub App לא מחובר) — הפריסה ממתינה לאישור push ישיר או חיבור ה-App.
