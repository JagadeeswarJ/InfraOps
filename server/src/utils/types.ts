// utils/types.ts

export type UserRole = 'resident' | 'technician' | 'manager';

export interface Community {
    name: string;
    managerId: string; // userId of the manager who registered the community
    location: string; // Physical location of the community
    latitude?: number; // Latitude from Google Places API
    longitude?: number; // Longitude from Google Places API
    placeId?: string; // Google Places ID
    description?: string;
    address?: string; // Full address
    contactEmail?: string;
    contactPhone?: string;
    isActive: boolean;
    createdAt: FirebaseFirestore.Timestamp;
    updatedAt: FirebaseFirestore.Timestamp;
}

export interface User {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: UserRole;
    expertise?: string[]; // For technicians: ['plumbing', 'electrical']
    communityId?: string; // ID of the community the user belongs to
    createdAt: FirebaseFirestore.Timestamp;
}

export type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';

export interface Ticket {
    title: string;
    description: string;
    imageUrl?: string[]; // Array of image URLs
    reportedBy: string; // userId
    assignedTo?: string; // technician userId
    category: string; // e.g., 'plumbing', 'electrical'
    location: string; // Descriptive location within the community
    priority: 'low' | 'medium' | 'high' | 'auto'; // AI can overwrite "auto"
    status: TicketStatus;
    communityId: string; // Community where ticket belongs
    createdAt: FirebaseFirestore.Timestamp;
    updatedAt: FirebaseFirestore.Timestamp;
    history?: string[]; // past related ticket ids
    aiMetadata?: {
        predictedCategory?: string;
        predictedUrgency?: 'low' | 'high';
        similarPastTickets?: string[];
        processedAt?: FirebaseFirestore.Timestamp;
        confidence?: number; // AI confidence score 0-1
        recommendedTechnician?: {
            id: string;
            name: string;
            skillMatch: number;
            locationMatch: number;
            reasoning: string;
        };
        alternativeTechnicians?: Array<{
            id: string;
            skillMatch: number;
            locationMatch: number;
        }>;
    };
    requiredTools?: Array<{
        name: string;
        category: string;
        estimated_cost?: string;
        required: boolean;
        alternatives?: string[];
    }>;
    requiredMaterials?: Array<{
        name: string;
        quantity: string;
        unit: string;
        estimated_cost?: string;
        required: boolean;
        alternatives?: string[];
    }>;
    spamMetadata?: {
        confidence: number;
        reason: string;
        detectedAt: FirebaseFirestore.Timestamp;
        markedBy?: string;
        unmarkedAt?: FirebaseFirestore.Timestamp;
        unmarkedBy?: string;
    };
}
export interface Notification {
    userId: string;
    type: 'ticket_status' | 'assignment' | 'feedback_request' | 'overdue_alert' | 'new_assignment';
    ticketId?: string;
    message: string;
    sentAt: FirebaseFirestore.Timestamp;
    read: boolean;
}
export interface Feedback {
    ticketId: string;
    residentId: string;
    technicianId?: string;
    rating: number; // 1–5
    comment?: string;
    createdAt: FirebaseFirestore.Timestamp;
}

export interface OTP {
    email: string;
    otp: string;
    userData: Omit<User, 'createdAt'>; // Store user data temporarily
    expiresAt: FirebaseFirestore.Timestamp;
    createdAt: FirebaseFirestore.Timestamp;
}


