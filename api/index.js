export default function handler(req, res) {
    if (req.method === 'GET') {
      res.status(200).json({ message: 'Hello from Vercel API!' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  }