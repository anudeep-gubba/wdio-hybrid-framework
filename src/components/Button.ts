import { BaseComponent } from "./base/BaseComponent.js";

export class Button extends BaseComponent {
  async click(): Promise<void> {
    await this.element.click();
  }

  async doubleClick(): Promise<void> {
    await this.element.doubleClick();
  }

  async rightClick(): Promise<void> {
    await this.element.click({ button: "right" });
  }
}
