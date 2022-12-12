const { Schema, model } = require('mongoose');

// Date format
const date = new Date;
let year = date.getFullYear();
let month = date.getMonth() + 1;
let day = date.getDate();
let format = month + '/' + day + '/' + year;

// Schema to create Link model
const linkSchema = new Schema(
    {
        url: {
            type: String,
            required: true,
        },
        urlFrom: {
            type: String,
        },
        dateFound: {
            type: String,
            default: format
        },
        text: {
            type: String
        },
        linkStatus: {
            type: Number
        },
        linkFollow: {
            type: Boolean
        },
    },
    {
        toJSON: {
            getters: true,
        },
    }
);

const Link = model('link', linkSchema);

module.exports = Link;
