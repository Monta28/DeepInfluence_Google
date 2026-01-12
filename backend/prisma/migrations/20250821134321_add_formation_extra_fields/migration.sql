-- AlterTable
ALTER TABLE "formations" ADD COLUMN "included" TEXT;
ALTER TABLE "formations" ADD COLUMN "objectives" TEXT;
ALTER TABLE "formations" ADD COLUMN "prerequisites" TEXT;
ALTER TABLE "formations" ADD COLUMN "tools" TEXT;

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "adminId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" INTEGER,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "phone" TEXT,
    "bio" TEXT,
    "location" TEXT,
    "avatar" TEXT,
    "userType" TEXT NOT NULL DEFAULT 'user',
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "joinDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "coins" INTEGER NOT NULL DEFAULT 100,
    "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
    "googleId" TEXT,
    "facebookId" TEXT,
    "sessionsCompleted" INTEGER NOT NULL DEFAULT 0,
    "formationsFollowed" INTEGER NOT NULL DEFAULT 0,
    "learningHours" INTEGER NOT NULL DEFAULT 0,
    "expertsFollowed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("avatar", "bio", "coins", "createdAt", "email", "expertsFollowed", "facebookId", "firstName", "formationsFollowed", "googleId", "id", "isVerified", "joinDate", "lastName", "learningHours", "location", "password", "phone", "profileCompleted", "sessionsCompleted", "updatedAt", "userType") SELECT "avatar", "bio", "coins", "createdAt", "email", "expertsFollowed", "facebookId", "firstName", "formationsFollowed", "googleId", "id", "isVerified", "joinDate", "lastName", "learningHours", "location", "password", "phone", "profileCompleted", "sessionsCompleted", "updatedAt", "userType" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
CREATE UNIQUE INDEX "users_facebookId_key" ON "users"("facebookId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
