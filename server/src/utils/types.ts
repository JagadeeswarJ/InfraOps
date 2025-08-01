// utils/types.ts

export type UserRole = 'resident' | 'technician' | 'manager';

export interface Community {
    id: string;
    name: string;
    managerId: string; // userId of the manager who registered the community
    location: string; // Physical location of the community
    description?: string;
    createdAt: number;
    updatedAt: number;
}

export interface User {
    id: string; // Firestore UID
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    expertise?: string[]; // For technicians: ['plumbing', 'electrical']
    communityId?: string; // ID of the community the user belongs to
    preferredLanguage?: string;
    createdAt: FirebaseFirestore.Timestamp;
}

export type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';

export interface Ticket {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    reportedBy: string; // userId
    assignedTo?: string; // technician userId
    category: string; // e.g., 'plumbing', 'electrical'
    location: string; // Descriptive location within the community
    priority: 'low' | 'medium' | 'high' | 'auto'; // AI can overwrite "auto"
    status: TicketStatus;
    createdAt: FirebaseFirestore.Timestamp;
    updatedAt: FirebaseFirestore.Timestamp;
    history?: string[]; // past related ticket ids
    aiMetadata?: {
        predictedCategory?: string;
        predictedUrgency?: 'low' | 'high';
        similarPastTickets?: string[];
    };
}
export interface Notification {
    id: string;
    userId: string;
    type: 'ticket_status' | 'assignment' | 'feedback_request';
    ticketId?: string;
    message: string;
    sentAt: FirebaseFirestore.Timestamp;
    read: boolean;
}
export interface Feedback {
    id: string;
    ticketId: string;
    residentId: string;
    technicianId?: string;
    rating: number; // 1–5
    comment?: string;
    createdAt: FirebaseFirestore.Timestamp;
}


