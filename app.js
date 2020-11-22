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


app.post('/api/upload-pdf', async (req, res) => {
  const form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    const station = fields.station;
    const unit = fields.unit;
    const year = fields.year;
    const category = fields.category;
    const oldpath = files.report.path;
    const newpath = 'reports/' + (station + '_' + unit + '_' + year + '_' + category + '.pdf');
    mv(oldpath, newpath, function (err) {
      if (err) throw err;
      fs.readdir("reports/", (err, files) => {
        files.forEach(file => {
          console.log(file);
        });
      });
      const resultHtml = `Report Uploaded Successfully<br>
                          <a href=${fields.callback}>Back</a>`;
      res.send(resultHtml);
    });
  });
});


app.get('/api/query', (req, res) => {
  const formHtml = `<form action="/api/query-report" method="post" enctype="multipart/form-data">
                    <select id="station" name="station">
                      <option value="bbgs">BBGS</option>
                      <option value="sgs">SGS</option>
                    </select>
                    <input type="number" name="unit" placeholder="Unit Number">
                    <input type="number" name="year" placeholder="Year">
                    <select id="category" name="category">
                      <option value="0">Survey</option>
                      <option value="1">Breakdown</option>
                      <option value="2">Preventive Maintenance</option>
                    </select>
                    <input type="submit" value="Query Report">
                    </form>`;

  res.send(formHtml);
});

const isQueryResult = (currFile, queryFile) => {
  for (let i = 0; i < 4; i++) {
    if (queryFile[i] != "-1" && currFile[i] != queryFile[i]) {
      return false;
    }
  }
  return true;
};

app.post('/api/query-report', bodyParser, async (req, res) => {
  const queryFile = [
    req.body.station,
    req.body.unit,
    req.body.year,
    req.body.category
  ];

  let validFileList = [];
  await fs.readdir("reports/", (err, files) => {
    files.forEach(file => {
      if (file != "dummy.txt") {
        let currFile = file.split("_");
        currFile[3] = "" + currFile[3].charAt(0);
        if (isQueryResult(currFile, queryFile)) {
          validFileList.push(file);
        }
      }
    });
    res.send(validFileList);
  });
});


app.get('/api/view-report/:filename', async (req, res) => {
  const form = new formidable.IncomingForm();

  const path = 'reports/' + req.params.filename;

  fs.readFile(path, function (err, data) {
    res.contentType("application/pdf");
    res.send(data);
  });
});



http.createServer(app).listen(app_port);
console.log('Web server running at http://' + app_host + ':' + app_port);

/*

var http = require('http');
var formidable = require('formidable');
var fs = require('fs');
var mv = require('mv');

http.createServer(function (req, res) {
  if (req.url == '/fileupload') {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      var oldpath = files.report.path;
      var newpath = 'reports/' + files.report.name;
      mv(oldpath, newpath, function (err) {
        if (err) throw err;
        fs.readdir("reports/", (err, files) => {
          files.forEach(file => {
            console.log(file);
          });
        });
        res.write('File uploaded and moved!');
        res.end();
      });
 });
  } else {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
    res.write('<input type="file" name="report"><br>');
    res.write('<input type="submit">');
    res.write('</form>');
    return res.end();
  }
}).listen(8080);

*/