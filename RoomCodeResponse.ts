/** Message to send a room code to a client. */
export class RoomCodeResponse {
  /** The Type of this object. */
  type = "roomCode";
  /** The room code. */
  roomCode: string;

  constructor(roomCode: string) {
    this.roomCode = roomCode;
  }
}
