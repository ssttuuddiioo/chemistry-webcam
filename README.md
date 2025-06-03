# ChemSnap 📸

A modern web application for capturing photos and transforming them with AI using the Replicate API.

![ChemSnap Demo](https://via.placeholder.com/800x400?text=ChemSnap+Demo)

## ✨ Features

- 📱 Responsive design works on desktop and mobile devices
- 🔄 Switch between front and back cameras
- 📷 Capture photos with a flash effect
- 🧪 Transform photos with AI using Replicate API
- 💾 Download transformed images with one click
- 🖼️ View original and transformed photos side by side
- ⌨️ Keyboard shortcuts (Space/Enter to capture, 'S' to switch camera)

## 🚀 Live Demo

[Try it now on Netlify](https://chemistry-webcam.netlify.app)

## 🛠️ Setup and Installation

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- Replicate API token

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/ssttuuddiioo/chemistry-webcam.git
   cd chemistry-webcam
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Replicate API token:
   ```
   REPLICATE_API_TOKEN=your_replicate_api_token_here
   ```

### Running the Application

Start the development server:

```bash
npm run dev
```

Or for production:

```bash
npm start
```

Then open your browser and navigate to:
- http://localhost:8002

## 📦 Deployment

### Deploy to Netlify

1. Sign up for a [Netlify](https://www.netlify.com/) account
2. Click "New site from Git"
3. Connect to your GitHub repository
4. Select the repository containing ChemSnap
5. Use the following settings:
   - Build command: `npm install`
   - Publish directory: `.`
   - Environment variables: Add your `REPLICATE_API_TOKEN`
6. Click "Deploy site"

The project includes a `netlify.toml` file that configures:
- Node.js version (v18)
- Redirects for API endpoints
- Function directory location

### Troubleshooting Deployment

If you encounter issues with the Replicate API:
1. Make sure your API token is correctly set in Netlify environment variables
2. Check that your Netlify functions have the necessary permissions
3. Verify that your account has access to the Replicate models being used

## 🔒 Security Notes

- The Replicate API token is stored securely on the server
- Camera access requires HTTPS when deployed online
- When testing locally, most browsers allow camera access via HTTP on localhost

## 📱 Browser Compatibility

Tested and working on:
- Chrome (desktop & mobile)
- Firefox (desktop & mobile)
- Safari (desktop & mobile)
- Edge (desktop)

## 📄 License

MIT License

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/ssttuuddiioo/chemistry-webcam/issues).

---

Made with ❤️ by Studio 