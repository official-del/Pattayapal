# Pattayapal Portfolio Backend

Backend API สำหรับจัดการ Portfolio งานของคุณ

## 🚀 เริ่มต้นใช้งาน

### ข้อกำหนด
- Node.js (v14+)
- MongoDB Atlas account (ฟรี)

### การติดตั้ง

1. **ติดตั้ง dependencies:**
```bash
cd Backend
npm install
```

2. **สร้างไฟล์ .env:**
คัดลอก `.env.example` เป็น `.env` แล้วกรอกข้อมูล:

```env
# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pattayapal-db

PORT=5000
JWT_SECRET=your_secure_secret_key_here

# Admin credentials
ADMIN_EMAIL=admin@pattayapal.com
ADMIN_PASSWORD=your_secure_password

# Client URL
CLIENT_URL=http://localhost:5173
```

3. **ติดตั้ง MongoDB Atlas:**
   - ไปที่ [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - สร้าง cluster ฟรี
   - คัดลอก connection string

4. **รัน server:**
```bash
npm start          # Production
npm run dev        # Development with nodemon
```

Server จะรันที่ `http://localhost:5000`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - สมัครสมาชิก
- `POST /api/auth/login` - เข้าสู่ระบบ
- `GET /api/auth/profile` - ดูโปรไฟล์ (ต้อง token)

### Categories
- `GET /api/categories` - ดึงหมวดหมู่ทั้งหมด
- `GET /api/categories/:id` - ดึงหมวดหมู่ตาม ID
- `POST /api/categories` - เพิ่มหมวดหมู่ (ต้อง token)
- `PUT /api/categories/:id` - แก้ไขหมวดหมู่ (ต้อง token)
- `DELETE /api/categories/:id` - ลบหมวดหมู่ (ต้อง token)

### Works
- `GET /api/works` - ดึงงานทั้งหมด
- `GET /api/works/:id` - ดึงงานตาม ID
- `POST /api/works` - เพิ่มงาน (ต้อง token)
- `PUT /api/works/:id` - แก้ไขงาน (ต้อง token)
- `DELETE /api/works/:id` - ลบงาน (ต้อง token)
- `PUT /api/works/:id/publish` - เผยแพร่งาน (ต้อง token)

## Query Parameters

### Get Works
```
?category=categoryId  - กรองตามหมวดหมู่
?status=published    - กรองตามสถานะ (draft/published)
?featured=true       - กรองเฉพาะ featured works
?limit=10            - จำนวนรายการต่อหน้า
?page=1              - หมายเลขหน้า
```

## 🔐 Authentication Headers

ส่งฟ้อ token ใน header:
```
Authorization: Bearer <your_jwt_token>
```

## 📁 Project Structure

```
Backend/
├── models/          # Database schemas
├── routes/          # API routes
├── controller/      # Request handlers
├── middleware/      # Custom middleware
├── config/          # Configuration files
├── uploads/         # Image storage
├── server.js        # Main entry point
└── .env             # Environment variables
```

## 🛠️ Tech Stack

- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## ⚙️ Environment Variables

| Variable | Description |
|----------|-------------|
| MONGODB_URI | MongoDB connection string |
| PORT | Server port (default: 5000) |
| JWT_SECRET | Secret for JWT tokens |
| CLIENT_URL | Frontend URL for CORS |

---

**หมายเหตุ:** ในการใช้งาน ให้แน่ใจว่าได้ตั้ง `.env` ให้ถูกต้องก่อนรัน server
