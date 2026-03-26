const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const DB_FILE = path.join(__dirname, 'wishes.json');

// Initialize JSON DB
if (!fs.existsSync(DB_FILE)) {
    const initialData = [
        { name: "Budi Santoso", status: "Hadir", msg: "Selamat menempuh hidup baru Zabiq & Liana. Semoga samawa!" },
        { name: "Siska", status: "Tidak Hadir", msg: "Maaf belum bisa hadir, doa terbaik untuk kalian berdua yaa." },
        { name: "Testing Agent", status: "Hadir", msg: "Ini tes otomatis masuk database" } // Preserved from previous test!
    ];
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}

const server = http.createServer((req, res) => {
    // API Route for Wishes
    if (req.url === '/api/wishes') {
        // Basic CORS handling just in case
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        if (req.method === 'GET') {
            fs.readFile(DB_FILE, 'utf8', (err, data) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Database error' }));
                    return;
                }

                let wishes = [];
                try {
                    wishes = JSON.parse(data);
                } catch (e) { }

                // Return reversed to show newest first!
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify([...wishes].reverse()));
            });
            return;
        }

        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    const newWish = JSON.parse(body);
                    fs.readFile(DB_FILE, 'utf8', (err, data) => {
                        let wishes = [];
                        if (!err) {
                            try { wishes = JSON.parse(data); } catch (e) { }
                        }

                        // Push new wish to array
                        wishes.push({
                            name: newWish.name || '',
                            status: newWish.status || '',
                            msg: newWish.msg || ''
                        });

                        fs.writeFile(DB_FILE, JSON.stringify(wishes, null, 2), (err) => {
                            if (err) {
                                res.writeHead(500, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'Could not save message' }));
                                return;
                            }
                            res.writeHead(201, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ status: 'success' }));
                        });
                    });
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid JSON request' }));
                }
            });
            return;
        }
    }

    // Serve static HTML/CSS/JS file routing
    let filePath = req.url;
    if (filePath === '/') {
        filePath = '/index.html';
    }

    // Safety check to prevent directory traversal
    filePath = filePath.replace(/\.\./g, '');
    const extname = String(path.extname(filePath)).toLowerCase();

    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.mp3': 'audio/mpeg',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(path.join(__dirname, filePath), (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code + ' ..\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });

});

server.listen(PORT, () => {
    console.log(`Node.js API & Static Server running at http://localhost:${PORT}`);
    console.log(`Database initialized at ${DB_FILE}`);
});
