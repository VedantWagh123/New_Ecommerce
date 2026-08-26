import express from "express";
import { addStory, listStories, removeStory } from "../controllers/storyController.js";
import upload from "../middleware/multer.js";
import adminAuth from "../middleware/adminAuth.js";

const storyRouter = express.Router();

storyRouter.post("/add", adminAuth, upload.single("image"), addStory);
storyRouter.get("/list", listStories);
storyRouter.post("/remove", adminAuth, removeStory);

export default storyRouter;
