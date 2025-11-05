---
description: Advanced development workflow rules for AI assistants
applyTo: '**'
---
---
# Smart Navigator Development Rules
Advanced guidelines for AI-assisted development ensuring quality and consistency

## 🎯 Development Approach Philosophy
- **Quality First**: Never sacrifice code quality for speed
- **Security by Design**: Consider security implications in every change
- **Test-Driven Thinking**: Consider test implications before making changes
- **Documentation Culture**: Keep documentation current and comprehensive
- **Confidence Threshold (95%)**: Only apply or auto-complete changes when ≥95% confident; if confidence is lower, ask for clarification or leave a concise TODO with options instead of modifying code.

## 🔧 Pre-Development Checklist
Before making ANY code changes:
1. **Understand Context**: Read related files and understand the change impact
2. **Check Dependencies**: Verify if changes affect other components
3. **Review Tests**: Identify which tests need updates
4. **Plan Security**: Consider security implications
5. **Estimate Impact**: Assess performance and compatibility impact

## 📁 Smart Navigator Specific Rules

### Project Structure Awareness
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + MongoDB + JWT
- **State Management**: Zustand (not Redux)
- **Maps**: Leaflet (primary), Google Maps (fallback)
- **Testing**: Jest + React Testing Library
- **Containerization**: Docker + Docker Compose

### Component Standards
```typescript
// ✅ Good - Functional component with proper types
interface MapComponentProps {
  locations: Location[];
  onLocationSelect: (location: Location) => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({ 
  locations, 
  onLocationSelect 
}) => {
  // Implementation
};

// ❌ Bad - No types, class component
export class MapComponent extends React.Component {
  // Implementation
}
```

### API Standards
```javascript
// ✅ Good - Proper error handling and validation (express-validator)
import { validationResult } from 'express-validator';

export const createLocation = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: errors.array()
      });
    }

    // Implementation (assumes req.body has been validated by middleware)
    const location = await Location.create(req.body);
    return res.status(201).json({
      success: true,
      message: 'Location created',
      data: location,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// ❌ Bad - No validation or error handling
export const createLocation = (req, res) => {
  const location = new Location(req.body);
  location.save();
  res.json(location);
};
```

## 🚨 Critical Patterns to Avoid

### Security Anti-Patterns
- ❌ Hardcoded API keys or secrets
- ❌ SQL injection vulnerabilities
- ❌ Unvalidated user inputs
- ❌ Exposed sensitive data in logs
- ❌ Missing authentication checks
- ❌ Insecure direct object references

### Performance Anti-Patterns
- ❌ Unnecessary re-renders in React
- ❌ Memory leaks from unmanaged subscriptions
- ❌ Large bundle sizes
- ❌ Blocking synchronous operations
- ❌ N+1 database queries
- ❌ Missing database indexes

### Code Quality Anti-Patterns
- ❌ Deeply nested conditionals (> 3 levels)
- ❌ Functions longer than 50 lines
- ❌ Missing error handling
- ❌ Inconsistent naming conventions
- ❌ Magic numbers and strings
- ❌ Duplicate code blocks

## 🎪 Smart File Handling Rules

### When editing existing files:
1. **Read the entire file** first to understand context
2. **Preserve existing patterns** and conventions
3. **Update related imports** if adding new dependencies
4. **Maintain consistent formatting** with the existing code
5. **Update comments and documentation** as needed

### When creating new files:
1. **Follow established naming conventions**
2. **Include appropriate file headers/imports**
3. **Add comprehensive JSDoc/comments**
4. **Include proper TypeScript types**
5. **Consider test file creation**

## 🗺️ Map Component Specific Rules

### Leaflet Integration
```typescript
// ✅ Good - Proper cleanup and error handling
useEffect(() => {
  const map = L.map('map').setView([latitude, longitude], zoom);
  
  const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
  tileLayer.addTo(map);
  
  return () => {
    map.remove(); // Cleanup to prevent memory leaks
  };
}, [latitude, longitude, zoom]);
```

### Event Handling
```typescript
// ✅ Good - Debounced search with proper types
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    searchLocations(query);
  }, 300),
  []
);

useEffect(() => {
  return () => {
    debouncedSearch.cancel();
  };
}, [debouncedSearch]);
```

## 🔐 Authentication & Authorization Rules

### JWT Implementation
```javascript
// ✅ Good - Secure JWT handling
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h', issuer: 'smart-navigator' }
  );
};
```

### Route Protection
```typescript
// ✅ Good - Proper route protection
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore();
  
  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
};
```

## 📊 Database & API Rules

### MongoDB Best Practices
```javascript
// ✅ Good - Proper indexing and validation
const locationSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    index: true,
    trim: true,
    maxlength: 100 
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere'
    }
  }
});
```

### API Response Format
```javascript
// ✅ Good - Consistent response format
const successResponse = (data, message = 'Success') => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString()
});

const errorResponse = (message, statusCode = 500, details = null) => ({
  success: false,
  message,
  statusCode,
  details,
  timestamp: new Date().toISOString()
});
```

## 🧪 Testing Philosophy

### Unit Test Requirements
- Test happy path scenarios
- Test error conditions
- Test edge cases
- Mock external dependencies
- Achieve >80% code coverage

### Integration Test Requirements
- Test API endpoints end-to-end
- Test database interactions
- Test authentication flows
- Test file upload/download
- Test third-party integrations

## 🚀 Performance Optimization Rules

### Frontend Optimization
```typescript
// ✅ Good - Memoized expensive calculations
const ExpensiveComponent = memo(({ data }: { data: ComplexData }) => {
  const processedData = useMemo(() => {
    return expensiveDataProcessing(data);
  }, [data]);
  
  return <div>{processedData}</div>;
});
```

### Backend Optimization
```javascript
// ✅ Good - Efficient database queries
const getLocationsWithEvents = async (filters) => {
  return Location.aggregate([
    { $match: filters },
    {
      $lookup: {
        from: 'events',
        localField: '_id',
        foreignField: 'locationId',
        as: 'events'
      }
    },
    { $limit: 50 } // Pagination
  ]);
};
```

## 📱 Mobile & Responsive Design Rules

### Responsive Breakpoints
- Mobile: 0-640px (sm)
- Tablet: 641-1024px (md)
- Desktop: 1025px+ (lg/xl)

### Touch-Friendly Design
```typescript
// ✅ Good - Touch-friendly map controls
const mapOptions = {
  tap: true,
  touchZoom: true,
  doubleClickZoom: true,
  scrollWheelZoom: 'center',
  boxZoom: true
};
```

## 🎨 UI/UX Consistency Rules

### Component Library Usage
- Use existing components before creating new ones
- Follow Tailwind CSS utility-first approach
- Maintain consistent spacing (4px grid)
- Use semantic color names
- Implement proper loading states

### Accessibility Requirements
```tsx
// ✅ Good - Accessible component
<button
  className="btn-primary"
  aria-label="Search for locations"
  disabled={isLoading}
>
  {isLoading ? (
    <LoadingSpinner aria-hidden="true" />
  ) : (
    'Search'
  )}
</button>
```

## 🔄 State Management Rules

### Zustand Best Practices
```typescript
// ✅ Good - Well-structured store (HTTP-only cookies; no token in localStorage)
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  login: async (credentials) => {
    try {
      // Backend sets HttpOnly cookie; response returns user profile
      const { user } = await authService.login(credentials);
      set({ user, isAuthenticated: true });
    } catch (error) {
      set({ user: null, isAuthenticated: false });
      // Handle error (toast/log)
    }
  },

  logout: async () => {
    try {
      await authService.logout(); // clears HttpOnly cookie server-side
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  }
}));
```

## 🧾 Commit Message Style (Student-Friendly)

- Keep messages short, clear, and in present tense (3–6 words)
- Prefer lowercase; optional simple scopes like `api:`, `ui:`, `docs:`
- One change per commit when possible; commit often

Examples:
- add login api
- fix map zoom bug
- docs: update deployment
- refactor auth middleware
- test: events controller

## 📝 Documentation Standards

### Code Comments
```typescript
/**
 * Calculates the optimal route between multiple locations
 * @param locations - Array of location coordinates
 * @param options - Route calculation options
 * @returns Promise resolving to optimized route data
 * @throws {Error} When locations array is empty or invalid
 */
export const calculateOptimalRoute = async (
  locations: Coordinates[],
  options: RouteOptions = {}
): Promise<RouteData> => {
  // Implementation
};
```

### API Documentation (OpenAPI example)
```yaml
openapi: 3.0.0
paths:
  /api/locations:
    post:
      summary: Create a new location
      tags: [Locations]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, coordinates]
              properties:
                name:
                  type: string
                  maxLength: 100
                coordinates:
                  type: array
                  minItems: 2
                  maxItems: 2
                  items:
                    type: number
      responses:
        '201':
          description: Location created
```

---
**Remember: These rules exist to ensure consistent, maintainable, and high-quality code. When in doubt, err on the side of caution and ask for clarification.**
