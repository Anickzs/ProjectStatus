#!/usr/bin/env python3
"""
Custom HTTP server for ProjectStatus web application.
Handles broken pipe errors gracefully and provides better logging.
"""

import http.server
import socketserver
import os
import sys
from urllib.parse import urlparse
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('server.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom HTTP request handler with better error handling."""
    
    def log_message(self, format, *args):
        """Override to use our logging configuration."""
        logging.info(f"{self.address_string()} - {format % args}")
    
    def handle_one_request(self):
        """Override to handle broken pipe errors gracefully."""
        try:
            super().handle_one_request()
        except BrokenPipeError:
            # This is normal when browsers close connections
            logging.debug("Broken pipe - client disconnected")
        except ConnectionResetError:
            # This is also normal when browsers reset connections
            logging.debug("Connection reset - client disconnected")
        except Exception as e:
            logging.error(f"Unexpected error: {e}")
    
    def end_headers(self):
        """Add CORS headers for development."""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_GET(self):
        """Handle GET requests with better error handling."""
        try:
            # Parse the URL
            parsed_url = urlparse(self.path)
            path = parsed_url.path
            
            # Log the request
            logging.info(f"GET request: {path}")
            
            # Handle favicon requests gracefully
            if path == '/favicon.ico':
                self.send_response(204)  # No content
                self.end_headers()
                return
            
            # Serve the file normally
            super().do_GET()
            
        except BrokenPipeError:
            logging.debug("Broken pipe during GET request")
        except Exception as e:
            logging.error(f"Error handling GET request: {e}")
            self.send_error(500, "Internal Server Error")

def run_server(port=8000):
    """Run the custom HTTP server."""
    try:
        with socketserver.TCPServer(("", port), CustomHTTPRequestHandler) as httpd:
            logging.info(f"Server started at http://localhost:{port}")
            logging.info("Press Ctrl+C to stop the server")
            httpd.serve_forever()
    except KeyboardInterrupt:
        logging.info("Server stopped by user")
    except Exception as e:
        logging.error(f"Server error: {e}")

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    run_server(port)
