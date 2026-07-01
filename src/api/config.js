// client/src/api/config.js
//
// In local dev, leaving this blank works fine — Vite's proxy (see
// vite.config.js) silently forwards relative /api/... calls to the backend
// on localhost:3001. That proxy ONLY exists in local dev; it does nothing
// once this is actually deployed.
//
// If the frontend and backend end up deployed at different addresses (e.g.
// frontend on S3/CloudFront, backend on EC2/ECS — a common AWS split),
// set VITE_API_BASE_URL to the backend's real URL at build time and every
// API call in the app will automatically point there instead.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
