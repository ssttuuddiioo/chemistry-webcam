exports.handler = async function(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({ 
      status: 'ok', 
      message: 'Server is running',
      environment: process.env.NODE_ENV || 'development'
    })
  };
}; 