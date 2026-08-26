import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
    title: { type: String, required: true },
    image: { type: String, required: true },
    link: { type: String, default: '/collection' },
    isActive: { type: Boolean, default: true },
    date: { type: Number, required: true }
});

const storyModel = mongoose.models.story || mongoose.model("story", storySchema);
export default storyModel;
