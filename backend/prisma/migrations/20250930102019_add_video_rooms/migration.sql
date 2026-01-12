-- CreateTable
CREATE TABLE "video_rooms" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" TEXT NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "videoSDKRoomId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "video_rooms_sessionId_key" ON "video_rooms"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "video_rooms_videoSDKRoomId_key" ON "video_rooms"("videoSDKRoomId");

-- CreateIndex
CREATE INDEX "video_rooms_appointmentId_idx" ON "video_rooms"("appointmentId");

-- CreateIndex
CREATE INDEX "video_rooms_videoSDKRoomId_idx" ON "video_rooms"("videoSDKRoomId");
