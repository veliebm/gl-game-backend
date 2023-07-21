import { serve } from "https://deno.land/std@0.195.0/http/server.ts";
import { RequestOfferResponse } from "./RequestOfferResponse.ts";
import { ExceptionResponse } from "./ExceptionResponse.ts";
import { RoomCodeResponse } from "./RoomCodeResponse.ts";

const activeSockets: Record<string, WebSocket> = {};
const rooms: Record<string, string> = {};

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
    clientId = `client-${makeRandomString(4)}`;
    console.log(`${clientId} has connected.`);
    activeSockets[clientId] = socket;
  };

  socket.onclose = () => {
    console.log(`${clientId} has disconnected.`);
    delete activeSockets[clientId];
    delete rooms[clientId];
  };

  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    console.log(`Incoming message from ${clientId} with type: ${message.type}`);

    if (
      message.type === "candidate" || message.type === "offer" ||
      message.type === "answer"
    ) {
      const recipient = activeSockets[message.id];
      message.id = clientId;
      recipient.send(JSON.stringify(message));
    } else if (message.type === "host") {
      const roomCode = `room-${makeRandomString(4)}`;
      rooms[clientId] = roomCode;
      console.log(`${clientId} has made a new room: ${roomCode}`);
      socket.send(new RoomCodeResponse(roomCode).toJson());
    } else if (message.type === "join") {
      console.log(`${clientId} has asked to join room: ${message.roomCode}`);
      for (const activeSocketId of Object.keys(activeSockets)) {
        if (rooms[activeSocketId] === message.roomCode) {
          console.log(
            `Asking ${activeSocketId} to send an offer to ${clientId}.`,
          );
          activeSockets[activeSocketId].send(
            new RequestOfferResponse(clientId).toJson(),
          );
        }
      }
      rooms[clientId] = message.roomCode;
    }
  };

  return response;
}

/** Returns a random string. */
function makeRandomString(length: number): string {
  const allowedCharacters =
    "abcdefjhigklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
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
