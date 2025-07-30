# Authentication API

API đăng nhập và đăng ký cho ứng dụng sử dụng MySQL database.

## Cài đặt Database

### 1. Cài đặt MySQL
- Tải và cài MySQL từ: https://dev.mysql.com/downloads/mysql/
- Hoặc sử dụng XAMPP: https://www.apachefriends.org/

### 2. Tạo Database
```sql
-- Chạy trong MySQL command line hoặc phpMyAdmin
CREATE DATABASE IF NOT EXISTS thesis_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Cập nhật .env file
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=thesis_db
DB_USER=root
DB_PASSWORD=your_mysql_password
```

## Endpoints

### 1. Đăng ký
**POST** `/api/auth/register`

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "123456"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "createdAt": "2025-01-22T..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Đăng nhập
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "123456"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "createdAt": "2025-01-22T..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Lấy thông tin profile
**GET** `/api/auth/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Response Success:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "createdAt": "2025-01-22T..."
    }
  }
}
```

## Cách test API

### Sử dụng curl:

1. **Đăng ký:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com", 
    "password": "123456"
  }'
```

2. **Đăng nhập:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456"
  }'
```

3. **Lấy profile:**
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Sử dụng Postman:

1. Tạo collection mới
2. Thêm request POST cho register và login
3. Thêm request GET cho profile với Authorization header

## Error Responses

```json
{
  "success": false,
  "message": "Mô tả lỗi"
}
```

## Chạy server

```bash
npm run dev  # Development mode
npm start    # Production mode
```

Server sẽ chạy tại: http://localhost:3000
