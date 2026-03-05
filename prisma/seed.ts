import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      hashedPassword: hashSync("password", 10),
      role: "admin",
      signature: "Capital Call Operations Team",
    },
  });

  // Create operator user
  await prisma.user.upsert({
    where: { email: "operator@example.com" },
    update: {},
    create: {
      email: "operator@example.com",
      name: "Operator User",
      hashedPassword: hashSync("password", 10),
      role: "operator",
      signature: "Operations Team",
    },
  });

  // Create sample funds
  const fund1 = await prisma.fund.upsert({
    where: { name: "Acme Growth Fund III" },
    update: {},
    create: {
      name: "Acme Growth Fund III",
      legalName: "Acme Growth Fund III, LP",
      defaultCurrency: "USD",
      status: "active",
      notes: "Flagship growth equity fund, 2025 vintage",
    },
  });

  const fund2 = await prisma.fund.upsert({
    where: { name: "Meridian Real Estate Partners" },
    update: {},
    create: {
      name: "Meridian Real Estate Partners",
      legalName: "Meridian Real Estate Partners Fund I, LP",
      defaultCurrency: "USD",
      status: "active",
      notes: "Real estate co-investment vehicle",
    },
  });

  const fund3 = await prisma.fund.upsert({
    where: { name: "Nordic Ventures Euro Fund" },
    update: {},
    create: {
      name: "Nordic Ventures Euro Fund",
      legalName: "Nordic Ventures Euro Fund SCSp",
      defaultCurrency: "EUR",
      status: "active",
    },
  });

  // Wire instructions for Fund 1
  await prisma.wireInstruction.create({
    data: {
      fundId: fund1.id,
      label: "Standard USD Wires",
      beneficiaryName: "Acme Growth Fund III, LP",
      beneficiaryAddress: "123 Finance Street, New York, NY 10004",
      bankName: "JPMorgan Chase Bank, N.A.",
      bankAddress: "383 Madison Avenue, New York, NY 10179",
      abaRouting: "021000021",
      accountNumber: "123456789012",
      forFurtherCredit: "Acme Growth Fund III Capital Account",
      referenceInstructions: "Capital Call [CALL#] - [INVESTOR NAME]",
      remittanceEmail: "treasury@acmefunds.com",
      isActive: true,
      verificationStatus: "verified",
      lastVerifiedAt: new Date("2026-01-15"),
    },
  });

  // Wire instructions for Fund 2
  await prisma.wireInstruction.create({
    data: {
      fundId: fund2.id,
      label: "Standard USD Wires",
      beneficiaryName: "Meridian Real Estate Partners Fund I, LP",
      bankName: "Bank of America, N.A.",
      bankAddress: "100 Federal Street, Boston, MA 02110",
      abaRouting: "026009593",
      accountNumber: "987654321098",
      referenceInstructions: "MRE Capital Call",
      isActive: true,
      verificationStatus: "verified",
      lastVerifiedAt: new Date("2025-11-01"),
    },
  });

  // Wire instructions for Fund 3
  await prisma.wireInstruction.create({
    data: {
      fundId: fund3.id,
      label: "EUR Wires",
      beneficiaryName: "Nordic Ventures Euro Fund SCSp",
      bankName: "Deutsche Bank AG",
      bankAddress: "Taunusanlage 12, 60325 Frankfurt, Germany",
      swift: "DEUTDEFF",
      iban: "DE89370400440532013000",
      referenceInstructions: "NV Euro Fund Capital Call",
      isActive: true,
      verificationStatus: "unverified",
    },
  });

  // Contacts
  for (const contact of [
    { fundId: fund1.id, name: "Jane Smith", email: "jane.smith@acmefunds.com", type: "admin" },
    { fundId: fund1.id, name: "Treasury Dept", email: "treasury@acmefunds.com", type: "remittance" },
    { fundId: fund2.id, name: "Mike Johnson", email: "mjohnson@meridianre.com", type: "admin" },
    { fundId: fund3.id, name: "Lars Eriksson", email: "lars@nordicvc.eu", type: "admin" },
  ]) {
    await prisma.contact.create({ data: contact });
  }

  console.log("Seeded successfully!");
  console.log("Login credentials:");
  console.log("  Admin: admin@example.com / password");
  console.log("  Operator: operator@example.com / password");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
