const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const db = new Database('massar.db');

console.log('🔍 جاري فحص الجداول...');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('الجداول الموجودة:', tables.map(t => t.name));

// فحص كل الأعمدة النصية في كل جدول وتصحيح الرقم الخاطئ
tables.forEach(t => {
  const table = t.name;
  let cols = [];
  try {
    cols = db.prepare(`PRAGMA table_info(${table})`).all();
  } catch (e) {
    return;
  }
  cols.forEach(col => {
    if (col.type && (col.type.includes('CHAR') || col.type.includes('TEXT') || col.type.includes('VARCHAR') || col.type.includes('CLOB'))) {
      const colName = col.name;
      try {
        // استبدال الرقم الخاطئ 6011111134716 بالرقم الصحيح 601111134716
        const updateSql = `UPDATE ${table} SET ${colName} = REPLACE(${colName}, '6011111134716', '601111134716') WHERE ${colName} LIKE '%6011111134716%'`;
        const result = db.prepare(updateSql).run();
        if (result.changes > 0) {
          console.log(`✅ تم التحديث في جدول ${table} - عمود ${colName} (عدد السجلات: ${result.changes})`);
        }
      } catch (e) {
        // تجاهل الأخطاء في الأعمدة التي لا يمكن تحديثها
      }
    }
  });
});

db.close();
console.log('✅ تم فحص وتصحيح قاعدة البيانات بنجاح!');
