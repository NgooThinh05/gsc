# GSC Project

A full-stack web application with a powerful backend API and modern frontend interface. This project is developed for educational purposes as part of a university coursework.

## About

GSC is a comprehensive web solution designed to provide users with a seamless experience. The project consists of two main components that work together:

- **Backend**: A robust API server built with Node.js and Prisma ORM, connected to PostgreSQL for reliable data management
- **Frontend**: A modern web interface that communicates with the backend to deliver dynamic content and functionality

Both services need to run simultaneously for the full system to function properly.

## Team Members

| Name | Student ID |
|------|------------|
| Chu Anh Trường | 23020577 |
| Nông Sơn Tùng | 23020571 |
| Ngô Đức Thịnh | 23020574 |
| Phạm Quang Vinh | 23020577 |

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the Project](#running-the-project)
- [Project Structure](#project-structure)

## Tech Stack

- **Frontend**: JavaScript, Modern Web Framework
- **Backend**: Node.js, Express (or similar), Prisma ORM
- **Database**: PostgreSQL
- **Package Manager**: npm

## Prerequisites

Before getting started, ensure you have installed:

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **PostgreSQL** - [Download here](https://www.postgresql.org/download/)
- **Git** - [Download here](https://git-scm.com/)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/NgooThinh05/gsc.git
cd gsc
```

### 2. Backend Setup

Open your first terminal window and run:

```bash
# Navigate to backend directory
cd backend

# Install dependencies (first time only)
npm install

# Generate Prisma client
npx prisma generate

# (Optional) Run database migrations
npx prisma migrate dev
```

### 3. Frontend Setup

Open a second terminal window and run:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

## Running the Project

You need to run both services simultaneously in separate terminal windows.

### Start Backend Server

In the first terminal (from `/backend` directory):

```bash
npm run dev
```

The API server will start on `http://localhost:3000` (or another port - check console output)

### Start Frontend Application

In the second terminal (from `/frontend` directory):

```bash
npm run dev
```

The web application will start on `http://localhost:5173` (or another port - check console output)

Once both services are running, you can access the application in your browser. The frontend will communicate with the backend API automatically.

## Project Structure

```
gsc/
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env
└── README.md
```

## Environment Variables

Create `.env` files in both `backend/` and `frontend/` directories with necessary configuration:

### Backend `.env` example
```
DATABASE_URL="postgresql://user:password@localhost:5432/gsc_db"
PORT=3000
```

### Frontend `.env` example
```
VITE_API_URL="http://localhost:3000"
```

## Troubleshooting

- **Port already in use**: Change the port in your `.env` file or kill the process using that port
- **Database connection error**: Ensure PostgreSQL is running and `DATABASE_URL` is correct
- **Module not found**: Run `npm install` again and check for typos in imports
- **Prisma errors**: Run `npx prisma generate` and `npx prisma migrate dev`

## Support

For issues or questions, please create an issue in this repository.
