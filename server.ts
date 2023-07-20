import { serve } from "https://deno.land/std@0.195.0/http/server.ts";

const activeSockets: Record<string, WebSocket> = {};

function handle(request: Request): Response {
  if (request.headers.get("upgrade") !== "websocket") {
    console.error(`A client tried to send a request that wasn't a WebSocket.`);
    return new Response("This server only accepts WebSocket connections.", {
      status: 501,
    });
  }

  const { socket, response } = Deno.upgradeWebSocket(request);
  let clientId: string;

  socket.onopen = () => {
    console.log(`Client has connected.`);
    clientId = makeNewId();
    activeSockets[clientId] = socket;
    console.log(`Active clients: ${JSON.stringify(activeSockets)}`);
  };

  socket.onclose = () => {
    console.log(`Client has disconnected.`);
    delete activeSockets[clientId];
    console.log(`Active clients: ${JSON.stringify(activeSockets)}`);
  };

  socket.onmessage = ({ data }) => {};

  return response;
}

/** Returns a new ID that's not already in use. */
function makeNewId(): string {
  const length = 4;
  const allowedCharacters = "abcdefjhigklmnopqrstuvwxyz";
  while (true) {
    let id = "";
    for (let i = 0; i < length; i++) {
      id +=
        allowedCharacters[Math.floor(Math.random() * allowedCharacters.length)];
    }
    if (!(id in activeSockets)) {
      return id;
    }
  }
}

serve(handle, { port: 8000 });
