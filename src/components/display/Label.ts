import { BaseComponent } from "../base/BaseComponent.js";

export class Label extends BaseComponent {
  async text(): Promise<string> {
    return this.element.getText();
  }
}
