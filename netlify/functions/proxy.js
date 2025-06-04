const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Only allow GET
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    // Parse the URL parameter
    const params = new URLSearchParams(event.queryStringParameters);
    const imageUrl = params.get('url');
    
    if (!imageUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing URL parameter' })
      };
    }
    
    console.log(`Proxying image from URL: ${imageUrl}`);
    
    // Fetch the image
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      console.error(`Error fetching image: ${response.status} ${response.statusText}`);
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: 'Error fetching image', 
          details: response.statusText 
        })
      };
    }
    
    // Get content type and image data
    const contentType = response.headers.get('content-type');
    const imageBuffer = await response.buffer();
    
    console.log(`Image proxied successfully, content-type: ${contentType}, size: ${imageBuffer.length} bytes`);
    
    // Return the image with appropriate headers
    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      },
      body: imageBuffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('Error proxying image:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Error proxying image', 
        message: error.message 
      })
    };
  }
}; 