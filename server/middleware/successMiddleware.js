const SuccessHandler = (err, req, res, next) => {
    console.log('Success middleware')
  res.status(200).json({
    message: "Process finished",
  });
};

module.exports = {
  SuccessHandler,
};
