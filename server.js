require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Set up middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from the current directory
app.use(express.static(__dirname));

// Set up Replicate API token
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
if (!REPLICATE_API_TOKEN) {
  console.warn('Warning: REPLICATE_API_TOKEN environment variable not set');
}

// Style prompt mapping
const stylePrompts = {
  neon_cyberpunk: "Cyberpunk style, neon lights, futuristic, high contrast, cybernetic enhancements, dystopian city, vibrant colors, digital art",
  watercolor_painting: "Watercolor painting style, soft colors, flowing, artistic, paint splatters, traditional art, dreamy, impressionistic",
  retro_synthwave: "Synthwave style, 80s aesthetic, retro futurism, purple and blue gradient, neon grid, sunset, vintage, vaporwave"
};

// API endpoints
app.post('/api/transform', async (req, res) => {
  try {
    // Get image data and style from the request
    const { imageData, style } = req.body;
    
    if (!imageData || !style) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Check if API token is available
    if (!REPLICATE_API_TOKEN) {
      return res.status(500).json({ error: 'API token not configured' });
    }
    
    // Get the style prompt
    const stylePrompt = stylePrompts[style] || "Artistic transformation";
    
    // Remove the data URL prefix to get just the base64 data
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, "");
    
    // First, create a prediction
    console.log('Creating prediction with Replicate API...');
    const prediction = await createPrediction(base64Data, stylePrompt);
    
    // Then poll for the result
    console.log('Polling for results...');
    const result = await waitForResult(prediction.id);
    
    // Return the result to the client
    return res.json({ 
      success: true, 
      outputImageUrl: result 
    });
  } catch (error) {
    console.error('Error transforming image:', error);
    return res.status(500).json({ 
      error: 'Error transforming image', 
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Function to create a prediction with Replicate API
async function createPrediction(base64Image, prompt) {
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      // Stability AI's SDXL model
      version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      input: {
        image: base64Image,
        prompt: prompt,
        num_inference_steps: 30,
        guidance_scale: 7.5,
        strength: 0.7  // How much to transform the original image (0-1)
      }
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API error: ${error.detail || response.statusText}`);
  }
  
  return await response.json();
}

// Function to poll for results
async function waitForResult(id) {
  const maxAttempts = 60;  // Maximum polling attempts
  const interval = 1000;   // Polling interval in ms
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`Checking prediction status (attempt ${attempt + 1}/${maxAttempts})...`);
    
    const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API error: ${error.detail || response.statusText}`);
    }
    
    const prediction = await response.json();
    
    if (prediction.status === "succeeded") {
      console.log('Prediction succeeded!');
      return prediction.output;
    }
    
    if (prediction.status === "failed") {
      throw new Error(prediction.error || "Prediction failed");
    }
    
    // Wait before polling again
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error("Prediction timed out");
}

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to use the application`);
}); 