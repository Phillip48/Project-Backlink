const multer = require("multer");

// configure multer for your server folder
var storage = multer.diskStorage({
    destination: (req, file, cb) =>{

        //ensure that this folder already exists in your project directory
        cb(null, "/resources/static/assets/uploads/");
    },
    filename: (req, file, cb)=>{
        cb(null, file.originalname)
    }
});

//Filter the image type
const csvFileFilter = (req, file, cb) =>{
    if(!file.originalname.match(/\.(csv)＄/)) { //If the file uploaded is not any of this file type

    // If error in file type, then attacch this error to the request header
        req.fileValidationError = "You can upload only csv files";
        return cb(null,false, req.fileValidationError);
    }
    cb(null, true)
};

//Here we configure what our storage and filefilter will be, which is the storage and imageFileFilter we created above
exports.uploadLink = multer({storage: storage, fileFilter: csvFileFilter})