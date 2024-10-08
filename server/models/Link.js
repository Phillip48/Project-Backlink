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
        client: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'client',
        },
        urlFrom: {
            type: String,
            // required: true,
        },
        urlTo: {
            type: String,
            required: true,
        },
        text: {
            type: String
        },
        linkStatus: {
            type: String
        },
        statusText: {
            type: String
        },
        linkFollow: {
            type: String
        },
        dateFound: {
            type: String,
            default: format
        },
        dateLastChecked: {
            type: String,
        }
    },
    {
        toJSON: {
            getters: true,
        },
    }
);

const Link = model('link', linkSchema);

module.exports = Link;
