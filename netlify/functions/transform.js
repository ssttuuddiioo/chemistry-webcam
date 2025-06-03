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
    
    // Get the API token from environment variables
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
    
    if (!REPLICATE_API_TOKEN) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing API token" })
      };
    }
    
    console.log('Creating prediction with Replicate API...');
    
    // Ensure imageData is in the right format (data:image/jpeg;base64,...)
    const imageUrl = imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`;
    
    // First, create a prediction
    const prediction = await createPrediction(REPLICATE_API_TOKEN, imageUrl, stylePrompt);
    
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
async function createPrediction(apiToken, imageData, prompt) {
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      // Use the black-forest-labs/flux-kontext-pro model
      version: "5e5296dd0ff98f79ce32188f01308af6e1e0157cac6cf306852b7b1b9ad0e23a",
      input: {
        prompt: prompt,
        input_image: imageData,
        output_format: "jpg",
        safety_tolerance: 2
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