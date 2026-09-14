# 🏥 MediBridge

<p align="center">
  <strong>Full-Stack Online Pharmacy Management Platform</strong>
</p>

<p align="center">
  A digital pharmacy platform that connects customers and pharmacists through medicine ordering, prescription management, payments, inventory, and order processing.
</p>

---

## 🌿 About the Project

**MediBridge** is a full-stack online pharmacy management platform built with **Django, Django REST Framework, PostgreSQL, HTML, CSS, and JavaScript**.

The platform provides a complete medicine ordering experience for customers while giving pharmacists a dedicated dashboard to manage pharmacy operations.

Customers can browse medicines, search for products, view medicine details, add medicines to their cart, upload prescriptions, place orders, make payments, and track their orders.

Pharmacists can manage medicines and inventory, review prescriptions, process customer orders, update order statuses, and receive notifications about important pharmacy activities.

---

# ✨ Features

## 👤 Customer

### 🔐 Authentication
- User registration
- Login and logout
- JWT authentication
- Role-based access control
- Protected pages

### 💊 Medicine
- Browse medicines
- Search medicines
- View medicine details
- View medicine images
- Medicine categories
- Medicine availability

### 🛒 Shopping Cart
- Add medicines to cart
- Update medicine quantity
- Remove medicines
- View cart
- Calculate cart total

### 📋 Prescription
- Upload prescriptions
- Prescription-based medicine ordering
- AI-assisted prescription processing
- Extract medicine information from prescriptions
- Select extracted medicines for ordering

### 💳 Checkout & Payment
- Checkout system
- Razorpay online payment
- Cash on Delivery
- Payment verification
- Payment status tracking
- Retry failed payments

### 📦 Orders
- Place orders
- View order history
- View order details
- View active orders
- Track order status
- View payment status

### 🔔 Notifications
- Order-related notifications
- Important account and order updates

### 📧 Email
- Order placed email
- Order delivered email

---

# 👨‍⚕️ Pharmacist

MediBridge provides a dedicated pharmacist dashboard for managing pharmacy operations.

### 📊 Dashboard
- Pharmacy overview
- Active orders
- Order management
- Inventory access
- Medicine management
- Notifications

### 📦 Order Management
Pharmacists can:

- View customer orders
- View order details
- Review ordered medicines
- Process orders
- Update order status

### 📋 Prescription Verification

Pharmacists can:

- View prescriptions attached to orders
- Review uploaded prescriptions
- Verify prescriptions
- Reject prescriptions
- Add pharmacist notes

A prescription-based order **cannot be processed until the pharmacist verifies the prescription**.

### 💊 Medicine Management
- View medicines
- Manage medicine information
- Monitor medicine availability

### 📦 Inventory
- View inventory
- Monitor stock levels
- Manage stock
- Identify low-stock medicines

Medicines with **10 or fewer available units** are treated as low stock.

### 🔔 Notifications
Pharmacists receive notifications for:

- New orders
- Low-stock medicines

### 👤 Profile
- View pharmacist profile
- Logout

---

# 🔄 How MediBridge Works

## Customer Workflow

```text
Register / Login
      ↓
Browse Medicines
      ↓
View Medicine Details
      ↓
Add Medicines to Cart
      ↓
Upload Prescription (if required)
      ↓
AI Prescription Processing
      ↓
Select Medicines
      ↓
Checkout
      ↓
Choose Payment Method
      ↓
Place Order
      ↓
Track Order