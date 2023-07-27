import express from "express";
import { verifyUser } from "../utils/verifyToken";
import { createArtists, deleteArtists, getAllArtists, getArtists, updateArtists } from "../controllers/artists";

const router = express.Router();

//CREATE 
router.post("/create",verifyUser, createArtists)
//UPDATE
router.put("/:id/update",verifyUser,  updateArtists)
//DELETE
router.delete("/delete/:id",verifyUser, deleteArtists)
//GET
router.get("/:id", getArtists)
//GET ALL
router.get("/", getAllArtists)

export default router