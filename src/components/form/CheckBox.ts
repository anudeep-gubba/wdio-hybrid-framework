import { BaseComponent } from "../base/BaseComponent.js";

export class CheckBox extends BaseComponent {
  async check(): Promise<void> {
    if (!(await this.isChecked())) {
      await this.element.click();
    }
  }

  async uncheck(): Promise<void> {
    if (await this.isChecked()) {
      await this.element.click();
    }
  }

  async toggle(): Promise<void> {
    await this.element.click();
  }

  async isChecked(): Promise<boolean> {
    return this.element.isSelected();
  }
}
