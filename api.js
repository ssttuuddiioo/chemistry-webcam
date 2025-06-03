// API integration for ChemSnap
// This file contains functions to interact with the Replicate API for image transformation

// Note: In a production environment, API calls should be made through your backend
// to protect your API keys. This client-side implementation is for demonstration purposes.

const API = {
    // Initialize with your API token (in a real app, this would be server-side)
    init: function(apiToken) {
        this.apiToken = apiToken;
        this.baseUrl = 'https://api.replicate.com/v1/predictions';
    },
    
    // Style prompt mapping
    stylePrompts: {
        neon_cyberpunk: "Cyberpunk style, neon lights, futuristic, high contrast, cybernetic enhancements, dystopian city, vibrant colors, digital art",
        watercolor_painting: "Watercolor painting style, soft colors, flowing, artistic, paint splatters, traditional art, dreamy, impressionistic",
        retro_synthwave: "Synthwave style, 80s aesthetic, retro futurism, purple and blue gradient, neon grid, sunset, vintage, vaporwave"
    },
    
    // Create a prediction (start the image transformation)
    createPrediction: async function(imageBase64, styleKey) {
        // Remove the data URL prefix to get just the base64 data
        const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
        
        // Get the style prompt
        const stylePrompt = this.stylePrompts[styleKey] || "Artistic transformation";
        
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${this.apiToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    // This is for the Stability AI's SDXL model
                    // You would adjust this for the specific model you want to use
                    version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
                    input: {
                        image: base64Data,
                        prompt: stylePrompt,
                        num_inference_steps: 30,
                        guidance_scale: 7.5,
                        strength: 0.7  // How much to transform the original image (0-1)
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error("Error creating prediction:", error);
            throw error;
        }
    },
    
    // Check the status of a prediction
    getPrediction: async function(id) {
        try {
            const response = await fetch(`${this.baseUrl}/${id}`, {
                headers: {
                    'Authorization': `Token ${this.apiToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error("Error getting prediction:", error);
            throw error;
        }
    },
    
    // Poll for results until the prediction is complete
    waitForResult: async function(id, onProgress) {
        const maxAttempts = 60; // Maximum polling attempts
        const interval = 1000; // Polling interval in ms
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const prediction = await this.getPrediction(id);
            
            // Calculate and report progress
            if (onProgress && prediction.status) {
                let progressPercent = 0;
                
                if (prediction.status === "starting") {
                    progressPercent = 10;
                } else if (prediction.status === "processing") {
                    // Map the progress from 10% to 90%
                    progressPercent = 10 + (attempt / maxAttempts) * 80;
                } else if (prediction.status === "succeeded") {
                    progressPercent = 100;
                }
                
                onProgress(progressPercent);
            }
            
            // Check if the prediction is complete
            if (prediction.status === "succeeded") {
                return prediction.output;
            }
            
            // Check if there was an error
            if (prediction.status === "failed") {
                throw new Error(prediction.error || "Prediction failed");
            }
            
            // Wait before polling again
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        
        throw new Error("Prediction timed out");
    },
    
    // Transform an image using the given style
    // This is the main function that combines the above steps
    transformImage: async function(imageBase64, styleKey, onProgress) {
        try {
            // Start with initial progress
            if (onProgress) onProgress(5);
            
            // Create the prediction
            const prediction = await this.createPrediction(imageBase64, styleKey);
            
            // Report that the prediction has been created
            if (onProgress) onProgress(10);
            
            // Wait for the result
            const output = await this.waitForResult(prediction.id, onProgress);
            
            // Return the result
            return { outputImageUrl: output };
        } catch (error) {
            console.error("Error transforming image:", error);
            throw error;
        }
    }
};

// Export the API for use in app.js
window.ChemSnapAPI = API; 