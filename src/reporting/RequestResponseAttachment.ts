import { AttachmentHelper } from "./AttachmentHelper.js";

export class RequestResponseAttachment {
  static async attachRequest(body: unknown): Promise<void> {
    await AttachmentHelper.attachJson("API Request", body);
  }

  static async attachResponse(body: unknown): Promise<void> {
    await AttachmentHelper.attachJson("API Response", body);
  }

  static async attachHeaders(headers: unknown): Promise<void> {
    await AttachmentHelper.attachJson("HTTP Headers", headers);
  }
}
