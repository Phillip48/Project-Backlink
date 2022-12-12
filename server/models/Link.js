const { Schema, model } = require('mongoose');

const date = new Date;

let year = date.getFullYear();
let month = date.getMonth() + 1;
let day = date.getDate();
let format = month + '/' + day + '/' + year;
// Schema to create Link model

const linkSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        indoorOutdoor: {
            type: String,
            min_length: 6,
            max_length: 7,
            required: true,
        },
        boulderingOrSportClimbing: {
            type: String,
            required: true,
        },
        boulderingActualGrade: {
            type: String,
        },
        boulderingFeltGrade: {
            type: String,
        },
        sportClimbingActualGrade: {
            type: String,
        },
        sportClimbingFeltGrade: {
            type: String,
        },
        notes: {
            type: String,
            default: "No notes were made",
            max_length: 800,
        },
        totalAttempts: {
            type: Number,
            required: true,
        },
        totalSessions: {
            type: Number,
            required: true,
        },
        sendProject: {
            type: Boolean,
            required: true,
            default: false,
        },
        createdAt: {
            type: String,
            default: format
        },
        videoOrImg:
        {
            data: Buffer,
            contentType: String
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
