import { Request, Response } from "express";
import { db } from "../config/db.config.js";
import { Community } from "../utils/types.js";
import { FieldValue } from "firebase-admin/firestore";

const addCommunity = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            name,
            managerId,
            location,
            description,
            address,
            contactEmail,
            contactPhone
        } = req.body;

        // Validate required fields
        if (!name || !managerId || !location) {
            return res.status(400).json({
                error: "Missing required fields: name, managerId, location"
            });
        }

        // Validate manager exists and has manager role
        const managerDoc = await db.collection('users').doc(managerId).get();
        if (!managerDoc.exists) {
            return res.status(404).json({
                error: "Manager not found"
            });
        }

        const managerData = managerDoc.data();
        if (managerData?.role !== 'manager') {
            return res.status(403).json({
                error: "User must have manager role to create a community"
            });
        }

        // Check if community with same name already exists
        const existingCommunity = await db.collection('communities')
            .where('name', '==', name)
            .get();

        if (!existingCommunity.empty) {
            return res.status(409).json({
                error: "Community with this name already exists"
            });
        }

        // Create community data
        const communityData: Community = {
            name,
            managerId,
            location,
            description: description || undefined,
            address: address || undefined,
            contactEmail: contactEmail || undefined,
            contactPhone: contactPhone || undefined,
            isActive: true,
            createdAt: FieldValue.serverTimestamp() as any,
            updatedAt: FieldValue.serverTimestamp() as any
        };

        // Save community to Firestore
        const communityRef = await db.collection('communities').add(communityData);

        return res.status(201).json({
            success: true,
            message: "Community created successfully",
            communityId: communityRef.id,
            community: {
                id: communityRef.id,
                ...communityData
            }
        });

    } catch (error) {
        console.error("Add community error:", error);
        return res.status(500).json({
            error: "Internal server error while creating community"
        });
    }
};

const getCommunities = async (req: Request, res: Response): Promise<any> => {
    try {
        const { isActive, managerId } = req.query;

        let query: any = db.collection('communities');

        // Filter by manager first if provided (most selective filter)
        if (managerId) {
            query = query.where('managerId', '==', managerId);
        }

        // Filter by active status if provided
        if (isActive !== undefined) {
            query = query.where('isActive', '==', isActive === 'true');
        }

        const communitySnapshot = await query.get();

        // Sort in memory to avoid index requirement
        const communities = communitySnapshot.docs
            .map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            }))
            .sort((a: any, b: any) => {
                // Sort by createdAt descending (newest first)
                const aTime = a.createdAt?.seconds || 0;
                const bTime = b.createdAt?.seconds || 0;
                return bTime - aTime;
            });

        return res.status(200).json({
            success: true,
            communities,
            total: communities.length
        });

    } catch (error) {
        console.error("Get communities error:", error);
        return res.status(500).json({
            error: "Internal server error while fetching communities"
        });
    }
};

const getCommunityById = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                error: "Community ID is required"
            });
        }

        const communityDoc = await db.collection('communities').doc(id).get();

        if (!communityDoc.exists) {
            return res.status(404).json({
                error: "Community not found"
            });
        }

        const communityData = communityDoc.data();

        return res.status(200).json({
            success: true,
            community: {
                id: communityDoc.id,
                ...communityData
            }
        });

    } catch (error) {
        console.error("Get community by ID error:", error);
        return res.status(500).json({
            error: "Internal server error while fetching community"
        });
    }
};

const updateCommunity = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const {
            name,
            location,
            description,
            address,
            contactEmail,
            contactPhone,
            isActive
        } = req.body;

        if (!id) {
            return res.status(400).json({
                error: "Community ID is required"
            });
        }

        // Check if community exists
        const communityDoc = await db.collection('communities').doc(id).get();
        if (!communityDoc.exists) {
            return res.status(404).json({
                error: "Community not found"
            });
        }

        // Prepare update data (only include provided fields)
        const updateData: Partial<Community> = {
            updatedAt: FieldValue.serverTimestamp() as any
        };

        if (name !== undefined) updateData.name = name;
        if (location !== undefined) updateData.location = location;
        if (description !== undefined) updateData.description = description;
        if (address !== undefined) updateData.address = address;
        if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
        if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
        if (isActive !== undefined) updateData.isActive = isActive;

        // If name is being changed, check for duplicates
        if (name && name !== communityDoc.data()?.name) {
            const existingCommunity = await db.collection('communities')
                .where('name', '==', name)
                .get();

            if (!existingCommunity.empty && existingCommunity.docs[0].id !== id) {
                return res.status(409).json({
                    error: "Community with this name already exists"
                });
            }
        }

        // Update community
        await db.collection('communities').doc(id).update(updateData);

        // Get updated community data
        const updatedCommunityDoc = await db.collection('communities').doc(id).get();

        return res.status(200).json({
            success: true,
            message: "Community updated successfully",
            community: {
                id: updatedCommunityDoc.id,
                ...updatedCommunityDoc.data()
            }
        });

    } catch (error) {
        console.error("Update community error:", error);
        return res.status(500).json({
            error: "Internal server error while updating community"
        });
    }
};

const deleteCommunity = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                error: "Community ID is required"
            });
        }

        // Check if community exists
        const communityDoc = await db.collection('communities').doc(id).get();
        if (!communityDoc.exists) {
            return res.status(404).json({
                error: "Community not found"
            });
        }

        // Check if there are users associated with this community
        const usersInCommunity = await db.collection('users')
            .where('communityId', '==', id)
            .get();

        if (!usersInCommunity.empty) {
            return res.status(400).json({
                error: "Cannot delete community with associated users. Please reassign users first."
            });
        }

        // Delete community
        await db.collection('communities').doc(id).delete();

        return res.status(200).json({
            success: true,
            message: "Community deleted successfully"
        });

    } catch (error) {
        console.error("Delete community error:", error);
        return res.status(500).json({
            error: "Internal server error while deleting community"
        });
    }
};

export {
    addCommunity,
    getCommunities,
    getCommunityById,
    updateCommunity,
    deleteCommunity
};