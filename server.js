require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const crypto = require('crypto');
const LD = require('@launchdarkly/node-server-sdk');

const ldClient = LD.init(process.env.LD_SDK_KEY);
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

function generateSessionId() {
  return crypto.randomBytes(16).toString('hex');
}

app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products WHERE stock > 0', (err, products) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(products);
  });
});

app.get('/api/products/:id', (req, res) => {
  db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, product) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  });
});

app.get('/api/cart/:sessionId', (req, res) => {
  const query = `
    SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.image_url,
           (ci.quantity * p.price) as subtotal
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.session_id = ?
  `;
  
  db.all(query, [req.params.sessionId], (err, cartItems) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    res.json({ items: cartItems, total });
  });
});

app.post('/api/cart', (req, res) => {
  const { sessionId, productId, quantity } = req.body;
  
  if (!sessionId || !productId || !quantity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.get('SELECT * FROM products WHERE id = ?', [productId], (err, product) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    db.get('SELECT * FROM cart_items WHERE session_id = ? AND product_id = ?', 
      [sessionId, productId], (err, existingItem) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (existingItem) {
          const newQuantity = existingItem.quantity + quantity;
          if (product.stock < newQuantity) {
            return res.status(400).json({ error: 'Insufficient stock' });
          }
          db.run('UPDATE cart_items SET quantity = ? WHERE id = ?', 
            [newQuantity, existingItem.id], (err) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              res.json({ success: true, message: 'Item added to cart' });
            });
        } else {
          db.run('INSERT INTO cart_items (session_id, product_id, quantity) VALUES (?, ?, ?)',
            [sessionId, productId, quantity], (err) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              res.json({ success: true, message: 'Item added to cart' });
            });
        }
      });
  });
});

app.put('/api/cart/:id', (req, res) => {
  const { quantity } = req.body;
  
  if (!quantity || quantity < 1) {
    return res.status(400).json({ error: 'Invalid quantity' });
  }

  db.get('SELECT * FROM cart_items WHERE id = ?', [req.params.id], (err, cartItem) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    db.get('SELECT * FROM products WHERE id = ?', [cartItem.product_id], (err, product) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (product.stock < quantity) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }

      db.run('UPDATE cart_items SET quantity = ? WHERE id = ?', 
        [quantity, req.params.id], (err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ success: true, message: 'Cart updated' });
        });
    });
  });
});

app.delete('/api/cart/:id', (req, res) => {
  db.run('DELETE FROM cart_items WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, message: 'Item removed from cart' });
  });
});

app.post('/api/checkout', (req, res) => {
  const { sessionId, customerName, customerEmail, customerAddress } = req.body;

  if (!sessionId || !customerName || !customerEmail || !customerAddress) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const cartQuery = `
    SELECT ci.*, p.name, p.price, p.stock
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.session_id = ?
  `;

  db.all(cartQuery, [sessionId], (err, cartItems) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    for (const item of cartItems) {
      if (item.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${item.name}` });
      }
    }

    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    db.run(
      'INSERT INTO orders (session_id, customer_name, customer_email, customer_address, total_amount) VALUES (?, ?, ?, ?, ?)',
      [sessionId, customerName, customerEmail, customerAddress, total],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const orderId = this.lastID;

        db.serialize(() => {
          const stmt = db.prepare('INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES (?, ?, ?, ?, ?)');
          const updateStmt = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

          cartItems.forEach(item => {
            stmt.run([orderId, item.product_id, item.name, item.price, item.quantity]);
            updateStmt.run([item.quantity, item.product_id]);
          });

          stmt.finalize();
          updateStmt.finalize();

          db.run('DELETE FROM cart_items WHERE session_id = ?', [sessionId], (err) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            res.json({ 
              success: true, 
              message: 'Order placed successfully', 
              orderId,
              total 
            });
          });
        });
      }
    );
  });
});

app.get('/api/orders/:sessionId', (req, res) => {
  db.all('SELECT * FROM orders WHERE session_id = ? ORDER BY created_at DESC', 
    [req.params.sessionId], (err, orders) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      let completed = 0;
      orders.forEach(order => {
        db.all('SELECT * FROM order_items WHERE order_id = ?', [order.id], (err, items) => {
          if (!err) {
            order.items = items;
          }
          completed++;
          if (completed === orders.length) {
            res.json(orders);
          }
        });
      });

      if (orders.length === 0) {
        res.json([]);
      }
    });
});

app.get('/api/session', (req, res) => {
  res.json({ sessionId: generateSessionId() });
});

app.listen(PORT, () => {
  console.log(`E-commerce server running on http://localhost:${PORT}`);
});

// A "context" is a data object representing users, devices, organizations, and other entities.
// You'll need this later, but you can ignore it for now.
const context = {
  kind: 'user',
  key: 'user-key-123abcde',
  email: 'biz@face.dev',
};

ldClient.once('ready', function () {
  // Tracking your memberId lets us know you are connected.
  ldClient.track('690952c5a7866609a4281111', context);
  console.log('SDK successfully initialized!');
});
