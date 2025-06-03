# CamSnap 📸

A modern, lightweight web application for capturing photos directly from your browser using your device's camera.

![CamSnap Demo](https://via.placeholder.com/800x400?text=CamSnap+Demo)

## ✨ Features

- 📱 Responsive design works on desktop and mobile devices
- 🔄 Switch between front and back cameras
- 📷 Capture photos with a flash effect
- 💾 Download captured images with one click
- 🖼️ View photos in a gallery right after capture
- ⌨️ Keyboard shortcuts (Space/Enter to capture, 'S' to switch camera)

## 🚀 Live Demo

[Try it now on Netlify](https://your-camsnap-demo.netlify.app)

## 🛠️ Quick Start

### Running Locally

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/camsnap.git
   cd camsnap
   ```

2. Start a local server:
   ```bash
   # Using Python 3
   python3 -m http.server
   
   # Using Node.js
   npx serve
   ```

3. Open your browser and navigate to:
   - http://localhost:8000 (Python)
   - http://localhost:3000 (Node/serve)

## 📦 Deployment

### Deploy to GitHub Pages

1. Push your code to a GitHub repository
2. Go to your repository settings
3. Navigate to "Pages" in the sidebar
4. Under "Source", select "main" branch and "/ (root)" folder
5. Click "Save" and your site will be published

### Deploy to Netlify

1. Sign up for a [Netlify](https://www.netlify.com/) account
2. Click "New site from Git"
3. Connect to your GitHub repository
4. Select the repository containing CamSnap
5. Use the following settings:
   - Build command: (leave blank)
   - Publish directory: `.` (dot)
6. Click "Deploy site"

## 🔒 Security Notes

- For security reasons, camera access requires HTTPS when deployed online
- Some browsers may block camera access if the site isn't secure
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

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/yourusername/camsnap/issues).

---

Made with ❤️ by [Your Name] 