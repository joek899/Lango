# LangHub - Language Contribution & Dictionary Platform

![LangHub Banner](https://example.com/langhub-banner.png)

A collaborative platform where people can contribute to languages and use the website as a dictionary for different languages.

## 🌟 Features

- **Multilingual Dictionary**: Search for words across multiple languages
- **Multi-directional Translation**: Translate between any two or more languages (not limited to a primary language)
- **Language Addition**: Contributors can add new languages to the platform
- **Contribution System**: Add new words, phrases, translations, and usage examples
- **User Ranking**: Contributors gain rank based on their submissions for future compensation
  - Contributions include both word additions and language additions
- **Moderation Tools**: Content review system for quality control
- **Responsive Design**: Works on desktop and mobile devices

## 🖥️ Technologies

- **Frontend**: React, Tailwind CSS
- **Backend**: FastAPI
- **Database**: MongoDB
- **Authentication**: JWT-based authentication

## 📷 Screenshots

![Dictionary Search](https://example.com/dictionary-screenshot.png)
![Contribution Interface](https://example.com/contribution-screenshot.png)
![User Profile](https://example.com/profile-screenshot.png)

## 🚀 Installation Guide for VPS Deployment

### Prerequisites

- Ubuntu 20.04+ or similar Linux distribution
- Node.js 16+ and npm
- Python 3.8+
- MongoDB 4.4+
- Nginx (for production deployment)

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/langhub.git
cd langhub
```

### Step 2: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
MONGO_URL="mongodb://localhost:27017"
DB_NAME="langhub"
SECRET_KEY="your-secret-key-change-this"
EOF
```

#### MongoDB Setup

```bash
# Install MongoDB if not already installed
sudo apt update
sudo apt install -y mongodb

# Start MongoDB service
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Create database (optional)
mongosh
> use langhub
> exit
```

### Step 3: Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
REACT_APP_BACKEND_URL="http://your-server-ip:8001"
EOF
```

### Step 4: Running the Application (Development)

```bash
# Terminal 1 - Start backend
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2 - Start frontend
cd frontend
npm start
```

### Step 5: Production Deployment

#### Backend Production Setup

```bash
# Create a systemd service file
sudo nano /etc/systemd/system/langhub-backend.service
```

Add the following configuration:

```ini
[Unit]
Description=LangHub Backend Service
After=network.target

[Service]
User=yourusername
WorkingDirectory=/path/to/langhub/backend
ExecStart=/path/to/langhub/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=5
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=langhub-backend

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable langhub-backend
sudo systemctl start langhub-backend
```

#### Frontend Production Build

```bash
cd frontend
npm run build
```

#### Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/langhub
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/langhub/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/langhub /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

### Step 6: First-time Setup

After installation, you can access the admin account with:
- Username: `admin`
- Password: `admin123`

**Important:** Change the admin password immediately after first login.

### Key Features Setup

1. **Language Management**:
   - Languages are pre-populated with common options (English, Spanish, French, etc.)
   - All authenticated users can add new languages via the Contribute page
   - Language codes follow ISO 639-1 standard (two-letter codes)

2. **Translation Workflow**:
   - Words can be added in any language
   - Translations can be created between any two languages
   - Multi-directional translations are supported (not limited to English)

3. **Contributor Rankings**:
   - All contributions (words and languages) increase the contributor score
   - Every 10 contributions increase the contributor rank
   - Ranking is used for future compensation models

### Security Considerations

1. Update the `SECRET_KEY` in backend/.env with a secure, random string
2. Change the default admin password
3. Set up HTTPS with Let's Encrypt
4. Configure proper MongoDB authentication
5. Set up firewall rules to restrict access to your database

```bash
# Generate a secure secret key
openssl rand -hex 32
```

## 🔧 Troubleshooting

1. **Backend connection issues:**
   - Check if MongoDB is running: `sudo systemctl status mongodb`
   - Verify backend service is running: `sudo systemctl status langhub-backend`
   - Check backend logs: `sudo journalctl -u langhub-backend`

2. **Frontend not loading:**
   - Check Nginx configuration: `sudo nginx -t`
   - Verify that the build directory is correctly specified in the Nginx config
   - Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`

3. **API endpoint errors:**
   - Ensure the backend URL in frontend/.env is correct
   - Verify no firewall is blocking the backend port (8001)
   - Check CORS settings if you're accessing from different domains

## 🔄 Updating the Application

```bash
# Pull latest changes
git pull

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart langhub-backend

# Update frontend
cd ../frontend
npm install
npm run build
```

## 📊 API Documentation

The backend API documentation is available at `/docs` or `/redoc` when the backend server is running.

## 👥 Contributing

We welcome contributions! Please see our [contribution guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔄 Contribution Process

### Adding a New Language
1. Log in to your account
2. Navigate to the "Contribute" page
3. Select the "Add Language" tab
4. Enter the language name, ISO code, and native name (optional)
5. Review and submit

### Adding Words and Translations
1. Log in to your account
2. Navigate to the "Contribute" page
3. Select the "Add Word" tab
4. Enter the word and select its language
5. Add translations in other languages
6. Review and submit

### User Ranking System
- Users earn contribution points for every addition (words or languages)
- Contributor rank increases with continued participation
- Ranking factors used for future compensation or recognition
- Profile page tracks all contribution history

### Language Support
- The platform supports any language with a valid ISO 639-1 code
- Translations can be added between any two languages
- All contributors (not just moderators) can add new languages

## 🙏 Acknowledgements

- All our amazing contributors
- [FastAPI](https://fastapi.tiangolo.com/) - Fast web framework for building APIs
- [React](https://reactjs.org/) - A JavaScript library for building user interfaces
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [MongoDB](https://www.mongodb.com/) - Document-based database
