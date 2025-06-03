require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 8002;

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
    
    // First, create a prediction
    console.log('Creating prediction with Replicate API...');
    const prediction = await createPrediction(imageData, stylePrompt);
    
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
async function createPrediction(imageData, prompt) {
  // Ensure imageData is in the right format (data:image/jpeg;base64,...)
  const imageUrl = imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`;
  
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      // Use the latest black-forest-labs/flux-kontext-pro model
      version: "64734fe9bb527757ee720f64e35cf8266a8f48449f6ee7722fb2dec26a7a0476",
      input: {
        prompt: prompt,
        input_image: imageUrl,
        aspect_ratio: "match_input_image",
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
    console.log('Prediction status:', prediction.status);
    
    if (prediction.status === "succeeded") {
      console.log('Prediction succeeded!');
      console.log('Output:', prediction.output);
      
      // Handle the output from black-forest-labs/flux-kontext-pro model
      // The model can return either a single URL string or an array
      if (Array.isArray(prediction.output)) {
        return prediction.output[0]; // Return the first URL in the array
      } else if (typeof prediction.output === 'string') {
        return prediction.output; // Return the URL string directly
      } else {
        throw new Error("Unexpected output format from Replicate API");
      }
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