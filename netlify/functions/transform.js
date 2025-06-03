const fetch = require('node-fetch');

// Style prompt mapping
const stylePrompts = {
  neon_cyberpunk: "Cyberpunk style, neon lights, futuristic, high contrast, cybernetic enhancements, dystopian city, vibrant colors, digital art",
  watercolor_painting: "Watercolor painting style, soft colors, flowing, artistic, paint splatters, traditional art, dreamy, impressionistic",
  retro_synthwave: "Synthwave style, 80s aesthetic, retro futurism, purple and blue gradient, neon grid, sunset, vintage, vaporwave"
};

exports.handler = async function(event, context) {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    // Parse the request body
    const body = JSON.parse(event.body);
    const { imageData, style } = body;
    
    if (!imageData || !style) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required parameters" })
      };
    }
    
    // Get the style prompt
    const stylePrompt = stylePrompts[style] || "Artistic transformation";
    
    // Remove the data URL prefix to get just the base64 data
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, "");
    
    // Get the API token from environment variables
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
    
    if (!REPLICATE_API_TOKEN) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing API token" })
      };
    }
    
    // First, create a prediction
    console.log('Creating prediction with Replicate API...');
    const prediction = await createPrediction(REPLICATE_API_TOKEN, base64Data, stylePrompt);
    
    // Then poll for the result
    console.log('Polling for results...');
    const result = await waitForResult(REPLICATE_API_TOKEN, prediction.id);
    
    // Return the result
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        outputImageUrl: result 
      })
    };
  } catch (error) {
    console.error('Error transforming image:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Error transforming image', 
        message: error.message 
      })
    };
  }
};

// Function to create a prediction with Replicate API
async function createPrediction(apiToken, base64Image, prompt) {
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiToken}`,
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
async function waitForResult(apiToken, id) {
  const maxAttempts = 60;  // Maximum polling attempts
  const interval = 1000;   // Polling interval in ms
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`Checking prediction status (attempt ${attempt + 1}/${maxAttempts})...`);
    
    const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: {
        'Authorization': `Token ${apiToken}`
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