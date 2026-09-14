# 🏥 MediBridge

<p align="center">
  <strong>Full-Stack Online Pharmacy Management Platform</strong>
</p>

<p align="center">
  A digital pharmacy platform connecting customers and pharmacists through
  medicine ordering, prescription management, payments, inventory, and order processing.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.x-3776AB?style=for-the-badge&logo=python&logoColor=white">
  <img src="https://img.shields.io/badge/Django-5.x-092E20?style=for-the-badge&logo=django&logoColor=white">
  <img src="https://img.shields.io/badge/DRF-API-red?style=for-the-badge">
  <img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white">
  <img src="https://img.shields.io/badge/HTML5-Frontend-E34F26?style=for-the-badge&logo=html5&logoColor=white">
  <img src="https://img.shields.io/badge/CSS3-Frontend-1572B6?style=for-the-badge&logo=css3&logoColor=white">
  <img src="https://img.shields.io/badge/JavaScript-Frontend-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black">
</p>

---

## 🌿 About the Project

**MediBridge** is a full-stack online pharmacy management platform built using **Django, Django REST Framework, PostgreSQL, HTML, CSS, and JavaScript**.

The platform provides customers with a complete medicine ordering experience while giving pharmacists a dedicated dashboard to manage orders, prescriptions, medicines, and inventory.

Customers can browse medicines, search for products, view medicine details, add medicines to their cart, upload prescriptions, place orders, make payments, and track their orders.

Pharmacists can manage medicines and inventory, review prescriptions, process customer orders, update order statuses, and receive important notifications.

---

# ✨ Key Features

## 👤 Customer

- 🔐 Registration and Login
- 🔑 JWT Authentication
- 💊 Browse and Search Medicines
- 📋 Medicine Details and Categories
- 🛒 Shopping Cart
- 📄 Prescription Upload
- 🤖 AI-Assisted Prescription Processing
- 💳 Razorpay Online Payment
- 💵 Cash on Delivery
- 🔄 Payment Verification & Retry
- 📦 Order History
- 🚚 Active Order Tracking
- 🔔 Notifications
- 📧 Order Email Notifications

## 👨‍⚕️ Pharmacist

- 📊 Dedicated Pharmacist Dashboard
- 📦 Customer Order Management
- 📋 Prescription Verification
- ❌ Prescription Rejection
- 📝 Pharmacist Notes
- 💊 Medicine Management
- 📦 Inventory Management
- ⚠️ Low-Stock Detection
- 🔔 New Order Notifications
- 🔔 Low-Stock Notifications
- 🚚 Order Status Management
- 👤 Pharmacist Profile

## 👑 Admin

- Django Admin Panel
- User Management
- Pharmacist Management
- Medicine Management
- Database Management

---

# 🔄 Platform Workflow

```text
                    👤 CUSTOMER
                        │
                        ▼
                 Browse Medicines
                        │
                        ▼
                   Add to Cart
                        │
                        ▼
             Upload Prescription
                  (if required)
                        │
                        ▼
                 🤖 AI Processing
                        │
                        ▼
                    Checkout
                        │
                        ▼
                  💳 Payment
                        │
                        ▼
                  Place Order
                        │
                        ▼
                👨‍⚕️ PHARMACIST
                        │
                        ▼
                  Review Order
                        │
                        ▼
            Verify Prescription
              (if required)
                        │
                        ▼
                Check Inventory
                        │
                        ▼
                 Process Order
                        │
                        ▼
              Pack → Ship → Deliver
                        │
                        ▼
                    📦 ORDER