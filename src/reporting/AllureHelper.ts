import allureReporter from "@wdio/allure-reporter";

export class AllureHelper {
  /**
   * Wraps a logical UI/API action in an Allure step, recording pass/fail status.
   * Delegates to @wdio/allure-reporter's own `step()` helper, which is the direct
   * WDIO equivalent of `allure-js-commons`' `allure.step(name, fn)`.
   */
  static async step<T>(stepName: string, action: () => Promise<T>): Promise<T> {
    return allureReporter.step(stepName, action);
  }

  static async description(description: string): Promise<void> {
    await allureReporter.addDescription(description, "text");
  }

  static async severity(
    level: "blocker" | "critical" | "normal" | "minor" | "trivial",
  ): Promise<void> {
    await allureReporter.addSeverity(level);
  }

  static async owner(owner: string): Promise<void> {
    await allureReporter.addOwner(owner);
  }

  static async tag(...tags: string[]): Promise<void> {
    for (const tag of tags) {
      await allureReporter.addTag(tag);
    }
  }
}
