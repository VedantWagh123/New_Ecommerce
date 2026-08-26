import { v2 as cloudinary } from "cloudinary";
import storyModel from "../models/storyModel.js";

// Add a new story
const addStory = async (req, res) => {
    try {
        const { title, link } = req.body;
        const imageFile = req.file;

        if (!title || !imageFile) {
            return res.json({ success: false, message: "Title and Image are required" });
        }

        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
        const imageUrl = imageUpload.secure_url;

        const storyData = {
            title,
            image: imageUrl,
            link: link || '/collection',
            date: Date.now()
        };

        const story = new storyModel(storyData);
        await story.save();

        res.json({ success: true, message: "Story Added Successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// List all stories
const listStories = async (req, res) => {
    try {
        const stories = await storyModel.find({});
        res.json({ success: true, stories });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Remove story
const removeStory = async (req, res) => {
    try {
        await storyModel.findByIdAndDelete(req.body.id);
        res.json({ success: true, message: "Story Removed Successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { addStory, listStories, removeStory };
