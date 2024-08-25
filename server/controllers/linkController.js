const { ObjectId } = require("mongoose").Types;
const { Link, Client } = require("../models");
const asyncHandler = require("express-async-handler");

// Get all links
const getLinks = asyncHandler(async (req, res) => {
  const link = await Link.find({ link: req.link });
  res.status(200).json(link);
});

// Get a single link
const getSingleLink = asyncHandler(async (req, res) => {
  const link = await Link.findById(req.params.id);

  Link.findOne({ _id: req.params.id })
    .select("-__v")
    .then((link) =>
      !link
        ? res.status(404).json({ message: "No link with that ID" })
        : res.json(link)
    )
    .catch((err) => res.status(500).json(err));
  res.status(200).json(link);
});

// Get a single link by client
const getLinkByClientName = asyncHandler(async (req, res) => {
  Link.find({ clientName: req.body.clientName })
    .select("-__v")
    .then((link) =>
      !link
        ? res.status(404).json({ message: "No link with that date" })
        : res.json(link)
    )
    .catch((err) => res.status(500).json(err));
});

// create a new link
const createLink = asyncHandler(async (req, res) => {
  // Check for clientName
  // if (!req.clientName) {
  //   res.status(401);
  //   throw new Error("Client not found");
  // }
  console.log("req in link creation", req);
  const clientLinkAdd = await Link.create({
    urlFrom: req.urlFrom,
    urlTo: req.urlTo,
    text: req.text,
    linkStatus: req.linkStatus,
    statusText: req.statusText,
    linkFollow: req.linkFollow,
    dateFound: req.dateFound,
    dateLastChecked: req.dateLastChecked,
    client: req.client,
  });

  // { _id: req.client }
  const client = await Client.findByIdAndUpdate(
    { _id: req.client },
    { $addToSet: { clientLink: clientLinkAdd } },
    { runValidators: true, new: true }
  );
  
  if (res) {
    res.status(200).json("Finished creating links");
  } else {
    // console.log("Finished creating links");
  }
});

// update a link
const updateLink = asyncHandler(async (req, res) => {
  const link = await Link.findOneAndUpdate(
    req.body,
    { $addToSet: req.body },
    { runValidators: true, new: true }
  )
    .then((link) =>
      !link
        ? res.status(404).json({ message: "No link with this id!" })
        : res.json("Done updating")
    )
    .catch((err) =>
      !res ? console.log("Finished upadating links") : res.status(500).json(err)
    );
  // console.log(link);
  if (res) {
    res.status(200).json("Done updating");
  } else {
    console.log("Finished upadating links");
  }
});

const updateLinkbyURL = asyncHandler(async (req, res) => {
  const link = await Link.findById(req.params.id);

  Link.findOneAndUpdate(
    { urlTo: req.link },
    { $set: req.body },
    { runValidators: true, new: true }
  )
    .then((link) =>
      !link
        ? res.status(404).json({ message: "No link with this id!" })
        : res.json(link)
    )
    .catch((err) => res.status(500).json(err));
  res.status(200).json(link);
});

// Delete a projects
const deleteLink = asyncHandler(async (req, res) => {
  const link = await Link.findById(req.params.id);

  Link.findOneAndDelete({ _id: req.params.id })
    .then(() => res.json({ message: "Link deleted!" }))
    .catch((err) => res.status(500).json(err));
});

module.exports = {
  getLinks,
  getSingleLink,
  getLinkByClientName,
  updateLink,
  deleteLink,
  createLink,
};
