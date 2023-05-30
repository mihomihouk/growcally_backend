/*
  Warnings:

  - You are about to drop the column `fileKey` on the `File` table. All the data in the column will be lost.
  - Added the required column `portraitFileKey` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `squareFileKey` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "File" DROP COLUMN "fileKey",
ADD COLUMN     "portraitFileKey" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "squareFileKey" TEXT NOT NULL DEFAULT '';
