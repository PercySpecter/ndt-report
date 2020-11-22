"use strict";

/**
 * NDT Report Repository
 * -----------------------------------
 * @author Kinjal Ray
 * @version 1.0
 *
 */

/*
 * Required Dependencies start
 */

const dotenv = require('dotenv').config();

const http = require('http');
const app_port = process.env.app_port || 8080;
const app_host = process.env.app_host || '127.0.0.1';

const express = require('express');
const app = express();

const cors = require('cors');
app.use(cors());

const bodyParser = require('body-parser').json();

const formidable = require('formidable');
const fs = require('fs');
const mv = require('mv');

/** 
 * Required Dependencies end
 */

/**
 * Upload PDF of report to repository
 */
app.post('/api/upload-pdf', async (req, res) => {
  const form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    const station = fields.station;
    const unit = fields.unit;
    const year = fields.year;
    const category = fields.category;
    const report_name = fields.report_name;
    const oldpath = files.report.path;
    const dir = 'reports/' + station + '_' + unit + '_' + year + '_' + category;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    const newpath = dir + '/' + report_name + '.pdf';
    mv(oldpath, newpath, function (err) {
      if (err) throw err;
      fs.readdir("reports/", (err, files) => {
        files.forEach(file => {
          console.log(file);
        });
      });
      const resultHtml = `<h1 style="color:green; font-family:sans-serif;">Report Uploaded Successfully</h1>`;
      res.send(resultHtml);
    });
  });
});

const isQueryResult = (currFile, queryFile) => {
  for (let i = 0; i < 4; i++) {
    if (queryFile[i] != "-1" && currFile[i] != queryFile[i]) {
      return false;
    }
  }
  return true;
};

app.post('/api/query-report', bodyParser, (req, res) => {
  const queryFile = [
    req.body.station,
    req.body.unit,
    req.body.year,
    req.body.category
  ];

  let validDirList = [];
  fs.readdir("reports/", (err, dirs) => {
    dirs.forEach(dir => {
      if (dir != "dummy.txt") {
        let currFile = dir.split("_");
        currFile[3] = "" + currFile[3];
        if (isQueryResult(currFile, queryFile)) {
          let validFileList = [];
          let dirPath = "reports/" + dir;
          console.log(dirPath);
          let files = fs.readdirSync(dirPath);
          files.forEach(file => {
            console.log(file);
            validFileList.push(file);
          });
          validDirList.push([dir, validFileList]);
        }
      }
    });
    res.send(validDirList);
  });
});


app.get('/api/view-report/:dirname/:filename', async (req, res) => {
  const dir = req.params.dirname;
  const file = req.params.filename;
  const path = 'reports/' + dir + "/" + file;

  fs.readFile(path, (err, data) => {
    res.contentType("application/pdf");
    res.send(data);
  });
});

app.delete('/api/delete-report/:dirname/:filename', async (req, res) => {
  const dir = req.params.dirname;
  const file = req.params.filename;
  const path = 'reports/' + dir + "/" + file;

  fs.unlink(path, (err) => {
    if (err) {
      console.log(err);
    }

    let files = fs.readdirSync("reports/" + dir);
    if (files.length == 0) {
      fs.rmdir("reports/" + dir, () => {

      });
    }

    res.sendStatus(200);
  });
});



http.createServer(app).listen(app_port);
console.log('Web server running at http://' + app_host + ':' + app_port);
