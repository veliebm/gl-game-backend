/** Message to send a room code to a client. */
export class RoomCodeMessage {
  /** The Type of this object. */
  type = "roomCode";
  /** The room code. */
  roomCode: string;

  constructor(roomCode: string) {
    this.roomCode = roomCode;
  }

  /** Serializes this object to JSON. */
  toJson() {
    return JSON.stringify(this);
  }
}
