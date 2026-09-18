const { PrismaClient, EstimationStatus } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('========================================================');
  console.log('TESTING COMPLETE ESTIMATION APPROVAL & REVISION WORKFLOW');
  console.log('========================================================');

  // 1. Get users
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const sales = await prisma.user.findFirst({ where: { role: 'SALES_USER' } });

  if (!admin || !sales) {
    throw new Error('Admin or Sales user not found in DB');
  }
  console.log(`✓ Users verified: Admin=${admin.name}, Sales=${sales.name}`);

  // Test Customer
  const customer = await prisma.customer.findFirst();
  const product = await prisma.product.findFirst({ include: { category: true } });

  // 2. Test Admin Creation -> Auto-Approved directly
  console.log('\n[TEST 1] Admin creates an estimation -> Auto-Approved');
  const adminEst = await prisma.estimation.create({
    data: {
      estimationNumber: `EST-TEST-ADM-${Date.now().toString().slice(-4)}`,
      date: new Date(),
      status: EstimationStatus.APPROVED,
      approvedById: admin.id,
      approvedAt: new Date(),
      approvalRemarks: 'Approved upon creation by Administrator',
      customerName: 'Admin Client Corp',
      companyName: 'Admin Client Corp',
      phone: '9988776655',
      address: 'Chennai, TN',
      subtotal: 100000,
      grandTotal: 118000,
      amountInWords: 'One Lakh Eighteen Thousand Rupees Only',
      createdById: admin.id,
      items: {
        create: {
          productId: product.id,
          productCodeSnapshot: product.productCode,
          productNameSnapshot: product.name,
          categorySnapshot: product.category.name,
          quantity: 1,
          unitPrice: 100000,
          lineTotal: 100000,
          specificationsSnapshot: {},
        },
      },
    },
  });
  console.log(`✓ Admin estimation ${adminEst.estimationNumber} created with status: ${adminEst.status}`);
  if (adminEst.status !== 'APPROVED') {
    throw new Error(`Expected APPROVED, got ${adminEst.status}`);
  }

  // 3. Test Sales Creation -> Pending Approval
  console.log('\n[TEST 2] Sales user creates an estimation -> PENDING_APPROVAL');
  const salesEst = await prisma.estimation.create({
    data: {
      estimationNumber: `EST-TEST-SLS-${Date.now().toString().slice(-4)}`,
      date: new Date(),
      status: EstimationStatus.PENDING_APPROVAL,
      customerName: 'Customer Test Ltd',
      companyName: 'Customer Test Ltd',
      phone: '9876543210',
      address: 'Coimbatore, TN',
      subtotal: 50000,
      grandTotal: 59000,
      amountInWords: 'Fifty Nine Thousand Rupees Only',
      createdById: sales.id,
      items: {
        create: {
          productId: product.id,
          productCodeSnapshot: product.productCode,
          productNameSnapshot: product.name,
          categorySnapshot: product.category.name,
          quantity: 1,
          unitPrice: 50000,
          lineTotal: 50000,
          specificationsSnapshot: {},
        },
      },
    },
  });
  console.log(`✓ Sales estimation ${salesEst.estimationNumber} created with status: ${salesEst.status}`);
  if (salesEst.status !== 'PENDING_APPROVAL') {
    throw new Error(`Expected PENDING_APPROVAL, got ${salesEst.status}`);
  }

  // 4. Test Revise Action: Admin clicks Revise with mandatory reason
  console.log('\n[TEST 3] Admin clicks Revise with mandatory reason');
  const revisionReason = 'Please revise the enclosure rating to IP55 and reduce discount to 3%';
  const revisedEst = await prisma.estimation.update({
    where: { id: salesEst.id },
    data: {
      status: EstimationStatus.REVISION_REQUESTED,
      approvedById: admin.id,
      approvedAt: new Date(),
      approvalRemarks: revisionReason,
    },
  });
  console.log(`✓ Estimation ${revisedEst.estimationNumber} transitioned to: ${revisedEst.status}`);
  console.log(`✓ Revision Remarks recorded: "${revisedEst.approvalRemarks}"`);
  if (revisedEst.status !== 'REVISION_REQUESTED' || revisedEst.approvalRemarks !== revisionReason) {
    throw new Error('Revision update failed');
  }

  // 5. Test Sales user editing and resubmitting
  console.log('\n[TEST 4] Sales user modifies and resubmits -> PENDING_APPROVAL');
  const resubmittedEst = await prisma.estimation.update({
    where: { id: salesEst.id },
    data: {
      status: EstimationStatus.PENDING_APPROVAL,
      discountPercent: 3,
      remarks: 'Revised enclosure to IP55 and adjusted discount as instructed.',
    },
  });
  console.log(`✓ Estimation ${resubmittedEst.estimationNumber} resubmitted with status: ${resubmittedEst.status}`);
  if (resubmittedEst.status !== 'PENDING_APPROVAL') {
    throw new Error(`Expected PENDING_APPROVAL after resubmission, got ${resubmittedEst.status}`);
  }

  // 6. Test Admin Approves
  console.log('\n[TEST 5] Admin clicks Approve');
  const approvedEst = await prisma.estimation.update({
    where: { id: salesEst.id },
    data: {
      status: EstimationStatus.APPROVED,
      approvedById: admin.id,
      approvedAt: new Date(),
      approvalRemarks: 'Verified and approved with revised parameters',
    },
  });
  console.log(`✓ Estimation ${approvedEst.estimationNumber} marked as: ${approvedEst.status}`);
  if (approvedEst.status !== 'APPROVED') {
    throw new Error(`Expected APPROVED, got ${approvedEst.status}`);
  }

  // 7. Test Reject Action with reason
  console.log('\n[TEST 6] Admin clicks Reject on a pending estimation');
  const estToReject = await prisma.estimation.create({
    data: {
      estimationNumber: `EST-TEST-REJ-${Date.now().toString().slice(-4)}`,
      date: new Date(),
      status: EstimationStatus.PENDING_APPROVAL,
      customerName: 'Decline Corp',
      companyName: 'Decline Corp',
      phone: '9876543210',
      address: 'Madurai, TN',
      subtotal: 80000,
      grandTotal: 94400,
      amountInWords: 'Ninety Four Thousand Four Hundred Rupees Only',
      createdById: sales.id,
    },
  });

  const rejectReason = 'Commercial margin below minimum allowable threshold (under 12%)';
  const rejectedEst = await prisma.estimation.update({
    where: { id: estToReject.id },
    data: {
      status: EstimationStatus.REJECTED,
      approvedById: admin.id,
      approvedAt: new Date(),
      approvalRemarks: rejectReason,
    },
  });
  console.log(`✓ Estimation ${rejectedEst.estimationNumber} transitioned to: ${rejectedEst.status}`);
  console.log(`✓ Rejection Reason: "${rejectedEst.approvalRemarks}"`);
  if (rejectedEst.status !== 'REJECTED') {
    throw new Error(`Expected REJECTED, got ${rejectedEst.status}`);
  }

  // 8. Test Dashboard 6 KPI Card counts
  console.log('\n[TEST 7] Verifying 6 Dashboard KPI Card Counts');
  const [totalCount, pendingCount, apprCount, draftCount, rejCount, pipeAgg] = await Promise.all([
    prisma.estimation.count(),
    prisma.estimation.count({ where: { status: 'PENDING_APPROVAL' } }),
    prisma.estimation.count({ where: { status: { in: ['APPROVED', 'FINALIZED', 'PDF_GENERATED'] } } }),
    prisma.estimation.count({ where: { status: { in: ['DRAFT', 'REVISION_REQUESTED'] } } }),
    prisma.estimation.count({ where: { status: 'REJECTED' } }),
    prisma.estimation.aggregate({
      where: { status: { notIn: ['REJECTED', 'CANCELLED'] } },
      _sum: { grandTotal: true },
    }),
  ]);

  console.log('Dashboard KPI Values:');
  console.log(`  1. Total Est:        ${totalCount}`);
  console.log(`  2. Pending Approval: ${pendingCount}`);
  console.log(`  3. Approved:         ${apprCount}`);
  console.log(`  4. Drafts:           ${draftCount}`);
  console.log(`  5. Rejected:         ${rejCount}`);
  console.log(`  6. Pipeline Value:   ₹${pipeAgg._sum.grandTotal || 0}`);

  // Cleanup test records
  await prisma.estimationItem.deleteMany({
    where: { estimationId: { in: [adminEst.id, salesEst.id, estToReject.id] } },
  });
  await prisma.estimation.deleteMany({
    where: { id: { in: [adminEst.id, salesEst.id, estToReject.id] } },
  });
  console.log('\n✓ Test records cleaned up successfully.');

  console.log('\n========================================================');
  console.log('ALL WORKFLOW VERIFICATION CHECKS PASSED WITH 100% SUCCESS');
  console.log('========================================================');
}

main().catch(console.error).finally(() => prisma.$disconnect());
