import { Router } from "express";
import {
    addCommunity,
    getCommunities,
    getCommunityById,
    updateCommunity,
    deleteCommunity
} from "../controllers/community.controller.js";

const router = Router();

// POST /api/communities - Add a new community (Admin/Manager only)
router.post('/', addCommunity);

// GET /api/communities - Get all communities (with optional filters)
router.get('/', getCommunities);

// GET /api/communities/:id - Get community by ID
router.get('/:id', getCommunityById);

// PUT /api/communities/:id - Update community (Admin/Manager only)
router.put('/:id', updateCommunity);

// DELETE /api/communities/:id - Delete community (Admin/Manager only)
router.delete('/:id', deleteCommunity);

export default router;