#!/usr/bin/env python3
"""
Simple HTTP server for serving the ChemSnap frontend files
with CORS headers for proper API interaction with the Node.js backend.
"""

import http.server
import socketserver
import os
import sys

PORT = 8080  # Use a different port than the Node.js backend

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom request handler with CORS headers"""
    
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With')
        super().end_headers()
    
    def do_OPTIONS(self):
        # Handle OPTIONS requests for CORS preflight
        self.send_response(200)
        self.end_headers()

def run_server():
    """Run the HTTP server"""
    handler = CORSHTTPRequestHandler
    
    # Try to create the server
    try:
        with socketserver.TCPServer(("", PORT), handler) as httpd:
            print(f"Starting ChemSnap frontend server at http://localhost:{PORT}")
            print(f"Backend API should be running at http://localhost:8002")
            print("Press Ctrl+C to stop")
            httpd.serve_forever()
    except OSError as e:
        if e.errno == 98 or e.errno == 48:  # Address already in use
            print(f"ERROR: Port {PORT} is already in use.")
            print(f"Please kill any process using port {PORT} and try again.")
            sys.exit(1)
        else:
            raise

if __name__ == "__main__":
    # Print some helpful information
    print("ChemSnap Frontend Server")
    print("------------------------")
    print(f"Current directory: {os.getcwd()}")
    
    # Check if important files exist
    required_files = ["index.html", "app.js", "styles.css"]
    missing_files = [f for f in required_files if not os.path.exists(f)]
    
    if missing_files:
        print(f"WARNING: The following required files are missing: {', '.join(missing_files)}")
        print("Make sure you're running this script from the project root directory.")
    
    # Run the server
    run_server() 