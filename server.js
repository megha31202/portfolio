const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.MONGO_URL || 8000;
// Serve static files from the uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define the schema and model
const customizationSchema = new mongoose.Schema({
  productId: Number,
  productType: String,
  selectedColor: String,
  selectedFont: String,
  selectedPicture: String,
  customText: String,
  instructions: String,
  customerName: String,
  customerPhone: String,
  customerEmail: String,
});

const Customization = mongoose.model("Customization", customizationSchema);

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// Routes
app.post(
  "/customizations",
  upload.single("selectedPicture"),
  async (req, res) => {
    const {
      productId,
      productType,
      selectedColor,
      selectedFont,
      customText,
      instructions,
      customerName,
      customerPhone,
      customerEmail,
    } = req.body;
    const selectedPicture = req.file ? req.file.filename : null;

    try {
      const newCustomization = new Customization({
        productId,
        productType,
        selectedColor,
        selectedFont,
        selectedPicture,
        customText,
        instructions,
        customerName,
        customerPhone,
        customerEmail,
      });

      const savedCustomization = await newCustomization.save();
      res.status(200).json(savedCustomization);
    } catch (err) {
      console.error("Error saving customization:", err);
      res.status(500).send(err);
    }
  }
);

app.get("/customizations", async (req, res) => {
  try {
    const customizations = await Customization.find();
    const customizationsWithImageUrls = customizations.map((customization) => ({
      ...customization._doc,
      selectedPictureUrl: customization.selectedPicture
        ? `http://localhost:8000/uploads/${customization.selectedPicture}`
        : null,
    }));
    res.status(200).json(customizationsWithImageUrls);
  } catch (err) {
    console.error("Error fetching customizations:", err);
    res.status(500).send(err);
  }
});

app.get("/customizations/:id", (req, res) => {
  const { id } = req.params;
  Customization.findById(id, (err, customization) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.status(200).json(customization);
  });
});

app.listen(8000, () => {
  console.log("Server is running on port 8000");
});
