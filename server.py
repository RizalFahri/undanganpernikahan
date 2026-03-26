import http.server
import socketserver
import json
import sqlite3
import os

PORT = 8080
DB_FILE = 'wishes.db'

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS wishes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            status TEXT NOT NULL,
            message TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    # Insert dummy data if empty
    c.execute('SELECT COUNT(*) FROM wishes')
    if c.fetchone()[0] == 0:
        c.execute("INSERT INTO wishes (name, status, message) VALUES ('Budi Santoso', 'Hadir', 'Selamat menempuh hidup baru Rizal & Liana. Semoga samawa!')")
        c.execute("INSERT INTO wishes (name, status, message) VALUES ('Siska', 'Tidak Hadir', 'Maaf belum bisa hadir, doa terbaik untuk kalian berdua yaa.')")
    conn.commit()
    conn.close()

class RequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/wishes':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            try:
                conn = sqlite3.connect(DB_FILE)
                c = conn.cursor()
                c.execute('SELECT name, status, message FROM wishes ORDER BY id DESC')
                wishes = [{'name': row[0], 'status': row[1], 'msg': row[2]} for row in c.fetchall()]
                conn.close()
                self.wfile.write(json.dumps(wishes).encode('utf-8'))
            except Exception as e:
                self.wfile.write(json.dumps([]).encode('utf-8'))
        else:
            return http.server.SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        if self.path == '/api/wishes':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
            except:
                data = {}
            
            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()
            c.execute('INSERT INTO wishes (name, status, message) VALUES (?, ?, ?)', 
                      (data.get('name', ''), data.get('status', ''), data.get('msg', '')))
            conn.commit()
            conn.close()
            
            self.send_response(201)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'success'}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    init_db()
    with socketserver.TCPServer(("", PORT), RequestHandler) as httpd:
        print(f"Server with API running at http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
        httpd.server_close()
