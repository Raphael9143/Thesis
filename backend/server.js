require("dotenv").config();

const http = require("http");
const jwt = require("jsonwebtoken");
const app = require("./routes/index");
const { init } = require("./realtime/socket");
const { sequelize, testConnection } = require("./config/database");

const port = process.env.PORT;

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Socket auth via JWT; put each user in their own room
io.use((socket, next) => {
  try {
    const hdr = socket.handshake.headers?.authorization;
    const token =
      socket.handshake.auth?.token ||
      (hdr && hdr.startsWith("Bearer ") ? hdr.split(" ")[1] : null);
    if (!token) return next(new Error("Unauthorized"));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    socket.join(`user:${decoded.userId}`);
    next();
  } catch (err) {
    console.error("Socket auth error:", err);
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  console.log("socket connected:", socket.user?.userId);
  socket.on("disconnect", (reason) => {
    console.log("socket disconnected:", socket.user?.userId, reason);
  });
});

// Make io available to the app
init(io);

// Startup: test DB connection, register models/associations, sync DB, then start server
async function startServer() {
  try {
    await testConnection();

    // require models & associations so Sequelize knows about all models
    // models/index.js will load all files in models/ and wire associations
    require("./models");

    // sync DB (use migrations in production; this is convenient for development)
    if (process.env.SEED_DB === "true") {
      try {
        await sequelize
          .sync({ alter: true })
          .then(async () => {
            const initDatabase = require("./initDatabase");
            await initDatabase();
            console.log("✅ Database synced (models -> tables)");
          })
          .catch((error) => {
            console.error("❌ Database sync failed:", error.message);
          });
      } catch (syncErr) {
        console.error("⚠️  Database sync failed:", syncErr.message || syncErr);
      }
    }

    server.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);
    });
  } catch (err) {
    console.error("Startup error:", err.message || err);
    process.exit(1);
  }
}

startServer();
