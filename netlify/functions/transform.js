const Replicate = require('replicate');

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
    
    // Initialize Replicate client
    const replicate = new Replicate({
      auth: REPLICATE_API_TOKEN,
    });
    
    // Create prediction with Replicate API
    console.log('Creating prediction with Replicate API...');
    
    // Use Replicate client to run the model
    const output = await replicate.run(
      "black-forest-labs/flux-kontext-pro",
      {
        input: {
          prompt: stylePrompt,
          input_image: imageData,
          output_format: "jpg",
          safety_tolerance: 2
        }
      }
    );
    
    console.log('Prediction succeeded!');
    
    // Return the result
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        outputImageUrl: output 
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