-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "hashedPassword" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'operator',
    "signature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fund" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WireInstruction" (
    "id" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "beneficiaryName" TEXT NOT NULL,
    "beneficiaryAddress" TEXT,
    "bankName" TEXT NOT NULL,
    "bankAddress" TEXT,
    "abaRouting" TEXT,
    "accountNumber" TEXT,
    "swift" TEXT,
    "iban" TEXT,
    "forFurtherCredit" TEXT,
    "referenceInstructions" TEXT,
    "remittanceEmail" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "verificationStatus" TEXT NOT NULL DEFAULT 'unverified',
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WireInstruction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapitalCallRequest" (
    "id" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "wireInstructionId" TEXT NOT NULL,
    "investorEntityName" TEXT,
    "capitalCallNumber" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "memoOverride" TEXT,
    "ccList" TEXT,
    "toRecipient" TEXT,
    "subjectRendered" TEXT NOT NULL,
    "bodyRenderedPlain" TEXT NOT NULL,
    "bodyRenderedHtml" TEXT,
    "wireSnapshot" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CapitalCallRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'admin',

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Fund_name_key" ON "Fund"("name");

-- CreateIndex
CREATE INDEX "WireInstruction_fundId_idx" ON "WireInstruction"("fundId");

-- CreateIndex
CREATE INDEX "CapitalCallRequest_fundId_idx" ON "CapitalCallRequest"("fundId");

-- CreateIndex
CREATE INDEX "CapitalCallRequest_createdByUserId_idx" ON "CapitalCallRequest"("createdByUserId");

-- CreateIndex
CREATE INDEX "Contact_fundId_idx" ON "Contact"("fundId");

-- AddForeignKey
ALTER TABLE "WireInstruction" ADD CONSTRAINT "WireInstruction_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapitalCallRequest" ADD CONSTRAINT "CapitalCallRequest_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapitalCallRequest" ADD CONSTRAINT "CapitalCallRequest_wireInstructionId_fkey" FOREIGN KEY ("wireInstructionId") REFERENCES "WireInstruction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapitalCallRequest" ADD CONSTRAINT "CapitalCallRequest_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
