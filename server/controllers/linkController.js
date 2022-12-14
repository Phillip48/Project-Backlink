const { ObjectId } = require("mongoose").Types;
const { Link } = require("../models");
const asyncHandler = require("express-async-handler");

// Get all projects
const getLinks = asyncHandler(async (req, res) => {
  const link = await Link.find({ link: req.link });

  res.status(200).json(link);
});
// Get a single projects
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
// create a new projects
const createLink = asyncHandler(async (req, res) => {
  const link = await Link.create({
    urlFrom: req.urlFrom,
    urlTo: req.urlTo,
    text: req.text,
    linkStatus: req.linkStatus,
    statusText: req.statusText,
    linkFollow: req.linkFollow,
    dateFound: req.dateFound,
    dateLastChecked: req.dateLastChecked,
  });
  if (res){
    res.status(200).send('Created');
  } else {
    console.log('controller log',link)
  }
});
// update a projects
const updateLink = asyncHandler(async (req, res) => {
  const link = await Link.findOneAndUpdate(
    req.body.link,
    { $addToSet: req.body },
    { runValidators: true, new: true }
  )
    .then((link) =>
      !link
        ? res.status(404).json({ message: "No link with this id!" })
        : res.json(link)
    )
    .catch((err) => res.status(500).json(err));
  console.log(link)
  res.status(200).json(link);
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
  createLink,
  updateLink,
  deleteLink,
};
