import { ENV } from "../../../config/envLoader.js";

import { IDataProvider } from "../providers/IDataProvider.js";
import { JsonProvider } from "../providers/JsonProvider.js";
import { YamlProvider } from "../providers/YamlProvider.js";
import { CsvProvider } from "../providers/CsvProvider.js";
import { ExcelProvider } from "../providers/ExcelProvider.js";

type ProviderConstructor = new () => IDataProvider;

export class DataProviderFactory {
  private static readonly providers: Record<string, ProviderConstructor> = {
    json: JsonProvider,

    yaml: YamlProvider,

    csv: CsvProvider,

    excel: ExcelProvider,
  };

  static create(): IDataProvider {
    const Provider = this.providers[ENV.TEST_DATA_FORMAT];
    if (!Provider) {
      throw new Error(`Unsupported TEST_DATA_FORMAT: ${ENV.TEST_DATA_FORMAT}`);
    }

    return new Provider();
  }
}
