require('dotenv').config();
const express = require('express');
const cors = require('cors');
const monitoringMiddleware = require('./monitoring');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Apply monitoring middleware early in the stack
app.use(monitoringMiddleware({
    serviceName: 'blog-api',
    enableLogging: true
}));

// Mock data
const posts = [
    {
        id: 1,
        title: 'Getting Started with Node.js',
        content: 'Node.js is a powerful JavaScript runtime...',
        author: 'Alice Johnson',
        tags: ['nodejs', 'javascript', 'backend'],
        publishedAt: '2024-01-10T10:00:00Z',
        views: 1250,
        likes: 89
    },
    {
        id: 2,
        title: 'API Monitoring Best Practices',
        content: 'Monitoring your APIs is crucial for maintaining...',
        author: 'Bob Smith',
        tags: ['api', 'monitoring', 'devops'],
        publishedAt: '2024-01-12T14:30:00Z',
        views: 890,
        likes: 67
    },
    {
        id: 3,
        title: 'Database Performance Optimization',
        content: 'Optimizing database performance requires...',
        author: 'Charlie Brown',
        tags: ['database', 'performance', 'optimization'],
        publishedAt: '2024-01-15T09:15:00Z',
        views: 2340,
        likes: 156
    }
];

const comments = [
    { id: 101, postId: 1, author: 'Reader1', content: 'Great article!', timestamp: '2024-01-11T12:00:00Z' },
    { id: 102, postId: 1, author: 'Developer2', content: 'Very helpful, thanks!', timestamp: '2024-01-11T15:30:00Z' },
    { id: 103, postId: 2, author: 'DevOps3', content: 'Monitoring is indeed important', timestamp: '2024-01-13T10:00:00Z' },
    { id: 104, postId: 3, author: 'DBA4', content: 'Nice optimization tips', timestamp: '2024-01-16T08:45:00Z' }
];

// API Routes

/**
 * GET /api/posts - Get all blog posts with optional filtering
 */
app.get('/api/posts', (req, res) => {
    try {
        const { author, tag, limit = 10 } = req.query;

        let filteredPosts = [...posts];

        // Filter by author
        if (author) {
            filteredPosts = filteredPosts.filter(post =>
                post.author.toLowerCase().includes(author.toLowerCase())
            );
        }

        // Filter by tag
        if (tag) {
            filteredPosts = filteredPosts.filter(post =>
                post.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
            );
        }

        // Apply limit
        filteredPosts = filteredPosts.slice(0, parseInt(limit));

        // Simulate varying response times based on data complexity
        const processingTime = filteredPosts.length * 20 + Math.random() * 100;

        setTimeout(() => {
            res.json({
                success: true,
                data: {
                    posts: filteredPosts,
                    total: filteredPosts.length,
                    filters: { author, tag, limit }
                }
            });
        }, processingTime);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching posts',
            error: error.message
        });
    }
});

/**
 * GET /api/posts/:postId/comments - Get comments for a specific post
 */
app.get('/api/posts/:postId/comments', (req, res) => {
    try {
        const { postId } = req.params;
        const postIdNum = parseInt(postId);

        // Simulate occasional server errors (3% chance)
        if (Math.random() < 0.03) {
            return res.status(503).json({
                success: false,
                message: 'Service temporarily unavailable',
                error: 'Database maintenance in progress'
            });
        }

        // Check if post exists
        const post = posts.find(p => p.id === postIdNum);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        // Get comments for the post
        const postComments = comments.filter(comment => comment.postId === postIdNum);

        // Simulate slower response for posts with more comments
        const baseTime = 50;
        const commentTime = postComments.length * 25;
        const randomTime = Math.random() * 100;
        const totalTime = baseTime + commentTime + randomTime;

        setTimeout(() => {
            res.json({
                success: true,
                data: {
                    postId: postIdNum,
                    postTitle: post.title,
                    comments: postComments,
                    totalComments: postComments.length
                }
            });
        }, totalTime);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching comments',
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        service: 'blog-api',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'Demo Blog API',
        version: '1.0.0',
        endpoints: {
            posts: '/api/posts',
            comments: '/api/posts/:postId/comments',
            health: '/health'
        },
        monitoring: process.env.MONITORING_API_KEY ? 'enabled' : 'disabled'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        availableEndpoints: ['/api/posts', '/api/posts/:postId/comments', '/health']
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

app.listen(PORT, () => {
    console.log(`📝 Blog API running on port ${PORT}`);
    console.log(`📊 Monitoring: ${process.env.MONITORING_API_KEY ? 'ENABLED' : 'DISABLED'}`);
    console.log(`🔗 Endpoints: http://localhost:${PORT}/api/posts, http://localhost:${PORT}/api/posts/:postId/comments`);
});