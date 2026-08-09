import { BaseComponent } from "../base/BaseComponent.js";

export class TextBox extends BaseComponent {
  async enter(text: string): Promise<void> {
    await this.element.setValue(text);
  }

  async append(text: string): Promise<void> {
    await this.element.addValue(text);
  }

  async clear(): Promise<void> {
    await this.element.clearValue();
  }

  async value(): Promise<string> {
    return this.element.getValue();
  }
}
