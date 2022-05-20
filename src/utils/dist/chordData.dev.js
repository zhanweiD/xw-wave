"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _lodash = require("lodash");

function _toArray(arr) { return _arrayWithHoles(arr) || _iterableToArray(arr) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var chordData = function chordData(data) {
  var nodes = [];
  var links = [];
  var value = [];

  if ((0, _lodash.isArray)(data)) {
    var _data = _toArray(data),
        values = _data.slice(1);

    values.forEach(function (i) {
      if ((0, _lodash.isArray)(i)) {
        value.push(i[2]);
        nodes.push(i[0]);
        links.push(i[1]);
      }
    });
  }

  return [nodes, links, value];
};

var _default = chordData;
exports["default"] = _default;