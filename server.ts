import { serve } from "https://deno.land/std@0.195.0/http/server.ts";

const activeSockets: Set<WebSocket> = new Set();

function handle(request: Request): Response {
  if (request.headers.get("upgrade") !== "websocket") {
    console.error(`A client tried to send a request that wasn't a WebSocket.`);
    return new Response("This server only accepts WebSocket connections.", {
      status: 501,
    });
  }

  const { socket, response } = Deno.upgradeWebSocket(request);

  socket.onmessage = ({ data }) => {
    for (const activeSocket of activeSockets) {
      if (activeSocket === socket) {
        continue;
      }
      activeSocket.send(data);
    }
  };

  socket.onopen = () => {
    console.log(`Client has connected.`);
    activeSockets.add(socket);
  };

  socket.onclose = () => {
    console.log(`Client has disconnected.`);
    activeSockets.delete(socket);
  };

  return response;
}

serve(handle, { port: 8000 });
