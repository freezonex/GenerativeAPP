export default async function handler(req, res) {
  const backendUrl = 'http://192.168.31.75:8080/api/endpoint';
  const response = await fetch(backendUrl, {
    method: req.method,
    headers: req.headers,
    body: req.body,
  });
  const data = await response.json();
  res.status(response.status).json(data);
}
