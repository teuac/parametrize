-- CreateTable
CREATE TABLE "Subposition" (
    "id" SERIAL NOT NULL,
    "subposition_code" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Subposition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subposition_subposition_code_key" ON "Subposition"("subposition_code");
