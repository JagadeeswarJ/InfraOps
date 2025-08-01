# Firebase Index Revert Instructions

After the composite index is created in Firebase Console, revert this code:

## File: `/server/src/controllers/ticket.controller.ts` (around line 383)

**Replace this temporary code:**
```javascript
// Get recent tickets from same reporter for spam detection
// Note: Using single filter to avoid composite index requirement temporarily
const recentReporterTicketsQuery = await db.collection('tickets')
    .where('reportedBy', '==', ticketData.reportedBy)
    .get();

// Filter by date in memory to avoid composite index requirement
const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
const recentReporterTickets = {
    docs: recentReporterTicketsQuery.docs.filter(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date(0));
        return createdAt >= twentyFourHoursAgo;
    }),
    size: 0 // Will be calculated after filtering
};
recentReporterTickets.size = recentReporterTickets.docs.length;
```

**With this optimal code:**
```javascript
// Get recent tickets from same reporter for spam detection
const recentReporterTickets = await db.collection('tickets')
    .where('reportedBy', '==', ticketData.reportedBy)
    .where('createdAt', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
    .get();
```

## Index Status Check
You can check if the index is ready in Firebase Console > Firestore > Indexes tab.
Status should show "Enabled" (not "Building").