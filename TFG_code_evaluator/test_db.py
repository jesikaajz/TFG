from db import get_connection

conn = get_connection()
cursor = conn.cursor()

cursor.execute("SELECT * FROM users")

rows = cursor.fetchall()

for row in rows:
    print(row)

cursor.close()
conn.close()