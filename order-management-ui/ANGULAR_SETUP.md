# Order Management UI - Angular Frontend

A modern Angular-based UI for the Order Management System that communicates with the Spring Boot API Gateway.

## Project Structure

```
order-management-ui/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── create-order/       # Order creation form component
│   │   │   └── order-history/      # Order status search component
│   │   ├── services/
│   │   │   └── order.service.ts    # API communication service
│   │   ├── app.ts                  # Root component with navigation
│   │   ├── app.routes.ts           # Application routing
│   │   └── app.config.ts           # Application configuration
│   ├── main.ts                     # Application entry point
│   ├── index.html                  # HTML template
│   └── styles.css                  # Global styles
├── angular.json                    # Angular configuration
├── package.json                    # Dependencies
└── tsconfig.json                   # TypeScript configuration
```

## Features

✅ **Create Order** - Simple form to create new orders with amount validation
✅ **Order History** - Search and view order status by Order ID
✅ **Responsive Design** - Mobile-friendly UI with modern gradient styling
✅ **Error Handling** - User-friendly error messages and feedback
✅ **Real-time Feedback** - Immediate visual feedback for all operations
✅ **Navigation** - Clean navigation bar with active route highlighting

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- Angular CLI (v18 or higher)

### Installation

```bash
cd order-management-ui
npm install
```

### Development Server

```bash
ng serve
# or
npm start
```

The application will be available at `http://localhost:4200`

## Configuration

The API Gateway URL is configured in [src/app/services/order.service.ts](src/app/services/order.service.ts):

```typescript
private apiUrl = 'http://localhost:8080/api/orders';
```

### For Production:
Update the API URL in `src/app/services/order.service.ts`:

```typescript
private apiUrl = 'https://your-api-gateway-domain/api/orders';
```

## Components

### 1. CreateOrderComponent (`src/app/components/create-order/`)
Form for creating new orders with:
- Amount input with validation (must be > 0)
- Real-time form submission
- Success/failure feedback
- Auto-reset after successful submission

**Usage:**
```bash
ng generate component components/create-order  # Already created
```

### 2. OrderHistoryComponent (`src/app/components/order-history/`)
Search interface for viewing order status:
- Search by Order ID
- Display order details
- Error handling for not found orders

**Usage:**
```bash
ng generate component components/order-history  # Already created
```

### 3. OrderService (`src/app/services/order.service.ts`)
Service for API communication:
- `createOrder(request)` - Creates a new order
- `getOrderStatus(orderId)` - Gets status of a specific order
- `getAllOrders()` - Gets all orders (for future implementation)

## API Integration

### Create Order
```typescript
this.orderService.createOrder({ amount: 150.50 }).subscribe(
  (response: ApiResponse<CreateOrderResponse>) => {
    console.log('Order created:', response.data);
  },
  (error) => {
    console.error('Error:', error);
  }
);
```

### Get Order Status
```typescript
this.orderService.getOrderStatus('ORDER-a1b2c3d4').subscribe(
  (response: ApiResponse<string>) => {
    console.log('Order status:', response.data);
  }
);
```

## Styling

The application uses:
- **CSS Gradients** - Purple gradient backgrounds
- **Flexbox** - Responsive layout
- **CSS Transitions** - Smooth animations
- **Media Queries** - Mobile responsiveness

Global styles are defined in `src/styles.css`
Component-specific styles are inline in component files

## Building for Production

```bash
ng build --configuration production
# or
npm run build
```

The built files will be in the `dist/` directory.

## Deployment

### Docker Deployment

Create a `Dockerfile` in the project root:

```dockerfile
# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=build /app/dist/order-management-ui /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
docker build -t order-management-ui .
docker run -p 80:80 order-management-ui
```

### Docker Compose Integration

Add to `docker-compose.yml`:

```yaml
order-management-ui:
  build: ./order-management-ui
  ports:
    - "3000:80"
  depends_on:
    - api-gateway
  environment:
    - API_GATEWAY_URL=http://api-gateway:8080/api
```

## Testing

Run unit tests:
```bash
ng test
```

Run end-to-end tests:
```bash
ng e2e
```

## Routing

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | CreateOrderComponent | Home page - create order |
| `/create` | CreateOrderComponent | Order creation form |
| `/history` | OrderHistoryComponent | Order status search |

## Error Handling

The application handles several error scenarios:

1. **Validation Errors** (400)
   - Invalid amount (≤ 0)
   - Missing required fields

2. **Service Unavailable** (503)
   - API Gateway is down
   - Backend service connection failed

3. **Network Errors**
   - Timeout errors
   - Connection refused

All errors display user-friendly messages in the UI.

## Performance Optimizations

- ✅ Standalone components (reduced bundle size)
- ✅ Lazy loading ready (can be added for large apps)
- ✅ OnPush change detection (where applicable)
- ✅ Minimal dependencies

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Tips

### Hot Module Replacement (HMR)
```bash
ng serve --hmr
```

### Debugging
- Use Chrome DevTools for browser debugging
- Use Angular DevTools extension for component inspection
- Check Network tab for API calls

### Common Issues

**CORS Errors:**
- Ensure API Gateway has CORS enabled
- Check allowed origins in `api-gateway/src/main/java/org/example/CorsConfig.java`

**Port Already in Use:**
```bash
ng serve --port 4201
```

**Module Not Found:**
```bash
npm install
```

## Future Enhancements

- [ ] Authentication with JWT
- [ ] Order history pagination
- [ ] Real-time order updates (WebSocket)
- [ ] Order filtering and sorting
- [ ] Export orders to CSV
- [ ] Order status notifications
- [ ] Admin dashboard
- [ ] User profile management

## Dependencies

Main dependencies:
- **Angular 18+** - Framework
- **TypeScript 5+** - Language
- **RxJS** - Reactive programming
- **Bootstrap Icons** (optional) - Icons

See `package.json` for complete dependency list.

## License

Part of the Order Management System project.

## Support

For issues or questions, check:
1. [API_GUIDE.md](../api-gateway/API_GUIDE.md) - API documentation
2. [Angular Docs](https://angular.io/docs)
3. Project README at root level
