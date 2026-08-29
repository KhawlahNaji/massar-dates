import sqlite3
conn = sqlite3.connect('massar.db')
cur = conn.cursor()
cur.execute("UPDATE contacts SET phone = '+601111134716' WHERE phone = '011111134716'")
conn.commit()
print("DB Updated")
conn.close()
