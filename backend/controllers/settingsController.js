import settingsModel from "../models/settingsModel.js";

// Initialize default settings if not exists
const initializeSettings = async () => {
    let settings = await settingsModel.findOne();
    if (!settings) {
        settings = new settingsModel({ platformCommission: 10 });
        await settings.save();
    }
    return settings;
};

// Get settings
export const getSettings = async (req, res) => {
    try {
        const settings = await initializeSettings();
        res.json({ success: true, settings });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// Update settings
export const updateSettings = async (req, res) => {
    try {
        const { platformCommission } = req.body;
        
        let settings = await initializeSettings();
        
        if (platformCommission !== undefined) {
            settings.platformCommission = platformCommission;
            settings.updatedAt = Date.now();
        }

        await settings.save();
        res.json({ success: true, message: 'Settings updated successfully', settings });

    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};
