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
    
    // Set up canvas context
    const context = canvas.getContext('2d');
    
    // Initialize the API (in a real app, this would be handled server-side)
    // Replace with your actual Replicate API token if you have one
    // For demo/testing purposes, we'll use a placeholder and fall back to the simulation
    const useRealAPI = false; // Set to true when you have a real API token
    const API_TOKEN = 'your_replicate_api_token_here';
    
    if (window.ChemSnapAPI) {
        window.ChemSnapAPI.init(API_TOKEN);
    }
    
    // Initialize the webcam
    async function initializeWebcam() {
        try {
            errorMessage.textContent = 'Requesting camera access...';
            
            const constraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };

            // Stop any existing stream
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            // Get access to the webcam
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Enumerate available devices
            const devices = await navigator.mediaDevices.enumerateDevices();
            mediaDevices = devices.filter(device => device.kind === 'videoinput');

            // Show switch camera button if multiple cameras are available
            if (mediaDevices.length > 1) {
                switchBtn.style.display = 'flex';
            }

            // Connect the stream to the video element
            video.srcObject = stream;
            
            // Wait for video to be ready
            await video.play();
            
            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Enable capture button
            startCaptureBtn.disabled = false;
            
            // Clear any previous error messages
            errorMessage.textContent = '';
        } catch (error) {
            console.error('Error accessing webcam:', error);
            errorMessage.textContent = `Error accessing webcam: ${error.message || 'Permission denied'}`;
            startCaptureBtn.disabled = true;
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
        
        // Update progress function
        const updateProgress = (percent) => {
            progressFill.style.width = `${percent}%`;
        };
        
        // Start with 5% progress
        updateProgress(5);
        
        // Use the real API if available, otherwise simulate
        if (useRealAPI && window.ChemSnapAPI) {
            // Call the real API
            window.ChemSnapAPI.transformImage(capturedImageData, selectedStyle, updateProgress)
                .then(result => {
                    // Complete progress
                    updateProgress(100);
                    
                    // Store the result and show it
                    transformedImageUrl = result.outputImageUrl;
                    showResult(transformedImageUrl);
                })
                .catch(error => {
                    console.error('Error processing image:', error);
                    errorMessage.textContent = `Error processing image: ${error.message || 'Unknown error'}`;
                    // Allow user to try again
                    showSection(styleSection);
                });
        } else {
            // Simulate API call for demo purposes
            simulateApiCall(capturedImageData, selectedStyle, updateProgress)
                .then(result => {
                    // Complete progress
                    updateProgress(100);
                    
                    // Store the result and show it
                    transformedImageUrl = result.outputImageUrl;
                    showResult(transformedImageUrl);
                })
                .catch(error => {
                    console.error('Error processing image:', error);
                    errorMessage.textContent = `Error processing image: ${error.message || 'Unknown error'}`;
                    // Allow user to try again
                    showSection(styleSection);
                });
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
        // Set images
        originalImage.src = capturedImageData;
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
    initializeWebcam();
    
    // Show welcome message
    console.log('%c Welcome to ChemSnap! 🧪 ', 'background: #3498db; color: white; padding: 8px; border-radius: 4px; font-size: 12px;');
}); 