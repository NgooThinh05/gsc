import cors from 'cors';
import express from 'express';
import authRoutes from './routes/auth.routes.js';
import contractsRoutes from './routes/contracts.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import warehouseRoutes from './routes/warehouse.routes.js';
import deliveryRoutes from './routes/delivery.routes.js';
import invoicesRoutes from './routes/invoices.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import usersRoutes from './routes/users.routes.js';
import productsRoutes from './routes/products.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/contracts', contractsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/warehouse', warehouseRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Không tìm thấy API' });
});

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    message: error.message || 'Lỗi máy chủ',
    ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {})
  });
});

export default app;
