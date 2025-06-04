# ChemSnap Setup Instructions

## Quick Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/ssttuuddiioo/chemistry-webcam.git
   cd chemistry-webcam
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file with your Replicate API token:
     ```
     REPLICATE_API_TOKEN=your_token_here
     ```

4. Start the backend API server:
   ```bash
   node server.js
   ```

5. In a separate terminal, start the frontend server:
   ```bash
   python3 serve_frontend.py
   ```

6. Open http://localhost:8080 in your browser

## Netlify Deployment

1. Deploy to Netlify using:
   ```bash
   netlify deploy
   ```

2. Add your Replicate API token as an environment variable in the Netlify dashboard:
   - Go to Site settings > Environment variables
   - Add variable with key: `REPLICATE_API_TOKEN` and your token as the value

3. Redeploy after adding the environment variable

## Troubleshooting

- If the camera doesn't work in Chrome, try Safari or vice versa
- If you see port conflict errors, kill processes using those ports with:
  ```bash
  lsof -ti:8002,8080 | xargs kill -9
  ```
- Check the browser console for detailed error messages 