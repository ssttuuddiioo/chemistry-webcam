// Debug utility for ChemSnap
document.addEventListener('DOMContentLoaded', () => {
    // Create a debug container
    const debugContainer = document.createElement('div');
    debugContainer.id = 'debug-container';
    debugContainer.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.8);
        color: #00ff00;
        font-family: monospace;
        font-size: 12px;
        padding: 10px;
        max-height: 200px;
        overflow-y: auto;
        z-index: 9999;
        display: none;
    `;
    document.body.appendChild(debugContainer);

    // Add toggle button
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Debug';
    toggleButton.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 5px 10px;
        cursor: pointer;
        z-index: 10000;
    `;
    document.body.appendChild(toggleButton);
    
    toggleButton.addEventListener('click', () => {
        const isVisible = debugContainer.style.display !== 'none';
        debugContainer.style.display = isVisible ? 'none' : 'block';
    });

    // Log function
    window.debugLog = function(message, type = 'info') {
        const logItem = document.createElement('div');
        logItem.style.cssText = `
            margin-bottom: 5px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            padding-bottom: 5px;
        `;
        
        // Set color based on type
        let color = '#00ff00'; // Default green for info
        if (type === 'error') color = '#ff0000';
        if (type === 'warn') color = '#ffff00';
        
        logItem.style.color = color;
        logItem.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        debugContainer.appendChild(logItem);
        
        // Auto-scroll to bottom
        debugContainer.scrollTop = debugContainer.scrollHeight;
        
        // Also log to console
        console[type](message);
    };

    // Check Content Security Policy
    try {
        const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (cspMeta) {
            debugLog(`CSP Meta: ${cspMeta.getAttribute('content')}`, 'info');
        } else {
            debugLog('No CSP meta tag found', 'warn');
        }
    } catch (err) {
        debugLog(`Error checking CSP: ${err.message}`, 'error');
    }

    // Check Permissions Policy
    try {
        const permissionsMeta = document.querySelector('meta[http-equiv="Permissions-Policy"]');
        if (permissionsMeta) {
            debugLog(`Permissions Policy Meta: ${permissionsMeta.getAttribute('content')}`, 'info');
        } else {
            debugLog('No Permissions Policy meta tag found', 'warn');
        }
    } catch (err) {
        debugLog(`Error checking Permissions Policy: ${err.message}`, 'error');
    }

    // Check for camera permission
    debugLog('Checking camera permission...', 'info');
    if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'camera' })
            .then(permissionStatus => {
                debugLog(`Camera permission status: ${permissionStatus.state}`, 'info');
                
                permissionStatus.onchange = () => {
                    debugLog(`Camera permission changed to: ${permissionStatus.state}`, 'info');
                };
            })
            .catch(error => {
                debugLog(`Error querying camera permission: ${error.message}`, 'error');
            });
    } else {
        debugLog('Permissions API not supported', 'warn');
    }

    // Check external scripts
    const scripts = document.querySelectorAll('script[src]');
    debugLog(`Found ${scripts.length} external scripts:`, 'info');
    scripts.forEach(script => {
        debugLog(`Script: ${script.src}`, 'info');
    });

    // Override console.error to catch CSP violations
    const originalConsoleError = console.error;
    console.error = function() {
        const args = Array.from(arguments);
        originalConsoleError.apply(console, args);
        
        // Look for CSP violations
        const errorString = args.join(' ');
        if (errorString.includes('Content Security Policy') || 
            errorString.includes('CSP') || 
            errorString.includes('Permissions policy')) {
            debugLog(`CSP/Permissions Error: ${errorString}`, 'error');
        }
    };
    
    // Add listener for SecurityPolicyViolation events
    document.addEventListener('securitypolicyviolation', (e) => {
        debugLog(`CSP Violation: ${e.violatedDirective} (blocked: ${e.blockedURI})`, 'error');
    });
}); 