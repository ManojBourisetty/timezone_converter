# 🌍 Timezone Converter

A modern, real-time timezone converter web application built with React and FastAPI. Convert time between any two timezones with accurate calculations and a beautiful, responsive interface.

![Timezone Converter Screenshot](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=Timezone+Converter+App)

## ✨ Features

### 🎯 Core Functionality
- **Real-time Timezone Conversion** - Convert between any two timezones with accurate calculations
- **Current & Custom Time** - Use current time or select custom date/time for conversion
- **Live Clock Updates** - Real-time UTC display and major cities clocks update every second
- **Smart Search** - Search timezones by city name or country with instant filtering

### 🎨 User Experience
- **Professional UI Design** - Modern, clean interface with smooth animations
- **Enhanced Timezone Selection** - Beautiful dropdown cards with country info and offset badges
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile devices
- **Intuitive Controls** - Easy timezone swapping, toggle switches, and clear visual feedback

### 🔧 Technical Features
- **Backend API Integration** - Real timezone calculations using Python's pytz library
- **Real-time Data** - Major cities time updates every 10 seconds
- **Error Handling** - Graceful error handling for API failures and invalid inputs
- **Optimized Performance** - Efficient state management and minimal re-renders

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern React with hooks and functional components
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Shadcn/ui** - High-quality, accessible UI components
- **Lucide React** - Beautiful, customizable icons
- **Axios** - HTTP client for API communication
- **date-fns** - Modern JavaScript date utility library

### Backend
- **FastAPI** - Modern, fast web framework for Python APIs
- **pytz** - Accurate timezone calculations and conversions
- **Pydantic** - Data validation using Python type annotations
- **MongoDB** - NoSQL database for data persistence
- **Motor** - Async MongoDB driver for Python

### Development
- **Vite** - Fast build tool and development server
- **ESLint** - Code linting and formatting
- **CORS** - Cross-origin resource sharing configuration

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- MongoDB (local or Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/timezone-converter.git
   cd timezone-converter
   ```

2. **Backend Setup**
   ```bash
   cd backend
   
   # Install Python dependencies
   pip install -r requirements.txt
   
   # Set up environment variables
   cp .env.example .env
   # Edit .env with your MongoDB connection string
   
   # Start the backend server
   uvicorn server:app --host 0.0.0.0 --port 8001 --reload
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   
   # Install Node.js dependencies
   npm install
   
   # Set up environment variables
   cp .env.example .env
   # Edit .env with your backend URL
   
   # Start the development server
   npm start
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8001
   - API Documentation: http://localhost:8001/docs

## 📖 Usage Guide

### Basic Conversion
1. **Select Source Timezone** - Click on "From Timezone" dropdown and search/select your source timezone
2. **Select Target Timezone** - Click on "To Timezone" dropdown and choose destination timezone
3. **Choose Time Mode** - Toggle "Use current time" or set custom date/time
4. **Convert** - Click "Convert Time" button to see the conversion result

### Advanced Features
- **Swap Timezones** - Click the "Swap Timezones" button to quickly reverse source and target
- **Search Timezones** - Type in the dropdown search box to find cities or countries quickly
- **Real-time Monitoring** - Watch the major cities section for live time updates
- **Custom Date/Time** - Turn off current time toggle to select specific dates and times

## 📡 API Documentation

### Endpoints

#### Convert Timezone
```http
POST /api/convert-timezone
Content-Type: application/json

{
  "datetime": "2024-08-24T12:30:00Z",
  "sourceTimezone": "America/New_York",
  "targetTimezone": "Europe/London"
}
```

#### Get Major Cities Time
```http
GET /api/major-cities-time
```

#### Get All Timezones
```http
GET /api/timezones
```

#### Health Check
```http
GET /api/health
```

### Response Format
```json
{
  "sourceTime": {
    "datetime": "2024-08-24T08:30:00-04:00",
    "timezone": "America/New_York",
    "formatted": "Sat, Aug 24, 2024, 08:30:00 AM",
    "city": "New York",
    "offset": "-04:00"
  },
  "targetTime": {
    "datetime": "2024-08-24T13:30:00+01:00",
    "timezone": "Europe/London",
    "formatted": "Sat, Aug 24, 2024, 01:30:00 PM",
    "city": "London",
    "offset": "+01:00"
  }
}
```

## 📁 Project Structure

```
timezone-converter/
├── frontend/                 # React frontend application
│   ├── public/              # Static files
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── ui/         # Shadcn/ui components
│   │   │   └── TimezoneConverter.jsx
│   │   ├── data/           # Mock data and utilities
│   │   ├── hooks/          # Custom React hooks
│   │   └── App.js          # Main application component
│   ├── package.json        # Frontend dependencies
│   └── tailwind.config.js  # Tailwind CSS configuration
├── backend/                 # FastAPI backend application
│   ├── models.py           # Pydantic data models
│   ├── timezone_service.py # Timezone conversion logic
│   ├── server.py           # FastAPI server and routes
│   └── requirements.txt    # Python dependencies
├── contracts.md            # API contracts documentation
└── README.md              # Project documentation
```

## 🌟 Key Features Deep Dive

### Real-time Updates
- **UTC Clock** - Updates every second showing current UTC time
- **Major Cities** - 8 major world cities with live time display
- **Automatic Refresh** - Major cities data refreshes every 10 seconds via API

### Enhanced UI Components
- **Timezone Cards** - Large, informative cards showing city, country, and timezone offset
- **Smart Search** - Instant filtering of timezones with highlighted popular cities
- **Responsive Layout** - Adapts beautifully to all screen sizes
- **Smooth Animations** - Micro-interactions and hover effects for better UX

### Timezone Accuracy
- **pytz Library** - Uses industry-standard Python timezone library
- **DST Handling** - Automatically handles daylight saving time transitions
- **Offset Calculation** - Real-time offset calculation based on current date
- **Global Coverage** - Supports 35+ major timezones worldwide

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

#### Backend (.env)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=timezone_converter
```

### Customization
- **Add Timezones** - Modify `timezone_service.py` to add more supported timezones
- **UI Themes** - Customize colors in `tailwind.config.js`
- **Major Cities** - Update the major cities list in `TimezoneService.MAJOR_CITIES`

## 🧪 Testing

### Backend Testing
```bash
cd backend
python -m pytest tests/
```

### Frontend Testing
```bash
cd frontend
npm test
```

### API Testing
The application includes comprehensive backend API testing covering:
- Health check endpoints
- Timezone conversion accuracy
- Major cities data retrieval
- Error handling for invalid inputs

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Manual Deployment
1. **Frontend**: Build and deploy to static hosting (Netlify, Vercel)
2. **Backend**: Deploy to cloud platform (Heroku, AWS, DigitalOcean)
3. **Database**: Use MongoDB Atlas for cloud database

### Production Considerations
- Set up proper CORS policies for production domains
- Use environment-specific configuration files
- Implement proper logging and monitoring
- Set up SSL certificates for HTTPS

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines
- Follow ESLint rules for JavaScript code
- Use Python type hints and follow PEP 8 for Python code
- Write tests for new features
- Update documentation for API changes

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support
=======

If you have any questions or need help:

- **Issues**: Open a GitHub issue for bug reports or feature requests
- **Documentation**: Check the `/docs` folder for detailed guides
- **Community**: Join our Discord server for discussions

## 🎯 Roadmap

### Upcoming Features
- [ ] **Timezone History** - Save frequently used timezone pairs
- [ ] **Meeting Scheduler** - Find optimal meeting times across timezones  
- [ ] **World Clock Widget** - Customizable world clock display
- [ ] **Browser Extension** - Quick timezone conversion in browser
- [ ] **Mobile App** - React Native mobile application
- [ ] **API Rate Limiting** - Implement rate limiting for public API access

### Recent Updates
- ✅ **v1.0.0** - Initial release with core timezone conversion
- ✅ **Enhanced UI** - Improved dropdown design and search functionality
- ✅ **Real-time Updates** - Added live clock displays
- ✅ **API Integration** - Complete backend integration with FastAPI

---

<div align="center">

**Built with ❤️ using React, FastAPI, and modern web technologies**

[Demo](https://timezone-converter-demo.com) • [Documentation](https://docs.timezone-converter.com) • [Report Bug](https://github.com/yourusername/timezone-converter/issues)

</div>
