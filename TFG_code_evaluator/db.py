import psycopg2

def get_connection():
    conn = psycopg2.connect(
        host="localhost",
        database="Database_TFG",
        user="postgres",
        password="postgres",
        port="5432"
    )
    
    return conn