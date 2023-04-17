export const makeFileKey = ({
  fileId,
  filename,
}: {
  fileId: string;
  filename: string;
}): string => `${fileId}/${filename}`;
