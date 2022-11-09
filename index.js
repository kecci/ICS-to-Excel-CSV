"use strict";

/** {Array<EventRecord>} is used to put EventRecord, finally all calendar event data are in this array */
let eventRecords = [];

/** Print the first N calendar events on the right side of the page */
const MAX_SHOW_RECORD = 10;

const KEY_WORDS = {
  /** Beginning string of fields to read from the ICS file */
  WORDS: [
    "BEGIN:VEVENT",
    "DTSTART",
    "DTEND",
    "DESCRIPTION",
    "SUMMARY",
    "END:VEVENT",
  ],
  /** Corresponding to the above starting string, this is "this field should be cut from the first character to the substring" */
  SUBSTRING: [0, 8, 6, 12, 8, 0],
};

/** The EventRecord object is used to hold a single calendar event */
class EventRecord {
  constructor(start, end, title, more) {
    this.start = start.trim();
    this.end = end.trim();
    /** {string} Since the csv is separated by commas, the commas in the calendar should be replaced by commas. */
    this.title = title.trim().replace(/\\,/g, "，");
    this.more = more.trim().replace(/\\,/g, "，");
  }
}

$(function () {
  $("#input_file").change(function (e) {
    $("#div_download").empty();
    $("#div_result_file_name").empty();
    $("#div_result_table").empty();

    const INPUT_FILE = e.target.files[0];
    if (INPUT_FILE === null) {
      return;
    }
    $("#div_result_file_name").append(
      "file name: " + INPUT_FILE.name + "<hr/>"
    );

    let fileReader = new FileReader();
    fileReader.readAsText(INPUT_FILE);
    fileReader.onload = function () {
      eventRecords = [];
      parse(fileReader.result.split("\n"));
      sortResult();
      printResult();
      createDownloadableContent();
    };
  });
});

/**
 * Parse the read ICS file, compare it with KEY_WORDS to see if it is the field we are interested in, and put it in the temporary field array.
 * @param {Array<string>} input [array of strings read in]
 */
function parse(input) {
  let _keywordIndex = 0;
  let tempArray = [];
  for (const element of input) {
    if (element.match("^" + KEY_WORDS.WORDS[_keywordIndex])) {
      tempArray[_keywordIndex] = element.substring(
        KEY_WORDS.SUBSTRING[_keywordIndex]
      );
      _keywordIndex++;

      if (_keywordIndex === KEY_WORDS.WORDS.length) {
        handleEventRecord(tempArray);
        _keywordIndex = 0;
        tempArray = [];
      }
    }
  }
}

/**
 * After checking the temporary field array again, store it in the final eventRecords array.
 * @param {Array<string>} arr [temporary field array]
 */
function handleEventRecord(arr) {
  /** If a calendar event is an "all-day" event, its time format is different from "what time to what time", and it needs to be cut a little more later */
  if (arr[1].match("^VALUE")) {
    arr[1] = arr[1].substring(11);
  }
  if (arr[2].match("^VALUE")) {
    arr[2] = arr[2].substring(11);
  }
  eventRecords.push(new EventRecord(arr[1], arr[2], arr[4], arr[3]));
}

function sortResult() {
  eventRecords.sort(function (a, b) {
    return a.start.substr(0, 8) - b.start.substr(0, 8);
  });
}

function printResult() {
  let str = "";
  str +=
    '<table id="table_result" class="table table-condensed table-bordered table-stripped"><tr>';
  str += "<th>#</th>";
  str += "<th>start</th>";
  str += "<th>end</th>";
  str += "<th>title</th>";
  str += "<th>detailed</th>";
  str += "</tr></table>";
  $("#div_result_table").append(str);

  const _printLength =
    eventRecords.length > MAX_SHOW_RECORD
      ? MAX_SHOW_RECORD
      : eventRecords.length;
  for (let i = 0; i < _printLength; i++) {
    let str = "";
    str += "<tr>";
    str += "<td>" + i + "</td>";
    str += "<td>" + eventRecords[i].start + "</td>";
    str += "<td>" + eventRecords[i].end + "</td>";
    str += "<td>" + eventRecords[i].title + "</td>";
    str += "<td>" + eventRecords[i].more + "</td>";
    str += "</tr>";
    $("#table_result").append(str);
  }
}

function createDownloadableContent() {
  let content = "#, start, end, title, detail\n";
  for (let i = 0; i < eventRecords.length; i++) {
    content += i + 1 + ",";
    content += eventRecords[i].start + ",";
    content += eventRecords[i].end + ",";
    content += eventRecords[i].title + ",";
    content += eventRecords[i].more + ",";
    content += "\n";
  }

  const fileName = "Google_calendar" + getDateTime() + ".csv";
  const buttonDownload =
    "<a " +
    'id="button_download" ' +
    'class="btn btn-block btn-lg btn-success" ' +
    'href="' +
    getblobUrl(content) +
    '" ' +
    'download="' +
    fileName +
    '" ' +
    ">Download CSV file</a>";
  $("#div_download").append(buttonDownload);
}

/////////////////////
// Helper Functions //
/////////////////////

function getblobUrl(content) {
  const _MIME_TYPE = "text/plain";
  const _UTF8_BOM = "\uFEFF";
  const blob = new Blob([_UTF8_BOM + content], {
    type: _MIME_TYPE,
  });
  return window.URL.createObjectURL(blob);
}

function getDateTime() {
  // If the current time is 2014/11/1, 21:07, 02 will get 2014111_2172
  // and we want 20141101_210702
  const _DATE = new Date();
  const DATE_TIME = String(
    _DATE.getFullYear() +
      fixOneDigit(_DATE.getMonth() + 1) +
      fixOneDigit(_DATE.getDate()) +
      "_" +
      fixOneDigit(_DATE.getHours()) +
      fixOneDigit(_DATE.getMinutes()) +
      fixOneDigit(_DATE.getSeconds())
  );
  return DATE_TIME;
}

function fixOneDigit(x) {
  return x < 10 ? "0" + x : x;
}
