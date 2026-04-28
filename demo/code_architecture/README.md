# Demo Blog API

A simple blog API demonstrating monitoring integration with the API Monitoring System.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
   - Copy `.env` file and fill in your monitoring API key after onboarding
   - Update `MONITORING_API_KEY` with your assigned key

3. Start the server:
```bash
npm start
```

## API Endpoints

### GET /api/posts
Get all blog posts with optional filtering.

**Query Parameters:**
- `author` - Filter posts by author name
- `tag` - Filter posts by tag
- `limit` - Maximum number of posts to return (default: 10)

**Example:**
```bash
curl "http://localhost:3002/api/posts?tag=nodejs&limit=5"
```

### GET /api/posts/:postId/comments
Get comments for a specific blog post.

**Parameters:**
- `postId` - The ID of the blog post

**Example:**
```bash
curl "http://localhost:3002/api/posts/1/comments"
```

## Testing

Test the monitoring integration:
```bash
npm test
```

## Monitoring

This API automatically sends monitoring data to the configured monitoring system:
- Response times
- Status codes
- Endpoint usage
- Error rates

Check your monitoring dashboard to see real-time API performance metrics.