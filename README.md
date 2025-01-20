# Zenith - Medical Camp Management System (MCMS) (Server Side)

This is the backend of **Zenith**, a Medical Camp Management System (MCMS) built using **Node.js** and **Express.js**. The server provides a secure API for managing camps, users, transactions, feedback, and authentication.

---

## Key Features  
- **JWT Authentication and Authorization:** Secure role-based access control with JSON Web Tokens.  
- **MongoDB Integration:** Robust database design for camps, users, registrations, and transactions.  
- **Secure Payment Processing:** Stripe integration for handling online payments.  
- **Data Filtering and Search:** Search camps by name, location, healthcare professional, and description.  
- **Role-Based API Access:** Admins can manage camps, view all user data, and approve registrations.  
- **Participant Count Management:** Automatically updates participant counts on camp registrations.  
- **Feedback Aggregation:** Collects and retrieves feedback for participants and organizers.  
- **Reusable Middleware:** Simplifies token verification and admin access checks.  
- **Sorting and Pagination:** Ensures efficient browsing of large datasets.  
- **Error Handling:** Graceful management of server-side errors for a seamless experience.  

---

## Technologies Used  

### Core Technologies:  
- **Node.js:** Backend JavaScript runtime.  
- **Express.js:** Lightweight web application framework.  
- **MongoDB:** NoSQL database for scalable and flexible data storage.  

### Additional Libraries:  
- **jsonwebtoken (JWT):** Secure API authentication.  
- **Stripe:** Payment gateway integration.  
- **dotenv:** Environment variable management.  
- **CORS:** Cross-Origin Resource Sharing for secure client-server communication.  
- **MongoDB Native Driver:** Direct MongoDB interaction for efficient queries.  

---

## API Overview  

### Authentication APIs  
- **POST /jwt/sign-in:** Generate JWT for authenticated users.  
- **Middleware:** Verify tokens and check admin privileges.  

### Camp Management APIs  
- **POST /camps:** Add a new camp (Admin only).  
- **GET /camps:** Retrieve all camps with sorting.  
- **GET /camps/popular:** Retrieve the most popular camps.  
- **GET /camps/:id:** Get details of a specific camp.  
- **PATCH /update-camp/:id:** Update camp details (Admin only).  
- **DELETE /delete-camp/:id:** Delete a camp (Admin only).  
- **PATCH /participant-count/inc/:id:** Increment participant count for a camp.  
- **GET /search:** Search camps by name, healthcare professional, or location.  

### User Management APIs  
- **GET /users/admin/:uid:** Check if a user is an admin.  
- **POST /users:** Add a new user.  
- **GET /users:** Retrieve all users (Admin only).  
- **PATCH /user/:uid:** Update user profile information.  
- **POST /users/google-sign-in:** Add a new user via Google Sign-In.  

### Registered Camps APIs  
- **POST /reg-camps:** Register for a camp.  
- **GET /reg-camps:** Retrieve all registered camps (Admin only).  
- **GET /reg-camps/:uid:** Retrieve camps registered by a specific user.  
- **DELETE /cancel-reg/:id:** Cancel a camp registration (User-specific).  

### Feedback APIs  
- **POST /feedback:** Submit feedback for a camp.  
- **GET /feedback:** Retrieve aggregated feedback with partial participant names.  

### Payment APIs  
- **POST /create-payment-intent:** Generate a Stripe payment intent.  
- **POST /transactions:** Record a transaction.  
- **GET /transactions/:uid:** Retrieve transactions for a specific user.  

### Carousel API  
- **GET /home/banner/carousel:** Retrieve carousel data for the home page.  

---

## How to Run the Server  

1. **Clone the repository:**  
   ```bash
   git clone https://github.com/your-username/zenith-server.git
   cd zenith-server
