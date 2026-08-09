import allureReporter from "@wdio/allure-reporter";

export class AttachmentHelper {
  static async attachJson(name: string, data: unknown): Promise<void> {
    await allureReporter.addAttachment(name, JSON.stringify(data, null, 2), "application/json");
  }

  static async attachText(name: string, text: string): Promise<void> {
    await allureReporter.addAttachment(name, text, "text/plain");
  }
}
