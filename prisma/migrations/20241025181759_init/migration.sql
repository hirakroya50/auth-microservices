-- CreateTable
CREATE TABLE "Hiteaaa" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,

    CONSTRAINT "Hiteaaa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Hiteaaa_email_key" ON "Hiteaaa"("email");
