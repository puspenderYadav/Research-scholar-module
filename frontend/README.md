# Research Portal - Frontend

Modern React-based frontend for the Research Scholars Management Portal.

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first CSS framework
- **date-fns** - Date formatting
- **jwt-decode** - JWT token decoding

## Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── assets/            # CSS, images, etc.
│   │   └── css/
│   │       └── index.css  # Global styles & Tailwind
│   ├── components/        # Reusable components
│   │   ├── Layout.jsx     # Main layout with nav/sidebar
│   │   └── PrivateRoute.jsx # Protected route wrapper
│   ├── contexts/          # React contexts
│   │   └── AuthContext.jsx # Authentication state
│   ├── pages/             # Page components
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── ScholarProfile.jsx
│   │   └── ...
│   ├── services/          # API services
│   │   └── api.js         # Axios instance & API methods
│   ├── utils/             # Utility functions
│   ├── App.jsx            # Root component with routes
│   └── main.jsx           # Entry point
├── index.html             # HTML template
├── package.json           # Dependencies
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind configuration
└── postcss.config.js      # PostCSS configuration
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn
- Backend API running on http://localhost:5000

### Installation

1. **Install dependencies:**

```bash
npm install
# or
yarn install
```

2. **Create environment file:**

```bash
cp .env.example .env
```

Edit `.env` and set the API URL:
```
VITE_API_URL=http://localhost:5000/api
```

3. **Start development server:**

```bash
npm run dev
# or
yarn dev
```

The app will be available at: **http://localhost:3000**

### Build for Production

```bash
npm run build
# or
yarn build
```

This creates an optimized production build in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
# or
yarn preview
```

## Features

### Authentication
- JWT-based authentication
- Automatic token refresh
- Protected routes
- Persistent login (localStorage)

### Layout & Navigation
- Responsive sidebar navigation
- User dropdown menu
- Notification badge with count
- Role-based menu items

### API Integration
- Centralized API service (axios)
- Automatic token injection
- Error handling and retry logic
- Request/response interceptors

### Styling
- Tailwind CSS for utility classes
- Custom components (buttons, inputs, badges)
- Responsive design
- Custom scrollbar styling
- Loading spinner animations

## Available Routes

| Route | Component | Access |
|-------|-----------|--------|
| `/login` | Login | Public |
| `/dashboard` | Dashboard | Protected |
| `/profile` | ScholarProfile | Protected |
| `/supervisors` | Supervisors | Protected |
| `/exams` | Exams | Protected |
| `/seminars` | Seminars | Protected |
| `/synopsis` | Synopsis | Protected |
| `/progress-reports` | ProgressReports | Protected |
| `/thesis` | Thesis | Protected |
| `/travel-grants` | TravelGrants | Protected |
| `/calendar` | Calendar | Protected |
| `/notifications` | Notifications | Protected |

## API Service Usage

### Example: Using API methods

```javascript
import { scholarAPI, travelGrantAPI } from '../services/api';

// Get scholar profile
const profile = await scholarAPI.getMyProfile();

// Submit travel grant
const grant = await travelGrantAPI.create({
  purpose: 'Conference',
  destination: 'New York',
  // ...
});
```

### Available API Methods

All API methods are defined in `src/services/api.js`:

- `authAPI` - Authentication (login, logout, getCurrentUser, changePassword)
- `scholarAPI` - Scholar management
- `supervisorAPI` - Supervisor management
- `examAPI` - Exam management
- `seminarAPI` - Seminar management
- `synopsisAPI` - Synopsis submission and review
- `progressReportAPI` - Progress report management
- `thesisAPI` - Thesis submission and defense
- `travelGrantAPI` - Travel grant workflow
- `notificationAPI` - Notifications
- `calendarAPI` - Calendar events
- `dashboardAPI` - Dashboard data

## Authentication Context

The `AuthContext` provides:

```javascript
const { user, login, logout, updateUser, loading, isAuthenticated } = useAuth();
```

### Usage Example

```javascript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, logout } = useAuth();

  return (
    <div>
      <p>Welcome, {user.name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Custom Tailwind Classes

Utility classes defined in `src/assets/css/index.css`:

### Buttons
- `btn-primary` - Primary button style
- `btn-secondary` - Secondary button style
- `btn-success` - Success button style
- `btn-danger` - Danger button style

### Form Inputs
- `input-field` - Standard input field

### Cards & Badges
- `card` - Card container
- `badge` - Base badge
- `badge-primary` - Primary color badge
- `badge-success` - Success color badge
- `badge-warning` - Warning color badge
- `badge-danger` - Danger color badge

### Usage

```jsx
<button className="btn-primary">Submit</button>
<input type="text" className="input-field" />
<div className="card">Card content</div>
<span className="badge badge-success">Active</span>
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | http://localhost:5000/api |

## Development Tips

### Hot Module Replacement (HMR)
Vite provides fast HMR out of the box. Changes to your code will be reflected instantly in the browser.

### Proxy Configuration
API requests to `/api/*` are proxied to the backend server (configured in `vite.config.js`). This avoids CORS issues during development.

### Code Splitting
React Router automatically splits code by route, loading only the necessary JavaScript for each page.

## Testing Credentials

Use these credentials to test different user roles:

```
Scholar: scholar1@university.edu / password123
Supervisor: supervisor1@university.edu / password123
Dean: dean@university.edu / password123
```

## Troubleshooting

### Port Already in Use

Change the port in `vite.config.js`:

```javascript
export default defineConfig({
  server: {
    port: 3001, // Change to any available port
    // ...
  }
})
```

### API Connection Issues

1. Ensure backend is running on http://localhost:5000
2. Check `.env` file has correct `VITE_API_URL`
3. Clear browser cache and localStorage
4. Check browser console for errors

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

## Performance Optimization

- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Unused code is eliminated in production builds
- **Asset Optimization**: Images and assets are optimized
- **CSS Purging**: Tailwind removes unused CSS in production

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Deployment

### Static Hosting (Netlify, Vercel, GitHub Pages)

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist/` folder

3. Configure environment variables on your hosting platform

### Docker

Create `Dockerfile` in frontend directory:

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

[Specify License]

---

**Built with React, Vite, and Tailwind CSS**
