const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Example route
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Vercel API!' });
});

// You can add more routes here

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
