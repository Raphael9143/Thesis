require('dotenv').config()

const http = require('http')
const jwt = require('jsonwebtoken')
const app = require('./routes/index')
const { init } = require('./realtime/socket')

const port = process.env.PORT;

// Create HTTP server and attach Socket.IO
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
})

// Socket auth via JWT; put each user in their own room
io.use((socket, next) => {
    try {
        const hdr = socket.handshake.headers?.authorization
        const token = socket.handshake.auth?.token || (hdr && hdr.startsWith('Bearer ') ? hdr.split(' ')[1] : null)
        if (!token) return next(new Error('Unauthorized'))
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        socket.user = decoded
        socket.join(`user:${decoded.userId}`)
        next()
    } catch (err) {
        next(new Error('Unauthorized'))
    }
})

io.on('connection', (socket) => {
    console.log('socket connected:', socket.user?.userId)
    socket.on('disconnect', (reason) => {
        console.log('socket disconnected:', socket.user?.userId, reason)
    })
})

// Make io available to the app
init(io)

server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`)
})