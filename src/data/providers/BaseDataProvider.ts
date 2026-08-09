import fs from "fs";
import path from "path";

import { ENV } from "../../../config/envLoader.js";
import { IDataProvider } from "./IDataProvider.js";
import { interpolateSecrets } from "../utils/secretInterpolation.js";

export abstract class BaseDataProvider implements IDataProvider {
  private readonly cache = new Map<string, unknown>();

  protected abstract readonly extension: string;

  protected abstract parse<T>(filePath: string): T;

  public load<T>(fileName: string): T {
    const cacheKey = `${ENV.TEST_DATA_FORMAT}:${fileName}`;

    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached as T;
    }

    const filePath = this.resolveFilePath(fileName);

    const parsed = this.parse<T>(filePath);

    // Any `${secretKey}` value anywhere in the dataset gets resolved here, once, before caching —
    // see src/data/utils/secretInterpolation.ts. Every provider (json/yaml/csv/excel) shares this
    // one method, so this applies uniformly regardless of format.
    const data = interpolateSecrets(parsed, ENV.SECRETS, ENV.ENVIRONMENT);

    this.cache.set(cacheKey, data);

    return data;
  }
  private resolveFilePath(fileName: string): string {
    const filePath = path.resolve(
      process.cwd(),
      "src",
      "data",
      "datasets",
      ENV.TEST_DATA_FORMAT,
      `${fileName}.${this.extension}`,
    );
    if (!fs.existsSync(filePath)) {
      throw new Error(`Test data file not found: ${filePath}`);
    }

    return filePath;
  }
}
