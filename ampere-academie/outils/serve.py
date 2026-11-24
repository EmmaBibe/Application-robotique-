"""Serveur local de développement sans cache : python outils/serve.py [port]"""
import http.server, os, sys
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'app'))
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def log_message(self, *a):
        pass
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8779
http.server.ThreadingHTTPServer(('127.0.0.1', port), H).serve_forever()
