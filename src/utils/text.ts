import path from "path";
import { chain } from "lodash";

export const safeDecodeURIComponent = (uri: string): string => {
  try {
    return decodeURIComponent(uri);
  } catch {
    return uri;
  }
};

export const cleanFilename = (filename: string): string =>
  chain(filename)
    .deburr()
    .replace(/[+ \n]/g, "_")
    .value();

export const getExtensionFromFilename = (filename: string): string => {
  // file extensions are usually no longer than 4 characters
  // and consist only of alphanumeric characters.
  const isAlphaNumeric = (string: string) => /^[a-zA-Z0-9]+$/.test(string);
  const extension = path.extname(filename);
  if (extension.length > 4 || !isAlphaNumeric(extension)) {
    return "";
  }
  return extension;
};

export const trimFilename = (filename: string, maxLength: number): string => {
  if (filename.length < maxLength) {
    return filename;
  }
  const extension = getExtensionFromFilename(filename);

  return `${filename.slice(0, maxLength - extension.length - 1)}.${extension}`;
};
