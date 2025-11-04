const API_URL = 'http://localhost:3000/api';
let sessionId = localStorage.getItem('sessionId');
let cart = { items: [], total: 0 };

// Initialize LaunchDarkly
const LDClient = window.LDClient;
let ldClient = null;

let emails = ['jdoe@gmail.com', 'test@example.com', 'fmae@government.net', 'jbond@gmail.com'];
let ldSessionKey = '690952c5a7866609a4281112';
let email = emails[Math.floor(Math.random() * emails.length)];

async function initializeLaunchDarkly() {
    if (!sessionId) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const context = {
        kind: 'user',
        key: email,
        anonymous: false,
        email: email
    };
    
    ldClient = LDClient.initialize(ldSessionKey, context, {
        inspectors: [
    {
      type: "flag-used",
      name: "dd-inspector",
      method: (key, detail) => {
        window.DD_RUM.addFeatureFlagEvaluation(key, detail.value);
      },
    },
  ],
    } );
    
    await ldClient.waitForInitialization();
    
    const darkModeEnabled = ldClient.variation('dark-mode', false);
    applyDarkMode(darkModeEnabled);
    
    ldClient.on('change:dark-mode', (newValue) => {
        applyDarkMode(newValue);
    });
    
    const isTargeted = ldClient.variation('coupon-banner', false);
    applyCouponBanner(isTargeted);
    
    ldClient.on('change:isTargeted', (newValue) => {
        applyCouponBanner(newValue);
    });

    console.log(email);
}

function applyDarkMode(enabled) {
    if (enabled) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

function applyCouponBanner(enabled) {
    const existingBanner = document.getElementById('couponBanner');
    
    if (enabled && !existingBanner) {
        const banner = document.createElement('div');
        banner.id = 'couponBanner';
        banner.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 20px;
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            position: fixed;
            top: 60px;
            left: 0;
            right: 0;
            z-index: 999;
            animation: slideDown 0.5s ease-out;
        `;
        banner.innerHTML = '🎉 Special Offer: Get 20% OFF Your Purchase! 🎉';
        document.body.insertBefore(banner, document.body.firstChild);
        
        document.querySelector('main').style.marginTop = '95px';
    } else if (!enabled && existingBanner) {
        existingBanner.remove();
        document.querySelector('main').style.marginTop = '60px';
    }
}

initializeLaunchDarkly();

if (!sessionId) {
    fetch(`${API_URL}/session`)
        .then(res => res.json())
        .then(data => {
            sessionId = data.sessionId;
            localStorage.setItem('sessionId', sessionId);
        });
}

function loadProducts() {
    fetch(`${API_URL}/products`)
        .then(res => res.json())
        .then(products => {
            const grid = document.getElementById('productGrid');
            grid.innerHTML = products.map(product => `
                <div class="product-card">
                    <img src="${product.image_url}" alt="${product.name}" class="product-image">
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-description">${product.description}</p>
                        <div class="product-footer">
                            <span class="product-price">$${product.price.toFixed(2)}</span>
                            <button class="btn btn-primary" onclick="addToCart(${product.id})">
                                Add to Cart
                            </button>
                        </div>
                        <small style="color: #95a5a6;">Stock: ${product.stock}</small>
                    </div>
                </div>
            `).join('');
        })
        .catch(error => {
            document.getElementById('productGrid').innerHTML = 
                '<p class="loading">Error loading products. Please refresh the page.</p>';
            console.error('Error loading products:', error);
        });
}

function addToCart(productId) {
    fetch(`${API_URL}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sessionId,
            productId,
            quantity: 1
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            loadCart();
            showNotification('Item added to cart!');
        } else {
            alert(data.error || 'Failed to add item to cart');
        }
    })
    .catch(error => {
        console.error('Error adding to cart:', error);
        alert('Failed to add item to cart');
    });
}

function loadCart() {
    fetch(`${API_URL}/cart/${sessionId}`)
        .then(res => res.json())
        .then(data => {
            cart = data;
            updateCartUI();
        })
        .catch(error => console.error('Error loading cart:', error));
}

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutTotal = document.getElementById('checkoutTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');

    cartCount.textContent = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cartTotal.textContent = `$${cart.total.toFixed(2)}`;
    checkoutTotal.textContent = `$${cart.total.toFixed(2)}`;

    if (cart.items.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        checkoutBtn.disabled = true;
    } else {
        checkoutBtn.disabled = false;
        cartItems.innerHTML = cart.items.map(item => `
            <div class="cart-item">
                <img src="${item.image_url}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)} each</div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                        <button class="remove-btn" onclick="removeFromCart(${item.id})">Remove</button>
                    </div>
                    <small style="color: #27ae60;">Subtotal: $${item.subtotal.toFixed(2)}</small>
                </div>
            </div>
        `).join('');
    }
}

function updateQuantity(cartItemId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(cartItemId);
        return;
    }

    fetch(`${API_URL}/cart/${cartItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            loadCart();
        } else {
            alert(data.error || 'Failed to update quantity');
        }
    })
    .catch(error => {
        console.error('Error updating quantity:', error);
        alert('Failed to update quantity');
    });
}

function removeFromCart(cartItemId) {
    fetch(`${API_URL}/cart/${cartItemId}`, {
        method: 'DELETE'
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            loadCart();
        }
    })
    .catch(error => console.error('Error removing item:', error));
}

function toggleCart() {
    document.getElementById('cart').classList.toggle('open');
}

function showCheckout() {
    if (cart.items.length === 0) return;
    document.getElementById('checkoutModal').classList.add('open');
}

function closeCheckout() {
    document.getElementById('checkoutModal').classList.remove('open');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 3000;
        animation: slideIn 0.3s;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function closeSuccess() {
    document.getElementById('successModal').classList.remove('open');
    loadProducts();
}

document.getElementById('checkoutForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const customerName = document.getElementById('customerName').value;
    const customerEmail = document.getElementById('customerEmail').value;
    const customerAddress = document.getElementById('customerAddress').value;

    fetch(`${API_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sessionId,
            customerName,
            customerEmail,
            customerAddress
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log(data);

            ldClient.track('checkout-total', null, data.total);

            closeCheckout();
            document.getElementById('orderId').textContent = data.orderId;
            document.getElementById('orderTotal').textContent = `$${data.total.toFixed(2)}`;
            document.getElementById('successModal').classList.add('open');
            
            document.getElementById('checkoutForm').reset();
            loadCart();
            toggleCart();
        } else {
            alert(data.error || 'Checkout failed');
        }
    })
    .catch(error => {
        console.error('Error during checkout:', error);
        alert('Checkout failed. Please try again.');
    });
});

loadProducts();
loadCart();
