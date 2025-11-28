// server/server.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5050;

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// MongoDB connection...
const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let blogsCollection;

async function connectDB() {
  try {
    await client.connect();

    await client.db("admin").command({ ping: 1 });
    console.log(" Connected to MongoDB successfully!");

    // Choose database & collection
    const db = client.db("blogsDB");
    blogsCollection = db.collection("blogs");

    console.log(" Using database 'blogsDB' and collection 'blogs'");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    // process.exit(1);
  }
}

// Routes
app.get("/", (req, res) => {
  res.send("Blog API server is running 🚀");
});

/**
 * GET /api/blogs
 * Get all blogs
 */
app.get("/api/blogs", async (req, res) => {
  try {
    const blogs = await blogsCollection.find().sort({ date: -1 }).toArray();
    res.json(blogs);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ message: "Failed to fetch blogs" });
  }
});

/**
 * GET /api/blogs/:id
 * Get a single blog by ID
 */
app.get("/api/blogs/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid blog ID" });
  }

  try {
    const blog = await blogsCollection.findOne({ _id: new ObjectId(id) });

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json(blog);
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).json({ message: "Failed to fetch blog" });
  }
});

/**
 * POST /api/blogs
 * Create a new blog
 */
app.post("/api/blogs", async (req, res) => {
  try {
    const { name, email, user_img, cover_img, title, description } = req.body;

    if (!name || !email || !title || !description) {
      return res
        .status(400)
        .json({ message: "name, email, title, description are required" });
    }

    const blog = {
      name,
      email,
      user_img: user_img || "",
      cover_img: cover_img || "",
      title,
      description,
      date: new Date(),
    };

    const result = await blogsCollection.insertOne(blog);

    res.status(201).json({
      message: "Blog created successfully",
      blog: { _id: result.insertedId, ...blog },
    });
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).json({ message: "Failed to create blog" });
  }
});

/**
 * PUT /api/blogs/:id
 * Update an existing blog}
 */
app.put("/api/blogs/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid blog ID" });
  }

  const { name, email, user_img, cover_img, title, description, date } =
    req.body;

  // Build dynamic update object (only set fields that are provided)
  const updateFields = {};
  if (name !== undefined) updateFields.name = name;
  if (email !== undefined) updateFields.email = email;
  if (user_img !== undefined) updateFields.user_img = user_img;
  if (cover_img !== undefined) updateFields.cover_img = cover_img;
  if (title !== undefined) updateFields.title = title;
  if (description !== undefined) updateFields.description = description;
  if (date !== undefined) updateFields.date = date;

  if (Object.keys(updateFields).length === 0) {
    return res
      .status(400)
      .json({ message: "At least one field must be provided to update" });
  }

  try {
    const result = await blogsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!result.value) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json({
      message: "Blog updated successfully",
      blog: result.value,
    });
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({ message: "Failed to update blog" });
  }
});

/**
 * DELETE /api/blogs/:id
 * Delete a blog by ID
 */
app.delete("/api/blogs/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid blog ID" });
  }

  try {
    const result = await blogsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ message: "Failed to delete blog" });
  }
});

// Start server only after DB is connected
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
});
