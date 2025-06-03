document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('canvas');
    const captureButton = document.getElementById('capture');
    const switchButton = document.getElementById('switch');
    const photosContainer = document.getElementById('photos');
    const errorMessage = document.getElementById('error-message');
    const cameraOverlay = document.getElementById('camera-overlay');

    let stream = null;
    let facingMode = 'user'; // Start with front camera
    let mediaDevices = [];
    let isCapturing = false;

    // Set up canvas context
    const context = canvas.getContext('2d');

    // Flash effect when capturing
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
                switchButton.style.display = 'flex';
            }

            // Connect the stream to the video element
            video.srcObject = stream;
            
            // Wait for video to be ready
            await video.play();
            
            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Enable capture button
            captureButton.disabled = false;
            
            // Clear any previous error messages
            errorMessage.textContent = '';
        } catch (error) {
            console.error('Error accessing webcam:', error);
            errorMessage.textContent = `Error accessing webcam: ${error.message || 'Permission denied'}`;
            captureButton.disabled = true;
        }
    }

    // Capture a photo
    function capturePhoto() {
        if (!stream || isCapturing) return;
        
        isCapturing = true;
        captureButton.disabled = true;
        
        // Create flash effect
        createFlashEffect();
        
        // Draw the current video frame to the canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // If front camera is being used, flip the image horizontally
        if (facingMode === 'user') {
            context.save();
            context.scale(-1, 1);
            context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
            context.restore();
        } else {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
        
        // Convert the canvas to a data URL
        const imageUrl = canvas.toDataURL('image/png');
        
        // Create a new image element
        const img = document.createElement('img');
        img.src = imageUrl;
        
        // Create a container for the image with delete button
        const imgContainer = document.createElement('div');
        imgContainer.className = 'photo-container';
        imgContainer.appendChild(img);
        
        // Add the image to the photos container
        photosContainer.prepend(imgContainer);
        
        // Add tooltip
        img.title = 'Click to download';
        
        // Add download functionality when clicking on the image
        img.addEventListener('click', () => {
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = `camsnap_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
            link.click();
        });
        
        // Add a subtle animation
        img.style.opacity = '0';
        img.style.transform = 'scale(0.8)';
        setTimeout(() => {
            img.style.opacity = '1';
            img.style.transform = 'scale(1)';
            img.style.transition = 'all 0.3s ease';
        }, 50);
        
        // Re-enable capture button
        setTimeout(() => {
            captureButton.disabled = false;
            isCapturing = false;
        }, 500);
    }

    // Switch between front and back cameras
    function switchCamera() {
        facingMode = facingMode === 'user' ? 'environment' : 'user';
        switchButton.disabled = true;
        initializeWebcam().then(() => {
            switchButton.disabled = false;
        });
    }

    // Event listeners
    captureButton.addEventListener('click', capturePhoto);
    switchButton.addEventListener('click', switchCamera);

    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Space or Enter to capture
        if ((e.key === ' ' || e.key === 'Enter') && !captureButton.disabled) {
            capturePhoto();
        }
        
        // 'S' to switch camera
        if (e.key === 's' && switchButton.style.display !== 'none') {
            switchCamera();
        }
    });

    // Initialize the webcam when the page loads
    initializeWebcam();

    // Handle device orientation changes
    window.addEventListener('resize', () => {
        if (stream) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }
    });

    // Show a welcome message
    console.log('%c Welcome to CamSnap! 📸 ', 'background: #3498db; color: white; padding: 8px; border-radius: 4px; font-size: 12px;');
}); 