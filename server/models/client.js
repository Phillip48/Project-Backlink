const { Schema, model } = require("mongoose");

// Schema to create Link model
const clientSchema = new Schema(
  {
    clientName: {
      type: String,
      required: true,
    },
    clientWebsite: {
      type: String,
      required: true,
    },
    clientLink: [
      {
        type: Schema.Types.ObjectId,
        ref: "link",
      },
    ],
  },
  {
    toJSON: {
      getters: true,
    },
  }
);

const Client = model("client", clientSchema);

module.exports = Client;
