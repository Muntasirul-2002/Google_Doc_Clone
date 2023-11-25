const mongoose = require("mongoose");
const Document = require("./Document");

// mongoose.connect("mongodb://localhost:27017", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   useFindAndModify: false, // Corrected option name
//   useCreateIndex: true, // Corrected option name
// });
mongoose.connect("mongodb://127.0.0.1:27017/googledoc");

const io = require("socket.io")(3001, {
  cors: {
    origin: "http://localhost:3000", // Replace with your frontend domain
    methods: ["GET", "POST"],
    credentials: true,
    withCredentials: true,
  },
});

const defaultValue = "";
io.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", document.data);
    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });
    socket.on("save-document", async (delta) => {
      try {
        console.log("Before saving:", document.data); // Log the data before saving
        document.data = JSON.stringify(delta);
        await document.save();
        console.log("Document saved successfully.");
        console.log("After saving:", document.data); // Log the data after saving
      } catch (error) {
        console.error("Error saving document:", error);
      }
    });
  });
});

async function findOrCreateDocument(id) {
  if (id == null) return null; // Return null for invalid ID
  try {
    const document = await Document.findById(id);
    if (document) {
      return document;
    } else {
      // Create a new document if not found
      const newDocument = await Document.create({
        _id: id,
        data: defaultValue,
      });
      return newDocument;
    }
  } catch (error) {
    console.error("Error finding or creating document:", error);
    return null;
  }
}
