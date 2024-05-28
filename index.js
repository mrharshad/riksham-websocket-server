import http from "http";
import { Server } from "socket.io";

async function init() {
  const httpServer = http.createServer();

  const PORT = 4000;
  const io = new Server({
    cors: {
      allowedHeaders: ["http://localhost:3000"],
      origin: "http://localhost:3000",
    },
  });
  io.attach(httpServer);
  httpServer.listen(PORT, () => {
    console.log(`HTTP server started at PORT: ${PORT}`);
  });

  io.on("connect", (socket) => {
    console.log(`New Socket Connected ${socket.id}`);
    socket.on("message", async (message) => {
      console.log(`New message recived : ${message}`);
      io.emit("message", message);
    });
  });
}

init();
