const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('massar.db');

db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, tables) => {
  if (err) { console.error(err); return; }
  tables.forEach(t => {
    const table = t.name;
    db.get(`SELECT * FROM "${table}" WHERE phone = '011111134716'`, (e, row) => {
      if (row) {
        console.log('FOUND IN: ' + table);
        db.run(`UPDATE "${table}" SET phone = '+601111134716' WHERE phone = '011111134716'`, (err2) => {
          if (!err2) console.log('UPDATED: ' + table);
          else console.error('Error update:', err2);
        });
      }
    });
  });
  setTimeout(() => { db.close(); console.log('FINISHED'); }, 1500);
});
