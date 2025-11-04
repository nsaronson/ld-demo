# Tech Store - E-commerce Application

A full-stack e-commerce store built with Node.js, Express, SQLite, and vanilla JavaScript.

## Features

- 📦 Product catalog with images and descriptions
- 🛒 Shopping cart functionality
- 💳 Checkout process with customer information
- 📊 Order management
- 💾 SQLite database for data persistence
- 🎨 Responsive design

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: SQLite (sqlite3)
- **Frontend**: HTML, CSS, Vanilla JavaScript
- **APIs**: RESTful JSON API

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

3. Open your browser and navigate to:
```
http://localhost:3000
```

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product

### Cart
- `GET /api/cart/:sessionId` - Get cart items
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:id` - Update cart item quantity
- `DELETE /api/cart/:id` - Remove item from cart

### Orders
- `POST /api/checkout` - Complete checkout and create order
- `GET /api/orders/:sessionId` - Get all orders for a session

### Session
- `GET /api/session` - Generate new session ID

## Database Schema

The application uses SQLite with the following tables:
- `products` - Product catalog
- `cart_items` - Shopping cart items
- `orders` - Completed orders
- `order_items` - Items in each order

## Sample Data

The application includes 8 sample tech products that are automatically added when the database is first created.

## Project Structure

```
.
├── server.js           # Express server and API routes
├── database.js         # Database configuration and schema
├── package.json        # Dependencies and scripts
├── public/             # Frontend files
│   ├── index.html      # Main HTML page
│   ├── styles.css      # Styling
│   └── app.js          # Frontend JavaScript
└── README.md           # This file
```

## License

MIT