-- CreateTable
CREATE TABLE "Position" (
    "id" SERIAL NOT NULL,
    "position_code" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Position_position_code_key" ON "Position"("position_code");
