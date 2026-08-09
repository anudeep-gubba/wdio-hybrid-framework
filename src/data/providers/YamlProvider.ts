import fs from "fs";
import YAML from "yaml";

import { BaseDataProvider } from "./BaseDataProvider.js";

export class YamlProvider extends BaseDataProvider {
  protected readonly extension = "yaml";

  protected parse<T>(filePath: string): T {
    return YAML.parse(fs.readFileSync(filePath, "utf8")) as T;
  }
}
