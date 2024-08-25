const { ObjectId } = require("mongoose").Types;
const { Client } = require("../models");
const asyncHandler = require("express-async-handler");

// Get all clients
const getClients = asyncHandler(async (req, res) => {
  const client = await Client.find({ client: req.client });
  res.status(200).json(client);
});

// Get a single client
const getSingleClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);

  Client.findOne({ _id: req.params.id })
    .select("-__v")
    .then((client) =>
      !client
        ? res.status(404).json({ message: "No client with that ID" })
        : res.json(client)
    )
    .catch((err) => res.status(500).json(err));
  res.status(200).json(client);
});
// create a new client
const createClient = asyncHandler(async (req, res) => {
  console.log(req.body.clientName, req.body.clientWebsite);
//   console.log(req);
  const client = await Client.create({
    clientName: req.body.clientName,
    clientWebsite: req.body.clientWebsite,
    clientLink: [],
  });
  if (res) {
    res.status(200).json(client);
  } else {
    // console.log("Finished creating clients");
  }
});

// update a client
const updateClient = asyncHandler(async (req, res) => {
  const client = await Client.findOneAndUpdate(
    req.body,
    { $addToSet: req.body },
    { runValidators: true, new: true }
  )
    .then((client) =>
      !client
        ? res.status(404).json({ message: "No client with this id!" })
        : res.json("Done updating")
    )
    .catch((err) =>
      !res
        ? console.log("Finished upadating clients")
        : res.status(500).json(err)
    );
  // console.log(client);
  if (res) {
    res.status(200).json("Done updating");
  } else {
    console.log("Finished upadating clients");
  }
});

const updateClientbyURL = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);

  Client.findOneAndUpdate(
    { urlTo: req.client },
    { $set: req.body },
    { runValidators: true, new: true }
  )
    .then((client) =>
      !client
        ? res.status(404).json({ message: "No client with this id!" })
        : res.json(client)
    )
    .catch((err) => res.status(500).json(err));
  res.status(200).json(client);
});

// Delete a client
const deleteClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);

  Client.findOneAndDelete({ _id: req.params.id })
    .then(() => res.json({ message: "Client deleted!" }))
    .catch((err) => res.status(500).json(err));
});

module.exports = {
  getClients,
  getSingleClient,
  updateClient,
  updateClientbyURL,
  deleteClient,
  createClient,
};
