document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('canvas');
    const startCaptureBtn = document.getElementById('start-capture');
    const switchBtn = document.getElementById('switch');
    const errorMessage = document.getElementById('error-message');
    const cameraOverlay = document.getElementById('camera-overlay');
    const countdownOverlay = document.getElementById('countdown-overlay');
    const countdownElement = document.getElementById('countdown');
    
    // Section elements
    const captureSection = document.getElementById('capture-section');
    const reviewSection = document.getElementById('review-section');
    const styleSection = document.getElementById('style-section');
    const processingSection = document.getElementById('processing-section');
    const resultSection = document.getElementById('result-section');
    
    // Review elements
    const reviewImage = document.getElementById('review-image');
    const approvePhotoBtn = document.getElementById('approve-photo');
    const retakePhotoBtn = document.getElementById('retake-photo');
    
    // Style elements
    const styleCards = document.querySelectorAll('.style-card');
    
    // Result elements
    const originalImage = document.getElementById('original-image');
    const resultImage = document.getElementById('result-image');
    const progressFill = document.getElementById('progress-fill');
    const emailInput = document.getElementById('email-input');
    const sendEmailBtn = document.getElementById('send-email');
    const downloadBtn = document.getElementById('download-image');
    const startOverBtn = document.getElementById('start-over');
    const qrCodeContainer = document.getElementById('qr-code');
    
    // State variables
    let stream = null;
    let facingMode = 'user'; // Start with front camera
    let mediaDevices = [];
    let isCapturing = false;
    let capturedImageData = null;
    let selectedStyle = null;
    let transformedImageUrl = null;
    
    // API configuration
    const isNetlify = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    const API_ENDPOINT = isNetlify ? '/api/transform' : 'http://localhost:8002/api/transform';
    const useServerAPI = true; // Set to false for local simulation
    
    // Set up canvas context
    const context = canvas.getContext('2d');
    
    // Initialize the webcam
    async function initializeWebcam() {
        try {
            errorMessage.textContent = 'Requesting camera access...';
            
            if (window.debugLog) {
                debugLog('Camera initialization started', 'info');
            }
            
            // Detect browser types
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
            const isChrome = /chrome/i.test(navigator.userAgent) && !/edge|edg/i.test(navigator.userAgent);
            
            if (isSafari) {
                console.log("Safari browser detected - using Safari-specific camera settings");
            } else if (isChrome) {
                console.log("Chrome browser detected - using Chrome-specific camera settings");
            }
            
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                const msg = 'Your browser does not support camera access';
                if (window.debugLog) debugLog(msg, 'error');
                throw new Error(msg);
            }
            
            // Start with default constraints
            let constraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };

            // Browser-specific adjustments
            if (isSafari) {
                // For Safari, simplify constraints which can cause issues
                constraints.video = { facingMode: facingMode };
            } else if (isChrome) {
                // For Chrome, be more specific about video constraints
                constraints.video = {
                    facingMode: facingMode,
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 480, ideal: 720, max: 1080 },
                    frameRate: { ideal: 30 }
                };
            }

            if (window.debugLog) {
                debugLog(`Requesting camera with constraints: ${JSON.stringify(constraints)}`, 'info');
            }

            // Stop any existing stream
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            // Get access to the webcam
            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
                if (window.debugLog) debugLog('Camera access granted!', 'info');
            } catch (e) {
                if (window.debugLog) {
                    debugLog(`getUserMedia error: ${e.name} - ${e.message}`, 'error');
                    debugLog(`Error code: ${e.code || 'N/A'}`, 'error');
                }
                
                // For Safari: If the first attempt failed, try again with even simpler constraints
                if (isSafari && e.name === 'NotReadableError') {
                    console.log("Retrying with simplified constraints for Safari");
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({ 
                            video: true, 
                            audio: false 
                        });
                        if (window.debugLog) debugLog('Camera access granted on second attempt!', 'info');
                    } catch (e2) {
                        if (window.debugLog) {
                            debugLog(`Second attempt failed: ${e2.name} - ${e2.message}`, 'error');
                        }
                        throw e2;
                    }
                } else {
                    throw e;
                }
            }
            
            // Enumerate available devices
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                mediaDevices = devices.filter(device => device.kind === 'videoinput');
                
                if (window.debugLog) {
                    debugLog(`Found ${mediaDevices.length} video input devices:`, 'info');
                    mediaDevices.forEach((device, i) => {
                        debugLog(`Device ${i+1}: ${device.label || 'unnamed device'} (${device.deviceId.substring(0, 8)}...)`, 'info');
                    });
                }
            } catch (e) {
                if (window.debugLog) debugLog(`Error enumerating devices: ${e.message}`, 'error');
            }

            // Show switch camera button if multiple cameras are available
            if (mediaDevices.length > 1) {
                switchBtn.style.display = 'flex';
            }

            // Connect the stream to the video element
            video.srcObject = stream;
            
            // Wait for video to be ready
            try {
                await video.play();
                if (window.debugLog) debugLog('Video playback started', 'info');
            } catch (e) {
                if (window.debugLog) debugLog(`Error playing video: ${e.message}`, 'error');
                throw e;
            }
            
            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Enable capture button
            startCaptureBtn.disabled = false;
            
            // Clear any previous error messages
            errorMessage.textContent = '';
            
            if (window.debugLog) debugLog('Camera initialization completed successfully', 'info');
        } catch (error) {
            console.error('Error accessing webcam:', error);
            let errorMsg = 'Error accessing webcam: ';
            
            if (error.name === 'NotAllowedError') {
                errorMsg += 'Permission denied. Please allow camera access and reload the page.';
                if (window.debugLog) debugLog('Camera permission denied by user or system', 'error');
            } else if (error.name === 'NotFoundError') {
                errorMsg += 'No camera found. Please connect a camera and try again.';
                if (window.debugLog) debugLog('No camera found on device', 'error');
            } else if (error.name === 'NotReadableError') {
                errorMsg += 'Camera is in use by another application. Please close other camera apps and try again.';
                if (window.debugLog) debugLog('Camera in use by another application', 'error');
            } else if (error.name === 'OverconstrainedError') {
                errorMsg += 'The requested camera settings are not supported.';
                if (window.debugLog) debugLog('Camera constraints not supported', 'error');
            } else if (error.name === 'SecurityError') {
                errorMsg += 'Camera access is blocked by your browser security settings.';
                if (window.debugLog) debugLog('Security error when accessing camera', 'error');
            } else {
                errorMsg += error.message || 'Unknown error';
                if (window.debugLog) debugLog(`Unknown camera error: ${error.message || 'No details'}`, 'error');
            }
            
            errorMessage.textContent = errorMsg;
            startCaptureBtn.disabled = true;
            
            // Add a reload button to try again
            const reloadBtn = document.createElement('button');
            reloadBtn.innerText = 'Try Again';
            reloadBtn.className = 'btn-primary';
            reloadBtn.style.marginTop = '10px';
            reloadBtn.onclick = () => window.location.reload();
            errorMessage.appendChild(document.createElement('br'));
            errorMessage.appendChild(reloadBtn);
        }
    }

    // Start the capture process with countdown
    function startCapture() {
        if (!stream || isCapturing) return;
        
        isCapturing = true;
        startCaptureBtn.disabled = true;
        
        // Show countdown
        countdownOverlay.classList.add('visible');
        let count = 3;
        countdownElement.textContent = count;
        
        const countdownInterval = setInterval(() => {
            count--;
            
            if (count > 0) {
                countdownElement.textContent = count;
            } else {
                clearInterval(countdownInterval);
                countdownOverlay.classList.remove('visible');
                capturePhoto();
            }
        }, 1000);
    }
    
    // Capture a photo
    function capturePhoto() {
        // Create flash effect
        createFlashEffect();
        
        // Draw the current video frame to the canvas
        if (facingMode === 'user') {
            // Flip horizontally for front camera
            context.save();
            context.scale(-1, 1);
            context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
            context.restore();
        } else {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
        
        // Convert the canvas to a data URL
        capturedImageData = canvas.toDataURL('image/jpeg', 0.9);
        
        // Display in review section
        reviewImage.src = capturedImageData;
        
        // Show review section
        showSection(reviewSection);
        isCapturing = false;
    }
    
    // Create flash effect when capturing
    function createFlashEffect() {
        const flash = document.createElement('div');
        flash.style.position = 'absolute';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.right = '0';
        flash.style.bottom = '0';
        flash.style.backgroundColor = 'white';
        flash.style.opacity = '0.7';
        flash.style.zIndex = '10';
        flash.style.pointerEvents = 'none';
        cameraOverlay.appendChild(flash);

        // Animate the flash effect
        setTimeout(() => {
            flash.style.opacity = '0';
            flash.style.transition = 'opacity 0.3s ease-out';
            setTimeout(() => {
                cameraOverlay.removeChild(flash);
            }, 300);
        }, 50);
    }

    // Switch between front and back cameras
    function switchCamera() {
        facingMode = facingMode === 'user' ? 'environment' : 'user';
        switchBtn.disabled = true;
        initializeWebcam().then(() => {
            switchBtn.disabled = false;
        });
    }
    
    // Handle style card selection
    function selectStyle(event) {
        const card = event.currentTarget;
        
        // Remove selected class from all cards
        styleCards.forEach(card => card.classList.remove('selected'));
        
        // Add selected class to clicked card
        card.classList.add('selected');
        
        // Store the selected style
        selectedStyle = card.dataset.style;
        
        // Delay to show selection effect before proceeding
        setTimeout(() => {
            // Start processing
            processImage();
        }, 300);
    }
    
    // Process the image with the selected style
    function processImage() {
        // Show processing section
        showSection(processingSection);
        
        // Message element to show status
        const statusMessage = document.createElement('p');
        statusMessage.className = 'status-message';
        statusMessage.style.textAlign = 'center';
        statusMessage.style.marginTop = '10px';
        statusMessage.textContent = 'Starting transformation...';
        processingSection.appendChild(statusMessage);
        
        // Update progress function
        const updateProgress = (percent, message) => {
            progressFill.style.width = `${percent}%`;
            if (message) {
                statusMessage.textContent = message;
            }
        };
        
        // Start with 5% progress
        updateProgress(5, 'Preparing image...');
        
        if (window.debugLog) {
            debugLog(`Processing image with style: ${selectedStyle}`, 'info');
            debugLog(`Image data length: ${capturedImageData ? capturedImageData.length : 0}`, 'info');
        }
        
        if (useServerAPI) {
            // Call the server API
            callServerAPI(capturedImageData, selectedStyle, updateProgress)
                .then(result => {
                    // Complete progress
                    updateProgress(100, 'Transformation complete!');
                    
                    // Store the result and show it
                    transformedImageUrl = result.outputImageUrl;
                    
                    if (window.debugImageTransformation) {
                        debugImageTransformation(capturedImageData, transformedImageUrl);
                    }
                    
                    showResult(transformedImageUrl);
                })
                .catch(error => {
                    console.error('Error processing image:', error);
                    if (window.debugLog) {
                        debugLog(`Error processing image: ${error.message || 'Unknown error'}`, 'error');
                    }
                    errorMessage.textContent = `Error processing image: ${error.message || 'Unknown error'}`;
                    // Remove the status message element
                    if (statusMessage.parentNode) {
                        statusMessage.parentNode.removeChild(statusMessage);
                    }
                    // Allow user to try again
                    showSection(styleSection);
                });
        } else {
            // Simulate API call for demo purposes
            simulateApiCall(capturedImageData, selectedStyle, updateProgress)
                .then(result => {
                    // Complete progress
                    updateProgress(100, 'Transformation complete!');
                    
                    // Store the result and show it
                    transformedImageUrl = result.outputImageUrl;
                    showResult(transformedImageUrl);
                })
                .catch(error => {
                    console.error('Error processing image:', error);
                    errorMessage.textContent = `Error processing image: ${error.message || 'Unknown error'}`;
                    // Remove the status message element
                    if (statusMessage.parentNode) {
                        statusMessage.parentNode.removeChild(statusMessage);
                    }
                    // Allow user to try again
                    showSection(styleSection);
                });
        }
    }
    
    // Call the server API to transform the image
    async function callServerAPI(imageData, style, updateProgress) {
        try {
            // Start progress indicator
            updateProgress(10, 'Connecting to server...');
            
            console.log("Calling server API with style:", style);
            console.log("Image data length:", imageData ? imageData.substring(0, 50) + "..." : "No image data");
            console.log("API endpoint:", API_ENDPOINT);
            
            // Call the API
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageData: imageData,
                    style: style
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error("API error response:", errorData);
                throw new Error(errorData.message || response.statusText);
            }
            
            updateProgress(25, 'Processing started...');
            
            // Simulate progress while waiting for the result
            let progress = 30;
            const progressMessages = [
                'Analyzing image...',
                'Applying artistic style...',
                'Adding fine details...',
                'Enhancing colors...',
                'Finalizing transformation...'
            ];
            let messageIndex = 0;
            
            const progressInterval = setInterval(() => {
                progress += 2; // Slower progress to match reality
                
                // Update message occasionally
                if (progress % 15 === 0 && messageIndex < progressMessages.length) {
                    updateProgress(progress, progressMessages[messageIndex]);
                    messageIndex++;
                } else {
                    updateProgress(progress);
                }
                
                if (progress >= 95) {
                    clearInterval(progressInterval);
                }
            }, 1000);
            
            // Get the response data
            const data = await response.json();
            
            // Clear the progress interval
            clearInterval(progressInterval);
            
            console.log('Server response:', data);
            
            // Return the result
            if (data.success && data.outputImageUrl) {
                console.log("Successfully received transformed image URL:", data.outputImageUrl);
                console.log("URL type:", typeof data.outputImageUrl);
                updateProgress(95, 'Loading transformed image...');
                return {
                    outputImageUrl: data.outputImageUrl
                };
            } else {
                console.error("API returned success but no image URL:", data);
                throw new Error(data.error || 'No image URL returned from server');
            }
        } catch (error) {
            console.error('Error calling server API:', error);
            throw error;
        }
    }
    
    // Simulate API call to Replicate
    // In a real app, this would be an actual API call
    function simulateApiCall(imageData, style, updateProgress) {
        return new Promise((resolve) => {
            // Total simulation time in milliseconds
            const totalTime = 5000;
            const startTime = Date.now();
            
            // Update progress every 100ms
            const progressInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(95, (elapsed / totalTime) * 100);
                updateProgress(progress);
                
                if (progress >= 95) {
                    clearInterval(progressInterval);
                }
            }, 100);
            
            // Simulate network delay
            setTimeout(() => {
                clearInterval(progressInterval);
                
                // For demo, we'll just return the original image
                // In a real app, this would be the URL of the transformed image from Replicate
                resolve({
                    outputImageUrl: imageData
                });
            }, totalTime);
        });
    }
    
    // Show the result
    function showResult(transformedUrl) {
        console.log("showResult called with URL:", transformedUrl);
        console.log("URL type:", typeof transformedUrl);
        
        // Set original image
        originalImage.src = capturedImageData;
        
        // Handle different URL formats for the transformed image
        if (transformedUrl) {
            console.log('Transformed URL received:', transformedUrl);
            
            // Check if the URL is an HTTP(S) URL
            const isHttpUrl = transformedUrl.startsWith('http://') || transformedUrl.startsWith('https://');
            console.log("Is HTTP URL:", isHttpUrl);
            
            if (!isHttpUrl && transformedUrl.startsWith('data:')) {
                console.log("URL is a data URL, setting directly");
                resultImage.src = transformedUrl;
                showSection(resultSection);
                return;
            }
            
            // For HTTP URLs, try to fetch the image first to check if it's accessible
            if (isHttpUrl) {
                console.log("Trying to fetch the image to check accessibility");
                fetch(transformedUrl, { mode: 'no-cors' })
                    .then(response => {
                        console.log("Image fetch response:", response);
                    })
                    .catch(error => {
                        console.error("Error fetching image:", error);
                    });
            }
            
            // Preload the image to ensure it loads properly
            const img = new Image();
            img.onload = function() {
                console.log("Transformed image loaded successfully, dimensions:", img.width, "x", img.height);
                // Set the result image source once loaded
                resultImage.src = transformedUrl;
                
                // Generate QR code for download
                if (window.QRCode) {
                    // Clear any existing QR code
                    qrCodeContainer.innerHTML = '';
                    
                    new QRCode(qrCodeContainer, {
                        text: transformedUrl,
                        width: 128,
                        height: 128
                    });
                }
                
                // Show result section
                showSection(resultSection);
            };
            
            img.onerror = function(error) {
                console.error("Failed to load transformed image from URL:", transformedUrl);
                console.error("Image error details:", error);
                
                // Try alternative approach for CORS issues
                if (isHttpUrl) {
                    console.log("Trying to create a proxy URL for CORS issues");
                    const proxyUrl = isNetlify ? 
                        `/api/proxy?url=${encodeURIComponent(transformedUrl)}` : 
                        `http://localhost:8002/api/proxy?url=${encodeURIComponent(transformedUrl)}`;
                    
                    console.log("Using proxy URL:", proxyUrl);
                    resultImage.src = proxyUrl;
                } else {
                    // Fall back to original image
                    resultImage.src = capturedImageData;
                }
                
                // Show result section anyway
                showSection(resultSection);
            };
            
            // Start loading the image
            console.log("Setting image src to:", transformedUrl);
            img.crossOrigin = "anonymous";  // Try with CORS enabled
            img.src = transformedUrl;
        } else {
            console.error('No transformed URL received');
            resultImage.src = capturedImageData; // Fall back to original image
            showSection(resultSection);
        }
    }
    
    // Helper to show a specific section and hide others
    function showSection(sectionToShow) {
        // Hide all sections
        captureSection.classList.add('hidden');
        reviewSection.classList.add('hidden');
        styleSection.classList.add('hidden');
        processingSection.classList.add('hidden');
        resultSection.classList.add('hidden');
        
        // Show the requested section
        sectionToShow.classList.remove('hidden');
    }
    
    // Reset the app to start over
    function resetApp() {
        // Clear captured data
        capturedImageData = null;
        selectedStyle = null;
        transformedImageUrl = null;
        
        // Clear QR code
        if (qrCodeContainer) {
            qrCodeContainer.innerHTML = '';
        }
        
        // Reset progress bar
        progressFill.style.width = '0%';
        
        // Remove selected class from style cards
        styleCards.forEach(card => card.classList.remove('selected'));
        
        // Show capture section
        showSection(captureSection);
        
        // Re-enable buttons
        startCaptureBtn.disabled = false;
    }
    
    // Email the result
    function sendEmail() {
        const email = emailInput.value.trim();
        if (!email) {
            alert('Please enter a valid email address');
            return;
        }
        
        // In a real app, send this to your server to email the image
        alert(`Image would be sent to ${email} in a real implementation`);
    }
    
    // Download the transformed image
    function downloadImage() {
        if (!transformedImageUrl) return;
        
        const link = document.createElement('a');
        link.href = transformedImageUrl;
        link.download = `chemsnap_${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`;
        link.click();
    }
    
    // Event listeners
    startCaptureBtn.addEventListener('click', startCapture);
    switchBtn.addEventListener('click', switchCamera);
    approvePhotoBtn.addEventListener('click', () => showSection(styleSection));
    retakePhotoBtn.addEventListener('click', () => showSection(captureSection));
    styleCards.forEach(card => card.addEventListener('click', selectStyle));
    sendEmailBtn.addEventListener('click', sendEmail);
    downloadBtn.addEventListener('click', downloadImage);
    startOverBtn.addEventListener('click', resetApp);
    
    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Space or Enter to capture
        if ((e.key === ' ' || e.key === 'Enter') && !startCaptureBtn.disabled && !captureSection.classList.contains('hidden')) {
            startCapture();
        }
        
        // 'S' to switch camera
        if (e.key === 's' && switchBtn.style.display !== 'none' && !captureSection.classList.contains('hidden')) {
            switchCamera();
        }
    });

    // Initialize the webcam when the page loads
    // Delay the initialization to make sure the page is fully loaded
    setTimeout(() => {
        if (window.debugLog) debugLog('Starting camera initialization...', 'info');
        initializeWebcam();
    }, 1000);
    
    // Show welcome message
    console.log('%c Welcome to ChemSnap! 🧪 ', 'background: #3498db; color: white; padding: 8px; border-radius: 4px; font-size: 12px;');
}); 