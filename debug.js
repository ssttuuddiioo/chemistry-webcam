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
    window.debugLog = function(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
        
        switch(level) {
            case 'error':
                console.error(`${prefix} ${message}`);
                break;
            case 'warn':
                console.warn(`${prefix} ${message}`);
                break;
            case 'debug':
                console.debug(`${prefix} ${message}`);
                break;
            case 'info':
            default:
                console.log(`${prefix} ${message}`);
                break;
        }
        
        // If we have a debug element on the page, add to it
        const debugElement = document.getElementById('debug-log');
        if (debugElement) {
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry log-${level}`;
            logEntry.textContent = `${prefix} ${message}`;
            debugElement.appendChild(logEntry);
            debugElement.scrollTop = debugElement.scrollHeight;
        }
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

// Debug image transformation
window.debugImageTransformation = function(originalUrl, transformedUrl) {
    console.log('Image transformation debug:');
    console.table({
        original: {
            url: originalUrl,
            type: typeof originalUrl,
            isDataUrl: originalUrl?.startsWith('data:') || false,
            isHttpUrl: originalUrl?.startsWith('http') || false,
            length: originalUrl?.length || 0
        },
        transformed: {
            url: transformedUrl,
            type: typeof transformedUrl,
            isDataUrl: transformedUrl?.startsWith('data:') || false,
            isHttpUrl: transformedUrl?.startsWith('http') || false,
            length: transformedUrl?.length || 0
        }
    });
    
    if (transformedUrl && transformedUrl.startsWith('http')) {
        // Try to load the transformed image directly to see if it works
        const testImg = new Image();
        testImg.crossOrigin = "anonymous";
        testImg.onload = function() {
            console.log('✅ Transformed image loaded successfully in test:', testImg.width, 'x', testImg.height);
        };
        testImg.onerror = function(err) {
            console.error('❌ Failed to load transformed image in test:', err);
            
            // Try with a proxy
            console.log('Trying with proxy...');
            const isNetlify = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
            const proxyUrl = isNetlify ? 
                `/api/proxy?url=${encodeURIComponent(transformedUrl)}` : 
                `http://localhost:8002/api/proxy?url=${encodeURIComponent(transformedUrl)}`;
            
            const proxyImg = new Image();
            proxyImg.onload = function() {
                console.log('✅ Proxied image loaded successfully:', proxyImg.width, 'x', proxyImg.height);
            };
            proxyImg.onerror = function(err) {
                console.error('❌ Failed to load proxied image:', err);
            };
            proxyImg.src = proxyUrl;
        };
        testImg.src = transformedUrl;
    }
};

// Add debugging UI (toggle with Ctrl+D)
document.addEventListener('keydown', function(event) {
    // Check for Ctrl+D
    if (event.ctrlKey && event.key === 'd') {
        event.preventDefault();
        toggleDebugUI();
    }
});

function toggleDebugUI() {
    let debugPanel = document.getElementById('debug-panel');
    
    if (debugPanel) {
        // Toggle visibility
        debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
    } else {
        // Create debug panel
        debugPanel = document.createElement('div');
        debugPanel.id = 'debug-panel';
        debugPanel.style.cssText = `
            position: fixed;
            bottom: 0;
            right: 0;
            width: 400px;
            height: 300px;
            background: rgba(0, 0, 0, 0.8);
            color: #fff;
            font-family: monospace;
            z-index: 9999;
            border-top-left-radius: 5px;
            padding: 10px;
            display: flex;
            flex-direction: column;
        `;
        
        // Add a header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            border-bottom: 1px solid #666;
            padding-bottom: 5px;
        `;
        header.innerHTML = `
            <span>Debug Console (Ctrl+D to toggle)</span>
            <button id="clear-debug" style="background: #333; color: #fff; border: none; cursor: pointer;">Clear</button>
        `;
        
        // Add the log container
        const logContainer = document.createElement('div');
        logContainer.id = 'debug-log';
        logContainer.style.cssText = `
            flex: 1;
            overflow-y: auto;
            font-size: 12px;
            line-height: 1.3;
        `;
        
        // Add everything to the panel
        debugPanel.appendChild(header);
        debugPanel.appendChild(logContainer);
        document.body.appendChild(debugPanel);
        
        // Set up clear button
        document.getElementById('clear-debug').addEventListener('click', function() {
            document.getElementById('debug-log').innerHTML = '';
        });
        
        // Log initial message
        window.debugLog('Debug panel initialized', 'info');
    }
} 