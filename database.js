const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'ecommerce.db'));

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      image_url TEXT,
      stock INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products (id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_address TEXT NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders (id),
      FOREIGN KEY (product_id) REFERENCES products (id)
    )
  `);

  db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
    if (!err && row.count === 0) {
      const products = [
        ['Wireless Headphones', 'High-quality Bluetooth headphones with noise cancellation', 79.99, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', 50],
        ['Smart Watch', 'Fitness tracker with heart rate monitor and GPS', 199.99, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', 30],
        ['Laptop Backpack', 'Durable backpack with padded laptop compartment', 49.99, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 100],
        ['USB-C Hub', '7-in-1 USB-C adapter with HDMI and card reader', 39.99, 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400', 75],
        ['Mechanical Keyboard', 'RGB backlit mechanical keyboard with blue switches', 89.99, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400', 40],
        ['Wireless Mouse', 'Ergonomic wireless mouse with precision tracking', 29.99, 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400', 120],
        ['Phone Stand', 'Adjustable aluminum phone and tablet stand', 24.99, 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400', 200],
        ['Bluetooth Speaker', 'Portable waterproof Bluetooth speaker', 59.99, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400', 60]
      ];

      const stmt = db.prepare('INSERT INTO products (name, description, price, image_url, stock) VALUES (?, ?, ?, ?, ?)');
      products.forEach(product => {
        stmt.run(product);
      });
      stmt.finalize();
      console.log('Sample products added to database');
    }
  });
});

module.exports = db;
