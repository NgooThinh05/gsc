import './config/prisma.js';
import app from './app.js';

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`GSC Procurement API listening on port ${port}`);
});
