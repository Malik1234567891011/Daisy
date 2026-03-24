-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "firstName" TEXT,
    "school" TEXT,
    "major" TEXT,
    "age" INTEGER,
    "ethnicity" TEXT,
    "schoolPreference" TEXT DEFAULT 'any',
    "ageRangeMin" INTEGER DEFAULT 18,
    "ageRangeMax" INTEGER DEFAULT 25,
    "majorPreference" TEXT,
    "ethnicityPreference" TEXT,
    "contactMethod" TEXT,
    "contactValue" TEXT,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
