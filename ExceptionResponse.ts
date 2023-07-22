/** Error response that can be sent to the client. */
export class ExceptionResponse {
  /** The Type of this object. */
  type = "exception";
  /** The HTTP status code to return. */
  code: number;
  /** The message to accompany the error. */
  message: string;

  constructor(code: number, message: string) {
    this.code = code;
    this.message = message;
  }
}
